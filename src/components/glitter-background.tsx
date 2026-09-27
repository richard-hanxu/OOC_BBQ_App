"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Deterministic positions keep server and client markup identical.
const LAYERS = [0.25, 0.55, 1].map((depth, layer) => ({
  depth,
  particles: Array.from({ length: 24 }, (_, i) => ({
    x: (i * 37 + layer * 19 + 7) % 100,
    y: (i * 61 + layer * 31 + 11) % 100,
    size: layer === 2 && i % 5 === 0 ? 6 : 1.5 + ((i + layer) % 3),
    color: ["#ffb347", "#ffb8d5", "#c4b5fd", "#a5f3fc"][(i + layer) % 4],
    duration: 5 + (i % 5),
    delay: -((i * 1.7 + layer * 2.3) % 9),
  })),
}));

// One short flyby roughly every seven seconds, with quiet gaps between them.
const SHOOTING_EMOJIS = [
  { emoji: "🌭", top: 28, delay: 2, color: "#ffb347" },
  { emoji: "😎", top: 76, delay: 9, color: "#fcd34d" },
  { emoji: "🍔", top: 48, delay: 16, color: "#ffb8d5" },
  { emoji: "🏐", top: 88, delay: 23, color: "#a5f3fc" },
  { emoji: "🛟", top: 36, delay: 30, color: "#c4b5fd" },
  { emoji: "🍉", top: 65, delay: 37, color: "#a3e635" },
];

export function GlitterBackground() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      if (motion.matches || document.hidden) return;
      element.style.setProperty("--glitter-x", `${x * 22}px`);
      element.style.setProperty("--glitter-y", `${y * 18 - Math.min(window.scrollY, 900) * 0.07}px`);
    };
    const schedule = () => {
      if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(paint);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
      y = event.clientY / Math.max(window.innerHeight, 1) * 2 - 1;
      schedule();
    };
    const resetPointer = () => { x = 0; y = 0; schedule(); };
    const syncMotion = () => {
      cancelAnimationFrame(frame); frame = 0;
      element.dataset.paused = String(document.hidden || motion.matches);
      if (motion.matches) {
        element.style.setProperty("--glitter-x", "0px");
        element.style.setProperty("--glitter-y", "0px");
      } else schedule();
    };

    syncMotion();
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", syncMotion);
    motion.addEventListener("change", syncMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", syncMotion);
      motion.removeEventListener("change", syncMotion);
    };
  }, []);

  return <div ref={root} aria-hidden="true" className="glitter-background">
    {SHOOTING_EMOJIS.map((item) => <span key={item.emoji} className="party-shooting-emoji" style={{
      top: `${item.top}%`, animationDelay: `${item.delay}s`, "--trail-color": item.color,
    } as CSSProperties}>
      <span className="party-shooting-emoji-glyph">{item.emoji}</span>
    </span>)}
    {LAYERS.map((layer, index) => <div key={index} className="glitter-layer" style={{ "--depth": layer.depth } as CSSProperties}>
      <div className="glitter-drift" style={{ animationDuration: `${24 + index * 8}s`, animationDelay: `${-index * 7}s` }}>
        {layer.particles.map((particle, i) => <span key={i} className={`glitter-speck${particle.size === 6 ? " glitter-star" : ""}`} style={{
          left: `${particle.x}%`, top: `${particle.y}%`, width: particle.size, height: particle.size,
          color: particle.color, animationDuration: `${particle.duration}s`, animationDelay: `${particle.delay}s`,
        }} />)}
      </div>
    </div>)}
  </div>;
}
