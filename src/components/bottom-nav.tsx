"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/me", label: "Me", icon: "🫵" },
  { href: "/people", label: "People", icon: "🧑‍🤝‍🧑" },
  { href: "/activities", label: "Activities", icon: "🏓" },
  { href: "/opinions", label: "Opinions", icon: "📊" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d0a1a]/85 backdrop-blur-xl safe-bottom"
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pt-2">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition-colors",
                active ? "bg-white/12 text-white" : "text-muted-foreground active:bg-white/8",
              )}
            >
              <span className={cn("text-xl leading-none", active && "animate-wiggle")} aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
