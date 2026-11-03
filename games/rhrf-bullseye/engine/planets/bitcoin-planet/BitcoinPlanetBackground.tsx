import React from "react";
import type { PlanetMissions } from "../../missions";

const BT = {
  ink: "#000000",
  orange: "#F7931A",
  dark: "#7a3d00",
  deeper: "#3a1a00",
  cheese: "#ffd166",
  cream: "#ffe7b3",
  sauce: "#00ffff",
  olive: "#aa00ff",
} as const;

const GROUND_Y = 480;
const TOWER_X = 860;
const TOWER_BASE_Y = GROUND_Y;
const TOWER_H = 140;
const K = TOWER_H / 140;
const T_BASE_W = 60 * K;
const T_TOP_W = 20 * K;
const T_RAIL1_D = 80 * K, T_RAIL1_W = 36 * K;
const T_RAIL2_D = 130 * K, T_RAIL2_W = 30 * K;
const T_ANT_D = 180 * K, T_ANT_W = 24;
const T_TIP_Y = TOWER_BASE_Y - TOWER_H;
const T_BEACON_D = 5 * K;
const T_BEACON_R = 4 * K;
const MISSION_STEPS = [0, 0.33, 0.66, 0.99, 1];

const TOPPING_COLORS = ["#ccff00", "#aa00ff", "#F7931A", "#00ffff"];

type Pizza = {
  x: number;
  y: number;
  r: number;
  a0: number;
  a1: number;
  toppings: number;
};

const PIZZAS: Pizza[] = [
  { x: 55,  y: 115, r: 28, a0: 68,  a1: 112, toppings: 6 },
  { x: 150, y: 145, r: 46, a0: 50,  a1: 130, toppings: 4 },
  { x: 265, y: 185, r: 72, a0: 22,  a1: 158, toppings: 6 },
  { x: 590, y: 150, r: 62, a0: 38,  a1: 142, toppings: 5 },
  { x: 790, y: 120, r: 46, a0: 18,  a1: 342, toppings: 14 },
];

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function pizzaPath(p: Pizza): string {
  const [x0, y0] = polar(p.x, p.y, p.r, p.a0);
  const [x1, y1] = polar(p.x, p.y, p.r, p.a1);
  const diff = Math.abs(p.a1 - p.a0);
  const large = diff > 180 ? 1 : 0;
  const sweep = p.a1 > p.a0 ? 1 : 0;
  return `M ${p.x} ${p.y} L ${x0} ${y0} A ${p.r} ${p.r} 0 ${large} ${sweep} ${x1} ${y1} Z`;
}

function pizzaToppings(p: Pizza) {
  const out: { x: number; y: number; r: number; c: string }[] = [];
  const count = Math.max(4, p.toppings);
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const seed = Math.abs(Math.round(p.x * 17 + p.y * 31 + p.r * 7));

  for (let i = 0; i < count; i++) {
    const base = (i + 0.5) / count;
    const jitter = (((seed + i * 97) % 100) / 100 - 0.5) * 0.18;
    const tt = Math.max(0.12, Math.min(0.88, base + jitter));
    const angle = rad(p.a0 + (p.a1 - p.a0) * tt);
    const dist = p.r * (0.28 + (((seed + i * 53) % 100) / 100) * 0.52);
    const size = Math.max(1.6, p.r * (0.055 + (((seed + i * 29) % 100) / 100) * 0.055));

    out.push({
      x: p.x + Math.cos(angle) * dist,
      y: p.y + Math.sin(angle) * dist,
      r: size,
      c: TOPPING_COLORS[i % TOPPING_COLORS.length],
    });
  }

  return out;
}

function cheeseDrip(x: number, endY: number) {
  const c1x = x + 9;
  const c1y = endY * 0.34;
  const c2x = x - 9;
  const c2y = endY * 0.7;

  return (
    <>
      <path
        d={`M ${x} 0 C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${endY}`}
        fill="none"
        stroke={BT.cheese}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.9"
        filter="url(#btSoftGlow)"
      />
      <circle cx={x} cy={0} r={4.5} fill={BT.cheese} opacity="0.92" filter="url(#btSoftGlow)" />
      <ellipse cx={x} cy={endY} rx={9} ry={5} fill={BT.cheese} opacity="0.95" filter="url(#btSoftGlow)" />
    </>
  );
}

