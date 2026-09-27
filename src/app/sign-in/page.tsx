import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { currentParticipant } from "@/lib/server/auth";

export const metadata = { title: "Welcome back" };

export default async function SignInPage() {
  const me = await currentParticipant();
  if (me) redirect(me.quizCompletedAt ? "/me" : "/quiz");
  return <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-10">
    <Link href="/" className="mb-8 text-sm font-bold text-muted-foreground">← Back to welcome</Link>
    <h1 className="text-4xl font-extrabold">Welcome back!</h1>
    <p className="mt-3 text-white/75">Enter the phone number and email you used to join. We&apos;ll bring back your profile and saved results—no second account needed.</p>
    <SignInForm />
    <Link href="/join" className="mt-6 text-center text-sm font-bold text-sky">First time here? Join the party →</Link>
  </main>;
}
