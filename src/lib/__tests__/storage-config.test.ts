import { afterEach, describe, expect, it, vi } from "vitest";
import { storeKind } from "../store";

afterEach(() => vi.unstubAllEnvs());
function configure(url = "", key = "") {
  vi.stubEnv("SUPABASE_URL", url); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", key);
  vi.stubEnv("VERCEL", ""); vi.stubEnv("REQUIRE_DATABASE", "false");
}
describe("durable contact storage configuration", () => {
  it("allows local development without a database", () => {
    configure(); expect(storeKind()).toBe("file");
  });
  it("selects the database when both credentials are configured", () => {
    configure("https://example.supabase.co", "test-placeholder");
    expect(storeKind()).toBe("supabase");
  });
  it("does not silently fall back when a credential is missing", () => {
    configure("https://example.supabase.co"); expect(() => storeKind()).toThrow("both");
    configure("", "test-placeholder"); expect(() => storeKind()).toThrow("both");
  });
  it("rejects temporary storage on Vercel and when explicitly requiring a database", () => {
    configure(); vi.stubEnv("VERCEL", "1"); expect(() => storeKind()).toThrow("Persistent database required");
    configure(); vi.stubEnv("REQUIRE_DATABASE", "true"); expect(() => storeKind()).toThrow("Persistent database required");
  });
});
