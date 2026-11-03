import React from "react";

const CX = 420;
const TOP = 441;
const BOTTOM = 480;

const COIN_COUNT: number = 4;
const COIN_W = 56;
const COIN_H = 9;
const COIN_R = 2;

const LIME = "#C7E36C";
const OLIVE = "#314012";
const LIGHT = "#EAF7C8";

export default function TargetStand() {
  const halfW = COIN_W / 2;
  const halfH = COIN_H / 2;
  const travel = BOTTOM - TOP - COIN_H;

  const coins: React.ReactElement[] = [];

  for (let i = 0; i < COIN_COUNT; i++) {
    const t = COIN_COUNT === 1 ? 0 : i / (COIN_COUNT - 1);
    const cy = TOP + halfH + travel * t;
    const x = CX - halfW;
    const y = cy - halfH;

    coins.push(
      <g key={"coin-edge-" + i}>
        <rect
          x={x}
          y={y}
          width={COIN_W}
          height={COIN_H}
          rx={COIN_R}
          ry={COIN_R}
          fill="url(#scStackGrad)"
          stroke={OLIVE}
          strokeWidth="1"
        />
        <line
          x1={x + 3}
          y1={y + 1.25}
          x2={x + COIN_W - 3}
          y2={y + 1.25}
          stroke={LIGHT}
          strokeWidth="1"
          opacity="0.55"
        />
        <line
          x1={x + 3}
          y1={y + COIN_H - 1.25}
          x2={x + COIN_W - 3}
          y2={y + COIN_H - 1.25}
          stroke={OLIVE}
          strokeWidth="1"
          opacity="0.72"
        />
        <line
          x1={x + 0.75}
          y1={y + 2}
          x2={x + 0.75}
          y2={y + COIN_H - 2}
          stroke={LIME}
          strokeWidth="0.8"
          opacity="0.35"
        />
        <line
          x1={x + COIN_W - 0.75}
          y1={y + 2}
          x2={x + COIN_W - 0.75}
          y2={y + COIN_H - 2}
          stroke={OLIVE}
          strokeWidth="0.8"
          opacity="0.55"
        />
        {Array.from({ length: 11 }, (_, j) => {
          const vx = x + 4 + (j * (COIN_W - 8)) / 10;
          return (
            <line
              key={"reed-" + i + "-" + j}
              x1={vx}
              y1={y + 1.5}
              x2={vx}
              y2={y + COIN_H - 1.5}
              stroke={OLIVE}
              strokeWidth="0.7"
              opacity="0.5"
            />
          );
        })}
      </g>,
    );
  }

  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="scStackGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LIME} />
          <stop offset="55%" stopColor="#8fa84d" />
          <stop offset="100%" stopColor={OLIVE} />
        </linearGradient>
      </defs>
      {coins}
    </g>
  );
}
