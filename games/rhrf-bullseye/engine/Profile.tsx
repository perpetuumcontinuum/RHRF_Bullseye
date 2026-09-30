import React, { useState } from "react";
import {

  fallbackItem,
  getItemById,
  getItemCount,
  sellValue,
  type ShopCategory,
  type ShopItem,
} from "./catalog";
import { type GameStats, createLeaderboardRows } from "./stats";

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

const CATEGORY_ORDER: { id: ShopCategory; label: string }[] = [
  { id: "bow", label: "BOWS" },
  { id: "hat", label: "CLOTHES" },
  { id: "amulet", label: "AMULET" },
  { id: "consumable", label: "CONSUMABLES" },
];

type PendingSale = {
  item: ShopItem;
  amount: number;
  rate: number;
  revenue: number;
} | null;

function getInventory(props: any): string[] {
  const raw = props.inventory ?? props.items ?? props.owned ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((x: any) => String(x ?? "").trim()).filter(Boolean);
}

function isEquipped(props: any, item: ShopItem): boolean {
  if (item.id.startsWith("arrow_")) return props.equippedArrow === item.id;
  if (item.id.startsWith("armor_")) return props.equippedArmor === item.id;
  if (item.id.startsWith("energy_")) return props.equippedEnergy === item.id;

  if (item.category === "bow") return props.equippedBow === item.id;
  if (item.category === "hat") return props.equippedHat === item.id;
  if (item.category === "amulet") return props.equippedAmulet === item.id;

  return false;
}

const rfConsumableType = (item: ShopItem): "arrow" | "armor" | "energy" => {
  const id = String(item.id ?? "").toLowerCase();
  if (id.includes("arrow")) return "arrow";
  if (id.includes("armor")) return "armor";
  return "energy";
};

const RARITY_ORDER: Record<string, number> = {
  rare: 0,
  epic: 1,
  legendary: 2,
};

const rfLimitByRarity = (items: ShopItem[]): ShopItem[] => {
  const byRarity = new Map<string, ShopItem>();

  for (const item of items) {
    const rarity = String(item.rarity ?? "").toLowerCase();
    if (!byRarity.has(rarity)) {
      byRarity.set(rarity, item);
    }
  }

  return Array.from(byRarity.values())
    .sort((a, b) => {
      const ar = String(a.rarity ?? "").toLowerCase();
      const br = String(b.rarity ?? "").toLowerCase();
      return (RARITY_ORDER[ar] ?? 9) - (RARITY_ORDER[br] ?? 9);
    })
    .slice(0, 3);
};

