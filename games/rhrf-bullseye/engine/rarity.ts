export const RARITY_COLORS: Record<string, string> = {
  rare: "#ccff00",
  epic: "#aa00ff",
  legendary: "#F7931A",
};
export const getRarityKey = (id?: string | null): string | null => {
  const v = String(id || "").toLowerCase();
  if (v.includes("legendary")) return "legendary";
  if (v.includes("epic")) return "epic";
  if (v.includes("rare")) return "rare";
  return null;
};
export const rarityColor = (id?: string | null): string | null =>
  RARITY_COLORS[getRarityKey(id) || ""] || null;
