"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import type { HostProfile as Host } from "@/lib/hosts";

export function HostProfile({ host }: { host: Host }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = host.fullName || host.firstName;

  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={`Meet ${host.firstName}, your host`}
        className="rounded-sm font-semibold text-sky underline decoration-sky/50 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        {host.firstName}
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/15 bg-background p-6 text-center shadow-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Your OOC BBQ host</div>
        <div className="mx-auto my-5 flex size-36 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20">
          {host.photoSrc && !photoFailed ? (
            // Host-supplied local or remote photos; no image optimizer/domain setup required.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={host.photoSrc} alt={`Portrait of ${name}`} width={144} height={144} className="size-full object-cover" onError={() => setPhotoFailed(true)} />
          ) : <span aria-label="Profile photo coming soon" className="text-6xl font-extrabold text-white/80">{host.firstName[0]}</span>}
        </div>
        <Dialog.Title className="text-2xl font-extrabold">{name}</Dialog.Title>
        <Dialog.Description className="mt-2 text-base text-white/75">{host.major || "Major to be added"}</Dialog.Description>
        {!host.fullName && <p className="mt-3 text-xs text-muted-foreground">Full profile coming soon.</p>}
        <Dialog.Close className="mt-6 min-h-11 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold transition-colors hover:bg-white/15">See you at the BBQ!</Dialog.Close>
        <Dialog.Close aria-label="Close host profile" className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-xl">×</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
