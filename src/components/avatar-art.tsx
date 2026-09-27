import type { CSSProperties, ReactNode } from "react";
import type { AvatarType } from "@/lib/avatars";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface Props {
  type: AvatarType | null | undefined;
  /** CSS size (both axes). */
  size?: number | string;
  className?: string;
  /** Show the gradient badge ring behind the character. */
  ring?: boolean;
  style?: CSSProperties;
}

/**
 * Inline SVG party avatars. No image requests, scales to any size, and each
 * one gets its own gradient so cards stay colorful even when tiny.
 */
export function AvatarArt({ type, size = 64, className, ring = true, style }: Props) {
  const meta = type ? AVATARS[type] : null;
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full", className)}
      style={{
        width: dim,
        height: dim,
        background: ring && meta ? `linear-gradient(135deg, ${meta.from}, ${meta.to})` : "rgba(255,255,255,0.08)",
        ...style,
      }}
      aria-label={meta ? meta.name : "Still taking the quiz"}
      role="img"
    >
      <svg viewBox="0 0 100 100" width="82%" height="82%" aria-hidden="true">
        {type ? ART[type] : <Unknown />}
      </svg>
    </span>
  );
}

const Unknown = () => (
  <g>
    <circle cx="50" cy="50" r="34" fill="rgba(255,255,255,0.15)" />
    <text x="50" y="62" textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff">
      ?
    </text>
  </g>
);

const eyes = (cx1: number, cx2: number, cy: number, r = 4, fill = "#14102a") => (
  <>
    <circle cx={cx1} cy={cy} r={r} fill={fill} />
    <circle cx={cx2} cy={cy} r={r} fill={fill} />
    <circle cx={cx1 + 1.4} cy={cy - 1.4} r={r / 3} fill="#fff" />
    <circle cx={cx2 + 1.4} cy={cy - 1.4} r={r / 3} fill="#fff" />
  </>
);

const shades = (x: number, y: number, w = 40) => (
  <g>
    <rect x={x} y={y} width={w * 0.44} height="11" rx="4" fill="#14102a" />
    <rect x={x + w * 0.56} y={y} width={w * 0.44} height="11" rx="4" fill="#14102a" />
    <rect x={x + w * 0.42} y={y + 3} width={w * 0.16} height="3" fill="#14102a" />
    <rect x={x + 3} y={y + 2} width={w * 0.16} height="3" rx="1.5" fill="#fff" opacity="0.7" />
  </g>
);