export default function BitcoinPlanetBackground({
  missions,
  towerActivated,
}: {
  missions?: PlanetMissions;
  towerActivated?: boolean;
}) {
  void towerActivated;
  const done =
    (missions?.bow ? 1 : 0) +
    (missions?.hat ? 1 : 0) +
    (missions?.amulet ? 1 : 0) +
    (missions?.arrows ? 1 : 0);

  const towerFill = MISSION_STEPS[Math.max(0, Math.min(4, done))];
  const fillH = TOWER_H * towerFill;
  const towerY = TOWER_BASE_Y - fillH;

  return (
    <g id="bitcoin-planet-background" aria-hidden="true">
      <defs>
        <linearGradient id="btSkyGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="480">
          <stop offset="0" stopColor={BT.deeper} />
          <stop offset="1" stopColor={BT.ink} />
        </linearGradient>
        <linearGradient id="btGroundGrad" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="700">
          <stop offset="0" stopColor={BT.dark} />
          <stop offset="1" stopColor={BT.ink} />
        </linearGradient>
        <radialGradient id="btCheeseGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={BT.cream} />
          <stop offset="1" stopColor={BT.cheese} />
        </radialGradient>
        <filter id="btGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4" result="b1" />
          <feGaussianBlur stdDeviation="9" result="b2" />
          <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="btSoftGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="-20000" y="-20000" width="60000" height="60000" fill="url(#btSkyGrad)" />

      <g stroke={BT.orange} strokeWidth="0.5" opacity="0.08">
        <path d="M0 0 L0 480 M120 0 L120 480 M240 0 L240 480 M360 0 L360 480 M480 0 L480 480 M600 0 L600 480 M720 0 L720 480 M840 0 L840 480 M960 0 L960 480" />
        <path d="M0 60 L960 60 M0 120 L960 120 M0 180 L960 180 M0 240 L960 240 M0 300 L960 300 M0 360 L960 360 M0 420 L960 420" />
      </g>

      <g fill="none" stroke={BT.orange} strokeWidth="1" opacity="0.16">
        <path d="M0 380 L120 410 L240 370 L360 430 L480 400 L600 460 L720 420 L840 480 L960 450" />
        <path d="M0 430 L120 460 L240 420 L360 480 L480 450 L600 510 L720 470 L840 530 L960 500" stroke={BT.dark} opacity="0.12" />
      </g>

      <g fill={BT.orange}>
        <circle cx="88" cy="120" r="1.2" opacity="0.45" />
        <circle cx="176" cy="70" r="1.5" opacity="0.35" />
        <circle cx="286" cy="150" r="1" opacity="0.5" />
        <circle cx="410" cy="90" r="1.6" opacity="0.28" />
        <circle cx="520" cy="140" r="1.1" opacity="0.42" />
        <circle cx="680" cy="80" r="1.3" opacity="0.34" />
        <circle cx="760" cy="160" r="1" opacity="0.48" />
        <circle cx="860" cy="110" r="1.4" opacity="0.3" />
      </g>

      <rect x="-20000" y="480" width="60000" height="20000" fill="url(#btGroundGrad)" />
      <line x1="-20000" y1="480" x2="20000" y2="480" stroke={BT.orange} strokeWidth="2" opacity="0.8" />
      <line x1="-20000" y1="482" x2="20000" y2="482" stroke={BT.orange} strokeWidth="5" opacity="1" />

      {PIZZAS.map((p, i) => {
        const d = pizzaPath(p);
        const tops = pizzaToppings(p);
        return (
          <g key={"pizza-" + i} opacity="0.94">
            {cheeseDrip(p.x, p.y)}
            <path d={pizzaPath({ ...p, r: p.r + 5 })} fill={BT.dark} stroke={BT.orange} strokeWidth="2" opacity="0.92" />
            <path d={d} fill="url(#btCheeseGrad)" stroke={BT.orange} strokeWidth="6" strokeLinejoin="round" filter="url(#btGlow)" />
            <path d={pizzaPath({ ...p, r: p.r * 0.78 })} fill="#ff3b3b" opacity="0.22" />
            <path d={d} fill="none" stroke={BT.dark} strokeWidth="1" opacity="0.55" />
            {tops.map((t, j) => (
              <circle
                key={"top-" + i + "-" + j}
                cx={t.x}
                cy={t.y}
                r={t.r}
                fill={t.c}
                stroke={BT.ink}
                strokeWidth="0.8"
                opacity="0.9"
              />
            ))}
          </g>
        );
      })}

      <g>
        {towerFill > 0 && (
          <g>
            <defs>
              <clipPath id="btTowerFillClip">
                <polygon points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`} />
              </clipPath>
            </defs>
            <g clipPath="url(#btTowerFillClip)">
              <rect x={TOWER_X - T_BASE_W / 2} y={towerY} width={T_BASE_W} height={fillH} fill={BT.orange} opacity="0.8" />
              <line x1={TOWER_X - T_BASE_W / 2} y1={towerY} x2={TOWER_X + T_BASE_W / 2} y2={towerY} stroke={BT.cream} strokeWidth="1.5" opacity="0.95" />
            </g>
          </g>
        )}

        <polygon
          points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`}
          fill="none"
          stroke={BT.orange}
          strokeWidth="1.5"
          filter="url(#btGlow)"
          opacity="0.9"
        />
        <line x1={TOWER_X - T_RAIL1_W / 2} y1={TOWER_BASE_Y - T_RAIL1_D} x2={TOWER_X + T_RAIL1_W / 2} y2={TOWER_BASE_Y - T_RAIL1_D} stroke={BT.orange} strokeWidth="0.8" opacity="0.6" />
        <line x1={TOWER_X - T_RAIL2_W / 2} y1={TOWER_BASE_Y - T_RAIL2_D} x2={TOWER_X + T_RAIL2_W / 2} y2={TOWER_BASE_Y - T_RAIL2_D} stroke={BT.orange} strokeWidth="0.8" opacity="0.6" />
        <line x1={TOWER_X - T_ANT_W / 2} y1={T_TIP_Y - T_BEACON_D - 35} x2={TOWER_X + T_ANT_W / 2} y2={T_TIP_Y - T_BEACON_D - 35} stroke={BT.orange} strokeWidth="0.8" opacity="0.6" />
        <circle cx={TOWER_X} cy={T_TIP_Y - T_BEACON_D} r={T_BEACON_R} fill={BT.orange} filter="url(#btGlow)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

    </g>
  );
}
