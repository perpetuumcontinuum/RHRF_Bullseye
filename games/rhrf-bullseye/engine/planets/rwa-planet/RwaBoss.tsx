import React from "react";
import { PLAYER_Y, PLAYER_HEIGHT } from "../../geometry";

const DIM = "#4a4a55";
const STONE_DARK = "#1e293b";
const EDGE = "#1a1226";
const RED = "#ff2a2a";
const GRAY = "#5a5a64";
const GOLD = "#ffd700";

export default function RwaBoss({
  facing = "front",
  cyberStyle = false,
  forcedGray = false,
  phase = "alive",
  towerCharged = false,
  damage = 0,
  layer = "all",
}: {
  facing?: "front" | "back";
  cyberStyle?: boolean;
  forcedGray?: boolean;
  phase?: "alive" | "red" | "gone" | "gray";
  towerCharged?: boolean;
  damage?: number;
  layer?: "all" | "stone" | "trim";
}) {
  if (phase === "gone") return null;

  const gray = phase === "gray";
  const lit = !forcedGray && phase === "alive" && cyberStyle && facing === "front";
  const red = phase === "red";
  const trim = red ? RED : gray ? GRAY : lit ? "var(--cyber-fill, #00ffff)" : DIM;
  const FOOT_Y = PLAYER_Y + PLAYER_HEIGHT;
  const damageSafe = Math.max(0, Math.min(3, damage || 0));

  const showStone = layer !== "trim";
  const showTrim = layer !== "stone";

  return (
    <g
      className={gray ? "rf-rwa-stone-gray" : undefined}
      transform={`translate(580, ${FOOT_Y - 120})`}
      pointerEvents="none"
    >
      {showStone && (
        <defs>
          <linearGradient id="rwaStoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="55%" stopColor="#475569" />
            <stop offset="100%" stopColor={STONE_DARK} />
          </linearGradient>
          <filter id="rwaTrimGlow" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="3" result="b1" />
            <feGaussianBlur stdDeviation="7" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <g className={red ? "rf-rwa-shake" : undefined}>
        {showStone && (
          <>
            <ellipse cx="0" cy="120" rx="170" ry="10" fill="#000000" opacity="0.45" />

            <polygon
              points="-170,120 170,120 0,-160"
              fill={gray ? "#334155" : "url(#rwaStoneGrad)"}
              stroke={EDGE}
              strokeWidth="3"
              strokeLinejoin="round"
              opacity={gray ? 1 : damageSafe >= 3 ? 0.12 : 1 - damageSafe * 0.28}
            />

            {red && (
              <polygon
                points="-170,120 170,120 0,-160"
                fill="#ff0033"
                opacity="0.48"
                filter="url(#rwaTrimGlow)"
              >
                <animate attributeName="opacity" values="0.25;0.72;0.25" dur="0.42s" repeatCount="indefinite" />
              </polygon>
            )}
          </>
        )}

        {showTrim && (
          <g opacity={red ? 1 : lit ? 1 : gray ? 0.72 : 0.82} transform="translate(0,-10)">
            <g stroke="#000000" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle r="26" strokeWidth="8" />
              <line x1="-26" y1="0" x2="26" y2="0" strokeWidth="8" />
              <line x1="0" y1="-26" x2="0" y2="26" strokeWidth="8" />
              <circle r="6" strokeWidth="6" fill="#000000" />
              <text
                x="0"
                y="-44"
                textAnchor="middle"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="34"
                fontWeight="900"
                fill="#000000"
                stroke="#000000"
                strokeWidth="6"
                paintOrder="stroke"
              >
                $
              </text>
            </g>

            <g
              className={lit ? "friend-cyber" : undefined}
              stroke={trim}
              fill="none"
              filter={lit || red ? "url(#rwaTrimGlow)" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle r="26" strokeWidth="4" />
              <line x1="-26" y1="0" x2="26" y2="0" strokeWidth="4" />
              <line x1="0" y1="-26" x2="0" y2="26" strokeWidth="4" />
              <circle r="6" strokeWidth="3" fill={trim} />
            </g>

            <text
              x="0"
              y="-44"
              textAnchor="middle"
              fontFamily="'Courier New', Courier, monospace"
              fontSize="34"
              fontWeight="900"
              className={towerCharged ? "rf-rwa-dollar-charged" : undefined}
              fill={towerCharged ? RED : red ? RED : GOLD}
              stroke="none"
            >
              $
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
