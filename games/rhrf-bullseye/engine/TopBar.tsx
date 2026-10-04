import React from "react";
import { useLang, useT } from "./i18n";

interface HUDProps {
  score: number;
  onShop: () => void;
  onGuide: () => void;
  onProfile: () => void;
  onLang: () => void;
  flashColor: string | null;
}

export default function HUD({ score, onShop, onGuide, onProfile, onLang, flashColor }: HUDProps) {
  const isCyberFlash = flashColor === "cyber";
  // null = дефолт из CSS (--score-flash fallback #00ffff); кибер красит анимацией
  const flash = isCyberFlash ? null : flashColor;
  const lang = useLang();
  const t = useT();

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
      {/* Language lives in the HTML bar, not the SVG row: z-index cannot bridge
          the HTML-over-SVG layers, so an SVG globe was unclickable under this bar.
          data-rf-skip-space keeps the capture-phase Space handler from stealing
          the keypress (it preventDefaults before the BUTTON guard). */}
      <button
        className="rf-top-bar__btn rf-top-bar__btn--lang"
        onClick={onLang}
        data-rf-skip-space="true"
        aria-label={t("lang.label")}
      >
        {lang.toUpperCase()}
      </button>
    </div>
  );
}
