import React from "react";

export type StreakKind = "cyber" | "ghost" | "asteroid";

export interface StreakRank {
  n: number;
  id: string;    // стабильный ключ разблокировки: "<kind>_<n>"
  icon: string;  // форма для BadgeIcon
  label: string;
  kind: StreakKind;
}

// asteroid — защита планеты, луки, неон (11 порогов, финал x101)
const ASTEROID_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,   "spark",       "SPARK"],
  [10,  "archer",      "ARCHER"],
  [20,  "hero",        "HERO"],
  [30,  "ace",         "ACE"],
  [40,  "chainward",   "CHAINWARD"],
  [50,  "master",      "MASTER"],
  [60,  "epic",        "EPIC"],
  [70,  "oracle",      "ORACLE"],
  [80,  "legend",      "LEGEND"],
  [90,  "mythic",      "MYTHIC"],
  [101, "rare_legend", "RARE LEGEND"],
];

// ghost — воздух, прыжки, ветер, полёт (11 порогов, финал x101)
const GHOST_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,   "g_gust",    "SPARK"],
  [10,  "g_leap",    "ARCHER"],
  [20,  "g_feather", "HERO"],
  [30,  "g_spiral",  "ACE"],
  [40,  "g_cloud",   "CHAINWARD"],
  [50,  "g_dart",    "MASTER"],
  [60,  "g_wing",    "EPIC"],
  [70,  "g_eye",     "ORACLE"],
  [80,  "g_comet",   "LEGEND"],
  [90,  "g_phantom", "MYTHIC"],
  [101, "g_crown",   "RARE LEGEND"],
];

// cyber — меткость, перекрестья, точки попадания (каждый x3..x11, финал x11)
const CYBER_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,  "c_aim",    "FIRST TRIPLE"],
  [4,  "c_cross4", "QUAD DRAW"],
  [5,  "c_eye",    "FOCUS LOCK"],
  [6,  "c_rings",  "SIX SENSE"],
  [7,  "c_arrow",  "LUCKY SEVEN"],
  [8,  "c_octa",   "OVERCLOCK"],
  [9,  "c_nine",   "RARE PULSE"],
  [10, "c_ten",    "PERFECT TEN"],
  [11, "c_legend", "CYBER LEGEND"],
];

const build = (kind: StreakKind, rows: ReadonlyArray<readonly [number, string, string]>): readonly StreakRank[] =>
  rows.map(([n, icon, label]) => ({ n, icon, label, kind, id: `${kind}_${n}` }));

export const ASTEROID_RANKS = build("asteroid", ASTEROID_ROWS);
export const GHOST_RANKS    = build("ghost",    GHOST_ROWS);
export const CYBER_RANKS    = build("cyber",    CYBER_ROWS);

export const BADGES_BY_KIND: Record<StreakKind, readonly StreakRank[]> = {
  asteroid: ASTEROID_RANKS,
  ghost:    GHOST_RANKS,
  cyber:    CYBER_RANKS,
};

export function rankForStreak(kind: StreakKind, count: number): StreakRank | null {
  for (const r of BADGES_BY_KIND[kind]) if (r.n === count) return r;
  return null;
}

export function isFinalRank(kind: StreakKind, count: number): boolean {
  const list = BADGES_BY_KIND[kind];
  return list.length > 0 && count >= list[list.length - 1].n;
}

// ---- Цветовые шкалы (HSL, лерп по короткой дуге hue)
const GENERIC_KEYS = [
  { n: 3,   h: 72,  s: 0,   l: 100 },
  { n: 10,  h: 72,  s: 100, l: 50 },  // #ccff00 rare
  { n: 50,  h: 282, s: 100, l: 50 },  // #aa00ff epic
  { n: 80,  h: 40,  s: 100, l: 50 },  // #ffaa00 legendary
  { n: 101, h: 180, s: 100, l: 50 },  // #00ffff cyber
];
const CYBER_KEYS = [
  { n: 3,  h: 180, s: 0,   l: 100 },
  { n: 7,  h: 180, s: 70,  l: 62 },
  { n: 11, h: 180, s: 100, l: 50 },  // #00ffff
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360; else if (d < -180) d += 360;
  return ((a + d * t) % 360 + 360) % 360;
};

export function streakColor(kind: StreakKind, count: number): string {
  const keys = kind === "cyber" ? CYBER_KEYS : GENERIC_KEYS;
  const max = keys[keys.length - 1].n;
  const n = Math.max(keys[0].n, Math.min(max, count));
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].n < n) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const t = b.n === a.n ? 0 : (n - a.n) / (b.n - a.n);
  return `hsl(${lerpHue(a.h, b.h, t).toFixed(1)}, ${lerp(a.s, b.s, t).toFixed(1)}%, ${lerp(a.l, b.l, t).toFixed(1)}%)`;
}

