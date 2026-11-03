import React from "react";
import type { PlanetMissions } from "../../missions";
import RwaLetters from "./RwaLetters";

const CY = "#00ffff";
const CY_DIM = "#0a8f8f";
const CY_DARK = "#063a3a";
const MG = "#ff2bd6";
const MG_DIM = "#8a1570";
const PK = "#ff6ec7";
const SKY_TOP = "#0a0014";
const SKY_BOT = "#1a0030";
const SUNSET = "#3a0028";
const GROUND = "#0a0014";
const BLDG = "#120820";
const BLDG_EDGE = "#1e1030";

type Win = 0 | 1 | 2 | 3 | 4;
type Bldg = { x: number; w: number; h: number; cols: number; rows: number; seed: number };

const BUILDINGS: Bldg[] = [
  { x: 30,  w: 52, h: 190, cols: 3, rows: 9,  seed: 1 },
  { x: 188, w: 56, h: 230, cols: 3, rows: 11, seed: 3 },
  { x: 286, w: 44, h: 150, cols: 2, rows: 7,  seed: 4 },
  { x: 762, w: 38, h: 135, cols: 2, rows: 6,  seed: 6 },
  { x: 878, w: 60, h: 245, cols: 3, rows: 12, seed: 7 },
];

function winState(b: Bldg, c: number, r: number): Win {
  const v = (b.seed * 31 + c * 17 + r * 53) % 100;
  if (v < 20) return 0;
  if (v < 50) return 4;
  if (v < 70) return 2;
  if (v < 85) return 3;
  return 1;
}

function palmTrunk(x: number, h: number, lean: number, wBase: number): string {
  const top = 480 - h;
  const tx = x + lean;
  const hb = wBase / 2;
  const ht = Math.max(0.8, wBase / 5);
  const cx = x + lean * 0.3;
  const cy = 480 - h * 0.55;
  return `M${x - hb},480 C${cx - hb},${cy} ${tx - ht},${top + h * 0.2} ${tx - ht},${top} L${tx + ht},${top} C${tx + ht},${top + h * 0.2} ${cx + hb},${cy} ${x + hb},480 Z`;
}

function palmFrond(tx: number, ty: number, deg: number, len: number, wid: number): string {
  const r = (deg * Math.PI) / 180;
  const ex = tx + Math.cos(r) * len;
  const ey = ty + Math.sin(r) * len;
  const px = -Math.sin(r);
  const py = Math.cos(r);
  const m1x = tx + Math.cos(r) * len * 0.45 + px * wid;
  const m1y = ty + Math.sin(r) * len * 0.45 + py * wid;
  const m2x = tx + Math.cos(r) * len * 0.45 - px * wid * 0.5;
  const m2y = ty + Math.sin(r) * len * 0.45 - py * wid * 0.5;
  return `M${tx},${ty} Q${m1x},${m1y} ${ex},${ey} Q${m2x},${m2y} ${tx},${ty} Z`;
}

