import React from "react";
import type { PlanetMissions } from "../../missions";

const SC = { ink: "#000000", lime: "#C7E36C", olive: "#314012" } as const;

interface Pillar { x: number; h: number; coinR: number; baseR: number; stroke: string; denom: number; fontSize: number; }

const PILLARS: Pillar[] = [
  { x: 60,  h: 150, coinR: 36, baseR: 16, stroke: SC.olive, denom: 25, fontSize: 45 },
  { x: 300, h: 175, coinR: 32, baseR: 18, stroke: SC.lime,  denom: 15, fontSize: 40 },
  { x: 560, h: 160, coinR: 26, baseR: 17, stroke: SC.olive, denom: 10, fontSize: 36 },
  { x: 815, h: 170, coinR: 42, baseR: 18, stroke: SC.lime,  denom: 50, fontSize: 55 },
  { x: 915, h: 125, coinR: 20, baseR: 14, stroke: SC.olive, denom: 5,  fontSize: 30 },
];

const GROUND_Y = 480;
const PILLAR_W = 18;
const TOWER_X = 140;
const TOWER_BASE_Y = GROUND_Y;
const TOWER_H = 140;
const K = TOWER_H / 140;
const T_BASE_W = 60 * K;
const T_TOP_W  = 20 * K;
const T_RAIL1_D = 80 * K,  T_RAIL1_W = 36 * K;
const T_RAIL2_D = 130 * K, T_RAIL2_W = 30 * K;
const T_ANT_D  = 180 * K,  T_ANT_W  = 24;
const T_TIP_Y  = TOWER_BASE_Y - TOWER_H;
const T_BEACON_D = 5 * K;
const T_BEACON_R = 4 * K;

