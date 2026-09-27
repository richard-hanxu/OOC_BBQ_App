"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { BigButton } from "@/components/ui-bits";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Nope.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm pt-10">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Organizer</div>
      <h1 className="mt-1 text-3xl font-extrabold">Party control room</h1>
      {!configured ? (
        <p className="mt-4 rounded-2xl bg-sun/15 p-4 text-sm">
          Set <code className="font-mono">ADMIN_PASSWORD</code> in your environment (or <code className="font-mono">.env.local</code>) and
          restart to enable this page.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Organizer password"
            className="h-12 rounded-xl bg-white/5 text-base"
            autoComplete="current-password"
          />
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <BigButton type="submit" disabled={busy || !password}>
            {busy ? "Checking…" : "Unlock"}
          </BigButton>
        </form>
      )}
    </div>
  );
}
