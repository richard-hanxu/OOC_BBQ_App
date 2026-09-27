import { NextResponse } from "next/server";
import { adminConfigured, checkAdminPassword, clearAdminCookie, setAdminCookie } from "@/lib/server/auth";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Set ADMIN_PASSWORD in the environment to enable the organizer page." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!checkAdminPassword(body.password ?? "")) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
