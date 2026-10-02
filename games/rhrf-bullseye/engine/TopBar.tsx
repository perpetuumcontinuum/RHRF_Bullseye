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
  const flash = isCyberFlash ? null : flashColor;

  return (
    <div className="rb-bar">
      <div
        className={"rb-score" + (isCyberFlash ? " rb-score--cyber" : "")}
        style={flash ? ({ "--score-flash": flash } as unknown as React.CSSProperties) : undefined}
      >
        {score.toLocaleString()}
      </div>
      <button className="rb-btn rb-btn--shop" onClick={onShop}>SHOP</button>
      <button className="rb-btn rb-btn--guide" onClick={onGuide}>GUIDE</button>
      <button className="rb-btn rb-btn--profile" onClick={onProfile}>PROFILE</button>
    </div>
  );
}
