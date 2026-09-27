"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PartySlider } from "@/components/party-slider";
import { BigButton } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { MAX_GROCERY_GUESS, parseGroceryGuess, groceryGuessAnswer } from "@/lib/grocery-guess";
import type { AvatarType } from "@/lib/avatars";
import { displayValueFor } from "@/lib/money";
import { QUESTIONS, QUESTION_COUNT, QUESTION_BY_ID, descriptorFor, type QuestionId } from "@/lib/questions";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "pp_quiz_draft_v1";

type Draft = { index: number; answers: Partial<Record<QuestionId, number>>; touched: QuestionId[]; groceryGuess?: string };
const TOTAL_STEPS = QUESTION_COUNT + 1;

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const draft = raw ? (JSON.parse(raw) as Draft) : null;
    if (draft?.answers && ("drink_pressure" in draft.answers || "vacation_season" in draft.answers)) {
      // A response to the retired question is not a vacation preference.
      const { drink_pressure: _retired, vacation_season: _season, ...answers } = draft.answers as Draft["answers"] & { drink_pressure?: unknown; vacation_season?: unknown };
      void _retired; void _season;
      return {
        ...draft,
        answers,
        index: Math.min(draft.index, QUESTIONS.findIndex((q) => q.id === "vacation_destination")),
        touched: draft.touched.filter((id) => id in QUESTION_BY_ID),
      };
    }
    return draft;
  } catch {
    return null;
  }
}

/**
 * All quiz questions. Slider interaction is purely local; the draft is written to
 * localStorage on release/advance so a refresh keeps progress, and the whole
 * set is sent to the server in one request at the end.
 */
