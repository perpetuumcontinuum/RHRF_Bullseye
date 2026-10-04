import React, { useState } from "react";
import {

  fallbackItem,
  getItemById,
  getItemCount,
  sellValue,
  type ShopCategory,
  type ShopItem,
} from "./catalog";
import { type GameStats, formatDuration } from "./stats"
import { BADGES_BY_KIND, BADGE_ORDER, streakColor, streakTint, streakGlow, BadgeIcon } from "./achievements";
import ItemIcon from "./ItemIcon";
import { useT } from "./i18n";

const fmtCompact = (n: number): string => {
  const v = Math.floor(Number(n) || 0);
  if (v >= 1000000000) {
    const x = v / 1000000000;
    if (x < 10) return x.toFixed(1) + "B";
    if (x < 100) return x.toFixed(0) + "B";
    return Math.floor(x) + "B";
  }
  if (v >= 1000000) {
    const x = v / 1000000;
    if (x < 10) return x.toFixed(1) + "M";
    if (x < 100) return x.toFixed(0) + "M";
    return Math.floor(x) + "M";
  }
  if (v >= 1000) {
    const x = v / 1000;
    if (x < 10) return x.toFixed(1) + "K";
    if (x < 100) return x.toFixed(0) + "K";
    return Math.floor(x) + "K";
  }
  return String(v);
};

const STAT_TABS = [
  { id: "time", labelKey: "stat.time", colKeys: ["stat.session", "stat.allTime"] },
  { id: "rf", labelKey: "stat.rf", colKeys: ["stat.total", "stat.none"] },
  { id: "cyber", labelKey: "stat.cyber", colKeys: ["stat.current", "stat.best"] },
  { id: "ghost", labelKey: "stat.ghost", colKeys: ["stat.current", "stat.best"] },
  { id: "asteroid", labelKey: "stat.asteroid", colKeys: ["stat.current", "stat.best"] },
] as const;

type StatTabId = (typeof STAT_TABS)[number]["id"];

