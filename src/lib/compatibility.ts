import { moneyDisplay } from "./money";
import { QUESTIONS, descriptorFor, type Question, type Subject } from "./questions";
import type { Answers, PublicParticipant } from "./types";

export interface QuestionComparison {
  question: Question;
  a: number;
  b: number;
  aDisplay: string;
  bDisplay: string;
  aCaption: string;
  bCaption: string;
  diff: number;
  similarity: number;
}

export interface Comparison {
  /** 0–100, rounded. */
  percent: number;
  answered: number;
  all: QuestionComparison[];
  closest: QuestionComparison[];
  disagreements: QuestionComparison[];
  moneyGaps: (QuestionComparison & { caption: string })[];
  mostInteresting: QuestionComparison | null;
  starters: string[];
}

export function hasCompletedQuiz(p: Pick<PublicParticipant, "quizCompletedAt">) {
  return Boolean(p.quizCompletedAt);
}

function compareQuestion(q: Question, a: Answers, b: Answers): QuestionComparison | null {
  const av = a[q.id]?.normalized;
  const bv = b[q.id]?.normalized;
  if (av == null || bv == null) return null;
  const diff = Math.abs(av - bv);
  return {
    question: q,
    a: av,
    b: bv,
    aDisplay: q.type === "money_slider" ? moneyDisplay(q, av) : String(Math.round(av)),
    bDisplay: q.type === "money_slider" ? moneyDisplay(q, bv) : String(Math.round(bv)),
    aCaption: descriptorFor(q, av),
    bCaption: descriptorFor(q, bv),
    diff,
    similarity: 1 - diff / 100,
  };
}

/** Plain percentage only; cheap enough to run for every card in a list. */
export function compatibilityPercent(a: Answers, b: Answers): number | null {
  let sum = 0;
  let n = 0;
  for (const q of QUESTIONS) {
    const av = a[q.id]?.normalized;
    const bv = b[q.id]?.normalized;
    if (av == null || bv == null) continue;
    sum += 1 - Math.abs(av - bv) / 100;
    n++;
  }
  return n === 0 ? null : Math.round((sum / n) * 100);
}

/**
 * Full comparison between "me" (a) and another guest (b). Deterministic; ties
 * are broken by question order so both parties see the same result.
 */
export function compare(
  a: Answers,
  b: Answers,
  names: { a: Subject; b: Subject },
): Comparison {
  const all = QUESTIONS.map((q) => compareQuestion(q, a, b)).filter(
    (x): x is QuestionComparison => x !== null,
  );
  const answered = all.length;
  const percent = answered
    ? Math.round((all.reduce((s, x) => s + x.similarity, 0) / answered) * 100)
    : 0;

  const byClosest = [...all].sort((x, y) => x.diff - y.diff);
  const byFarthest = [...all].sort((x, y) => y.diff - x.diff);
  const nonMoneyFar = byFarthest.filter((x) => x.question.type === "continuous_slider");

  const moneyGaps = all
    .filter((x) => x.question.type === "money_slider")
    .sort((x, y) => y.diff - x.diff)
    .map((x) => {
      const hi = x.a >= x.b ? names.a : names.b;
      const lo = x.a >= x.b ? names.b : names.a;
      const caption =
        x.diff < 12
          ? "Basically the same price tag."
          : x.question.moneyGapTemplate?.(hi, lo) ?? x.question.conversationTemplate(hi, lo);
      return { ...x, caption };
    });

  const starters = byFarthest
    .filter((x) => x.diff >= 35)
    .slice(0, 3)
    .map((x) => {
      const hi = x.a >= x.b ? names.a : names.b;
      const lo = x.a >= x.b ? names.b : names.a;
      return x.question.conversationTemplate(hi, lo);
    });

  return {
    percent,
    answered,
    all,
    closest: byClosest.slice(0, 3),
    disagreements: byFarthest.slice(0, 3),
    moneyGaps,
    mostInteresting: nonMoneyFar[0] ?? byFarthest[0] ?? null,
    starters,
  };
}

export function closenessCaption(diff: number): string {
  if (diff <= 3) return "Basically identical.";
  if (diff <= 8) return "Same wavelength.";
  if (diff <= 15) return "Close enough to share a plate.";
  if (diff <= 30) return "Mild friction.";
  if (diff <= 50) return "Noticeably different.";
  if (diff <= 70) return "You will argue about this.";
  return "Complete opposites.";
}

export function alignmentVibe(percent: number): string {
  if (percent >= 90) return "Suspiciously aligned";
  if (percent >= 80) return "Strong match";
  if (percent >= 70) return "Mostly aligned";
  if (percent >= 60) return "Some friction";
  if (percent >= 50) return "Healthy disagreement";
  if (percent >= 40) return "Chaotic pairing";
  return "Polar opposites";
}
