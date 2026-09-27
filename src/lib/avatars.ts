import { computeDimensions, type AnswerMap, type Dimensions } from "./dimensions";
import { QUESTIONS, type QuestionId } from "./questions";

export type AvatarType =
  | "ghost"
  | "life_of_party"
  | "chameleon"
  | "drinking_machine"
  | "game_goblin"
  | "side_quest"
  | "observer"
  | "kitchen_npc";

export interface AvatarMeta {
  type: AvatarType;
  emoji: string;
  name: string;
  /** Uppercase reveal title, e.g. "THE GHOST". */
  title: string;
  tagline: string;
  /** Tailwind-friendly gradient stops. */
  from: string;
  to: string;
  /** Playful species blurbs used on the Opinions page. */
  plural: string;
}

/** Observer remains readable for legacy profiles but is no longer awarded. */
export type ActiveAvatarType = Exclude<AvatarType, "observer">;

/** Deterministic tie-break order: earlier wins. */
export const AVATAR_ORDER: ActiveAvatarType[] = [
  "life_of_party",
  "ghost",
  "game_goblin",
  "drinking_machine",
  "side_quest",
  "chameleon",
  "kitchen_npc",
];

export const AVATARS: Record<AvatarType, AvatarMeta> = {
  ghost: {
    type: "ghost",
    emoji: "👻",
    name: "Ghost",
    title: "THE GHOST",
    tagline: "You appear. You observe. You disappear without witnesses.",
    from: "#a5b4fc",
    to: "#c084fc",
    plural: "Ghosts",
  },
  life_of_party: {
    type: "life_of_party",
    emoji: "🪩",
    name: "Life of the Party",
    title: "THE LIFE OF THE PARTY",
    tagline: "If nothing is happening, you'll fix that.",
    from: "#f472b6",
    to: "#fbbf24",
    plural: "Lives of the Party",
  },
  chameleon: {
    type: "chameleon",
    emoji: "🦎",
    name: "Chameleon",
    title: "THE CHAMELEON",
    tagline: "Somehow compatible with every corner of the function.",
    from: "#4ade80",
    to: "#22d3ee",
    plural: "Chameleons",
  },
  drinking_machine: {
    type: "drinking_machine",
    emoji: "🤖",
    name: "Drinking Machine",
    title: "THE DRINKING MACHINE",
    tagline: "Energy reserves remain unexplained.",
    from: "#fb7185",
    to: "#f97316",
    plural: "Drinking Machines",
  },
  game_goblin: {
    type: "game_goblin",
    emoji: "🎮",
    name: "Game Goblin",
    title: "THE GAME GOBLIN",
    tagline: "You did not come here to lose.",
    from: "#a3e635",
    to: "#10b981",
    plural: "Game Goblins",
  },
  side_quest: {
    type: "side_quest",
    emoji: "🧭",
    name: "Side Quest",
    title: "THE SIDE QUEST",
    tagline: "Nobody knows where you're going. Including you.",
    from: "#fbbf24",
    to: "#f43f5e",
    plural: "Side Quests",
  },
  observer: {
    type: "observer",
    emoji: "👁",
    name: "The Observer",
    title: "THE OBSERVER",
    tagline: "You know exactly what happened. You just weren't involved.",
    from: "#38bdf8",
    to: "#818cf8",
    plural: "Observers",
  },
  kitchen_npc: {
    type: "kitchen_npc",
    emoji: "🍿",
    name: "Kitchen NPC",
    title: "THE KITCHEN NPC",
    tagline: "Every party eventually comes to you.",
    from: "#fdba74",
    to: "#fde047",
    plural: "Kitchen NPCs",
  },
};

export const ALL_AVATAR_TYPES: ActiveAvatarType[] = [...AVATAR_ORDER];

export function isAvatarType(x: unknown): x is AvatarType {
  return typeof x === "string" && x in AVATARS;
}

// --- feature transforms (all return 0..1) ---------------------------------
const hi = (x: number) => clamp01(x / 100);
const lo = (x: number) => clamp01(1 - x / 100);
const mid = (x: number) => clamp01(1 - Math.abs(x - 50) / 50);
/** Peaks at `center`, hits 0 at ±width. */
const band = (x: number, center: number, width: number) =>
  clamp01(1 - Math.abs(x - center) / width);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Exponent > 1 makes a feature harder to satisfy; < 1 makes it easier. */
const curve = (x: number, p: number) => Math.pow(clamp01(x), p);

export type AvatarScores = Record<ActiveAvatarType, number>;

/**
 * Weighted, normalized (0..1) score per avatar. No randomness: identical
 * answers always yield identical scores. Each avatar depends on at least
 * four inputs so a single question cannot decide the outcome alone.
 */
