import React from "react";

type Rarity = "rare" | "epic" | "legendary";

type HudProps = {
  inventory?: string[];
  equippedArrow?: string | null;
  equippedArmor?: string | null;
  equippedEnergy?: string | null;
  onEquipArrow?: (id: string) => void;
  onEquipArmor?: (id: string) => void;
  onEquipEnergy?: (id: string) => void;
  isPaused?: boolean;
};

type Prefix = "arrow" | "armor" | "energy";

const RARITIES: Rarity[] = ["rare", "epic", "legendary"];

const ICONS = {
  arrow: "M4 11h10V7l6 5-6 5v-4H4z",
  armor: "M12 2l8 4v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V6l8-4z",
  energy: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
};

function countOf(inventory: string[], id: string): number {
  return inventory.filter((x) => x === id).length;
}

function ArrowGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="12"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="40" y1="160" x2="160" y2="40" />
      <polyline points="130,40 160,40 160,70" />
      <polyline points="70,160 40,160 40,130" transform="rotate(-180,40,160)" />
    </svg>
  );
}

function CategoryIcon({ prefix, icon, className }: { prefix: Prefix; icon: string; className: string }) {
  if (prefix === "arrow") return <ArrowGlyph className={className} />;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={icon} fill="currentColor" />
    </svg>
  );
}

export default function ArrowHud(props: HudProps) {
  const inventory = Array.isArray(props.inventory) ? props.inventory.map(String) : [];
  const paused = !!props.isPaused;

  const groups: { prefix: Prefix; icon: string; equipped: string | null; onEquip?: (id: string) => void }[] = [
    { prefix: "arrow", icon: ICONS.arrow, equipped: props.equippedArrow ?? null, onEquip: props.onEquipArrow },
    { prefix: "energy", icon: ICONS.energy, equipped: props.equippedEnergy ?? null, onEquip: props.onEquipEnergy },
    { prefix: "armor", icon: ICONS.armor, equipped: props.equippedArmor ?? null, onEquip: props.onEquipArmor },
  ];

  const rows = groups.map((g) => {
    const items = RARITIES.map((r) => {
      const id = `${g.prefix}_${r}`;
      return { id, rarity: r, count: countOf(inventory, id) };
    });
    const active = items.find((it) => it.id === g.equipped) ?? null;
    const total = items.reduce((s, it) => s + it.count, 0);
    return { ...g, items, active, displayCount: active ? active.count : total };
  });

  const pick = (onEquip: ((id: string) => void) | undefined, id: string) => {
    if (paused) return;
    onEquip?.(id);
  };

  return (
    <div className={`rf-hud${paused ? " paused" : ""}`}>
      <input type="checkbox" id="rf-hud-toggle" className="rf-hud-check" tabIndex={-1} disabled={paused} />
      <label htmlFor="rf-hud-toggle" className="rf-hud-facade" aria-label="Consumables">
        {rows.map((row) => (
          <span key={row.prefix}
            className={`rf-hud-row${row.active ? ` active rarity-${row.active.rarity}` : ""}`}>
            <CategoryIcon prefix={row.prefix} icon={row.icon} className="rf-hud-icon" />
            <span className="rf-hud-count">{row.displayCount}</span>
          </span>
        ))}
      </label>

      <div className="rf-hud-pop">
        {rows.map((row) =>
          row.items.map((item) => (
            <button key={item.id} type="button"
              className={`rf-hud-cell rarity-${item.rarity}${row.active?.id === item.id ? " equipped" : ""}`}
              disabled={paused || (item.count <= 0 && row.active?.id !== item.id)}
              onClick={() => pick(row.onEquip, item.id)}
              aria-label={item.id}
              aria-pressed={row.active?.id === item.id}>
              <CategoryIcon prefix={row.prefix} icon={row.icon} className="rf-hud-cell-icon" />
              <span className="rf-hud-cell-count">{item.count}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
