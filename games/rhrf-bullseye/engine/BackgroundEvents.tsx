import { JUMP_SAFE_START_MS, JUMP_SAFE_END_MS } from "./jump";
import React, { useEffect, useRef, useState } from "react";
import { PLAYER_X, PLAYER_WIDTH } from "./geometry";
import { isNftPlanet, getPlanetId, getPlanetAccent, getSatBeamColor, getPlanetTier, ghostSpeedMult, getLayout, heroLeftX } from "./planets/planetRuntime";

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
const ROBO_SHOT_CYCLE_MS = 1200; // aim 300 + flight 400 + resume 500 (index handleFire)
const ROBO_TICK_MS = 70;         // robo loop interval (index)

const GHOST_SAFETY_MS = 9000;
const GHOST_MIN_DELAY = 30000;
const GHOST_MAX_DELAY = 42000;

const SAT_MIN_DELAY = 150000;
const SAT_MAX_DELAY = 210000;
const SAT_PASS_MS = 6000;
const SAT_HIDE_MS = 6900;

const NFT_SAT_START_X = 1150;
const NFT_SAT_END_X = -150;

const NFT_SAT_SCREEN_Y = 190;
const NFT_SAT_SPEED = 1300 / 8;
const NFT_TOWER_X = 140;
const NFT_TOWER_TIP_Y = 305;
const NFT_SAT_BEAM_MS = 900;
const SAT_RISE_FACTOR = 0.9;

const CAMP_SAT_START_LEFT = -150;
const CAMP_SAT_START_RIGHT = 1150;
const CAMP_SAT_END_LEFT = -150;
const CAMP_SAT_END_RIGHT = 1150;
const CAMP_SAT_SPEED = 1300 / 8;
const CAMP_SAT_Y = 180;
const CAMP_SAT_BEAM_Y = 190;
const CAMP_SAT_DROP_PAD = 22;

const roll = (min: number, max: number) => min + Math.random() * (max - min);

function SatelliteArt({ body, glow, blink }: { body: string; glow: string; blink: string }) {
  return (
    <>
      <line x1="0" y1="10" x2="30" y2="10" stroke={body} strokeWidth="2" filter={glow} />
      <circle cx="15" cy="10" r="5" fill="#0a0014" stroke={body} strokeWidth="1.5" />
      <rect x="2" y="4" width="6" height="12" fill="none" stroke={body} strokeWidth="1" opacity="0.7" />
      <rect x="22" y="4" width="6" height="12" fill="none" stroke={body} strokeWidth="1" opacity="0.7" />
      <circle cx="15" cy="10" r="2" fill={blink}>
        <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
      </circle>
    </>
  );
}

