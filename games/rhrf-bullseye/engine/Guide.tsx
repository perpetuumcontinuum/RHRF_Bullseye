import React, { useEffect } from "react";
import { useT } from "./i18n";

type GuideProps = { onClose: () => void };
type Tone = "key" | "cyber" | undefined;

// Переводчик правит ТОЛЬКО значения в locales/*.ts. Токены хоткеев (1/Numpad1, Esc)
// живут здесь и не переводятся намеренно.
const SECTIONS: ReadonlyArray<{
  id: string;
  titleKey: string;
  rows: ReadonlyArray<{ k: string; tone: Tone }>;
}> = [
  { id: "controls", titleKey: "guide.controls.title", rows: [
    { k: "guide.controls.shot", tone: "key" },
    { k: "guide.controls.jump", tone: "key" },
    { k: "guide.controls.laser", tone: "key" },
    { k: "guide.controls.shop", tone: "key" },
    { k: "guide.controls.profile", tone: "key" },
    { k: "guide.controls.guide", tone: "key" },
    { k: "guide.controls.mute", tone: "key" },
    { k: "guide.controls.pause", tone: "key" },
    { k: "guide.controls.share", tone: "key" },
  ]},
  { id: "profile", titleKey: "guide.profile.title", rows: [
    { k: "guide.profile.score", tone: undefined },
    { k: "guide.profile.items", tone: undefined },
    { k: "guide.profile.equipped", tone: undefined },
    { k: "guide.profile.total", tone: undefined },
  ]},
  { id: "score", titleKey: "guide.score.title", rows: [
    { k: "guide.score.bull", tone: undefined },
    { k: "guide.score.epic", tone: undefined },
    { k: "guide.score.rare", tone: undefined },
    { k: "guide.score.common", tone: undefined },
  ]},
  { id: "rarity", titleKey: "guide.rarity.title", rows: [
    { k: "guide.rarity.rare", tone: undefined },
    { k: "guide.rarity.epic", tone: undefined },
    { k: "guide.rarity.legendary", tone: undefined },
    { k: "guide.rarity.cyber", tone: "cyber" },
  ]},
  { id: "lasers", titleKey: "guide.lasers.title", rows: [
    { k: "guide.lasers.drop", tone: undefined },
    { k: "guide.lasers.cap", tone: undefined },
    { k: "guide.lasers.use", tone: undefined },
    { k: "guide.lasers.sell", tone: undefined },
    { k: "guide.lasers.paused", tone: undefined },
  ]},
  { id: "economy", titleKey: "guide.economy.title", rows: [
    { k: "guide.economy.bows", tone: undefined },
    { k: "guide.economy.outfits", tone: undefined },
    { k: "guide.economy.amulets", tone: undefined },
    { k: "guide.economy.arrows", tone: undefined },
    { k: "guide.economy.energy", tone: undefined },
    { k: "guide.economy.armor", tone: undefined },
    { k: "guide.economy.sell", tone: undefined },
    { k: "guide.economy.note", tone: undefined },
  ]},
  { id: "cyber", titleKey: "guide.cyber.title", rows: [
    { k: "guide.cyber.req", tone: "cyber" },
    { k: "guide.cyber.shake", tone: "cyber" },
    { k: "guide.cyber.shimmer", tone: "cyber" },
  ]},
  { id: "badges", titleKey: "guide.badges.title", rows: [
    { k: "guide.badges.streak", tone: undefined },
    { k: "guide.badges.time", tone: undefined },
    { k: "guide.badges.rf", tone: undefined },
    { k: "guide.badges.final", tone: "cyber" },
    { k: "guide.badges.relock", tone: undefined },
  ]},
  { id: "session", titleKey: "guide.session.title", rows: [
    { k: "guide.session.live", tone: undefined },
    { k: "guide.session.reset", tone: undefined },
    { k: "guide.session.beta", tone: undefined },
  ]},
  { id: "about", titleKey: "guide.about.title", rows: [
    { k: "guide.about.rf", tone: undefined },
    { k: "guide.about.idle", tone: undefined },
  ]},
];

// Хоткеи: токены не переводятся, описания — да
const HOTKEYS: ReadonlyArray<{ tokens: string; act: string }> = [
  { tokens: "1 / Numpad1", act: "guide.hotkeys.laser" },
  { tokens: "2 / Numpad2", act: "guide.hotkeys.shot" },
  { tokens: "3 / Numpad3", act: "guide.hotkeys.jump" },
  { tokens: "4 / Space",   act: "guide.hotkeys.pause" },
  { tokens: "5 / M",       act: "guide.hotkeys.mute" },
  { tokens: "6 / S",       act: "guide.hotkeys.shop" },
  { tokens: "7 / P",       act: "guide.hotkeys.profile" },
  { tokens: "8 / G",       act: "guide.hotkeys.guide" },
  { tokens: "Esc",         act: "guide.hotkeys.close" },
];

export default function Guide({ onClose }: GuideProps) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rf-guide-overlay" onClick={onClose}>
      <div className="rf-guide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-guide-header">
          <div className="rf-guide-title">RHRF BULLSEYE</div>
          <button className="rf-guide-close" onClick={onClose} aria-label={t("guide.close")}>✕</button>
        </div>
        <div className="rf-guide-body">
          {SECTIONS.map((section) => (
            <div key={section.id} className="rf-guide-section">
              <div className="rf-guide-section-title">{t(section.titleKey)}</div>
              <ul className="rf-guide-list">
                {section.rows.map((row) => (
                  <li key={row.k}>
                    <span className={row.tone === "key" ? "rf-guide-key" : row.tone === "cyber" ? "rf-guide-cyber" : undefined}>
                      {t(row.k)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="rf-guide-section">
            <div className="rf-guide-section-title">{t("guide.hotkeys.title")}</div>
            <ul className="rf-guide-list">
              {HOTKEYS.map((hk) => (
                <li key={hk.tokens}>
                  <span className="rf-guide-key">{hk.tokens}</span>
                  <span> — </span>
                  <span>{t(hk.act)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}