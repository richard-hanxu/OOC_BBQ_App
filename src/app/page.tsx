import { redirect } from "next/navigation";
import { AvatarArt } from "@/components/avatar-art";
import { BigLink, FloatingIcons } from "@/components/ui-bits";
import { ALL_AVATAR_TYPES } from "@/lib/avatars";
import { currentParticipant } from "@/lib/server/auth";

export default async function WelcomePage() {
  const me = await currentParticipant();
  if (me?.quizCompletedAt) redirect("/me");
  if (me) redirect("/quiz");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden px-6 pb-8 pt-16">
      <FloatingIcons icons={["🏊", "🏓", "🎱", "🎲", "🍟", "🪩", "👻", "🤖"]} />
      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex -space-x-3">
          {ALL_AVATAR_TYPES.slice(0, 5).map((t, i) => (
            <AvatarArt key={t} type={t} size={56} className="border-4 border-background animate-pop" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">Private party directory</div>
        <h1 className="mt-3 text-balance text-5xl font-extrabold leading-[0.95]">
          Judge <span className="grad-text">everything.</span>
          <br />
          Find your people.
        </h1>
        <p className="mt-5 max-w-sm text-balance text-lg text-white/80">
          14 sliders about fries, robots, Irish exits and questionable money decisions. Get your party type, then
          find out who at this party you completely disagree with.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm font-semibold">
          {["⚡ 2 minutes", "🎭 8 party types", "🏓 Find people who are down"].map((t) => (
            <li key={t} className="glass rounded-full px-3 py-1.5">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative z-10 w-full max-w-md space-y-3 safe-bottom">
        <BigLink href="/join">Let&apos;s go →</BigLink>
        <p className="text-center text-xs text-muted-foreground">
          Your contact info is only visible to other guests at this party. Nothing here is public.
        </p>
      </div>
    </main>
  );
}
