import { assignAvatar } from "./avatars";
import type { AnswerMap } from "./dimensions";
import { displayValueFor } from "./money";
import { QUESTION_BY_ID, type QuestionId } from "./questions";
import type { CreateParticipantInput } from "./store/types";
import type { Answers } from "./types";

export interface SeedPerson {
  firstName: string;
  lastName: string;
  undergrad?: string;
  grad?: string;
  cmuProgram?: string;
  answers: Record<QuestionId, number>;
}

/**
 * Fake guests covering every avatar class with deliberately varied answers.
 * Includes a similar pair (Alex/Noah), strong opposites (Alex/Zara), wildly
 * different money values and tech judgments. Remove them from the admin page
 * or set SEED_DATA=false before the real party.
 */
export const SEED_PEOPLE: SeedPerson[] = [
  {
    firstName: "Alex", lastName: "Chen", undergrad: "UC Berkeley", grad: "Carnegie Mellon University", cmuProgram: "MS Robotics",
    answers: { floor_money: 55, assistant_pay: 40, assistant_salary: 60, aux: 12, honesty: 22, fry: 15, irish_exit: 92, vacation_destination: 0, smart_button: 30, move_help: 60, dancing_ability: 55, robot: 30, alcohol_plans: 25, history_sharing: 15, song_lyrics: 25 },
  },
  {
    firstName: "Maya", lastName: "Patel", undergrad: "Carnegie Mellon University", cmuProgram: "ECE",
    answers: { floor_money: 40, assistant_pay: 55, assistant_salary: 70, aux: 95, honesty: 85, fry: 70, irish_exit: 15, vacation_destination: 100, smart_button: 65, move_help: 70, dancing_ability: 60, robot: 65, alcohol_plans: 55, history_sharing: 75, song_lyrics: 95 },
  },
  {
    firstName: "Daniel", lastName: "Kim", undergrad: "University of Toronto",
    answers: { floor_money: 30, assistant_pay: 45, assistant_salary: 90, aux: 75, honesty: 90, fry: 60, irish_exit: 50, vacation_destination: 100, smart_button: 95, move_help: 55, dancing_ability: 70, robot: 55, alcohol_plans: 92, history_sharing: 40, song_lyrics: 70 },
  },
  {
    firstName: "Sophia", lastName: "Wang", undergrad: "Carnegie Mellon University", cmuProgram: "Computer Science",
    answers: { floor_money: 52, assistant_pay: 50, assistant_salary: 48, aux: 55, honesty: 50, fry: 47, irish_exit: 45, vacation_destination: 100, smart_button: 50, move_help: 54, dancing_ability: 49, robot: 52, alcohol_plans: 46, history_sharing: 50, song_lyrics: 50 },
  },
  {
    firstName: "Marcus", lastName: "Johnson", undergrad: "University of Pittsburgh",
    answers: { floor_money: 10, assistant_pay: 30, assistant_salary: 75, aux: 85, honesty: 70, fry: 95, irish_exit: 88, vacation_destination: 0, smart_button: 90, move_help: 35, dancing_ability: 85, robot: 80, alcohol_plans: 80, history_sharing: 80, song_lyrics: 90 },
  },
  {
    firstName: "Priya", lastName: "Sharma", undergrad: "IIT Bombay", grad: "CMU", cmuProgram: "Tepper MBA",
    answers: { floor_money: 95, assistant_pay: 60, assistant_salary: 55, aux: 15, honesty: 30, fry: 10, irish_exit: 15, vacation_destination: 100, smart_button: 10, move_help: 90, dancing_ability: 70, robot: 20, alcohol_plans: 10, history_sharing: 25, song_lyrics: 35 },
  },
  {
    firstName: "Leo", lastName: "Martinez", undergrad: "Penn State",
    answers: { floor_money: 98, assistant_pay: 95, assistant_salary: 100, aux: 5, honesty: 97, fry: 3, irish_exit: 95, vacation_destination: 100, smart_button: 2, move_help: 96, dancing_ability: 100, robot: 4, alcohol_plans: 99, history_sharing: 100, song_lyrics: 0 },
  },
  {
    firstName: "Emma", lastName: "Wilson", undergrad: "Ohio State",
    answers: { floor_money: 72, assistant_pay: 35, assistant_salary: 50, aux: 32, honesty: 52, fry: 45, irish_exit: 22, vacation_destination: 100, smart_button: 38, move_help: 58, dancing_ability: 45, robot: 45, alcohol_plans: 78, history_sharing: 35, song_lyrics: 65 },
  },
  {
    firstName: "Noah", lastName: "Brown", undergrad: "Carnegie Mellon University", cmuProgram: "Mechanical Engineering",
    answers: { floor_money: 50, assistant_pay: 35, assistant_salary: 65, aux: 15, honesty: 25, fry: 20, irish_exit: 88, vacation_destination: 100, smart_button: 25, move_help: 55, dancing_ability: 50, robot: 35, alcohol_plans: 30, history_sharing: 20, song_lyrics: 30 },
  },
  {
    firstName: "Zara", lastName: "Ahmed", undergrad: "University of Michigan",
    answers: { floor_money: 20, assistant_pay: 85, assistant_salary: 85, aux: 90, honesty: 80, fry: 85, irish_exit: 10, vacation_destination: 100, smart_button: 70, move_help: 80, dancing_ability: 90, robot: 90, alcohol_plans: 60, history_sharing: 90, song_lyrics: 100 },
  },
  {
    firstName: "Ethan", lastName: "Park", undergrad: "Georgia Tech",
    answers: { floor_money: 45, assistant_pay: 20, assistant_salary: 80, aux: 70, honesty: 75, fry: 75, irish_exit: 60, vacation_destination: 100, smart_button: 80, move_help: 40, dancing_ability: 30, robot: 35, alcohol_plans: 85, history_sharing: 65, song_lyrics: 75 },
  },
  {
    firstName: "Olivia", lastName: "Nguyen", undergrad: "Cornell",
    answers: { floor_money: 60, assistant_pay: 45, assistant_salary: 55, aux: 42, honesty: 58, fry: 55, irish_exit: 60, vacation_destination: 100, smart_button: 40, move_help: 48, dancing_ability: 58, robot: 47, alcohol_plans: 42, history_sharing: 55, song_lyrics: 45 },
  },
];

export function answersFromMap(map: AnswerMap): Answers {
  const out: Answers = {};
  for (const [id, normalized] of Object.entries(map) as [QuestionId, number][]) {
    out[id] = { normalized, display: displayValueFor(QUESTION_BY_ID[id], normalized) };
  }
  return out;
}

export function seedInputs(): CreateParticipantInput[] {
  return SEED_PEOPLE.map((p, i) => {
    const answers = answersFromMap(p.answers);
    const avatar = assignAvatar(p.answers);
    const slug = `${p.firstName}.${p.lastName}`.toLowerCase();
    return {
      tokenHash: `seed:${slug}`,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: `+1 (412) 555-01${String(i + 1).padStart(2, "0")}`,
      email: `${slug}@example.com`,
      undergraduateUniversity: p.undergrad ?? null,
      graduateUniversity: p.grad ?? null,
      cmuProgram: p.cmuProgram ?? null,
      isSeed: true,
      answers,
      avatarType: avatar.type,
      quizCompletedAt: new Date(Date.now() - (SEED_PEOPLE.length - i) * 60_000).toISOString(),
    };
  });
}
