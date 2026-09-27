"use client";

import Link from "next/link";
import { ACTIVITIES, type ActivityId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  selected: ActivityId[];
  onToggle: (id: ActivityId) => void;
  /** Number of other guests down for each activity (excluding the viewer). */
  counts?: Partial<Record<ActivityId, number>>;
  /** When true each tile also links to the activity's people list. */
  linkTo?: (id: ActivityId) => string;
  size?: "lg" | "md";
}

export function ActivityTiles({ selected, onToggle, counts, linkTo, size = "lg" }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIVITIES.map((a) => {
        const on = selected.includes(a.id);
        const count = counts?.[a.id];
        return (
          <div key={a.id} className="relative">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(a.id)}
              className={cn(
                "flex w-full flex-col items-start justify-between rounded-3xl border p-4 text-left transition-all active:scale-[0.97]",
                size === "lg" ? "min-h-[150px]" : "min-h-[112px]",
                on
                  ? "border-transparent text-[#14102a] shadow-[0_12px_30px_-12px_rgba(255,255,255,0.5)]"
                  : "glass border-white/10 text-foreground",
              )}
              style={on ? { background: `linear-gradient(135deg, ${a.from}, ${a.to})` } : undefined}
            >
              <span className={cn("leading-none", size === "lg" ? "text-5xl" : "text-4xl")} aria-hidden="true">
                {a.emoji}
              </span>
              <span className="mt-3">
                <span className="block text-lg font-extrabold leading-tight">{a.label}</span>
                {count != null && (
                  <span className={cn("mt-0.5 block text-xs font-semibold", on ? "text-[#14102a]/75" : "text-muted-foreground")}>
                    {count === 0 ? "Nobody yet. Be first." : `${count} ${count === 1 ? "person" : "people"} down`}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-sm font-black",
                  on ? "bg-[#14102a] text-white" : "bg-white/10 text-white/50",
                )}
                aria-hidden="true"
              >
                {on ? "✓" : "+"}
              </span>
            </button>
            {linkTo && (
              <Link
                href={linkTo(a.id)}
                className={cn(
                  "absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold",
                  on ? "bg-[#14102a]/15 text-[#14102a]" : "bg-white/10 text-white",
                )}
              >
                Who&apos;s in →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
