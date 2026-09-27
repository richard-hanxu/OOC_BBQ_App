import { NextResponse } from "next/server";
import { currentParticipant, hashToken, newToken, setParticipantCookie } from "@/lib/server/auth";
import { ValidationError, validateProfile } from "@/lib/server/validate";
import { getStore } from "@/lib/store";
import { toPublic, type ProfileInput } from "@/lib/types";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let profile: ProfileInput;
  try {
    const parsed = validateProfile(body);
    const { consent: _consent, ...rest } = parsed;
    void _consent;
    profile = rest as ProfileInput;
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    }
    throw e;
  }

  // A returning guest re-submitting the form keeps their existing record.
  const existing = await currentParticipant();
  if (existing) {
    const store = await getStore();
    const updated = await store.updateProfile(existing.id, profile);
    return NextResponse.json({ participant: toPublic(updated ?? existing), existing: true });
  }

  const token = newToken();
  const store = await getStore();
  const participant = await store.createParticipant({ ...profile, tokenHash: hashToken(token) });
  await setParticipantCookie(token);
  return NextResponse.json({ participant: toPublic(participant) }, { status: 201 });
}
