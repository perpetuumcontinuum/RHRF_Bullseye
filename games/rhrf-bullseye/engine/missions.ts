import { CONSUMABLE_CAP } from "./catalog";

export type MissionRarity = "rare" | "epic" | "legendary";

export interface PlanetMissions {
  bow: boolean;
  hat: boolean;
  amulet: boolean;
  arrows: boolean;
}

export interface MissionItemIds {
  bow: string;
  hat: string;
  amulet: string;
  arrow: string;
}

const STORAGE_KEY = "rhrf-missions-v1";

export function emptyMissions(): PlanetMissions {
  return { bow: false, hat: false, amulet: false, arrows: false };
}

export function requiredRarity(tier: number): MissionRarity {
  if (tier <= 1) return "rare";
  if (tier === 2) return "epic";
  return "legendary";
}

export function missionItemIds(tier: number): MissionItemIds {
  const rarity = requiredRarity(tier);
  return {
    bow: `bow_${rarity}`,
    hat: `hat_${rarity}`,
    amulet: `amulet_${rarity}`,
    arrow: `arrow_${rarity}`,
  };
}

function asBool(value: unknown): boolean {
  return value === true;
}

function sanitizeMissions(value: unknown): PlanetMissions {
  const row = (value && typeof value === "object") ? value as Record<string, unknown> : {};
  return {
    bow: asBool(row.bow),
    hat: asBool(row.hat),
    amulet: asBool(row.amulet),
    arrows: asBool(row.arrows),
  };
}

export function loadMissions(): Record<string, PlanetMissions> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, PlanetMissions> = {};
    for (const key of Object.keys(parsed)) {
      out[String(key)] = sanitizeMissions(parsed[key]);
    }
    if (out.nft && !out.stable) out.stable = out.nft;
    return out;
  } catch {
    return {};
  }
}

export function saveMissions(missions: Record<string, PlanetMissions>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {

  }
}

export function arrowCap(): number {
  return CONSUMABLE_CAP;
}

export type MissionSupplyKind = "arrow" | "energy" | "armor";

export function getMissionSupplyKind(planetId: string): MissionSupplyKind {
  if (planetId === "nft") return "energy";
  if (planetId === "bitcoin") return "armor";
  return "arrow";
}

export function missionSupplyItemId(planetId: string, tier: number): string {
  return `${getMissionSupplyKind(planetId)}_${requiredRarity(tier)}`;
}

export function missionSupplyLabel(kind: MissionSupplyKind): string {
  if (kind === "energy") return "ENERGY";
  if (kind === "armor") return "SHIELDS";
  return "ARROWS";
}
