"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui-bits";
import type { Announcement } from "@/lib/announcements";
import { cn } from "@/lib/utils";

export function AnnouncementBoard({ organizer = false }: { organizer?: boolean }) {
  const endpoint = organizer ? "/api/admin/announcements" : "/api/announcements";
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [poll, setPoll] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Refresh and sign in again." : "Couldn't load announcements. Try refreshing.");
      const data = await response.json();
      setItems(data.announcements);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't reach the party server."); }
  }, [endpoint]);

  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [load]);

  async function mutate(key: string, url: string, method: string, payload?: unknown) {
    setBusy(key); setError(""); setNotice("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Couldn't save that. Try again.");
      await load();
      setNotice(key === "post" ? "Announcement posted!" : method === "PATCH" ? "Voting is now closed." : "Your vote is saved.");
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't reach the party server."); return false; }
    finally { setBusy(null); }
  }

  async function post(event: FormEvent) {
    event.preventDefault();
    if (await mutate("post", endpoint, "POST", { title, body, options: poll ? options : [] })) {
      setTitle(""); setBody(""); setPoll(false); setOptions(["", ""]);
    }
  }

  return <section className="space-y-4" aria-labelledby={organizer ? "organizer-announcements" : "announcements-title"}>
    <header className="flex items-start justify-between gap-3">
      <div><h2 id={organizer ? "organizer-announcements" : "announcements-title"} className="text-2xl font-extrabold">📣 Announcements</h2>
        <p className="mt-1 text-sm text-muted-foreground">{organizer ? "Send a party update, or let guests vote on your options." : "The latest from your organizers. Have your say below."}</p></div>
      <button type="button" onClick={() => void load()} className="glass shrink-0 rounded-full px-3 py-2 text-xs font-bold">Refresh</button>
    </header>
    {organizer && <Card>
      <form onSubmit={post} className="space-y-3">
        <label className="block space-y-1 text-sm font-bold">Title<Input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's happening?" className="mt-1 h-12 rounded-xl bg-white/5" /></label>
        <label className="block space-y-1 text-sm font-bold">Message<textarea required maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Tell the party…" className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 p-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={poll} onChange={(e) => setPoll(e.target.checked)} className="size-5 accent-violet-400" /> Include a vote</label>
        {poll && <fieldset className="space-y-2 rounded-2xl bg-white/5 p-3"><legend className="px-1 text-xs font-bold text-muted-foreground">Choose 2–4 options for guests</legend>
          {options.map((option, i) => <div key={i} className="flex gap-2"><Input aria-label={`Poll option ${i + 1}`} required maxLength={120} value={option} placeholder={`Option ${i + 1}`} onChange={(e) => setOptions((previous) => previous.map((v, j) => i === j ? e.target.value : v))} className="h-11 rounded-xl" />
            {options.length > 2 && <button type="button" aria-label={`Remove option ${i + 1}`} onClick={() => setOptions((previous) => previous.filter((_, j) => i !== j))} className="min-w-11 rounded-xl bg-white/10">×</button>}</div>)}
          {options.length < 4 && <button type="button" onClick={() => setOptions((previous) => [...previous, ""])} className="min-h-11 text-sm font-bold text-lime">+ Add option</button>}
          <p className="text-xs text-muted-foreground">One vote per guest. Guests can change their vote until you close voting. Posting sends it to the app, not by email or SMS.</p>
        </fieldset>}
        <button disabled={busy !== null} type="submit" className="min-h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-extrabold disabled:opacity-50">{busy === "post" ? "Posting…" : "Post announcement →"}</button>
      </form>
    </Card>}
    {error && <p role="alert" className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm font-semibold text-lime">{notice}</p>}
    {items === null && !error && <p className="py-8 text-center text-muted-foreground">Loading announcements…</p>}
    {items?.length === 0 && <Card className="py-10 text-center"><div className="text-4xl">✨</div><p className="mt-3 font-bold">All quiet for now</p><p className="mt-1 text-sm text-muted-foreground">Party updates will appear here.</p></Card>}
    {items?.map((item) => <Card key={item.id} className="space-y-3 overflow-hidden">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><span className="rounded-full bg-violet-400/15 px-2 py-1 text-violet-300">From the organizers</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
      <h3 className="break-words text-xl font-extrabold">{item.title}</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">{item.body}</p>
      {item.options.length > 0 && <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{item.closed ? "Voting closed" : "Pick one"}</span><span>{item.totalVotes} {item.totalVotes === 1 ? "vote" : "votes"}</span></div>
        {item.options.map((option) => {
          const selected = item.myVote === option.id;
          const percent = item.totalVotes ? Math.round(option.votes / item.totalVotes * 100) : 0;
          return <button key={option.id} type="button" disabled={organizer || item.closed || busy !== null} aria-pressed={selected}
            onClick={() => void mutate(item.id, `/api/announcements/${item.id}/vote`, "POST", { optionId: option.id })}
            className={cn("relative flex min-h-12 w-full overflow-hidden rounded-xl border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring", selected ? "border-violet-400 bg-violet-400/10" : "border-white/15 bg-white/5 enabled:hover:bg-white/10")}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-violet-400/15 transition-all" style={{ width: `${percent}%` }} />
            <span className="relative flex w-full items-center justify-between gap-2"><span className="break-words font-semibold">{selected && "✓ "}{option.label}{selected && <span className="sr-only"> (your vote)</span>}</span><span className="shrink-0 text-xs text-muted-foreground">{option.votes} · {percent}%</span></span>
          </button>;
        })}
        {!organizer && !item.closed && <p className="text-xs text-muted-foreground">{busy === item.id ? "Saving your vote…" : "You can change your vote until voting closes. Only totals are shared."}</p>}
        {organizer && !item.closed && <button disabled={busy !== null} type="button" onClick={() => { if (confirm("Close voting? Guests will still see the results, but cannot change their vote.")) void mutate(item.id, `/api/admin/announcements/${item.id}`, "PATCH"); }} className="min-h-11 rounded-full bg-white/10 px-4 text-xs font-bold disabled:opacity-50">Close voting</button>}
      </div>}
    </Card>)}
    <p className="text-center text-xs text-muted-foreground">Updates automatically every 30 seconds.</p>
  </section>;
}