export function streakGradient(kind: StreakKind, count: number): { from: string; to: string; glow: string } {
  if (isFinalRank(kind, count)) return { from: "#00ffff", to: "#ff00ff", glow: "#00ffff" };
  const list = BADGES_BY_KIND[kind];
  const next = list.find((r) => r.n > count);
  return {
    from: streakColor(kind, count),
    to: next ? streakColor(kind, next.n) : streakColor(kind, list[list.length - 1].n),
    glow: streakColor(kind, count),
  };
}

// ---- 100 фраз, 5 тиров по 20
const PHRASES = {
  tier1: [
    "CLEAN RELEASE", "STEADY STRING", "NICE GROUPING", "TARGET LOCKED", "NEON PULSE",
    "GOOD DRAW", "SHARP FLETCHING", "ARROW SYNCED", "CALIBRATED", "SOLID TENSION",
    "QUIET HIT", "FIRST SIGNAL", "CHAIN STARTED", "NONCE INCREMENTED", "TINY SPARK",
    "ON RHYTHM", "NO-MISS ENERGY", "SMOOTH DRAW", "RING WHISPER", "BULLSEYE HANDSHAKE",
  ],
  tier2: [
    "WELL DONE", "GREAT JOB", "HOT QUIVER", "LASER FOCUS", "GHOST STEP",
    "ASTEROID TASTE", "CRITICAL AIM", "PERFECT RELEASE", "DOUBLE-TAP NEON", "CHAIN REACTION",
    "BLOCK CONFIRMED", "VALIDATOR APPROVED", "RARE FORM LOADING", "FRIEND ENERGY RISING", "PRECISION PROTOCOL",
    "SIGNAL AMPLIFIED", "TRAJECTORY BLESSED", "QUIVER OVERCLOCKED", "ORACLE NODS", "MEMPOOL CLEARED",
  ],
  tier3: [
    "SICK RUN", "INSANE GROUPING", "CYBER BEAST", "MASTER DRAW", "HERO AIM",
    "LEGENDARY TENSION", "MAINNET READY", "HARDFORK INCOMING", "GENESIS ARROW", "ROLLUP RUSH",
    "ZERO-MISS PROOF", "QUANTUM FLETCHING", "PLASMA STRING", "NEON DEMIGOD", "DIGITAL DEAD-EYE",
    "ASTEROID BREAKER", "GHOST BANISHER", "BULLSEYE BURNER", "CHAIN SNIPER", "RARE ROUNDS",
  ],
  tier4: [
    "MASTER OF THE BOW", "HERO OF THE RIDGE", "LEGEND IN SIGNAL", "BLOCKCHAIN BOWMAN", "RARE FRIEND ASCENDING",
    "NEON LEGENDARY", "ORACLE APPROVED", "VALIDATOR OF SHOTS", "GENESIS MARKSMAN", "HARDFORK HERO",
    "QUANTUM QUIVER", "ASTEROID LEGEND", "GHOST LEGEND", "CYBER LEGEND", "BULLSEYE IMMORTAL",
    "CHAINBOUND ARCHER", "WALLET OF THE RANGE", "NONCE LEGEND", "SIGMA SHOOTER", "RARE ROUND GOD",
  ],
  tier5: [
    "MYTHIC FRIEND", "PLANET SHIELD", "NEON PLANET SAVER", "RARE LEGEND PROTOCOL", "THE ARROW KNOWS YOUR NAME",
    "THE TARGET FEARS YOU", "THE GHOSTS LEAVE NOTES", "ASTEROIDS FILE A COMPLAINT", "YOUR NICKNAME IS HASHED IN BULLSEYE", "RF DAO WROTE YOU A SONG",
    "THE MOON SALUTES YOU", "THE TOWER LASER ASKS FOR ADVICE", "YOUR QUIVER IS A SECOND BLOCKCHAIN", "EVERY RELEASE IS A GENESIS EVENT", "YOU ARE THE RARE IN RARE FRIENDS",
    "THE RANGE IS YOUR LEDGER", "THE BULLSEYE IS YOUR BLOCK", "RARE LEGEND: FINAL FORM", "CENTURY ARCHER", "THE STRING HAS BECOME ONE WITH YOU",
  ],
} as const;

function tierForCount(n: number): keyof typeof PHRASES {
  if (n >= 80) return "tier5";
  if (n >= 50) return "tier4";
  if (n >= 20) return "tier3";
  if (n >= 10) return "tier2";
  return "tier1";
}