export function Quiz({ firstName }: { firstName: string }) {
  const router = useRouter();
  // Rendered client-only (see QuizLoader), so the draft can seed state directly.
  const [draft] = useState(() => readDraft());
  const [index, setIndex] = useState(() => Math.min(Math.max(0, draft?.index ?? 0), QUESTION_COUNT));
  const [groceryGuess, setGroceryGuess] = useState(draft?.groceryGuess ?? "");
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, number>>>(() => draft?.answers ?? {});
  const [touched, setTouched] = useState<QuestionId[]>(() => draft?.touched ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewAvailable, setReviewAvailable] = useState(false);
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

  const isBonus = index === QUESTION_COUNT;
  const guessAmount = parseGroceryGuess(groceryGuess);
  const q = QUESTIONS[Math.min(index, QUESTION_COUNT - 1)];
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

  async function finish(finalAnswers: Partial<Record<QuestionId, number>>) {
    if (guessAmount === null) { setError("Enter a grocery-cost guess before submitting."); return; }
    const payload: Record<string, number> = {};
    for (const question of QUESTIONS) payload[question.id] = finalAnswers[question.id] ?? 50;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, groceryGuess: guessAmount }),
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
    if (isBonus) {
      if (delta === 1 && guessAmount === null) return;
      persist({ groceryGuess, index: delta === -1 ? QUESTION_COUNT - 1 : QUESTION_COUNT });
      if (delta === -1) { setDir(-1); setIndex(QUESTION_COUNT - 1); }
      else { setReviewing(true); setReviewAvailable(true); }
      window.scrollTo({ top: 0 });
      return;
    }
    if (delta === 1 && q.type === "binary" && value !== 0 && value !== 100) return;
    const nextTouched = touched.includes(q.id) ? touched : [...touched, q.id];
    const nextAnswers = { ...answers, [q.id]: value };
    setTouched(nextTouched);
    setAnswers(nextAnswers);
    const nextIndex = index + delta;
    if (reviewAvailable && delta === 1) {
      persist({ answers: nextAnswers, touched: nextTouched, index });
      setReviewing(true);
      setReviewAvailable(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setDir(delta);
    setIndex(nextIndex);
    persist({ answers: nextAnswers, touched: nextTouched, index: nextIndex });
    window.scrollTo({ top: 0 });
  };

  const isLast = isBonus;

  if (reviewing) {
    return (
      <main className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <h1 className="text-3xl font-extrabold">One last look, {firstName}</h1>
        <p className="mt-3 rounded-2xl border border-sun/40 bg-sun/10 p-4 text-sm font-semibold">
          Your answers are permanent once you submit. Review your {QUESTION_COUNT} icebreakers and bonus grocery guess below, and tap Edit to change anything before submitting.
        </p>
        <ol className="my-5 space-y-3">
          {QUESTIONS.map((question, i) => {
            const answer = answers[question.id] ?? 50;
            return (
              <li key={question.id} className="glass flex items-start gap-3 rounded-2xl p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">{i + 1}. {question.text}</h2>
                  <p className="mt-2 text-sm font-semibold text-sky">{displayValueFor(question, answer)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{descriptorFor(question, answer)}</p>
                </div>
                <button type="button" disabled={submitting} aria-label={`Edit answer ${i + 1}`}
                  className="min-h-11 shrink-0 rounded-full bg-white/10 px-3 text-sm font-bold disabled:opacity-50"
                  onClick={() => {
                    setIndex(i);
                    setDir(-1);
                    setReviewing(false);
                    persist({ index: i });
                    window.scrollTo({ top: 0 });
                  }}>
                  Edit
                </button>
              </li>
            );
          })}
          <li className="glass flex items-start gap-3 rounded-2xl p-4">
            <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{TOTAL_STEPS}. 🛒 Guess the BBQ grocery bill</h2>
              <p className="mt-2 text-sm font-semibold text-sun">{guessAmount === null ? "Enter your guess" : groceryGuessAnswer(guessAmount).display}</p>
              <p className="mt-1 text-xs text-muted-foreground">Closest guess wins a reward; furthest guess gets a playful forfeit. No effect on your personality.</p>
            </div>
            <button type="button" disabled={submitting} aria-label="Edit grocery-cost guess" className="min-h-11 shrink-0 rounded-full bg-white/10 px-3 text-sm font-bold disabled:opacity-50"
              onClick={() => { setIndex(QUESTION_COUNT); setReviewing(false); persist({ index: QUESTION_COUNT }); window.scrollTo({ top: 0 }); }}>Edit</button>
          </li>
        </ol>
        {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/15 p-3 text-sm font-semibold text-destructive">{error}</p>}
        <BigButton variant="lime" disabled={submitting} onClick={() => void finish(answers)}>
          {submitting ? "Revealing your party type…" : "Submit permanently & reveal →"}
        </BigButton>
      </main>
    );
  }

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
          {index + 1} <span className="text-muted-foreground">/ {TOTAL_STEPS}</span>
        </div>
        <div className="w-16" />
      </header>

      <div className="mt-3 flex gap-1" aria-hidden="true">
        {[...QUESTIONS, { id: "grocery_cost_guess" }].map((question, i) => (
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
        key={isBonus ? "grocery_cost_guess" : q.id}
        className={cn("flex flex-1 flex-col pt-6", dir === 1 ? "animate-rise" : "animate-in fade-in slide-in-from-left-4 duration-300")}
      >
        <div className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">
          {isBonus ? "🛒 Bonus round · Reward or forfeit" : q.category}
        </div>
        <h1 className="mt-3 text-balance text-[1.7rem] font-extrabold leading-tight sm:text-3xl">{isBonus ? "The receipts are in… how much do you think the BBQ groceries cost?" : q.text}</h1>

        <div className="my-auto pt-8 pb-2">
          {isBonus ? <div className="space-y-5">
            <p className="text-base leading-relaxed text-white/85">Time to put your supermarket instincts on the line! 🏆 The closest guess bags a reward. The furthest-off guess? A playful forfeit awaits. Choose wisely, BBQ economist.</p>
            <label className="block space-y-2 text-sm font-bold">Your best guess ($)
              <Input type="number" inputMode="decimal" min={0} max={MAX_GROCERY_GUESS} step="0.01" value={groceryGuess} placeholder="0.00" aria-describedby="grocery-guess-help"
                className="mt-2 h-16 rounded-2xl bg-white/5 text-2xl font-extrabold"
                onChange={(e) => { setGroceryGuess(e.target.value); setError(null); persist({ groceryGuess: e.target.value }); }} />
            </label>
            <p id="grocery-guess-help" className="rounded-2xl border border-sun/30 bg-sun/10 p-3 text-sm text-sun">Just for fun—this does not affect your personality or matches, and it is not a payment request. Only you and the organizers can see your guess. Hosts will reveal the total, reward, and forfeit!</p>
            {groceryGuess && guessAmount === null && <p role="alert" className="text-sm text-destructive">Enter $0–$100,000 with up to two decimal places.</p>}
          </div> : <PartySlider question={q} value={value} onChange={setValue} onCommit={commit} />}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/15 px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 safe-bottom">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          You can go back and edit. Answers become permanent only when you submit after reviewing.
        </p>
        <BigButton onClick={() => go(1)} disabled={submitting || (isBonus ? guessAmount === null : q.type === "binary" && value !== 0 && value !== 100)} variant={isLast ? "lime" : "hot"}>
          {reviewAvailable ? "Back to review →" : isLast ? "Review my answers →" : q.type === "binary" || isTouched ? "Next →" : "Right in the middle, next →"}
        </BigButton>
        {!isTouched && !isLast && q.type !== "binary" && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Drag the slider, or leave it at 50 if you really are that neutral.</p>
        )}
      </div>
    </main>
  );
}
