import React, { useState } from "react";
import {
  fallbackItem,
  getItemById,
  getItemCount,
  sellValue,
  type ShopCategory,
  type ShopItem,
} from "./catalog";
import { type GameStats, formatDuration } from "./stats";

const STAT_TABS = [
  { id: "time", label: "TOTAL TIME", cols: ["SESSION", "ALL TIME"] },
  { id: "rf", label: "EARNED RF", cols: ["TOTAL", "—"] },
  { id: "cyber", label: "CYBER STREAK", cols: ["CURRENT", "BEST"] },
  { id: "ghost", label: "GHOST STREAK", cols: ["CURRENT", "BEST"] },
  { id: "asteroid", label: "ASTEROID STREAK", cols: ["CURRENT", "BEST"] },
] as const;

type StatTabId = (typeof STAT_TABS)[number]["id"];

function statRow(stats: GameStats | undefined, tab: StatTabId) {
  if (!stats) return null;
  const streak = (cur: number, best: number) => ({
    cur: cur >= 3 ? String(cur) : "—",
    best: best >= 3 ? String(best) : "—",
  });
  switch (tab) {
    case "time": return { cur: formatDuration(stats.currentSessionMs), best: formatDuration(stats.totalPlayMs) };
    case "rf": return { cur: stats.earnedScore.toLocaleString(), best: "—" };
    case "cyber": return streak(stats.currentCyberStreak, stats.bestCyberStreak);
    case "ghost": return streak(stats.currentGhostStreak, stats.bestGhostStreak);
    case "asteroid": return streak(stats.currentAsteroidStreak, stats.bestAsteroidStreak);
  }
}

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

type PendingSale = { item: ShopItem; amount: number; rate: number; revenue: number } | null;

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

const RARITY_ORDER: Record<string, number> = { rare: 0, epic: 1, legendary: 2 };

