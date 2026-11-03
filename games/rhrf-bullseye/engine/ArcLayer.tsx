import { buildTailPath } from "./tailPath";
import { wrapText } from "./textWrap";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getDialogSkip, getSceneLines } from "./dialogs";
import { awardBadge } from "./stats";
import { translate } from "./i18n";
import { useLang } from "./i18n";
import EtherLogo from "./EtherLogo";
import type { ArcVb } from "./ArcStage";
import { departPoseAt, departWalkElapsedAt } from "./departPose";
import type { DepartFace } from "./departPose";
import { ARC_HORIZON_Y, purpleHorizonY, purpleRidgePoints, Tree, Crystal, TREES, CRYSTALS } from "./planets/ArcFinalBackground";
import { CyberFireworks } from "./Fireworks";

const WAVE_MS = 1400;
const WAVE_SPEED = 0.85;
const WAVE_HIT_MS = Math.ceil((210 + 232.5 - 65 - 30) / WAVE_SPEED);

type Mode = "intro" | "final" | "depart";
type Phase = "hero" | "reveal" | "dialog" | "depart" | "finale" | "arrive";

import { getSpeakerName } from "../lang/names";
const WHO_NAME: Record<string, string> = {
  cyber: "CYBER HERO", ether: "ETHER", crowd: "CROWD",
  elder: "ELDER", cyber_npc: "CYBER", tower: "TOWER", stage: "", rep: "",
};

const ROWS = 3, STEP = 24, TEXT_TOP = 52, BTN_PAD = 46;
const BH = TEXT_TOP + ROWS * STEP + BTN_PAD;

const FINALE_FAST = 1 / 1.5;
const FINALE_SLOW = 1 / 40.0;
const FINALE_BRAKE = 0.5;
const FINALE_ACCEL_TAU = 0.4;
const FINALE_LEAD_CAP = 2;
const ARRIVE_GROUP_DX = 46;
const FINALE_ROAD = { p0: [-0.12, 1.08], p1: [0.26, 0.76], p2: [0.77, 0.55] } as const;

const ARRIVE_T = 0.34;
const ARRIVE_FADE = 900, ARRIVE_WALK = 1300, ARRIVE_BEAM_OUT = 700, ARRIVE_TOTAL = 3000;

function finaleRoadPoint(t: number, vb: ArcVb): { x: number; y: number } {
  const u = 1 - t;
  const p2y = (ARC_HORIZON_Y(vb) - vb.y) / vb.h;
  return {
    x: vb.x + (u * u * FINALE_ROAD.p0[0] + 2 * u * t * FINALE_ROAD.p1[0] + t * t * FINALE_ROAD.p2[0]) * vb.w,
    y: vb.y + (u * u * FINALE_ROAD.p0[1] + 2 * u * t * FINALE_ROAD.p1[1] + t * t * p2y) * vb.h,
  };
}

