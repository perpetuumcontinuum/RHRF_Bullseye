import React, { useEffect, useRef, useState } from "react";
import type { ArcVb } from "./ArcStage";
import { useReducedMotion, ARC_HORIZON_Y } from "./planets/ArcFinalBackground";

const FW_INTERVAL = 5000;
const FW_RISE = 1.15;
const FW_PARTS = 14;
const FW_SP_MIN = 55, FW_SP_MAX = 100;

type Part = { dx: number; dy: number; fall: number; rot: number; size: number; delay: number };
type Shell = { sx: number; sy: number; ax: number; ay: number; rise: number; drift: number; parts: Part[]; rain: Part[] };
type Salvo = { id: number; shells: Shell[] };

function lcg(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function makeSalvo(id: number, vb: ArcVb): Salvo {
  const r = lcg(id * 2654435761);
  const jx = (r() - 0.5) * 0.06, jy = (r() - 0.5) * 0.05;
  const shells: Shell[] = [0, 1, 2].map((k) => {
    const hyFrac = (ARC_HORIZON_Y(vb) - vb.y) / vb.h;
    const startFx = 0.77;
    const startFy = hyFrac;
    const apexFx = 0.46 + k * 0.045 + jx;
    const apexFy = 0.20 + (k === 1 ? -0.02 : 0.02) + jy;
    const sx = vb.x + startFx * vb.w, sy = vb.y + startFy * vb.h;
    const ax = vb.x + apexFx * vb.w, ay = vb.y + apexFy * vb.h;
    const parts: Part[] = Array.from({ length: FW_PARTS }, (_, i) => {
      const a = (Math.PI * 2 * i) / FW_PARTS + r() * 0.4;
      const sp = FW_SP_MIN + r() * (FW_SP_MAX - FW_SP_MIN);
      return {
        dx: Math.cos(a) * sp, dy: Math.sin(a) * sp - 30,
        fall: 50 + r() * 60, rot: (r() - 0.5) * 540,
        size: 4 + Math.floor(r() * 4) * 2, delay: r() * 0.08,
      };
    });

    const rain: Part[] = Array.from({ length: 18 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 18 + r() * 0.5;
      const sp = 8 + r() * 16;
      return {
        dx: Math.cos(a) * sp, dy: Math.sin(a) * sp - 14,
        fall: 130 + r() * 110, rot: (r() - 0.5) * 120,
        size: 3 + Math.floor(r() * 3) * 2, delay: r() * 0.35,
      };
    });
    return { sx, sy, ax, ay, rise: ay - sy, drift: ax - sx, parts, rain };
  });
  return { id, shells };
}

export function CyberFireworks({ vb }: { vb: ArcVb }) {
  const still = useReducedMotion();
  const [salvos, setSalvos] = useState<Salvo[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (still) { setSalvos([]); return; }
    const push = () => {
      seq.current += 1;
      const sv = makeSalvo(seq.current, vb);
      setSalvos((prev) => [...prev.slice(-1), sv]);
    };
    push();
    const iv = window.setInterval(push, FW_INTERVAL);
    return () => window.clearInterval(iv);
  }, [still, vb]);

  if (still || salvos.length === 0) return null;

  return (
    <g pointerEvents="none" className="rf-cyber-root" aria-hidden="true">
      {salvos.map((sv) => (
        <g key={sv.id}>
          {sv.shells.map((sh, k) => (
            <g key={"sh-" + k}>
              {}
              <circle className="rf-fw-shell" cx={sh.sx} cy={sh.sy} r={3.5}
                fill="var(--cyber-fill, #aa00ff)"
                style={{ ["--rise" as any]: sh.rise + "px", ["--drift" as any]: sh.drift + "px" } as React.CSSProperties} />
              {}
              <g transform={`translate(${sh.ax.toFixed(1)}, ${sh.ay.toFixed(1)})`}>
                {sh.parts.map((p, i) => (
                  <rect key={"p-" + i} width={p.size} height={p.size}
                    x={-p.size / 2} y={-p.size / 2}
                    fill="var(--cyber-fill, #aa00ff)"
                    className="rf-asteroid-particle"
                    style={{
                      ["--dx" as any]: p.dx + "px", ["--dy" as any]: p.dy + "px",
                      ["--fall" as any]: p.fall + "px", ["--rot" as any]: p.rot + "deg",
                      ["--pc" as any]: "var(--cyber-fill, #00ffff)",
                      animationDelay: (FW_RISE + p.delay) + "s",
                    } as React.CSSProperties} />
                ))}
                {sh.rain.map((p, i) => (
                  <rect key={"r-" + i} width={p.size} height={p.size}
                    x={-p.size / 2} y={-p.size / 2}
                    fill="var(--cyber-fill, #aa00ff)"
                    className="rf-fw-spark"
                    style={{
                      ["--dx" as any]: p.dx + "px", ["--dy" as any]: p.dy + "px",
                      ["--fall" as any]: p.fall + "px", ["--rot" as any]: p.rot + "deg",
                      animationDelay: (FW_RISE + 0.55 + p.delay) + "s",
                    } as React.CSSProperties} />
                ))}
              </g>
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}
