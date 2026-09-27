import type { AvatarType } from "./avatars";
import type { QuestionId } from "./questions";

export interface Answer {
  normalized: number;
  display: string;
}

export type Answers = Partial<Record<QuestionId, Answer>>;
export type ContactVisibility = "guests" | "organizers";

/** Full participant record as stored. Never sent to clients as-is (token hash). */
export interface Participant {
  id: string;
  tokenHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  contactVisibility?: ContactVisibility;
  broughtItems?: string | null;
  undergraduateUniversity: string | null;
  graduateUniversity: string | null;
  cmuProgram: string | null;
  avatarType: AvatarType | null;
  quizCompletedAt: string | null;
  isSeed: boolean;
  createdAt: string;
  answers: Answers;
}

/** What other guests can see. Contact info is part of the private directory. */
export type PublicParticipant = Omit<Participant, "tokenHash" | "phone" | "email"> & {
  phone: string | null;
  email: string | null;
};

export function toPublic(p: Participant, access: { viewerId?: string; organizer?: boolean } = {}): PublicParticipant {
  const { tokenHash: _tokenHash, ...rest } = p;
  void _tokenHash;
  // Old JSON files may still contain the retired activity field.
  const { activities: _activities, ...profile } = rest as typeof rest & { activities?: unknown };
  void _activities;
  const visible = p.contactVisibility !== "organizers" || access.organizer || access.viewerId === p.id;
  return { ...profile, contactVisibility: p.contactVisibility ?? "guests", phone: visible ? p.phone : null, email: visible ? p.email : null,
    broughtItems: access.organizer || access.viewerId === p.id ? p.broughtItems ?? null : null };
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  contactVisibility?: ContactVisibility;
  broughtItems?: string | null;
  undergraduateUniversity?: string | null;
  graduateUniversity?: string | null;
  cmuProgram?: string | null;
}

export function isCmu(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  return n === "cmu" || n.includes("carnegie mellon") || /\bcmu\b/.test(n);
}

/** One university, including records saved before the unified university form. */
export function universityFor(p: Pick<PublicParticipant, "undergraduateUniversity" | "graduateUniversity">) {
  if ([p.graduateUniversity, p.undergraduateUniversity].some(isCmu)) return "Carnegie Mellon University";
  return p.graduateUniversity || p.undergraduateUniversity || "";
}

/** "CMU • MS Robotics" or "University of Toronto" or "". */
export function schoolLine(p: Pick<PublicParticipant, "undergraduateUniversity" | "graduateUniversity" | "cmuProgram">) {
  const university = universityFor(p);
  if (isCmu(university)) return p.cmuProgram ? `CMU • ${p.cmuProgram}` : "CMU";
  return university;
}

export function fullName(p: Pick<PublicParticipant, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}
