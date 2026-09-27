"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AvatarArt } from "@/components/avatar-art";
import { percentColor } from "@/components/participant-card";
import { MarkerTrack } from "@/components/party-slider";
import { useParty } from "@/components/party-provider";
import { Card, CountUp, EmptyState, SectionTitle, Skeleton } from "@/components/ui-bits";
import { AVATARS } from "@/lib/avatars";
import { alignmentVibe, closenessCaption, compare, type QuestionComparison } from "@/lib/compatibility";
import { ACTIVITY_BY_ID, fullName, schoolLine } from "@/lib/types";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useParty();

  const person = data?.participants.find((p) => p.id === id) ?? null;
  const me = data?.me ?? null;

  const cmp = useMemo(() => {
    if (!me || !person || !person.quizCompletedAt || !me.quizCompletedAt) return null;
    return compare(me.answers, person.answers, {
      a: { name: "You", you: true },
      b: { name: person.firstName, you: false },
    });
  }, [me, person]);

  if (loading && !data) return <Skeleton className="h-[80vh]" />;

  if (!person || !me) {
    return (
      <div>
        <Back />
        <div className="mt-4">
          <EmptyState emoji="🫥" title="Can't find that guest" body="They may have left the party (or the organizer removed them)." />
        </div>
      </div>
    );
  }

  if (person.id === me.id) {
    return (
      <div>
        <Back />
        <div className="mt-4">
          <EmptyState
            emoji="🪞"
            title="That's you"
            body="You are 100% aligned with yourself. Probably."
            action={
              <Link href="/me" className="grad-cool block rounded-2xl py-3 text-center font-bold text-[#14102a]">
                Go to your results
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const meta = person.avatarType ? AVATARS[person.avatarType] : null;
  const school = schoolLine(person);

  return (
    <div className="space-y-6">
      <Back />

      <header className="flex flex-col items-center text-center">
        <AvatarArt type={person.avatarType} size={120} />
        <h1 className="mt-3 text-3xl font-extrabold leading-tight">{fullName(person)}</h1>
        {meta && (
          <div
            className="text-sm font-extrabold uppercase tracking-wider"
            style={{ background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            {meta.title}
          </div>
        )}
        {school && <div className="mt-1 text-sm text-muted-foreground">{school}</div>}

        {cmp ? (
          <div className="mt-4">
            <CountUp value={cmp.percent} suffix="%" className={`text-6xl font-extrabold leading-none ${percentColor(cmp.percent)}`} />
            <div className="mt-1 text-sm font-bold">aligned with you</div>
            <div className="text-xs text-muted-foreground">{alignmentVibe(cmp.percent)}</div>
          </div>
        ) : (
          <div className="glass mt-4 rounded-2xl px-4 py-2 text-sm text-muted-foreground">
            {person.firstName} hasn&apos;t finished the quiz yet. Go heckle them.
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 gap-3">
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Down for</div>
          {person.activities.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {person.activities.map((a) => (
                <Link key={a} href={`/activities/${a}`} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
                  {ACTIVITY_BY_ID[a].emoji} {ACTIVITY_BY_ID[a].shortLabel}
                  {me.activities.includes(a) && <span className="ml-1 text-lime">· you too</span>}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">Nothing yet. Convince them.</div>
          )}
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Contact</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`sms:${person.phone.replace(/[^\d+]/g, "")}`} className="glass rounded-2xl p-3 active:scale-[0.98]">
              <div className="text-xs text-muted-foreground">Phone</div>
              <div className="truncate text-sm font-bold">{person.phone}</div>
            </a>
            <a href={`mailto:${person.email}`} className="glass rounded-2xl p-3 active:scale-[0.98]">
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="truncate text-sm font-bold">{person.email}</div>
            </a>
          </div>
        </Card>
      </section>

      {cmp && (
        <>
          {cmp.starters.length > 0 && (
            <section>
              <SectionTitle eyebrow="Conversation starters">Things to argue about</SectionTitle>
              <ul className="space-y-2">
                {cmp.starters.map((s, i) => (
                  <li key={s} className="glass flex gap-3 rounded-2xl px-4 py-3 text-sm font-semibold leading-snug">
                    <span aria-hidden="true">{["🔥", "🍿", "🎯"][i % 3]}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle eyebrow="Closest takes">Same brain</SectionTitle>
            <div className="space-y-2">
              {cmp.closest.map((c) => (
                <CompareRow key={c.question.id} c={c} name={person.firstName} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Biggest disagreements">Explain yourselves</SectionTitle>
            <div className="space-y-2">
              {cmp.disagreements.map((c) => (
                <CompareRow key={c.question.id} c={c} name={person.firstName} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Money gap">Different tax brackets</SectionTitle>
            <div className="space-y-2">
              {cmp.moneyGaps.map((m) => (
                <Card key={m.question.id}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{m.question.shortTitle}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <MoneyCell who="You" value={m.aDisplay} color="#ff5fa2" />
                    <MoneyCell who={person.firstName} value={m.bDisplay} color="#22d3ee" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white/85">{m.caption}</p>
                </Card>
              ))}
            </div>
          </section>

          <details className="glass rounded-3xl p-4">
            <summary className="cursor-pointer text-sm font-bold">All 14 answers side by side</summary>
            <div className="mt-3 space-y-3">
              {cmp.all.map((c) => (
                <CompareRow key={c.question.id} c={c} name={person.firstName} compact />
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function Back() {
  return (
    <Link href="/people" className="inline-block text-sm font-bold text-muted-foreground">
      ← People
    </Link>
  );
}

function MoneyCell({ who, value, color }: { who: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <div className="text-xs font-bold" style={{ color }}>
        {who}
      </div>
      <div className="text-lg font-extrabold tabular leading-tight">{value}</div>
    </div>
  );
}

function CompareRow({ c, name, compact }: { c: QuestionComparison; name: string; compact?: boolean }) {
  const isMoney = c.question.type === "money_slider";
  return (
    <Card className={compact ? "p-3" : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-extrabold leading-tight">{c.question.shortTitle}</div>
        <div className="shrink-0 text-xs font-bold text-muted-foreground">
          {isMoney ? "" : `${Math.round(c.diff)} pts apart`}
        </div>
      </div>
      <MarkerTrack a={c.a} b={c.b} labelA="You" labelB={name} className="mt-1" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="font-bold text-hot">You: {c.aDisplay}</span>
          {!compact && <div className="text-muted-foreground">&ldquo;{c.aCaption}&rdquo;</div>}
        </div>
        <div className="text-right">
          <span className="font-bold text-sky">
            {name}: {c.bDisplay}
          </span>
          {!compact && <div className="text-muted-foreground">&ldquo;{c.bCaption}&rdquo;</div>}
        </div>
      </div>
      {!compact && <div className="mt-2 text-sm font-semibold">{closenessCaption(c.diff)}</div>}
    </Card>
  );
}