export function scoreAvatars(d: Dimensions, a: AnswerMap): AvatarScores {
  const g = (id: QuestionId) => a[id] ?? 50;

  const ghost = avg([
    [hi(g("irish_exit")), 1.2],
    [lo(g("aux")), 1],
    [lo(d.intervention), 1],
    [lo(d.socialEnergy), 1.2],
    [lo(g("honesty")), 0.6],
  ]);

  const life_of_party = avg([
    [hi(g("aux")), 1.2],
    [hi(d.intervention), 1],
    [hi(d.socialEnergy), 1.4],
    [band(d.chaos, 68, 45), 1],
    [lo(g("irish_exit")), 0.6],
  ]);

  const dimSpread = spread([
    d.chaos,
    d.socialEnergy,
    d.conscientiousness,
    d.loyalty,
    d.techDelegation,
    d.independencePrice,
  ]);
  const chameleon = avg([
    [curve(lo(d.extremity), 1.6), 2.2],
    [curve(lo(d.variance), 1.4), 1],
    [clamp01(1 - dimSpread / 30), 1],
    [mid(d.chaos), 0.5],
  ]);

  const drinking_machine = avg([
    [hi(g("alcohol_plans")), 1.2],
    [curve(hi(d.chaos), 0.8), 1.5],
    [curve(hi(d.socialEnergy), 0.8), 1],
    [curve(lo(d.minorNormConcern), 0.8), 1.2],
    [hi(g("irish_exit")), 0.4],
    [hi(g("fry")), 0.4],
  ]);

  const game_goblin = avg([
    [hi(d.intervention), 0.8],
    [hi(d.confidence), 1],
    [hi(d.competitiveness), 1.5],
    [band(d.chaos, 70, 45), 0.8],
    [hi(g("smart_button")), 0.6],
  ]);

  // "Unusual" = high chaos while also highly conscientious, or heavy tech
  // delegation while demanding a fortune for independence.
  const unusual = Math.max(
    clamp01(Math.min(d.chaos, d.conscientiousness) / 65),
    clamp01(Math.min(d.techDelegation, d.independencePrice) / 75),
  );
  const side_quest = avg([
    [curve(hi(d.variance), 1.6), 1.2],
    [curve(hi(d.extremity), 1.6), 1],
    [unusual, 1.2],
    [hi(d.independencePrice), 0.4],
  ]);

  const partial: Omit<AvatarScores, "kitchen_npc"> = {
    ghost,
    life_of_party,
    chameleon,
    drinking_machine,
    game_goblin,
    side_quest,
  };
  const maxOther = Math.max(...Object.values(partial));

  const kitchen_npc = avg([
    [mid(d.socialEnergy), 1],
    [band(d.chaos, 38, 35), 1],
    [hi(d.lowStakesOpinions), 1.2],
    [clamp01(1 - maxOther), 1.2],
    [mid(d.techDelegation), 0.4],
  ]);

  return { ...partial, kitchen_npc };
}

function avg(pairs: [number, number][]) {
  let s = 0;
  let w = 0;
  for (const [x, wt] of pairs) {
    s += x * wt;
    w += wt;
  }
  return w ? s / w : 0;
}

function spread(xs: number[]) {
  const m = xs.reduce((p, c) => p + c, 0) / xs.length;
  return Math.sqrt(xs.reduce((p, c) => p + (c - m) ** 2, 0) / xs.length);
}

export function pickAvatar(scores: AvatarScores): ActiveAvatarType {
  let best: ActiveAvatarType = AVATAR_ORDER[0];
  let bestScore = -1;
  for (const t of AVATAR_ORDER) {
    const s = Math.round(scores[t] * 10000) / 10000;
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return best;
}

export interface AvatarResult {
  type: AvatarType;
  scores: AvatarScores;
  dimensions: Dimensions;
  observations: string[];
}

export function assignAvatar(answers: AnswerMap): AvatarResult {
  const dimensions = computeDimensions(answers);
  const scores = scoreAvatars(dimensions, answers);
  const type = pickAvatar(scores);
  return { type, scores, dimensions, observations: funnyObservations(answers) };
}

/** Three one-liners about the most extreme (least neutral) answers. Deterministic. */
export function funnyObservations(answers: AnswerMap, count = 3): string[] {
  return QUESTIONS.map((q) => {
    const value = answers[q.id] ?? 50;
    return { q, value, distance: Math.abs(value - 50) };
  })
    .sort((x, y) => y.distance - x.distance || x.q.id.localeCompare(y.q.id))
    .slice(0, count)
    .map(({ q, value }) => (value >= 50 ? q.observations.high : q.observations.low));
}
