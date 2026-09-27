"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AvatarSummary } from "@/components/avatar-summary";
import { AnnouncementBoard } from "@/components/announcement-board";
import { MarkerTrack } from "@/components/party-slider";
import { Card } from "@/components/ui-bits";
import { AVATARS } from "@/lib/avatars";
import { computePartyStats } from "@/lib/stats";
import { fullName, schoolLine, type PublicParticipant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Payload {
  participants: PublicParticipant[];
  storeKind: "supabase" | "file";
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/participants", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    if (!res.ok) {
      setError("Couldn't load participants.");
      return;
    }
    setData((await res.json()) as Payload);
  }, [router]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const stats = useMemo(() => (data ? computePartyStats(data.participants) : null), [data]);
  const seedCount = data?.participants.filter((p) => p.isSeed).length ?? 0;

  async function act(label: string, fn: () => Promise<Response>) {
    setMessage(null);
    setError(null);
    const res = await fn();
    if (!res.ok) {
      setError(`${label} failed (${res.status}).`);
      return;
    }
    setMessage(`${label} done.`);
    await load();
  }

  const remove = async (p: PublicParticipant) => {
    if (!confirm(`Delete ${fullName(p)}? This removes their profile and answers.`)) return;
    setBusyId(p.id);
    await act("Delete", () => fetch(`/api/admin/participants/${p.id}`, { method: "DELETE" }));
    setBusyId(null);
  };

  const reset = async (p: PublicParticipant) => {
    if (!confirm(`Reset the quiz for ${fullName(p)}? They'll be able to retake it.`)) return;
    setBusyId(p.id);
    await act("Reset", () => fetch(`/api/admin/participants/${p.id}`, { method: "POST" }));
    setBusyId(null);
  };

  const seed = (action: "load" | "remove") =>
    act(action === "load" ? "Seed load" : "Seed removal", () =>
      fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    );

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  };

  if (!data || !stats) {
    return <p className="pt-10 text-center text-sm text-muted-foreground">{error ?? "Loading…"}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Organizer</div>
          <h1 className="text-3xl font-extrabold">Party control room</h1>
          <div className="text-xs text-muted-foreground">
            Storage: <span className="font-mono">{data.storeKind}</span>
            {data.storeKind === "file" && " (local JSON file — configure Supabase for the real party)"}
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export" className="glass rounded-full px-3 py-1.5 text-xs font-bold">
            Export contacts & answers
          </a>
          <button type="button" onClick={logout} className="glass rounded-full px-3 py-1.5 text-xs font-bold">
            Lock
          </button>
        </div>
      </header>

      {(message || error) && (
        <p className={cn("rounded-xl px-3 py-2 text-sm font-semibold", error ? "bg-destructive/15 text-destructive" : "bg-lime/15 text-lime")}>
          {error ?? message}
        </p>
      )}

      <AnnouncementBoard organizer />

      <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
        Attendee names, emails, and phone numbers are saved when they join, even before completing the quiz.
        Organizer-only contacts are included in your export. Download a CSV after the party and keep it private.
      </p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Participants" value={stats.participants} />
        <Stat label="Finished quiz" value={stats.completed} />
        <Stat label="Still answering" value={stats.participants - stats.completed} />
        <Stat label="Seed guests" value={seedCount} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Avatar distribution</h2>
          <ul className="mt-2 space-y-1.5">
            {stats.species.map((s) => (
              <li key={s.type} className="flex items-center gap-2 text-sm">
                <AvatarSummary type={s.type} size={24} />
                <span className="flex-1">{AVATARS[s.type].name}</span>
                <span className="tabular font-bold">
                  {s.count} <span className="text-muted-foreground">({s.percent}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Seed data</h2>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => seed("load")} className="glass rounded-full px-3 py-1.5 text-xs font-bold">
              Load fake guests
            </button>
            <button
              type="button"
              onClick={() => seed("remove")}
              disabled={seedCount === 0}
              className="rounded-full bg-destructive/20 px-3 py-1.5 text-xs font-bold text-destructive disabled:opacity-40"
            >
              Remove all {seedCount} seed guests
            </button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Participants</h2>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Guest</th>
                <th className="hidden p-3 sm:table-cell">Contact</th>
                <th className="p-3">Quiz</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.participants.map((p) => (
                <tr key={p.id} className="border-t border-white/10 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <AvatarSummary type={p.avatarType} name={fullName(p)} size={32} />
                      <div>
                        <div className="font-bold">
                          {fullName(p)} {p.isSeed && <span className="ml-1 rounded bg-sun/20 px-1 text-[10px] text-sun">seed</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {schoolLine(p) || "—"}
                        </div>
                        {p.broughtItems && <div className="mt-1 max-w-xs break-words text-xs text-lime">Brought: {p.broughtItems}</div>}
                        {p.answers.grocery_cost_guess && <div className="mt-1 text-xs text-sun">Grocery guess: {p.answers.grocery_cost_guess.display}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-3 text-xs text-muted-foreground sm:table-cell">
                    <div>{p.phone}</div>
                    <div>{p.email}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {p.quizCompletedAt ? (
                      <span className="rounded-full bg-lime/15 px-2 py-0.5 font-bold text-lime">{p.avatarType ? AVATARS[p.avatarType].name : "done"}</span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-muted-foreground">in progress</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-xs">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        disabled={busyId === p.id || !p.quizCompletedAt}
                        onClick={() => reset(p)}
                        className="rounded-full bg-white/10 px-2.5 py-1 font-bold disabled:opacity-40"
                      >
                        Reset quiz
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => remove(p)}
                        className="rounded-full bg-destructive/20 px-2.5 py-1 font-bold text-destructive disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.participants.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Nobody has joined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Party-wide slider distributions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.questions.map((s) => (
            <Card key={s.question.id} className="p-3">
              <div className="text-sm font-extrabold">{s.question.shortTitle}</div>
              <MarkerTrack a={s.median} labelA={`median ${s.medianDisplay}`} histogram={s.histogram} className="mt-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{s.question.leftLabel}</span>
                <span>{s.question.rightLabel}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                n={s.count} · spread {s.spread.toFixed(1)}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="text-3xl font-extrabold tabular">{value}</div>
    </Card>
  );
}
