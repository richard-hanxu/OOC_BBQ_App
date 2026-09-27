"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CmuProgramPicker } from "@/components/cmu-program-picker";
import { BigButton } from "@/components/ui-bits";
import { isCmu, universityFor, type ContactVisibility, type PublicParticipant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  /** When set, the form edits an existing profile instead of creating one. */
  existing?: PublicParticipant;
  onSaved?: (p: PublicParticipant) => void;
  submitLabel?: string;
}

export function ProfileForm({ existing, onSaved, submitLabel }: Props) {
  const router = useRouter();
  const initialUniversity = existing ? universityFor(existing) : "";
  const [universityChoice, setUniversityChoice] = useState(
    initialUniversity ? (isCmu(initialUniversity) ? "cmu" : "other") : "",
  );
  const [form, setForm] = useState({
    firstName: existing?.firstName ?? "",
    lastName: existing?.lastName ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    university: isCmu(initialUniversity) ? "" : initialUniversity,
    cmuProgram: existing?.cmuProgram ?? "",
  });
  const [consent, setConsent] = useState(Boolean(existing));
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>(existing?.contactVisibility ?? "guests");
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const showsCmu = universityChoice === "cmu";

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error?.field === k) setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (universityChoice === "other" && !form.university.trim()) {
      setError({ message: "Enter your university, or leave the university choice blank.", field: "university" });
      return;
    }
    if (!existing && !consent) {
      setError({ message: "Please tick the box so everyone knows the deal.", field: "consent" });
      return;
    }
    setBusy(true);
    try {
      const { university, ...profile } = form;
      const payload = {
        ...profile,
        // Keep compatibility with existing stores; clear the former second school.
        undergraduateUniversity: showsCmu ? "Carnegie Mellon University" : universityChoice === "other" ? university.trim() : null,
        graduateUniversity: null,
        cmuProgram: showsCmu ? form.cmuProgram || null : null,
        consent,
        contactVisibility,
      };
      const res = await fetch(existing ? "/api/me" : "/api/participants", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { participant?: PublicParticipant; error?: string; field?: string };
      if (!res.ok || !json.participant) {
        setError({ message: json.error ?? "Something went wrong. Try again.", field: json.field });
        return;
      }
      if (onSaved) onSaved(json.participant);
      else router.push("/quiz");
    } catch {
      setError({ message: "Couldn't reach the party server. Check your Wi-Fi and try again." });
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = (k: string) =>
    cn("h-12 rounded-xl bg-white/5 text-base", error?.field === k && "border-destructive ring-3 ring-destructive/30");

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName">
          <Input id="firstName" autoComplete="given-name" required value={form.firstName} onChange={set("firstName")} className={fieldClass("firstName")} placeholder="Alex" />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <Input id="lastName" autoComplete="family-name" required value={form.lastName} onChange={set("lastName")} className={fieldClass("lastName")} placeholder="Chen" />
        </Field>
      </div>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" required value={form.phone} onChange={set("phone")} className={fieldClass("phone")} placeholder="+1 (412) 555-0123" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} className={fieldClass("email")} placeholder="you@school.edu" />
      </Field>
      <label className="glass flex cursor-pointer items-start gap-3 rounded-2xl p-4 text-sm">
        <Checkbox checked={contactVisibility === "organizers"} onCheckedChange={(checked) => setContactVisibility(checked === true ? "organizers" : "guests")} className="mt-0.5 size-5" />
        <span><span className="block font-bold">🔒 Keep my phone and email organizer-only</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Organizers can reach you about payments or lost items. Other guests will still see your name, school, and quiz results.</span>
        </span>
      </label>

      <div className="pt-2">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Optional</div>
        <div className="space-y-3">
          <Field label="University" htmlFor="universityChoice">
            <select
              id="universityChoice"
              value={universityChoice}
              onChange={(e) => {
                setUniversityChoice(e.target.value);
                if (error?.field === "university") setError(null);
              }}
              className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a university (optional)</option>
              <option value="cmu">CMU</option>
              <option value="other">Other</option>
            </select>
          </Field>
          {universityChoice === "other" && (
            <Field label="Your university" htmlFor="university">
              <Input id="university" autoComplete="off" required maxLength={120} value={form.university} onChange={set("university")} className={fieldClass("university")} placeholder="Enter your university" aria-invalid={error?.field === "university"} />
            </Field>
          )}
          {showsCmu && (
            <div className="animate-rise space-y-2 rounded-2xl border border-[#c41230]/40 bg-[#c41230]/15 p-3">
              <Label htmlFor="cmuProgram" className="text-sm font-bold">
                CMU program / major
              </Label>
              <CmuProgramPicker value={form.cmuProgram} onChange={(cmuProgram) => setForm((f) => ({ ...f, cmuProgram }))} />
            </div>
          )}
        </div>
      </div>

      {!existing && (
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm leading-snug",
            error?.field === "consent" ? "border-destructive bg-destructive/10" : "border-white/15 bg-white/5",
          )}
        >
          <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5 size-5" />
          <span>
            I get it: my profile and quiz results are visible to other guests. My phone and email are visible to{" "}
            <strong>{contactVisibility === "organizers" ? "organizers only" : "organizers and other guests"}</strong>,
            and organizers may contact me after the party about payments or lost items.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/15 px-3 py-2 text-sm font-semibold text-destructive">
          {error.message}
        </p>
      )}

      <BigButton type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel ?? "Start the quiz →"}
      </BigButton>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </Label>
      {children}
    </div>
  );
}
