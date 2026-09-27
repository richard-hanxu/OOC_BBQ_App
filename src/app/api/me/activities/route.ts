import { NextResponse } from "next/server";
import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { isActivityId, toPublic, type ActivityId } from "@/lib/types";

export async function PUT(req: Request) {
  const me = await currentParticipant();
  if (!me) return NextResponse.json({ error: "Not joined" }, { status: 401 });
  let body: { activities?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.activities)) {
    return NextResponse.json({ error: "activities must be an array" }, { status: 400 });
  }
  const activities = body.activities.filter(isActivityId) as ActivityId[];
  const store = await getStore();
  const updated = await store.setActivities(me.id, activities);
  return NextResponse.json({ participant: toPublic(updated ?? me) });
}
