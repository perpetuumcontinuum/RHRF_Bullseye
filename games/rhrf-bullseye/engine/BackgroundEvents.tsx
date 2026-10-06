import { JUMP_SAFE_START_MS, JUMP_SAFE_END_MS } from "./jump";
import React, { useEffect, useRef, useState } from "react";
import { PLAYER_X, PLAYER_WIDTH } from "./geometry";

const GHOST_FRONT = 5;
const GHOST_START = 1155;
const GHOST_END = -155;
const GHOST_BASE_SPEED = 1300 / 6;
const COLLIDE_X = PLAYER_X + PLAYER_WIDTH - GHOST_FRONT;

const GHOST_BODY_MIN = 5;
const GHOST_BODY_MAX = 50;
const GHOST_BODY_LEN = GHOST_BODY_MAX - GHOST_BODY_MIN;
const GHOST_LETHAL_RATIO = 0.96;
const GHOST_LETHAL_PAD = (GHOST_BODY_LEN * (1 - GHOST_LETHAL_RATIO)) / 2;
const GHOST_LETHAL_MIN = GHOST_BODY_MIN + GHOST_LETHAL_PAD;
const GHOST_LETHAL_MAX = GHOST_BODY_MAX - GHOST_LETHAL_PAD;

const GHOST_SAFETY_MS = 9000;
const GHOST_MIN_DELAY = 30000;
const GHOST_MAX_DELAY = 42000;

const SAT_MIN_DELAY = 150000;
const SAT_MAX_DELAY = 210000;
const SAT_PASS_MS = 6000;
const SAT_HIDE_MS = 6900;

const roll = (min: number, max: number) => min + Math.random() * (max - min);