export function buildStreakMessage(kind: StreakKind, count: number, rand: () => number = Math.random): string {
  const rank = rankForStreak(kind, count);
  const kindLabel = kind.toUpperCase();
  const pool = PHRASES[tierForCount(count)];
  const phrase = pool[Math.floor(rand() * pool.length)];
  if (rank && isFinalRank(kind, count)) return `${phrase}! ${kindLabel} STREAK x${count} — ${rank.label}`;
  return `${phrase}! ${kindLabel} STREAK x${count}${rank ? ` — ${rank.label}` : ""}`;
}

// ---- SVG-иконки: три оригинальных набора. asteroid — защита/луки,
// ghost — воздух/прыжок/ветер/полёт, cyber — перекрестья/мишени/меткость.
export function BadgeIcon({ id, size = 28 }: { id: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 32 32", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const dot = { fill: "currentColor", stroke: "none" as const };
  switch (id) {
    // ===== ASTEROID: щит планеты, лук, неон =====
    case "spark":       return <svg {...p}><path d="M16 4 L18 13 L27 16 L18 19 L16 28 L14 19 L5 16 L14 13 Z" /></svg>;
    case "archer":      return <svg {...p}><path d="M8 4 Q22 16 8 28" /><line x1="8" y1="4" x2="8" y2="28" /><line x1="6" y1="16" x2="26" y2="16" /><path d="M22 12 L26 16 L22 20" /></svg>;
    case "hero":        return <svg {...p}><path d="M16 4 L26 8 V16 Q26 25 16 29 Q6 25 6 16 V8 Z" /><path d="M12 16 L15 19 L21 12" /></svg>;
    case "ace":         return <svg {...p}><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="5" /><line x1="16" y1="1" x2="16" y2="8" /><line x1="16" y1="24" x2="16" y2="31" /><line x1="1" y1="16" x2="8" y2="16" /><line x1="24" y1="16" x2="31" y2="16" /></svg>;
    case "chainward":   return <svg {...p}><rect x="4" y="12" width="12" height="8" rx="4" /><rect x="16" y="12" width="12" height="8" rx="4" /></svg>;
    case "master":      return <svg {...p}><path d="M6 26 Q16 2 26 26" /><line x1="6" y1="26" x2="26" y2="26" /><circle cx="16" cy="14" r="2.5" /></svg>;
    case "epic":        return <svg {...p}><path d="M16 2 L24 12 L16 30 L8 12 Z" /><line x1="8" y1="12" x2="24" y2="12" /><line x1="16" y1="2" x2="12" y2="12" /><line x1="16" y1="2" x2="20" y2="12" /></svg>;
    case "oracle":      return <svg {...p}><path d="M3 16 Q16 5 29 16 Q16 27 3 16 Z" /><circle cx="16" cy="16" r="4.5" /></svg>;
    case "legend":      return <svg {...p}><path d="M16 3 L19.5 12 L29 12.5 L21.5 18.5 L24 28 L16 22.5 L8 28 L10.5 18.5 L3 12.5 L12.5 12 Z" /></svg>;
    case "mythic":      return <svg {...p}><path d="M16 3 L29 27 L3 27 Z" /><path d="M16 12 L22 23 L10 23 Z" /></svg>;
    case "rare_legend": return <svg {...p}><path d="M5 24 L5 12 L11 17 L16 8 L21 17 L27 12 L27 24 Z" /><line x1="5" y1="27" x2="27" y2="27" /><circle cx="16" cy="20" r="1.6" /></svg>;

    // ===== GHOST: ветер, прыжок, перо, полёт =====
    case "g_gust":    return <svg {...p}><path d="M5 11 Q13 8 21 11 Q25 12 27 9" /><path d="M4 17 Q12 14 20 17 Q24 18 28 15" /><path d="M7 23 Q14 20 21 23" /></svg>;
    case "g_leap":    return <svg {...p}><path d="M6 26 Q16 4 26 26" /><circle cx="6" cy="26" r="2.2" {...dot} /><circle cx="26" cy="26" r="2.2" {...dot} /></svg>;
    case "g_feather": return <svg {...p}><path d="M23 7 Q9 11 8 25 Q19 23 23 7 Z" /><line x1="23" y1="7" x2="10" y2="24" /><path d="M18 11 L14 13 M20 15 L15 18" /></svg>;
    case "g_spiral":  return <svg {...p}><path d="M16 16 m-2 0 a2 2 0 1 1 4 0" /><path d="M16 16 m-5 0 a5 5 0 1 1 10 0" /><path d="M16 16 m-9 0 a9 9 0 1 1 18 0" /></svg>;
    case "g_cloud":   return <svg {...p}><path d="M8 20 Q8 14 13 14 Q14 9 20 10 Q25 10 25 15 Q28 16 27 20 Z" /><line x1="10" y1="24" x2="24" y2="24" /></svg>;
    case "g_dart":    return <svg {...p}><path d="M20 12 L28 16 L20 20 Z" /><line x1="4" y1="16" x2="20" y2="16" /><line x1="6" y1="11" x2="13" y2="11" /><line x1="6" y1="21" x2="13" y2="21" /></svg>;
    case "g_wing":    return <svg {...p}><path d="M6 22 Q9 11 22 8 Q17 13 19 17 Q13 18 6 22 Z" /><line x1="6" y1="22" x2="27" y2="22" /></svg>;
    case "g_eye":     return <svg {...p}><path d="M4 16 Q16 7 28 16 Q16 25 4 16 Z" /><circle cx="16" cy="16" r="3" /><path d="M9 23 Q16 26 23 23" /></svg>;
    case "g_comet":   return <svg {...p}><circle cx="21" cy="11" r="4" /><line x1="17" y1="15" x2="6" y2="26" /><line x1="20" y1="18" x2="12" y2="26" /><line x1="14" y1="12" x2="6" y2="20" /></svg>;
    case "g_phantom": return <svg {...p}><path d="M16 4 Q26 7 26 17 Q26 24 22 24 Q20 24 20 21 Q18 24 16 24 Q14 24 14 21 Q12 24 10 24 Q6 24 6 17 Q6 7 16 4 Z" /><circle cx="12" cy="14" r="1.6" {...dot} /><circle cx="20" cy="14" r="1.6" {...dot} /></svg>;
    case "g_crown":   return <svg {...p}><path d="M6 21 L6 12 L11 16 L16 8 L21 16 L26 12 L26 21 Z" /><path d="M9 25 Q16 28 23 25" /></svg>;

    // ===== CYBER: перекрестья, мишени, точка попадания =====
    case "c_aim":    return <svg {...p}><circle cx="16" cy="16" r="8" /><circle cx="16" cy="16" r="2" {...dot} /></svg>;
    case "c_cross4": return <svg {...p}><circle cx="16" cy="16" r="7" /><line x1="16" y1="3" x2="16" y2="10" /><line x1="16" y1="22" x2="16" y2="29" /><line x1="3" y1="16" x2="10" y2="16" /><line x1="22" y1="16" x2="29" y2="16" /></svg>;
    case "c_eye":    return <svg {...p}><path d="M4 16 Q16 7 28 16 Q16 25 4 16 Z" /><circle cx="16" cy="16" r="3.5" /><circle cx="16" cy="16" r="1.2" {...dot} /></svg>;
    case "c_rings":  return <svg {...p}><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="7" /><circle cx="16" cy="16" r="3" /></svg>;
    case "c_arrow":  return <svg {...p}><circle cx="18" cy="14" r="8" /><line x1="4" y1="28" x2="14" y2="18" /><path d="M13 16 L19 13 L16 19" /><circle cx="18" cy="14" r="1.5" {...dot} /></svg>;
    case "c_octa":   return <svg {...p}><circle cx="16" cy="16" r="6" /><line x1="16" y1="2" x2="16" y2="9" /><line x1="16" y1="23" x2="16" y2="30" /><line x1="2" y1="16" x2="9" y2="16" /><line x1="23" y1="16" x2="30" y2="16" /><line x1="6" y1="6" x2="10" y2="10" /><line x1="22" y1="22" x2="26" y2="26" /><line x1="26" y1="6" x2="22" y2="10" /><line x1="10" y1="22" x2="6" y2="26" /></svg>;
    case "c_nine":   return <svg {...p}><rect x="6" y="6" width="20" height="20" rx="1" /><line x1="6" y1="12.7" x2="26" y2="12.7" /><line x1="6" y1="19.3" x2="26" y2="19.3" /><line x1="12.7" y1="6" x2="12.7" y2="26" /><line x1="19.3" y1="6" x2="19.3" y2="26" /><circle cx="16" cy="16" r="1.5" {...dot} /></svg>;
    case "c_ten":    return <svg {...p}><circle cx="16" cy="15" r="8" /><circle cx="16" cy="15" r="4" /><circle cx="16" cy="15" r="1" {...dot} /><path d="M6 25 Q3 17 7 11" /><path d="M26 25 Q29 17 25 11" /></svg>;
    case "c_legend": return <svg {...p}><path d="M6 19 L6 11 L11 14 L16 7 L21 14 L26 11 L26 19 Z" /><circle cx="16" cy="24" r="3.5" /><circle cx="16" cy="24" r="1.2" {...dot} /></svg>;

    default:            return <svg {...p}><circle cx="16" cy="16" r="11" /></svg>;
  }
}
