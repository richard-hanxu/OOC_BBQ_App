import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingHeader } from "@/components/onboarding-header";
import { currentParticipant } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { ACTIVITIES, type ActivityId } from "@/lib/types";
import { ActivitiesOnboarding } from "./activities-onboarding";

export const metadata: Metadata = { title: "Activities" };

export default async function ActivitiesStep() {
  const me = await currentParticipant();
  if (!me) redirect("/join");
  if (me.quizCompletedAt) redirect("/me");

  const store = await getStore();
  const all = await store.listParticipants();
  const counts = Object.fromEntries(
    ACTIVITIES.map((a) => [a.id, all.filter((p) => p.id !== me.id && p.activities.includes(a.id)).length]),
  ) as Record<ActivityId, number>;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-6">
      <OnboardingHeader step={2} />
      <h1 className="mt-4 text-4xl font-extrabold leading-tight">What are you down to do right now?</h1>
      <p className="mt-2 text-white/75">Pick as many as you want. You can change this any time tonight.</p>
      <ActivitiesOnboarding initial={me.activities} counts={counts} />
    </main>
  );
}