export default function BackgroundEvents() {
  const [ghostX, setGhostX] = useState<number | null>(null);
  const [ghostHit, setGhostHit] = useState(false);
  const [satelliteActive, setSatelliteActive] = useState(false);
  const [satelliteSignal, setSatelliteSignal] = useState(false);

  // Pause-aware spawn: acc grows ONLY while unpaused, so a hidden tab never
  // burns the delay. The ghost cannot be "waiting to run" on resume.
  const waitRef = useRef({ acc: 0, delay: roll(GHOST_MIN_DELAY, GHOST_MAX_DELAY), last: 0, raf: 0 });
  const gRef = useRef({ active: false, x: GHOST_START, speed: GHOST_BASE_SPEED, hit: false, elapsed: 0, last: 0, raf: 0 });
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const addTimer = (id: number) => timersRef.current.push(id);

    const startGhost = () => {
      const g = gRef.current;
      g.active = true;
      g.x = GHOST_START;
      g.speed = GHOST_BASE_SPEED;
      g.hit = false;
      g.elapsed = 0;
      g.last = performance.now();
      setGhostX(GHOST_START);
      setGhostHit(false);

      const finish = () => {
        cancelAnimationFrame(g.raf);
        g.active = false;
        setGhostX(null);
        const w = waitRef.current;
        w.acc = 0;
        w.delay = roll(GHOST_MIN_DELAY, GHOST_MAX_DELAY);
      };

      const step = (now: number) => {
        const dt = (now - g.last) / 1000;
        g.last = now;

        if ((window as any).__RHRF_IS_PAUSED__) {
          g.raf = requestAnimationFrame(step);
          return;
        }

        g.elapsed += dt;
        g.x -= g.speed * dt;

        const overlapsX = g.x + GHOST_LETHAL_MAX > PLAYER_X && g.x + GHOST_LETHAL_MIN < PLAYER_X + PLAYER_WIDTH;
        const ghostLeaving = g.x + GHOST_LETHAL_MAX <= PLAYER_X;

        if (!g.hit && overlapsX) {
          const fallen = Boolean((window as any).__RHRF_IS_FALLEN__);
          const jumping = Boolean((window as any).__RHRF_IS_JUMPING__);
          const jumpStart = Number((window as any).__RHRF_JUMP_STARTED_AT__ || 0);
          const elapsed = jumpStart > 0 ? Date.now() - jumpStart : Infinity;
          const safelyAirborne = jumping && !fallen
            && elapsed >= JUMP_SAFE_START_MS
            && elapsed <= JUMP_SAFE_END_MS;

          if (!safelyAirborne) {
            g.hit = true;
            g.speed *= 2;
            setGhostHit(true);
            window.dispatchEvent(new CustomEvent("rhrf-ghost-hit"));
            window.dispatchEvent(new CustomEvent("rhrf-bull-hit"));
          }
        }

        if (!g.hit && ghostLeaving) {
          g.hit = true;
          window.dispatchEvent(new CustomEvent("rhrf-ghost-dodged"));
        }

        setGhostX(g.x);

        if (g.x <= GHOST_END || g.elapsed >= GHOST_SAFETY_MS / 1000) {
          finish();
          return;
        }
        g.raf = requestAnimationFrame(step);
      };

      g.raf = requestAnimationFrame(step);
    };

    const waitTick = (now: number) => {
      const w = waitRef.current;
      const dt = now - w.last;
      w.last = now;
      if (!(window as any).__RHRF_IS_PAUSED__) w.acc += dt;
      if (!gRef.current.active && w.acc >= w.delay) startGhost();
      w.raf = requestAnimationFrame(waitTick);
    };
    waitRef.current.last = performance.now();
    waitRef.current.raf = requestAnimationFrame(waitTick);

    // Satellite stays on real-time timers (cosmetic, not gameplay-critical)
    const scheduleSatellite = () => {
      const id = window.setTimeout(() => {
        setSatelliteActive(true);
        setSatelliteSignal(false);
        const pass = window.setTimeout(() => {
          setSatelliteSignal(true);
          window.dispatchEvent(new CustomEvent("rhrf-satellite-pass"));
        }, SAT_PASS_MS);
        const hide = window.setTimeout(() => {
          setSatelliteSignal(false);
          setSatelliteActive(false);
          scheduleSatellite();
        }, SAT_HIDE_MS);
        addTimer(pass); addTimer(hide);
      }, roll(SAT_MIN_DELAY, SAT_MAX_DELAY));
      addTimer(id);
    };
    scheduleSatellite();

    return () => {
      cancelAnimationFrame(waitRef.current.raf);
      cancelAnimationFrame(gRef.current.raf);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const ghostStroke = ghostHit ? "#ff0000" : "#00ffff";

  return (
    <>
      {ghostX !== null && (
        <g transform={`translate(${ghostX}, 450)`}>
          <g transform="translate(55,0) scale(-1,1)">
            <path
              d="M 10,25 L 15,15 L 25,15 L 30,10 L 45,10 L 50,15 L 50,30 L 45,35 L 35,35 L 30,30 L 20,35 L 10,35 L 5,25 Z"
              fill="none"
              stroke={ghostStroke}
              strokeWidth="2.5"
              filter="url(#neonGlowCyan)"
            />
            <path d="M 25,15 L 22,5 M 30,10 L 33,2" stroke={ghostStroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M 10,25 Q 0,20 5,15" fill="none" stroke={ghostStroke} strokeWidth="1.5" />
            <circle cx="42" cy="18" r="1.5" fill="#ccff00" />
          </g>
        </g>
      )}

      {satelliteActive && (
        <>
          <g transform="translate(0, 190)">
            <g className="anim-fly-left" style={{ transformBox: 'fill-box' }}>
              <line x1="0" y1="10" x2="30" y2="10" stroke="#00ffff" strokeWidth="2" filter="url(#neonGlowCyan)" />
              <circle cx="15" cy="10" r="5" fill="#0a0014" stroke="#00ffff" strokeWidth="1.5" />
              <rect x="2" y="4" width="6" height="12" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.7" />
              <rect x="22" y="4" width="6" height="12" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.7" />
              <circle cx="15" cy="10" r="2" fill="#ff0000">
                <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
          {satelliteSignal && (
            <rect className="sat-beam-css" x="187" y="200" width="6" height="40" fill="#ccff00" />
          )}
        </>
      )}
    </>
  );
}