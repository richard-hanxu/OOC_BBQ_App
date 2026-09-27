"use client";

import { useEffect, useState } from "react";
import { AvatarArt } from "@/components/avatar-art";
import { BigLink, Confetti } from "@/components/ui-bits";
import { ALL_AVATAR_TYPES, AVATARS, type AvatarType } from "@/lib/avatars";

const SHUFFLE_MS = 900;

/**
 * Sub-second shuffle through the species, then the real one pops with confetti.
 * Nothing loads here; the avatar is already decided server-side.
 */
export function Reveal({ avatar, observations, firstName }: { avatar: AvatarType; observations: string[]; firstName: string }) {
  const [phase, setPhase] = useState<"shuffle" | "reveal">("shuffle");
  const [shown, setShown] = useState<AvatarType>(ALL_AVATAR_TYPES[0]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setShown(ALL_AVATAR_TYPES[i % ALL_AVATAR_TYPES.length]);
    }, 90);
    const done = setTimeout(() => {
      clearInterval(tick);
      setPhase("reveal");
    }, reduce ? 0 : SHUFFLE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, []);

  const meta = AVATARS[avatar];

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pb-8 pt-10">
      {phase === "reveal" && <Confetti />}
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">Your Party Type</div>

      <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
        {phase === "shuffle" ? (
          <>
            <AvatarArt type={shown} size={200} className="opacity-80 blur-[1px]" />
            <div className="mt-8 text-2xl font-extrabold text-white/60">Consulting the fries…</div>
          </>
        ) : (
          <>
            <div className="animate-reveal">
              <AvatarArt type={avatar} size={220} className="shadow-[0_30px_80px_-20px_rgba(255,255,255,0.35)]" />
            </div>
            <div className="mt-6 text-5xl animate-pop" style={{ animationDelay: "150ms" }} aria-hidden="true">
              {meta.emoji}
            </div>
            <h1
              className="mt-2 text-balance text-4xl font-extrabold leading-none animate-pop"
              style={{
                animationDelay: "250ms",
                background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {meta.title}
            </h1>
            <p className="mt-3 max-w-xs text-balance text-lg text-white/85 animate-rise" style={{ animationDelay: "350ms" }}>
              &ldquo;{meta.tagline}&rdquo;
            </p>

            <ul className="mt-7 w-full space-y-2 text-left">
              {observations.map((o, i) => (
                <li
                  key={o}
                  className="glass flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold animate-rise"
                  style={{ animationDelay: `${450 + i * 120}ms` }}
                >
                  <span aria-hidden="true">{["🔍", "🧐", "📝"][i % 3]}</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-8 w-full safe-bottom" style={{ visibility: phase === "reveal" ? "visible" : "hidden" }}>
        <BigLink href="/me" variant="lime">
          See My Matches →
        </BigLink>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Nice work, {firstName}. Go find out who put fry theft at 94.
        </p>
      </div>
    </main>
  );
}
