import { hashToken, newToken, setParticipantCookie } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { SignInRateLimitError, emailKey, phoneKey } from "@/lib/contacts";

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Enter your phone number and email." }, { status: 400 }); }
  if (!body || typeof body.phone !== "string" || typeof body.email !== "string" || body.phone.length > 40 || body.email.length > 120 || phoneKey(body.phone).length < 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKey(body.email))) {
    return Response.json({ error: "Enter your phone number and email." }, { status: 400 });
  }
  try {
    const token = newToken();
    const participant = await (await getStore()).recoverParticipant(body.phone, body.email, hashToken(token));
    if (!participant) return Response.json({ error: "Those details don't match an existing profile. Check both fields, or ask an organizer for help." }, { status: 401 });
    await setParticipantCookie(token);
    return Response.json({ redirectTo: participant.quizCompletedAt ? "/me" : "/quiz" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SignInRateLimitError) return Response.json({ error: error.message }, { status: 429, headers: { "Retry-After": "900" } });
    return Response.json({ error: "Sign-in is temporarily unavailable. Please try again or ask an organizer." }, { status: 503 });
  }
}
