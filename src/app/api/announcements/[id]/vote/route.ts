import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentParticipant();
  if (!me) return Response.json({ error: "Join the party to vote." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !body || typeof body.optionId !== "string") {
    return Response.json({ error: "Choose a valid poll option." }, { status: 400 });
  }
  const result = await (await getStore()).vote(id, me.id, body.optionId);
  if (result !== "ok") {
    return Response.json({ error: result === "closed" ? "This poll is closed." : "This poll or option is unavailable." }, { status: result === "closed" ? 409 : result === "not-found" ? 404 : 400 });
  }
  return Response.json({ ok: true });
}
