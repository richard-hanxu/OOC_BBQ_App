import { NextResponse } from "next/server";
import { currentParticipant } from "@/lib/server/auth";
import { ValidationError, validateProfile } from "@/lib/server/validate";
import { getStore } from "@/lib/store";
import { isCmu, toPublic } from "@/lib/types";

export async function GET() {
  const me = await currentParticipant();
  if (!me) return NextResponse.json({ participant: null }, { status: 401 });
  return NextResponse.json({ participant: toPublic(me) });
}

export async function PATCH(req: Request) {
  const me = await currentParticipant();
  if (!me) return NextResponse.json({ error: "Not joined" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const patch = validateProfile(body, { partial: true });
    delete patch.consent;
    const undergrad = patch.undergraduateUniversity !== undefined ? patch.undergraduateUniversity : me.undergraduateUniversity;
    const grad = patch.graduateUniversity !== undefined ? patch.graduateUniversity : me.graduateUniversity;
    if (!isCmu(undergrad) && !isCmu(grad)) patch.cmuProgram = null;
    const store = await getStore();
    const updated = await store.updateProfile(me.id, patch);
    return NextResponse.json({ participant: toPublic(updated ?? me) });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    throw e;
  }
}
