import { getLang, translate } from "./i18n";
export type ShopCategory = "bow" | "hat" | "amulet" | "consumable";
export type ShopRarity = "rare" | "epic" | "legendary";

export type ShopIcon = "bow" | "clothes" | "amulet" | "arrow" | "energy" | "armor" | "cyber";

export type ShopItem = {
  icon?: ShopIcon;
  id: string;
  name: string;
  category: ShopCategory;
  rarity: ShopRarity;
  price: number;
  description: string;
};

export type GameMode = "arcade" | "leaderboard";

function readGameModeStorage(): GameMode | null {
  if (typeof window === "undefined") return null;

  const explicit = (window as any).__RHRF_GAME_MODE__;
  if (explicit === "leaderboard" || explicit === "arcade") return explicit;

  try {
    const stored = localStorage.getItem("rf-game-mode");
    if (stored === "leaderboard" || stored === "arcade") return stored;
  } catch {}

  return null;
}

export function getGameMode(): GameMode {
  return readGameModeStorage() ?? "arcade";
}

export function getItemPrice(
  item: { price: number } | null | undefined,
  _mode: GameMode = getGameMode(),
): number {
  return Math.max(0, Math.round(Number(item?.price || 0)));
}

export const CONSUMABLE_CAP = 100;

export const CATALOG: ShopItem[] = [
  { id: "bow_rare", name: "RARE BOW", category: "bow", rarity: "rare", icon: "bow", price: 600, description: "x2 reload" },
  { id: "bow_epic", name: "EPIC BOW", category: "bow", rarity: "epic", icon: "bow", price: 1200, description: "x3 reload" },
  { id: "bow_legendary", name: "LEGENDARY BOW", category: "bow", rarity: "legendary", icon: "bow", price: 2400, description: "x4 reload" },

  { id: "hat_rare", name: "RARE OUTFIT", category: "hat", rarity: "rare", icon: "clothes", price: 600, description: "x2 accuracy" },
  { id: "hat_epic", name: "EPIC OUTFIT", category: "hat", rarity: "epic", icon: "clothes", price: 1200, description: "x3 accuracy" },
  { id: "hat_legendary", name: "LEGENDARY OUTFIT", category: "hat", rarity: "legendary", icon: "clothes", price: 2400, description: "x4 accuracy" },

  { id: "amulet_rare", name: "RARE AMULET", category: "amulet", rarity: "rare", icon: "amulet", price: 600, description: "x2 slow aim" },
  { id: "amulet_epic", name: "EPIC AMULET", category: "amulet", rarity: "epic", icon: "amulet", price: 1200, description: "x3 slow aim" },
  { id: "amulet_legendary", name: "LEGENDARY AMULET", category: "amulet", rarity: "legendary", icon: "amulet", price: 2400, description: "x4 slow aim" },

  { id: "arrow_rare", name: "RARE ARROWS", category: "consumable", rarity: "rare", icon: "arrow", price: 5, description: "x2 score" },
  { id: "arrow_epic", name: "EPIC ARROWS", category: "consumable", rarity: "epic", icon: "arrow", price: 10, description: "x3 score" },
  { id: "arrow_legendary", name: "LEGENDARY ARROWS", category: "consumable", rarity: "legendary", icon: "arrow", price: 15, description: "x4 score" },

  { id: "energy_rare", name: "RARE ENERGY", category: "consumable", rarity: "rare", icon: "energy", price: 5, description: "x2 shots" },
  { id: "energy_epic", name: "EPIC ENERGY", category: "consumable", rarity: "epic", icon: "energy", price: 10, description: "x3 shots" },
  { id: "energy_legendary", name: "LEGENDARY ENERGY", category: "consumable", rarity: "legendary", icon: "energy", price: 15, description: "x4 shots" },

  { id: "armor_rare", name: "RARE ARMOR", category: "consumable", rarity: "rare", icon: "armor", price: 5, description: "-2s stun" },
  { id: "armor_epic", name: "EPIC ARMOR", category: "consumable", rarity: "epic", icon: "armor", price: 10, description: "-4s stun" },
  { id: "armor_legendary", name: "LEGENDARY ARMOR", category: "consumable", rarity: "legendary", icon: "armor", price: 15, description: "-6s stun" },
];

export function getItemById(id: string): ShopItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getItemCount(inventory: string[], id: string): number {
  return inventory.filter((x) => x === id).length;
}

export function sellValue(price: number, rate: number, amount: number): number {
  return Math.floor(Number(price || 0) * Number(rate || 0)) * Math.max(0, Math.floor(Number(amount || 0)));
}

export function fallbackItem(id: string, category: ShopCategory): ShopItem {
  return {
    id,
    name: id.replace(/[_-]/g, " ").toUpperCase(),
    category,
    rarity: "rare",
    price: 0,
    description: translate(getLang(), "item.unknown", undefined, "Unknown inventory item."),
  };
}
