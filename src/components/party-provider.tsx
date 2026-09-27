"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { compatibilityPercent } from "@/lib/compatibility";
import type { ActivityId, ProfileInput, PublicParticipant } from "@/lib/types";

export interface PartyData {
  me: PublicParticipant;
  participants: PublicParticipant[];
  fetchedAt: string;
}

interface PartyContextValue {
  data: PartyData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Optimistic; rolls back on failure. */
  setMyActivities: (activities: ActivityId[]) => Promise<void>;
  updateProfile: (patch: Partial<ProfileInput>) => Promise<{ ok: boolean; error?: string; field?: string }>;
  /** Memoized compatibility (0–100) between me and another guest, or null if either lacks answers. */
  percentWith: (id: string) => number | null;
}

const PartyContext = createContext<PartyContextValue | null>(null);
const REFRESH_MS = 45_000;

export function PartyProvider({ children, initial }: { children: ReactNode; initial?: PartyData | null }) {
  const [data, setData] = useState<PartyData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);


  const refresh = useCallback(async () => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      try {
        const res = await fetch("/api/party", { cache: "no-store" });
        if (res.status === 401) {
          setData(null);
          setError("not-joined");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PartyData;
        setData(json);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();
    return inflight.current;
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [refresh]);

  const setMyActivities = useCallback(
    async (activities: ActivityId[]) => {
      let previous: PartyData | null = null;
      setData((d) => {
        previous = d;
        return d ? patchMe(d, { activities }) : d;
      });
      try {
        const res = await fetch("/api/me/activities", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activities }),
        });
        if (!res.ok) throw new Error("save failed");
        const json = (await res.json()) as { participant: PublicParticipant };
        setData((d) => (d ? patchMe(d, json.participant) : d));
      } catch {
        if (previous) setData(previous);
        throw new Error("Couldn't save. Check your connection.");
      }
    },
    [],
  );

  const updateProfile = useCallback(async (patch: Partial<ProfileInput>) => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => ({}))) as { participant?: PublicParticipant; error?: string; field?: string };
    if (!res.ok || !json.participant) return { ok: false, error: json.error ?? "Couldn't save", field: json.field };
    const p = json.participant;
    setData((d) => (d ? patchMe(d, p) : d));
    return { ok: true };
  }, []);

  // One pass over the guest list per data refresh; every card reads from this map.
  const percentMap = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!data) return map;
    const mine = data.me.answers;
    const meDone = Boolean(data.me.quizCompletedAt);
    for (const p of data.participants) {
      map.set(p.id, meDone && p.quizCompletedAt ? compatibilityPercent(mine, p.answers) : null);
    }
    return map;
  }, [data]);
  const percentWith = useCallback((id: string) => percentMap.get(id) ?? null, [percentMap]);

  const value = useMemo<PartyContextValue>(
    () => ({ data, loading, error, refresh, setMyActivities, updateProfile, percentWith }),
    [data, loading, error, refresh, setMyActivities, updateProfile, percentWith],
  );

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

function patchMe(d: PartyData, patch: Partial<PublicParticipant>): PartyData {
  const me = { ...d.me, ...patch };
  return { ...d, me, participants: d.participants.map((p) => (p.id === me.id ? me : p)) };
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used inside PartyProvider");
  return ctx;
}