const pausedTimeout = (fn: () => void, ms: number) => {
  let remaining = ms;
  let last = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const dt = now - last;
    last = now;
    if (!(window as any).__RHRF_IS_PAUSED__) remaining -= dt;
    if (remaining <= 0) {
      fn();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
};

const FINALE_MEMBERS = [
  { lat: 0, dy: 0 }, { lat: -18, dy: 5 }, { lat: 15, dy: 7 }, { lat: -9, dy: 11 },
  { lat: 22, dy: 3 }, { lat: -24, dy: 9 }, { lat: 7, dy: 13 },
];


function chunkLines(rows: string[]): string[][] {
  const c: string[][] = [];
  for (let i = 0; i < rows.length; i += ROWS) c.push(rows.slice(i, i + ROWS));
  return c.length ? c : [[""]];
}

function ArcTower({ x, base }: { x: number; base: number }) {
  const H = 140, TIP = base - H, BW = 60, TW = 20;
  const R1D = 80, R1W = 36, R2D = 130, R2W = 30, ANT = 24;
  return (
    <g shapeRendering="crispEdges" pointerEvents="none">
      <polygon
        points={`${x - BW / 2},${base} ${x + BW / 2},${base} ${x + TW / 2},${TIP} ${x - TW / 2},${TIP}`}
        fill="#000" fillOpacity={0.9} stroke="#000" strokeOpacity={0.9} strokeWidth="1.5"
      />
      <line x1={x - R1W / 2} y1={base - R1D} x2={x + R1W / 2} y2={base - R1D} stroke="#000" strokeOpacity={0.7} strokeWidth="0.8" />
      <line x1={x - R2W / 2} y1={base - R2D} x2={x + R2W / 2} y2={base - R2D} stroke="#000" strokeOpacity={0.7} strokeWidth="0.8" />
      <line x1={x - ANT / 2} y1={TIP - 35} x2={x + ANT / 2} y2={TIP - 35} stroke="#000" strokeOpacity={0.7} strokeWidth="0.8" />
    </g>
  );
}

const ARC_HERO_S = 0.625;
const ARC_HERO_BODY = 128 * ARC_HERO_S;

function arcPixelCenterOffset(pts: [number, number][], basePts: [number, number][], step = 8) {
  if (!pts?.length || !basePts?.length) return { x: 0, y: 0 };
  const bounds = (a: [number, number][]) => {
    const xs = a.map((p) => p[0]);
    const ys = a.map((p) => p[1]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  };
  const fb = bounds(basePts);
  const sb = bounds(pts);
  return {
    x: (((fb.minX + fb.maxX + 1) / 2) - ((sb.minX + sb.maxX + 1) / 2)) * step,
    y: (((fb.minY + fb.maxY + 1) / 2) - ((sb.minY + sb.maxY + 1) / 2)) * step,
  };
}

function arcHeroWorldBounds(
  pixels: [number, number][],
  x: number,
  base: number,
  scaleMul = 1,
  flip = false,
  shiftX = 0,
  shiftY = 0,
) {
  const STEP = 8, GRID = 16, S = ARC_HERO_S * scaleMul;
  const gw = GRID * STEP, gh = GRID * STEP;
  const pts = pixels && pixels.length ? pixels : ([[4, 1], [12, 16]] as [number, number][]);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [gx, gy] of pts) {
    if (gx < minX) minX = gx;
    if (gy < minY) minY = gy;
    if (gx > maxX) maxX = gx;
    if (gy > maxY) maxY = gy;
  }
  if (!Number.isFinite(minX)) {
    minX = 4; minY = 1; maxX = 12; maxY = 16;
  }

  // Границы с учётом friend-outline: rect x = gx*STEP-STEP, width=STEP*3.
  const localLeft = (minX - 1) * STEP;
  const localRight = (maxX + 2) * STEP;
  const localTop = (minY - 1) * STEP;
  const localBottom = (maxY + 2) * STEP;

  const left = flip
    ? x + S * (gw / 2 - (localRight + shiftX))
    : x + S * (-gw / 2 + localLeft + shiftX);
  const right = flip
    ? x + S * (gw / 2 - (localLeft + shiftX))
    : x + S * (-gw / 2 + localRight + shiftX);
  const top = base + S * (-gh + localTop + shiftY);
  const bottom = base + S * (-gh + localBottom + shiftY);

  return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
}

function ArcBow({ x, y, dir = -1, op = 1 }: { x: number; y: number; dir?: number; op?: number }) {
  return (
    <g
      pointerEvents="none"
      opacity={op}
      transform={`translate(${x}, ${y}) scale(${dir},1) rotate(-20)`}
      style={{ filter: "drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 7px rgba(255,255,255,0.5))" }}
    >
      <path d="M 0,-35 Q 15,-20 15,0 Q 15,20 0,35" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
      <line x1="0" y1="-35" x2="0" y2="35" stroke="#000" strokeWidth="1.8" />
    </g>
  );
}

function ArcHero({ pixels, x, base, offX = 0, offY = 0, shiftX = 0, shiftY = 0, scaleMul = 1, op = 1, flip = false }: { pixels: [number, number][]; x: number; base: number; offX?: number; offY?: number; shiftX?: number; shiftY?: number; scaleMul?: number; op?: number; flip?: boolean }) {
  const STEP = 8, GRID = 16, S = ARC_HERO_S;
  const gw = GRID * STEP, gh = GRID * STEP;
  const tf = `translate(${x + offX}, ${base + offY}) scale(${S * scaleMul}) translate(${flip ? gw / 2 : -gw / 2}, ${-gh})${flip ? " scale(-1,1)" : ""} translate(${shiftX}, ${shiftY})`;
  if (pixels && pixels.length) {
    return (
      <g shapeRendering="crispEdges" pointerEvents="none" opacity={op} transform={tf}>
        {pixels.map(([gx, gy], i) => (<rect key={"ho-" + i} x={gx * STEP - STEP} y={gy * STEP - STEP} width={STEP * 3} height={STEP * 3} className="friend-outline" />))}
        {pixels.map(([gx, gy], i) => (<rect key={"hb-" + i} x={gx * STEP} y={gy * STEP} width={STEP} height={STEP} className="friend-body" />))}
      </g>
    );
  }
  return (
    <g shapeRendering="crispEdges" pointerEvents="none" fill="#000" opacity={op} transform={tf}>
      <rect x={5 * STEP} y={1 * STEP} width={6 * STEP} height={5 * STEP} />
      <rect x={4 * STEP} y={6 * STEP} width={8 * STEP} height={6 * STEP} />
      <rect x={4 * STEP} y={12 * STEP} width={3 * STEP} height={4 * STEP} />
      <rect x={9 * STEP} y={12 * STEP} width={3 * STEP} height={4 * STEP} />
    </g>
  );
}


function AnimatedArcHero({
  pixels,
  walkFrames,
  walking,
  x,
  base,
  offX = 0,
  offY = 0,
  shiftX = 0,
  shiftY = 0,
  scaleMul = 1,
  op = 1,
  flip = false,
}: {
  pixels: [number, number][];
  walkFrames: [number, number][][];
  walking: boolean;
  x: number;
  base: number;
  offX?: number;
  offY?: number;
  shiftX?: number;
  shiftY?: number;
  scaleMul?: number;
  op?: number;
  flip?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!walking || !walkFrames.length) {
      setActive(false);
      setFrame(0);
      return;
    }

    let id = 0;
    const tick = () => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      setActive(true);
      setFrame((f) => f + 1);
    };
    const start = () => {
      if (!id) id = window.setInterval(tick, 120);
    };
    const stop = () => {
      if (id) {
        window.clearInterval(id);
        id = 0;
      }
    };
    const sync = () => {
      if ((window as any).__RHRF_IS_PAUSED__) stop();
      else start();
    };

    sync();
    const watch = window.setInterval(sync, 200);

    return () => {
      stop();
      window.clearInterval(watch);
      setActive(false);
      setFrame(0);
    };
  }, [walking, walkFrames]);

  const px = active && walkFrames.length ? walkFrames[frame % walkFrames.length] : pixels;

  return (
    <ArcHero
      pixels={px}
      x={x}
      base={base}
      offX={offX}
      offY={offY}
      shiftX={shiftX}
      shiftY={shiftY}
      scaleMul={scaleMul}
      op={op}
      flip={flip}
    />
  );
}



