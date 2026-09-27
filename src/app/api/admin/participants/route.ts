import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore, loadSeed, storeKind } from "@/lib/store";
import { toPublic } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await getStore();
  const participants = (await store.listParticipants()).map((p) => toPublic(p, { organizer: true }));
  return NextResponse.json({ participants, storeKind: storeKind() }, { headers: { "Cache-Control": "no-store" } });
}

/** Seed management: { action: "load" | "remove" }. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const store = await getStore();
  if (body.action === "load") {
    const added = await loadSeed(store);
    return NextResponse.json({ ok: true, added });
  }
  if (body.action === "remove") {
    const removed = await store.deleteSeedParticipants();
    return NextResponse.json({ ok: true, removed });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
