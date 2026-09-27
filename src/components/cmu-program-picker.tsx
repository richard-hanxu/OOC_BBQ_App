"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Input } from "@/components/ui/input";
import { CMU_PROGRAMS, programLabel, searchPrograms } from "@/lib/cmu-programs";
import { cn } from "@/lib/utils";

export function CmuProgramPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const results = searchPrograms(query);
  function choose(label: string) { onChange(label); setOpen(false); }

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) { setQuery(""); setShowCustom(false); setCustom(value); } }}>
    <Dialog.Trigger asChild><button id="cmuProgram" type="button" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[#c41230]/40 bg-gradient-to-r from-[#c41230]/15 to-violet-500/10 px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-violet-400/60 focus-visible:outline-2 focus-visible:outline-ring">
      <span className={cn("break-words", value ? "font-semibold" : "text-muted-foreground")}>{value || "🎓 Find your CMU program"}</span><span aria-hidden="true" className="shrink-0 text-muted-foreground">⌄</span>
    </button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/15 bg-background shadow-2xl">
        <div className="space-y-2 border-b border-white/10 bg-gradient-to-br from-[#c41230]/20 to-violet-500/10 p-5">
          <Dialog.Title className="pr-8 text-xl font-extrabold">🎓 Find your major</Dialog.Title>
          <Dialog.Description className="text-xs leading-relaxed text-muted-foreground">{CMU_PROGRAMS.length} CMU degree and major options. Search a name, acronym, or school.</Dialog.Description>
          <Input aria-label="Search CMU programs" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try Robotics, ECE, MBA…" className="h-12 rounded-xl bg-black/20 text-base" />
          <p role="status" className="text-[11px] text-muted-foreground">{results.length} {results.length === 1 ? "match" : "matches"}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {results.map((program) => { const label = programLabel(program); const selected = value === label;
            return <button key={label} type="button" onClick={() => choose(label)} aria-pressed={selected} className={cn("flex min-h-16 w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring", selected && "bg-violet-400/15")}>
              <span aria-hidden="true" className="mt-0.5 text-2xl">{program.emoji}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm leading-snug"><strong className="text-violet-200">{program.acronym}</strong> <span className="text-white/85">[{program.name}]</span></span><span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{program.school} · {program.level}</span></span>
              {selected && <span aria-label="Selected" className="text-lime">✓</span>}
            </button>;
          })}
          {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No match yet. Try another spelling or add your own below.</p>}
        </div>
        <div className="space-y-2 border-t border-white/10 bg-white/5 p-3">
          {showCustom ? <div className="space-y-2"><Input aria-label="Other CMU program" value={custom} maxLength={240} onChange={(e) => setCustom(e.target.value)} placeholder="🎓 ACRONYM [Your degree name]" className="h-11 rounded-xl" /><button type="button" disabled={!custom.trim()} onClick={() => choose(custom.trim())} className="min-h-11 w-full rounded-xl bg-violet-500 px-3 text-sm font-bold disabled:opacity-40">Use this program</button></div>
            : <button type="button" onClick={() => setShowCustom(true)} className="min-h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-bold">Other / not listed? Add your own</button>}
          <div className="flex justify-between"><button type="button" onClick={() => choose("")} className="min-h-10 px-2 text-xs text-muted-foreground">Leave blank</button><Dialog.Close className="min-h-10 px-2 text-xs font-bold">Cancel</Dialog.Close></div>
        </div>
        <Dialog.Close aria-label="Close program picker" className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-xl">×</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
