import React, { useEffect } from "react";

type GuideProps = { onClose: () => void };

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(5, 0, 21, 0.84)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100, fontFamily: "monospace", color: "#e8e8ff",
  padding: "calc(8px + env(safe-area-inset-top, 0px)) calc(8px + env(safe-area-inset-right, 0px)) calc(8px + env(safe-area-inset-bottom, 0px)) calc(8px + env(safe-area-inset-left, 0px))",
};
const panelStyle: React.CSSProperties = {
  width: "min(760px, 100%)", maxHeight: "92dvh", overflowY: "auto",
  overflowX: "hidden", overscrollBehavior: "contain",
  background: "linear-gradient(180deg, #120024 0%, #070011 100%)",
  borderRadius: "clamp(10px, 2vw, 14px)",
  boxShadow: "0 0 34px rgba(0, 255, 255, 0.18)",
  padding: "clamp(10px, 3vw, 16px)",
};
const headerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: "clamp(8px, 2.2vw, 12px)",
};
const titleStyle: React.CSSProperties = {
  color: "#ff00ff", fontSize: "clamp(16px, 4.2vw, 20px)",
  letterSpacing: "clamp(1px, 0.35vw, 2px)", fontWeight: "bold",
};
const closeButtonStyle: React.CSSProperties = {
  background: "rgba(10, 0, 20, 0.9)", border: "1px solid #00ffff",
  borderRadius: "8px", color: "#00ffff",
  padding: "clamp(7px, 2vw, 9px) clamp(9px, 2.4vw, 12px)",
  cursor: "pointer", fontFamily: "monospace",
  fontSize: "clamp(11px, 3vw, 13px)", minHeight: 36, minWidth: 36,
};
const sectionStyle: React.CSSProperties = {
  border: "1px solid rgba(0, 255, 255, 0.16)",
  borderRadius: "clamp(8px, 2vw, 10px)",
  padding: "clamp(8px, 2.5vw, 12px)",
  marginBottom: "clamp(6px, 1.8vw, 8px)",
  background: "rgba(255, 255, 255, 0.02)",
};
const sectionTitleStyle: React.CSSProperties = {
  color: "#ccff00", fontSize: "clamp(11px, 3vw, 13px)",
  letterSpacing: "clamp(1px, 0.25vw, 1.4px)",
  marginBottom: "clamp(4px, 1.4vw, 6px)",
};
const listStyle: React.CSSProperties = {
  margin: 0, paddingLeft: "clamp(12px, 3.5vw, 16px)",
  lineHeight: 1.45, fontSize: "clamp(10.5px, 2.8vw, 12.5px)",
};
const keyStyle: React.CSSProperties = { color: "#00ffff" };
const cyberTextStyle: React.CSSProperties = { color: "#ff00ff" };

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
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="rf-guide-panel" style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle}>RHRF BULLSEYE</div>
          <button style={closeButtonStyle} onClick={onClose}>CLOSE</button>
        </div>
        {sections.map((section) => (
          <div key={section.title} style={sectionStyle}>
            <div style={sectionTitleStyle}>{section.title}</div>
            <ul style={listStyle}>
              {section.lines.map((line) => {
                const isKey = /^(SHOT|JUMP|LASER|SHOP|PROFILE|GUIDE|MUTE|PAUSE|X):/.test(line);
                const isCyber = section.title === "CYBER" || /cyber/i.test(line);
                return (
                  <li key={line}>
                    <span style={isKey ? keyStyle : isCyber ? cyberTextStyle : undefined}>{line}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
