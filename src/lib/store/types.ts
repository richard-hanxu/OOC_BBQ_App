import type { AvatarType } from "../avatars";
import type { Answers, Participant, ProfileInput } from "../types";
import type { AnnouncementInput, AnnouncementRecord, VoteResult } from "../announcements";

export interface CreateParticipantInput extends ProfileInput {
  tokenHash: string;
  isSeed?: boolean;
  answers?: Answers;
  avatarType?: AvatarType | null;
  quizCompletedAt?: string | null;
}

export interface Store {
  listAnnouncements(): Promise<AnnouncementRecord[]>;
  createAnnouncement(input: AnnouncementInput): Promise<AnnouncementRecord>;
  closeAnnouncement(id: string): Promise<boolean>;
  deleteAnnouncement(id: string): Promise<boolean>;
  vote(announcementId: string, participantId: string, optionId: string): Promise<VoteResult>;
  listParticipants(): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | null>;
  getParticipantByTokenHash(tokenHash: string): Promise<Participant | null>;
  recoverParticipant(phone: string, email: string, tokenHash: string): Promise<Participant | null>;
  createParticipant(input: CreateParticipantInput): Promise<Participant>;
  updateProfile(id: string, patch: Partial<ProfileInput>): Promise<Participant | null>;
  saveAnswers(id: string, answers: Answers, avatarType: AvatarType): Promise<Participant | null>;
  resetQuiz(id: string): Promise<Participant | null>;
  deleteParticipant(id: string): Promise<boolean>;
  deleteSeedParticipants(): Promise<number>;
  countParticipants(): Promise<number>;
}
