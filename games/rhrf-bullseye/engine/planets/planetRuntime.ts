const ARC_PLANET_ALIAS: Record<string, string> = {
  "arc-intro": "stable",
  "arc-final": "cyber",
};

function normalizePlanet(id: string | null | undefined): string {
  const raw = String(id || "").trim();
  if (!raw) return "stable";
  return ARC_PLANET_ALIAS[raw] || raw;
}

export function getPlanetId(): string {
  try {
    const w = window as any;
    if (w.__RHRF_PLANET__) return normalizePlanet(String(w.__RHRF_PLANET__));

    const q = new URLSearchParams(window.location.search).get("planet");
    if (q) return normalizePlanet(q);

    const stored = localStorage.getItem("rf-planet");
    return normalizePlanet(stored || "stable");
  } catch {
    return "cyber";
  }
}

export const isNftPlanet = () => {
  const id = getPlanetId();
  return id === "stable";
};

const SAT_BEAM: Record<string, string> = {
  cyber:  "#ccff00",
  stable: "#ccff00",
  nft:    "#aa00ff",
};
export function getSatBeamColor(planetId: string): string {
  return SAT_BEAM[planetId] || SAT_BEAM.cyber;
}

const PLANET_ORDER = ["stable", "nft", "bitcoin", "rwa"];
export const TOWER_ANT_Y = 300;
export const TOWER_ANT_W = 24;

const TEMP_TIER: Record<string, number> = { cyber: 1 };

export function getPlanetTier(planetId: string): number {
  if (TEMP_TIER[planetId]) return TEMP_TIER[planetId];
  const i = PLANET_ORDER.indexOf(planetId);
  return i < 0 ? 1 : i + 1;
}
export const ASTEROID_SPEED_STEP = 1.05;
export const GHOST_SPEED_STEP = 1.10;
export function asteroidSpeedMult(tier: number): number {
  return Math.pow(ASTEROID_SPEED_STEP, tier - 1);
}
export function ghostSpeedMult(tier: number): number {
  return Math.pow(GHOST_SPEED_STEP, tier - 1);
}

export type RfObject = "bull" | "asteroid" | "bullseye";

const RF_BASE:  Record<RfObject, number> = { bull: 10, asteroid: 25, bullseye: 10 };
const RF_FLAT:  Record<RfObject, number> = { bull: 10, asteroid: 25, bullseye: 10 };

const RF_RAMP: Record<RfObject, number[]> = {
  bull:     [1, 2, 3, 4, 5],
  asteroid: [1, 2, 4, 8, 16],
  bullseye: [1, 2, 3, 4, 5],
};

export function rfPayout(obj: RfObject, hits: number, tier: number, rank: number): number {
  const ramp = RF_RAMP[obj][Math.min(tier, 5) - 1] ?? 1;
  return hits * RF_BASE[obj] * ramp + RF_FLAT[obj] + rank;
}

export const PLANET_MAIN_COLOR: Record<string, string> = {
  stable: "#ccff00",
  nft: "#aa00ff",
  bitcoin: "#F7931A",
  rwa: "#00ffff",
  cyber: "#00ffff",
};

export function getPlanetMainColor(planetId: string): string {
  return PLANET_MAIN_COLOR[planetId] || PLANET_MAIN_COLOR.cyber;
}

export const PLANET_ACCENT: Record<string, string> = {
  cyber:   "#ccff00",
  stable:  "#C7E36C",
  nft:     "#aa00ff",
  bitcoin: "#F7931A",
  rwa:     "#00ffff",
};

export function getPlanetAccent(planetId: string): string {
  return PLANET_ACCENT[planetId] || PLANET_ACCENT.cyber;
}

export function getNextPlanet(planetId: string): string {
  const i = PLANET_ORDER.indexOf(planetId);
  return PLANET_ORDER[(i + 1) % PLANET_ORDER.length] || "stable";
}

export function setPlanet(planetId: string): void {
  try {
    localStorage.setItem("rf-planet", planetId);
  } catch {

  }
}

export const SCENE_W = 1000;
export type Side = "left" | "right";
export const PLANET_LAYOUT: Record<string, { hero: Side; tower: Side }> = {
  stable:  { hero: "right", tower: "left"  },
  nft:     { hero: "left",  tower: "right" },
  bitcoin: { hero: "right", tower: "right" },
  rwa:     { hero: "left",  tower: "left"  },
  cyber:   { hero: "left",  tower: "left"  },
};
export function getLayout(planetId: string) {
  return PLANET_LAYOUT[planetId] || PLANET_LAYOUT.cyber;
}
export function mirrorX(x: number, side: Side): number {
  return side === "right" ? SCENE_W - x : x;
}

const HERO_X_BASE = 240;
const HERO_WIDTH = 80;
const TARGET_X_BASE = 580;
const TOWER_X_BASE = 140;

export function heroLeftX(pid: string): number {
  return getLayout(pid).hero === "right"
    ? SCENE_W - HERO_X_BASE - HERO_WIDTH
    : HERO_X_BASE;
}

export function heroCenterX(pid: string): number {
  return heroLeftX(pid) + HERO_WIDTH / 2;
}

export function heroX(pid: string): number {
  return heroLeftX(pid);
}

export function targetX(pid: string): number {
  return mirrorX(TARGET_X_BASE, getLayout(pid).hero);
}

export function towerX(pid: string): number {
  return mirrorX(TOWER_X_BASE, getLayout(pid).tower);
}
