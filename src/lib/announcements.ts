export interface PollOption { id: string; label: string }
export interface AnnouncementInput { title: string; body: string; options: string[] }
export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  closed: boolean;
  options: PollOption[];
  votes: { participantId: string; optionId: string }[];
}
export interface Announcement extends Omit<AnnouncementRecord, "options" | "votes"> {
  options: (PollOption & { votes: number })[];
  totalVotes: number;
  myVote: string | null;
}
export type VoteResult = "ok" | "not-found" | "closed" | "invalid-option";

export function announcementFor(record: AnnouncementRecord, viewerId?: string): Announcement {
  const { votes, options, ...rest } = record;
  const validVotes = votes.filter((vote) => options.some((option) => option.id === vote.optionId));
  return {
    ...rest,
    options: options.map((option) => ({ ...option, votes: validVotes.filter((vote) => vote.optionId === option.id).length })),
    totalVotes: validVotes.length,
    myVote: validVotes.find((vote) => vote.participantId === viewerId)?.optionId ?? null,
  };
}

export function validateAnnouncement(input: unknown): AnnouncementInput {
  if (!input || typeof input !== "object") throw new Error("Enter an announcement.");
  const data = input as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (!title || title.length > 120) throw new Error("Add a title of up to 120 characters.");
  if (!body || body.length > 4000) throw new Error("Add a message of up to 4,000 characters.");
  const raw = data.options ?? [];
  if (!Array.isArray(raw) || raw.some((option) => typeof option !== "string")) throw new Error("Poll options must be text.");
  if (raw.length !== 0 && (raw.length < 2 || raw.length > 4)) throw new Error("A poll needs 2 to 4 options.");
  const options = (raw as string[]).map((option) => option.trim());
  if (options.some((option) => !option || option.length > 120)) throw new Error("Each option needs 1 to 120 characters.");
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) throw new Error("Use different labels for each poll option.");
  return { title, body, options };
}
