"use client";

import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bold gradient CTA button that's comfortable for thumbs. */
export function BigButton({
  children,
  className,
  variant = "hot",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "hot" | "cool" | "ghost" | "lime" }) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold text-[#14102a] shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        variant === "hot" && "grad-hot shadow-[0_10px_30px_-10px_rgba(255,95,162,0.7)]",
        variant === "cool" && "grad-cool shadow-[0_10px_30px_-10px_rgba(34,211,238,0.6)]",
        variant === "lime" && "grad-lime shadow-[0_10px_30px_-10px_rgba(163,230,53,0.6)]",
        variant === "ghost" && "glass text-foreground shadow-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BigLink({
  href,
  children,
  className,
  variant = "hot",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "hot" | "cool" | "ghost" | "lime";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold text-[#14102a] shadow-lg transition-transform active:scale-[0.98]",
        variant === "hot" && "grad-hot shadow-[0_10px_30px_-10px_rgba(255,95,162,0.7)]",
        variant === "cool" && "grad-cool shadow-[0_10px_30px_-10px_rgba(34,211,238,0.6)]",
        variant === "lime" && "grad-lime shadow-[0_10px_30px_-10px_rgba(163,230,53,0.6)]",
        variant === "ghost" && "glass text-foreground shadow-none",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("glass rounded-3xl p-4", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className, eyebrow }: { children: ReactNode; className?: string; eyebrow?: string }) {
  return (
    <div className={cn("mb-3", className)}>
      {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>}
      <h2 className="text-2xl font-extrabold leading-tight">{children}</h2>
    </div>
  );
}

export function Pill({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className={cn("inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold", className)}
    >
      {children}
    </span>
  );
}

/** Animated count-up number; respects reduced motion. */
export function CountUp({ value, suffix = "", duration = 900, className }: { value: number; suffix?: string; duration?: number; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <span className={cn("tabular", className)}>
      {shown}
      {suffix}
    </span>
  );
}

const CONFETTI_COLORS = ["#ff5fa2", "#ffb347", "#a3e635", "#22d3ee", "#a78bfa", "#ffffff"];

/** CSS-only confetti burst. Deterministic layout from the index, no library. */
export function Confetti({ count = 48 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 37) % 100;
        const delay = ((i * 13) % 10) / 10;
        const dur = 2.2 + ((i * 7) % 10) / 8;
        const drift = ((i % 5) - 2) * 40;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              ["--delay" as string]: `${delay}s`,
              ["--dur" as string]: `${dur}s`,
              ["--drift" as string]: `${drift}px`,
              transform: `rotate(${(i * 47) % 360}deg)`,
              width: i % 3 === 0 ? 8 : 11,
              height: i % 4 === 0 ? 8 : 16,
              borderRadius: i % 4 === 0 ? "50%" : 2,
            }}
          />
        );
      })}
    </div>
  );
}

/** Lightweight floating emoji background decoration. */
export function FloatingIcons({ icons, className }: { icons: string[]; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {icons.map((icon, i) => (
        <span
          key={i}
          className="absolute select-none text-3xl opacity-40 animate-float"
          style={{
            left: `${(i * 23 + 7) % 90}%`,
            top: `${(i * 31 + 5) % 85}%`,
            animationDelay: `${(i % 4) * 0.9}s`,
            animationDuration: `${5 + (i % 3)}s`,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center">
      <div className="text-5xl">{emoji}</div>
      <div className="text-lg font-bold">{title}</div>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-3 w-full">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}
