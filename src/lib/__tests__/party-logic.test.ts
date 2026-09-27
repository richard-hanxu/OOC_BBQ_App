import { describe, expect, it } from "vitest";
import { ALL_AVATAR_TYPES, assignAvatar, funnyObservations, pickAvatar, scoreAvatars } from "../avatars";
import { compare, compatibilityPercent } from "../compatibility";
import { computeDimensions, type AnswerMap } from "../dimensions";
import { formatMoney, moneyDisplay, moneyValueAt } from "../money";
import { QUESTIONS, QUESTION_BY_ID, descriptorFor, rangeIndex } from "../questions";
import { SEED_PEOPLE, answersFromMap, seedInputs } from "../seed";
import { computePartyStats } from "../stats";
import type { PublicParticipant } from "../types";
import { isCmu, schoolLine } from "../types";

const uniform = (v: number): AnswerMap => Object.fromEntries(QUESTIONS.map((q) => [q.id, v])) as AnswerMap;

describe("questions", () => {
  it("replaces the retired questions with dancing and tonight's drink plans", () => {
    expect(QUESTIONS[10].id).toBe("dancing_ability");
    expect(QUESTIONS[12].id).toBe("alcohol_plans");
    expect(QUESTIONS.map((q) => q.id)).not.toContain("phone_price");
    expect(QUESTIONS.map((q) => q.id)).not.toContain("revenge");
    expect(QUESTIONS.map((q) => q.id)).not.toContain("ai");
    expect(QUESTION_BY_ID.dancing_ability.type).toBe("continuous_slider");
    expect(QUESTION_BY_ID.alcohol_plans.text).toContain("zero drinks is always welcome");
  });
  it("has exactly 15 questions, all with 5 descriptors", () => {
    expect(QUESTIONS).toHaveLength(15);
    for (const q of QUESTIONS) {
      expect(q.descriptors).toHaveLength(5);
      expect(q.partyCaptions).toHaveLength(5);
      expect(q.moods).toHaveLength(5);
      expect(["continuous_slider", "money_slider", "binary"]).toContain(q.type);
      if (q.type === "money_slider") expect(q.stops!.length).toBeGreaterThanOrEqual(9);
    }
  });

  it("maps values to descriptor ranges", () => {
    expect(rangeIndex(0)).toBe(0);
    expect(rangeIndex(20)).toBe(0);
    expect(rangeIndex(21)).toBe(1);
    expect(rangeIndex(50)).toBe(2);
    expect(rangeIndex(80)).toBe(3);
    expect(rangeIndex(100)).toBe(4);
    expect(descriptorFor(QUESTION_BY_ID.fry, 5)).toBe("War crime.");
    expect(descriptorFor(QUESTION_BY_ID.fry, 95)).toBe("Those fries belong to the people.");
    expect(descriptorFor(QUESTION_BY_ID.alcohol_plans, 0)).toBe("Zero or almost none. Here for the BBQ.");
  });
});

