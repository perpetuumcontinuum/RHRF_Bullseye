import React, { useEffect, useRef, useState } from "react";
import type { ArcVb } from "../ArcStage";

const GRASS = "#B9D984";
const GRASS_DARK = "#8FBF63";
const ROCK = "#ED927E";
const FAR = "#B3A0D8";
const HILL_FAR = "#C9B6E4";
const HILL_MID = "#AB92D4";
const INK = "#000000";
const CYBER = "var(--cyber-fill, #aa00ff)";

export const FINAL_HORIZON_FRAC = 0.55;

const FAR_Y_FRAC = 0.555;
const FAR_AMP_FRAC = 0.085;
const FAR_STEP = 96;
const FAR_SEED = 1.7;

function FinalBlackStone({ vb, still }: { vb: ArcVb; still: boolean }) {
  const x = vb.x + vb.w * 0.17;
  const topY = vb.y - vb.h * 0.05;
  const waterY = vb.y + vb.h * 0.62;
  const deepY = waterY + vb.h * 0.025 - 15;
  const s = Math.max(7, vb.w * 0.0145);
  const sinkDy = (deepY - waterY) + s * 2.2;

  const fallRef = useRef<any>(null);
  const startedRef = useRef(false);

  const start = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      fallRef.current?.beginElement?.();
    } catch {}
  };

  useEffect(() => {
    if (still) return;
    const onDrop = () => start();
    window.addEventListener("rhrf:stone-drop", onDrop);
    return () => window.removeEventListener("rhrf:stone-drop", onDrop);
  }, [still]);

  const points = [
    `${(-s).toFixed(2)},${(-s * 0.2).toFixed(2)}`,
    `${(-s * 0.45).toFixed(2)},${(-s).toFixed(2)}`,
    `${(s * 0.35).toFixed(2)},${(-s * 0.9).toFixed(2)}`,
    `${s.toFixed(2)},${(-s * 0.1).toFixed(2)}`,
    `${(s * 0.55).toFixed(2)},${(s * 0.75).toFixed(2)}`,
    `${(-s * 0.3).toFixed(2)},${(s * 0.85).toFixed(2)}`,
  ].join(" ");

  if (still) {
    return (
      <g transform={`translate(${x.toFixed(2)}, ${deepY.toFixed(2)}) scale(0.8)`} opacity="0.18" pointerEvents="none">
        <polygon points={points} fill="#050008" stroke="#00ffff" strokeWidth="1" strokeLinejoin="round" />
      </g>
    );
  }

  const drops = [
    { dx: -s * 2.0, dy: -s * 1.35, r: 2.0, delay: 0.00 },
    { dx: -s * 0.75, dy: -s * 1.95, r: 1.7, delay: 0.05 },
    { dx: s * 0.45, dy: -s * 2.15, r: 2.2, delay: 0.08 },
    { dx: s * 1.85, dy: -s * 1.45, r: 1.8, delay: 0.12 },
    { dx: s * 2.55, dy: -s * 0.55, r: 1.5, delay: 0.16 },
    { dx: -s * 2.75, dy: -s * 0.35, r: 1.4, delay: 0.20 },
  ];

  const fallBegin = "rfStoneFall.begin";
  const impactBegin = `${fallBegin}+3.2s`;
  const splash2Begin = `${fallBegin}+3.32s`;
  const silhouetteBegin = `${fallBegin}+4.5s`;

  return (
    <g pointerEvents="none" style={{ filter: "drop-shadow(0 0 6px rgba(0,255,255,0.42)) drop-shadow(0 0 10px rgba(255,0,255,0.20))" }}>
      <defs>
        <clipPath id="rfStoneWaterClip">
          <rect x={(vb.x - vb.w).toFixed(1)} y={(vb.y - vb.h).toFixed(1)} width={(vb.w * 3).toFixed(1)} height={(waterY - (vb.y - vb.h)).toFixed(1)} />
        </clipPath>
      </defs>

      <g clipPath="url(#rfStoneWaterClip)">
        <g transform={`translate(${x.toFixed(2)}, ${topY.toFixed(2)})`}>
          <animateTransform
            ref={fallRef}
            id="rfStoneFall"
            attributeName="transform"
            type="translate"
            from={`${x.toFixed(2)} ${topY.toFixed(2)}`}
            to={`${x.toFixed(2)} ${waterY.toFixed(2)}`}
            begin="indefinite"
            dur="3.2s"
            fill="freeze"
            calcMode="spline"
            keyTimes="0;1"
            keySplines=".20 .08 .16 1"
          />
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to={`0 ${sinkDy.toFixed(2)}`}
              begin={impactBegin}
              dur="1.3s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines=".4 0 .2 1"
            />
            <g>
              <animateTransform
                attributeName="transform"
                type="scale"
                from="1"
                to="0.7"
                begin={impactBegin}
                dur="1.3s"
                fill="freeze"
                calcMode="spline"
                keyTimes="0;1"
                keySplines=".4 0 .2 1"
              />
              <polygon points={points} fill="#050008" stroke="#00ffff" strokeWidth="1.4" strokeLinejoin="round" opacity="0.96">
                <animate attributeName="opacity" values="0.96;0.5" begin={impactBegin} dur="1.3s" fill="freeze" />
              </polygon>
              <path
                d={`M${(-s * 0.25).toFixed(2)},${(-s * 0.45).toFixed(2)} L${(s * 0.18).toFixed(2)},${(-s * 0.18).toFixed(2)} L${(s * 0.02).toFixed(2)},${(s * 0.35).toFixed(2)}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.26"
              />
            </g>
          </g>
        </g>
      </g>

      <g transform={`translate(${x.toFixed(2)}, ${waterY.toFixed(2)})`}>
        <ellipse rx={(s * 0.75).toFixed(2)} ry={(s * 0.22).toFixed(2)} fill="none" stroke="#00ffff" strokeWidth="1.2" opacity="0">
          <animate attributeName="opacity" values="0;0.72;0" begin={impactBegin} dur="1.2s" fill="freeze" />
          <animate attributeName="rx" values={`${(s * 0.75).toFixed(2)};${(s * 3.4).toFixed(2)}`} begin={impactBegin} dur="1.2s" fill="freeze" />
          <animate attributeName="ry" values={`${(s * 0.22).toFixed(2)};${(s * 1.05).toFixed(2)}`} begin={impactBegin} dur="1.2s" fill="freeze" />
        </ellipse>

        <ellipse rx={(s * 0.55).toFixed(2)} ry={(s * 0.18).toFixed(2)} fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0">
          <animate attributeName="opacity" values="0;0.58;0" begin={splash2Begin} dur="1.0s" fill="freeze" />
          <animate attributeName="rx" values={`${(s * 0.55).toFixed(2)};${(s * 2.55).toFixed(2)}`} begin={splash2Begin} dur="1.0s" fill="freeze" />
          <animate attributeName="ry" values={`${(s * 0.18).toFixed(2)};${(s * 0.78).toFixed(2)}`} begin={splash2Begin} dur="1.0s" fill="freeze" />
        </ellipse>

        {drops.map((d, i) => {
          const b = `${fallBegin}+${(3.2 + d.delay).toFixed(2)}s`;
          return (
            <circle key={"bs-" + i} cx="0" cy="0" r={d.r.toFixed(2)} fill="#ccffff" opacity="0">
              <animate attributeName="opacity" values="0;0.95;0" begin={b} dur="0.9s" fill="freeze" />
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to={`${d.dx.toFixed(2)} ${(d.dy + s * 0.9).toFixed(2)}`}
                begin={b}
                dur="0.9s"
                fill="freeze"
                calcMode="spline"
                keyTimes="0;1"
                keySplines=".2 .08 .4 1"
              />
            </circle>
          );
        })}
      </g>

      <g transform={`translate(${x.toFixed(2)}, ${deepY.toFixed(2)}) scale(0.8)`} opacity="0">
        <animate attributeName="opacity" values="0;0.18" begin={silhouetteBegin} dur="0.9s" fill="freeze" />
        <polygon points={points} fill="#050008" stroke="#00ffff" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  );
}

export function purpleHorizonY(vb: ArcVb, xFrac: number): number {
  const x = Math.max(0, Math.min(1, xFrac));
  const n = Math.max(4, Math.ceil(vb.w / FAR_STEP));
  const i = x * n;
  const w = Math.sin(i * 0.9 + FAR_SEED) * 0.6 + Math.sin(i * 0.37 + FAR_SEED * 2.1) * 0.4;
  return vb.y + (FAR_Y_FRAC - Math.abs(w) * FAR_AMP_FRAC) * vb.h;
}

function purpleHorizonYFrac(vb: ArcVb, xFrac: number): number {
  return (purpleHorizonY(vb, xFrac) - vb.y) / vb.h;
}

export function purpleRidgePoints(vb: ArcVb): [number, number][] {
  const y0 = vb.y + vb.h * FAR_Y_FRAC;
  const n = Math.max(4, Math.ceil(vb.w / FAR_STEP));
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = vb.x + (i / n) * vb.w;
    const w = Math.sin(i * 0.9 + FAR_SEED) * 0.6 + Math.sin(i * 0.37 + FAR_SEED * 2.1) * 0.4;
    pts.push([x, y0 - Math.abs(w) * FAR_AMP_FRAC * vb.h]);
  }
  return pts;
}

const ROAD = { p0: [-0.12, 1.08], p1: [0.26, 0.76], p2: [0.77, 0.55] } as const;

export function ARC_HORIZON_Y(vb: ArcVb): number {
  return purpleHorizonY(vb, ROAD.p2[0]);
}

function ridge(vb: ArcVb, yFrac: number, amp: number, step: number, seed: number): string {
  const y0 = vb.y + vb.h * yFrac;
  const n = Math.max(4, Math.ceil(vb.w / step));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = vb.x + (i / n) * vb.w;
    const w = Math.sin(i * 0.9 + seed) * 0.6 + Math.sin(i * 0.37 + seed * 2.1) * 0.4;
    pts.push(x.toFixed(1) + "," + (y0 - Math.abs(w) * amp * vb.h).toFixed(1));
  }
  pts.push((vb.x + vb.w).toFixed(1) + "," + (vb.y + vb.h).toFixed(1));
  pts.push(vb.x.toFixed(1) + "," + (vb.y + vb.h).toFixed(1));
  return pts.join(" ");
}

function roadPoint(t: number, vb: ArcVb) {
  const u = 1 - t;
  const p2y = purpleHorizonYFrac(vb, ROAD.p2[0]);
  return {
    x: vb.x + (u * u * ROAD.p0[0] + 2 * u * t * ROAD.p1[0] + t * t * ROAD.p2[0]) * vb.w,
    y: vb.y + (u * u * ROAD.p0[1] + 2 * u * t * ROAD.p1[1] + t * t * p2y) * vb.h,
  };
}

function roadRibbon(vb: ArcVb) {
  const N = 54;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = roadPoint(t, vb);
    const dx = (2 * (1 - t) * (ROAD.p1[0] - ROAD.p0[0]) + 2 * t * (ROAD.p2[0] - ROAD.p1[0])) * vb.w;
    const dy = (2 * (1 - t) * (ROAD.p1[1] - ROAD.p0[1]) + 2 * t * (ROAD.p2[1] - ROAD.p1[1])) * vb.h;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = vb.w * 0.22 * (1 - t);
    const hw = w / 2;
    left.push((p.x + nx * hw).toFixed(1) + "," + (p.y + ny * hw).toFixed(1));
    right.push((p.x - nx * hw).toFixed(1) + "," + (p.y - ny * hw).toFixed(1));
  }
  return {
    poly: [...left, ...[...right].reverse()].join(" "),
    leftEdge: left.join(" "),
    rightEdge: right.join(" "),
  };
}

export function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch { return; }
    if (!mq) return;
    const on = () => setRm(Boolean(mq.matches));
    on();
    mq.addEventListener("change", on);
    return () => { mq!.removeEventListener("change", on); };
  }, []);
  return rm;
}

export function Crystal({ x, y, sc, delay, still }: { x: number; y: number; sc: number; delay: number; still: boolean }) {
  const faces = [
    "M-30-4l-9-26 6-21 17 13L-9-8z",
    "M-14 2l-4-65L-2-94l19 22 3 61L3 8z",
    "M17-4l6-35 17-15 7 24-17 31z",
  ];
  const ditherFace = "M-2-94l4 32 1 70 17-19-3-61z";
  const ribs = ["M-33-49l8 22 16 19", "M-18-63L2-62l15-10", "M40-54l-6 24-4 31"];
  return (
    <g className="rf-cyber-root" style={{ animationDelay: delay + "s" }}
       transform={`translate(${x.toFixed(1)}, ${(y - 8 * sc).toFixed(1)}) scale(${sc})`}>
      <g stroke={INK} strokeWidth={2 / sc} strokeLinejoin="miter" shapeRendering="crispEdges">
        {faces.map((d, i) => <path key={"cf-" + i} d={d} fill={CYBER} />)}
        <path d={ditherFace} fill={CYBER} />
        <path d={ditherFace} fill="url(#rfDitherPts)" />
        {ribs.map((d, i) => <path key={"cr-" + i} d={d} fill="none" />)}
      </g>
    </g>
  );
}

export function Tree({ x, y, sc, delay, still }: { x: number; y: number; sc: number; delay: number; still: boolean }) {
  const trunk = "M-5-15h10v20H-5z";
  const canopy = "M-28-19v-16h-8v-24h8v-16h16v-8h24v8h16v16h8v24h-8v16z";
  const canopyDither = "M-27-23h16v-8h8v-8h8v-8h24v12h-8v12H5v8h-24z";
  const branches = "M-18-62h8v-8h10M9-65h10v10M-26-47h8";
  return (
    <g className="rf-cyber-root" style={{ animationDelay: delay + "s" }}
       transform={`translate(${x.toFixed(1)}, ${(y - 5 * sc).toFixed(1)}) scale(${sc})`}>
      <g stroke={INK} strokeWidth={2 / sc} strokeLinejoin="miter" shapeRendering="crispEdges">
        <path d={trunk} fill={ROCK} />
        <path d={trunk} fill="url(#rfDitherPts)" />
        <path d={canopy} fill={CYBER} />
        <path d={canopyDither} fill="url(#rfDitherDense)" />
        <path d={branches} fill="none" strokeWidth={3 / sc} />
      </g>
    </g>
  );
}

function grassTicks(vb: ArcVb) {
  const out: React.ReactNode[] = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    const fx = 0.03 + 0.94 * ((i * 0.6180339887) % 1);
    const fy = 0.74 + 0.22 * ((i * 0.7548776662) % 1);
    const x = vb.x + fx * vb.w, y = vb.y + fy * vb.h;
    const k = i % 3;
    if (k === 0) out.push(<line key={"gt-" + i} x1={(x - 3).toFixed(1)} y1={y.toFixed(1)} x2={(x + 3).toFixed(1)} y2={y.toFixed(1)} stroke={INK} strokeWidth="1.5" />);
    else if (k === 1) out.push(<g key={"gt-" + i}><line x1={(x - 2.5).toFixed(1)} y1={(y - 2.5).toFixed(1)} x2={(x + 2.5).toFixed(1)} y2={(y + 2.5).toFixed(1)} stroke={INK} strokeWidth="1.5" /><line x1={(x + 2.5).toFixed(1)} y1={(y - 2.5).toFixed(1)} x2={(x - 2.5).toFixed(1)} y2={(y + 2.5).toFixed(1)} stroke={INK} strokeWidth="1.5" /></g>);
    else out.push(<line key={"gt-" + i} x1={x.toFixed(1)} y1={(y - 3).toFixed(1)} x2={x.toFixed(1)} y2={(y + 3).toFixed(1)} stroke={INK} strokeWidth="1.5" />);
  }
  return out;
}

function shoreTicks(vb: ArcVb, yFrac: number, amp: number, step: number, seed: number) {
  const out: React.ReactNode[] = [];
  const n = Math.max(4, Math.ceil(vb.w / step));
  for (let i = 1; i < n; i += 2) {
    const x = vb.x + (i / n) * vb.w;
    const w = Math.sin(i * 0.9 + seed) * 0.6 + Math.sin(i * 0.37 + seed * 2.1) * 0.4;
    const top = vb.y + vb.h * yFrac - Math.abs(w) * amp * vb.h;
    out.push(<line key={"st-" + i} x1={x.toFixed(1)} y1={top.toFixed(1)} x2={x.toFixed(1)} y2={(top + vb.h * 0.05).toFixed(1)} stroke={INK} strokeWidth="1.5" opacity="0.8" />);
  }
  return out;
}

export const TREES: [number, number, number, number][] = [

  [0.07, 0.74, 1.05, 0.0], [0.90, 0.74, 1.25, -1.4], [0.70, 0.66, 0.72, -2.6],
  [0.27, 0.67, 1.45, -0.7], [0.52, 0.72, 0.85, -2.0],
];
export const CRYSTALS: [number, number, number, number][] = [

  [0.86, 0.60, 0.48, 0.0], [0.031, 0.602, 0.62, -1.3], [0.63, 0.79, 1.30, -2.2],
  [0.78, 0.88, 0.55, -0.6], [0.44, 0.965, 1.42, -1.8],
];

export default function ArcFinalBackground({ vb }: { vb: ArcVb }) {
  const skyBottom = vb.y + vb.h * (FAR_Y_FRAC + 0.012);
  const rb = roadRibbon(vb);
  const still = useReducedMotion();

  const pond = { cx: 0.17, cy: 0.62, rx: 0.075, ry: 0.028 };
  const pcx = vb.x + pond.cx * vb.w, pcy = vb.y + pond.cy * vb.h;
  const prx = pond.rx * vb.w, pry = pond.ry * vb.h;
  const waves: [number, number, number][] = [
    [-0.55, -0.15, 0.30], [-0.10, 0.10, 0.42], [0.35, -0.20, 0.26],
    [-0.30, 0.30, 0.22], [0.15, 0.34, 0.30], [0.55, 0.12, 0.18],
  ];

  const trees = TREES;
  const crystals = CRYSTALS;

  return (
    <g aria-hidden="true" className="rf-cyber-root" shapeRendering="geometricPrecision">
      <defs>
        {}
        <linearGradient id="finalSkyDepth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="finalSheen" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {}
        <pattern id="rfDitherPts" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill={INK} />
          <rect x="2" y="2" width="1" height="1" fill={INK} />
        </pattern>
        <pattern id="rfDitherDense" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0h2v2H0zM2 2h2v2H2z" fill={INK} />
        </pattern>
      </defs>

      {}
      <rect x={vb.x} y={vb.y} width={vb.w} height={skyBottom - vb.y} fill="var(--cyber-fill, #aa00ff)" />
      <rect x={vb.x} y={vb.y} width={vb.w} height={skyBottom - vb.y} fill="url(#finalSkyDepth)" />
      <rect x={vb.x - vb.w} y={vb.y} width={vb.w * 3} height={skyBottom - vb.y} fill="url(#finalSheen)" opacity="0.9">
        {!still && <animate attributeName="x" from={vb.x - vb.w} to={vb.x + vb.w} dur="13s" repeatCount="indefinite" />}
      </rect>

      {}
      <polygon points={ridge(vb, 0.500, 0.055, 150, 2.9)} fill={HILL_FAR} stroke={INK} strokeWidth="1.5" opacity="0.7" />
      <polygon points={ridge(vb, 0.525, 0.045, 120, 5.6)} fill={HILL_MID} stroke={INK} strokeWidth="1.5" opacity="0.85" />

      {}
      <polygon points={ridge(vb, FAR_Y_FRAC, FAR_AMP_FRAC, FAR_STEP, FAR_SEED)} fill={FAR} stroke={INK} strokeWidth="2" />

      {}
      <polygon points={ridge(vb, FINAL_HORIZON_FRAC + 0.055, 0.06, 128, 4.3)} fill={ROCK} stroke={INK} strokeWidth="2" />
      {shoreTicks(vb, FINAL_HORIZON_FRAC + 0.055, 0.06, 128, 4.3)}

      {}
      <polygon points={ridge(vb, FINAL_HORIZON_FRAC + 0.13, 0.035, 160, 8.1)} fill={GRASS} stroke={INK} strokeWidth="2.5" />
      <rect x={vb.x} y={vb.y + vb.h * 0.86} width={vb.w} height={vb.h * 0.14} fill={GRASS_DARK} />
      {grassTicks(vb)}

      {}
      <g>
        <ellipse cx={pcx} cy={pcy} rx={prx + 3} ry={pry + 3} fill={ROCK} stroke={INK} strokeWidth="2" />
        <ellipse cx={pcx} cy={pcy} rx={prx} ry={pry} fill={CYBER} stroke={INK} strokeWidth="2" className="rf-cyber-root" />
        <ellipse cx={pcx} cy={pcy} rx={prx} ry={pry} fill="url(#rfDitherPts)" opacity="0.5" />
        <g clipPath="url(#rfPondClip)">
          <g>
            {!still && <animateTransform attributeName="transform" type="translate" values="0 0; 7 0; 0 0" dur="6s" repeatCount="indefinite" />}
            {waves.map(([fx, fy, fl], i) => (
              <line key={"pw-" + i}
                x1={(pcx + fx * prx).toFixed(1)} y1={(pcy + fy * pry).toFixed(1)}
                x2={(pcx + fx * prx + fl * prx).toFixed(1)} y2={(pcy + fy * pry).toFixed(1)}
                stroke="#ffffff" strokeWidth="2" opacity="0.85" />
            ))}
          </g>
        </g>
        <clipPath id="rfPondClip"><ellipse cx={pcx} cy={pcy} rx={prx} ry={pry} /></clipPath>
      </g>

      {}
      <polygon points={rb.poly} fill={CYBER} stroke={INK} strokeWidth="2.5" className="rf-cyber-root" />
      <polygon points={rb.poly} fill="url(#rfDitherPts)" opacity="0.85" />
      <polyline points={rb.leftEdge} fill="none" stroke={INK} strokeWidth="2" />
      <polyline points={rb.rightEdge} fill="none" stroke={INK} strokeWidth="2" />
      <FinalBlackStone vb={vb} still={still} />

      {}
      {trees.map(([fx, fy, sc, delay], i) => (
        <Tree key={"tr-" + i} x={vb.x + fx * vb.w} y={vb.y + fy * vb.h} sc={sc} delay={delay} still={still} />
      ))}

      {}
      {crystals.map(([fx, fy, sc, delay], i) => (
        <Crystal key={"cr-" + i} x={vb.x + fx * vb.w} y={vb.y + fy * vb.h} sc={sc} delay={delay} still={still} />
      ))}

    </g>
  );
}
