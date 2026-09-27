"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ParticipantCard } from "@/components/participant-card";
import { useParty } from "@/components/party-provider";
import { BigButton, EmptyState, Skeleton } from "@/components/ui-bits";
import { ACTIVITY_BY_ID, isActivityId } from "@/lib/types";

export default function ActivityPeoplePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, percentWith, setMyActivities } = useParty();
  const activity = isActivityId(id) ? ACTIVITY_BY_ID[id] : null;

  const people = useMemo(() => {
    if (!data || !activity) return [];
    return data.participants
      .filter((p) => p.activities.includes(activity.id))
      .map((p) => ({ p, percent: percentWith(p.id), isMe: p.id === data.me.id }))
      .sort((a, b) => {
        if (a.isMe) return -1;
        if (b.isMe) return 1;
        return (b.percent ?? -1) - (a.percent ?? -1) || a.p.firstName.localeCompare(b.p.firstName);
      });
  }, [data, activity, percentWith]);

  if (!activity) {
    return (
      <div>
        <Back />
        <div className="mt-4">
          <EmptyState emoji="🤔" title="Unknown activity" body="We only have a pool, a ping pong table, a billiards table and board games." />
        </div>
      </div>
    );
  }
  if (loading || !data) return <Skeleton className="h-[70vh]" />;

  const imIn = data.me.activities.includes(activity.id);
  const others = people.filter((x) => !x.isMe).length;

  return (
    <div>
      <Back />
      <header
        className="mt-3 flex items-center gap-4 rounded-3xl p-5 text-[#14102a]"
        style={{ background: `linear-gradient(135deg, ${activity.from}, ${activity.to})` }}
      >
        <span className="text-6xl leading-none" aria-hidden="true">
          {activity.emoji}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold leading-none">{activity.label}</h1>
          <div className="mt-1 text-sm font-bold opacity-80">
            {others === 0 ? "Nobody else yet" : `${others} ${others === 1 ? "person" : "people"} down`}
            {imIn ? " · including you" : ""}
          </div>
        </div>
      </header>

      <div className="mt-3">
        <BigButton
          variant={imIn ? "ghost" : "cool"}
          onClick={() =>
            setMyActivities(imIn ? data.me.activities.filter((a) => a !== activity.id) : [...data.me.activities, activity.id]).catch(() => {})
          }
        >
          {imIn ? "I'm out for now" : `I'm down for ${activity.shortLabel.toLowerCase()} →`}
        </BigButton>
      </div>

      {people.length === 0 ? (
        <div className="mt-4">
          <EmptyState emoji="🫥" title="Nobody's signed up yet" body="Be the first. Peer pressure works both ways." />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {people.map(({ p, percent, isMe }) => (
            <li key={p.id}>
              <ParticipantCard person={p} percent={percent} isMe={isMe} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Back() {
  return (
    <Link href="/activities" className="inline-block text-sm font-bold text-muted-foreground">
      ← Activities
    </Link>
  );
}
