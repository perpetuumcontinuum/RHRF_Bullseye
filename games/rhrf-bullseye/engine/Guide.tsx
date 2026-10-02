import React, { useEffect } from "react";

type GuideProps = { onClose: () => void };

export default function Guide({ onClose }: GuideProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sections = [
    { title: "CONTROLS", lines: ["SHOT: fire arrow.", "JUMP: dodge ghost.", "LASER: destroy asteroid.", "SHOP: buy, equip or sell.", "PROFILE: stats and cyber style.", "GUIDE: open this screen.", "MUTE: toggle audio.", "PAUSE: freeze gameplay.", "X: share screenshot."] },
    { title: "SCORE", lines: ["10: bullseye, cyber shimmer.", "9-7: epic zone.", "6-4: rare zone.", "3-1: common zone."] },
    { title: "RARITY", lines: ["Rare: basic boost.", "Epic: stronger boost.", "Legendary: best boost.", "Three legendaries unlock cyber style."] },
    { title: "LASERS", lines: ["Satellites drop laser consumables.", "Laser cap is 100.", "Use lasers for tower defense.", "Sell lasers in shop for RF.", "Lasers can accumulate while paused."] },
    { title: "CYBER", lines: ["Requires legendary bow, outfit and amulet.", "Reduces screen shake.", "Bullseye shimmer is always visible."] },
    { title: "HOTKEYS", lines: ["1 / Numpad1 — Tower Laser", "2 / Numpad2 — Shot", "3 / Numpad3 — Jump", "4 / Space — Pause / Resume", "5 / M — Toggle mute", "6 / S — Open Shop", "7 / P — Open Profile", "8 / G — Open Guide", "Esc — Close overlays"] },
  ];

  return (
    <div className="rf-guide-overlay" onClick={onClose}>
      <div className="rf-guide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-guide-header">
          <div className="rf-guide-title">RHRF BULLSEYE</div>
          <button className="rf-guide-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="rf-guide-body">
          {sections.map((section) => (
            <div key={section.title} className="rf-guide-section">
              <div className="rf-guide-section-title">{section.title}</div>
              <ul className="rf-guide-list">
                {section.lines.map((line) => {
                  const isKey = /^(SHOT|JUMP|LASER|SHOP|PROFILE|GUIDE|MUTE|PAUSE|X):/.test(line);
                  const isCyber = section.title === "CYBER" || /cyber/i.test(line);
                  return (
                    <li key={line}>
                      <span className={isKey ? "rf-guide-key" : isCyber ? "rf-guide-cyber" : undefined}>{line}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
