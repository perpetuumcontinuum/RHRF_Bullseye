import React, { useEffect, useRef, useState } from "react";

const PLAYER_X = 240;
const PLAYER_WIDTH = 80;
const GHOST_FRONT = 5;
const GHOST_START = 1155;
const GHOST_END = -155;
const GHOST_BASE_SPEED = 1300 / 6;
const COLLIDE_X = PLAYER_X + PLAYER_WIDTH - GHOST_FRONT;

const GHOST_SAFETY_MS = 9000;
const GHOST_MIN_DELAY = 30000;
const GHOST_MAX_DELAY = 42000;

const SAT_MIN_DELAY = 45000;
const SAT_MAX_DELAY = 90000;
const SAT_PASS_MS = 6000;
const SAT_HIDE_MS = 6900;

export default function BackgroundEvents() {
  const [ghostX, setGhostX] = useState<number | null>(null);
  const [ghostHit, setGhostHit] = useState(false);
  const [satelliteActive, setSatelliteActive] = useState(false);
  const [satelliteSignal, setSatelliteSignal] = useState(false);

  const ghostRef = useRef({
    raf: 0,
    x: GHOST_START,
    speed: GHOST_BASE_SPEED,
    hit: false,
    last: 0,
  });

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const addTimer = (id: number) => {
      timersRef.current.push(id);
    };

    const scheduleGhost = () => {
      // Do not spawn new ghosts while paused; let existing ones finish their path honestly
            const delay = GHOST_MIN_DELAY + Math.random() * (GHOST_MAX_DELAY - GHOST_MIN_DELAY);
      const id = window.setTimeout(() => startGhost(), delay);
      addTimer(id);
    };

    const startGhost = () => {
      const g = ghostRef.current;

      g.x = GHOST_START;
      g.speed = GHOST_BASE_SPEED;
      g.hit = false;
      g.last = performance.now();

      setGhostX(GHOST_START);
      setGhostHit(false);

      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(g.raf);
        if (!g.hit) window.dispatchEvent(new CustomEvent("rhrf-ghost-dodged"));
        setGhostX(null);
        scheduleGhost();
      };

      const step = (now: number) => {
        const dt = (now - g.last) / 1000;
        g.last = now;
        g.x -= g.speed * dt;

        if (!g.hit && g.x <= COLLIDE_X) {
          g.hit = true;
          g.speed *= 2;
          setGhostHit(true);
          const __rhrfGhostFallen = Boolean((window as any).__RHRF_IS_FALLEN__);
          const __rhrfGhostJumping = Boolean((window as any).__RHRF_IS_JUMPING__);
          if (__rhrfGhostFallen) {
            g.hit = true;
          } else if (!__rhrfGhostJumping) {
            g.hit = true;
            window.dispatchEvent(new CustomEvent("rhrf-ghost-hit"));
          }
          window.dispatchEvent(new CustomEvent("rhrf-bull-hit"));
        }

        setGhostX(g.x);

        if (g.x <= GHOST_END) {
          finish();
          return;
        }

        g.raf = requestAnimationFrame(step);
      };

      g.raf = requestAnimationFrame(step);

      const safety = window.setTimeout(finish, GHOST_SAFETY_MS);
      addTimer(safety);
    };

    const scheduleSatellite = () => {
      const delay = SAT_MIN_DELAY + Math.random() * (SAT_MAX_DELAY - SAT_MIN_DELAY);
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

        addTimer(pass);
        addTimer(hide);
      }, delay);

      addTimer(id);
    };

    scheduleGhost();
    scheduleSatellite();

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      cancelAnimationFrame(ghostRef.current.raf);
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
            <path
              d="M 25,15 L 22,5 M 30,10 L 33,2"
              stroke={ghostStroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 10,25 Q 0,20 5,15"
              fill="none"
              stroke={ghostStroke}
              strokeWidth="1.5"
            />
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
            <rect
              className="sat-beam-css"
              x="187"
              y="200"
              width="6"
              height="40"
              fill="#ccff00"
            />
          )}
        </>
      )}
    </>
  );
}
