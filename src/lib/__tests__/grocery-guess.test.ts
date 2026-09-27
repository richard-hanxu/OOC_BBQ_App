import { describe, expect, it } from "vitest";
import { groceryGuessAnswer, parseGroceryGuess } from "../grocery-guess";
import { compatibilityPercent } from "../compatibility";
import { toPublic, type Participant } from "../types";
import { seedInputs } from "../seed";

describe("bonus grocery guess", () => {
  it("accepts exact dollars/cents without guessing a value for blank input", () => {
    expect(parseGroceryGuess("")).toBeNull();
    expect(parseGroceryGuess("0")).toBe(0);
    expect(parseGroceryGuess("350.75")).toBe(350.75);
    for (const value of ["-1", "abc", "1.234", "Infinity", "100001"]) expect(parseGroceryGuess(value)).toBeNull();
    expect(groceryGuessAnswer(350.75).display).toBe("$350.75");
    expect(groceryGuessAnswer(100000).normalized).toBe(100);
  });
  it("never contributes to compatibility", () => {
    const a = { ...seedInputs()[0].answers, grocery_cost_guess: groceryGuessAnswer(0) };
    const b = { ...a, grocery_cost_guess: groceryGuessAnswer(100000) };
    expect(compatibilityPercent(a, b)).toBe(100);
    expect(compatibilityPercent({ grocery_cost_guess: a.grocery_cost_guess }, { grocery_cost_guess: b.grocery_cost_guess })).toBeNull();
  });
  it("keeps guesses hidden from other attendees", () => {
    const p = { ...seedInputs()[0], id: "guest", answers: { grocery_cost_guess: groceryGuessAnswer(250) } } as Participant;
    expect(toPublic(p).answers).not.toHaveProperty("grocery_cost_guess");
    expect(toPublic(p, { viewerId: p.id }).answers.grocery_cost_guess?.display).toBe("$250.00");
    expect(toPublic(p, { organizer: true }).answers.grocery_cost_guess?.display).toBe("$250.00");
  });
});
