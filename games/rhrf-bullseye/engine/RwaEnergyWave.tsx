import { useEffect, useRef, useState } from "react";
import { PLAYER_X, PLAYER_WIDTH, PLAYER_Y, PLAYER_HEIGHT } from "./geometry";

const STONE_X = 580;
const FOOT_Y = PLAYER_Y + PLAYER_HEIGHT;
const GROUND_Y = FOOT_Y;
const DOLLAR_Y = FOOT_Y - 174;
const LEFT_EDGE = -580;
const RIGHT_EDGE = 380;

const PEAK_HALF_W = 22.5;
const PEAK_H = 32;
const PEAK_W = PEAK_HALF_W * 2;

const DOWN_MS = 450;
const SPREAD_MS = 800;
const TRAVEL_MS = 3467;
const ERASE_MS = 2000;
const FIRST_PEAK_MS = 2000;
const PEAK_GAP_MS = 6000;

const LETHAL_RATIO = 0.96;
const LETHAL_PAD = (PEAK_W * (1 - LETHAL_RATIO)) / 2;

interface Peak {
  id: string;
  back: number;
  mid: number;
  front: number;
}

function schedule(pulses: number) {
  const edgeAts =
    pulses >= 3
      ? [FIRST_PEAK_MS, FIRST_PEAK_MS + PEAK_GAP_MS]
      : pulses >= 2
        ? [FIRST_PEAK_MS]
        : [];

  const tailAt =
    pulses >= 3
      ? FIRST_PEAK_MS + PEAK_GAP_MS * 2
      : pulses >= 2
        ? FIRST_PEAK_MS + PEAK_GAP_MS
        : FIRST_PEAK_MS;

  return { edgeAts, tailAt };
}

function peakAt(id: string, dist: number, dir: -1 | 1): Peak {
  return {
    id,
    front: dir * dist,
    mid: dir * (dist - PEAK_HALF_W),
    back: dir * (dist - PEAK_W),
  };
}

function hasRemainingLine(cursor: number, edge: number, dir: -1 | 1) {
  return dir === -1 ? cursor > edge + 0.5 : cursor < edge - 0.5;
}

export default function RwaEnergyWave({
  pulses,
  waveKey,
  isPaused = false,
  isJumping = false,
  isFallen = false,
}: {
  pulses: number;
  waveKey: number;
  isPaused?: boolean;
  isJumping?: boolean;
  isFallen?: boolean;
}) {
  const [d, setD] = useState("");
  const raf = useRef(0);
  const elapsed = useRef(0);
  const last = useRef(0);

  const pausedRef = useRef(isPaused);
  const jumpingRef = useRef(isJumping);
  const fallenRef = useRef(isFallen);
  const hitRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    jumpingRef.current = isJumping;
  }, [isJumping]);

  useEffect(() => {
    fallenRef.current = isFallen;
  }, [isFallen]);

  useEffect(() => {
    if (pulses <= 0) {
      setD("");
      return;
    }

    hitRef.current = new Set();

    const { edgeAts, tailAt } = schedule(pulses);
    const spreadEnd = DOWN_MS + SPREAD_MS;
    const eraseStart = spreadEnd + Math.max(0, tailAt - ERASE_MS);
    const tailStart = spreadEnd + tailAt;
    const totalEnd = tailStart + TRAVEL_MS;

    elapsed.current = 0;
    last.current = performance.now();

    const heroMin = PLAYER_X;
    const heroMax = PLAYER_X + PLAYER_WIDTH;

    const tryHit = (peak: Peak) => {
      if (pausedRef.current || jumpingRef.current || fallenRef.current) return;

      const a = STONE_X + peak.back;
      const b = STONE_X + peak.front;
      const min = Math.min(a, b) + LETHAL_PAD;
      const max = Math.max(a, b) - LETHAL_PAD;

      if (max <= heroMin || min >= heroMax) return;
      if (hitRef.current.has(peak.id)) return;

      hitRef.current.add(peak.id);
      window.dispatchEvent(new CustomEvent("rhrf-ghost-hit"));
    };

    const tick = (now: number) => {
      if (pausedRef.current) {
        last.current = now;
        raf.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.max(0, now - last.current);
      last.current = now;
      elapsed.current += dt;

      const t = elapsed.current;

      if (t >= totalEnd) {
        setD("");
        return;
      }

      const segs: string[] = [];
      const vertTop = DOLLAR_Y - GROUND_Y;

      if (t < DOWN_MS) {
        const p = t / DOWN_MS;
        segs.push(`M 0 ${vertTop} L 0 ${vertTop + (0 - vertTop) * p}`);
      } else if (t < eraseStart) {
        segs.push(`M 0 ${vertTop} L 0 0`);
      } else if (t < tailStart) {
        const p = (t - eraseStart) / ERASE_MS;
        const y = vertTop + (0 - vertTop) * p;
        if (y < -1) segs.push(`M 0 ${y} L 0 0`);
      }

      if (t >= DOWN_MS) {
        const local = t - spreadEnd;
        const tailLocal = local - tailAt;

        if (tailLocal > TRAVEL_MS) {
          setD("");
          return;
        }

        for (const side of [
          { edge: LEFT_EDGE, dir: -1 as const, tag: "L" },
          { edge: RIGHT_EDGE, dir: 1 as const, tag: "R" },
        ]) {
          const { edge, dir, tag } = side;
          const absEdge = Math.abs(edge);

          if (t < spreadEnd) {
            const p = (t - DOWN_MS) / SPREAD_MS;
            segs.push(`M 0 0 L ${dir * absEdge * p} 0`);
            continue;
          }

          if (tailLocal >= 0) {
            const tailDist = PEAK_W + (absEdge + PEAK_W) * (tailLocal / TRAVEL_MS);
            const p = peakAt(`${tag}:tail:${pulses}:${waveKey}`, tailDist, dir);

            tryHit(p);

            if (hasRemainingLine(p.front, edge, dir)) {
              segs.push(`M ${edge} 0 L ${p.front} 0`);
            }

            segs.push(`M ${p.front} 0 L ${p.mid} ${-PEAK_H} L ${p.back} 0`);
            continue;
          }

          const peaks: Peak[] = edgeAts
            .map((at, i) => ({ at, i, local: local - at }))
            .filter((x) => x.local >= 0 && x.local <= TRAVEL_MS)
            .map((x) =>
              peakAt(
                `${tag}:edge:${x.i}:${pulses}:${waveKey}`,
                PEAK_W + (absEdge + PEAK_W) * (x.local / TRAVEL_MS),
                dir
              )
            )
            .sort((a, b) => Math.abs(a.back) - Math.abs(b.back));

          if (peaks.length === 0) {
            segs.push(`M 0 0 L ${edge} 0`);
            continue;
          }

          let cursor = 0;

          for (const p of peaks) {
            tryHit(p);

            if (Math.abs(p.back - cursor) > 0.5) {
              segs.push(`M ${cursor} 0 L ${p.back} 0`);
            }

            segs.push(`M ${p.back} 0 L ${p.mid} ${-PEAK_H} L ${p.front} 0`);
            cursor = p.front;
          }

          if (hasRemainingLine(cursor, edge, dir)) {
            segs.push(`M ${cursor} 0 L ${edge} 0`);
          }
        }
      }

      setD(segs.join(" "));
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
    };
  }, [pulses, waveKey]);

  if (!d) return null;

  return (
    <g
      transform={`translate(${STONE_X}, ${GROUND_Y})`}
      pointerEvents="none"
      className="rf-rwa-energy-wave"
    >
      <path
        d={d}
        fill="none"
        stroke="#ff2a2a"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
