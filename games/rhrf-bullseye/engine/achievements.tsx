import React from "react";

export type StreakKind = "cyber" | "ghost" | "asteroid";

export interface StreakRank {
  n: number;
  id: string;
  label: string;
}

// 13 универсальных рангов стрика, финал — RARE LEGEND на x1000
export const STREAK_RANKS: readonly StreakRank[] = [
  { n: 3,    id: "spark",       label: "SPARK" },
  { n: 10,   id: "archer",      label: "ARCHER" },
  { n: 50,   id: "hero",        label: "HERO" },
  { n: 100,  id: "rare",        label: "RARE" },
  { n: 200,  id: "ace",         label: "ACE" },
  { n: 300,  id: "chainward",   label: "CHAINWARD" },
  { n: 400,  id: "master",      label: "MASTER" },
  { n: 500,  id: "epic",        label: "EPIC" },
  { n: 600,  id: "oracle",      label: "ORACLE" },
  { n: 700,  id: "validator",   label: "VALIDATOR" },
  { n: 800,  id: "legend",      label: "LEGEND" },
  { n: 900,  id: "mythic",      label: "MYTHIC" },
  { n: 1000, id: "rare_legend", label: "RARE LEGEND" },
];

export function rankForStreak(count: number): StreakRank | null {
  for (const r of STREAK_RANKS) if (r.n === count) return r;
  return null;
}

// ---- Цветовая шкала: белый неон -> rare lime -> epic purple -> legendary orange -> cyber cyan
// Ключевые точки в HSL, лерп по короткой дуге hue (чтобы lime->purple шёл через неоновый
// красный/мадженту, а не через грязно-серый).
const KEYS = [
  { n: 3,    h: 72,  s: 0,   l: 100 }, // белый
  { n: 100,  h: 72,  s: 100, l: 50 },  // #ccff00 rare
  { n: 500,  h: 282, s: 100, l: 50 },  // #aa00ff epic
  { n: 900,  h: 40,  s: 100, l: 50 },  // #ffaa00 legendary
  { n: 1000, h: 180, s: 100, l: 50 },  // #00ffff cyber
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  return ((a + d * t) % 360 + 360) % 360;
};

export function streakColor(count: number): string {
  const n = Math.max(3, Math.min(1000, count));
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1].n < n) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const t = b.n === a.n ? 0 : (n - a.n) / (b.n - a.n);
  return `hsl(${lerpHue(a.h, b.h, t).toFixed(1)}, ${lerp(a.s, b.s, t).toFixed(1)}%, ${lerp(a.l, b.l, t).toFixed(1)}%)`;
}

export function streakGradient(count: number): { from: string; to: string; glow: string } {
  if (count >= 1000) return { from: "#00ffff", to: "#ff00ff", glow: "#00ffff" };
  const nextRank = STREAK_RANKS.find((r) => r.n > count);
  return {
    from: streakColor(count),
    to: nextRank ? streakColor(nextRank.n) : streakColor(1000),
    glow: streakColor(count),
  };
}

// ---- 100 фраз, 5 тиров по 20, эмоциональность растёт с порогом
const PHRASES = {
  tier1: [ // x3–x9
    "CLEAN RELEASE", "STEADY STRING", "NICE GROUPING", "TARGET LOCKED", "NEON PULSE",
    "GOOD DRAW", "SHARP FLETCHING", "ARROW SYNCED", "CALIBRATED", "SOLID TENSION",
    "QUIET HIT", "FIRST SIGNAL", "CHAIN STARTED", "NONCE INCREMENTED", "TINY SPARK",
    "ON RHYTHM", "NO-MISS ENERGY", "SMOOTH DRAW", "RING WHISPER", "BULLSEYE HANDSHAKE",
  ],
  tier2: [ // x10–x49
    "WELL DONE", "GREAT JOB", "HOT QUIVER", "LASER FOCUS", "GHOST STEP",
    "ASTEROID TASTE", "CRITICAL AIM", "PERFECT RELEASE", "DOUBLE-TAP NEON", "CHAIN REACTION",
    "BLOCK CONFIRMED", "VALIDATOR APPROVED", "RARE FORM LOADING", "FRIEND ENERGY RISING", "PRECISION PROTOCOL",
    "SIGNAL AMPLIFIED", "TRAJECTORY BLESSED", "QUIVER OVERCLOCKED", "ORACLE NODS", "MEMPOOL CLEARED",
  ],
  tier3: [ // x50–x99
    "SICK RUN", "INSANE GROUPING", "CYBER BEAST", "MASTER DRAW", "HERO AIM",
    "LEGENDARY TENSION", "MAINNET READY", "HARDFORK INCOMING", "GENESIS ARROW", "ROLLUP RUSH",
    "ZERO-MISS PROOF", "QUANTUM FLETCHING", "PLASMA STRING", "NEON DEMIGOD", "DIGITAL DEAD-EYE",
    "ASTEROID BREAKER", "GHOST BANISHER", "BULLSEYE BURNER", "CHAIN SNIPER", "RARE ROUNDS",
  ],
  tier4: [ // x100–x499
    "MASTER OF THE BOW", "HERO OF THE RIDGE", "LEGEND IN SIGNAL", "BLOCKCHAIN BOWMAN", "RARE FRIEND ASCENDING",
    "NEON LEGENDARY", "ORACLE APPROVED", "VALIDATOR OF SHOTS", "GENESIS MARKSMAN", "HARDFORK HERO",
    "QUANTUM QUIVER", "ASTEROID LEGEND", "GHOST LEGEND", "CYBER LEGEND", "BULLSEYE IMMORTAL",
    "CHAINBOUND ARCHER", "WALLET OF THE RANGE", "NONCE LEGEND", "SIGMA SHOOTER", "RARE ROUND GOD",
  ],
  tier5: [ // x500+
    "MYTHIC FRIEND", "PLANET SHIELD", "NEON PLANET SAVER", "RARE LEGEND PROTOCOL", "THE ARROW KNOWS YOUR NAME",
    "THE TARGET FEARS YOU", "THE GHOSTS LEAVE NOTES", "ASTEROIDS FILE A COMPLAINT", "YOUR NICKNAME IS HASHED IN BULLSEYE", "RF DAO WROTE YOU A SONG",
    "THE MOON SALUTES YOU", "THE TOWER LASER ASKS FOR ADVICE", "YOUR QUIVER IS A SECOND BLOCKCHAIN", "EVERY RELEASE IS A GENESIS EVENT", "YOU ARE THE RARE IN RARE FRIENDS",
    "THE RANGE IS YOUR LEDGER", "THE BULLSEYE IS YOUR BLOCK", "RARE LEGEND: FINAL FORM", "BLOCK ONE THOUSAND", "THE STRING HAS BECOME ONE WITH YOU",
  ],
} as const;

