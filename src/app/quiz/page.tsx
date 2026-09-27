import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParticipant } from "@/lib/server/auth";
import { QuizLoader } from "./quiz-loader";

export const metadata: Metadata = { title: "The Quiz" };

export default async function QuizPage() {
  const me = await currentParticipant();
  if (!me) redirect("/join");
  if (me.quizCompletedAt) redirect("/me");
  return <QuizLoader firstName={me.firstName} />;
}
