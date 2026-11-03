import React from "react";
import { useT } from "./i18n";

interface HUDProps {
  metalStyle?: boolean;
  greatStyle?: boolean;
  score: number;
  rf: number;
  onShop: () => void;
  onGuide: () => void;
  onProfile: () => void;
  onLang?: () => void;
  flashColor: string | null;
  isPaused?: boolean;
  isMuted?: boolean;
  autoPauseEnabled?: boolean;
  onTogglePause?: () => void;
  onToggleMute?: () => void;
  onToggleTabPause?: () => void;
}

export default function HUD({
  score,
  rf,
  onShop,
  onGuide,
  onProfile,
  flashColor,
  metalStyle,
  greatStyle,
  isPaused = false,
  isMuted = false,
  autoPauseEnabled = false,
  onTogglePause,
  onToggleMute,
  onToggleTabPause,
}: HUDProps) {
  const isCyberFlash = flashColor === "cyber";
  const flash = isCyberFlash
    ? greatStyle ? "#d6b45a" : metalStyle ? "#8f99a6" : "var(--cyber-fill, #00ffff)"
    : flashColor;
  const t = useT();
  const tabColor = autoPauseEnabled ? "#00ff88" : "#ff4d4d";

  return (
    <div className="rf-top-bar">
      <div className="rf-top-bar__side rf-top-bar__side--left">
        <button
          type="button"
          className={`rf-tab-btn${autoPauseEnabled ? " rf-tab-btn--on" : ""}`}
          aria-label={autoPauseEnabled ? "TAB PAUSE ON" : "TAB PAUSE OFF"}
          title={autoPauseEnabled ? "Auto-pause on tab hidden: ON" : "Auto-pause on tab hidden: OFF"}
          onClick={() => onToggleTabPause?.()}
        >
          <svg viewBox="-18 -18 36 36" aria-hidden="true" focusable="false">
            <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke={tabColor} strokeWidth="1.5" />
            <path
              d="M -8 -5 H 8 V 4 H -8 Z M -5 -5 V -8 H 5 V -5"
              fill="none"
              stroke={tabColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {!autoPauseEnabled && (
              <line x1="-12" y1="12" x2="12" y2="-12" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div className="rf-top-bar__center">
        <div
          className={"rf-top-bar__score rf-ui-item rf-ui-item--score" + (isCyberFlash ? " rf-score-cyber" : "")}
          style={flash ? ({ "--score-flash": flash } as unknown as React.CSSProperties) : undefined}
        >
          {Math.floor(score).toLocaleString()}
        </div>

        <button className="rf-top-bar__btn rf-top-bar__btn--shop rf-ui-item rf-ui-item--shop" onClick={onShop}>{t("topbar.shop")}</button>
        <button className="rf-top-bar__btn rf-top-bar__btn--guide rf-ui-item rf-ui-item--guide" onClick={onGuide}>{t("topbar.guide")}</button>
        <button className="rf-top-bar__btn rf-top-bar__btn--profile rf-ui-item rf-ui-item--profile" onClick={onProfile}>{t("topbar.profile")}</button>

        <div className="rf-top-bar__rf rf-ui-item rf-ui-item--rf" data-no-bubble-dismiss aria-label="RF">
          <span className="rf-top-bar__rf-token" aria-hidden="true">
            <svg viewBox="-65 -65 130 130" focusable="false">
              <g shapeRendering="crispEdges">
                <path
                  d="M-28-58H28V-52H40V-42H50V-28H56V28H50V42H40V52H28V58H-28V52H-40V42H-50V28H-56V-28H-50V-42H-40V-52H-28Z"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="5"
                />
                <path
                  d="M-28-58H28V-52H40V-42H50V-28H56V28H50V42H40V52H28V58H-28V52H-40V42H-50V28H-56V-28H-50V-42H-40V-52H-28Z"
                  transform="scale(.85)"
                  fill="#000"
                />
                <path
                  d="M-24-43H24M-43-22V22M43-22V22M-24 43H24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <g transform="translate(-36 -36) scale(9)">
                  <rect width="8" height="8" fill="#000" />
                  <path
                    d="M1 1h1v1h-1zM2 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z"
                    fill="#fff"
                  />
                </g>
                <rect x="-36" y="-40" width="6" height="6" fill="#ccff00" />
              </g>
            </svg>
          </span>
          <span className="rf-top-bar__rf-value">{Math.floor(rf).toLocaleString()}</span>
        </div>
      </div>

      <div className="rf-top-bar__side rf-top-bar__side--right">

        <button
          type="button"
          className="rf-mute-btn"
          aria-label={isMuted ? "Sound off" : "Sound on"}
          title={isMuted ? "Unmute" : "Mute"}
          onClick={() => onToggleMute?.()}
        >
          <svg viewBox="-18 -18 36 36" aria-hidden="true" focusable="false">
            <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke="#ff00ff" strokeWidth="1.5" />
            <path
              d="M -4,-4 L -1,-4 L 3,-7 L 3,7 L -1,4 L -4,4 Z"
              fill="none"
              stroke="#ff00ff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {!isMuted && (
              <>
                <path d="M 5,-3 Q 7,0 5,3" fill="none" stroke="#ff00ff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 7,-5 Q 10,0 7,5" fill="none" stroke="#ff00ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </>
            )}
            {isMuted && (
              <line x1="-7" y1="-7" x2="8" y2="8" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <button
          type="button"
          className="rf-pause-btn"
          aria-label={isPaused ? "Resume" : "Pause"}
          title={isPaused ? "Resume" : "Pause"}
          onClick={() => onTogglePause?.()}
        >
          <svg viewBox="-18 -18 36 36" aria-hidden="true" focusable="false">
            <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke="#ccff00" strokeWidth="1.5" />
            {isPaused ? (
              <polygon points="-5,-7 7,0 -5,7" fill="none" stroke="#ccff00" strokeWidth="1.5" strokeLinejoin="round" />
            ) : (
              <>
                <line x1="-4" y1="-7" x2="-4" y2="7" stroke="#ccff00" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="4" y1="-7" x2="4" y2="7" stroke="#ccff00" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
