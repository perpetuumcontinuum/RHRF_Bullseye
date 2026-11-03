import React from "react";

export default function EtherLogo({
  x = 0,
  y = 0,
  width = 132,
}: {
  x?: number;
  y?: number;
  width?: number;
}) {
  const s = width / 256;

  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} shapeRendering="crispEdges" pointerEvents="none">
      <polygon fill="#111111" points="127.9 0 0.3 212.3 127.9 154.1" />
      <polygon fill="#4a4a4a" points="127.9 0 255.4 212.3 127.9 154.1" />
      <polygon fill="#2a2a2a" points="0.3 231 127.9 404.4 127.9 312.2" />
      <polygon fill="#5f5f5f" points="255.3 231 127.9 404.4 127.9 312.2" />
      <polygon fill="#000000" points="127.9 287.8 255.4 212.3 127.9 154.1" />
      <polygon fill="#3a3a3a" points="0.3 212.3 127.9 287.8 127.9 154.1" />
    </g>
  );
}
