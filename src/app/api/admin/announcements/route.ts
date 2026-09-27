import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { announcementFor, validateAnnouncement } from "@/lib/announcements";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const announcements = (await (await getStore()).listAnnouncements()).map((item) => announcementFor(item));
  return Response.json({ announcements }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let input;
  try { input = validateAnnouncement(await req.json()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid announcement." }, { status: 400 }); }
  const announcement = await (await getStore()).createAnnouncement(input);
  return Response.json({ announcement: announcementFor(announcement) }, { status: 201 });
}
