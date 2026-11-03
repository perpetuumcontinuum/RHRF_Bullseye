import { useEffect, useRef, useState } from "react";

export type DepartFace = "down" | "left" | "right" | "up";
export type DepartPose = { face: DepartFace; ox: number; oy: number; s: number; op: number; blob: number; cheer: number };

const T1 = 700, T2 = 1000, E = 1800, R = 2200, B = 1800, C = 2400;

export function departWalkElapsedAt(t: number, dx: number, stopOY = -10): number | null {
  const WALK = Math.min(5200, Math.max(900, Math.abs(dx) * 7));
  if (t < T1) return null;
  let u = t - T1;
  if (u < WALK) return u;
  u -= WALK;
  if (u < T2) return WALK + u;
  u -= T2;
  if (u < E) {
    const oy = -90 * (u / E);
    if (oy < stopOY) return null;
    return WALK + T2 + u;
  }
  u -= E;
  if (u < R) {
    const oy = -90 - 115 * (u / R);
    if (oy < stopOY) return null;
    return WALK + T2 + E + u;
  }
  return null;
}

export function departPoseAt(t: number, dx: number): DepartPose | null {
  const WALK = Math.min(5200, Math.max(900, Math.abs(dx) * 7));
  if (t >= T1 + WALK + T2 + E + R + B + C) return null;
  if (t < T1) return { face: dx < 0 ? "left" : "right", ox: 0, oy: 0, s: 1, op: 1, blob: 0, cheer: 0 };
  t -= T1;
  if (t < WALK) { const p = t / WALK; return { face: dx < 0 ? "left" : "right", ox: dx * p, oy: 0, s: 1, op: 1, blob: 0, cheer: 0 }; }
  t -= WALK;
  if (t < T2) { const p = t / T2; return { face: "up", ox: dx, oy: 0, s: 1 - 0.25 * p, op: 1, blob: 0, cheer: 0 }; }
  t -= T2;
  if (t < E) { const p = t / E; return { face: "up", ox: dx, oy: -90 * p, s: 0.75 - 0.25 * p, op: 0.78, blob: 0, cheer: 0 }; }
  t -= E;
  if (t < R) { const p = t / R; return { face: "up", ox: dx, oy: -90 - 115 * p, s: 0.5 - 0.34 * p, op: 0.78, blob: 0, cheer: 0 }; }
  t -= R;
  if (t < B) { const p = t / B; return { face: "up", ox: dx, oy: -205, s: 0.16, op: 0, blob: p, cheer: 0 }; }
  t -= B;
  return { face: "up", ox: dx, oy: -205, s: 0.16, op: 0, blob: 1, cheer: Math.min(1, t / 300) };
}

export function useDepartPose(active: boolean, dx: number, onDone?: () => void): DepartPose | null {
  const [t, setT] = useState(0);
  const raf = useRef(0);
  const done = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;
  useEffect(() => {
    if (!active) { setT(0); done.current = false; return; }
    (window as any).__RHRF_CUTSCENE__ = true;
    const start = performance.now();
    let pausedAccum = 0;
    let wasPaused = false;
    let pauseSince = 0;
    const tick = (now: number) => {
      if ((window as any).__RHRF_IS_PAUSED__) {
        if (!wasPaused) {
          wasPaused = true;
          pauseSince = now;
        }
        raf.current = requestAnimationFrame(tick);
        return;
      }
      if (wasPaused) {
        pausedAccum += now - pauseSince;
        wasPaused = false;
      }
      const e = now - start - pausedAccum;
      (window as any).__RHRF_DEPART_WALKING__ = departWalkElapsedAt(e, dx) !== null;
      if (!departPoseAt(e, dx)) { if (!done.current) { done.current = true; cb.current?.(); } return; }
      setT(e);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf.current); (window as any).__RHRF_CUTSCENE__ = false; (window as any).__RHRF_DEPART_WALKING__ = false; };
  }, [active, dx]);
  return active ? departPoseAt(t, dx) : null;
}
