import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileStore } from "../store/file-store";
import { DuplicateContactError, SignInRateLimitError, emailKey, phoneKey } from "../contacts";
import type { Participant } from "../types";

const mocks = vi.hoisted(() => ({ current: vi.fn(), cookie: vi.fn(), getStore: vi.fn() }));
vi.mock("@/lib/server/auth", () => ({ currentParticipant: mocks.current, setParticipantCookie: mocks.cookie, newToken: () => "new-secret", hashToken: (token: string) => `hashed:${token}` }));
vi.mock("@/lib/store", () => ({ getStore: mocks.getStore }));
import { POST as signIn } from "@/app/api/sign-in/route";
import { POST as join } from "@/app/api/participants/route";
import { PATCH as edit } from "@/app/api/me/route";

const profile = { firstName: "Test", lastName: "Guest", phone: "+1 (412) 555-0123", email: "guest@example.com", tokenHash: "old-token", contactVisibility: "organizers" as const };
const request = (body: unknown) => new Request("http://localhost/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
let directory: string;
let store: FileStore;
let person: Participant;
beforeEach(async () => {
  vi.resetAllMocks();
  directory = await mkdtemp(path.join(tmpdir(), "party-signin-"));
  store = new FileStore(path.join(directory, "data.json"));
  person = await store.createParticipant(profile);
  mocks.getStore.mockResolvedValue(store);
  mocks.current.mockResolvedValue(null);
});
afterEach(async () => { vi.restoreAllMocks(); await rm(directory, { recursive: true, force: true }); });

describe("contact identity", () => {
  it("normalizes formatting, case, and optional North American country code", () => {
    expect(phoneKey(profile.phone)).toBe(phoneKey("412-555-0123"));
    expect(phoneKey("+44 20 7946 0958")).toBe("442079460958");
    expect(emailKey(" GUEST@Example.com ")).toBe(profile.email);
  });

  it.each([
    { phone: "4125550123", email: "different@example.com" },
    { phone: "+14125550124", email: " GUEST@EXAMPLE.COM " },
  ])("blocks either duplicate contact on creation and profile edits: %j", async (contacts) => {
    await expect(store.createParticipant({ ...profile, ...contacts })).rejects.toBeInstanceOf(DuplicateContactError);
    const second = await store.createParticipant({ ...profile, phone: "+14125550125", email: "second@example.com", tokenHash: "second" });
    await expect(store.updateProfile(second.id, contacts)).rejects.toBeInstanceOf(DuplicateContactError);
    expect(await store.getParticipant(second.id)).toEqual(second);
    expect(await store.updateProfile(person.id, { phone: profile.phone, email: profile.email, firstName: "Updated" })).toMatchObject({ firstName: "Updated" });
  });

  it("prevents simultaneous duplicate creates", async () => {
    const next = { ...profile, phone: "+14125550129", email: "new@example.com", tokenHash: "next" };
    const results = await Promise.allSettled([store.createParticipant(next), store.createParticipant(next)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await store.countParticipants()).toBe(2);
  });
});

describe("returning attendee sign-in", () => {
  it("restores saved results, rotates the token, and never returns credentials", async () => {
    await store.saveAnswers(person.id, { fry: { normalized: 50, display: "A fry" } }, "ghost");
    const response = await signIn(request({ phone: "412-555-0123", email: " GUEST@EXAMPLE.COM " }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectTo: "/me" });
    expect(mocks.cookie).toHaveBeenCalledWith("new-secret");
    expect(await store.getParticipantByTokenHash("old-token")).toBeNull();
    const reloaded = new FileStore(path.join(directory, "data.json"));
    expect(await reloaded.getParticipantByTokenHash("hashed:new-secret")).toMatchObject({ id: person.id, avatarType: "ghost", answers: { fry: { normalized: 50 } } });
    expect(await store.countParticipants()).toBe(1);
  });

  it("resumes unfinished quizzes", async () => {
    expect(await (await signIn(request(profile))).json()).toEqual({ redirectTo: "/quiz" });
  });

  it("requires both contacts to belong to the same real attendee", async () => {
    await store.createParticipant({ ...profile, phone: "+14125550124", email: "other@example.com", tokenHash: "other" });
    for (const body of [{ phone: profile.phone, email: "other@example.com" }, { phone: "+14125550124", email: profile.email }]) {
      expect((await signIn(request(body))).status).toBe(401);
    }
    expect(mocks.cookie).not.toHaveBeenCalled();
    expect(await store.getParticipantByTokenHash("old-token")).not.toBeNull();
  });

  it("does not recover public seed profiles", async () => {
    const seed = await store.createParticipant({ ...profile, phone: "+14125550124", email: "seed@example.com", tokenHash: "seed", isSeed: true });
    expect((await signIn(request(seed))).status).toBe(401);
    expect(mocks.cookie).not.toHaveBeenCalled();
  });

  it("persists rate limits across reloads and permits retry after expiry", async () => {
    for (let i = 0; i < 10; i++) await store.recoverParticipant("0000000000", profile.email, "unused");
    const reloaded = new FileStore(path.join(directory, "data.json"));
    await expect(reloaded.recoverParticipant(profile.phone, profile.email, "new")).rejects.toBeInstanceOf(SignInRateLimitError);
    mocks.getStore.mockResolvedValue(reloaded);
    expect((await signIn(request(profile))).status).toBe(429);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 16 * 60 * 1000);
    expect(await reloaded.recoverParticipant(profile.phone, profile.email, "new")).toMatchObject({ id: person.id });
  });

  it.each([null, {}, { email: "bad", phone: profile.phone }, { email: profile.email, phone: "12" }])("rejects invalid input %j", async (body) => {
    expect((await signIn(request(body))).status).toBe(400);
    expect(mocks.cookie).not.toHaveBeenCalled();
  });

  it("reports unavailable storage without leaking errors", async () => {
    mocks.getStore.mockRejectedValue(new Error("private database details"));
    const response = await signIn(request(profile));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database");
  });
});

describe("duplicate API responses", () => {
  it("returns a useful conflict without creating another account or setting a cookie", async () => {
    const response = await join(request({ ...profile, consent: true }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("Sign in");
    expect(mocks.cookie).not.toHaveBeenCalled();
    expect(await store.countParticipants()).toBe(1);
  });

  it("blocks changing an existing attendee to somebody else's email", async () => {
    await store.createParticipant({ ...profile, email: "other@example.com", phone: "+14125550124", tokenHash: "other" });
    mocks.current.mockResolvedValue(person);
    expect((await edit(request({ email: "other@example.com" }))).status).toBe(409);
    expect((await store.getParticipant(person.id))?.email).toBe(profile.email);
  });
});
