"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PartySlider } from "@/components/party-slider";
import { BigButton } from "@/components/ui-bits";
import type { AvatarType } from "@/lib/avatars";
import { QUESTIONS, QUESTION_COUNT, type QuestionId } from "@/lib/questions";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "pp_quiz_draft_v1";

type Draft = { index: number; answers: Partial<Record<QuestionId, number>>; touched: QuestionId[] };

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/**
 * All 14 sliders. Slider interaction is purely local; the draft is written to
 * localStorage on release/advance so a refresh keeps progress, and the whole
 * set is sent to the server in one request at the end.
 */
export function Quiz({ firstName }: { firstName: string }) {
  const router = useRouter();
  // Rendered client-only (see QuizLoader), so the draft can seed state directly.
  const [draft] = useState(() => readDraft());
  const [index, setIndex] = useState(() => Math.min(Math.max(0, draft?.index ?? 0), QUESTION_COUNT - 1));
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, number>>>(() => draft?.answers ?? {});
  const [touched, setTouched] = useState<QuestionId[]>(() => draft?.touched ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);

  const persist = useCallback((next: Partial<Draft>) => {
    try {
      const current = readDraft() ?? { index: 0, answers: {}, touched: [] };
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...next }));
    } catch {
      /* private mode etc. — the in-memory state still works */
    }
  }, []);

  const q = QUESTIONS[index];
  const value = answers[q.id] ?? 50;
  const isTouched = touched.includes(q.id);

  const setValue = (v: number) => {
    setAnswers((a) => ({ ...a, [q.id]: v }));
    if (!isTouched) setTouched((t) => [...t, q.id]);
  };

  const commit = (v: number) => {
    const nextAnswers = { ...answers, [q.id]: v };
    const nextTouched = touched.includes(q.id) ? touched : [...touched, q.id];
    persist({ answers: nextAnswers, touched: nextTouched });
  };

  const allAnswers = useMemo(() => {
    const out: Record<string, number> = {};
    for (const question of QUESTIONS) out[question.id] = answers[question.id] ?? 50;
    return out;
  }, [answers]);

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        avatar?: AvatarType;
        observations?: string[];
        error?: string;
      };
      if (res.status === 409) {
        localStorage.removeItem(DRAFT_KEY);
        router.replace("/me");
        return;
      }
      if (res.status === 401) {
        router.replace("/join");
        return;
      }
      if (!res.ok || !json.avatar) throw new Error(json.error ?? "Save failed");
      localStorage.removeItem(DRAFT_KEY);
      router.push("/reveal");
    } catch (e) {
      setError(e instanceof Error && e.message !== "Save failed" ? e.message : "Couldn't save your answers. Your progress is kept on this phone — try again.");
      setSubmitting(false);
    }
  }

  const go = (delta: 1 | -1) => {
    const nextTouched = touched.includes(q.id) ? touched : [...touched, q.id];
    const nextAnswers = { ...answers, [q.id]: value };
    setTouched(nextTouched);
    setAnswers(nextAnswers);
    const nextIndex = index + delta;
    if (nextIndex >= QUESTION_COUNT) {
      persist({ answers: nextAnswers, touched: nextTouched, index });
      void finish();
      return;
    }
    setDir(delta);
    setIndex(nextIndex);
    persist({ answers: nextAnswers, touched: nextTouched, index: nextIndex });
    window.scrollTo({ top: 0 });
  };

  const isLast = index === QUESTION_COUNT - 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-5">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0 || submitting}
          className="rounded-full px-3 py-2 text-sm font-bold text-muted-foreground disabled:opacity-0"
        >
          ← Back
        </button>
        <div className="text-xl font-extrabold tabular">
          {index + 1} <span className="text-muted-foreground">/ {QUESTION_COUNT}</span>
        </div>
        <div className="w-16" />
      </header>

      <div className="mt-3 flex gap-1" aria-hidden="true">
        {QUESTIONS.map((question, i) => (
          <div
            key={question.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < index ? "grad-lime" : i === index ? "grad-hot" : "bg-white/15",
            )}
          />
        ))}
      </div>

      <section
        key={q.id}
        className={cn("flex flex-1 flex-col pt-6", dir === 1 ? "animate-rise" : "animate-in fade-in slide-in-from-left-4 duration-300")}
      >
        <div className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">
          {q.category}
        </div>
        <h1 className="mt-3 text-balance text-[1.7rem] font-extrabold leading-tight sm:text-3xl">{q.text}</h1>

        <div className="mt-auto pt-6">
          <PartySlider question={q} value={value} onChange={setValue} onCommit={commit} />
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/15 px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 safe-bottom">
        <BigButton onClick={() => go(1)} disabled={submitting} variant={isLast ? "lime" : "hot"}>
          {submitting ? "Calculating your party type…" : isLast ? `Reveal my party type, ${firstName} →` : isTouched ? "Next →" : "Right in the middle, next →"}
        </BigButton>
        {!isTouched && !isLast && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Drag the slider, or leave it at 50 if you really are that neutral.</p>
        )}
      </div>
    </main>
  );
}
