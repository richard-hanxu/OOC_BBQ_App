import type { Answer } from "./types";

export const GROCERY_GUESS_ID = "grocery_cost_guess" as const;
export const MAX_GROCERY_GUESS = 100000;

export function validGroceryGuess(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_GROCERY_GUESS
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

export function parseGroceryGuess(text: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(text.trim())) return null;
  const value = Number(text);
  return validGroceryGuess(value) ? value : null;
}

// Bonus answer uses the existing answers table, but is NOT a personality QuestionId.
// The display stores exact dollars/cents; normalized preserves the table's 0–100 range.
export function groceryGuessAnswer(amount: number): Answer {
  if (!validGroceryGuess(amount)) throw new Error("Invalid grocery guess");
  return { normalized: amount / MAX_GROCERY_GUESS * 100, display: `$${amount.toFixed(2)}` };
}
