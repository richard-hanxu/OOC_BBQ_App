import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { PartyProvider } from "@/components/party-provider";
import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { toPublic } from "@/lib/types";

export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const me = await currentParticipant();
  if (!me) redirect("/join");
  if (!me.quizCompletedAt) redirect("/quiz");

  const store = await getStore();
  const participants = (await store.listParticipants()).map(toPublic);
  const initial = { me: toPublic(me), participants, fetchedAt: new Date().toISOString() };

  return (
    <PartyProvider initial={initial}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-4">{children}</div>
      <BottomNav />
    </PartyProvider>
  );
}
