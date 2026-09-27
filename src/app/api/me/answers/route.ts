import { NextResponse } from "next/server";
import { assignAvatar } from "@/lib/avatars";
import type { AnswerMap } from "@/lib/dimensions";
import { clamp, displayValueFor } from "@/lib/money";
import { QUESTIONS, type QuestionId } from "@/lib/questions";
import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { toPublic, type Answers } from "@/lib/types";

/** Batched write of all 14 answers. Computes and stores the avatar server-side. */
export async function POST(req: Request) {
  const me = await currentParticipant();
  if (!me) return NextResponse.json({ error: "Not joined" }, { status: 401 });
  if (me.quizCompletedAt) {
    return NextResponse.json(
      { error: "You already finished the quiz. Ask the organizer to reset it.", participant: toPublic(me) },
      { status: 409 },
    );
  }

  let body: { answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = body.answers ?? {};
  const map: AnswerMap = {};
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const v = raw[q.id];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return NextResponse.json({ error: `Missing answer for question ${q.id}` }, { status: 400 });
    }
    const normalized = Math.round(clamp(v, 0, 100) * 100) / 100;
    map[q.id as QuestionId] = normalized;
    answers[q.id] = { normalized, display: displayValueFor(q, normalized) };
  }

  const result = assignAvatar(map);
  const store = await getStore();
  const updated = await store.saveAnswers(me.id, answers, result.type);
  return NextResponse.json({
    participant: toPublic(updated ?? me),
    avatar: result.type,
    observations: result.observations,
  });
}
