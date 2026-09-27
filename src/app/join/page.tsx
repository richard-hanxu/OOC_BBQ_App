import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { OnboardingHeader } from "@/components/onboarding-header";
import { currentParticipant } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Join" };

export default async function JoinPage() {
  const me = await currentParticipant();
  if (me?.quizCompletedAt) redirect("/me");
  if (me) redirect("/quiz");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-6">
      <OnboardingHeader step={1} />
      <h1 className="mt-4 text-4xl font-extrabold leading-tight">Who are you?</h1>
      <p className="mt-2 text-white/75">
        Your phone and email help us reach you after the party about payments or lost items.
        You choose whether other guests can see them or only the organizers.
      </p>
      <div className="mt-6">
        <ProfileForm />
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already joined on this phone?{" "}
        <Link href="/me" className="underline">
          Go to your results
        </Link>
        .
      </p>
    </main>
  );
}
