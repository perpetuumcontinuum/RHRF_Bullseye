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
      <button className="rf-top-bar__btn rf-top-bar__btn--shop" onClick={onShop}>{t("topbar.shop")}</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--guide" onClick={onGuide}>{t("topbar.guide")}</button>
      <button className="rf-top-bar__btn rf-top-bar__btn--profile" onClick={onProfile}>{t("topbar.profile")}</button>
      <button
        className="rf-top-bar__btn rf-top-bar__btn--lang" data-no-bubble-dismiss
        onClick={onLang}
        data-rf-skip-space="true"
        aria-label={t("lang.label")}
      >
        {lang.toUpperCase()}
      </button>
    </div>
  );
}
