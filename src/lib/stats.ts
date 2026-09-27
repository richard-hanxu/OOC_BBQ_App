import { AVATARS, ALL_AVATAR_TYPES, type AvatarType } from "./avatars";
import { stddev } from "./dimensions";
import { moneyDisplay } from "./money";
import { QUESTIONS, partyCaptionFor, type Question } from "./questions";
import { ACTIVITIES, type ActivityId, type PublicParticipant } from "./types";

export interface QuestionStats {
  question: Question;
  count: number;
  median: number;
  mean: number;
  spread: number;
  /** 10 buckets covering 0–100. */
  histogram: number[];
  medianDisplay: string;
  caption: string;
  minDisplay: string;
  maxDisplay: string;
}

export interface PartyStats {
  participants: number;
  completed: number;
  questions: QuestionStats[];
  mostDivisive: QuestionStats | null;
  strongestConsensus: QuestionStats | null;
  biggestMoneyGap: QuestionStats | null;
  species: { type: AvatarType; count: number; percent: number }[];
  activities: { id: ActivityId; count: number }[];
}

function median(xs: number[]) {
  if (!xs.length) return 50;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function questionStats(q: Question, people: PublicParticipant[]): QuestionStats {
  const values = people
    .map((p) => p.answers[q.id]?.normalized)
    .filter((v): v is number => typeof v === "number");
  const med = median(values);
  const histogram = new Array(10).fill(0);
  for (const v of values) histogram[Math.min(9, Math.floor(v / 10))]++;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const display = (v: number) => (q.type === "money_slider" ? moneyDisplay(q, v) : String(Math.round(v)));
  return {
    question: q,
    count: values.length,
    median: med,
    mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 50,
    spread: stddev(values),
    histogram,
    medianDisplay: display(med),
    caption: partyCaptionFor(q, med),
    minDisplay: display(min),
    maxDisplay: display(max),
  };
}

export function computePartyStats(people: PublicParticipant[]): PartyStats {
  const completed = people.filter((p) => p.quizCompletedAt);
  const questions = QUESTIONS.map((q) => questionStats(q, completed));
  const withData = questions.filter((s) => s.count >= 2);
  const nonMoney = withData.filter((s) => s.question.type === "continuous_slider");
  const money = withData.filter((s) => s.question.type === "money_slider");
  const bySpreadDesc = (a: QuestionStats, b: QuestionStats) => b.spread - a.spread;

  const speciesCounts = new Map<AvatarType, number>();
  for (const p of completed) if (p.avatarType) speciesCounts.set(p.avatarType, (speciesCounts.get(p.avatarType) ?? 0) + 1);
  const species = ALL_AVATAR_TYPES.map((type) => {
    const count = speciesCounts.get(type) ?? 0;
    return { type, count, percent: completed.length ? Math.round((count / completed.length) * 100) : 0 };
  }).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    participants: people.length,
    completed: completed.length,
    questions,
    mostDivisive: [...nonMoney].sort(bySpreadDesc)[0] ?? null,
    strongestConsensus: [...nonMoney].sort((a, b) => a.spread - b.spread)[0] ?? null,
    biggestMoneyGap: [...money].sort(bySpreadDesc)[0] ?? null,
    species,
    activities: ACTIVITIES.map((a) => ({
      id: a.id,
      count: people.filter((p) => p.activities.includes(a.id)).length,
    })),
  };
}

export function speciesBlurb(species: PartyStats["species"], completed: number): string {
  if (completed === 0) return "No species have spawned yet.";
  const top = species[0];
  if (!top || top.count === 0) return "The ecosystem is still forming.";
  const ties = species.filter((s) => s.count === top.count);
  if (ties.length > 1) {
    return `${ties.map((s) => AVATARS[s.type].name).join(" and ")} are tied for dominant species.`;
  }
  const singles = species.filter((s) => s.count === 1);
  const lines = [`${AVATARS[top.type].name} is currently the dominant species.`];
  if (singles.length === 1) lines.push(`Only one ${AVATARS[singles[0].type].name} has spawned.`);
  const missing = species.filter((s) => s.count === 0);
  if (missing.length && missing.length <= 2) {
    lines.push(`No ${missing.map((s) => AVATARS[s.type].name).join(" or ")} sightings yet.`);
  }
  return lines.join(" ");
}

export function spreadCaption(stats: QuestionStats): string {
  if (stats.spread >= 32) return "The room is genuinely at war over this.";
  if (stats.spread >= 24) return "Strong opinions on every side.";
  if (stats.spread >= 16) return "A healthy disagreement.";
  if (stats.spread >= 9) return "Mostly on the same page.";
  return "Eerie levels of agreement.";
}
