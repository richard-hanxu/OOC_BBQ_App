import type { Question } from "./questions";

/**
 * Money sliders map a 0–100 slider position onto a nonlinear set of dollar
 * stops using piecewise-linear interpolation. Compatibility always compares
 * the normalized position, never the dollar amount.
 */
export function moneyValueAt(stops: number[], normalized: number): number {
  const n = clamp(normalized, 0, 100);
  const segments = stops.length - 1;
  const pos = (n / 100) * segments;
  const i = Math.min(Math.floor(pos), segments - 1);
  const frac = pos - i;
  const raw = stops[i] + frac * (stops[i + 1] - stops[i]);
  return roundNice(raw);
}

function roundNice(value: number): number {
  if (value < 1000) return Math.round(value / 50) * 50;
  if (value < 10000) return Math.round(value / 100) * 100;
  if (value < 100000) return Math.round(value / 1000) * 1000;
  return Math.round(value / 5000) * 5000;
}

export function formatMoney(amount: number, opts: { plus?: boolean; unit?: string; compact?: boolean } = {}) {
  const compact = opts.compact
    ? amount >= 1_000_000
      ? `$${trimZero(amount / 1_000_000)}M`
      : amount >= 1000
        ? `$${trimZero(amount / 1000)}k`
        : `$${amount}`
    : `$${amount.toLocaleString("en-US")}`;
  return `${compact}${opts.plus ? "+" : ""}${opts.unit ?? ""}`;
}

function trimZero(n: number) {
  const s = n.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Full display string for a money question at a normalized position. */
export function moneyDisplay(q: Question, normalized: number, compact = false): string {
  if (!q.stops) return String(normalized);
  const amount = moneyValueAt(q.stops, normalized);
  return formatMoney(amount, { plus: normalized >= 100, unit: q.unit, compact });
}

/** The string stored as display_value for any question type. */
export function displayValueFor(q: Question, normalized: number): string {
  if (q.type === "binary") return normalized === 0 ? q.leftLabel : normalized === 100 ? q.rightLabel : "Even split";
  return q.type === "money_slider" ? moneyDisplay(q, normalized) : String(Math.round(normalized));
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
