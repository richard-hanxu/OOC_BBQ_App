"use client";

import { useMemo } from "react";
import { AvatarArt } from "@/components/avatar-art";
import { MarkerTrack } from "@/components/party-slider";
import { useParty } from "@/components/party-provider";
import { Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui-bits";
import { AVATARS } from "@/lib/avatars";
import { computePartyStats, speciesBlurb, spreadCaption, type QuestionStats } from "@/lib/stats";

export default function OpinionsPage() {
  const { data, loading } = useParty();
  const stats = useMemo(() => (data ? computePartyStats(data.participants) : null), [data]);

  if (loading || !data || !stats) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const myAnswers = data.me.answers;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">Opinions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What {stats.completed} {stats.completed === 1 ? "guest" : "guests"} collectively believe. Your marker is pink.
        </p>
      </header>

      {stats.completed < 2 ? (
        <EmptyState emoji="📡" title="Not enough data yet" body="Party-wide opinions appear once at least two people finish the quiz." />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3">
            {stats.mostDivisive && <Highlight eyebrow="Most divisive" s={stats.mostDivisive} emoji="🔥" />}
            {stats.strongestConsensus && <Highlight eyebrow="Strongest consensus" s={stats.strongestConsensus} emoji="🤝" />}
            {stats.biggestMoneyGap && <Highlight eyebrow="Biggest money gap" s={stats.biggestMoneyGap} emoji="💸" money />}
          </section>

          <section>
            <SectionTitle eyebrow="Party species">Who spawned</SectionTitle>
            <Card>
              <p className="text-sm font-semibold">{speciesBlurb(stats.species, stats.completed)}</p>
              <ul className="mt-3 space-y-2">
                {stats.species.map((s) => {
                  const meta = AVATARS[s.type];
                  return (
                    <li key={s.type} className="flex items-center gap-3">
                      <AvatarArt type={s.type} size={36} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm font-bold">
                          <span>
                            {meta.emoji} {meta.name}
                          </span>
                          <span className="tabular text-muted-foreground">
                            {s.count} · {s.percent}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full transition-[width] duration-700"
                            style={{ width: `${s.percent}%`, background: `linear-gradient(90deg, ${meta.from}, ${meta.to})` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>

          <section>
            <SectionTitle eyebrow="All 14 sliders">The full record</SectionTitle>
            <div className="space-y-3">
              {stats.questions.map((s) => (
                <QuestionCard key={s.question.id} s={s} mine={myAnswers[s.question.id]?.normalized} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Highlight({ eyebrow, s, emoji, money }: { eyebrow: string; s: QuestionStats; emoji: string; money?: boolean }) {
  return (
    <Card className="flex items-start gap-3">
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        <div className="text-base font-extrabold leading-tight">{s.question.shortTitle}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {money ? `From ${s.minDisplay} all the way to ${s.maxDisplay}.` : spreadCaption(s)}
        </div>
      </div>
    </Card>
  );
}

function QuestionCard({ s, mine }: { s: QuestionStats; mine?: number }) {
  const isMoney = s.question.type === "money_slider";
  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{s.question.category}</div>
      <div className="text-base font-extrabold leading-tight">{s.question.shortTitle}</div>
      <MarkerTrack a={mine ?? 50} b={s.median} labelA={mine != null ? "You" : ""} labelB="Party" histogram={s.histogram} className="mt-2" />
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="max-w-[45%]">{s.question.leftLabel}</span>
        <span className="max-w-[45%] text-right">{s.question.rightLabel}</span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Party median</div>
          <div className="text-2xl font-extrabold tabular leading-none">{isMoney ? s.medianDisplay : Math.round(s.median)}</div>
        </div>
        <div className="max-w-[60%] text-right text-sm font-semibold">{s.caption}</div>
      </div>
    </Card>
  );
}
