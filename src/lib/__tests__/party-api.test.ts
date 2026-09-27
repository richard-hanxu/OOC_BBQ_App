import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedInputs } from "../seed";
import type { Participant } from "../types";
import { QUESTIONS } from "../questions";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), participant: vi.fn(), store: { listParticipants: vi.fn(), listAnnouncements: vi.fn(), createAnnouncement: vi.fn(), closeAnnouncement: vi.fn(), deleteAnnouncement: vi.fn(), vote: vi.fn(), saveAnswers: vi.fn() } }));
vi.mock("@/lib/server/auth", () => ({ isAdmin: mocks.admin, currentParticipant: mocks.participant }));
vi.mock("@/lib/store", () => ({ getStore: async () => mocks.store }));
import { GET as party } from "@/app/api/party/route";
import { GET as announcements } from "@/app/api/announcements/route";
import { POST as post, GET as adminList } from "@/app/api/admin/announcements/route";
import { PATCH as close, DELETE as deleteAnnouncement } from "@/app/api/admin/announcements/[id]/route";
import { POST as vote } from "@/app/api/announcements/[id]/vote/route";
import { POST as submitQuiz } from "@/app/api/me/answers/route";
import { GET as exportContacts } from "@/app/api/admin/export/route";

const id = "00000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ id }) };
const request = (data: unknown) => new Request("http://localhost/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
const input = seedInputs()[0];
const guest: Participant = { ...input, id, createdAt: "2026-09-27", avatarType: null, quizCompletedAt: null, isSeed: false, undergraduateUniversity: null, graduateUniversity: null, cmuProgram: null, answers: {}, contactVisibility: "organizers" };
beforeEach(() => { vi.resetAllMocks(); mocks.admin.mockResolvedValue(false); mocks.participant.mockResolvedValue(null); });

describe("authenticated party endpoints", () => {
  it("blocks announcement deletion for anonymous users and attendees", async () => {
    for (const viewer of [null, guest]) {
      mocks.participant.mockResolvedValue(viewer);
      expect((await deleteAnnouncement(new Request("http://localhost/api/test", { method: "DELETE" }), context)).status).toBe(401);
    }
    expect(mocks.store.deleteAnnouncement).not.toHaveBeenCalled();
  });

  it("lets organizers delete announcements and reports missing records", async () => {
    mocks.admin.mockResolvedValue(true);
    mocks.store.deleteAnnouncement.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const req = new Request("http://localhost/api/test", { method: "DELETE" });
    const response = await deleteAnnouncement(req, context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.store.deleteAnnouncement).toHaveBeenCalledWith(id);
    expect((await deleteAnnouncement(req, context)).status).toBe(404);
  });

  it("rejects malformed announcement deletion IDs without touching storage", async () => {
    mocks.admin.mockResolvedValue(true);
    const response = await deleteAnnouncement(new Request("http://localhost/api/test", { method: "DELETE" }), { params: Promise.resolve({ id: "invalid" }) });
    expect(response.status).toBe(400);
    expect(mocks.store.deleteAnnouncement).not.toHaveBeenCalled();
  });

  it("stores different grocery guesses without changing the assigned personality or observations", async () => {
    mocks.participant.mockResolvedValue(guest);
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.type === "binary" ? 0 : 50]));
    const responses = [];
    for (const groceryGuess of [0, 350.75, 100000]) {
      const res = await submitQuiz(request({ answers, groceryGuess }));
      expect(res.status).toBe(200);
      responses.push(await res.json());
      expect(mocks.store.saveAnswers.mock.lastCall?.[1].grocery_cost_guess.display).toBe(`$${groceryGuess.toFixed(2)}`);
    }
    expect(responses.map((r) => r.avatar)).toEqual([responses[0].avatar, responses[0].avatar, responses[0].avatar]);
    expect(responses[1].observations).toEqual(responses[0].observations);
    expect(responses[2].observations).toEqual(responses[0].observations);
  });

  it("rejects invalid or missing grocery guesses before saving", async () => {
    mocks.participant.mockResolvedValue(guest);
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.type === "binary" ? 0 : 50]));
    for (const groceryGuess of [undefined, null, "200", -1, 100001, 1.234]) {
      expect((await submitQuiz(request({ answers, groceryGuess }))).status).toBe(400);
    }
    expect(mocks.store.saveAnswers).not.toHaveBeenCalled();
  });
  it("only exports contacts for authenticated organizers, including private and unfinished profiles", async () => {
    expect((await exportContacts()).status).toBe(401);
    expect(mocks.store.listParticipants).not.toHaveBeenCalled();
    mocks.admin.mockResolvedValue(true);
    mocks.store.listParticipants.mockResolvedValue([{ ...guest, broughtItems: "Paper plates" }]);
    const response = await exportContacts();
    const csv = await response.text();
    expect(response.status).toBe(200);
    expect(csv).toContain(guest.email); expect(csv).toContain(guest.phone);
    expect(csv).toContain("contact_visibility"); expect(csv).toContain("organizers");
    expect(csv).toContain("brought_items"); expect(csv).toContain("Paper plates");
    expect(csv).not.toContain(guest.tokenHash);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("requires a joined guest for announcements, votes, and the directory", async () => {
    expect((await announcements()).status).toBe(401);
    expect((await vote(request({ optionId: "a" }), context)).status).toBe(401);
    expect((await party()).status).toBe(401);
    expect(mocks.store.vote).not.toHaveBeenCalled();
  });
  it("only organizers can post, view admin announcements, or close polls", async () => {
    mocks.participant.mockResolvedValue(guest);
    expect((await post(request({ title: "Hi", body: "All" }))).status).toBe(401);
    expect((await adminList()).status).toBe(401);
    expect((await close(request({}), context)).status).toBe(401);
    expect(mocks.store.createAnnouncement).not.toHaveBeenCalled();
    expect(mocks.store.closeAnnouncement).not.toHaveBeenCalled();
  });
  it("redacts organizer-only contacts in the actual party API payload", async () => {
    mocks.participant.mockResolvedValue(guest);
    mocks.store.listParticipants.mockResolvedValue([guest, { ...guest, id: "other", email: "hidden@example.com", phone: "hidden-phone" }]);
    const response = await party(); const json = await response.json();
    expect(json.me.email).toBe(guest.email);
    expect(json.participants[0].phone).toBe(guest.phone);
    expect(json.participants[1].email).toBeNull(); expect(json.participants[1].phone).toBeNull();
    expect(JSON.stringify(json)).not.toContain("tokenHash");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("gets voter identity from the session, never the request body", async () => {
    mocks.participant.mockResolvedValue(guest); mocks.store.vote.mockResolvedValue("ok");
    expect((await vote(request({ optionId: "option-a", participantId: "forged" }), context)).status).toBe(200);
    expect(mocks.store.vote).toHaveBeenCalledWith(id, guest.id, "option-a");
  });
  it.each([["closed", 409], ["not-found", 404], ["invalid-option", 400]])("returns %s errors without counting a vote", async (result, status) => {
    mocks.participant.mockResolvedValue(guest); mocks.store.vote.mockResolvedValue(result);
    expect((await vote(request({ optionId: "a" }), context)).status).toBe(status);
  });
  it("rejects malformed IDs and a fifth option before touching storage", async () => {
    mocks.participant.mockResolvedValue(guest);
    expect((await vote(request({ optionId: "a" }), { params: Promise.resolve({ id: "-".repeat(36) }) })).status).toBe(400);
    mocks.admin.mockResolvedValue(true);
    expect((await post(request({ title: "Vote", body: "Pick", options: ["1", "2", "3", "4", "5"] }))).status).toBe(400);
    expect(mocks.store.vote).not.toHaveBeenCalled(); expect(mocks.store.createAnnouncement).not.toHaveBeenCalled();
  });
  it("lets organizers post a validated announcement", async () => {
    mocks.admin.mockResolvedValue(true);
    mocks.store.createAnnouncement.mockResolvedValue({ id, title: "Hi", body: "All", createdAt: "2026-09-27", closed: false, options: [], votes: [] });
    expect((await post(request({ title: " Hi ", body: "All" }))).status).toBe(201);
    expect(mocks.store.createAnnouncement).toHaveBeenCalledWith({ title: "Hi", body: "All", options: [] });
  });
  it("requires a real New York/California choice, not a slider midpoint", async () => {
    mocks.participant.mockResolvedValue(guest);
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, 50]));
    expect((await submitQuiz(request({ groceryGuess: 200, answers }))).status).toBe(400);
    expect(mocks.store.saveAnswers).not.toHaveBeenCalled();
    for (const [value, label] of [[0, "New York"], [100, "California"]] as const) {
      expect((await submitQuiz(request({ groceryGuess: 200, answers: { ...answers, vacation_destination: value } }))).status).toBe(200);
      expect(mocks.store.saveAnswers.mock.lastCall?.[1].vacation_destination).toEqual({ normalized: value, display: label });
    }
  });

  it("requires both new answers and persists their slider positions", async () => {
    mocks.participant.mockResolvedValue(guest);
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.type === "binary" ? 0 : 50]));
    for (const id of ["history_sharing", "song_lyrics", "dancing_ability", "alcohol_plans"]) {
      const incomplete = { ...answers }; delete incomplete[id];
      expect((await submitQuiz(request({ groceryGuess: 200, answers: incomplete }))).status).toBe(400);
    }
    expect(mocks.store.saveAnswers).not.toHaveBeenCalled();
    expect((await submitQuiz(request({ groceryGuess: 200, answers: { ...answers, history_sharing: 20, song_lyrics: 90 } }))).status).toBe(200);
    const saved = mocks.store.saveAnswers.mock.lastCall?.[1];
    expect(saved.history_sharing.normalized).toBe(20);
    expect(saved.song_lyrics.normalized).toBe(90);
    expect(Object.keys(saved)).toHaveLength(16);
  });
});
