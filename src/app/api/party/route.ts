import { NextResponse } from "next/server";
import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { toPublic } from "@/lib/types";

/**
 * The whole private directory in one request: the viewer plus every guest
 * (with answers and activities) so compatibility can be computed on-device
 * without a round trip per card. Only joined guests can read it.
 */
export async function GET() {
  const me = await currentParticipant();
  if (!me) return NextResponse.json({ error: "Not joined" }, { status: 401 });
  const store = await getStore();
  const all = await store.listParticipants();
  return NextResponse.json(
    {
      me: toPublic(me),
      participants: all.map(toPublic),
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
