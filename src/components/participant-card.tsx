"use client";

import Link from "next/link";
import { memo } from "react";
import { AvatarArt } from "@/components/avatar-art";
import { AVATARS } from "@/lib/avatars";
import { ACTIVITY_BY_ID, fullName, schoolLine, type PublicParticipant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  person: PublicParticipant;
  percent: number | null;
  isMe?: boolean;
  className?: string;
}

export const ParticipantCard = memo(function ParticipantCard({ person, percent, isMe, className }: Props) {
  const school = schoolLine(person);
  const done = Boolean(person.quizCompletedAt);
  return (
    <Link
      href={isMe ? "/me" : `/people/${person.id}`}
      className={cn(
        "glass flex items-center gap-3 rounded-3xl p-3 transition-transform active:scale-[0.98]",
        className,
      )}
    >
      <AvatarArt type={person.avatarType} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <div className="truncate text-base font-extrabold leading-tight">{fullName(person)}</div>
          {isMe && <span className="text-[10px] font-bold uppercase text-muted-foreground">you</span>}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {person.avatarType ? AVATARS[person.avatarType].name : "Still taking the quiz"}
          {school ? ` · ${school}` : ""}
        </div>
        {person.activities.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {person.activities.map((a) => (
              <span key={a} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
                {ACTIVITY_BY_ID[a].emoji} {ACTIVITY_BY_ID[a].shortLabel}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end">
        {isMe ? null : done && percent != null ? (
          <>
            <div className={cn("text-2xl font-extrabold tabular leading-none", percentColor(percent))}>{percent}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">aligned</div>
          </>
        ) : (
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">quiz pending</div>
        )}
      </div>
    </Link>
  );
});

export function percentColor(p: number) {
  if (p >= 80) return "text-lime";
  if (p >= 65) return "text-sky";
  if (p >= 50) return "text-sun";
  return "text-hot";
}