export default function NftPlanetBackground({ towerActivated, missions }: { towerActivated?: boolean; missions?: import("../../missions").PlanetMissions }) {
  const done =
    (missions?.bow ? 1 : 0) +
    (missions?.hat ? 1 : 0) +
    (missions?.amulet ? 1 : 0) +
    (missions?.arrows ? 1 : 0);
  const MISSION_STEPS = [0, 0.33, 0.66, 0.99, 1];
  const towerFill = MISSION_STEPS[Math.max(0, Math.min(4, done))];
  const fillH = TOWER_H * towerFill;
  return (
    <g id="stablecoin-planet-background" aria-hidden="true">
      <defs>
        <linearGradient id="scSkyGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480">
          <stop offset="0" stopColor="#0a1404" />
          <stop offset="1" stopColor={SC.ink} />
        </linearGradient>
        <linearGradient id="scGroundGrad" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="700">
          <stop offset="0" stopColor={SC.olive} />
          <stop offset="1" stopColor={SC.ink} />
        </linearGradient>
        <radialGradient id="scCoinGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={SC.lime} />
          <stop offset="1" stopColor={SC.olive} />
        </radialGradient>
        <filter id="scCoinGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4" result="b1" />
          <feGaussianBlur stdDeviation="9" result="b2" />
          <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="scDotGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="-20000" y="-20000" width="60000" height="60000" fill="url(#scSkyGrad)" />

      <g stroke={SC.lime} strokeWidth="0.5" opacity="0.07">
        <path d="M0 0 L0 480 M120 0 L120 480 M240 0 L240 480 M360 0 L360 480 M480 0 L480 480 M600 0 L600 480 M720 0 L720 480 M840 0 L840 480 M960 0 L960 480" />
        <path d="M0 60 L960 60 M0 120 L960 120 M0 180 L960 180 M0 240 L960 240 M0 300 L960 300 M0 360 L960 360 M0 420 L960 420" />
      </g>

      <g fill="none" stroke={SC.lime} strokeWidth="1" opacity="0.18">
        <path d="M0 380 L120 410 L240 370 L360 430 L480 400 L600 460 L720 420 L840 480 L960 450" />
        <path d="M0 430 L120 460 L240 420 L360 480 L480 450 L600 510 L720 470 L840 530 L960 500" stroke={SC.olive} opacity="0.12" />
      </g>

      <g fill={SC.lime}>
        <circle cx="72" cy="120" r="1.1" opacity="0.4" />
        <circle cx="148" cy="60" r="1.4" opacity="0.3" />
        <circle cx="246" cy="150" r="1" opacity="0.45" />
        <circle cx="334" cy="90" r="1.5" opacity="0.25" />
        <circle cx="430" cy="140" r="1.1" opacity="0.4" />
        <circle cx="548" cy="70" r="1.3" opacity="0.3" />
        <circle cx="650" cy="160" r="1" opacity="0.45" />
        <circle cx="742" cy="100" r="1.4" opacity="0.28" />
        <circle cx="852" cy="130" r="1.1" opacity="0.4" />
        <circle cx="910" cy="80" r="1.2" opacity="0.3" />
      </g>

      <rect x="-20000" y="480" width="60000" height="20000" fill="url(#scGroundGrad)" />
      <line x1="-20000" y1="480" x2="20000" y2="480" stroke={SC.lime} strokeWidth="2" opacity="0.8" />
      <line x1="-20000" y1="482" x2="20000" y2="482" stroke={SC.lime} strokeWidth="5" opacity="1" />

      <g>
        {PILLARS.map((p, i) => (
          <g key={"pillar-" + i}>
            <rect x={p.x - PILLAR_W / 2} y={GROUND_Y - p.h} width={PILLAR_W} height={p.h} fill="none" stroke={SC.lime} strokeWidth="1.2" opacity="0.85" />
            <line x1={p.x - PILLAR_W / 2} y1={GROUND_Y - p.h * 0.4} x2={p.x + PILLAR_W / 2} y2={GROUND_Y - p.h * 0.4} stroke={SC.olive} strokeWidth="0.8" opacity="0.5" />
            <line x1={p.x - PILLAR_W / 2} y1={GROUND_Y - p.h * 0.7} x2={p.x + PILLAR_W / 2} y2={GROUND_Y - p.h * 0.7} stroke={SC.olive} strokeWidth="0.8" opacity="0.5" />
            <g transform={`translate(${p.x}, ${GROUND_Y - p.h - p.baseR})`}>
              <circle r={p.coinR} fill="url(#scCoinGrad)" stroke={p.stroke} strokeWidth="1.5" filter="url(#scCoinGlow)" />
              <text
                x="0" y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Courier New', Courier, monospace"
                fontSize={p.fontSize}
                fontWeight="900"
                fill={SC.ink}
                opacity="0.72"
              >
                {p.denom}
              </text>
            </g>
          </g>
        ))}
      </g>

      <g>
        <g transform="translate(120, 220)">
          <circle r="7" fill={SC.lime} opacity="0.5" filter="url(#scDotGlow)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
        <g transform="translate(380, 170)">
          <circle r="6" fill={SC.lime} opacity="0.5" filter="url(#scDotGlow)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
        <g transform="translate(620, 240)">
          <circle r="8" fill={SC.lime} opacity="0.5" filter="url(#scDotGlow)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.8s" repeatCount="indefinite" />
          </circle>
        </g>
        <g transform="translate(880, 190)">
          <circle r="6" fill={SC.lime} opacity="0.5" filter="url(#scDotGlow)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="3.2s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>

      <g>
        {towerFill > 0 && (
        <g>
          <defs>
            <clipPath id="scTowerFillClip">
              <polygon points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`} />
            </clipPath>
          </defs>
          <g clipPath="url(#scTowerFillClip)">
            <rect x={TOWER_X - T_BASE_W / 2} y={TOWER_BASE_Y - fillH} width={T_BASE_W} height={fillH} fill={SC.lime} opacity="0.8" />
            <line x1={TOWER_X - T_BASE_W / 2} y1={TOWER_BASE_Y - fillH} x2={TOWER_X + T_BASE_W / 2} y2={TOWER_BASE_Y - fillH} stroke="#EAF7C8" strokeWidth="1.5" opacity="0.95" />
          </g>
        </g>
      )}
        <polygon
          points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`}
          fill="none"
          stroke={SC.lime}
          strokeWidth="1.5"
          filter="url(#scCoinGlow)"
          opacity="0.9"
        />
        <line x1={TOWER_X - T_RAIL1_W / 2} y1={TOWER_BASE_Y - T_RAIL1_D} x2={TOWER_X + T_RAIL1_W / 2} y2={TOWER_BASE_Y - T_RAIL1_D} stroke={SC.lime} strokeWidth="0.8" opacity="0.6" />
        <line x1={TOWER_X - T_RAIL2_W / 2} y1={TOWER_BASE_Y - T_RAIL2_D} x2={TOWER_X + T_RAIL2_W / 2} y2={TOWER_BASE_Y - T_RAIL2_D} stroke={SC.lime} strokeWidth="0.8" opacity="0.6" />
        <line x1={TOWER_X - T_ANT_W / 2} y1={T_TIP_Y - T_BEACON_D - 35} x2={TOWER_X + T_ANT_W / 2} y2={T_TIP_Y - T_BEACON_D - 35} stroke={SC.lime} strokeWidth="0.8" opacity="0.6" />
        <circle cx={TOWER_X} cy={T_TIP_Y - T_BEACON_D} r={T_BEACON_R} fill={SC.lime} filter="url(#scCoinGlow)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}