const rfLimitByRarity = (items: ShopItem[]): ShopItem[] => {
  const byRarity = new Map<string, ShopItem>();
  for (const item of items) {
    const rarity = String(item.rarity ?? "").toLowerCase();
    if (!byRarity.has(rarity)) byRarity.set(rarity, item);
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
  const [activeStat, setActiveStat] = useState<StatTabId>("time");
  const [activeEquipmentTab, setActiveEquipmentTab] = useState<ShopCategory>("bow");
  const [activeConsumableTab, setActiveConsumableTab] = useState<"arrow" | "armor" | "energy">("arrow");

  const open = props.open ?? props.show ?? true;
  if (!open) return null;

  const inventory = getInventory(props);
  const totalScore = Number(props.totalScore ?? props.score ?? 0);
  const gameStats = props.gameStats as GameStats | undefined;
  const playerName = String(props.friendId ?? "YOU");
  const cyberUnlock = Boolean(
    props.hasCyberUnlock ??
    (typeof window !== "undefined" && (window as any).__RHRF_HAS_CYBER_UNLOCK__) ??
    (inventory.includes("bow_legendary") && inventory.includes("hat_legendary") && inventory.includes("amulet_legendary"))
  );
  const cyberOn = Boolean(
    props.isCyberStyle ??
    (typeof window !== "undefined" && (window as any).__RHRF_IS_CYBER__)
  );
  const cyber = cyberOn;

  const counts = new Map<string, number>();
  for (const id of inventory) counts.set(id, (counts.get(id) ?? 0) + 1);
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

  const close = () => { if (typeof props.onClose === "function") props.onClose(); };
  const toggleEquip = (item: ShopItem) => {
    if (props.onToggleEquip) { props.onToggleEquip(item); return; }
    if (props.onEquip) props.onEquip(item.id);
  };
  const openSellConfirm = (item: ShopItem, rate: number) => {
    const count = getItemCount(inventory, item.id);
    const amount = item.category === "consumable" ? count : 1;
    if (amount <= 0) return;
    const revenue = sellValue(item.price, rate, amount);
    setPendingSale({ item, amount, rate, revenue });
  };
  const cancelSell = () => setPendingSale(null);
  const confirmSell = () => {
    if (!pendingSale) return;
    if (props.onSell) props.onSell(pendingSale.item, pendingSale.amount, pendingSale.rate);
    setPendingSale(null);
  };

  return (
    <div className="rb-sheet" onClick={close}>
      <div className="rb-panel" onClick={(event) => event.stopPropagation()}>
        <div className="rb-head">
          <div className="rb-title">PROFILE</div>
          <div className="rb-balance">{Math.floor(totalScore)} RF</div>
          <button className="rb-close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="rb-stats">
          <div className="rb-stat"><span className="rb-stat-label">SCORE</span><strong className="rb-stat-value">{Math.floor(totalScore)}</strong></div>
          <div className="rb-stat"><span className="rb-stat-label">ITEMS</span><strong className="rb-stat-value">{catalogItems.length}</strong></div>
          <div className="rb-stat"><span className="rb-stat-label">EQUIPPED</span><strong className="rb-stat-value">{equippedCount}</strong></div>
          <div className="rb-stat"><span className="rb-stat-label">TOTAL</span><strong className="rb-stat-value">{inventory.length}</strong></div>
        </div>

        <div className="rb-tabs">
          {(["equipment", "stats", "cyber"] as const).map((tab) => (
            <button key={tab} className={`rb-tab ${activeTab === tab ? "rb-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "equipment" && (
          <div className="rb-subtabs">
            {equipmentTabs.map((tab) => (
              <button key={tab.id} className={`rb-subtab ${activeEquipmentTab === tab.id ? "rb-subtab--active" : ""}`} onClick={() => setActiveEquipmentTab(tab.id)}>
                {tab.label}{tab.count > 0 ? ` (${tab.count})` : ""}
              </button>
            ))}
          </div>
        )}

        <div className="rb-section" style={{ display: activeTab === "cyber" ? undefined : "none" }}>
          <div className="rb-section-title">CYBER STYLE</div>
          <div className="rb-grid">
            <div className={`rb-card rb-card--legendary ${cyberOn ? "rb-card--equipped" : ""}`}>
              <div className="rb-card-main">
                <div className="rb-card-name">CYBER STYLE</div>
                <div className="rb-card-desc">Requires LEGENDARY BOW, LEGENDARY OUTFIT and LEGENDARY AMULET in inventory. Grants legendary effects and disables asteroid screen shake.</div>
              </div>
              <div className="rb-card-side">
                <div className="rb-card-actions">
                  <button className="rb-btn rb-btn--equip" disabled={!cyberUnlock} onClick={() => { if (typeof props.onToggleCyber === "function") props.onToggleCyber(); else window.dispatchEvent(new CustomEvent("rhrf-toggle-cyber")); }}>
                    {cyberOn ? "UNEQUIP" : "EQUIP"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rb-section" style={{ display: activeTab === "stats" ? undefined : "none" }}>
          <div className="rb-subtabs">
            {STAT_TABS.map((t) => (
              <button key={t.id} className={`rb-subtab ${activeStat === t.id ? "rb-subtab--active" : ""}`} onClick={() => setActiveStat(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <table className="rb-table">
            <thead>
              <tr>
                <th>PLAYER</th>
                <th>{STAT_TABS.find((t) => t.id === activeStat)!.cols[0]}</th>
                <th>{STAT_TABS.find((t) => t.id === activeStat)!.cols[1]}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const row = statRow(gameStats, activeStat);
                if (!row) return (<tr><td colSpan={3} className="rb-empty">NO DATA</td></tr>);
                return (<tr><td>{playerName}</td><td>{row.cur}</td><td>{row.best}</td></tr>);
              })()}
            </tbody>
          </table>
        </div>

        <div className="rb-body" style={{ display: activeTab === "equipment" ? undefined : "none" }}>
          {sections
            .filter((section) => section.id === activeEquipmentTab)
            .map((section) => {
              const rawDisplayItems = section.id === "consumable"
                ? section.items.filter((item) => rfConsumableType(item) === activeConsumableTab)
                : section.items;
              const displayItems = rfLimitByRarity(rawDisplayItems);
              return (
                <section key={section.id} className="rb-section">
                  {section.id === "consumable" && (
                    <div className="rb-subtabs">
                      {([["arrow", "ARROWS"], ["armor", "ARMOR"], ["energy", "ENERGY"]] as const).map(([id, label]) => {
                        const subCount = section.items
                          .filter((item) => rfConsumableType(item) === id)
                          .reduce((sum, item) => sum + (counts.get(item.id) ?? 0), 0);
                        return (
                          <button key={id} className={`rb-subtab ${activeConsumableTab === id ? "rb-subtab--active" : ""}`} onClick={() => setActiveConsumableTab(id)}>
                            {label} ({subCount})
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {displayItems.length === 0 ? (
                    <div className="rb-empty">NO ITEMS</div>
                  ) : (
                    <div className="rb-grid">
                      {displayItems.map((item) => {
                        const count = getItemCount(inventory, item.id);
                        const equipped = isEquipped(props, item);
                        const sellAmount = item.category === "consumable" ? count : 1;
                        const sell50 = sellValue(item.price, 0.5, sellAmount);
                        const sell60 = sellValue(item.price, 0.6, sellAmount);
                        return (
                          <div key={item.id} className={`rb-card rb-card--${item.rarity} ${equipped ? "rb-card--equipped" : ""}`}>
                            <div className="rb-card-main">
                              <div className="rb-card-top">
                                <div className="rb-card-name">{item.name}</div>
                                {(item.category === "consumable" || count > 1) && (<div className="rb-card-count">x{count}</div>)}
                              </div>
                              <div className="rb-card-desc">{item.description}</div>
                              <div className="rb-card-bottom">
                                <div className="rb-card-rarity">{item.rarity.toUpperCase()}</div>
                                {equipped && <div className="rb-card-equipped-tag">EQUIPPED</div>}
                              </div>
                            </div>
                            <div className="rb-card-side">
                              <div className="rb-card-actions">
                                <button className="rb-btn rb-btn--equip" disabled={rfCyberBlocksItem(cyber, item) || count <= 0} onClick={() => toggleEquip(item)}>
                                  {equipped ? "UNEQUIP" : "EQUIP"}
                                </button>
                                <button className="rb-btn rb-btn--sell" onClick={() => openSellConfirm(item, 0.5)}>SELL 50%<span>{sell50} RF</span></button>
                                <button className="rb-btn rb-btn--offer" disabled={count <= 0} onClick={() => openSellConfirm(item, 0.6)}>OFFER 60%<span>{sell60} RF</span></button>
                              </div>
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
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rb-modal-box">
              <div className="rb-modal-title">CONFIRM SALE</div>
              <div className="rb-modal-text">
                Sell {pendingSale.amount} x {pendingSale.item.name}<br />
                for <strong>{pendingSale.revenue} RF</strong>?<br />
                Mode: {pendingSale.rate >= 0.6 ? "OFFER 60%" : "QUICK 50%"}
              </div>
              <div className="rb-modal-actions">
                <button className="rb-btn rb-btn--cancel" onClick={cancelSell}>CANCEL</button>
                <button className="rb-btn rb-btn--ok" onClick={confirmSell}>SELL</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
