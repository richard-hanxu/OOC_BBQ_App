"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BigButton } from "@/components/ui-bits";
import { isCmu, type PublicParticipant } from "@/lib/types";
import { cn } from "@/lib/utils";

const CMU_PROGRAMS = [
  "MS Robotics",
  "Computer Science",
  "ECE",
  "Mechanical Engineering",
  "Tepper MBA",
  "MISM",
  "HCI",
  "Machine Learning",
  "Civil & Environmental",
  "MSE",
  "Design",
  "Other",
];

interface Props {
  /** When set, the form edits an existing profile instead of creating one. */
  existing?: PublicParticipant;
  onSaved?: (p: PublicParticipant) => void;
  submitLabel?: string;
}

export function ProfileForm({ existing, onSaved, submitLabel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: existing?.firstName ?? "",
    lastName: existing?.lastName ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    undergraduateUniversity: existing?.undergraduateUniversity ?? "",
    graduateUniversity: existing?.graduateUniversity ?? "",
    cmuProgram: existing?.cmuProgram ?? "",
  });
  const [consent, setConsent] = useState(Boolean(existing));
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const showsCmu = useMemo(
    () => isCmu(form.undergraduateUniversity) || isCmu(form.graduateUniversity),
    [form.undergraduateUniversity, form.graduateUniversity],
  );

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error?.field === k) setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!existing && !consent) {
      setError({ message: "Please tick the box so everyone knows the deal.", field: "consent" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        undergraduateUniversity: form.undergraduateUniversity || null,
        graduateUniversity: form.graduateUniversity || null,
        cmuProgram: showsCmu ? form.cmuProgram || null : null,
        consent,
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
      else router.push("/join/activities");
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

      <div className="pt-2">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Optional</div>
        <div className="space-y-3">
          <Field label="Undergrad university" htmlFor="undergraduateUniversity">
            <Input id="undergraduateUniversity" list="uni-list" autoComplete="off" value={form.undergraduateUniversity} onChange={set("undergraduateUniversity")} className={fieldClass("undergraduateUniversity")} placeholder="e.g. Carnegie Mellon University" />
          </Field>
          <Field label="Grad university" htmlFor="graduateUniversity">
            <Input id="graduateUniversity" list="uni-list" autoComplete="off" value={form.graduateUniversity} onChange={set("graduateUniversity")} className={fieldClass("graduateUniversity")} placeholder="If applicable" />
          </Field>
          <datalist id="uni-list">
            {["Carnegie Mellon University", "University of Pittsburgh", "Penn State", "University of Toronto", "UC Berkeley", "MIT", "Stanford", "University of Michigan", "Georgia Tech", "Cornell", "Duquesne University", "Chatham University"].map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          {showsCmu && (
            <div className="animate-rise space-y-2 rounded-2xl border border-[#c41230]/40 bg-[#c41230]/15 p-3">
              <Label htmlFor="cmuProgram" className="text-sm font-bold">
                CMU program / major
              </Label>
              <Input id="cmuProgram" list="cmu-programs" autoComplete="off" value={form.cmuProgram} onChange={set("cmuProgram")} className={fieldClass("cmuProgram")} placeholder="e.g. MS Robotics" />
              <datalist id="cmu-programs">
                {CMU_PROGRAMS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5">
                {CMU_PROGRAMS.slice(0, 5).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm((f) => ({ ...f, cmuProgram: p }))}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                      form.cmuProgram === p ? "bg-white text-[#14102a]" : "bg-white/10 hover:bg-white/20",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
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
            I get it: my name, phone and email will be visible to <strong>other guests at this party</strong> in this
            private directory, so people can actually find me. Nothing is public.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/15 px-3 py-2 text-sm font-semibold text-destructive">
          {error.message}
        </p>
      )}

      <BigButton type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel ?? "Next: what are you down for? →"}
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
