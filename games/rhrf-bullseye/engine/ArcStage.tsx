import React, { useEffect, useRef, useState } from "react";
import ArcIntroBackground from "./planets/ArcIntroBackground";
import ArcFinalBackground from "./planets/ArcFinalBackground";

export type ArcVb = { x: number; y: number; w: number; h: number };

export default function ArcStage({
  mode,
  children,
}: {
  mode: "intro" | "final" | "depart";
  children: (vb: ArcVb) => React.ReactNode;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<ArcVb>({ x: 0, y: 0, w: 960, h: 640 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const BW = 960, BH = 640, MAX = 20000;
    const upd = () => {
      const r = el.getBoundingClientRect();
      const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
      const ar = cw / ch, ba = BW / BH;
      let x = 0, y = 0, w = BW, h = BH;
      if (ar > ba) { h = BH; w = Math.min(MAX, BH * ar); x = (BW - w) / 2; }
      else { w = BW; h = Math.min(MAX, BW / ar); y = (BH - h) / 2; }
      setVb({ x, y, w, h });
    };
    upd();
    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(upd) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", upd);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", upd); };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {mode === "final" ? <ArcFinalBackground vb={vb} /> : <ArcIntroBackground vb={vb} />}
      {children(vb)}
    </svg>
  );
}
