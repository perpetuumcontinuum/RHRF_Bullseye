import { useT } from "./i18n";
import React, { useMemo, useState } from "react";
import {

  CATALOG,
  CONSUMABLE_CAP,
  getItemCount,
  type ShopItem,
} from "./catalog";
import ItemIcon from "./ItemIcon";

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
  { id: "bow", labelKey: "shop.tab.bow" },
  { id: "hat", labelKey: "shop.tab.hat" },
  { id: "amulet", labelKey: "shop.tab.amulet" },
  { id: "consumable", labelKey: "shop.tab.consumable" },
] as const;

export default function Shop(props: any) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<string>("bow");
  const [page, setPage] = useState(0);

  const items = useMemo(() => CATALOG, []);
  const visibleItems = items.filter((item) => item.category === activeTab);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visibleItems.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

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

  const close = () => {
    if (props.onClose) props.onClose();
  };

  const addConsumable = (item: ShopItem, amount: number) => {
    if (props.onAddConsumable) {
      props.onAddConsumable(item, amount);
      return;
    }

    if (props.onBuy) {
      props.onBuy(item);
    }
  };

  const toggleEquip = (item: ShopItem) => {
    if (props.onToggleEquip) {
      props.onToggleEquip(item);
      return;
    }

    if (props.onEquip) {
      props.onEquip(item.id);
    }
  };

  const buyNonConsumable = (item: ShopItem) => {
    if (props.onBuy) props.onBuy(item);
  };

  return (
    <div className="rf-shop-overlay" onClick={close}>
      <div className="rf-shop-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-shop-header">
          <div className="rf-shop-title">{t("shop.title")}</div>
          <div className="rf-shop-balance">{Math.floor(totalScore)} RF</div>
          <button className="rf-shop-close" onClick={close}>X</button>
        </div>

        <div className="rf-shop-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`rf-shop-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => { setActiveTab(tab.id); setPage(0); }}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="rf-shop-scroll">
          {visibleItems.length === 0 && <div className="rf-shop-empty">{t("ui.noItems")}</div>}

          {pageItems.map((item) => {
            const count = getItemCount(inventory, item.id);
            const owned = count > 0;
            const equipped = isEquipped(item);
            const isConsumable = item.category === "consumable";

            if (isConsumable) {
              const canPlus1 = count + 1 <= CONSUMABLE_CAP && canAfford(item.price, 1);
              const canPlus10 = count + 10 <= CONSUMABLE_CAP && canAfford(item.price, 10);

              return (
                <div key={item.id} className={`rf-shop-item rarity-${item.rarity}${isConsumable ? " rf-shop-item--consumable" : ""}`}>
                  <ItemIcon item={item} />
                  <div className="rf-shop-item-main">
                    <div className="rf-shop-item-heading">
                    <div className="rf-shop-item-name">{item.name}</div>
                    <div className="rf-shop-item-price-inline">{item.price} RF</div>
                  </div>
                    <div className="rf-shop-item-desc">{item.description}</div>
                  </div>

                  <div className="rf-shop-item-side rf-shop-consumable-side">
                    
                    <div className="rf-shop-item-count">{t("shop.inStock", { count, cap: CONSUMABLE_CAP })}</div>

                    <div className="rf-shop-consumable-controls">
                      <button disabled={!canPlus1} onClick={() => addConsumable(item, 1)}>
                        +1
                      </button>
                      <button disabled={!canPlus10} onClick={() => addConsumable(item, 10)}>
                        +10
                      </button>
                      <button disabled={rfCyberBlocksItem(Boolean(props.isCyberStyle ?? (window as any).__RHRF_IS_CYBER__), item) || (!owned)}
                        className="rf-shop-item-btn rf-shop-equip-btn"
                        onClick={() => toggleEquip(item)}
                      >
                        {equipped ? t("ui.unequip") : t("ui.equip")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className={`rf-shop-item rarity-${item.rarity}${isConsumable ? " rf-shop-item--consumable" : ""}`}>
                  <ItemIcon item={item} />
                <div className="rf-shop-item-main">
                  <div className="rf-shop-item-heading">
                    <div className="rf-shop-item-name">{item.name}</div>
                    <div className="rf-shop-item-price-inline">{item.price} RF</div>
                  </div>
                  <div className="rf-shop-item-desc">{item.description}</div>
                </div>

                <div className="rf-shop-item-side">
                  

                  {!owned ? (
                    <button
                      className="rf-shop-item-btn"
                      disabled={!canAfford(item.price, 1)}
                      onClick={() => buyNonConsumable(item)}
                    >
                      {t("shop.buy")}
                    </button>
                  ) : (
                    <button disabled={rfCyberBlocksItem(Boolean(props.isCyberStyle ?? (window as any).__RHRF_IS_CYBER__), item)}
                      className="rf-shop-item-btn rf-shop-equip-btn"
                      onClick={() => toggleEquip(item)}
                    >
                      {equipped ? t("ui.unequip") : t("ui.equip")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="rf-shop-pager">
            <button className="rf-shop-pager-btn" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>{t("shop.prev")}</button>
            <span className="rf-shop-pager-info">{safePage + 1} / {totalPages}</span>
            <button className="rf-shop-pager-btn" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>{t("shop.next")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
