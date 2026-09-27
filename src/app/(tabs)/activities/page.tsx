"use client";

import { useMemo, useState } from "react";
import { ActivityTiles } from "@/components/activity-tiles";
import { useParty } from "@/components/party-provider";
import { Skeleton } from "@/components/ui-bits";
import { ACTIVITIES, type ActivityId } from "@/lib/types";

export default function ActivitiesPage() {
  const { data, loading, setMyActivities } = useParty();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo<Partial<Record<ActivityId, number>>>(() => {
    if (!data) return {};
    return Object.fromEntries(
      ACTIVITIES.map((a) => [a.id, data.participants.filter((p) => p.id !== data.me.id && p.activities.includes(a.id)).length]),
    ) as Record<ActivityId, number>;
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  const mine = data.me.activities;
  const toggle = (id: ActivityId) => {
    const next = mine.includes(id) ? mine.filter((x) => x !== id) : [...mine, id];
    setError(null);
    setMyActivities(next).catch((e: Error) => setError(e.message));
  };

  const total = ACTIVITIES.reduce((s, a) => s + (counts[a.id] ?? 0) + (mine.includes(a.id) ? 1 : 0), 0);

  return (
    <div>
      <header>
        <h1 className="text-3xl font-extrabold">Activities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap to toggle what you&apos;re down for. Saves instantly. {total > 0 ? `${total} sign-ups so far tonight.` : ""}
        </p>
      </header>
      {error && <p className="mt-3 rounded-xl bg-destructive/15 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
      <div className="mt-4">
        <ActivityTiles selected={mine} onToggle={toggle} counts={counts} linkTo={(id) => `/activities/${id}`} size="lg" />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Counts exclude you. &ldquo;Who&apos;s in&rdquo; shows everyone, with how aligned you are.</p>
    </div>
  );
}
