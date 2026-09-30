import React from "react";

interface HUDProps {
  score: number;
  onShop: () => void;
  onGuide: () => void;
  onProfile: () => void;
  flashColor: string | null;
}

export default function HUD({ score, onShop, onGuide, onProfile, flashColor }: HUDProps) {
  const isCyberFlash = flashColor === "cyber";
  const currentColor = isCyberFlash ? "#00ffff" : flashColor || "#00ffff";
  const glowColor = isCyberFlash ? "#00ffff88" : flashColor ? `${flashColor}88` : "#00ffff88";
  const innerGlow = isCyberFlash ? "#00ffff44" : flashColor ? `${flashColor}44` : "#00ffff44";

  const scoreStyle: React.CSSProperties = { transition: "none" };
  if (!isCyberFlash) {
    scoreStyle.border = `2px solid ${currentColor}`;
    scoreStyle.boxShadow = `0 0 12px ${glowColor}, inset 0 0 8px ${innerGlow}`;
    scoreStyle.color = currentColor;
    scoreStyle.textShadow = `0 0 8px ${currentColor}`;
  }

  return (
    <div className="rf-top-bar">
      <div className={"rf-top-bar__score" + (isCyberFlash ? " rf-score-cyber" : "")} style={scoreStyle}>
        {score.toLocaleString()}
      </div>
      <button className="rf-top-bar__btn rf-top-bar__btn--shop" onClick={onShop}>SHOP</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--guide" onClick={onGuide}>GUIDE</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--profile" onClick={onProfile}>PROFILE</button>
    </div>
  );
}
