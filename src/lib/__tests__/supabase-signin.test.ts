import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateContactError, SignInRateLimitError } from "../contacts";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks }));
import { SupabaseStore } from "../store/supabase-store";

beforeEach(() => vi.resetAllMocks());
describe("Supabase sign-in and uniqueness", () => {
  it("uses the server-only recovery RPC and returns the matching participant", async () => {
    const store = new SupabaseStore("https://example.invalid", "test-only");
    mocks.rpc.mockResolvedValue({ data: "id", error: null });
    const read = vi.spyOn(store, "getParticipant").mockResolvedValue(null);
    await store.recoverParticipant("+14125550123", "guest@example.com", "new-hash");
    expect(mocks.rpc).toHaveBeenCalledWith("recover_party_participant", { p_phone: "+14125550123", p_email: "guest@example.com", p_token_hash: "new-hash" });
    expect(read).toHaveBeenCalledWith("id");
  });
  it("handles no match and database rate limits without fetching a participant", async () => {
    const store = new SupabaseStore("https://example.invalid", "test-only");
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: { message: "signin_rate_limited" } });
    expect(await store.recoverParticipant("phone", "email", "hash")).toBeNull();
    await expect(store.recoverParticipant("phone", "email", "hash")).rejects.toBeInstanceOf(SignInRateLimitError);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("maps database-enforced duplicate registrations to a contact conflict", async () => {
    const store = new SupabaseStore("https://example.invalid", "test-only");
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "23505" } });
    mocks.from.mockReturnValue({ insert: () => ({ select: () => ({ single }) }) });
    await expect(store.createParticipant({ firstName: "A", lastName: "B", phone: "1234567890", email: "guest@example.com", tokenHash: "hash" })).rejects.toBeInstanceOf(DuplicateContactError);
  });
  it("maps duplicate profile edits to a contact conflict", async () => {
    const store = new SupabaseStore("https://example.invalid", "test-only");
    mocks.from.mockReturnValue({ update: () => ({ eq: async () => ({ error: { code: "23505" } }) }) });
    await expect(store.updateProfile("id", { email: "taken@example.com" })).rejects.toBeInstanceOf(DuplicateContactError);
  });
});
