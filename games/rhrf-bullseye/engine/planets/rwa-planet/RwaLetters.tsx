import React from "react";

type Phase = "alive" | "red" | "gone" | "gray";

/**
 * Три буквы RWA у подножия чёрного камня.
 * Рендерятся ВНУТРИ фона, до пальм: пальмы и герой перекрывают их,
 * камень перекрывает пока цел, после gone/gray — светятся.
 */
export default function RwaLetters({ phase = "alive" }: { phase?: Phase }) {
  const broken = phase === "gone" || phase === "gray";
  const size = 52;

  return (
    <g
      className="friend-cyber rf-metal"
      transform="translate(580, 480)"
      pointerEvents="none"
      opacity={broken ? 1 : 0.9}
    >
      <text
        x="0"
        y="0"
        textAnchor="middle"
        fontFamily="'Courier New', Courier, monospace"
        fontSize={size}
        fontWeight="900"
        letterSpacing="6"
        fill="var(--cyber-fill, #b7c0ca)"
        stroke="#0a0014"
        strokeWidth="3"
        paintOrder="stroke"
        style={broken ? { filter: "drop-shadow(0 0 6px var(--cyber-fill, #b7c0ca))" } as any : undefined}
      >
        RWA
      </text>
    </g>
  );
}
