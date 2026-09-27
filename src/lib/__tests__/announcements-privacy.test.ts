import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileStore } from "../store/file-store";
import { announcementFor, validateAnnouncement } from "../announcements";
import { toPublic, type Participant } from "../types";
import { validateProfile } from "../server/validate";
import { CMU_PROGRAMS, programLabel, searchPrograms } from "../cmu-programs";

const profile = { firstName: "Test", lastName: "Guest", phone: "+14125550123", email: "private@example.com", tokenHash: "secret", contactVisibility: "organizers" as const };
let directory: string;
let store: FileStore;
let participant: Participant;
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "party-unit-"));
  store = new FileStore(path.join(directory, "data.json"));
  participant = await store.createParticipant(profile);
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

describe("contact privacy", () => {
  it("redacts both contact fields from other guests and never leaks tokens", () => {
    const guest = toPublic(participant, { viewerId: "someone-else" });
    expect(guest.phone).toBeNull(); expect(guest.email).toBeNull();
    expect(guest).not.toHaveProperty("tokenHash");
    expect(guest.firstName).toBe("Test");
    expect(toPublic(participant).email).toBeNull();
  });
  it("allows owners and organizers to see contact details", () => {
    for (const access of [{ viewerId: participant.id }, { organizer: true }]) {
      expect(toPublic(participant, access).email).toBe(profile.email);
      expect(toPublic(participant, access).phone).toBe(profile.phone);
      expect(toPublic(participant, access)).not.toHaveProperty("tokenHash");
    }
  });
  it("persists changed visibility and keeps legacy contacts guest-visible", async () => {
    await store.updateProfile(participant.id, { contactVisibility: "guests" });
    const reloaded = await new FileStore(path.join(directory, "data.json")).getParticipant(participant.id);
    expect(toPublic(reloaded!).email).toBe(profile.email);
    const legacy = { ...participant }; delete legacy.contactVisibility;
    expect(toPublic(legacy).email).toBe(profile.email);
  });
  it("rejects invented visibility modes", () => {
    expect(() => validateProfile({ contactVisibility: "public" }, { partial: true })).toThrow();
    expect(validateProfile({ contactVisibility: "organizers" }, { partial: true })).toEqual({ contactVisibility: "organizers" });
  });
});

describe("announcements and polls", () => {
  it("accepts a plain announcement or two to four unique options", () => {
    expect(validateAnnouncement({ title: " Hi ", body: " Everyone " })).toEqual({ title: "Hi", body: "Everyone", options: [] });
    for (const count of [2, 3, 4]) expect(validateAnnouncement({ title: "Vote", body: "Pick", options: Array.from({ length: count }, (_, i) => String(i)) }).options).toHaveLength(count);
  });
  it.each([[], ["Only"], ["A", "a"], ["A", " "], ["A", 3], ["1", "2", "3", "4", "5"]])("rejects malformed announcement input %j", (...options) => {
    // Empty options is valid for a message, but the missing title is not.
    expect(() => validateAnnouncement({ title: options.length ? "Vote" : "", body: "Message", options })).toThrow();
  });
  it("stores plain updates and polls across reloads", async () => {
    const message = await store.createAnnouncement({ title: "Welcome", body: "Pool opens at 6", options: [] });
    expect(await store.vote(message.id, participant.id, "fake")).toBe("invalid-option");
    const poll = await store.createAnnouncement({ title: "Food", body: "Pick one", options: ["Pizza", "Tacos"] });
    expect(poll.options).toHaveLength(2);
    expect(await new FileStore(path.join(directory, "data.json")).listAnnouncements()).toHaveLength(2);
  });
  it("counts one vote per guest, lets them switch, and hides voter identities", async () => {
    const poll = await store.createAnnouncement({ title: "Food", body: "Pick one", options: ["Pizza", "Tacos"] });
    const [a, b] = poll.options;
    await Promise.all([store.vote(poll.id, participant.id, a.id), store.vote(poll.id, participant.id, b.id)]);
    const [record] = await store.listAnnouncements();
    expect(record.votes).toEqual([{ participantId: participant.id, optionId: b.id }]);
    const publicPoll = announcementFor(record, participant.id);
    expect(publicPoll.totalVotes).toBe(1); expect(publicPoll.myVote).toBe(b.id);
    expect(publicPoll.options.map((o) => o.votes)).toEqual([0, 1]);
    expect(publicPoll).not.toHaveProperty("votes");
    expect(JSON.stringify(publicPoll)).not.toContain(participant.id);
    expect(announcementFor(record, "other").myVote).toBeNull();
  });
  it("rejects missing guests, invalid options, and voting after closure", async () => {
    const poll = await store.createAnnouncement({ title: "Food", body: "Pick one", options: ["Pizza", "Tacos"] });
    expect(await store.vote(poll.id, "outsider", poll.options[0].id)).toBe("not-found");
    expect(await store.vote(poll.id, participant.id, "fake")).toBe("invalid-option");
    expect(await store.closeAnnouncement(poll.id)).toBe(true);
    expect(await store.vote(poll.id, participant.id, poll.options[0].id)).toBe("closed");
    expect(await store.closeAnnouncement("missing")).toBe(false);
    expect((await store.listAnnouncements())[0].votes).toHaveLength(0);
  });
  it("deleting a guest removes their poll vote", async () => {
    const poll = await store.createAnnouncement({ title: "Food", body: "Pick one", options: ["Pizza", "Tacos"] });
    await store.vote(poll.id, participant.id, poll.options[0].id);
    await store.deleteParticipant(participant.id);
    expect(announcementFor((await store.listAnnouncements())[0]).totalVotes).toBe(0);
  });
});

describe("CMU program catalog", () => {
  it("has unique, emoji-prefixed labels that fit profile storage", () => {
    const labels = CMU_PROGRAMS.map(programLabel);
    expect(labels.length).toBeGreaterThan(200);
    expect(new Set(labels).size).toBe(labels.length);
    for (const p of CMU_PROGRAMS) {
      expect(p.emoji).toMatch(/\p{Extended_Pictographic}/u);
      expect(p.acronym).toBeTruthy(); expect(p.name).toBeTruthy();
      expect(programLabel(p)).toMatch(/ \S+ \[.+\]$/);
      expect(programLabel(p).length).toBeLessThanOrEqual(240);
    }
  });
  it("searches acronyms, degree names, and schools without requiring a separate education-level field", () => {
    expect(searchPrograms("msr").some((p) => p.acronym === "MSR")).toBe(true);
    expect(searchPrograms("computer science").some((p) => p.acronym === "BSCS")).toBe(true);
    expect(searchPrograms("Tepper").some((p) => p.acronym === "MBA")).toBe(true);
    expect(searchPrograms("robotics").some((p) => p.acronym === "PhD-R")).toBe(true);
    expect(searchPrograms("not-a-real-program")).toHaveLength(0);
  });
});
