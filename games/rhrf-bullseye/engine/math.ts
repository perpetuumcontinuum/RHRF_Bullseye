

export const TARGET_CX = 580;
export const TARGET_CY = 360;
export const TARGET_R = 81;
export const ARROW_START_X = 330;
export const ARROW_START_Y = 440;

export function getRandomPointInTarget(): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * TARGET_R;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

export function calculateScore(dist: number): number {
  if (dist > TARGET_R) return 0;
  const ring = Math.floor(dist / 8.1);
  return Math.max(1, 10 - ring);
}

export function getScoreColor(score: number): string {
  if (score === 10) return '#ffaa00';
  if (score >= 7) return '#aa00ff';
  if (score >= 4) return '#ccff00';
  return '#00ffff';
}

export type Rarity = 'Rare' | 'Epic' | 'Legendary';
export type ItemType = 'bow' | 'amulet' | 'hat';

export interface ShopItem {
  id: string;
  name: string;
  rarity: Rarity;
  type: ItemType;
  price: number;
  multiplier?: number;
  speedModifier?: number;
  accuracyBonus?: number;
  description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bow_legendary',
    name: "Robin Hood's Bow",
    rarity: 'Legendary',
    type: 'bow',
    price: 500,
    multiplier: 3.0,
    description: 'x3.0 score multiplier'
  },
  {
    id: 'amulet_legendary',
    name: 'Ethereum Amulet',
    rarity: 'Legendary',
    type: 'amulet',
    price: 500,
    speedModifier: 0.5,
    description: 'Slows crosshair by 50% (#ccff00)'
  },
  {
    id: 'hat_legendary',
    name: 'Robin Hood Hat',
    rarity: 'Legendary',
    type: 'hat',
    price: 500,
    accuracyBonus: 0.5,
    description: 'Laser stays near center 50% more often'
  }
];

export function calculateFinalScore(baseScore: number, bowMultiplier: number): number {
  return Math.floor(baseScore * bowMultiplier);
}

export function getRarityColor(rarity: Rarity): string {
  if (rarity === 'Legendary') return '#ffd700';
  if (rarity === 'Epic') return '#ff00ff';
  return '#ccff00';
}

export function getItemEffect(item: ShopItem): {
  multiplier: number;
  speedMod: number;
  accuracyBonus: number;
} {
  return {
    multiplier: item.multiplier || 1,
    speedMod: item.speedModifier || 1,
    accuracyBonus: item.accuracyBonus || 0
  };
}

export function getRarityMult(id: string | null | undefined): number {
  if (!id) return 1;
  const lower = id.toLowerCase();
  if (lower.includes('legendary')) return 4;
  if (lower.includes('epic')) return 3;
  if (lower.includes('rare')) return 2;
  return 1;
}
