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
  // null = дефолт из CSS (--score-flash fallback #00ffff); кибер красит анимацией
  const flash = isCyberFlash ? null : flashColor;

  return (
    <div className="rf-top-bar">
      <div
        className={"rf-top-bar__score" + (isCyberFlash ? " rf-score-cyber" : "")}
        style={flash ? ({ "--score-flash": flash } as unknown as React.CSSProperties) : undefined}
      >
        {score.toLocaleString()}
      </div>
      <button className="rf-top-bar__btn rf-top-bar__btn--shop" onClick={onShop}>SHOP</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--guide" onClick={onGuide}>GUIDE</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--profile" onClick={onProfile}>PROFILE</button>
    </div>
  );
}
