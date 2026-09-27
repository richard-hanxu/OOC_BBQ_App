"use client";

import { Dialog } from "radix-ui";
import { AvatarArt } from "@/components/avatar-art";
import { AVATARS, type AvatarType } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const SUMMARIES: Record<AvatarType, string> = {
  ghost: "The Ghost prefers a low-key entrance, a little people-watching, and an exit that needs no announcement. Independent and selective about the spotlight, this type enjoys the party on their own terms.",
  life_of_party: "The Life of the Party brings the energy, takes the initiative, and rarely lets an awkward silence win. This type is happiest getting people involved and turning an ordinary hangout into a story.",
  chameleon: "The Chameleon fits into almost any corner of the party. Balanced answers and a flexible outlook make this type comfortable with different people, different opinions, and changing plans.",
  drinking_machine: "The Drinking Machine is the high-energy wildcard: spontaneous, relaxed about small rules, and ready to keep the night moving. The name is a playful party archetype, not a measure of how much someone drinks.",
  game_goblin: "The Game Goblin brings competitive spirit and plenty of confidence. This type jumps into a challenge, backs their own judgment, and may turn even a friendly debate into a contest.",
  side_quest: "The Side Quest follows an unpredictable mix of strong opinions and unexpected instincts. This type is hard to put in a box, values doing things their own way, and often ends up with the strangest story of the night.",
  observer: "The Observer notices everything without needing to be at the center of it. Considerate of boundaries and less drawn to chaos, this type thinks things through and keeps a clear view of what is going on.",
  kitchen_npc: "The Kitchen NPC is the familiar face in the comfortable corner of the party. With a steady social pace and surprisingly strong opinions about small things, this type makes an ordinary snack break worth staying for.",
};

export function AvatarSummary({ type, name, isMe = false, size = 56, className }: {
  type: AvatarType | null;
  name?: string;
  isMe?: boolean;
  size?: number;
  className?: string;
}) {
  if (!type) return <AvatarArt type={null} size={size} className={className} />;
  const meta = AVATARS[type];
  const title = meta.name.replace(/^The /, "");
  const article = /^[aeiou]/i.test(title) ? "an" : "a";
  const intro = isMe
    ? `You took the test and found out you are ${article} ${title}.`
    : name
      ? `${name} took the test and found out they are ${article} ${title}.`
      : `Meet the ${title}.`;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" aria-label={`About ${isMe ? "your" : name ? `${name}'s` : "the"} ${title} avatar`}
          className={cn("shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", className)}>
          <AvatarArt type={type} size={size} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/15 bg-background p-6 shadow-2xl">
          <Dialog.Title className="pr-8 text-xl font-extrabold leading-snug">{intro}</Dialog.Title>
          <div className="my-5 flex justify-center"><AvatarArt type={type} size={120} /></div>
          <Dialog.Description className="text-base leading-relaxed text-white/85">{SUMMARIES[type]}</Dialog.Description>
          <Dialog.Close className="mt-5 min-h-11 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold">Got it</Dialog.Close>
          <Dialog.Close aria-label="Close avatar summary" className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-xl">×</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