export default function RwaPlanetBackground({
  viewBox,
  missions,
  towerActivated,
  rwaHeroMode = "normal",
  rwaStonePhase = "alive",
}: {
  viewBox: string;
  missions?: PlanetMissions;
  towerActivated?: boolean;
  rwaHeroMode?: "normal" | "side" | "stand" | "fade" | "hidden";
  rwaStonePhase?: "alive" | "red" | "gone" | "gray";
}) {
  const done =
    (missions?.bow ? 1 : 0) +
    (missions?.hat ? 1 : 0) +
    (missions?.amulet ? 1 : 0) +
    (missions?.arrows ? 1 : 0);
  const MISSION_STEPS = [0, 0.33, 0.66, 0.99, 1];
  const towerFill = MISSION_STEPS[Math.max(0, Math.min(4, done))];
  const TOWER_X = 140;
  const TOWER_H = 140 * towerFill;
  const towerY = 480 - TOWER_H;
  void towerActivated;

  return (
    <g id="rwa-planet-background" aria-hidden="true">
      <defs>
        <linearGradient id="rwaSkyGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="700">
          <stop offset="0%" stopColor={SKY_TOP} />
          <stop offset="45%" stopColor={SKY_BOT} />
          <stop offset="72%" stopColor={SUNSET} />
          <stop offset="100%" stopColor={GROUND} />
        </linearGradient>
        <linearGradient id="rwaSunGrad" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="480">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="45%" stopColor="#ff6ec7" />
          <stop offset="100%" stopColor="#ff2bd6" />
        </linearGradient>
        <clipPath id="rwaMoonClip"><circle cx="850" cy="90" r="46" /></clipPath>
        <clipPath id="rwaSunClip"><circle cx="500" cy="440" r="120" /></clipPath>
        <radialGradient id="rwaMoonGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#eaffff" />
          <stop offset="55%" stopColor={CY} />
          <stop offset="100%" stopColor={CY_DARK} />
        </radialGradient>
        <radialGradient id="rwaSourceGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor={CY} stopOpacity="0.55" />
          <stop offset="100%" stopColor={CY} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rwaSunHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={MG} stopOpacity="1" />
          <stop offset="70%" stopColor={MG} stopOpacity="0.98" />
          <stop offset="84%" stopColor={MG} stopOpacity="0.7" />
          <stop offset="93%" stopColor={MG} stopOpacity="0.28" />
          <stop offset="100%" stopColor={MG} stopOpacity="0" />
        </radialGradient>
        <filter id="rwaGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4" result="b1" />
          <feGaussianBlur stdDeviation="9" result="b2" />
          <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rwaSoft" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect x="-20000" y="-20000" width="60000" height="60000" fill="url(#rwaSkyGrad)" />
      {}
      <circle cx="500" cy="440" r="178" fill="url(#rwaSunHalo)" opacity="0.14" />
      <g opacity="0.92">
        <circle cx="500" cy="440" r="120" fill="url(#rwaSunGrad)" />
        <g clipPath="url(#rwaSunClip)" fill={SKY_TOP}>
          <rect x="380" y="418" width="240" height="4" />
          <rect x="380" y="430" width="240" height="5" />
          <rect x="380" y="444" width="240" height="6" />
          <rect x="380" y="460" width="240" height="7" />
          <rect x="380" y="478" width="240" height="9" />
        </g>
      </g>

      {}
      <g opacity={rwaStonePhase === "gray" || rwaStonePhase === "gone" ? 0 : 1} style={{ transition: "opacity .6s linear" } as any}>
        <ellipse cx="580" cy="360" rx="150" ry="220" fill="url(#rwaSourceGrad)" filter="url(#rwaSoft)" opacity="0.5">
        </ellipse>
      </g>

      {}
      <g filter="url(#rwaGlow)">
        <circle cx="850" cy="90" r="46" fill="url(#rwaMoonGrad)" opacity="0.9" />
        <circle cx="838" cy="78" r="6" fill={CY_DARK} opacity="0.5" />
        <circle cx="864" cy="100" r="4" fill={CY_DARK} opacity="0.45" />
        <circle cx="852" cy="70" r="3" fill={CY_DARK} opacity="0.4" />
        {}
        <g clipPath="url(#rwaMoonClip)" fill="#1a0030" opacity="0.85">
          <rect x="800" y="100" width="100" height="3" />
          <rect x="800" y="108" width="100" height="4" />
          <rect x="800" y="117" width="100" height="5" />
          <rect x="800" y="127" width="100" height="6" />
        </g>
      </g>

      {}
      <g fill={CY}>
        {[
          [60, 60], [140, 110], [230, 50], [320, 130], [410, 70],
          [500, 120], [640, 60], [720, 130], [780, 50], [920, 140],
          [100, 180], [260, 200], [470, 190], [690, 210], [880, 190],
        ].map(([x, y], i) => (
          <circle key={"rs" + i} cx={x} cy={y} r={0.8 + (i % 3) * 0.5} opacity={0.4 + (i % 4) * 0.12}>
          </circle>
        ))}
      </g>

      {}
      <RwaLetters phase={rwaStonePhase} />
      <g fill="#0d0018">
        {[
          { x: 340, h: 40, lean: -8, w: 5.0 },
          { x: 425, h: 30, lean: 6,  w: 4.0 },
          { x: 510, h: 45, lean: -5, w: 6.0 },
          { x: 580, h: 32, lean: 4,  w: 4.5 },
          { x: 665, h: 26, lean: -7, w: 3.5 },
        ].map((p, i) => {
          const tx = p.x + p.lean;
          const ty = 480 - p.h;
          const fronds = [
            { a: -160, l: 1.0 }, { a: -128, l: 1.15 }, { a: -98, l: 1.3 },
            { a: -68, l: 1.15 }, { a: -34, l: 1.0 }, { a: 2, l: 0.85 },
            { a: 178, l: 0.8 },
          ];
          return (
            <g key={"palm" + i}>
              <path d={palmTrunk(p.x, p.h, p.lean, p.w)} />
              {fronds.map((f, j) => (
                <path key={"fr" + j} d={palmFrond(tx, ty, f.a, p.h * 0.9 * f.l, p.h * 0.16)} />
              ))}
            </g>
          );
        })}
      </g>
      {}
      {BUILDINGS.map((b, bi) => {
        const top = 480 - b.h;
        const cellW = b.w / b.cols;
        const cellH = b.h / b.rows;
        const wins: React.ReactElement[] = [];
        for (let c = 0; c < b.cols; c++) {
          for (let r = 0; r < b.rows; r++) {
            const st = winState(b, c, r);
            if (st === 0) continue;
            const wx = b.x + c * cellW + cellW * 0.22;
            const wy = top + r * cellH + cellH * 0.22;
            const ww = cellW * 0.56;
            const wh = cellH * 0.5;
            wins.push(
              <rect key={`w${bi}-${c}-${r}`} x={wx} y={wy} width={ww} height={wh}
                fill={st === 4 ? CY : st === 1 ? CY_DIM : st === 2 ? MG : PK} opacity={st === 1 ? 0.35 : 0.9}
                filter={st === 2 || st === 4 ? "url(#rwaGlow)" : undefined} />
            );
          }
        }
        return (
          <g key={"bldg" + bi}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={BLDG} stroke={BLDG_EDGE} strokeWidth="1" />
            <line x1={b.x} y1={top} x2={b.x + b.w} y2={top} stroke={CY_DIM} strokeWidth="1" opacity="0.5" />
            {wins}
          </g>
        );
      })}

      {}
      <rect x="-20000" y="480" width="60000" height="20000" fill={GROUND} />
      <line x1="-20000" y1="480" x2="20000" y2="480" stroke={MG} strokeWidth="2" opacity="0.8" filter="url(#rwaGlow)" />
      {}
      <g strokeWidth="1" opacity="0.5">
        {[-12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12].map((i) => {
          const xb = 500 + i * 95;
          const xt = 500 + i * 95 * 0.12;
          return (
            <line key={"gv" + i} x1={xt} y1="480" x2={xb} y2="700"
              stroke={i === 0 ? MG : CY_DIM}
              filter={i === 0 ? "url(#rwaGlow)" : undefined} />
          );
        })}
        {[483, 489, 498, 512, 533, 563, 605, 662, 700].map((y, i) => (
          <line key={"gh" + i} x1="-20000" y1={y} x2="20000" y2={y}
            stroke={i % 2 ? MG : CY}
            opacity={0.3 + i * 0.07}
            filter={i % 2 ? "url(#rwaGlow)" : undefined} />
        ))}
      </g>

            {}
      {}
      <g
        className="rf-laser-cyber"
        style={{ opacity: rwaHeroMode === "fade" || rwaHeroMode === "hidden" ? 0 : 1, transition: "opacity 2.25s linear", color: "var(--cyber-fill, #00ffff)" } as any}
      >
        {towerFill > 0 && (
          <g>
            <defs>
              <clipPath id="rwaTowerClip">
                <polygon points={`${TOWER_X - 30},480 ${TOWER_X - 10},340 ${TOWER_X + 10},340 ${TOWER_X + 30},480`} />
              </clipPath>
            </defs>
            <g clipPath="url(#rwaTowerClip)">
              <rect x={TOWER_X - 30} y={towerY} width="60" height={TOWER_H} fill="currentColor" opacity="0.8" />
              <line x1={TOWER_X - 30} y1={towerY} x2={TOWER_X + 30} y2={towerY} stroke="currentColor" strokeWidth="1.5" opacity="0.95" />
            </g>
          </g>
        )}
        <g opacity="0.9">
          <polygon points={`${TOWER_X - 30},480 ${TOWER_X - 10},340 ${TOWER_X + 10},340 ${TOWER_X + 30},480`} fill="none" stroke="currentColor" strokeWidth="1.5" filter="url(#rwaGlow)" />
          <line x1={TOWER_X - 12} y1="300" x2={TOWER_X + 12} y2="300" stroke={CY_DIM} strokeWidth="0.8" opacity="0.6" />
          <line x1={TOWER_X - 15} y1="350" x2={TOWER_X + 15} y2="350" stroke={CY_DIM} strokeWidth="0.8" opacity="0.6" />
          <line x1={TOWER_X - 18} y1="400" x2={TOWER_X + 18} y2="400" stroke={CY_DIM} strokeWidth="0.8" opacity="0.6" />
          <circle cx={TOWER_X} cy="335" r="4" fill="currentColor" filter="url(#rwaGlow)">
          </circle>
        </g>
      </g>
    </g>
  );
}
