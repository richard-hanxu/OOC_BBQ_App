import type { AvatarType } from "../avatars";
import type { ActivityId, Answers, Participant, ProfileInput } from "../types";

export interface CreateParticipantInput extends ProfileInput {
  tokenHash: string;
  isSeed?: boolean;
  activities?: ActivityId[];
  answers?: Answers;
  avatarType?: AvatarType | null;
  quizCompletedAt?: string | null;
}

export interface Store {
  listParticipants(): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | null>;
  getParticipantByTokenHash(tokenHash: string): Promise<Participant | null>;
  createParticipant(input: CreateParticipantInput): Promise<Participant>;
  updateProfile(id: string, patch: Partial<ProfileInput>): Promise<Participant | null>;
  setActivities(id: string, activities: ActivityId[]): Promise<Participant | null>;
  saveAnswers(id: string, answers: Answers, avatarType: AvatarType): Promise<Participant | null>;
  resetQuiz(id: string): Promise<Participant | null>;
  deleteParticipant(id: string): Promise<boolean>;
  deleteSeedParticipants(): Promise<number>;
  countParticipants(): Promise<number>;
}
