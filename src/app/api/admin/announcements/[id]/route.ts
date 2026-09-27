import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return Response.json({ error: "Invalid announcement." }, { status: 400 });
  const found = await (await getStore()).deleteAnnouncement(id);
  return Response.json(found ? { ok: true } : { error: "Announcement not found." }, { status: found ? 200 : 404 });
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return Response.json({ error: "Invalid announcement." }, { status: 400 });
  const found = await (await getStore()).closeAnnouncement(id);
  return Response.json(found ? { ok: true } : { error: "Announcement not found." }, { status: found ? 200 : 404 });
}