export default function ArcLayer({ mode, vb, pixels = [], sidePixels = [], backPixels = [], accent = "#00ffff", onComplete }: {
  mode: Mode; vb: ArcVb; pixels?: [number, number][]; sidePixels?: [number, number][]; backPixels?: [number, number][]; accent?: string; onComplete?: (m: Mode) => void;
}) {
  const lang = useLang();
  const [idx, setIdx] = useState(0);
  const [part, setPart] = useState(0);
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>(mode === "intro" ? "hero" : mode === "depart" ? "depart" : mode === "final" ? "arrive" : "dialog");
  const [departT, setDepartT] = useState(-1);
  const [finaleProg, setFinaleProg] = useState(0);
  const [arriveT, setArriveT] = useState(0);
  const [finaleDone, setFinaleDone] = useState(false);
  const arriveRafRef = useRef(0);
  const chunksRef = useRef<string[][]>([[""]]);
  const [storyBow, setStoryBow] = useState(false);
  const firedActionsRef = useRef<Set<number>>(new Set());
  const rightWalkFrames = useMemo(() => {
    const raw = ((window as any).__RHRF_HERO_WALK_FRAMES__?.right ?? []) as [number, number][][];
    return Array.isArray(raw) ? raw.filter((px) => Array.isArray(px) && px.length > 0) : [];
  }, []);

  const sceneKey = mode === "intro" ? "arcIntro" : "arcFinal";
  const baseLines = useMemo(() => getSceneLines(sceneKey as any, lang), [sceneKey, lang]);
  const lines = useMemo(
    () => (baseLines && baseLines.length ? baseLines : getSceneLines(sceneKey as any, "ru") || []),
    [baseLines, sceneKey]
  );

  useEffect(() => { (window as any).__RHRF_CUTSCENE__ = visible; return () => { (window as any).__RHRF_CUTSCENE__ = false; }; }, [visible, phase]);
  useEffect(() => { setPart(0); }, [idx]);

  useEffect(() => {
    if (mode !== "final" || finaleDone || !lines.length) return;
    const horizonStep = Math.max(1, lines.length - 3);
    const endStep = Math.max(lines.length, horizonStep + 2);
    if (idxRef.current >= lines.length - 1 && finaleProg >= endStep) {
      finaleDoneRef.current = true;
      setFinaleDone(true);
    }
  }, [mode, finaleDone, finaleProg, lines.length]);

  useEffect(() => {
    if (mode !== "final" || !lines.length || stoneDropDispatchedRef.current) return;
    const horizonStep = Math.max(1, lines.length - 3);
    if (finaleProg < Math.max(0, lines.length - 2)) return;

    stoneDropDispatchedRef.current = true;
    window.setTimeout(() => {
      window.dispatchEvent(new Event("rhrf:stone-drop"));
    }, 0);
  }, [mode, finaleProg, lines.length]);

  useEffect(() => {
    if (mode !== "final" || arcadeAwardedRef.current) return;
    arcadeAwardedRef.current = true;
    const fresh = awardBadge("arcade_1");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("rhrf:arcade-complete", { detail: { fresh } }));
    }, 0);
  }, [mode]);

  useEffect(() => {
    if (mode !== "intro") return;
    const c1 = pausedTimeout(() => setPhase((p) => (p === "hero" ? "reveal" : p)), 2000);
    const c2 = pausedTimeout(() => setPhase((p) => (p === "hero" || p === "reveal" ? "dialog" : p)), 4000);
    return () => { c1(); c2(); };
  }, [mode]);
  const departRafRef = useRef(0);
  useEffect(() => {
    if (phase !== "depart") return;
    (window as any).__RHRF_CUTSCENE__ = true;
    const start = performance.now();
    let paused = false;
    let pauseSince = 0;
    let pauseAccum = 0;
    const tick = (now: number) => {
      if ((window as any).__RHRF_IS_PAUSED__) {
        if (!paused) {
          paused = true;
          pauseSince = now;
        }
        departRafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (paused) {
        pauseAccum += now - pauseSince;
        paused = false;
      }
      const t = now - start - pauseAccum;
      (window as any).__RHRF_DEPART_WALKING__ = departWalkElapsedAt(t, DEPART_DX) !== null;
      const pose = departPoseAt(t, DEPART_DX);
      if (!pose || pose.cheer > 0) { finish(); return; }
      setDepartT(t);
      departRafRef.current = requestAnimationFrame(tick);
    };
    departRafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(departRafRef.current); (window as any).__RHRF_DEPART_WALKING__ = false; };
  }, [phase]);

  const finaleStepRef = useRef(0);
  const finaleProgRef = useRef(0);
  const idxRef = useRef(0);
  const partRef = useRef(0);
  const finaleDoneRef = useRef(false);
  const stoneDropDispatchedRef = useRef(false);
  const arcadeAwardedRef = useRef(false);

  idxRef.current = idx;
  partRef.current = part;
  finaleDoneRef.current = finaleDone;
  const finaleVelRef = useRef(0);
  const finaleRafRef = useRef(0);
  useEffect(() => {
    if (mode !== "final") return;
    let last = performance.now();
    const tick = (now: number) => {
      if ((window as any).__RHRF_IS_PAUSED__) { finaleRafRef.current = requestAnimationFrame(tick); return; }
      const dt = Math.min(120, now - last) / 1000;
      last = now;
      const target = finaleStepRef.current;
      const dist = target - finaleProgRef.current;

      let desired;
      if (dist <= 0) desired = FINALE_SLOW;
      else if (dist >= FINALE_BRAKE) desired = FINALE_FAST;
      else desired = FINALE_SLOW + (FINALE_FAST - FINALE_SLOW) * (dist / FINALE_BRAKE);
      finaleVelRef.current += (desired - finaleVelRef.current) * Math.min(1, dt / FINALE_ACCEL_TAU);
      const np = finaleProgRef.current + finaleVelRef.current * dt;
      if (Math.abs(np - finaleProgRef.current) > 1e-6) {
        finaleProgRef.current = np;
        setFinaleProg(np);
      }
      finaleRafRef.current = requestAnimationFrame(tick);
    };
    finaleRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(finaleRafRef.current);
  }, [mode]);

  useEffect(() => {
    if (mode !== "final" || phase !== "arrive") return;
    (window as any).__RHRF_CUTSCENE__ = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      if (t >= ARRIVE_TOTAL) {
        setArriveT(ARRIVE_TOTAL);
        setPhase("dialog");
        return;
      }
      setArriveT(t);
      arriveRafRef.current = requestAnimationFrame(tick);
    };
    arriveRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(arriveRafRef.current);
      (window as any).__RHRF_CUTSCENE__ = false;
    };
  }, [mode, phase]);

  const [waveT, setWaveT] = useState(-1);
  const [waveArmed, setWaveArmed] = useState(false);
  const departQueuedRef = useRef(false);
  const waveRafRef = useRef(0);
  const waveStartedRef = useRef(false);
  useEffect(() => {
    if (mode !== "intro" || !waveArmed) return;
    if (waveStartedRef.current) return;
    waveStartedRef.current = true;
    setWaveT(0);
    const start = performance.now();
    const tick = (now: number) => {
      if ((window as any).__RHRF_IS_PAUSED__) { waveRafRef.current = requestAnimationFrame(tick); return; }
      const e = now - start;
      if (e >= WAVE_MS) { setWaveT(WAVE_MS); return; }
      setWaveT(e);
      if (e >= WAVE_HIT_MS && departQueuedRef.current) {
        departQueuedRef.current = false;
        setPhase("depart");
      }
      waveRafRef.current = requestAnimationFrame(tick);
    };
    waveRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(waveRafRef.current);
  }, [mode, waveArmed]);

  useEffect(() => {
    if (mode !== "intro" || phase !== "dialog") return;
    const a = lines[idx]?.action;
    if (!a || firedActionsRef.current.has(idx)) return;
    firedActionsRef.current.add(idx);
    if (a === "armWave") setWaveArmed(true);
    if (a === "giveBow") setStoryBow(true);
  }, [mode, phase, idx, lines]);

  function finish() { setVisible(false); onComplete?.(mode); }

  useEffect(() => {
    const onDismissDialog = () => {
      if (visible && phase === "dialog") finish();
    };
    window.addEventListener("rhrf:dismiss-dialog", onDismissDialog);
    return () => window.removeEventListener("rhrf:dismiss-dialog", onDismissDialog);
  }, [visible, phase, mode, onComplete]);

  function requestDepart() {
    if (waveT >= WAVE_HIT_MS) { setPhase("depart"); return; }
    departQueuedRef.current = true;
    setWaveArmed(true);
  }

  const cx = vb.x + vb.w / 2;
  const base = vb.y + vb.h * 0.72;
  const etherH = ARC_HERO_BODY + 40, etherW = etherH / 1.58;
  const etherLeft = vb.x + 0.375 * vb.w - etherW / 2;
  const heroX = vb.x + 0.625 * vb.w;
  const towerX = cx + 330;
  const DEPART_DX = towerX - heroX;
  const topHighest = base - etherH;

  const etherCx = etherLeft + etherW / 2;
  let bw = Math.min(vb.w * 0.62, 560);
  bw = Math.max(320, Math.min(bw, vb.w - 20));
  let bx = vb.x + (vb.w - bw) / 2;
  if (bx + bw > vb.x + vb.w - 10) bx = vb.x + vb.w - 10 - bw;
  if (bx < vb.x + 10) bx = vb.x + 10;

  const charsPerLine = Math.max(24, Math.floor((bw - 36) / 9.4));
  const wrappedAll = lines.map((l) => wrapText(l.text, charsPerLine));
  const wrapped = wrappedAll[idx] || [""];
  const chunks = chunkLines(wrapped);
  chunksRef.current = chunks;
  const page = chunks[Math.min(part, chunks.length - 1)] || [""];

  function advance() {
    if (!lines.length) return;
    if (mode === "final" && finaleDoneRef.current) return;

    const c = chunksRef.current;
    const p = partRef.current;

    if (p < c.length - 1) {
      partRef.current = p + 1;
      setPart(p + 1);
      return;
    }

    if (mode === "final") {
      const i = idxRef.current;

      if (i >= lines.length - 1) {
        const horizonStep = Math.max(1, lines.length - 3);
        finaleStepRef.current = Math.max(lines.length, horizonStep + 2);
        finaleVelRef.current = Math.max(finaleVelRef.current, FINALE_FAST);
        return;
      }

      const cap = Math.min(lines.length, finaleProgRef.current + FINALE_LEAD_CAP);
      if (finaleStepRef.current >= cap) return;

      const ni = i + 1;
      idxRef.current = ni;
      partRef.current = 0;
      chunksRef.current = chunkLines(wrappedAll[ni] || [""]);
      finaleStepRef.current = Math.min(cap, finaleStepRef.current + 1);
      setIdx(ni);
      setPart(0);
      return;
    }

    const i = idxRef.current;
    if (i < lines.length - 1) {
      const ni = i + 1;
      idxRef.current = ni;
      partRef.current = 0;
      chunksRef.current = chunkLines(wrappedAll[ni] || [""]);
      setIdx(ni);
      setPart(0);
    } else if (mode === "intro") {
      requestDepart();
    } else {
      finish();
    }
  }

  function back() {
    if (!lines.length) return;

    const c = chunksRef.current;
    const p = partRef.current;

    if (p > 0) {
      partRef.current = p - 1;
      setPart(p - 1);
      return;
    }

    const i = idxRef.current;
    if (i > 0) {
      const ni = i - 1;
      const prev = chunkLines(wrappedAll[ni] || [""]);
      const np = Math.max(0, prev.length - 1);
      idxRef.current = ni;
      partRef.current = np;
      chunksRef.current = prev;
      setIdx(ni);
      setPart(np);

      if (mode === "final") {
        const horizonStep = Math.max(1, lines.length - 3);
        const wasLast = i >= lines.length - 1;
        if (wasLast && finaleDoneRef.current) {
          finaleDoneRef.current = false;
          setFinaleDone(false);
        }
        finaleStepRef.current = wasLast
          ? Math.max(0, lines.length - 1)
          : Math.max(0, finaleStepRef.current - 1);
        finaleVelRef.current = 0;
      }
    }
  }

  useEffect(() => {
    if (!visible || phase !== "dialog" || mode === "final" || lines.length === 0) return;
    let left = 20000;
    const id = window.setInterval(() => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      left -= 1000;
      if (left <= 0) {
        window.clearInterval(id);
        advance();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [visible, phase, mode, idx, part, lines.length]);

  const by = vb.y + 110;

  const line = lines[idx];

  useEffect(() => {
    if (!visible) return;
    const MENU_SELECTOR =
      ".rf-top-bar, .rf-lang-picker, .rf-lang-overlay, .rf-lang-panel, " +
      ".rf-lang-option, .rf-lang-close, .rf-lang-header, .rf-lang-title, " +
      ".rf-lang-grid, .rf-lang-code, .rf-lang-name, .rf-pause-btn, .rf-share-btn, .rf-mute-btn, .rf-tab-btn, " +
      ".rf-hud-main, .rf-hud-mini, [data-no-bubble-dismiss]";
    const onPointerDown = (e: PointerEvent) => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest(MENU_SELECTOR)) return;
      if (phase === "hero") { setPhase("dialog"); return; }
      if (phase === "depart" || phase === "arrive") return;
      if (t.closest(".rf-arc-exit")) { window.dispatchEvent(new CustomEvent("rhrf:exit-game")); return; }
      if (t.closest(".rf-arc-back")) { back(); return; }
      if (t.closest(".rf-arc-skip")) {
        lines.forEach((l, i) => {
          if (!l.action || firedActionsRef.current.has(i)) return;
          firedActionsRef.current.add(i);
          if (l.action === "armWave") setWaveArmed(true);
          if (l.action === "giveBow") setStoryBow(true);
        });
        if (mode === "intro") requestDepart();
        else if (mode === "final") {
          const last = Math.max(0, lines.length - 1);
          const horizonStep = Math.max(1, lines.length - 3);
          const endStep = Math.max(lines.length, horizonStep + 2);
          idxRef.current = last;
          partRef.current = 0;
          chunksRef.current = chunkLines(wrappedAll[last] || [""]);
          finaleStepRef.current = endStep;
          finaleVelRef.current = FINALE_FAST;
          if (finaleProgRef.current < endStep) {
            finaleProgRef.current = endStep;
            setFinaleProg(finaleProgRef.current);
          }
          setIdx(last);
          setPart(0);
        } else finish();
        return;
      }
      if (t.closest(".rf-arc-next")) { advance(); return; }
      advance();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [visible, idx, part, lines, phase, mode, onComplete, vb.w]);

  if (!visible) return null;
  if (!line) return null;

  const skipLabel = getDialogSkip(lang);
  const nextLabel = translate(lang, "ui.dialog.next", undefined, "NEXT");
  const backLabel = translate(lang, "ui.dialog.back", undefined, "BACK");
  const speakerName = getSpeakerName(String(line.who), lang, { sceneKey });
  const showButtons = phase === "dialog";
  const who = String(line.who);

  const SPKR_GAP = 18;
  let spkCx: number, spkTopY: number;
  let isLeft: boolean;
  if (mode === "final") {
    const _st = finaleProg;
    const _hs = Math.max(1, lines.length - 3);
    const _ap = Math.max(0, Math.min(1, _st / _hs));
    const _wk = ARRIVE_T + (1 - ARRIVE_T) * _ap;
    const _wp = (_wk - ARRIVE_T) / Math.max(0.01, 1 - ARRIVE_T);
    const _sp = 1 - 0.25 * Math.max(0, Math.min(1, _wp));
    const _pp = finaleRoadPoint(_wk, vb);
    const _ss = 1 - 0.72 * _wk;
    const _kk = 1 - Math.pow(_ap, 3);
    const _hh = 128 * ARC_HERO_S * _ss;
    isLeft = who !== "cyber";
    const _lat = isLeft ? -24 : 22;
    const _dy = isLeft ? 9 : 3;
    let _cx = _pp.x + (ARRIVE_GROUP_DX + _lat * _sp) * _ss * _kk;
    const _ctr = _pp.x + ARRIVE_GROUP_DX * _ss * _kk;
    if (Math.abs(_cx - _ctr) < 5) _cx = _ctr + (isLeft ? -5 : 5);
    const _ridge = purpleHorizonY(vb, (_cx - vb.x) / vb.w);
    const _beyond = Math.max(0, _st - _hs);
    const _sinking = _beyond > 0.0005;
    const _dip = Math.min(1.2, _beyond / 2);
    const _sinkH = 150 * ARC_HERO_S * _ss;
    const _crownWalk = _pp.y + _dy * _sp * _ss * (1 - _ap) - _hh;
    const _crownSink = _ridge + _sinkH * _dip - _hh;
    spkCx = _cx;

    spkTopY = (_sinking ? Math.min(_crownSink, _ridge) : _crownWalk) - SPKR_GAP;
  } else {
    isLeft = who === "ether";
    spkCx = who === "ether" ? etherCx
      : who === "cyber" || who === "cyber_npc" ? heroX
      : who === "tower" ? towerX
      : bx + bw / 2;
    spkTopY = (who === "ether" ? topHighest
      : who === "tower" ? base - 140
      : base - ARC_HERO_BODY) - SPKR_GAP;
  }
  const TAIL_HALF = bw * 0.10;
  const tailCx = isLeft ? bx + bw * 0.25 : bx + bw * 0.75;
  const tailY = by + BH;
  const tailTipY = Math.max(tailY + 6, spkTopY);
  const tailPath = buildTailPath(bx, by, bw, tailCx, TAIL_HALF, spkCx, tailY, tailTipY);

  const nextW = Math.max(90, nextLabel.length * 8.2 + 32);
  const skipW = Math.max(80, skipLabel.length * 7.4 + 30);
  const backW = Math.max(80, backLabel.length * 8.2 + 30);
  const skipX = bx + bw - skipW - 24;
  const nextX = Math.max(bx + 24 + backW + 20, skipX - nextW - 20);
  const backX = Math.max(bx + 24, nextX - backW - 20);
  const canBack = (idx > 0 || part > 0) && !(mode === "final" && finaleDone);
  const btnY = by + BH - BTN_PAD - 2;
  const btnTextY = btnY + 21;

  const revealed = phase !== "hero";
  const fade = (target: number): CSSProperties => ({ opacity: revealed ? target : 0, transition: "opacity 2s ease-in-out" });

  const dpRaw = phase === "depart" && departT >= 0 ? departPoseAt(departT, DEPART_DX) : null;
  const dp = dpRaw ? {
    fr: dpRaw.face === "up" ? ("back" as const) : ("side" as const),
    ox: dpRaw.ox, oy: dpRaw.oy, sm: dpRaw.s,
    ho: dpRaw.op, bo: dpRaw.blob, by: -dpRaw.blob * 380 - (mode === "intro" && dpRaw.blob > 0 ? 35 : 0),
  } : null;
  const walkElapsed = dpRaw ? departWalkElapsedAt(departT, DEPART_DX) : null;
  const heroWalkFramesGlobal = (window as any).__RHRF_HERO_WALK_FRAMES__ as { down?: [number, number][][]; right?: [number, number][][]; up?: [number, number][][]; left?: [number, number][][] } | undefined;
  const pickWalkPx = (face: DepartFace): [number, number][] | null => {
    if (walkElapsed == null || !heroWalkFramesGlobal) return null;
    const arr = face === "up" ? heroWalkFramesGlobal.up : face === "down" ? heroWalkFramesGlobal.down : face === "left" ? heroWalkFramesGlobal.left : heroWalkFramesGlobal.right;
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr[Math.floor(walkElapsed / 120) % arr.length] || null;
  };
  const walkPx = dpRaw ? pickWalkPx(dpRaw.face) : null;
  const dpPx = walkPx && walkPx.length
    ? walkPx
    : dp
      ? (dp.fr === "back" ? (backPixels.length ? backPixels : (sidePixels.length ? sidePixels : pixels))
                          : (sidePixels.length ? sidePixels : pixels))
      : pixels;
  const dpOff = dp ? arcPixelCenterOffset(dpPx, pixels) : { x: 0, y: 0 };
  const dpFlip = dpRaw?.face === "left";
  const showStoryBow = mode !== "final" && phase === "dialog" && storyBow;
  const bowBounds = showStoryBow ? arcHeroWorldBounds(dpPx, heroX, base, 1, false, 0, 0) : null;
  const bowX = bowBounds ? bowBounds.left - 13 : 0;
  const bowY = bowBounds ? bowBounds.top + 33 : 0;

  const etherCy = base - etherH / 2;
  const waveR = waveT > 0 ? waveT * WAVE_SPEED : 0;
  const waveOp = waveT >= 0 && waveT < WAVE_MS ? 1 - waveT / WAVE_MS : 0;
  const waveEls = waveOp > 0 ? (
    <g pointerEvents="none">
      <circle cx={etherCx} cy={etherCy} r={waveR} fill="none" stroke="#000" strokeWidth="7" opacity={waveOp * 0.92} />
      <circle cx={etherCx} cy={etherCy} r={waveR + 4.5} fill="none" stroke="#fff" strokeWidth="2" opacity={waveOp * 0.85} />
      <circle cx={etherCx} cy={etherCy} r={Math.max(0, waveR - 4.5)} fill="none" stroke="#fff" strokeWidth="2" opacity={waveOp * 0.6} />
    </g>
  ) : null;

  const T_IP = base - 175;
  const beamColor = mode === "intro" ? "#000000" : accent;
  const beamOn = waveR >= towerX - etherCx - 30;
  const beamEls = beamOn ? (
    <g pointerEvents="none" filter="url(#arcBeamSoft)">
      {[{ w: 34, o: 0.16, c: beamColor }, { w: 22, o: 0.30, c: "#ffffff" }, { w: 12, o: 0.58, c: "#ffffff" }, { w: 6, o: 0.95, c: beamColor }].map((b, i) => (
        <rect key={i} x={towerX - b.w / 2} y={T_IP} width={b.w} height={0} fill={b.c} opacity={b.o}>
          <animate attributeName="y" from={T_IP} to={vb.y} dur="0.45s" fill="freeze" />
          <animate attributeName="height" from={0} to={T_IP - vb.y} dur="0.45s" fill="freeze" />
        </rect>
      ))}
    </g>
  ) : null;

  if (mode === "final" && phase === "arrive") {
    const baseP = finaleRoadPoint(ARRIVE_T, vb);
    const s0 = 1 - 0.72 * ARRIVE_T;
    const spread0 = 1 - 0.35 * ARRIVE_T;
    const groupX = baseP.x + ARRIVE_GROUP_DX * s0;
    const beamP = { x: baseP.x - 88 * s0, y: baseP.y + 4 };

    const beamIn = Math.min(1, arriveT / 500);
    const beamOut = arriveT > ARRIVE_TOTAL - ARRIVE_BEAM_OUT
      ? Math.max(0, (ARRIVE_TOTAL - arriveT) / ARRIVE_BEAM_OUT)
      : 1;
    const beamOp = beamIn * beamOut;

    const heroOp = Math.min(1, arriveT / ARRIVE_FADE);
    const hpRaw = Math.max(0, Math.min(1, (arriveT - ARRIVE_FADE) / ARRIVE_WALK));
    const hp = hpRaw * hpRaw * (3 - 2 * hpRaw);
    const heroX = beamP.x + (groupX - beamP.x) * hp;
    const heroY = beamP.y + (baseP.y - beamP.y) * hp;
    const heroWalkPixels = sidePixels.length ? sidePixels : pixels;

    return (
      <g className="rf-cutscene-layer">
        <defs>
          <linearGradient id="arcArriveBeamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#aa00ff" stopOpacity="0.05" />
            <stop offset="35%" stopColor="#00ffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
          </linearGradient>
          <radialGradient id="arcArrivePoolGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#00ffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#aa00ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {beamOp > 0 && (
          <g pointerEvents="none" opacity={beamOp}>
            <rect x={beamP.x - 42} y={vb.y} width={84} height={Math.max(0, beamP.y - vb.y)} fill="url(#arcArriveBeamGrad)" />
            <rect x={beamP.x - 8} y={vb.y} width={16} height={Math.max(0, beamP.y - vb.y)} fill="#ffffff" opacity="0.55" />
            <ellipse cx={beamP.x} cy={beamP.y} rx={78} ry={20} fill="url(#arcArrivePoolGrad)" />
            <ellipse cx={beamP.x} cy={beamP.y} rx={42} ry={10} fill="#ffffff" opacity="0.35" />
          </g>
        )}

        <g className="friend-cyber rf-cyber-root">
          {FINALE_MEMBERS.slice(1).map((m, i) => (
            <ArcHero key={"ag-" + i} pixels={sidePixels.length ? sidePixels : pixels}
              x={groupX + m.lat * spread0 * s0}
              base={baseP.y + m.dy * spread0 * s0}
              scaleMul={s0} op={1} flip />
          ))}
          {heroOp > 0.01 && (
            <AnimatedArcHero
              pixels={heroWalkPixels}
              walkFrames={rightWalkFrames}
              walking={hpRaw > 0.02 && hpRaw < 0.98}
              x={heroX}
              base={heroY}
              scaleMul={s0}
              op={heroOp}
            />
          )}
        </g>
      </g>
    );
  }

  if (phase === "depart") {
    return (
      <g className="rf-cutscene-layer">
        <defs>
        <filter id="arcBeamSoft" x="-140%" y="-20%" width="380%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="ab" />
          <feComponentTransfer in="ab" result="aba"><feFuncA type="linear" slope="0.72" /></feComponentTransfer>
          <feMerge><feMergeNode in="aba" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        </defs>
        {beamEls}
        <g opacity={mode === "intro" ? 0.5 : 1}><ArcTower x={towerX} base={base} /></g>
        {(!dp || dp.ho > 0) && <ArcHero pixels={dpPx} x={heroX} base={base} offX={dp?.ox ?? 0} offY={dp?.oy ?? 0} shiftX={dpOff.x} shiftY={dpOff.y} scaleMul={dp?.sm ?? 1} op={dp?.ho ?? 1} flip={dpFlip} />}
        {dp && dp.bo > 0 && (() => {
          const blobY = T_IP + dp.by;
          return (
            <g opacity={dp.bo}>
              <g filter="url(#arcBeamSoft)">
                <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke={beamColor} strokeWidth="34" opacity="0.16" strokeLinecap="round" />
                <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke="#ffffff" strokeWidth="22" opacity="0.30" strokeLinecap="round" />
                <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke="#ffffff" strokeWidth="12" opacity="0.58" strokeLinecap="round" />
                <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke={beamColor} strokeWidth="6" opacity="0.95" strokeLinecap="round" />
              </g>
              <circle cx={towerX} cy={blobY} r="12" fill={accent} opacity="0.35" />
              <rect x={towerX - 7} y={blobY - 7} width={14} height={14} fill="#000" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
            </g>
          );
        })()}
      </g>
    );
  }

  const titlesOn = finaleDone && finaleProg >= Math.max(1, lines.length - 3) + 2;

  return (
    <g className="rf-cutscene-layer">
      <defs>
        <filter id="arcBeamSoft" x="-140%" y="-20%" width="380%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="ab" />
          <feComponentTransfer in="ab" result="aba"><feFuncA type="linear" slope="0.72" /></feComponentTransfer>
          <feMerge><feMergeNode in="aba" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {mode !== "final" && <g style={fade(1)}><EtherLogo x={etherLeft} y={base - etherH} width={etherW} /></g>}
      {mode === "final" && (() => {
        const step = finaleProg;
        const horizonStep = Math.max(1, lines.length - 3);
        const approach = Math.max(0, Math.min(1, step / horizonStep));
        const beyond = Math.max(0, step - horizonStep);
        const walk = ARRIVE_T + (1 - ARRIVE_T) * approach;
        const wp = (walk - ARRIVE_T) / Math.max(0.01, 1 - ARRIVE_T);
        const spread = 1 - 0.25 * Math.max(0, Math.min(1, wp));
        const p = finaleRoadPoint(walk, vb);
        const s = 1 - 0.72 * walk;

        const sinkH = 150 * ARC_HERO_S * s;
        const dip = Math.min(1.2, beyond / 2);
        const sinking = beyond > 0.0005;

        const k = 1 - Math.pow(approach, 3);

        const skyPoly = purpleRidgePoints(vb)
          .map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1))
          .concat([(vb.x + vb.w).toFixed(1) + "," + (vb.y - 20000).toFixed(0), vb.x.toFixed(1) + "," + (vb.y - 20000).toFixed(0)])
          .join(" ");

        return (
          <g>
            <defs>
              <clipPath id="arcHorizonClip">
                <polygon points={skyPoly} />
              </clipPath>
            </defs>
            <g className="friend-cyber rf-cyber-root" clipPath={sinking ? "url(#arcHorizonClip)" : undefined}>
              {FINALE_MEMBERS.map((m, i) => {
                const x = p.x + (ARRIVE_GROUP_DX + m.lat * spread) * s * k;
                const dy = m.dy * spread * s * (1 - approach);

                const hy = purpleHorizonY(vb, (x - vb.x) / vb.w);
                const base = sinking ? hy + sinkH * dip : p.y + dy;
                return (
                  <AnimatedArcHero
                    key={"fm-" + i}
                    pixels={sidePixels.length ? sidePixels : pixels}
                    walkFrames={rightWalkFrames}
                    walking={approach > 0.001 && approach < 0.995 && !sinking && finaleVelRef.current > 0.0002}
                    x={x}
                    base={base}
                    scaleMul={s}
                    op={1}
                  />
                );
              })}
            </g>
            {}
            {TREES.filter(([fx, fy]) => vb.y + fy * vb.h > p.y).map(([fx, fy, sc, delay], i) => (
              <Tree key={"trf-" + i} x={vb.x + fx * vb.w} y={vb.y + fy * vb.h} sc={sc} delay={delay} still={false} />
            ))}
            {CRYSTALS.filter(([fx, fy]) => vb.y + fy * vb.h > p.y).map(([fx, fy, sc, delay], i) => (
              <Crystal key={"crf-" + i} x={vb.x + fx * vb.w} y={vb.y + fy * vb.h} sc={sc} delay={delay} still={false} />
            ))}
          </g>
        );
      })()}
      {mode !== "final" && (!dp || dp.ho > 0) && <ArcHero pixels={dpPx} x={heroX} base={base} offX={dp?.ox ?? 0} offY={dp?.oy ?? 0} shiftX={dpOff.x} shiftY={dpOff.y} scaleMul={dp?.sm ?? 1} op={dp?.ho ?? 1} flip={dpFlip} />}
      {showStoryBow && bowBounds && <ArcBow x={bowX} y={bowY} dir={-1} op={dp?.ho ?? 1} />}
      {dp && dp.bo > 0 && (() => {
        const blobY = T_IP + dp.by;
        return (
          <g opacity={dp.bo}>
            <g filter="url(#arcBeamSoft)">
              <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke={beamColor} strokeWidth="34" opacity="0.16" strokeLinecap="round" />
              <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke="#ffffff" strokeWidth="22" opacity="0.30" strokeLinecap="round" />
              <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke="#ffffff" strokeWidth="12" opacity="0.58" strokeLinecap="round" />
              <line x1={towerX} y1={T_IP} x2={towerX} y2={blobY} stroke={beamColor} strokeWidth="6" opacity="0.95" strokeLinecap="round" />
            </g>
            <circle cx={towerX} cy={blobY} r="12" fill={accent} opacity="0.35" />
            <rect x={towerX - 7} y={blobY - 7} width={14} height={14} fill="#000" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
          </g>
        );
      })()}
      {waveEls}
      {beamEls}
      {mode !== "final" && <g style={fade(1)}><g opacity={mode === "intro" ? 0.5 : 1}><ArcTower x={towerX} base={base} /></g></g>}

      {!titlesOn && (
      <g>
        <path d={tailPath} fill="#000" stroke="#fff" strokeWidth="3" strokeLinejoin="round" shapeRendering="auto" />

        {speakerName && (
          mode === "final" ? (
            <text x={bx + 18} y={by + 30}
              fill="#00ffff"
              fontFamily="'Courier New', Courier, monospace" fontSize="14" fontWeight="900">
              <animate attributeName="fill" values="#00ffff;#ff2bd6;#ccff00;#aa00ff;#00ffff" dur="2.2s" repeatCount="indefinite" />
              {speakerName}
            </text>
          ) : (
            <text x={bx + 18} y={by + 30}
              fill={who === "elder" ? "#ccff00" : "#fff"}
              fontFamily="'Courier New', Courier, monospace" fontSize="14" fontWeight="900">
              {speakerName}
            </text>
          )
        )}
        {page.map((s, i) => (
          <text key={"al-" + i} x={bx + 18} y={by + TEXT_TOP + i * STEP}
            fill={"#fff"}
            fontFamily="'Courier New', Courier, monospace" fontSize="16"
            >
            {s}
          </text>
        ))}

        {showButtons && (
          <>
            <g className="rf-arc-back" role="button" aria-label={backLabel} style={{ pointerEvents: canBack ? "auto" : "none", cursor: canBack ? "pointer" : "default", opacity: canBack ? 1 : 0.35 }}>
              <rect x={backX} y={btnY} width={backW} height="32" fill="#111" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
              <text x={backX + backW / 2} y={btnTextY} textAnchor="middle" fill="#fff" fontFamily="'Courier New', Courier, monospace" fontSize="14" fontWeight="900">{backLabel}</text>
            </g>
            <g className="rf-arc-next" role="button" style={{ pointerEvents: "auto", cursor: "pointer" }}>
              <rect x={nextX} y={btnY} width={nextW} height="32" fill="#111" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
              <text x={nextX + nextW / 2} y={btnTextY} textAnchor="middle" fill="#fff" fontFamily="'Courier New', Courier, monospace" fontSize="14" fontWeight="900">{nextLabel}</text>
            </g>
            <g className="rf-arc-skip" role="button" style={{ pointerEvents: "auto", cursor: "pointer" }}>
              <rect x={skipX} y={btnY} width={skipW} height="32" fill="#111" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
              <text x={skipX + skipW / 2} y={btnTextY} textAnchor="middle" fill="#fff" fontFamily="'Courier New', Courier, monospace" fontSize="14" fontWeight="900">{skipLabel}</text>
            </g>
          </>
        )}
      </g>
      )}

      {titlesOn && (() => {
        const rows = ["RHRF BULLSEYE", "", translate(lang, "arc.title.line", undefined, "The Cyber hero returned home and became a legend"), "", translate(lang, "arc.title.credit", undefined, "made by @mdesoc_eth · ftw qwen 3.8")];
        const label = translate(lang, "arc.title.exit", undefined, "EXIT");
        const ebw = Math.max(130, label.length * 15 + 44);
        const ecx = vb.x + vb.w / 2;
        const ecy = vb.y + vb.h * 0.74;
        return (
          <g pointerEvents="none" className="rf-cyber-root">
            <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#000" opacity={0.55} />
            {rows.map((s, i) => {
              const fontSize = i === 0 ? 30 : i === rows.length - 1 ? 17 : 18;
              const lineY = vb.y + vb.h * 0.30 + i * 38;
              const fill = i === 0 ? "var(--cyber-fill, #aa00ff)" : i === rows.length - 1 ? "#ccff00" : "#fff";
              const titleWidth = s.length * fontSize * 0.6;
              return (
                <g key={"tr-" + i}>
                  <text x={ecx} y={lineY} textAnchor="middle" fill={fill}
                    fontFamily="'Courier New', Courier, monospace" fontSize={fontSize} fontWeight="900">{s}</text>
                  
                </g>
              );
            })}
            <g className="rf-arc-exit" role="button" aria-label={label} style={{ pointerEvents: "auto", cursor: "pointer" }}>
              <rect x={ecx - ebw / 2} y={ecy} width={ebw} height={40} fill="#111" stroke="#fff" strokeWidth="2" shapeRendering="crispEdges" />
              <text x={ecx} y={ecy + 27} textAnchor="middle" fill="#fff"
                fontFamily="'Courier New', Courier, monospace" fontSize="18" fontWeight="900">{label}</text>
            </g>
          </g>
        );
      })()}

      {titlesOn && <CyberFireworks vb={vb} />}
    </g>
  );
}
