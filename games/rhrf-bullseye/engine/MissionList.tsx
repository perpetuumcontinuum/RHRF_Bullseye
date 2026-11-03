import React, { useEffect, useState } from "react";
import type { PlanetMissions } from "./missions";
import { useLang } from "./i18n";
import {
  getMissionTexts,
  normalizeMissionRarity,
  type MissionSupplyKind,
} from "./missionTexts";

interface MissionListProps {
  buttonLabel?: string;
  rwaTowerReady?: boolean;
  rwaBulls?: number;
  rwaCyberReady?: boolean;
  rwaPortalOpen?: boolean;
  rwaTouch?: boolean;
  onOpenProfile?: () => void;
  onActivateTower?: () => void;
  planetId: string;
  missions: PlanetMissions;
  accent: string;
  arrowCount: number;
  arrowCap: number;
  disabled?: boolean;
  towerActivated?: boolean;
  rarityLabel?: string;
  supplyLabel?: string;
  supplyKind?: MissionSupplyKind;
}

function inferSupplyKind(label?: string, kind?: MissionSupplyKind): MissionSupplyKind {
  if (kind) return kind;
  const s = String(label || "").toUpperCase();
  if (s.includes("ENERGY")) return "energy";
  if (s.includes("SHIELD") || s.includes("ARMOR")) return "armor";
  return "arrow";
}

export default function MissionList({
  buttonLabel,
  rwaBulls = 0,
  rwaCyberReady = false,
  rwaPortalOpen = false,
  rwaTouch = false,
  onOpenProfile,
  onActivateTower,
  planetId,
  missions,
  accent,
  arrowCount,
  arrowCap,
  disabled,
  towerActivated,
  rarityLabel,
  supplyLabel,
  supplyKind,
}: MissionListProps) {
  const lang = useLang();
  const L = getMissionTexts(lang);
  const [open, setOpen] = useState(false);

  const isRwa = planetId === "rwa";
  const rwaBullsSafe = Math.max(0, Math.min(10, rwaBulls || 0));
  const kind = inferSupplyKind(supplyLabel, supplyKind);
  const rarity = normalizeMissionRarity(rarityLabel);

  const allDone = isRwa
    ? Boolean(rwaCyberReady) && rwaBullsSafe >= 10
    : missions.bow && missions.hat && missions.amulet && missions.arrows;

  const rows: { key: string; label: string; done: boolean; value: string }[] = isRwa
    ? [
        {
          key: "cyber",
          label: L.equipCyber,
          done: Boolean(rwaCyberReady),
          value: L.required,
        },
        {
          key: "bullseye",
          label: L.hitBullseye,
          done: rwaBullsSafe >= 10,
          value: rwaPortalOpen
            ? L.done
            : rwaCyberReady
            ? `${rwaBullsSafe}/10`
            : L.locked,
        },
        {
          key: "portal",
          label: L.enterPortal,
          done: false,
          value: rwaPortalOpen ? (rwaTouch ? L.tapBeam : L.pressG) : L.locked,
        },
      ]
    : [
        {
          key: "bow",
          label: L.bow[rarity],
          done: missions.bow,
          value: "",
        },
        {
          key: "hat",
          label: L.outfit[rarity],
          done: missions.hat,
          value: "",
        },
        {
          key: "amulet",
          label: L.amulet[rarity],
          done: missions.amulet,
          value: "",
        },
        {
          key: "arrows",
          label: L.supply[rarity][kind],
          done: missions.arrows,
          value: missions.arrows ? "" : `${Math.min(arrowCount, arrowCap)}/${arrowCap}`,
        },
      ];

  const planetName = L.planets[planetId] || planetId.toUpperCase();
  const activateMode = allDone && !towerActivated && !disabled;

  useEffect(() => {
    if (activateMode) setOpen(false);
  }, [activateMode]);

  const toggleLabel = towerActivated
    ? L.leavePlanet
    : activateMode
    ? L.activateTower
    : buttonLabel || L.mission;

  const toggleDisabled = towerActivated || disabled;

  const onToggleClick = () => {
    if (activateMode) {
      setOpen(false);
      onActivateTower?.();
      return;
    }
    if (!toggleDisabled) setOpen((o) => !o);
  };

  return (
    <div
      className={`rf-missions rf-ui-slot${open ? " open" : ""}`}
      data-no-bubble-dismiss
      style={{ ["--mission-accent" as any]: accent }}
    >
      <button
        type="button"
        className="rf-missions__toggle rf-ui-item rf-ui-item--mission"
        aria-expanded={activateMode ? false : open}
        aria-controls="rf-missions-panel"
        disabled={toggleDisabled}
        onClick={onToggleClick}
      >
        <span className="rf-missions__toggle-name">{toggleLabel}</span>
        <span className="rf-missions__chevron" aria-hidden="true">
          {activateMode ? "\u2192" : open ? "\u25BE" : "\u25B8"}
        </span>
      </button>

      <div
        className="rf-missions__panel"
        id="rf-missions-panel"
        role="region"
        aria-label={`${planetName}: ${L.missions}`}
      >
        {towerActivated ? (
          <button type="button" className="rf-missions__btn" disabled>
            {L.leavePlanet}
          </button>
        ) : (
          <>
            {isRwa && !rwaCyberReady && onOpenProfile && (
              <button type="button" className="rf-missions__btn" onClick={onOpenProfile}>
                {L.openProfile}
              </button>
            )}

            <div className="rf-missions__list">
              {rows.map((row) => (
                <div key={row.key} className={`rf-missions__item${row.done ? " done" : ""}`}>
                  <span>{row.label}</span>
                  <span>{row.done ? L.ok : row.value}</span>
                </div>
              ))}
            </div>

            {allDone && (
              <button
                type="button"
                className="rf-missions__btn"
                disabled={disabled}
                onClick={onActivateTower}
              >
                {L.activateTower}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
