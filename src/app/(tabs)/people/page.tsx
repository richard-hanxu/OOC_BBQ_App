"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ParticipantCard } from "@/components/participant-card";
import { useParty } from "@/components/party-provider";
import { EmptyState, Skeleton } from "@/components/ui-bits";
import { ACTIVITIES, type ActivityId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Sort = "best" | "different" | "name";
const SORTS: { id: Sort; label: string }[] = [
  { id: "best", label: "Best match" },
  { id: "different", label: "Most different" },
  { id: "name", label: "Name" },
];

const PAGE = 24;

export default function PeoplePage() {
  const { data, loading, percentWith } = useParty();
  const [sort, setSort] = useState<Sort>("best");
  const [filter, setFilter] = useState<ActivityId | null>(null);
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    if (!data) return [];
    const me = data.me;
    const rows = data.participants
      .filter((p) => p.id !== me.id)
      .filter((p) => !filter || p.activities.includes(filter))
      .map((p) => ({ p, percent: percentWith(p.id) }));
    const byName = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      a.p.firstName.localeCompare(b.p.firstName) || a.p.lastName.localeCompare(b.p.lastName);
    if (sort === "name") return rows.sort(byName);
    // People still taking the quiz sink to the bottom for match sorts.
    return rows.sort((a, b) => {
      if (a.percent == null && b.percent == null) return byName(a, b);
      if (a.percent == null) return 1;
      if (b.percent == null) return -1;
      return (sort === "best" ? b.percent - a.percent : a.percent - b.percent) || byName(a, b);
    });
  }, [data, sort, filter, percentWith]);

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-extrabold">People</h1>
        <div className="text-sm text-muted-foreground">{data.participants.length} at the party</div>
      </header>

      <div className="mt-3 flex gap-1 rounded-2xl bg-white/8 p-1">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
              sort === s.id ? "bg-white text-[#14102a]" : "text-white/70",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={filter === null} onClick={() => setFilter(null)}>
          Everyone
        </Chip>
        {ACTIVITIES.map((a) => (
          <Chip key={a.id} active={filter === a.id} onClick={() => setFilter(filter === a.id ? null : a.id)}>
            {a.emoji} {a.shortLabel}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji={filter ? "🫥" : "🌅"}
            title={filter ? "Nobody's down for that yet" : "You're the first one here"}
            body={filter ? "Be the trendsetter. Or pick a different activity." : "Your matches will update as people join."}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.slice(0, shown).map(({ p, percent }) => (
            <li key={p.id} className="animate-rise">
              <ParticipantCard person={p} percent={percent} />
            </li>
          ))}
        </ul>
      )}
      {list.length > shown && (
        <button
          type="button"
          onClick={() => setShown((s) => s + PAGE)}
          className="glass mt-4 w-full rounded-2xl py-3 text-sm font-bold"
        >
          Show {Math.min(PAGE, list.length - shown)} more
        </button>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
        active ? "bg-white text-[#14102a]" : "glass text-white/80",
      )}
    >
      {children}
    </button>
  );
}