function statRow(stats: GameStats | undefined, tab: StatTabId) {
  if (!stats) return null;
  const streak = (cur: number, best: number) => ({
    cur: cur >= 3 ? String(cur) : "—",
    best: best >= 3 ? String(best) : "—",
  });
  switch (tab) {
    case "time":
      return { cur: formatDuration(stats.currentSessionMs), best: formatDuration(stats.totalPlayMs) };
    case "rf":
      return { cur: stats.earnedScore.toLocaleString(), best: "—" };
    case "cyber":
      return streak(stats.currentCyberStreak, stats.bestCyberStreak);
    case "ghost":
      return streak(stats.currentGhostStreak, stats.bestGhostStreak);
    case "asteroid":
      return streak(stats.currentAsteroidStreak, stats.bestAsteroidStreak);
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

const CATEGORY_ORDER: { id: ShopCategory }[] = [
  { id: "bow" },
  { id: "hat" },
  { id: "amulet" },
  { id: "consumable" },
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
  const t = useT();
  const [pendingSale, setPendingSale] = useState<PendingSale>(null);
  const [activeTab, setActiveTab] = useState<"equipment" | "stats" | "badges" | "cyber">("equipment");
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
    { id: "bow", label: t("profile.cat.bow"), count: catalogItems.filter((item) => item.category === "bow").length },
    { id: "hat", label: t("profile.cat.hat"), count: catalogItems.filter((item) => item.category === "hat").length },
    { id: "amulet", label: t("profile.cat.amulet"), count: catalogItems.filter((item) => item.category === "amulet").length },
    { id: "consumable", label: t("profile.cat.consumable"), count: catalogItems.filter((item) => item.category === "consumable").length },
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
          <div className="rf-profile-title">{t("profile.title")}</div>
          <div className="rf-profile-balance">{Math.floor(totalScore)} RF</div>
          <button className="rf-profile-close" onClick={close}>X</button>
        </div>

          <div className="rf-profile-tabs">
          {(["equipment", "stats", "badges", "cyber"] as const).map((tab) => (
            <button
              key={tab}
              className={`rf-profile-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`profile.tab.${tab}`)}
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

        <div className="rf-profile-section" style={{ display: activeTab === "badges" ? undefined : "none" }}>
          {BADGE_ORDER.map((kind) => (
            <div key={kind} className={`rf-badge-kind-block rf-badge-kind-block--${kind}`}>
              <div className="rf-profile-section-title">
                {t("profile.badgesHeading", { kind: kind.toUpperCase() })}
                <span className="rf-badge-progress">
                  {BADGES_BY_KIND[kind].filter((r) => Boolean(gameStats?.earnedBadges.includes(r.id))).length}/{BADGES_BY_KIND[kind].length}
                </span>
              </div>
              <div className="rf-badge-grid">
                {BADGES_BY_KIND[kind].map((rank) => {
                  const unlocked = Boolean(gameStats?.earnedBadges.includes(rank.id));
                  const color = streakColor(kind, rank.n);
                  return (
                    <div
                      key={rank.id}
                      className={`rf-badge-card ${unlocked ? "unlocked" : "locked"}`}
                      style={unlocked ? { background: streakTint(kind, rank.n), borderColor: color, color: "#fff", boxShadow: `0 0 12px ${streakGlow(kind, rank.n)}` } : undefined}
                    >
                      <div className="rf-badge-icon"><BadgeIcon id={rank.icon} size={30} /></div>
                      <div className="rf-badge-name">{t("badge." + rank.id)}</div>
                      <div className="rf-badge-desc">{t("profile.badgeStreak", { count: rank.n })}</div>
                      <div className="rf-badge-state">{unlocked ? t("badge.unlocked") : t("badge.locked")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="rf-profile-section" style={{ display: activeTab === "cyber" ? undefined : "none" }}>
            <div className="rf-profile-section-title">{t("profile.cyberStyle")}</div>
            <div className="rf-profile-grid">
              <div className={`rf-profile-card rf-profile-card--icon rarity-legendary ${cyberOn ? "equipped" : ""}`}>
            <ItemIcon item={{ id: "cyber_style", category: "cyber", icon: "cyber" }} />
                <div className="rf-profile-card-top">
                  <div className="rf-profile-card-name">{t("profile.cyberStyle")}</div>
                  <div className="rf-profile-card-count">{cyberOn ? t("ui.on") : t("ui.off")}</div>
                </div>
                <div className="rf-profile-card-desc">
                  Requires LEGENDARY BOW, LEGENDARY OUTFIT and LEGENDARY AMULET in inventory.
                  Grants legendary bow / outfit / amulet effects and disables asteroid screen shake.
                </div>
                <div className="rf-profile-card-bottom">
                  <div className="rf-profile-card-rarity">{t("profile.legendary")}</div>
                  {cyberOn && <div className="rf-profile-card-equipped">{t("ui.active")}</div>}
                </div>
                <div className="rf-profile-card-actions">
                  <button
                    className="rf-profile-action equip"
                    disabled={!cyberUnlock}
                    onClick={() => { if (typeof props.onToggleCyber === "function") props.onToggleCyber(); else window.dispatchEvent(new CustomEvent("rhrf-toggle-cyber")); }}
                  >
                    {cyberOn ? t("ui.unequip") : t("ui.equip")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        <div className="rf-profile-section" style={{ display: activeTab === "stats" ? undefined : "none" }}>
          <div className="rf-profile-stats">
            <div className="rf-profile-stat">
              <span title={t("stat.score")}>S</span>
              <strong>{fmtCompact(totalScore)}</strong>
            </div>
            <div className="rf-profile-stat">
              <span title={t("stat.items")}>I</span>
              <strong>{fmtCompact(catalogItems.length)}</strong>
            </div>
            <div className="rf-profile-stat">
              <span title={t("ui.equipped")}>E</span>
              <strong>{fmtCompact(equippedCount)}</strong>
            </div>
            <div className="rf-profile-stat">
              <span title={t("ui.total")}>T</span>
              <strong>{fmtCompact(inventory.length)}</strong>
            </div>
          </div>
          <div className="rf-stat-tabs">
            {STAT_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`rf-stat-tab ${activeStat === tab.id ? "active" : ""}`}
                onClick={() => setActiveStat(tab.id)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <table className="rf-leaderboard">
            <thead>
              <tr>
                <th>PLAYER</th>
                <th>{t(STAT_TABS.find((s) => s.id === activeStat)!.colKeys[0])}</th>
                <th>{t(STAT_TABS.find((s) => s.id === activeStat)!.colKeys[1])}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const row = statRow(gameStats, activeStat);
                if (!row) {
                  return (
                    <tr>
                      <td colSpan={3} className="rf-leaderboard-empty">NO DATA</td>
                    </tr>
                  );
                }
                return (
                  <tr>
                    <td>{playerName}</td>
                    <td>{row.cur}</td>
                    <td>{row.best}</td>
                  </tr>
                );
              })()}
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
                  {([["arrow", "hud.arrows"], ["armor", "ui.armor"], ["energy", "ui.energy"]] as const).map(([id, lk]) => {
                    const subCount = section.items
                      .filter((item) => rfConsumableType(item) === id)
                      .reduce((sum, item) => sum + (counts.get(item.id) ?? 0), 0);
                    return (
                      <button
                        key={id}
                        className={`rf-profile-subtab ${activeConsumableTab === id ? "active" : ""}`}
                        onClick={() => setActiveConsumableTab(id)}
                      >
                        {t(lk)} ({subCount})
                      </button>
                    );
                  })}
                </div>
              )}
              

              {displayItems.length === 0 ? (
                <div className="rf-profile-empty">{t("ui.noItems")}</div>
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
                        className={`rf-profile-card rf-profile-card--icon rarity-${item.rarity} ${equipped ? "equipped" : ""}`}
                      >
                        <ItemIcon item={item} />
                        <div className="rf-profile-card-top">
                          <div className="rf-profile-card-name">{t("item." + item.id + ".name", undefined, item.name)}</div>
                          {(item.category === "consumable" || count > 1) && (
                            <div className="rf-profile-card-count">x{count}</div>
                          )}
                        </div>

                        <div className="rf-profile-card-desc">{t("item." + item.id + ".desc", undefined, item.description)}</div>

                        <div className="rf-profile-card-bottom">
                          <div className="rf-profile-card-rarity">{t("rarity." + item.rarity.toLowerCase())}</div>
                          {equipped && <div className="rf-profile-card-equipped">{t("ui.equipped")}</div>}
                        </div>

                        <div className="rf-profile-card-actions">
                          <button disabled={rfCyberBlocksItem(Boolean(props.isCyberStyle ?? (window as any).__RHRF_IS_CYBER__), item) || (count <= 0)}
                            className="rf-profile-action equip"
                            onClick={() => toggleEquip(item)}
                          >
                            {equipped ? t("ui.unequip") : t("ui.equip")}
                          </button>

                          <button
                            className="rf-profile-action sell"
                            onClick={() => openSellConfirm(item, 0.5)}
                          >
                            {t("profile.sell50")}
                            <span>{sell50} RF</span>
                          </button>

                          <button
                            className="rf-profile-action offer"
                            disabled={count <= 0}
                            onClick={() => openSellConfirm(item, 0.6)}
                          >
                            {t("profile.offer60")}
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
              <div className="rf-sell-confirm-title">{t("profile.confirmSale")}</div>
              <div className="rf-sell-confirm-text">
                {t("profile.sellAmount", { amount: pendingSale.amount, name: t("item." + pendingSale.item.id + ".name", undefined, pendingSale.item.name) })}
                <br />
                {t("profile.sellFor")} <strong>{pendingSale.revenue} RF</strong>?
                <br />
                {t("profile.sellMode", { mode: pendingSale.rate >= 0.6 ? t("profile.offer60") : t("profile.quick50") })}
              </div>

              <div className="rf-sell-confirm-actions">
                <button className="rf-sell-confirm-cancel" onClick={cancelSell}>
                  {t("ui.cancel")}
                </button>
                <button className="rf-sell-confirm-ok" onClick={confirmSell}>
                  {t("ui.sell")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
