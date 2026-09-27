"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActivityTiles } from "@/components/activity-tiles";
import { BigButton } from "@/components/ui-bits";
import type { ActivityId } from "@/lib/types";

export function ActivitiesOnboarding({ initial, counts }: { initial: ActivityId[]; counts: Record<ActivityId, number> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ActivityId[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: ActivityId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function next() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activities: selected }),
      });
      if (!res.ok) throw new Error();
      router.push("/quiz");
    } catch {
      setError("Couldn't save that. Check your Wi-Fi and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <ActivityTiles selected={selected} onToggle={toggle} counts={counts} />
      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
      <div className="mt-auto pt-6 safe-bottom">
        <BigButton onClick={next} disabled={busy} variant="cool">
          {busy ? "Saving…" : selected.length ? "Start the quiz →" : "Nothing right now, start the quiz →"}
        </BigButton>
      </div>
    </div>
  );
}
