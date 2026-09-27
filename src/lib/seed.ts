import { assignAvatar } from "./avatars";
import type { AnswerMap } from "./dimensions";
import { displayValueFor } from "./money";
import { QUESTION_BY_ID, type QuestionId } from "./questions";
import type { CreateParticipantInput } from "./store/types";
import type { ActivityId, Answers } from "./types";

export interface SeedPerson {
  firstName: string;
  lastName: string;
  undergrad?: string;
  grad?: string;
  cmuProgram?: string;
  activities: ActivityId[];
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
    activities: ["ping_pong", "pool"],
    answers: { floor_money: 55, assistant_pay: 40, assistant_salary: 60, aux: 12, honesty: 22, fry: 15, ai: 35, irish_exit: 92, drink_pressure: 45, smart_button: 30, move_help: 60, phone_price: 55, robot: 30, revenge: 25 },
  },
  {
    firstName: "Maya", lastName: "Patel", undergrad: "Carnegie Mellon University", cmuProgram: "ECE",
    activities: ["swimming", "ping_pong", "board_games"],
    answers: { floor_money: 40, assistant_pay: 55, assistant_salary: 70, aux: 95, honesty: 85, fry: 70, ai: 60, irish_exit: 15, drink_pressure: 80, smart_button: 65, move_help: 70, phone_price: 60, robot: 65, revenge: 55 },
  },
  {
    firstName: "Daniel", lastName: "Kim", undergrad: "University of Toronto",
    activities: ["ping_pong", "pool", "board_games"],
    answers: { floor_money: 30, assistant_pay: 45, assistant_salary: 90, aux: 75, honesty: 90, fry: 60, ai: 50, irish_exit: 50, drink_pressure: 55, smart_button: 95, move_help: 55, phone_price: 70, robot: 55, revenge: 92 },
  },
  {
    firstName: "Sophia", lastName: "Wang", undergrad: "Carnegie Mellon University", cmuProgram: "Computer Science",
    activities: ["swimming", "board_games"],
    answers: { floor_money: 52, assistant_pay: 50, assistant_salary: 48, aux: 55, honesty: 50, fry: 47, ai: 53, irish_exit: 45, drink_pressure: 56, smart_button: 50, move_help: 54, phone_price: 49, robot: 52, revenge: 46 },
  },
  {
    firstName: "Marcus", lastName: "Johnson", undergrad: "University of Pittsburgh",
    activities: ["swimming", "pool"],
    answers: { floor_money: 10, assistant_pay: 30, assistant_salary: 75, aux: 85, honesty: 70, fry: 95, ai: 75, irish_exit: 88, drink_pressure: 40, smart_button: 90, move_help: 35, phone_price: 85, robot: 80, revenge: 80 },
  },
  {
    firstName: "Priya", lastName: "Sharma", undergrad: "IIT Bombay", grad: "CMU", cmuProgram: "Tepper MBA",
    activities: ["board_games"],
    answers: { floor_money: 95, assistant_pay: 60, assistant_salary: 55, aux: 15, honesty: 30, fry: 10, ai: 30, irish_exit: 15, drink_pressure: 95, smart_button: 10, move_help: 90, phone_price: 70, robot: 20, revenge: 10 },
  },
  {
    firstName: "Leo", lastName: "Martinez", undergrad: "Penn State",
    activities: ["swimming"],
    answers: { floor_money: 98, assistant_pay: 95, assistant_salary: 100, aux: 5, honesty: 97, fry: 3, ai: 100, irish_exit: 95, drink_pressure: 98, smart_button: 2, move_help: 96, phone_price: 100, robot: 4, revenge: 99 },
  },
  {
    firstName: "Emma", lastName: "Wilson", undergrad: "Ohio State",
    activities: ["board_games", "ping_pong"],
    answers: { floor_money: 72, assistant_pay: 35, assistant_salary: 50, aux: 32, honesty: 52, fry: 8, ai: 40, irish_exit: 22, drink_pressure: 52, smart_button: 38, move_help: 58, phone_price: 45, robot: 45, revenge: 78 },
  },
  {
    firstName: "Noah", lastName: "Brown", undergrad: "Carnegie Mellon University", cmuProgram: "Mechanical Engineering",
    activities: ["pool", "board_games"],
    answers: { floor_money: 50, assistant_pay: 35, assistant_salary: 65, aux: 15, honesty: 25, fry: 20, ai: 30, irish_exit: 88, drink_pressure: 50, smart_button: 25, move_help: 55, phone_price: 50, robot: 35, revenge: 30 },
  },
  {
    firstName: "Zara", lastName: "Ahmed", undergrad: "University of Michigan",
    activities: ["swimming", "ping_pong"],
    answers: { floor_money: 20, assistant_pay: 85, assistant_salary: 85, aux: 90, honesty: 80, fry: 85, ai: 90, irish_exit: 10, drink_pressure: 75, smart_button: 70, move_help: 80, phone_price: 90, robot: 90, revenge: 60 },
  },
  {
    firstName: "Ethan", lastName: "Park", undergrad: "Georgia Tech",
    activities: ["ping_pong", "pool"],
    answers: { floor_money: 45, assistant_pay: 20, assistant_salary: 80, aux: 70, honesty: 75, fry: 75, ai: 40, irish_exit: 60, drink_pressure: 50, smart_button: 80, move_help: 40, phone_price: 30, robot: 35, revenge: 85 },
  },
  {
    firstName: "Olivia", lastName: "Nguyen", undergrad: "Cornell",
    activities: ["swimming", "pool", "board_games"],
    answers: { floor_money: 60, assistant_pay: 45, assistant_salary: 55, aux: 42, honesty: 58, fry: 55, ai: 44, irish_exit: 60, drink_pressure: 62, smart_button: 40, move_help: 48, phone_price: 58, robot: 47, revenge: 42 },
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
      activities: p.activities,
      answers,
      avatarType: avatar.type,
      quizCompletedAt: new Date(Date.now() - (SEED_PEOPLE.length - i) * 60_000).toISOString(),
    };
  });
}
