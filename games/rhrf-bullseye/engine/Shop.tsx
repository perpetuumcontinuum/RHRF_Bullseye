import React, { useMemo, useState } from "react";
import {
  CATALOG,
  CONSUMABLE_CAP,
  getItemCount,
  type ShopItem,
} from "./catalog";

const rfIsConsumableItem = (item: any) => {
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

const rfCyberBlocksItem = (cyberActive: boolean, item: any) =>
  Boolean(cyberActive) && !rfIsConsumableItem(item);

const TABS = [
  { id: "bow", label: "BOWS" },
  { id: "hat", label: "CLOTHES" },
  { id: "amulet", label: "AMULETS" },
  { id: "consumable", label: "ITEMS" },
] as const;

export default function Shop(props: any) {
  const [activeTab, setActiveTab] = useState<string>("bow");

  const items = useMemo(() => CATALOG, []);
  const visibleItems = items.filter((item) => item.category === activeTab);

  const totalScore = Number(props.totalScore ?? props.score ?? 0);
  const inventory: string[] = Array.isArray(props.inventory) ? props.inventory.map(String) : [];

  const isEquipped = (item: ShopItem) => {
    if (item.id.startsWith("arrow_")) return props.equippedArrow === item.id;
    if (item.id.startsWith("armor_")) return props.equippedArmor === item.id;
    if (item.id.startsWith("energy_")) return props.equippedEnergy === item.id;
    if (item.category === "bow") return props.equippedBow === item.id;
    if (item.category === "hat") return props.equippedHat === item.id;
    if (item.category === "amulet") return props.equippedAmulet === item.id;
    return false;
  };

  const canAfford = (price: number, amount = 1) => totalScore >= Number(price || 0) * amount;
  const close = () => { if (props.onClose) props.onClose(); };
  const addConsumable = (item: ShopItem, amount: number) => {
    if (props.onAddConsumable) { props.onAddConsumable(item, amount); return; }
    if (props.onBuy) props.onBuy(item);
  };
  const toggleEquip = (item: ShopItem) => {
    if (props.onToggleEquip) { props.onToggleEquip(item); return; }
    if (props.onEquip) props.onEquip(item.id);
  };
  const buyNonConsumable = (item: ShopItem) => { if (props.onBuy) props.onBuy(item); };

  const cyber = Boolean(props.isCyberStyle ?? (window as any).__RHRF_IS_CYBER__);

  return (
    <div className="rb-sheet" onClick={close}>
      <div className="rb-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rb-head">
          <div className="rb-title">SHOP</div>
          <div className="rb-balance">{Math.floor(totalScore)} RF</div>
          <button className="rb-close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="rb-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`rb-tab ${activeTab === tab.id ? "rb-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rb-body">
          {visibleItems.length === 0 && <div className="rb-empty">NO ITEMS</div>}

          {visibleItems.map((item) => {
            const count = getItemCount(inventory, item.id);
            const owned = count > 0;
            const equipped = isEquipped(item);
            const isConsumable = item.category === "consumable";

            if (isConsumable) {
              const canPlus1 = count + 1 <= CONSUMABLE_CAP && canAfford(item.price, 1);
              const canPlus10 = count + 10 <= CONSUMABLE_CAP && canAfford(item.price, 10);
              return (
                <div key={item.id} className={`rb-card rb-card--${item.rarity}`}>
                  <div className="rb-card-main">
                    <div className="rb-card-name">{item.name}</div>
                    <div className="rb-card-desc">{item.description}</div>
                  </div>
                  <div className="rb-card-side">
                    <div className="rb-card-price">{item.price} RF / x</div>
                    <div className="rb-card-count">STOCK {count} / {CONSUMABLE_CAP}</div>
                    <div className="rb-card-actions">
                      <button className="rb-btn rb-btn--plus" disabled={!canPlus1} onClick={() => addConsumable(item, 1)}>+1</button>
                      <button className="rb-btn rb-btn--plus" disabled={!canPlus10} onClick={() => addConsumable(item, 10)}>+10</button>
                      <button className="rb-btn rb-btn--equip" disabled={rfCyberBlocksItem(cyber, item) || !owned} onClick={() => toggleEquip(item)}>
                        {equipped ? "UNEQUIP" : "EQUIP"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className={`rb-card rb-card--${item.rarity}`}>
                <div className="rb-card-main">
                  <div className="rb-card-name">{item.name}</div>
                  <div className="rb-card-desc">{item.description}</div>
                </div>
                <div className="rb-card-side">
                  <div className="rb-card-price">{item.price} RF</div>
                  <div className="rb-card-actions">
                    {!owned ? (
                      <button className="rb-btn rb-btn--buy" disabled={!canAfford(item.price, 1)} onClick={() => buyNonConsumable(item)}>BUY</button>
                    ) : (
                      <button className="rb-btn rb-btn--equip" disabled={rfCyberBlocksItem(cyber, item)} onClick={() => toggleEquip(item)}>
                        {equipped ? "UNEQUIP" : "EQUIP"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
