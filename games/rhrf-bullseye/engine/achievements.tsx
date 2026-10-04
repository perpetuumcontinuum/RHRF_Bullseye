import React from "react";

export type StreakKind = "cyber" | "ghost" | "asteroid";
export type BadgeKind = StreakKind | "time" | "rf";

export interface StreakRank {
  n: number;
  id: string;
  icon: string;
  label: string;
  kind: BadgeKind;
}

// RF — заработанные очки. Верхний блок, красный как базовый лук, глиф = сама сумма
const RF_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [1000,     "rf_1000",     "FIRST MINT"],
  [10000,    "rf_10000",    "TEN FOLD"],
  [100000,   "rf_100000",   "HUNDRED HASH"],
  [1000000,  "rf_1000000",  "MEGA VAULT"],
  [10000000, "rf_10000000", "RARE TREASURY"],
];

const GHOST_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,   "g_gust",    "FIRST DODGE"],
  [10,  "g_leap",    "PHASE WALKER"],
  [20,  "g_feather", "AIRBORNE"],
  [30,  "g_spiral",  "WIND RIDER"],
  [40,  "g_cloud",   "GHOST DANCER"],
  [50,  "g_dart",    "VOID SURFER"],
  [60,  "g_wing",    "SPECTRE BANE"],
  [70,  "g_eye",     "UNTOUCHABLE"],
  [80,  "g_comet",   "GHOST DREAD"],
  [90,  "g_phantom", "AERIAL LEGEND"],
  [101, "g_crown",   "RARE LEGEND"],
];

const ASTEROID_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,   "spark",       "FIRST SHIELD"],
  [10,  "archer",      "ROCK BREAKER"],
  [20,  "hero",        "DEBRIS DUSTER"],
  [30,  "ace",         "IMPACT GUARD"],
  [40,  "chainward",   "ASTEROID DREAD"],
  [50,  "master",      "ORBIT WARDEN"],
  [60,  "epic",        "SKY SENTINEL"],
  [70,  "oracle",      "PLANET SAVIOR"],
  [80,  "legend",      "VOID BULWARK"],
  [90,  "mythic",      "COSMIC AEGIS"],
  [101, "rare_legend", "RARE LEGEND"],
];

const CYBER_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [3,  "c_aim",    "TRIPLE THREAT"],
  [4,  "c_cross4", "QUAD LOCK"],
  [5,  "c_eye",    "FIVE STAR AIM"],
  [6,  "c_rings",  "SIXTH SENSE"],
  [7,  "c_arrow",  "LUCKY SEVEN"],
  [8,  "c_octa",   "OVERCLOCK"],
  [9,  "c_nine",   "RARE PULSE"],
  [10, "c_ten",    "PERFECT TEN"],
  [11, "c_legend", "CYBER LEGEND"],
];

const TIME_ROWS: ReadonlyArray<readonly [number, string, string]> = [
  [1,    "t_1",    "RARE BEGINNING"],
  [100,  "t_100",  "FIRST DIAL"],
  [200,  "t_200",  "TWIN DIALS"],
  [300,  "t_300",  "TRIPLE CHIME"],
  [400,  "t_400",  "QUARTZ VEIN"],
  [500,  "t_500",  "HALF MILLENNIA"],
  [600,  "t_600",  "SIX BELLS"],
  [700,  "t_700",  "SEVEN GEARS"],
  [800,  "t_800",  "OCTA CHIME"],
  [900,  "t_900",  "NINE HANDS"],
  [1000, "t_1000", "MILLENNIUM DIAL"],
  [1001, "t_1001", "RARE TIME LEGEND"],
];

const build = (kind: BadgeKind, rows: ReadonlyArray<readonly [number, string, string]>): readonly StreakRank[] =>
  rows.map(([n, icon, label]) => ({ n, icon, label, kind, id: `${kind}_${n}` }));

export const RF_RANKS        = build("rf",       RF_ROWS);
export const GHOST_RANKS     = build("ghost",    GHOST_ROWS);
export const ASTEROID_RANKS  = build("asteroid", ASTEROID_ROWS);
export const CYBER_RANKS     = build("cyber",    CYBER_ROWS);
export const TIME_RANKS      = build("time",     TIME_ROWS);