export default function BackgroundEvents() {
  const nft = isNftPlanet();
  const getGhostDir = () => {
    const pid = getPlanetId();
    if (pid === "nft") return -1;
    return getLayout(pid).hero === "right" ? 1 : -1;
  };
  const [ghostX, setGhostX] = useState<number | null>(null);
  const [ghostHit, setGhostHit] = useState(false);
  const [satelliteActive, setSatelliteActive] = useState(false);
  const [satelliteSignal, setSatelliteSignal] = useState(false);
  const [nftSatX, setNftSatX] = useState<number | null>(null);
  const [nftSatSignal, setNftSatSignal] = useState(false);
  const [campSatX, setCampSatX] = useState<number | null>(null);
  const [campSatSignal, setCampSatSignal] = useState(false);

  const waitRef = useRef({ acc: 0, delay: roll(GHOST_MIN_DELAY, GHOST_MAX_DELAY), last: 0, raf: 0 });
  const gRef = useRef({ active: false, x: 1155, speed: 1300 / 6, hit: false, elapsed: 0, last: 0, raf: 0 });
  const timersRef = useRef<number[]>([]);
  const nftSatRef = useRef({ active: false, x: NFT_SAT_START_X, dropped: false, signaling: false, signalElapsed: 0, last: 0, raf: 0 });
  const satWaitRef = useRef({ acc: 0, delay: roll(SAT_MIN_DELAY, SAT_MAX_DELAY), last: 0, raf: 0 });
  const campSatRef = useRef({
    active: false,
    x: 0,
    dir: 1,
    dropped: false,
    signaling: false,
    signalElapsed: 0,
    last: 0,
    raf: 0,
  });
  const campWaitRef = useRef({ acc: 0, delay: roll(SAT_MIN_DELAY, SAT_MAX_DELAY), last: 0, raf: 0 });

  useEffect(() => {
    const addTimer = (id: number) => timersRef.current.push(id);

    const startGhost = () => {
      const g = gRef.current;
      const dir = getGhostDir();
      const startX = dir > 0 ? GHOST_END : GHOST_START;
      g.active = true;
      g.x = startX;
      g.speed = GHOST_BASE_SPEED * ghostSpeedMult(getPlanetTier(getPlanetId()));
      g.hit = false;
      g.elapsed = 0;
      g.last = performance.now();
      setGhostX(startX);
      setGhostHit(false);
      let popped = false;

      const finish = () => {
        cancelAnimationFrame(g.raf);
        g.active = false;
        (window as any).__RHRF_GHOST_JUMP_NOW__ = false;
        (window as any).__RHRF_GHOST_NO_FIRE__ = false;
        setGhostX(null);
        const w = waitRef.current;
        w.acc = 0;
        w.delay = roll(GHOST_MIN_DELAY, GHOST_MAX_DELAY);
      };

      const step = (now: number) => {
        const dt = (now - g.last) / 1000;
        g.last = now;

        if ((window as any).__RHRF_IS_PAUSED__ || (window as any).__RHRF_CUTSCENE__) {
          g.raf = requestAnimationFrame(step);
          return;
        }

        g.elapsed += dt;
        g.x += dir * g.speed * dt;

        const hx0 = heroLeftX(getPlanetId());
        const hx1 = hx0 + PLAYER_WIDTH;
        const overlapsX = g.x + GHOST_LETHAL_MAX > hx0 && g.x + GHOST_LETHAL_MIN < hx1;
        const ghostLeaving = dir > 0 ? g.x + GHOST_LETHAL_MIN >= hx1 : g.x + GHOST_LETHAL_MAX <= hx0;

        const enterX = dir > 0 ? hx0 - GHOST_LETHAL_MAX : hx1 - GHOST_LETHAL_MIN;
        const exitX = dir > 0 ? hx1 - GHOST_LETHAL_MIN : hx0 - GHOST_LETHAL_MAX;
        const distEnter = (enterX - g.x) * dir;
        const distExit = (exitX - g.x) * dir;
        const v = g.speed;
        (window as any).__RHRF_GHOST_JUMP_NOW__ =
          distEnter >= v * (JUMP_SAFE_START_MS / 1000) &&
          distExit <= v * (JUMP_SAFE_END_MS / 1000);
        (window as any).__RHRF_GHOST_NO_FIRE__ =
          distEnter < v * ((ROBO_SHOT_CYCLE_MS + 2 * ROBO_TICK_MS + JUMP_SAFE_START_MS) / 1000);

        const wr = Number((window as any).__RHRF_WAVE_R__ ?? -1);
        if (!popped && wr >= 0) {
          const o = (window as any).__RHRF_WAVE_ORIGIN__ as { x: number; y: number } | undefined;
          if (o) {
            const gcx = g.x + (GHOST_LETHAL_MIN + GHOST_LETHAL_MAX) / 2;
            if (Math.hypot(gcx - o.x, 450 - o.y) <= wr + 26) {
              popped = true;
              window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x: gcx, y: 450 } }));
              finish();
              return;
            }
          }
        }

        if (!g.hit && overlapsX) {
          const fallen = Boolean((window as any).__RHRF_IS_FALLEN__);
          const jumping = Boolean((window as any).__RHRF_IS_JUMPING__);
          const jumpStart = Number((window as any).__RHRF_JUMP_STARTED_AT__ || 0);
          const elapsed = jumpStart > 0 ? Date.now() - jumpStart : Infinity;
          const safelyAirborne = jumping && !fallen
            && elapsed >= JUMP_SAFE_START_MS
            && elapsed <= JUMP_SAFE_END_MS;

          if (!safelyAirborne && !(window as any).__RHRF_TOWER_SHIELD__) {
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

        if ((dir > 0 ? g.x >= GHOST_START : g.x <= GHOST_END) || g.elapsed >= GHOST_SAFETY_MS / 1000) {
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
      if (!(window as any).__RHRF_IS_PAUSED__ && !(window as any).__RHRF_CUTSCENE__ && getPlanetId() !== "rwa") w.acc += dt;
      if (!gRef.current.active && w.acc >= w.delay && getPlanetId() !== "rwa" && !(window as any).__RHRF_CUTSCENE__ && !(window as any).__RHRF_TOWER_SHIELD__) startGhost();
      w.raf = requestAnimationFrame(waitTick);
    };
    waitRef.current.last = performance.now();
    waitRef.current.raf = requestAnimationFrame(waitTick);

    function finishNftSatellite() {
      cancelAnimationFrame(nftSatRef.current.raf);
      nftSatRef.current.active = false;
      setNftSatX(null);
      setNftSatSignal(false);
      const w = satWaitRef.current;
      w.acc = 0;
      w.delay = roll(SAT_MIN_DELAY, SAT_MAX_DELAY);
      w.last = performance.now();
    }

    function startNftSatellite() {
      const sat = nftSatRef.current;
      sat.active = true;
      sat.x = NFT_SAT_START_X;
      sat.dropped = false;
      sat.signaling = false;
      sat.signalElapsed = 0;
      sat.last = performance.now();
      setNftSatX(NFT_SAT_START_X);
      setNftSatSignal(false);

      const step = (now: number) => {
        if (!sat.active) return;

        const dt = (now - sat.last) / 1000;
        sat.last = now;

        if ((window as any).__RHRF_CUTSCENE__) {
          sat.raf = requestAnimationFrame(step);
          return;
        }

        sat.x -= NFT_SAT_SPEED * dt;
        setNftSatX(sat.x);

        if (!sat.dropped && Math.abs(sat.x - NFT_TOWER_X) <= 22) {
          sat.dropped = true;
          sat.signaling = true;
          sat.signalElapsed = 0;
          setNftSatSignal(true);
          window.dispatchEvent(new CustomEvent("rhrf-satellite-pass"));
        }

        if (sat.signaling) {
          sat.signalElapsed += dt * 1000;
          if (sat.signalElapsed >= NFT_SAT_BEAM_MS) {
            sat.signaling = false;
            setNftSatSignal(false);
          }
        }

        if (sat.x <= NFT_SAT_END_X) {
          finishNftSatellite();
          return;
        }

        sat.raf = requestAnimationFrame(step);
      };

      sat.raf = requestAnimationFrame(step);
    }

    function scheduleSatellite() {
      if (nft) {
        const w = satWaitRef.current;
        w.acc = 0;
        w.delay = roll(SAT_MIN_DELAY, SAT_MAX_DELAY);
        w.last = performance.now();
        return;
      }

      const id = window.setTimeout(() => {
        if ((window as any).__RHRF_CUTSCENE__) {
          scheduleSatellite();
          return;
        }
        setSatelliteActive(true);
        setSatelliteSignal(false);

        const pass = window.setTimeout(() => {
          setSatelliteSignal(true);
          if (!rwa && getPlanetId() === "cyber") window.dispatchEvent(new CustomEvent("rhrf-satellite-pass"));
        }, SAT_PASS_MS);

        const hide = window.setTimeout(() => {
          setSatelliteSignal(false);
          setSatelliteActive(false);
          scheduleSatellite();
        }, SAT_HIDE_MS);

        addTimer(pass);
        addTimer(hide);
      }, roll(SAT_MIN_DELAY, SAT_MAX_DELAY));

      addTimer(id);
    }

    scheduleSatellite();

    const satWaitTick = (now: number) => {
      const w = satWaitRef.current;
      const dt = now - w.last;
      w.last = now;
      if (!(window as any).__RHRF_CUTSCENE__ && getPlanetId() !== "rwa") w.acc += dt;
      if (nft && !nftSatRef.current.active && w.acc >= w.delay && !(window as any).__RHRF_CUTSCENE__) startNftSatellite();
      w.raf = requestAnimationFrame(satWaitTick);
    };
    satWaitRef.current.last = performance.now();
    satWaitRef.current.raf = requestAnimationFrame(satWaitTick);

    return () => {
      cancelAnimationFrame(waitRef.current.raf);
      cancelAnimationFrame(gRef.current.raf);
      cancelAnimationFrame(nftSatRef.current.raf);
      cancelAnimationFrame(satWaitRef.current.raf);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const isCampSatPlanet = () => {
      const pid = getPlanetId();
      return pid === "nft" || pid === "bitcoin";
    };

    const finishCampSat = () => {
      cancelAnimationFrame(campSatRef.current.raf);
      campSatRef.current.active = false;
      setCampSatX(null);
      setCampSatSignal(false);
      const w = campWaitRef.current;
      w.acc = 0;
      w.delay = roll(SAT_MIN_DELAY, SAT_MAX_DELAY);
      w.last = performance.now();
    };

    const startCampSat = () => {
      const pid = getPlanetId();
      const towerRight = getLayout(pid).tower === "right";
      const sat = campSatRef.current;

      sat.active = true;
      sat.dir = towerRight ? 1 : -1;
      sat.x = towerRight ? CAMP_SAT_START_LEFT : CAMP_SAT_START_RIGHT;
      sat.dropped = false;
      sat.signaling = false;
      sat.signalElapsed = 0;
      sat.last = performance.now();

      setCampSatX(sat.x);
      setCampSatSignal(false);

      const step = (now: number) => {
        if (!sat.active) return;

        const dt = (now - sat.last) / 1000;
        sat.last = now;

        if ((window as any).__RHRF_CUTSCENE__) {
          sat.raf = requestAnimationFrame(step);
          return;
        }

        const currentPid = getPlanetId();
        if (currentPid !== "nft" && currentPid !== "bitcoin") {
          finishCampSat();
          return;
        }

        sat.x += sat.dir * CAMP_SAT_SPEED * dt;
        setCampSatX(sat.x);

        const towerX = getLayout(currentPid).tower === "right" ? 860 : 140;

        if (!sat.dropped && Math.abs(sat.x - towerX) <= CAMP_SAT_DROP_PAD) {
          sat.dropped = true;
          sat.signaling = true;
          sat.signalElapsed = 0;
          setCampSatSignal(true);
          window.dispatchEvent(new CustomEvent("rhrf-satellite-pass"));
        }

        if (sat.signaling) {
          sat.signalElapsed += dt * 1000;
          if (sat.signalElapsed >= NFT_SAT_BEAM_MS) {
            sat.signaling = false;
            setCampSatSignal(false);
          }
        }

        if (
          (sat.dir > 0 && sat.x >= CAMP_SAT_END_RIGHT) ||
          (sat.dir < 0 && sat.x <= CAMP_SAT_END_LEFT)
        ) {
          finishCampSat();
          return;
        }

        sat.raf = requestAnimationFrame(step);
      };

      sat.raf = requestAnimationFrame(step);
    };

    const campTick = (now: number) => {
      const w = campWaitRef.current;
      const dt = now - w.last;
      w.last = now;
      if (!(window as any).__RHRF_CUTSCENE__ && getPlanetId() !== "rwa") w.acc += dt;
      if (isCampSatPlanet() && !campSatRef.current.active && w.acc >= w.delay && !(window as any).__RHRF_CUTSCENE__) {
        startCampSat();
      }
      w.raf = requestAnimationFrame(campTick);
    };

    campWaitRef.current.last = performance.now();
    campWaitRef.current.raf = requestAnimationFrame(campTick);

    return () => {
      cancelAnimationFrame(campWaitRef.current.raf);
      cancelAnimationFrame(campSatRef.current.raf);
    };
  }, []);

  useEffect(() => {
    const onTowerPurge = () => {
      try {
        const g = gRef.current as any;
        g.active = false;
        g.hit = false;
        setGhostX(null);
        setGhostHit(false);
      } catch {}
    };
    window.addEventListener("rhrf-tower-purge", onTowerPurge);
    return () => window.removeEventListener("rhrf-tower-purge", onTowerPurge);
  }, []);

  const ghostStroke = ghostHit ? "#ff0000" : "#00ffff";
  const pidForSatBeam = getPlanetId();
  const cyberGreat = pidForSatBeam === "cyber" && Boolean((window as any).__RHRF_GREAT_ACTIVE__);
  const cyberMetal = pidForSatBeam === "cyber" && !cyberGreat && Boolean((window as any).__RHRF_ROBO_ACTIVE__);
  const satBeam =
    cyberGreat ? "#d6b45a" :
    cyberMetal ? "#8f99a6" :
    pidForSatBeam === "cyber" ? "#ccff00" :
    pidForSatBeam === "bitcoin" ? "var(--rf-beam-color)" :
    pidForSatBeam === "nft" ? "#aa00ff" :
    pidForSatBeam === "stable" ? "#ccff00" :
    "#00ffff";
  const rwa = getPlanetId() === "rwa";
  const billColor = getPlanetAccent(getPlanetId()) || "#00ffff";

  return (
    <>
      {ghostX !== null && (
        <g transform={`translate(${ghostX}, 450)`}>
          {getPlanetId() === "nft" ? (

            <g fill="none" strokeWidth="2.2" strokeLinejoin="round">
              <rect x="48" y="4" width="4" height="28" rx="1" stroke={ghostHit ? "#ff0000" : "#00ffff"}/>
              <rect x="20" y="2" width="28" height="32" rx="1.5" stroke={ghostHit ? "#ff0000" : "#aa00ff"}/>
              <g stroke={ghostHit ? "#ff6666" : "#aa00ff"} strokeWidth="1.4" opacity="0.75">
                <line x1="22" y1="10" x2="46" y2="10"/>
                <line x1="22" y1="18" x2="44" y2="18"/>
                <line x1="24" y1="26" x2="46" y2="26"/>
              </g>
              <g stroke={ghostHit ? "#ff9999" : "#cc77ff"} strokeWidth="1.4" opacity="0.6">
                <path d="M26 8 q3 2 0 6"/>
                <path d="M38 22 q3 -2 1 6"/>
                <line x1="30" y1="28" x2="36" y2="28"/>
              </g>
              <polygon points="20,2 20,34 12,26 12,10" stroke={ghostHit ? "#ff0000" : "#aa00ff"}/>
              <polygon points="12,10 12,26 6,21 6,15" stroke={ghostHit ? "#ff0000" : "#aa00ff"}/>
              <polygon points="6,15 6,21 3,18" stroke={ghostHit ? "#ff3333" : "#aa00ff"}/>
              <line x1="4" y1="16.8" x2="7" y2="16.8" stroke={ghostHit ? "#ffaaaa" : "#e6ccff"} strokeWidth="1.2" opacity="0.85"/>
            </g>
          ) : getPlanetId() === "bitcoin" ? (

          <g transform="translate(27, 16) scale(1.2) translate(-27, -16)">
            <rect x="5" y="2" width="45" height="28" rx="3" fill={ghostHit ? "#3a0a0a" : billColor} fillOpacity={ghostHit ? 1 : 0.22} stroke={ghostHit ? "#ff0000" : billColor} strokeWidth="1.5" />
            <rect x="9" y="6" width="37" height="20" rx="2" fill="none" stroke={ghostHit ? "#ff6666" : billColor} strokeWidth="0.8" opacity="0.7" />
            <text x="27" y="22" textAnchor="middle" fontFamily="monospace" fontSize="18" fontWeight="bold" fill={ghostHit ? "#ff4444" : billColor}>$</text>
            <circle cx="13" cy="10" r="2" fill={ghostHit ? "#ff0000" : billColor} opacity="0.8" />
            <circle cx="42" cy="22" r="2" fill={ghostHit ? "#ff0000" : billColor} opacity="0.8" />
          </g>
        ) : nft ? (

            <g transform="translate(27,18)">
              <circle r="16" fill={ghostHit ? "#ff0000" : billColor} fillOpacity="0.14" stroke={ghostHit ? "#ff0000" : billColor} strokeWidth="2" filter="url(#wideGlowYellow)" />
              <circle r="11" fill="none" stroke={ghostHit ? "#ff6666" : billColor} strokeWidth="1.2" opacity="0.8" />
              <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="13" fill={ghostHit ? "#ff0000" : billColor} stroke={ghostHit ? "#5a0000" : "none"} strokeWidth={ghostHit ? 0.6 : 0}>$1</text>
            </g>
          ) : (
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
          )}
        </g>
      )}

      {getPlanetId() === "cyber" && satelliteActive && (
        <>
          <g transform="translate(0, 190)">
            <g className="anim-fly-left" style={{ transformBox: 'fill-box', animationDirection: getPlanetId() === "nft" ? "normal" : getLayout(getPlanetId()).tower === "right" ? "reverse" : "normal" }}>
              {getPlanetId() === "nft" ? (
              <SatelliteArt body="#aa00ff" glow="url(#neonGlowPink)" blink="#00ffff" />
            ) : getPlanetId() === "bitcoin" ? (

              <g transform="scale(1,-1)">
                <SatelliteArt body="#F7931A" glow="url(#neonGlowYellow)" blink="#00ffff" />
              </g>
            ) : (
              <SatelliteArt body="#00ffff" glow="url(#neonGlowCyan)" blink="#ff0000" />
            )}
            </g>
          </g>
          {satelliteSignal && (
            <rect className="sat-beam-css" x="187" y="200" width="6" height="40" fill={satBeam} />
          )}
        </>
      )}

      {(getPlanetId() === "nft" || getPlanetId() === "bitcoin") && campSatX !== null && (
        <>
          <g transform={`translate(${campSatX}, ${CAMP_SAT_Y})`}>
            {getPlanetId() === "bitcoin" ? (
              <SatelliteArt body="#F7931A" glow="url(#neonGlowYellow)" blink="#F7931A" />
            ) : (
              <SatelliteArt body="#aa00ff" glow="url(#neonGlowPink)" blink="#aa00ff" />
            )}
          </g>
          {campSatSignal && (
            <rect
              className="sat-beam-css"
              x={(getLayout(getPlanetId()).tower === "right" ? 860 : 140) - 3}
              y={CAMP_SAT_BEAM_Y}
              width="6"
              height="40"
              fill={getPlanetId() === "bitcoin" ? "#F7931A" : "#aa00ff"}
            />
          )}
        </>
      )}

      {nft && nftSatX !== null && (
        <g pointerEvents="none">
          <g transform={`translate(${nftSatX}, ${NFT_SAT_SCREEN_Y})`}>
            <SatelliteArt body="#ccff00" glow="url(#neonGlowYellow)" blink="#ccff00" />
          </g>

          {nftSatSignal && (
            <rect
              className="sat-beam-css"
              x={NFT_TOWER_X - 3}
              y={NFT_SAT_SCREEN_Y + 10}
              width="6"
              height="40"
              fill={satBeam}
            />
          )}
        </g>
      )}
    </>
  );
}
