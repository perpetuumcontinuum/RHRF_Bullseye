export type ShopCategory = "bow" | "hat" | "amulet" | "consumable";
export type ShopRarity = "rare" | "epic" | "legendary";

export type ShopItem = {
  id: string;
  name: string;
  category: ShopCategory;
  rarity: ShopRarity;
  price: number;
  description: string;
};

export const CONSUMABLE_CAP = 100;

export const CATALOG: ShopItem[] = [
  { id: "bow_rare", name: "RARE BOW", category: "bow", rarity: "rare", price: 40, description: "Stable basic bow. Small accuracy bonus." },
  { id: "bow_epic", name: "EPIC BOW", category: "bow", rarity: "epic", price: 90, description: "Neon reinforced bow. Better arrow control." },
  { id: "bow_legendary", name: "LEGENDARY BOW", category: "bow", rarity: "legendary", price: 180, description: "Cyber Robinhood prototype. Maximum shot precision." },

  { id: "hat_rare", name: "RARE OUTFIT", category: "hat", rarity: "rare", price: 35, description: "Outfit tint. Softly recolors the Friend body by rarity." },
  { id: "hat_epic", name: "EPIC OUTFIT", category: "hat", rarity: "epic", price: 80, description: "Outfit tint. Softly recolors the Friend body by rarity." },
  { id: "hat_legendary", name: "LEGENDARY OUTFIT", category: "hat", rarity: "legendary", price: 160, description: "Outfit tint. Softly recolors the Friend body by rarity." },

  { id: "amulet_rare", name: "RARE AMULET", category: "amulet", rarity: "rare", price: 45, description: "Basic luck charm. Small score chance boost." },
  { id: "amulet_epic", name: "EPIC AMULET", category: "amulet", rarity: "epic", price: 100, description: "Signal crystal. Better multiplier chances." },
  { id: "amulet_legendary", name: "LEGENDARY AMULET", category: "amulet", rarity: "legendary", price: 200, description: "Genesis fragment. High risk, high reward." },

  { id: "arrow_rare", name: "RARE ARROWS", category: "consumable", rarity: "rare", price: 25, description: "Standard neon arrows. Basic score." },
  { id: "arrow_epic", name: "EPIC ARROWS", category: "consumable", rarity: "epic", price: 60, description: "Charged arrows. Better bullseye impact." },
  { id: "arrow_legendary", name: "LEGENDARY ARROWS", category: "consumable", rarity: "legendary", price: 120, description: "Prototype arrows. Massive score potential." },

  { id: "energy_rare", name: "RARE ENERGY", category: "consumable", rarity: "rare", price: 30, description: "Basic tower charge. Satellite-friendly energy." },
  { id: "energy_epic", name: "EPIC ENERGY", category: "consumable", rarity: "epic", price: 80, description: "Enhanced tower charge. Higher asteroid bounty." },
  { id: "energy_legendary", name: "LEGENDARY ENERGY", category: "consumable", rarity: "legendary", price: 160, description: "Prototype tower charge. Maximum asteroid bounty." },

  { id: "armor_rare", name: "RARE ARMOR", category: "consumable", rarity: "rare", price: 40, description: "Blocks one cyber ghost charge penalty." },
  { id: "armor_epic", name: "EPIC ARMOR", category: "consumable", rarity: "epic", price: 85, description: "Stronger shield. Reduces charge risk." },
  { id: "armor_legendary", name: "LEGENDARY ARMOR", category: "consumable", rarity: "legendary", price: 160, description: "Genesis plating. Almost full charge protection." },
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
    description: "Unknown inventory item.",
  };
}