export default function Profile(props: any) {
  const [pendingSale, setPendingSale] = useState<PendingSale>(null);
  const [activeTab, setActiveTab] = useState<"equipment" | "stats" | "cyber">("equipment");
  const [activeEquipmentTab, setActiveEquipmentTab] = useState<ShopCategory>("bow");
  const [activeConsumableTab, setActiveConsumableTab] = useState<"arrow" | "armor" | "energy">("arrow");

  const open = props.open ?? props.show ?? true;
  if (!open) return null;

  const inventory = getInventory(props);
  const totalScore = Number(props.totalScore ?? props.score ?? 0);
  const gameStats = props.gameStats as GameStats | undefined;
  const playerName = String(props.friendId ?? "YOU");
  const leaderboardRows = gameStats ? createLeaderboardRows(gameStats, playerName) : [];
  const cyberUnlock = Boolean(
    props.hasCyberUnlock ??
    (typeof window !== "undefined" && (window as any).__RHRF_HAS_CYBER_UNLOCK__) ??
    (inventory.includes("bow_legendary") && inventory.includes("hat_legendary") && inventory.includes("amulet_legendary"))
  );
  const cyberOn = Boolean(
    props.isCyberStyle ??
    (typeof window !== "undefined" && (window as any).__RHRF_IS_CYBER__)
  );

  const counts = new Map<string, number>();
  for (const id of inventory) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const uniqueIds = Array.from(counts.keys());

  const catalogItems: ShopItem[] = uniqueIds.map((id) => {
    const found = getItemById(id);
    if (found) return found;

    const lower = id.toLowerCase();
    let category: ShopCategory = "consumable";
    if (lower.includes("bow")) category = "bow";
    else if (lower.includes("hat") || lower.includes("head") || lower.includes("helmet") || lower.includes("crown")) category = "hat";
    else if (lower.includes("amulet") || lower.includes("neck") || lower.includes("charm")) category = "amulet";

    return fallbackItem(id, category);
  });

  const equippedCount = catalogItems.filter((item) => isEquipped(props, item)).length;

  const sections = CATEGORY_ORDER.map((category) => ({
    ...category,
    items: catalogItems.filter((item) => item.category === category.id),
  }));

  const equipmentTabs: { id: ShopCategory; label: string; count: number }[] = [
    { id: "bow", label: "BOWS", count: catalogItems.filter((item) => item.category === "bow").length },
    { id: "hat", label: "CLOTHES", count: catalogItems.filter((item) => item.category === "hat").length },
    { id: "amulet", label: "AMULET", count: catalogItems.filter((item) => item.category === "amulet").length },
    { id: "consumable", label: "CONSUMABLES", count: catalogItems.filter((item) => item.category === "consumable").length },
  ];

  const close = () => {
    if (typeof props.onClose === "function") props.onClose();
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

  const openSellConfirm = (item: ShopItem, rate: number) => {
    const count = getItemCount(inventory, item.id);
    const amount = item.category === "consumable" ? count : 1;
    if (amount <= 0) return;

    const revenue = sellValue(item.price, rate, amount);
    setPendingSale({ item, amount, rate, revenue });
  };

  const cancelSell = () => {
    setPendingSale(null);
  };

  const confirmSell = () => {
    if (!pendingSale) return;

    if (props.onSell) {
      props.onSell(pendingSale.item, pendingSale.amount, pendingSale.rate);
    }

    setPendingSale(null);
  };

  return (
    <div className="rf-profile-overlay" onClick={close}>
      <div className="rf-profile-panel" onClick={(event) => event.stopPropagation()}>
        <div className="rf-profile-header">
          <div className="rf-profile-title">PROFILE</div>
          <div className="rf-profile-balance">{Math.floor(totalScore)} RF</div>
          <button className="rf-profile-close" onClick={close}>X</button>
        </div>

        <div className="rf-profile-stats">
          <div className="rf-profile-stat">
            <span>SCORE</span>
            <strong>{Math.floor(totalScore)}</strong>
          </div>
          <div className="rf-profile-stat">
            <span>ITEMS</span>
            <strong>{catalogItems.length}</strong>
          </div>
          <div className="rf-profile-stat">
            <span>EQUIPPED</span>
            <strong>{equippedCount}</strong>
          </div>
          <div className="rf-profile-stat">
            <span>TOTAL</span>
            <strong>{inventory.length}</strong>
          </div>
        </div>

          <div className="rf-profile-tabs">
          {(["equipment", "stats", "cyber"] as const).map((tab) => (
            <button
              key={tab}
              className={`rf-profile-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "equipment" && (
          <div className="rf-profile-subtabs rf-equipment-subtabs">
            {equipmentTabs.map((tab) => (
              <button
                key={tab.id}
                className={`rf-profile-subtab ${activeEquipmentTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveEquipmentTab(tab.id)}
              >
                {tab.label}
                {tab.count > 0 ? ` (${tab.count})` : ""}
              </button>
            ))}
          </div>
        )}

        <div className="rf-profile-section" style={{ display: activeTab === "cyber" ? undefined : "none" }}>
            <div className="rf-profile-section-title">CYBER STYLE</div>
            <div className="rf-profile-grid">
              <div className={`rf-profile-card rarity-legendary ${cyberOn ? "equipped" : ""}`}>
                <div className="rf-profile-card-top">
                  <div className="rf-profile-card-name">CYBER STYLE</div>
                </div>
                <div className="rf-profile-card-desc">
                  Requires LEGENDARY BOW, LEGENDARY OUTFIT and LEGENDARY AMULET in inventory.
                  Grants legendary bow / outfit / amulet effects and disables asteroid screen shake.
                </div>
                <div className="rf-profile-card-actions">
                  <button
                    className="rf-profile-action equip"
                    disabled={!cyberUnlock}
                    onClick={() => { if (typeof props.onToggleCyber === "function") props.onToggleCyber(); else window.dispatchEvent(new CustomEvent("rhrf-toggle-cyber")); }}
                  >
                    {cyberOn ? "UNEQUIP" : "EQUIP"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        <div className="rf-profile-section" style={{ display: activeTab === "stats" ? undefined : "none" }}>
          <div className="rf-profile-section-title">LEADERBOARD</div>
          <table className="rf-leaderboard">
            <thead>
              <tr>
                <th>PLAYER</th>
                <th>CATEGORY</th>
                <th>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="rf-leaderboard-empty">NO DATA</td>
                </tr>
              ) : (
                leaderboardRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.player}</td>
                    <td>{row.label}</td>
                    <td>{row.display}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`rf-profile-scroll ${activeTab === "equipment" ? "rf-equipment-scroll" : ""}`} style={{ display: activeTab === "equipment" ? undefined : "none" }}>
          {sections
            .filter((section) => section.id === activeEquipmentTab)
            .map((section) => {
              const rawDisplayItems = section.id === "consumable"
                ? section.items.filter((item) => rfConsumableType(item) === activeConsumableTab)
                : section.items;
              const displayItems = rfLimitByRarity(rawDisplayItems);

              return (
            <section key={section.id} className="rf-profile-section">
              {section.id === "consumable" && (
                <div className="rf-profile-subtabs">
                  {([["arrow", "ARROWS"], ["armor", "ARMOR"], ["energy", "ENERGY"]] as const).map(([id, label]) => {
                    const subCount = section.items
                      .filter((item) => rfConsumableType(item) === id)
                      .reduce((sum, item) => sum + (counts.get(item.id) ?? 0), 0);
                    return (
                      <button
                        key={id}
                        className={`rf-profile-subtab ${activeConsumableTab === id ? "active" : ""}`}
                        onClick={() => setActiveConsumableTab(id)}
                      >
                        {label} ({subCount})
                      </button>
                    );
                  })}
                </div>
              )}
              

              {displayItems.length === 0 ? (
                <div className="rf-profile-empty">NO ITEMS</div>
              ) : (
                <div className="rf-profile-grid">
                  {displayItems.map((item) => {
                    const count = getItemCount(inventory, item.id);
                    const equipped = isEquipped(props, item);
                    const sellAmount = item.category === "consumable" ? count : 1;
                    const sell50 = sellValue(item.price, 0.5, sellAmount);
                    const sell60 = sellValue(item.price, 0.6, sellAmount);

                    return (
                      <div
                        key={item.id}
                        className={`rf-profile-card rarity-${item.rarity} ${equipped ? "equipped" : ""}`}
                      >
                        <div className="rf-profile-card-top">
                          <div className="rf-profile-card-name">{item.name}</div>
                          {(item.category === "consumable" || count > 1) && (
                            <div className="rf-profile-card-count">x{count}</div>
                          )}
                        </div>

                        <div className="rf-profile-card-desc">{item.description}</div>

                        <div className="rf-profile-card-bottom">
                          <div className="rf-profile-card-rarity">{item.rarity.toUpperCase()}</div>
                          {equipped && <div className="rf-profile-card-equipped">EQUIPPED</div>}
                        </div>

                        <div className="rf-profile-card-actions">
                          <button disabled={rfCyberBlocksItem(Boolean(props.isCyberStyle ?? (window as any).__RHRF_IS_CYBER__), item) || (count <= 0)}
                            className="rf-profile-action equip"
                            onClick={() => toggleEquip(item)}
                          >
                            {equipped ? "UNEQUIP" : "EQUIP"}
                          </button>

                          <button
                            className="rf-profile-action sell"
                            onClick={() => openSellConfirm(item, 0.5)}
                          >
                            SELL 50%
                            <span>{sell50} RF</span>
                          </button>

                          <button
                            className="rf-profile-action offer"
                            disabled={count <= 0}
                            onClick={() => openSellConfirm(item, 0.6)}
                          >
                            OFFER 60%
                            <span>{sell60} RF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
          })}
        </div>

        {pendingSale && (
          <div className="rf-sell-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="rf-sell-confirm-box">
              <div className="rf-sell-confirm-title">CONFIRM SALE</div>
              <div className="rf-sell-confirm-text">
                Sell {pendingSale.amount} x {pendingSale.item.name}
                <br />
                for <strong>{pendingSale.revenue} RF</strong>?
                <br />
                Mode: {pendingSale.rate >= 0.6 ? "OFFER 60%" : "QUICK 50%"}
              </div>

              <div className="rf-sell-confirm-actions">
                <button className="rf-sell-confirm-cancel" onClick={cancelSell}>
                  CANCEL
                </button>
                <button className="rf-sell-confirm-ok" onClick={confirmSell}>
                  SELL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
