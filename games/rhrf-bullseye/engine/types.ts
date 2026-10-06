
// TYPES

export type Screen = "home" | "range" | "shop" | "guide" | "profile";
export type ShopTab = "bow" | "hat" | "amulet";
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type ItemCategory = "bow" | "hat" | "amulet";

export interface ItemDef {
  id: string;
  name: string;
  effect: string;
  pricePts: number;
  priceRf: number;
  rarity: Rarity;
  multiplier: number;
  category: ItemCategory;
}

export interface RankInfo {
  color: string;
  name: Rarity;
  glow: string;
}

export interface UserLevelInfo {
  level: number;
  multiplier: number;
  name: string;
  nextThreshold: number;
}

export interface CrosshairState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ArrowAnimState {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}