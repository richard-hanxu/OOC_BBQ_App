"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { BigButton } from "@/components/ui-bits";

export function SignInForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/sign-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Couldn't sign in. Try again.");
      // Don't reuse another person's browser-local quiz draft.
      try { localStorage.removeItem("pp_quiz_draft_v1"); } catch { /* Storage may be disabled. */ }
      router.replace(result.redirectTo === "/me" ? "/me" : "/quiz");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach the party server.");
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4">
    <label className="block space-y-2 text-sm font-bold" htmlFor="signin-phone">Phone number
      <Input id="signin-phone" type="tel" autoComplete="tel" required maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (412) 555-0123" className="h-12 rounded-xl bg-white/5 text-base" />
    </label>
    <label className="block space-y-2 text-sm font-bold" htmlFor="signin-email">Email
      <Input id="signin-email" type="email" autoComplete="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" className="h-12 rounded-xl bg-white/5 text-base" />
    </label>
    {error && <p role="alert" className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
    <BigButton type="submit" disabled={busy}>{busy ? "Signing in…" : "Back to my profile →"}</BigButton>
    <p className="text-xs leading-relaxed text-muted-foreground">Use this only for your own profile. Signing in here signs out your previous browser session. No email or text message will be sent.</p>
  </form>;
}