function tierForCount(n: number): keyof typeof PHRASES {
  if (n >= 500) return "tier5";
  if (n >= 100) return "tier4";
  if (n >= 50) return "tier3";
  if (n >= 10) return "tier2";
  return "tier1";
}

export function buildStreakMessage(
  kind: StreakKind,
  count: number,
  rand: () => number = Math.random
): string {
  const rank = rankForStreak(count);
  const kindLabel = kind.toUpperCase();
  const pool = PHRASES[tierForCount(count)];
  const phrase = pool[Math.floor(rand() * pool.length)];
  if (count >= 1000) return `${phrase}! ${kindLabel} STREAK x${count} — RARE LEGEND`;
  return `${phrase}! ${kindLabel} STREAK x${count}${rank ? ` — ${rank.label}` : ""}`;
}

// ---- 13 SVG-иконок, неоновый stroke, цвет наследуется (currentColor)
export function BadgeIcon({ id, size = 28 }: { id: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 32 32", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "spark":       return <svg {...p}><path d="M16 4 L18 13 L27 16 L18 19 L16 28 L14 19 L5 16 L14 13 Z" /></svg>;
    case "archer":      return <svg {...p}><path d="M8 4 Q22 16 8 28" /><line x1="8" y1="4" x2="8" y2="28" /><line x1="6" y1="16" x2="26" y2="16" /><path d="M22 12 L26 16 L22 20" /></svg>;
    case "hero":        return <svg {...p}><path d="M16 4 L26 8 V16 Q26 25 16 29 Q6 25 6 16 V8 Z" /><path d="M12 16 L15 19 L21 12" /></svg>;
    case "rare":        return <svg {...p}><path d="M16 3 L28 16 L16 29 L4 16 Z" /><path d="M16 9 L23 16 L16 23 L9 16 Z" /></svg>;
    case "ace":         return <svg {...p}><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="5" /><line x1="16" y1="1" x2="16" y2="8" /><line x1="16" y1="24" x2="16" y2="31" /><line x1="1" y1="16" x2="8" y2="16" /><line x1="24" y1="16" x2="31" y2="16" /></svg>;
    case "chainward":   return <svg {...p}><rect x="4" y="12" width="12" height="8" rx="4" /><rect x="16" y="12" width="12" height="8" rx="4" /></svg>;
    case "master":      return <svg {...p}><path d="M6 26 Q16 2 26 26" /><line x1="6" y1="26" x2="26" y2="26" /><circle cx="16" cy="14" r="2.5" /></svg>;
    case "epic":        return <svg {...p}><path d="M16 2 L24 12 L16 30 L8 12 Z" /><line x1="8" y1="12" x2="24" y2="12" /><line x1="16" y1="2" x2="12" y2="12" /><line x1="16" y1="2" x2="20" y2="12" /></svg>;
    case "oracle":      return <svg {...p}><path d="M3 16 Q16 5 29 16 Q16 27 3 16 Z" /><circle cx="16" cy="16" r="4.5" /></svg>;
    case "validator":   return <svg {...p}><rect x="6" y="6" width="20" height="20" rx="3" /><path d="M11 16 L15 20 L22 11" /></svg>;
    case "legend":      return <svg {...p}><path d="M16 3 L19.5 12 L29 12.5 L21.5 18.5 L24 28 L16 22.5 L8 28 L10.5 18.5 L3 12.5 L12.5 12 Z" /></svg>;
    case "mythic":      return <svg {...p}><path d="M16 3 L29 27 L3 27 Z" /><path d="M16 12 L22 23 L10 23 Z" /></svg>;
    case "rare_legend": return <svg {...p}><path d="M5 24 L5 12 L11 17 L16 8 L21 17 L27 12 L27 24 Z" /><line x1="5" y1="27" x2="27" y2="27" /><circle cx="16" cy="20" r="1.6" /></svg>;
    default:            return <svg {...p}><circle cx="16" cy="16" r="11" /></svg>;
  }
}
