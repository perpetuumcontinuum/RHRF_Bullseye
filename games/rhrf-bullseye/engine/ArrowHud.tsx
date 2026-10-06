import React, { useState } from "react";

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
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="12"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="40" y1="160" x2="160" y2="40" />
      <polyline points="130,40 160,40 160,70" />
      <polyline points="70,160 40,160 40,130" transform="rotate(-180,40,160)" />
    </svg>
  );
}


function CollapsibleSlot(props: {
  prefix: "arrow" | "armor" | "energy";
  icon: string;
  inventory: string[];
  equipped: string | null;
  onEquip?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const rows = RARITIES.map((rarity) => {
    const id = `${props.prefix}_${rarity}`;
    return { id, rarity, count: countOf(props.inventory, id) };
  });

  const activeRow = rows.find((row) => row.id === props.equipped) ?? null;
  const displayCount = activeRow
    ? activeRow.count
    : rows.reduce((sum, row) => sum + row.count, 0);

  const handlePick = (row: (typeof rows)[number]) => {
    if (activeRow?.id === row.id) { props.onEquip?.(row.id); setOpen(false); return; }
    if (row.count <= 0) return;
    props.onEquip?.(row.id);
    setOpen(false);
  };


  return (
    <div className={`rf-hud-cat ${open ? "open" : ""}`}>
      <button
        type="button"
        className={`rf-hud-main ${activeRow ? `active rarity-${activeRow.rarity}` : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${props.prefix} selector`}
      >
        {props.prefix === "arrow" ? (
          <ArrowGlyph className="rf-hud-icon" />
        ) : (
          <svg viewBox="0 0 24 24" className="rf-hud-icon" aria-hidden="true">
            <path d={props.icon} fill="currentColor" />
          </svg>
        )}
        <span className="rf-hud-count">{displayCount}</span>
      </button>

      <div className="rf-hud-expand">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`rf-hud-mini rarity-${row.rarity} ${activeRow?.id === row.id ? "equipped" : ""}`}
            aria-pressed={activeRow?.id === row.id}
            disabled={row.count <= 0 && activeRow?.id !== row.id}
            onClick={() => handlePick(row)}
            aria-label={row.id}
          >
            {props.prefix === "arrow" ? (
              <ArrowGlyph className="rf-hud-mini-icon" />
            ) : (
              <svg viewBox="0 0 24 24" className="rf-hud-mini-icon" aria-hidden="true">
                <path d={props.icon} fill="currentColor" />
              </svg>
            )}
            <span className="rf-hud-mini-count">{row.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ArrowHud(props: HudProps) {
  const inventory = Array.isArray(props.inventory) ? props.inventory.map(String) : [];
  return (
    <div className={`rf-hud-stack${props.isPaused ? " rf-paused-lock" : ""}`}{...(props.isPaused ? ({ inert: "" } as any) : {})}>
      <CollapsibleSlot prefix="arrow" icon={ICONS.arrow} inventory={inventory}
        equipped={props.equippedArrow ?? null} onEquip={props.onEquipArrow} />
      <CollapsibleSlot prefix="armor" icon={ICONS.armor} inventory={inventory}
        equipped={props.equippedArmor ?? null} onEquip={props.onEquipArmor} />
      <CollapsibleSlot prefix="energy" icon={ICONS.energy} inventory={inventory}
        equipped={props.equippedEnergy ?? null} onEquip={props.onEquipEnergy} />
    </div>
  );
}