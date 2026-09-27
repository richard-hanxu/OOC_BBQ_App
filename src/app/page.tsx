import { redirect } from "next/navigation";
import { HostProfile } from "@/components/host-profile";
import { GlitterBackground } from "@/components/glitter-background";
import { BigLink } from "@/components/ui-bits";
import { HOSTS } from "@/lib/hosts";
import { currentParticipant } from "@/lib/server/auth";

export default async function WelcomePage() {
  const me = await currentParticipant();
  if (me?.quizCompletedAt) redirect("/me");
  if (me) redirect("/quiz");

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-between overflow-hidden px-6 pb-8 pt-16">
      <GlitterBackground />
      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <h1 className="mt-3 text-balance text-5xl font-extrabold leading-[0.95]">
          Welcome to the
          <br />
          <span className="grad-text">OOC BBQ!</span>
        </h1>
        <p className="mt-5 max-w-sm text-balance text-lg text-white/80">
          Hosted by <HostProfile host={HOSTS.richard} />, <HostProfile host={HOSTS.andrew} />, <HostProfile host={HOSTS.sunny} /> and <HostProfile host={HOSTS.muyang} />.
          {" "}Record your arrival and answer a few icebreaker questions!
        </p>
        <p className="mt-5 max-w-sm text-balance text-lg text-white/80">
          Yes, this was vibe-coded lol
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm font-semibold">
          {["⚡ 2 minutes", "🎭 8 party types", "🤝 Compare responses"].map((t) => (
            <li key={t} className="glass rounded-full px-3 py-1.5">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative z-10 w-full max-w-md space-y-3 safe-bottom">
        <p className="text-center text-sm font-semibold">
          Your answers are permanent once submitted. You can go back and change any answer before submitting.
        </p>
        <BigLink href="/join">Let&apos;s go →</BigLink>
        <p className="text-center text-xs text-muted-foreground">
          We ask for your phone and email so we can reach you after the party about payments or lost items.
          You can choose to share your contact info with other guests or keep it visible only to organizers.
        </p>
      </div>
    </main>
  );
}
