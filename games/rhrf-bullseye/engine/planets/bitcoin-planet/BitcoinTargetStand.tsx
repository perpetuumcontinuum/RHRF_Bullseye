import React from "react";

const CX = 420;
const TOP = 441;
const BOTTOM = 480;

const BOX_COUNT: number = 2;
const BOX_W = 74;
const BOX_H = 18;
const GAP = 2.5;

const CARD = "#f6f1e7";
const CARD_DARK = "#d7cec2";
const EDGE = "#9b8f80";
const RED = "#d61f1f";

export default function BitcoinTargetStand() {
  const halfW = BOX_W / 2;
  const totalH = BOX_COUNT * BOX_H + (BOX_COUNT - 1) * GAP;
  const startY = BOTTOM - totalH;
  const boxes: React.ReactElement[] = [];

  for (let i = 0; i < BOX_COUNT; i++) {
    const y = startY + i * (BOX_H + GAP);
    const x = CX - halfW;
    const cy = y + BOX_H / 2;

    boxes.push(
      <g key={"btc-pizza-box-" + i}>
        <rect
          x={x}
          y={y}
          width={BOX_W}
          height={BOX_H}
          rx="1.2"
          ry="1.2"
          fill={CARD}
          stroke={EDGE}
          strokeWidth="0.9"
        />
        <rect
          x={x + 1}
          y={y + 1}
          width={BOX_W - 2}
          height={BOX_H - 2}
          rx="1"
          ry="1"
          fill="none"
          stroke={CARD_DARK}
          strokeWidth="0.7"
          opacity="0.75"
        />
        <line
          x1={x + 3}
          y1={y + 3.2}
          x2={x + BOX_W - 3}
          y2={y + 3.2}
          stroke={CARD_DARK}
          strokeWidth="0.8"
          opacity="0.85"
        />
        <line
          x1={x + 3}
          y1={y + BOX_H - 3.2}
          x2={x + BOX_W - 3}
          y2={y + BOX_H - 3.2}
          stroke={EDGE}
          strokeWidth="0.7"
          opacity="0.55"
        />
        <text
          x={CX}
          y={cy + 3.1}
          textAnchor="middle"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontSize="8.2"
          fontWeight="900"
          letterSpacing="0.6"
          fill={RED}
          stroke="#5d0d0d"
          strokeWidth="0.25"
          paintOrder="stroke fill markers"
        >
          PIZZA
        </text>
      </g>,
    );
  }

  return <g pointerEvents="none">{boxes}</g>;
}
