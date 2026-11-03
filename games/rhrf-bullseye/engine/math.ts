
export const TARGET_CX = 580;
export const TARGET_CY = 360;
export const TARGET_R = 81;
export const TARGET_LOGO_DIAMETER = TARGET_R * 2;

export function logoFitTransform(
  bbox: { x: number; y: number; width: number; height: number },
  diameter: number = TARGET_LOGO_DIAMETER,
  opticalScale: number = 1,
): string {
  const size = Math.max(bbox.width, bbox.height);
  const scale = (size > 0 ? diameter / size : 1) * opticalScale;
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  return `scale(${scale}) translate(${-cx}, ${-cy})`;
}

export const ARROW_START_X = 330;
export const ARROW_START_Y = 440;

export const DEFAULT_WEAPON_COLORS: Record<string, string> = {
  stable: "#000000",
  nft: "#000000",
  bitcoin: "#000000",
  rwa: "#000000",
  cyber: "#000000",
};

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
  if (score === 10) return '#F7931A';
  if (score >= 7) return '#aa00ff';
  if (score >= 4) return '#ccff00';
  return '#00ffff';
}

export function getNftHitColor(x: number, y: number): string {
  const d = Math.hypot(x, y);
  if (d <= 8.1) return "#00ffff";
  if (d <= 32.4) return "#F7931A";
  if (d <= 56.7) return "#aa00ff";
  return "#ccff00";
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

export function calculateFinalScore(baseScore: number, bowMultiplier: number): number {
  return Math.floor(baseScore * bowMultiplier);
}

export function getRarityColor(rarity: Rarity): string {
  if (rarity === 'Legendary') return '#F7931A';
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