export const BADGES_BY_KIND: Record<BadgeKind, readonly StreakRank[]> = {
  rf:       RF_RANKS,
  ghost:    GHOST_RANKS,
  asteroid: ASTEROID_RANKS,
  cyber:    CYBER_RANKS,
  time:     TIME_RANKS,
};

// Порядок блоков в профиле: RF сверху, далее по редкости
export const BADGE_ORDER: readonly BadgeKind[] = ["rf", "ghost", "asteroid", "cyber", "time"];

export const KIND_COLOR: Record<BadgeKind, string> = {
  rf:       "#ff2d2d",  // base bow/arrow red
  ghost:    "#ccff00",  // RARE
  asteroid: "#aa00ff",  // EPIC
  cyber:    "#ffaa00",  // LEGENDARY
  time:     "#00ffff",  // CYBER
};

const KIND_HUE: Record<BadgeKind, number> = { rf: 0, ghost: 72, asteroid: 282, cyber: 40, time: 180 };

export function rankForStreak(kind: BadgeKind, count: number): StreakRank | null {
  for (const r of BADGES_BY_KIND[kind]) if (r.n === count) return r;
  return null;
}

export function isFinalRank(kind: BadgeKind, count: number): boolean {
  const list = BADGES_BY_KIND[kind];
  return list.length > 0 && count >= list[list.length - 1].n;
}

