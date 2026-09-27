import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAvatarType, type AvatarType } from "../avatars";
import type { QuestionId } from "../questions";
import { isActivityId, type ActivityId, type Answers, type Participant, type ProfileInput } from "../types";
import type { CreateParticipantInput, Store } from "./types";

interface ParticipantRow {
  id: string;
  token_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  undergraduate_university: string | null;
  graduate_university: string | null;
  cmu_program: string | null;
  avatar_type: string | null;
  quiz_completed_at: string | null;
  is_seed: boolean;
  created_at: string;
  answers?: { question_id: string; normalized_value: number; display_value: string }[];
  participant_activities?: { activity_id: string; is_interested: boolean }[];
}

const SELECT = "*, answers(question_id, normalized_value, display_value), participant_activities(activity_id, is_interested)";

function rowToParticipant(r: ParticipantRow): Participant {
  const answers: Answers = {};
  for (const a of r.answers ?? []) {
    answers[a.question_id as QuestionId] = { normalized: a.normalized_value, display: a.display_value };
  }
  return {
    id: r.id,
    tokenHash: r.token_hash,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    email: r.email,
    undergraduateUniversity: r.undergraduate_university,
    graduateUniversity: r.graduate_university,
    cmuProgram: r.cmu_program,
    avatarType: isAvatarType(r.avatar_type) ? r.avatar_type : null,
    quizCompletedAt: r.quiz_completed_at,
    isSeed: r.is_seed,
    createdAt: r.created_at,
    activities: (r.participant_activities ?? [])
      .filter((a) => a.is_interested && isActivityId(a.activity_id))
      .map((a) => a.activity_id as ActivityId),
    answers,
  };
}

function profilePatchToRow(patch: Partial<ProfileInput>) {
  const row: Record<string, unknown> = {};
  if (patch.firstName !== undefined) row.first_name = patch.firstName;
  if (patch.lastName !== undefined) row.last_name = patch.lastName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.undergraduateUniversity !== undefined) row.undergraduate_university = patch.undergraduateUniversity ?? null;
  if (patch.graduateUniversity !== undefined) row.graduate_university = patch.graduateUniversity ?? null;
  if (patch.cmuProgram !== undefined) row.cmu_program = patch.cmuProgram ?? null;
  return row;
}

/**
 * Supabase Postgres store. Uses the service-role key server-side only; row
 * level security stays enabled with no anon policies so nothing is public.
 * Schema lives in supabase/schema.sql.
 */
export class SupabaseStore implements Store {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private async fetchOne(column: string, value: string): Promise<Participant | null> {
    const { data, error } = await this.client
      .from("participants")
      .select(SELECT)
      .eq(column, value)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToParticipant(data as ParticipantRow) : null;
  }

  async listParticipants() {
    const { data, error } = await this.client
      .from("participants")
      .select(SELECT)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as ParticipantRow[]).map(rowToParticipant);
  }

  async countParticipants() {
    const { count, error } = await this.client.from("participants").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  }

  getParticipant(id: string) {
    return this.fetchOne("id", id);
  }

  getParticipantByTokenHash(tokenHash: string) {
    return this.fetchOne("token_hash", tokenHash);
  }

  async createParticipant(input: CreateParticipantInput) {
    const { data, error } = await this.client
      .from("participants")
      .insert({
        token_hash: input.tokenHash,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        email: input.email,
        undergraduate_university: input.undergraduateUniversity ?? null,
        graduate_university: input.graduateUniversity ?? null,
        cmu_program: input.cmuProgram ?? null,
        avatar_type: input.avatarType ?? null,
        quiz_completed_at: input.quizCompletedAt ?? null,
        is_seed: Boolean(input.isSeed),
      })
      .select("id")
      .single();
    if (error) throw error;
    const id = (data as { id: string }).id;
    if (input.activities?.length) await this.writeActivities(id, input.activities);
    if (input.answers && Object.keys(input.answers).length) await this.writeAnswers(id, input.answers);
    const created = await this.getParticipant(id);
    if (!created) throw new Error("participant vanished after insert");
    return created;
  }

  async updateProfile(id: string, patch: Partial<ProfileInput>) {
    const row = profilePatchToRow(patch);
    if (Object.keys(row).length) {
      const { error } = await this.client.from("participants").update(row).eq("id", id);
      if (error) throw error;
    }
    return this.getParticipant(id);
  }

  private async writeActivities(id: string, activities: ActivityId[]) {
    const del = await this.client.from("participant_activities").delete().eq("participant_id", id);
    if (del.error) throw del.error;
    const unique = [...new Set(activities)];
    if (unique.length) {
      const ins = await this.client
        .from("participant_activities")
        .insert(unique.map((activity_id) => ({ participant_id: id, activity_id, is_interested: true })));
      if (ins.error) throw ins.error;
    }
  }

  private async writeAnswers(id: string, answers: Answers) {
    const rows = Object.entries(answers).map(([question_id, a]) => ({
      participant_id: id,
      question_id,
      normalized_value: a!.normalized,
      display_value: a!.display,
    }));
    const { error } = await this.client.from("answers").upsert(rows, { onConflict: "participant_id,question_id" });
    if (error) throw error;
  }

  async setActivities(id: string, activities: ActivityId[]) {
    await this.writeActivities(id, activities);
    return this.getParticipant(id);
  }

  async saveAnswers(id: string, answers: Answers, avatarType: AvatarType) {
    await this.writeAnswers(id, answers);
    const { error } = await this.client
      .from("participants")
      .update({ avatar_type: avatarType, quiz_completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return this.getParticipant(id);
  }

  async resetQuiz(id: string) {
    const del = await this.client.from("answers").delete().eq("participant_id", id);
    if (del.error) throw del.error;
    const { error } = await this.client
      .from("participants")
      .update({ avatar_type: null, quiz_completed_at: null })
      .eq("id", id);
    if (error) throw error;
    return this.getParticipant(id);
  }

  async deleteParticipant(id: string) {
    const { data, error } = await this.client.from("participants").delete().eq("id", id).select("id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  async deleteSeedParticipants() {
    const { data, error } = await this.client.from("participants").delete().eq("is_seed", true).select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }
}