const ART: Record<AvatarType, ReactNode> = {
  ghost: (
    <g>
      <path
        d="M50 14c-19 0-30 14-30 32v36l9-7 9 7 12-8 12 8 9-7 9 7V46c0-18-11-32-30-32z"
        fill="#fff"
        opacity="0.92"
      />
      <path d="M32 44c4-10 12-16 18-16" stroke="#fff" strokeWidth="3" opacity="0.6" fill="none" strokeLinecap="round" />
      {shades(30, 38, 40)}
      <path d="M43 58 q7 6 14 0" stroke="#14102a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="78" cy="22" r="4" fill="#ffb347" />
      <circle cx="20" cy="30" r="3" fill="#22d3ee" />
      <path d="M68 12 l3 6 -6 0z" fill="#ff5fa2" />
    </g>
  ),
  life_of_party: (
    <g>
      <line x1="50" y1="2" x2="50" y2="12" stroke="#14102a" strokeWidth="3" />
      <circle cx="50" cy="48" r="34" fill="#f4f0ff" />
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={22 + c * 10}
            y={20 + r * 10}
            width="8"
            height="8"
            rx="1.5"
            fill={["#ff5fa2", "#ffb347", "#22d3ee", "#a78bfa", "#a3e635"][(r * 3 + c) % 5]}
            opacity={0.35 + ((r + c) % 3) * 0.2}
          />
        )),
      )}
      <circle cx="50" cy="48" r="34" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
      {shades(30, 40, 40)}
      <path d="M40 60 q10 10 20 0" stroke="#14102a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M10 20 l4 -8 4 8z" fill="#a3e635" />
      <circle cx="88" cy="26" r="4" fill="#ff5fa2" />
      <rect x="80" y="70" width="8" height="8" rx="2" fill="#22d3ee" transform="rotate(20 84 74)" />
      <circle cx="14" cy="76" r="3.5" fill="#ffb347" />
    </g>
  ),
  chameleon: (
    <g>
      <path d="M70 70 c14 4 20 14 8 20 c-8 3 -14 -6 -6 -10" fill="none" stroke="#4ade80" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="46" cy="54" rx="30" ry="22" fill="url(#chg)" />
      <defs>
        <linearGradient id="chg" x1="0" x2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="0.5" stopColor="#a3e635" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <ellipse cx="66" cy="46" rx="17" ry="14" fill="#a3e635" />
      <circle cx="70" cy="42" r="8" fill="#fff" />
      <circle cx="71" cy="41" r="4" fill="#14102a" />
      <circle cx="72.5" cy="39.5" r="1.3" fill="#fff" />
      <path d="M72 54 q8 2 12 -2" stroke="#14102a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M58 26 l-4 -12 8 6 4 -10 2 12" fill="#ff5fa2" />
      <circle cx="30" cy="56" r="4" fill="#fff" opacity="0.5" />
      <circle cx="42" cy="62" r="3" fill="#fff" opacity="0.4" />
      <rect x="22" y="72" width="10" height="6" rx="3" fill="#166534" />
      <rect x="50" y="74" width="10" height="6" rx="3" fill="#166534" />
    </g>
  ),
  drinking_machine: (
    <g>
      <rect x="22" y="26" width="56" height="50" rx="10" fill="#e5e7eb" />
      <rect x="28" y="32" width="44" height="22" rx="6" fill="#14102a" />
      <line x1="50" y1="12" x2="50" y2="26" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx="50" cy="10" r="5" fill="#ff5fa2" />
      <circle cx="40" cy="43" r="5" fill="#22d3ee" />
      <circle cx="60" cy="43" r="5" fill="#22d3ee" />
      <circle cx="41.5" cy="41.5" r="1.5" fill="#fff" />
      <circle cx="61.5" cy="41.5" r="1.5" fill="#fff" />
      <path d="M40 66 q10 8 20 0" stroke="#14102a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="66" r="3" fill="#a3e635" />
      <circle cx="68" cy="66" r="3" fill="#ffb347" />
      <path d="M6 58 h14 l-2 22 h-10z" fill="#ff5fa2" />
      <path d="M80 58 h14 l-2 22 h-10z" fill="#a78bfa" />
      <rect x="8" y="56" width="10" height="3" fill="#fff" opacity="0.7" />
      <rect x="82" y="56" width="10" height="3" fill="#fff" opacity="0.7" />
      <rect x="36" y="78" width="10" height="12" rx="3" fill="#cbd5e1" />
      <rect x="54" y="78" width="10" height="12" rx="3" fill="#cbd5e1" />
    </g>
  ),
  game_goblin: (
    <g>
      <path d="M22 44 l-14 -20 18 8" fill="#4ade80" />
      <path d="M78 44 l14 -20 -18 8" fill="#4ade80" />
      <ellipse cx="50" cy="52" rx="30" ry="28" fill="#4ade80" />
      <path d="M32 40 q6 -8 14 -2" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M54 38 q8 -6 14 2" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
      {eyes(40, 60, 48, 5)}
      <path d="M36 62 q14 12 28 0" stroke="#14102a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 63 l3 6 3 -6" fill="#fff" />
      <path d="M54 63 l3 6 3 -6" fill="#fff" />
      <g transform="rotate(-30 80 78)">
        <rect x="76" y="70" width="8" height="24" rx="3" fill="#f59e0b" />
        <circle cx="80" cy="64" r="10" fill="#ff5fa2" />
      </g>
      <rect x="8" y="72" width="14" height="14" rx="3" fill="#fff" />
      <circle cx="12" cy="76" r="1.8" fill="#14102a" />
      <circle cx="18" cy="82" r="1.8" fill="#14102a" />
      <circle cx="15" cy="79" r="1.8" fill="#14102a" />
    </g>
  ),
  side_quest: (
    <g>
      <path d="M0 84 q25 -10 50 0 t50 0 v16 h-100z" fill="#14102a" opacity="0.35" />
      <circle cx="50" cy="30" r="14" fill="#fde68a" />
      <path d="M34 30 h32 l-3 -8 h-26z" fill="#a16207" />
      <rect x="30" y="28" width="40" height="4" rx="2" fill="#854d0e" />
      {eyes(45, 55, 33, 2.6)}
      <path d="M46 40 q4 3 8 0" stroke="#14102a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="40" y="44" width="20" height="26" rx="6" fill="#f43f5e" />
      <rect x="26" y="46" width="14" height="20" rx="5" fill="#a16207" />
      <line x1="66" y1="48" x2="66" y2="90" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="70" x2="44" y2="88" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
      <line x1="54" y1="70" x2="60" y2="88" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="84" cy="22" r="10" fill="#fff" />
      <circle cx="84" cy="22" r="8" fill="none" stroke="#14102a" strokeWidth="1.5" />
      <path d="M84 15 l3 7 -3 7 -3 -7z" fill="#f43f5e" />
    </g>
  ),
  observer: (
    <g>
      <path d="M8 50 q42 -40 84 0 q-42 40 -84 0z" fill="#fff" />
      <circle cx="50" cy="50" r="18" fill="#38bdf8" />
      <circle cx="50" cy="50" r="10" fill="#14102a" />
      <circle cx="54" cy="45" r="3.5" fill="#fff" />
      <path d="M14 46 q36 -30 72 0" stroke="#14102a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="30" y1="22" x2="26" y2="16" stroke="#14102a" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="16" x2="50" y2="9" stroke="#14102a" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="22" x2="74" y2="16" stroke="#14102a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="80" r="3" fill="#818cf8" />
      <circle cx="84" cy="82" r="3" fill="#38bdf8" />
      <path d="M40 84 h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </g>
  ),
  kitchen_npc: (
    <g>
      <path d="M26 40 h48 l-6 46 h-36z" fill="#fff" />
      {Array.from({ length: 4 }).map((_, i) => (
        <rect key={i} x={30 + i * 11} y="40" width="5" height="46" fill="#f43f5e" opacity="0.85" />
      ))}
      <path d="M22 40 h56 v8 h-56z" fill="#fef3c7" />
      {[30, 42, 54, 66, 36, 60, 48, 24, 72].map((x, i) => (
        <circle key={i} cx={x} cy={34 - (i % 3) * 6} r="5.5" fill={i % 2 ? "#fde68a" : "#fff7ed"} stroke="#f59e0b" strokeWidth="1.2" />
      ))}
      {eyes(42, 58, 62, 3.5)}
      <path d="M44 72 q6 5 12 0" stroke="#14102a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="76" r="4" fill="#a3e635" />
      <circle cx="88" cy="70" r="3" fill="#22d3ee" />
    </g>
  ),
};

export function AvatarEmoji({ type }: { type: AvatarType | null | undefined }) {
  return <span aria-hidden="true">{type ? AVATARS[type].emoji : "❔"}</span>;
}
