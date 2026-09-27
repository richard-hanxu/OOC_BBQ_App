import { CONTINUOUS_QUESTION_IDS, type QuestionId } from "./questions";

/** Normalized answers keyed by question id, each 0–100. */
export type AnswerMap = Partial<Record<QuestionId, number>>;

export interface Dimensions {
  chaos: number;
  socialEnergy: number;
  conscientiousness: number;
  loyalty: number;
  techDelegation: number;
  luxury: number;
  independencePrice: number;
  extremity: number;
  variance: number;
  intervention: number;
  boundaryRespect: number;
  minorNormConcern: number;
  confidence: number;
  competitiveness: number;
  lowStakesOpinions: number;
}

const get = (a: AnswerMap, id: QuestionId) => a[id] ?? 50;
const inv = (x: number) => 100 - x;

function weighted(pairs: [number, number][]): number {
  let total = 0;
  let sum = 0;
  for (const [value, w] of pairs) {
    sum += value * w;
    total += w;
  }
  return total === 0 ? 50 : sum / total;
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * Lightweight, non-scientific party dimensions derived from the 14 sliders.
 * Every dimension is on a 0–100 scale. Deterministic.
 */
export function computeDimensions(a: AnswerMap): Dimensions {
  const nonMoney = CONTINUOUS_QUESTION_IDS.map((id) => get(a, id));
  const extremity = (mean(nonMoney.map((x) => Math.abs(x - 50))) / 50) * 100;
  const variance = Math.min(100, (stddev(nonMoney) / 40) * 100);

  const intervention = weighted([
    [get(a, "aux"), 1],
    [get(a, "honesty"), 1],
    [get(a, "drink_pressure"), 1],
  ]);

  const chaosRaw = weighted([
    [get(a, "aux"), 1],
    [get(a, "smart_button"), 1],
    [get(a, "irish_exit"), 1],
    [get(a, "fry"), 1],
    [get(a, "revenge"), 1],
  ]);
  const chaos = chaosRaw * 0.8 + extremity * 0.2;

  const socialEnergy = weighted([
    [get(a, "aux"), 0.3],
    [get(a, "honesty"), 0.3],
    [inv(get(a, "irish_exit")), 0.25],
    [get(a, "drink_pressure"), 0.15],
  ]);

  const conscientiousness = weighted([
    [get(a, "floor_money"), 0.3],
    [get(a, "drink_pressure"), 0.2],
    [get(a, "move_help"), 0.25],
    [inv(get(a, "irish_exit")), 0.1],
    [inv(get(a, "fry")), 0.075],
    [inv(get(a, "revenge")), 0.075],
  ]);

  const loyalty = weighted([
    [get(a, "move_help"), 0.5],
    [get(a, "honesty"), 0.25],
    [get(a, "drink_pressure"), 0.25],
  ]);

  const techDelegation = mean([get(a, "ai"), get(a, "robot")]);
  const luxury = get(a, "assistant_pay");
  const independencePrice = mean([get(a, "assistant_salary"), get(a, "phone_price")]);

  const boundaryRespect = weighted([
    [get(a, "drink_pressure"), 0.7],
    [inv(get(a, "fry")), 0.3],
  ]);

  const minorNormConcern = weighted([
    [inv(get(a, "fry")), 1],
    [inv(get(a, "irish_exit")), 1],
    [get(a, "floor_money"), 1],
    [inv(get(a, "revenge")), 0.6],
  ]);

  const confidence = weighted([
    [get(a, "honesty"), 1],
    [get(a, "aux"), 1],
    [get(a, "assistant_salary"), 1],
  ]);

  const competitiveness = weighted([
    [get(a, "revenge"), 0.4],
    [get(a, "smart_button"), 0.3],
    [get(a, "honesty"), 0.3],
  ]);

  const lowStakesOpinions =
    (mean(
      (["fry", "aux", "irish_exit", "revenge", "floor_money"] as QuestionId[]).map((id) =>
        Math.abs(get(a, id) - 50),
      ),
    ) /
      50) *
    100;

  return {
    chaos,
    socialEnergy,
    conscientiousness,
    loyalty,
    techDelegation,
    luxury,
    independencePrice,
    extremity,
    variance,
    intervention,
    boundaryRespect,
    minorNormConcern,
    confidence,
    competitiveness,
    lowStakesOpinions,
  };
}
