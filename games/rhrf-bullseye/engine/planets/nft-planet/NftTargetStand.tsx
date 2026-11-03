import React from "react";

const CX = 580;
const LEDGE_Y = 441;
const GROUND_Y = 480;

const EPIC = "#aa00ff";
const RARE = "#ccff00";
const DIM = "#5a0080";

export default function NftTargetStand() {
  const halfLedge = 34;
  const footSpread = 30;
  const postTop = LEDGE_Y - 6;
  const kneeY = LEDGE_Y + 14;

  return (
    <g pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {}
      <line x1={CX} y1={postTop} x2={CX} y2={GROUND_Y} stroke={EPIC} strokeWidth="1.6" opacity="0.9" />

      {}
      <line x1={CX - halfLedge} y1={LEDGE_Y} x2={CX + halfLedge} y2={LEDGE_Y} stroke={RARE} strokeWidth="1.8" opacity="0.95" />
      <line x1={CX - halfLedge} y1={LEDGE_Y + 2.5} x2={CX + halfLedge} y2={LEDGE_Y + 2.5} stroke={DIM} strokeWidth="1" opacity="0.7" />

      {}
      <line x1={CX} y1={postTop} x2={CX} y2={postTop - 5} stroke={RARE} strokeWidth="1.4" opacity="0.85" />
      <circle cx={CX} cy={postTop - 6} r="1.6" fill={RARE} stroke="none" opacity="0.9" />

      {}
      <line x1={CX} y1={kneeY} x2={CX - footSpread} y2={GROUND_Y} stroke={EPIC} strokeWidth="1.6" opacity="0.9" />
      <line x1={CX} y1={kneeY} x2={CX + footSpread} y2={GROUND_Y} stroke={EPIC} strokeWidth="1.6" opacity="0.9" />

      {}
      <line x1={CX} y1={kneeY} x2={CX + 16} y2={GROUND_Y - 2} stroke={DIM} strokeWidth="1.3" opacity="0.75" />

      {}
      <line x1={CX - footSpread + 6} y1={GROUND_Y - 6} x2={CX + footSpread - 6} y2={GROUND_Y - 6} stroke={DIM} strokeWidth="1" opacity="0.6" />
    </g>
  );
}