describe("money sliders", () => {
  const pay = QUESTION_BY_ID.assistant_pay;
  it("hits the stops at even positions and is monotonic", () => {
    expect(moneyValueAt(pay.stops!, 0)).toBe(0);
    expect(moneyValueAt(pay.stops!, 100)).toBe(100000);
    let prev = -1;
    for (let v = 0; v <= 100; v++) {
      const cur = moneyValueAt(pay.stops!, v);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });
  it("formats with unit and plus sign at the top", () => {
    expect(moneyDisplay(pay, 100)).toBe("$100,000+/year");
    expect(moneyDisplay(pay, 0)).toBe("$0/year");
    expect(moneyDisplay(QUESTION_BY_ID.assistant_salary, 100)).toBe("$1,000,000+/year");
    expect(formatMoney(250000, { compact: true })).toBe("$250k");
    expect(formatMoney(1000000, { compact: true })).toBe("$1M");
  });
});

describe("avatar assignment", () => {
  it("ignores retired AI delegation answers in scoring", () => {
    const answers = uniform(50);
    expect(assignAvatar({ ...answers, ai: 100 } as AnswerMap)).toEqual(assignAvatar(answers));
  });
  it("never offers or scores Observer for new results", () => {
    expect(ALL_AVATAR_TYPES).toHaveLength(7);
    expect(ALL_AVATAR_TYPES).not.toContain("observer");
    for (const p of SEED_PEOPLE) {
      const result = assignAvatar(p.answers);
      expect(result.type).not.toBe("observer");
      expect(result.scores).not.toHaveProperty("observer");
    }
    const scores = Object.fromEntries(ALL_AVATAR_TYPES.map((t) => [t, 0.5])) as ReturnType<typeof scoreAvatars>;
    expect(pickAvatar({ ...scores, observer: 999 } as typeof scores)).not.toBe("observer");
  });

  it("uses dancing for confidence and drinks for party style, not moral judgments", () => {
    const lowDance = computeDimensions({ ...uniform(50), dancing_ability: 0 });
    const highDance = computeDimensions({ ...uniform(50), dancing_ability: 100 });
    expect(highDance.confidence).toBeGreaterThan(lowDance.confidence);
    expect(highDance.independencePrice).toBe(lowDance.independencePrice);
    const noDrinks = assignAvatar({ ...uniform(50), alcohol_plans: 0 });
    const moreDrinks = assignAvatar({ ...uniform(50), alcohol_plans: 100 });
    expect(moreDrinks.scores.drinking_machine).toBeGreaterThan(noDrinks.scores.drinking_machine);
    for (const key of ["conscientiousness", "loyalty", "boundaryRespect", "minorNormConcern", "competitiveness"] as const) {
      expect(moreDrinks.dimensions[key]).toBe(noDrinks.dimensions[key]);
    }
  });
  it("does not infer morality or social behavior from vacation destination", () => {
    const newYork = computeDimensions({ ...uniform(50), vacation_destination: 0 });
    const california = computeDimensions({ ...uniform(50), vacation_destination: 100 });
    const neutral = computeDimensions(uniform(50));
    for (const key of ["boundaryRespect", "conscientiousness", "loyalty", "intervention", "socialEnergy"] as const) {
      expect(newYork[key]).toBe(neutral[key]);
      expect(california[key]).toBe(neutral[key]);
    }
  });
  it("is deterministic", () => {
    for (const p of SEED_PEOPLE) {
      const a = assignAvatar(p.answers);
      const b = assignAvatar({ ...p.answers });
      expect(a.type).toBe(b.type);
      expect(a.scores).toEqual(b.scores);
    }
  });

  it("covers every avatar type across the seed guests", () => {
    const types = new Set(SEED_PEOPLE.map((p) => assignAvatar(p.answers).type));
    for (const t of ALL_AVATAR_TYPES) expect(types.has(t)).toBe(true);
  });

  it("gives a fully neutral guest the Chameleon", () => {
    expect(assignAvatar(uniform(50)).type).toBe("chameleon");
  });

  it("does not let a single question decide the avatar", () => {
    const base = uniform(50);
    for (const q of QUESTIONS) {
      const extremeLow = assignAvatar({ ...base, [q.id]: 0 }).type;
      const extremeHigh = assignAvatar({ ...base, [q.id]: 100 }).type;
      // A lone extreme answer on a neutral profile should keep it Chameleon-ish or at most move one step.
      expect(["chameleon", "kitchen_npc", "ghost", "life_of_party"]).toContain(extremeLow);
      expect(["chameleon", "kitchen_npc", "ghost", "life_of_party"]).toContain(extremeHigh);
    }
  });

  it("breaks exact ties deterministically", () => {
    const scores = Object.fromEntries(ALL_AVATAR_TYPES.map((t) => [t, 0.5])) as ReturnType<typeof scoreAvatars>;
    expect(pickAvatar(scores)).toBe("life_of_party");
    expect(pickAvatar(scores)).toBe(pickAvatar({ ...scores }));
  });

  it("produces three observations from the most extreme answers", () => {
    const obs = funnyObservations({ ...uniform(50), fry: 100, irish_exit: 0, robot: 100 });
    expect(obs).toHaveLength(3);
    expect(obs).toContain("Believes fries belong to the collective.");
    expect(obs).toContain("Personally offended by Irish exits.");
    expect(obs).toContain("Would hand a humanoid robot the house keys.");
  });

  it("keeps all dimensions in 0–100", () => {
    for (const v of [0, 25, 50, 75, 100]) {
      const d = computeDimensions(uniform(v));
      for (const value of Object.values(d)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("compatibility", () => {
  const names = { a: { name: "You", you: true }, b: { name: "Alex", you: false } };

  it("does not reinterpret legacy phone or revenge answers as new answers", () => {
    const older = answersFromMap(uniform(50));
    delete older.dancing_ability;
    delete older.alcohol_plans;
    const legacy = { ...older, phone_price: { normalized: 100, display: "$500,000+" }, revenge: { normalized: 100, display: "They started this." } };
    const comparison = compare(legacy, answersFromMap({ ...uniform(50), dancing_ability: 0, alcohol_plans: 0 }), names);
    expect(comparison.answered).toBe(13);
    expect(comparison.percent).toBe(100);
  });

  it("includes history and lyrics in comparisons without inventing answers for older guests", () => {
    const older = answersFromMap(uniform(50));
    delete older.history_sharing;
    delete older.song_lyrics;
    const current = answersFromMap({ ...uniform(50), history_sharing: 100, song_lyrics: 100 });
    const legacyComparison = compare(older, current, names);
    expect(legacyComparison.answered).toBe(13);
    expect(legacyComparison.percent).toBe(100);
    const comparison = compare(answersFromMap({ ...uniform(50), history_sharing: 0, song_lyrics: 0 }), current, names);
    expect(comparison.answered).toBe(15);
    expect(comparison.starters.join(" ")).toContain("ChatGPT history");
    expect(comparison.starters.join(" ")).toContain("Karaoke duet");
  });

  it("does not reinterpret old drink-etiquette responses as vacation answers", () => {
    const legacy = { ...answersFromMap(uniform(50)), drink_pressure: { normalized: 0, display: "0" } };
    delete legacy.vacation_destination;
    const current = answersFromMap({ ...uniform(50), vacation_destination: 100 });
    const comparison = compare(legacy, current, names);
    expect(comparison.answered).toBe(14);
    expect(comparison.percent).toBe(100);
    expect(comparison.all.some((item) => item.question.id === "vacation_destination")).toBe(false);
  });
  it("is 100% for identical answers and 0% for opposite extremes", () => {
    const a = answersFromMap(uniform(50));
    expect(compatibilityPercent(a, a)).toBe(100);
    expect(compatibilityPercent(answersFromMap(uniform(0)), answersFromMap(uniform(100)))).toBe(0);
  });

  it("averages similarity across all 15 questions and compares money by position", () => {
    const a = answersFromMap({ ...uniform(50), assistant_pay: 0 });
    const b = answersFromMap({ ...uniform(50), assistant_pay: 100 });
    // 14 identical + one fully opposite: (14/15)*100 ≈ 93.33 → 93
    expect(compatibilityPercent(a, b)).toBe(93);
    const c = compare(a, b, names);
    expect(c.moneyGaps[0].question.id).toBe("assistant_pay");
    expect(c.moneyGaps[0].diff).toBe(100);
    expect(c.disagreements[0].question.id).toBe("assistant_pay");
  });

  it("generates question-specific conversation starters for big gaps", () => {
    const a = answersFromMap({ ...uniform(50), fry: 5, irish_exit: 90 });
    const b = answersFromMap({ ...uniform(50), fry: 95, irish_exit: 10 });
    const c = compare(a, b, names);
    expect(c.starters.length).toBe(2);
    expect(c.starters.join(" ")).toMatch(/fry ownership/);
    expect(c.starters.join(" ")).toMatch(/Irish exits are an art form/);
    expect(c.mostInteresting?.question.id).toBe("fry");
  });

  it("is symmetric between the two guests", () => {
    const [alex, maya] = SEED_PEOPLE;
    const a = answersFromMap(alex.answers);
    const m = answersFromMap(maya.answers);
    expect(compatibilityPercent(a, m)).toBe(compatibilityPercent(m, a));
  });
});

describe("party stats", () => {
  const people: PublicParticipant[] = seedInputs().map((s, i) => ({
    id: `p${i}`,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone,
    email: s.email,
    undergraduateUniversity: s.undergraduateUniversity ?? null,
    graduateUniversity: s.graduateUniversity ?? null,
    cmuProgram: s.cmuProgram ?? null,
    avatarType: s.avatarType ?? null,
    quizCompletedAt: s.quizCompletedAt ?? null,
    isSeed: true,
    createdAt: new Date().toISOString(),
    answers: s.answers ?? {},
  }));

  it("computes medians, histograms, and highlights", () => {
    const stats = computePartyStats(people);
    expect(stats.completed).toBe(people.length);
    expect(stats.questions).toHaveLength(15);
    for (const q of stats.questions) {
      expect(q.histogram.reduce((a, b) => a + b, 0)).toBe(people.length);
      expect(q.median).toBeGreaterThanOrEqual(0);
      expect(q.median).toBeLessThanOrEqual(100);
    }
    expect(stats.mostDivisive?.question.type).toBe("continuous_slider");
    expect(stats.biggestMoneyGap?.question.type).toBe("money_slider");
    expect(stats.species.reduce((s, x) => s + x.count, 0)).toBe(people.length);
  });
});

describe("profile helpers", () => {
  it("detects CMU spellings", () => {
    expect(isCmu("Carnegie Mellon University")).toBe(true);
    expect(isCmu("CMU")).toBe(true);
    expect(isCmu("cmu")).toBe(true);
    expect(isCmu("University of Toronto")).toBe(false);
    expect(isCmu(null)).toBe(false);
  });
  it("builds the school line", () => {
    expect(schoolLine({ undergraduateUniversity: "UC Berkeley", graduateUniversity: "CMU", cmuProgram: "MS Robotics" })).toBe("CMU • MS Robotics");
    expect(schoolLine({ undergraduateUniversity: "University of Toronto", graduateUniversity: null, cmuProgram: null })).toBe("University of Toronto");
  });
});
