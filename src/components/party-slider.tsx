"use client";

import { useId } from "react";
import { moneyDisplay } from "@/lib/money";
import { descriptorFor, moodFor, rangeIndex, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

const RANGE_GRADIENTS: [string, string][] = [
  ["#22d3ee", "#a78bfa"],
  ["#a78bfa", "#ff5fa2"],
  ["#ffb347", "#ff5fa2"],
  ["#ff5fa2", "#ffb347"],
  ["#ffb347", "#a3e635"],
];

interface Props {
  question: Question;
  value: number;
  onChange: (v: number) => void;
  /** Fired on pointer release / keyboard commit. */
  onCommit?: (v: number) => void;
  className?: string;
}

/**
 * One 0–100 slider that reacts as you drag: live caption, mood emoji, hue
 * shift, and (for money questions) a giant dollar figure. Purely local state;
 * no network activity happens here.
 */
export function PartySlider({ question, value, onChange, onCommit, className }: Props) {
  const id = useId();
  const idx = rangeIndex(value);
  const [from, to] = RANGE_GRADIENTS[idx];
  const isMoney = question.type === "money_slider";
  const caption = descriptorFor(question, value);

  if (question.type === "binary") {
    return (
      <fieldset className={cn("space-y-4", className)}>
        <legend className="sr-only">{question.text}</legend>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: 0, label: question.leftLabel, emoji: "🗽" }, { value: 100, label: question.rightLabel, emoji: "🌴" }].map((option) => (
            <label key={option.value} className={cn("relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border p-4 text-center", value === option.value ? "border-sky bg-sky/15" : "glass")}>
              <input type="radio" name={id} value={option.value} checked={value === option.value} className="peer sr-only" onChange={() => { onChange(option.value); onCommit?.(option.value); }} />
              <span aria-hidden="true" className="text-5xl">{option.emoji}</span>
              <span className="text-lg font-extrabold">{option.label}</span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl peer-focus-visible:ring-3 peer-focus-visible:ring-ring" />
            </label>
          ))}
        </div>
        <p aria-live="polite" className="text-center text-sm text-muted-foreground">{caption}</p>
      </fieldset>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div key={idx} className="flex min-h-[112px] flex-col items-center justify-center text-center animate-pop">
        <div className="text-5xl leading-none drop-shadow" aria-hidden="true">
          {moodFor(question, value)}
        </div>
        {isMoney ? (
          <>
            <div className="mt-2 text-4xl font-extrabold tabular tracking-tight" aria-live="polite">
              {moneyDisplay(question, value)}
            </div>
            <div className="mt-1 text-base font-semibold text-white/85">{caption}</div>
          </>
        ) : (
          <div className="mt-3 text-balance text-2xl font-extrabold leading-tight" aria-live="polite">
            {caption}
          </div>
        )}
      </div>

      <div className="px-1">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={() => onCommit?.(value)}
          onTouchEnd={() => onCommit?.(value)}
          onKeyUp={() => onCommit?.(value)}
          onBlur={() => onCommit?.(value)}
          className="party-slider"
          style={{
            ["--fill" as string]: `${value}%`,
            ["--slider-from" as string]: from,
            ["--slider-to" as string]: to,
          }}
          aria-label={question.text}
          aria-valuetext={isMoney ? moneyDisplay(question, value) : caption}
        />
        <div className="mt-2 flex items-start justify-between gap-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <span className="max-w-[45%] text-left">{question.leftLabel}</span>
          <span className="max-w-[45%] text-right">{question.rightLabel}</span>
        </div>
      </div>
    </div>
  );
}

/** Read-only track with one or two markers, used for comparisons and party stats. */
export function MarkerTrack({
  a,
  b,
  labelA = "You",
  labelB,
  className,
  histogram,
}: {
  a?: number;
  b?: number;
  labelA?: string;
  labelB?: string;
  className?: string;
  histogram?: number[];
}) {
  const max = histogram ? Math.max(1, ...histogram) : 1;
  return (
    <div className={cn("relative pt-6 pb-7", className)}>
      {histogram && (
        <div className="absolute inset-x-0 top-0 flex h-6 items-end gap-px px-0.5" aria-hidden="true">
          {histogram.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-white/25" style={{ height: `${(h / max) * 100}%` }} />
          ))}
        </div>
      )}
      <div className="h-3 rounded-full bg-white/10" />
      {a != null && b != null && (
        <div
          className="absolute top-6 h-3 rounded-full bg-white/25"
          style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(a - b)}%` }}
        />
      )}
      {a != null && <Marker value={a} label={labelA} color="#ff5fa2" side="top" />}
      {b != null && <Marker value={b} label={labelB ?? ""} color="#22d3ee" side="bottom" />}
    </div>
  );
}

function Marker({ value, label, color, side }: { value: number; label: string; color: string; side: "top" | "bottom" }) {
  return (
    <div className="absolute top-6 h-3 w-0" style={{ left: `${value}%` }}>
      <div
        className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-[3px] border-white shadow-lg"
        style={{ background: color }}
      />
      <div
        className={cn(
          "absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-bold",
          side === "top" ? "-top-6" : "top-5",
        )}
        style={{ color }}
      >
        {label}
      </div>
    </div>
  );
}
