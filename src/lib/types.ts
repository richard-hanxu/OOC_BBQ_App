import type { AvatarType } from "./avatars";
import type { QuestionId } from "./questions";

export type ActivityId = "swimming" | "ping_pong" | "pool" | "board_games";

export interface Activity {
  id: ActivityId;
  emoji: string;
  label: string;
  shortLabel: string;
  /** Gradient stops for the tile. */
  from: string;
  to: string;
}

export const ACTIVITIES: Activity[] = [
  { id: "swimming", emoji: "🏊", label: "Swimming", shortLabel: "Swim", from: "#22d3ee", to: "#3b82f6" },
  { id: "ping_pong", emoji: "🏓", label: "Ping Pong", shortLabel: "Ping Pong", from: "#fb923c", to: "#f43f5e" },
  { id: "pool", emoji: "🎱", label: "Pool / Billiards", shortLabel: "Pool", from: "#a78bfa", to: "#6366f1" },
  { id: "board_games", emoji: "🎲", label: "Board Games", shortLabel: "Board Games", from: "#4ade80", to: "#facc15" },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a])) as Record<
  ActivityId,
  Activity
>;

export function isActivityId(x: unknown): x is ActivityId {
  return typeof x === "string" && x in ACTIVITY_BY_ID;
}

export interface Answer {
  normalized: number;
  display: string;
}

export type Answers = Partial<Record<QuestionId, Answer>>;

/** Full participant record as stored. Never sent to clients as-is (token hash). */
export interface Participant {
  id: string;
  tokenHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  undergraduateUniversity: string | null;
  graduateUniversity: string | null;
  cmuProgram: string | null;
  avatarType: AvatarType | null;
  quizCompletedAt: string | null;
  isSeed: boolean;
  createdAt: string;
  activities: ActivityId[];
  answers: Answers;
}

/** What other guests can see. Contact info is part of the private directory. */
export type PublicParticipant = Omit<Participant, "tokenHash">;

export function toPublic(p: Participant): PublicParticipant {
  const { tokenHash: _tokenHash, ...rest } = p;
  void _tokenHash;
  return rest;
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  undergraduateUniversity?: string | null;
  graduateUniversity?: string | null;
  cmuProgram?: string | null;
}

export function isCmu(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  return n === "cmu" || n.includes("carnegie mellon") || /\bcmu\b/.test(n);
}

/** "CMU • MS Robotics" or "University of Toronto" or "". */
export function schoolLine(p: Pick<PublicParticipant, "undergraduateUniversity" | "graduateUniversity" | "cmuProgram">) {
  const cmuSchool = [p.graduateUniversity, p.undergraduateUniversity].find(isCmu);
  if (cmuSchool) return p.cmuProgram ? `CMU • ${p.cmuProgram}` : "CMU";
  return p.graduateUniversity || p.undergraduateUniversity || "";
}

export function fullName(p: Pick<PublicParticipant, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}
