import { createHash, randomUUID } from "node:crypto";
import { DuplicateContactError, SignInRateLimitError, emailKey, phoneKey } from "../contacts";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AvatarType } from "../avatars";
import type { Answers, Participant, ProfileInput } from "../types";
import type { CreateParticipantInput, Store } from "./types";
import type { AnnouncementInput, AnnouncementRecord, VoteResult } from "../announcements";

interface FileShape {
  version: 1;
  participants: Participant[];
  announcements: AnnouncementRecord[];
  signInAttempts: Record<string, { count: number; expiresAt: number }>;
}

/**
 * Zero-dependency JSON file store for local development and small parties.
 * All mutations are serialized through a single promise chain and written
 * atomically (write temp file, then rename).
 */
export class FileStore implements Store {
  private data: FileShape | null = null;
  private loading: Promise<FileShape> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async load(): Promise<FileShape> {
    if (this.data) return this.data;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const raw = await readFile(this.filePath, "utf8");
          const parsed = JSON.parse(raw) as FileShape;
          this.data = { version: 1, participants: parsed.participants ?? [], announcements: parsed.announcements ?? [], signInAttempts: parsed.signInAttempts ?? {} };
        } catch {
          this.data = { version: 1, participants: [], announcements: [], signInAttempts: {} };
        }
        return this.data;
      })();
    }
    return this.loading;
  }

  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data);
    const write = this.writeChain
      .then(async () => {
        await mkdir(path.dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.${process.pid}.tmp`;
        await writeFile(tmp, snapshot, "utf8");
        await rename(tmp, this.filePath);
      });
    this.writeChain = write.catch(() => {});
    return write;
  }

  async listParticipants() {
    const d = await this.load();
    return d.participants.map(clone);
  }

  async listAnnouncements() {
    return clone((await this.load()).announcements).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createAnnouncement(input: AnnouncementInput) {
    const d = await this.load();
    const announcement: AnnouncementRecord = {
      id: randomUUID(), title: input.title, body: input.body, createdAt: new Date().toISOString(), closed: false,
      options: input.options.map((label) => ({ id: randomUUID(), label })), votes: [],
    };
    d.announcements.push(announcement);
    await this.persist();
    return clone(announcement);
  }

  async deleteAnnouncement(id: string) {
    const data = await this.load();
    const index = data.announcements.findIndex((item) => item.id === id);
    if (index === -1) return false;
    data.announcements.splice(index, 1);
    await this.persist();
    return true;
  }

  async closeAnnouncement(id: string) {
    const record = (await this.load()).announcements.find((item) => item.id === id);
    if (!record) return false;
    record.closed = true;
    await this.persist();
    return true;
  }

  async vote(announcementId: string, participantId: string, optionId: string): Promise<VoteResult> {
    const d = await this.load();
    const record = d.announcements.find((item) => item.id === announcementId);
    if (!record || !d.participants.some((p) => p.id === participantId)) return "not-found";
    if (record.closed) return "closed";
    if (!record.options.some((option) => option.id === optionId)) return "invalid-option";
    record.votes = record.votes.filter((vote) => vote.participantId !== participantId);
    record.votes.push({ participantId, optionId });
    await this.persist();
    return "ok";
  }

  async countParticipants() {
    return (await this.load()).participants.length;
  }

  async getParticipant(id: string) {
    const d = await this.load();
    const p = d.participants.find((x) => x.id === id);
    return p ? clone(p) : null;
  }

  async getParticipantByTokenHash(tokenHash: string) {
    const d = await this.load();
    const p = d.participants.find((x) => x.tokenHash === tokenHash);
    return p ? clone(p) : null;
  }

  async createParticipant(input: CreateParticipantInput) {
    const d = await this.load();
    this.assertUniqueContacts(d.participants, input);
    const now = new Date().toISOString();
    const p: Participant = {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      contactVisibility: input.contactVisibility ?? "guests",
      broughtItems: input.broughtItems ?? null,
      undergraduateUniversity: input.undergraduateUniversity ?? null,
      graduateUniversity: input.graduateUniversity ?? null,
      cmuProgram: input.cmuProgram ?? null,
      avatarType: input.avatarType ?? null,
      quizCompletedAt: input.quizCompletedAt ?? null,
      isSeed: Boolean(input.isSeed),
      createdAt: now,
      answers: input.answers ?? {},
    };
    d.participants.push(p);
    await this.persist();
    return clone(p);
  }

  private assertUniqueContacts(people: Participant[], contact: { phone: string; email: string }, exceptId?: string) {
    if (people.some((p) => p.id !== exceptId && (phoneKey(p.phone) === phoneKey(contact.phone) || emailKey(p.email) === emailKey(contact.email)))) {
      throw new DuplicateContactError();
    }
  }

  async recoverParticipant(phone: string, email: string, tokenHash: string) {
    const data = await this.load();
    const now = Date.now();
    for (const [key, attempt] of Object.entries(data.signInAttempts)) {
      if (attempt.expiresAt <= now) delete data.signInAttempts[key];
    }
    const key = createHash("sha256").update(emailKey(email)).digest("hex");
    const attempt = data.signInAttempts[key] ?? { count: 0, expiresAt: now + 15 * 60 * 1000 };
    if (attempt.count >= 10) throw new SignInRateLimitError();
    data.signInAttempts[key] = { ...attempt, count: attempt.count + 1 };
    const matches = data.participants.filter((p) => !p.isSeed && emailKey(p.email) === emailKey(email) && phoneKey(p.phone) === phoneKey(phone));
    const participant = matches.length === 1 ? matches[0] : null;
    if (participant) participant.tokenHash = tokenHash;
    await this.persist();
    return participant ? clone(participant) : null;
  }

  private async mutate(id: string, fn: (p: Participant) => void) {
    const d = await this.load();
    const p = d.participants.find((x) => x.id === id);
    if (!p) return null;
    fn(p);
    await this.persist();
    return clone(p);
  }

  updateProfile(id: string, patch: Partial<ProfileInput>) {
    return this.mutate(id, (p) => {
      this.assertUniqueContacts(this.data!.participants, { phone: patch.phone ?? p.phone, email: patch.email ?? p.email }, id);
      if (patch.firstName !== undefined) p.firstName = patch.firstName;
      if (patch.lastName !== undefined) p.lastName = patch.lastName;
      if (patch.phone !== undefined) p.phone = patch.phone;
      if (patch.email !== undefined) p.email = patch.email;
      if (patch.contactVisibility !== undefined) p.contactVisibility = patch.contactVisibility;
      if (patch.broughtItems !== undefined) p.broughtItems = patch.broughtItems;
      if (patch.undergraduateUniversity !== undefined) p.undergraduateUniversity = patch.undergraduateUniversity ?? null;
      if (patch.graduateUniversity !== undefined) p.graduateUniversity = patch.graduateUniversity ?? null;
      if (patch.cmuProgram !== undefined) p.cmuProgram = patch.cmuProgram ?? null;
    });
  }

  saveAnswers(id: string, answers: Answers, avatarType: AvatarType) {
    return this.mutate(id, (p) => {
      p.answers = answers;
      p.avatarType = avatarType;
      p.quizCompletedAt = new Date().toISOString();
    });
  }

  resetQuiz(id: string) {
    return this.mutate(id, (p) => {
      p.answers = {};
      p.avatarType = null;
      p.quizCompletedAt = null;
    });
  }

  async deleteParticipant(id: string) {
    const d = await this.load();
    const before = d.participants.length;
    d.participants = d.participants.filter((x) => x.id !== id);
    if (d.participants.length === before) return false;
    for (const announcement of d.announcements) announcement.votes = announcement.votes.filter((vote) => vote.participantId !== id);
    await this.persist();
    return true;
  }

  async deleteSeedParticipants() {
    const d = await this.load();
    const before = d.participants.length;
    d.participants = d.participants.filter((x) => !x.isSeed);
    const remaining = new Set(d.participants.map((p) => p.id));
    for (const announcement of d.announcements) announcement.votes = announcement.votes.filter((vote) => remaining.has(vote.participantId));
    const removed = before - d.participants.length;
    if (removed) await this.persist();
    return removed;
  }
}

function clone<T>(x: T): T {
  return structuredClone(x);
}
