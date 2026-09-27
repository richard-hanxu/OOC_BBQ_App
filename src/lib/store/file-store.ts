import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AvatarType } from "../avatars";
import type { ActivityId, Answers, Participant, ProfileInput } from "../types";
import type { CreateParticipantInput, Store } from "./types";

interface FileShape {
  version: 1;
  participants: Participant[];
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
          this.data = { version: 1, participants: parsed.participants ?? [] };
        } catch {
          this.data = { version: 1, participants: [] };
        }
        return this.data;
      })();
    }
    return this.loading;
  }

  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data);
    this.writeChain = this.writeChain
      .then(async () => {
        await mkdir(path.dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.${process.pid}.tmp`;
        await writeFile(tmp, snapshot, "utf8");
        await rename(tmp, this.filePath);
      })
      .catch((err) => {
        console.error("[file-store] failed to persist", err);
      });
    return this.writeChain;
  }

  async listParticipants() {
    const d = await this.load();
    return d.participants.map(clone);
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
    const now = new Date().toISOString();
    const p: Participant = {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      undergraduateUniversity: input.undergraduateUniversity ?? null,
      graduateUniversity: input.graduateUniversity ?? null,
      cmuProgram: input.cmuProgram ?? null,
      avatarType: input.avatarType ?? null,
      quizCompletedAt: input.quizCompletedAt ?? null,
      isSeed: Boolean(input.isSeed),
      createdAt: now,
      activities: input.activities ?? [],
      answers: input.answers ?? {},
    };
    d.participants.push(p);
    await this.persist();
    return clone(p);
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
      if (patch.firstName !== undefined) p.firstName = patch.firstName;
      if (patch.lastName !== undefined) p.lastName = patch.lastName;
      if (patch.phone !== undefined) p.phone = patch.phone;
      if (patch.email !== undefined) p.email = patch.email;
      if (patch.undergraduateUniversity !== undefined) p.undergraduateUniversity = patch.undergraduateUniversity ?? null;
      if (patch.graduateUniversity !== undefined) p.graduateUniversity = patch.graduateUniversity ?? null;
      if (patch.cmuProgram !== undefined) p.cmuProgram = patch.cmuProgram ?? null;
    });
  }

  setActivities(id: string, activities: ActivityId[]) {
    return this.mutate(id, (p) => {
      p.activities = [...new Set(activities)];
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
    await this.persist();
    return true;
  }

  async deleteSeedParticipants() {
    const d = await this.load();
    const before = d.participants.length;
    d.participants = d.participants.filter((x) => !x.isSeed);
    const removed = before - d.participants.length;
    if (removed) await this.persist();
    return removed;
  }
}

function clone<T>(x: T): T {
  return structuredClone(x);
}
