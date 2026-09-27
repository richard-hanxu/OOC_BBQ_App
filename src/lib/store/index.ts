import path from "node:path";
import { seedInputs } from "../seed";
import { FileStore } from "./file-store";
import { SupabaseStore } from "./supabase-store";
import type { Store } from "./types";

declare global {
  var __partyStore: Promise<Store> | undefined;
}

export type StoreKind = "supabase" | "file";

export function storeKind(): StoreKind {
  const url = Boolean(process.env.SUPABASE_URL);
  const key = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (url !== key) throw new Error("Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Refusing to fall back to local storage with incomplete database configuration.");
  if (url && key) return "supabase";
  if (process.env.VERCEL || process.env.REQUIRE_DATABASE === "true") {
    throw new Error("Persistent database required: configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before collecting attendee details.");
  }
  return "file";
}

function seedEnabled() {
  const flag = process.env.SEED_DATA;
  if (flag === undefined) return process.env.NODE_ENV !== "production";
  return flag !== "false" && flag !== "0";
}

async function build(): Promise<Store> {
  if (storeKind() === "supabase") {
    return new SupabaseStore(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  const defaultPath = path.join(process.cwd(), ".data", "party.json");
  const file = process.env.DATA_FILE || defaultPath;
  const store = new FileStore(file);
  if (seedEnabled() && (await store.countParticipants()) === 0) {
    await loadSeed(store);
  }
  return store;
}

export async function loadSeed(store: Store): Promise<number> {
  const existing = await store.listParticipants();
  const have = new Set(existing.map((p) => p.tokenHash));
  let n = 0;
  for (const input of seedInputs()) {
    if (have.has(input.tokenHash)) continue;
    await store.createParticipant(input);
    n++;
  }
  return n;
}

/** Process-wide singleton (survives HMR in dev via globalThis). */
export function getStore(): Promise<Store> {
  if (!globalThis.__partyStore) globalThis.__partyStore = build();
  return globalThis.__partyStore;
}
