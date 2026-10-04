import { useT } from "./i18n";
import React from "react";

type HudProps = {
  inventory?: string[];
  counts?: Record<string, number> | Map<string, number> | null;
  equippedArrow?: string | null;
  onEquipArrow?: (id: string) => void;
};

const ARROW_ORDER = [
  { id: "arrow_rare", labelKey: "hud.rare", color: "#ccff00" },
  { id: "arrow_epic", labelKey: "hud.epic", color: "#aa00ff" },
  { id: "arrow_legendary", labelKey: "hud.leg", color: "#ffaa00" },
];

function normalizeCounts(
  input: HudProps["counts"],
  inventory?: string[]
): Record<string, number> {
  const result: Record<string, number> = {};

  if (input instanceof Map) {
    input.forEach((value, key) => {
      result[String(key)] = Number(value) || 0;
    });
    return result;
  }

  if (input && typeof input === "object" && !Array.isArray(input)) {
    for (const [key, value] of Object.entries(input)) {
      result[String(key)] = Number(value) || 0;
    }
    return result;
  }

  const list = Array.isArray(inventory) ? inventory : [];
  for (const id of list) {
    const key = String(id);
    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

export default function Hud(props: HudProps) {
  const t = useT();
  const counts = normalizeCounts(props.counts, props.inventory);
  const equippedArrow = props.equippedArrow ?? null;
  const onEquipArrow = props.onEquipArrow ?? (() => {});

  return (
    <div className="rf-hud-right">
      <div className="rf-hud-title">{t("hud.arrows")}</div>

      <div className="rf-hud-row">
        {ARROW_ORDER.map((arrow) => {
          const count = Number(counts[arrow.id] || 0);
          const equipped = equippedArrow === arrow.id;

          return (
            <button
              key={arrow.id}
              className={`rf-hud-item rarity-${arrow.id.split("_")[1]} ${
                equipped ? "equipped" : ""
              }`}
              disabled={count <= 0}
              onClick={() => onEquipArrow(arrow.id)}
              title={t("hud.arrowsTitle", { label: t(arrow.labelKey), count })}
            >
              <svg viewBox="0 0 24 24" className="rf-hud-icon" aria-hidden="true">
                <path d="M4 11h10V7l6 5-6 5v-4H4z" fill="currentColor" />
              </svg>

              <div className="rf-hud-count">{count}</div>
              <div className="rf-hud-label">{t(arrow.labelKey)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
