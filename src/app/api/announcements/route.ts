import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { announcementFor } from "@/lib/announcements";

export async function GET() {
  const me = await currentParticipant();
  if (!me) return Response.json({ error: "Join the party to see announcements." }, { status: 401 });
  const announcements = (await (await getStore()).listAnnouncements()).map((item) => announcementFor(item, me.id));
  return Response.json({ announcements }, { headers: { "Cache-Control": "private, no-store" } });
}
