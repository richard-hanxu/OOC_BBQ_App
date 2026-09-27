import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { toPublic } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const store = await getStore();
  const ok = await store.deleteParticipant(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

/** Organizer-only quiz reset so a guest can retake it. */
export async function POST(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const store = await getStore();
  const updated = await store.resetQuiz(id);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ participant: toPublic(updated) });
}
