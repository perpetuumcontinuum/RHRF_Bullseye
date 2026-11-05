export const rfIsConsumableItem = (item: any) => {
  if (!item) return false;
  const category = String(item.category ?? "").toLowerCase();
  const id = String(item.id ?? "").toLowerCase();
  return (
    category === "consumable" ||
    id.includes("arrow") ||
    id.includes("armor") ||
    id.includes("energy")
  );
};

export const rfCyberBlocksItem = (cyberActive: boolean, item: any) =>
  Boolean(cyberActive) && !rfIsConsumableItem(item);