// Рампа внутри блока: низшие ранги бледные, высшие — полный неон своего hue.
// RF идёт по красной шкале: темно-красный -> яркий красный.
export function streakColor(kind: BadgeKind, count: number): string {
  const list = BADGES_BY_KIND[kind];
  const first = list[0].n;
  const last = list[list.length - 1].n;
  const idx = list.findIndex((r) => r.n === count);
  const t = idx >= 0
    ? idx / (list.length - 1)
    : Math.max(0, Math.min(1, (count - first) / (last - first)));

  if (kind === "rf") return `hsl(0, 100%, ${(34 + 18 * t).toFixed(1)}%)`;

  const sat = 30 + 70 * t;
  const light = 92 - 42 * t;
  return `hsl(${KIND_HUE[kind]}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
}

// Фон карточки = тон редкости этого ранга; glow = та же рампа с альфой.
// (Раньше склеивалось `${color}55`, что ломало hsl-значение в невалидный CSS.)
export function streakTint(kind: BadgeKind, count: number): string {
  const a = kind === "rf" ? 0.34 : 0.16;
  return streakColor(kind, count).replace("hsl(", "hsla(").replace(")", `, ${a})`);
}

export function streakGlow(kind: BadgeKind, count: number): string {
  return streakColor(kind, count).replace("hsl(", "hsla(").replace(")", ", 0.45)");
}

export function streakGradient(kind: BadgeKind, count: number): { from: string; to: string; glow: string } {
  if (isFinalRank(kind, count)) return { from: "#00ffff", to: "#ff00ff", glow: "#00ffff" };
  const list = BADGES_BY_KIND[kind];
  const next = list.find((r) => r.n > count);
  return {
    from: streakColor(kind, count),
    to: next ? streakColor(kind, next.n) : streakColor(kind, list[list.length - 1].n),
    glow: streakColor(kind, count),
  };
}

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

const TIME_PHRASES = [
  ["TIME WELL SPENT", "THE DIAL REMEMBERS", "EVERY TICK COUNTS", "HOURS HASHED", "PATIENCE MINED", "THE CLOCK BOWS", "SLOW DRAW"],
  ["CHRONO FRIEND", "LONG RUN ARCHER", "GEARS IN YOUR FAVOR", "THE RANGE NEVER FORGETS", "TIME IS ON CHAIN", "HOURS INTO SIGNAL", "THE MOON SETS TWICE"],
  ["ONE WITH THE CLOCK", "SLOW BURN LEGEND", "THE TOWER TICKS FOR YOU", "DIAL FULL, QUIVER FULL", "THE GHOSTS GOT OLD", "ASTEROIDS LOST COUNT", "RARE TIME LEGEND: FINAL FORM"],
] as const;

export function buildTimeMessage(hours: number, rand: () => number = Math.random): string {
  const group = hours <= 300 ? 0 : hours <= 700 ? 1 : 2;
  const pool = TIME_PHRASES[group];
  const phrase = pool[Math.floor(rand() * pool.length)];
  const rank = rankForStreak("time", hours);
  return `${phrase}! TIME SERVED ${hours}H${rank ? ` — ${rank.label}` : ""}`;
}

const RF_PHRASES = [
  ["FIRST MINT", "RF LANDED", "COIN DROPPED", "SMALL PAYOUT", "GENESIS PROFIT"],
  ["STACKING UP", "RF ACCRUES", "TEN FOLD SIGNAL", "QUIVER FUNDED", "VAULT FILLING"],
  ["HUNDRED HASH", "BIG BLOCK", "RF RAIN", "TREASURY STIRRING", "WHALE INCOMING"],
  ["MEGA VAULT", "RF FLOOD", "THE DAO NOTICES", "LEDGER BULGING", "MINT MACHINE"],
  ["RARE TREASURY", "YOU ARE THE ECONOMY", "RF WEEPS FOR MERCY", "THE BOW PRINTS MONEY", "RARE TREASURY: FINAL FORM"],
] as const;

export function compactRf(n: number): string {
  return n >= 1e6 ? `${n / 1e6}M` : n >= 1e3 ? `${n / 1e3}K` : String(n);
}

export function buildRfMessage(amount: number, rand: () => number = Math.random): string {
  const idx = RF_RANKS.findIndex((r) => r.n === amount);
  const pool = RF_PHRASES[Math.max(0, Math.min(RF_PHRASES.length - 1, idx))];
  const phrase = pool[Math.floor(rand() * pool.length)];
  const rank = rankForStreak("rf", amount);
  return `${phrase}! EARNED ${compactRf(amount)} RF${rank ? ` — ${rank.label}` : ""}`;
}

export function BadgeIcon({ id, size = 28 }: { id: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 32 32", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const dot = { fill: "currentColor", stroke: "none" as const };

  // RF: сама сумма, чёрные цифры с белой окантовкой — как отчеканенная монета
  if (id.startsWith("rf_")) {
    const n = Number(id.slice(3)) || 0;
    const txt = compactRf(n);
    const fs = txt.length <= 2 ? 13 : txt.length === 3 ? 11 : 9.5;
    return (
      <svg {...p}>
        <text x="16" y="16" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Courier New', monospace" fontWeight="900" fontSize={fs}
          fill="#000" stroke="#fff" strokeWidth="0.9" paintOrder="stroke fill markers"
          style={{ letterSpacing: "-0.5px" }}>{txt}</text>
      </svg>
    );
  }

  // TIME: циферблат, заполняемый пропорционально hours/1000
  if (id.startsWith("t_")) {
    const hours = Number(id.slice(2)) || 0;
    // floor, иначе 1ч дал бы невидимый клинышек 0.36°
    const fill = Math.max(0.02, Math.min(1, hours / 1000));
    const crown = hours >= 1001;
    const C = 16, R = 11;
    const ang = fill * 2 * Math.PI;
    const ex = C + R * Math.sin(ang);
    const ey = C - R * Math.cos(ang);
    const large = fill > 0.5 ? 1 : 0;
    const full = fill >= 0.999;
    return (
      <svg {...p}>
        <circle cx={C} cy={C} r={R + 2} />
        {full ? (
          <circle cx={C} cy={C} r={R} fill="currentColor" stroke="none" opacity={0.8} />
        ) : (
          <path
            d={`M${C},${C} L${C},${C - R} A${R},${R} 0 ${large},1 ${ex.toFixed(2)},${ey.toFixed(2)} Z`}
            fill="currentColor" stroke="none" opacity={0.5}
          />
        )}
        <line x1={C} y1={C - 15} x2={C} y2={C - 13} />
        <line x1={C} y1={C + 13} x2={C} y2={C + 15} />
        <line x1={C - 15} y1={C} x2={C - 13} y2={C} />
        <line x1={C + 13} y1={C} x2={C + 15} y2={C} />
        <circle cx={C} cy={C} r={1.4} {...dot} />
        {crown && <path d="M10 1 L13 4 L16 0 L19 4 L22 1 L22 4 L10 4 Z" />}
      </svg>
    );
  }

  switch (id) {
    // ===== GHOST =====
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

    // ===== ASTEROID =====
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

    // ===== CYBER =====
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
