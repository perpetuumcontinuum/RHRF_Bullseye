import React from "react";

type Btn = { label: string; canBack?: boolean };

type Props = {
  bx: number;
  by: number;
  bw: number;
  tailPath: string;
  ns: string;
  accent?: string;
  speakerName?: string;
  page: string[];
  btnY: number;
  btnTextY: number;
  backLabel: string;
  nextLabel: string;
  skipLabel: string;
  canBack: boolean;
  nameAnimate?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
};

const MONO = "'Courier New', Courier, monospace";

export default function SpeechBubble(p: Props) {
  const backW = Math.max(80, p.backLabel.length * 8.2 + 30);
  const nextW = Math.max(80, p.nextLabel.length * 8.2 + 30);
  const skipW = Math.max(80, p.skipLabel.length * 8.2 + 30);
  const skipX = p.bx + p.bw - skipW - 24;
  const nextX = Math.max(p.bx + 24 + backW + 20, skipX - nextW - 20);
  const backX = p.bx + 24;

  const btn = (cls: string, label: string, x: number, w: number, extra?: React.CSSProperties, onClick?: () => void) => (
    <g
      className={cls}
      role="button"
      aria-label={label}
      style={{ pointerEvents: "auto", cursor: "pointer", ...extra }}
      onPointerDown={(e: React.PointerEvent<SVGGElement>) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <rect x={x} y={p.btnY} width={w} height="32" fill="#111" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
      <text x={x + w / 2} y={p.btnTextY} textAnchor="middle" fill="#fff" fontFamily={MONO} fontSize="14" fontWeight="900">{label}</text>
    </g>
  );

  return (
    <g className="rf-speech-layer">
      <path d={p.tailPath} fill="#000" stroke="#fff" strokeWidth="3" strokeLinejoin="round" shapeRendering="auto" />

      {p.speakerName && (
        <text x={p.bx + 18} y={p.by + 30} fill={p.accent || "#fff"} fontFamily={MONO} fontSize="14" fontWeight="900">
          {p.nameAnimate && (
            <animate attributeName="fill" values="#00ffff;#ff2bd6;#ccff00;#aa00ff;#00ffff" dur="2.2s" repeatCount="indefinite" />
          )}
          {p.speakerName}
        </text>
      )}

      {p.page.map((s, i) => (
        <text key={"sb-" + i} x={p.bx + 18} y={p.by + 52 + i * 22} fill="#fff" fontFamily={MONO} fontSize="16">{s}</text>
      ))}

      {btn(`rf-${p.ns}-back`, p.backLabel, backX, backW, { pointerEvents: p.canBack ? "auto" : "none", cursor: p.canBack ? "pointer" : "default", opacity: p.canBack ? 1 : 0.35 }, p.canBack ? p.onBack : undefined)}
      {btn(`rf-${p.ns}-next`, p.nextLabel, nextX, nextW, undefined, p.onNext)}
      {btn(`rf-${p.ns}-skip`, p.skipLabel, skipX, skipW, undefined, p.onSkip)}
    </g>
  );
}
