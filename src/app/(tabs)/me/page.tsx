"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AvatarArt } from "@/components/avatar-art";
import { ParticipantCard } from "@/components/participant-card";
import { useParty } from "@/components/party-provider";
import { Card, CountUp, EmptyState, SectionTitle, Skeleton } from "@/components/ui-bits";
import { AVATARS, funnyObservations } from "@/lib/avatars";
import { compare, compatibilityPercent } from "@/lib/compatibility";
import type { AnswerMap } from "@/lib/dimensions";
import { QUESTIONS, type Subject } from "@/lib/questions";
import { ACTIVITY_BY_ID, fullName, schoolLine, type PublicParticipant } from "@/lib/types";

export default function MePage() {
  const { data, loading } = useParty();

  const derived = useMemo(() => {
    if (!data) return null;
    const me = data.me;
    const others = data.participants.filter((p) => p.id !== me.id && p.quizCompletedAt);
    const scored = others
      .map((p) => ({ p, percent: compatibilityPercent(me.answers, p.answers) ?? 0 }))
      .sort((a, b) => b.percent - a.percent || a.p.firstName.localeCompare(b.p.firstName));
    const best = scored[0] ?? null;
    const worst = scored.length > 1 ? scored[scored.length - 1] : null;

    // Biggest single disagreement and money gap across everyone (deterministic).
    let biggest: { p: PublicParticipant; text: string; diff: number } | null = null;
    let money: { p: PublicParticipant; text: string; diff: number } | null = null;
    const meSubject: Subject = { name: "You", you: true };
    for (const p of others) {
      const c = compare(me.answers, p.answers, { a: meSubject, b: { name: p.firstName, you: false } });
      const d = c.mostInteresting;
      if (d && (!biggest || d.diff > biggest.diff)) {
        const hi = d.a >= d.b ? meSubject : { name: p.firstName, you: false };
        const lo = d.a >= d.b ? { name: p.firstName, you: false } : meSubject;
        biggest = { p, diff: d.diff, text: d.question.conversationTemplate(hi, lo) };
      }
      const m = c.moneyGaps[0];
      if (m && (!money || m.diff > money.diff)) {
        const mine = m.aDisplay;
        const theirs = m.bDisplay;
        money = {
          p,
          diff: m.diff,
          text:
            m.question.id === "phone_price"
              ? `You'd give up your phone for ${mine}. ${p.firstName} requires ${theirs}.`
              : m.question.id === "assistant_pay"
                ? `You'd pay ${mine} for a personal assistant. ${p.firstName} would pay ${theirs}.`
                : `You'd need ${mine} to be someone's assistant. ${p.firstName} needs ${theirs}.`,
        };
      }
    }

    const map: AnswerMap = {};
    for (const q of QUESTIONS) {
      const a = me.answers[q.id];
      if (a) map[q.id] = a.normalized;
    }

    const activityMatches = me.activities.map((id) => ({
      id,
      count: data.participants.filter((p) => p.id !== me.id && p.activities.includes(id)).length,
    }));

    return { me, others, best, worst, biggest, money, observations: funnyObservations(map), activityMatches };
  }, [data]);

  if (loading || !derived) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const { me, others, best, worst, biggest, money, observations, activityMatches } = derived;
  const meta = me.avatarType ? AVATARS[me.avatarType] : null;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Your Party Results</div>
          <h1 className="text-3xl font-extrabold leading-tight">{fullName(me)}</h1>
          <div className="text-sm text-muted-foreground">{schoolLine(me) || "Mystery school"}</div>
        </div>
        <Link href="/me/edit" className="glass rounded-full px-3 py-1.5 text-xs font-bold">
          Edit
        </Link>
      </header>

      {meta && (
        <Card className="relative overflow-hidden text-center" style={{ background: `linear-gradient(160deg, ${meta.from}22, ${meta.to}22)` }}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Party Type</div>
          <div className="mt-3 flex justify-center">
            <AvatarArt type={me.avatarType} size={140} />
          </div>
          <h2
            className="mt-4 text-3xl font-extrabold leading-none"
            style={{ background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            {meta.title}
          </h2>
          <p className="mt-2 text-sm text-white/85">&ldquo;{meta.tagline}&rdquo;</p>
          <ul className="mt-4 space-y-1.5 text-left text-sm font-semibold">
            {observations.map((o) => (
              <li key={o} className="rounded-xl bg-black/20 px-3 py-2">
                {o}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {others.length === 0 ? (
        <EmptyState
          emoji="🌅"
          title="You're early."
          body="Your matches will update as people join. Go grab a snack and come back."
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            {best && <MatchTile label="Most aligned" p={best.p} percent={best.percent} tone="lime" />}
            {worst && <MatchTile label="Most different" p={worst.p} percent={worst.percent} tone="hot" />}
          </section>

          {biggest && (
            <section>
              <SectionTitle eyebrow="Biggest disagreement">Go argue about this</SectionTitle>
              <Link href={`/people/${biggest.p.id}`} className="block">
                <Card className="flex items-center gap-3">
                  <AvatarArt type={biggest.p.avatarType} size={44} />
                  <p className="text-sm font-semibold leading-snug">{biggest.text}</p>
                </Card>
              </Link>
            </section>
          )}

          {money && (
            <section>
              <SectionTitle eyebrow="Biggest money gap">Different tax brackets</SectionTitle>
              <Link href={`/people/${money.p.id}`} className="block">
                <Card className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    💸
                  </span>
                  <p className="text-sm font-semibold leading-snug">{money.text}</p>
                </Card>
              </Link>
            </section>
          )}
        </>
      )}

      <section>
        <SectionTitle eyebrow="Activity matches">Who&apos;s down</SectionTitle>
        {activityMatches.length === 0 ? (
          <EmptyState
            emoji="🤷"
            title="You're not down for anything yet"
            body="Pick something and see who else is in."
            action={
              <Link href="/activities" className="grad-cool block rounded-2xl py-3 text-center font-bold text-[#14102a]">
                Pick activities
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {activityMatches.map(({ id, count }) => {
              const a = ACTIVITY_BY_ID[id];
              return (
                <Link key={id} href={`/activities/${id}`} className="glass flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98]">
                  <span className="text-3xl" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <div className="flex-1">
                    <div className="font-extrabold">{a.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {count === 0 ? "Nobody else yet. Recruit someone." : `${count} other ${count === 1 ? "person is" : "people are"} down for ${a.shortLabel.toLowerCase()}.`}
                    </div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <SectionTitle eyebrow="Top matches">Your people</SectionTitle>
          <div className="space-y-2">
            {[...others]
              .map((p) => ({ p, percent: compatibilityPercent(me.answers, p.answers) }))
              .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
              .slice(0, 3)
              .map(({ p, percent }) => (
                <ParticipantCard key={p.id} person={p} percent={percent} />
              ))}
          </div>
          <Link href="/people" className="mt-3 block text-center text-sm font-bold text-sky">
            See everyone →
          </Link>
        </section>
      )}
    </div>
  );
}

function MatchTile({ label, p, percent, tone }: { label: string; p: PublicParticipant; percent: number; tone: "lime" | "hot" }) {
  return (
    <Link href={`/people/${p.id}`} className="glass flex flex-col items-center rounded-3xl p-4 text-center active:scale-[0.98]">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <AvatarArt type={p.avatarType} size={64} className="mt-2" />
      <div className="mt-2 truncate text-sm font-extrabold">{fullName(p)}</div>
      <CountUp value={percent} suffix="%" className={`text-3xl font-extrabold leading-none ${tone === "lime" ? "text-lime" : "text-hot"}`} />
    </Link>
  );
}
