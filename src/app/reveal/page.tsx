import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { funnyObservations } from "@/lib/avatars";
import type { AnswerMap } from "@/lib/dimensions";
import { currentParticipant } from "@/lib/server/auth";
import { Reveal } from "./reveal";

export const metadata: Metadata = { title: "Your Party Type" };

export default async function RevealPage() {
  const me = await currentParticipant();
  if (!me) redirect("/join");
  if (!me.quizCompletedAt || !me.avatarType) redirect("/quiz");

  const map: AnswerMap = {};
  for (const [id, a] of Object.entries(me.answers)) if (a) map[id as keyof AnswerMap] = a.normalized;

  return <Reveal avatar={me.avatarType} observations={funnyObservations(map)} firstName={me.firstName} />;
}
