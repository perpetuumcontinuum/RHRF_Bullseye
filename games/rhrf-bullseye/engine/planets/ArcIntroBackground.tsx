import React from "react";
import type { ArcVb } from "../ArcStage";

export default function ArcIntroBackground({ vb }: { vb: ArcVb }) {
  return (
    <g aria-hidden="true">
      <defs>
        <radialGradient id="arcPortholeIntro" cx="50%" cy="50%" r="46%">
          <stop offset="0%" stopColor="#2c2c40" />
          <stop offset="55%" stopColor="#15151f" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#arcPortholeIntro)" />
    </g>
  );
}
