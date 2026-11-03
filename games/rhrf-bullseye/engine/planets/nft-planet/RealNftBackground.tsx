import { useEffect, useState } from "react";
import React from "react";
import { loadSprites, peekSprites, spriteFrame, type GenerationSprites } from "../../spriteLoader";
import { bgTokenFor } from "../../residentTokens";
import type { PlanetMissions } from "../../missions";

interface Props {
  viewBox: string;
  missions?: PlanetMissions;
  towerActivated?: boolean;
}

const MISSION_STEPS = [0, 0.33, 0.66, 0.99, 1];
const EPIC = "#aa00ff";
const RARE = "#ccff00";
const PALETTE = [EPIC, "#00ffff", RARE, "#F7931A", "#00ffff"];
type NftArt = { bg: string; fg: string; tx: number; ty: number; sc: number; d: string };

const NFT_ART: NftArt[] = [

  { bg: "#fff", fg: "#000", tx: 0, ty: 0, sc: 2,
    d: "M0 0h8v1h-8zM0 1h1v1h-1zM3 1h2v1h-2zM7 1h1v1h-1zM0 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM5 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM5 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM7 5h1v1h-1zM0 6h2v1h-2zM6 6h2v1h-2zM0 7h8v1h-8z" },

  { bg: "#fff", fg: "#000", tx: 0, ty: 0, sc: 2,
    d: "M0 0h8v1h-8zM0 1h3v1h-3zM5 1h3v1h-3zM0 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM7 5h1v1h-1zM0 6h1v1h-1zM7 6h1v1h-1zM0 7h8v1h-8z" },

  { bg: "#000", fg: "#fff", tx: 0.5, ty: -0.5, sc: 1,
    d: "M3 2h2v1H3ZM10 2h2v1H10ZM4 3h2v1H4ZM10 3h2v1H10ZM4 4h8v1H4ZM4 5h1v1H4ZM7 5h2v1H7ZM11 5h1v1H11ZM4 6h1v1H4ZM7 6h2v1H7ZM11 6h1v1H11ZM4 7h8v1H4ZM7 8h2v1H7ZM6 9h4v1H6ZM5 10h2v1H5ZM8 10h3v1H8ZM4 11h8v1H4ZM4 12h8v1H4ZM4 13h2v1H4ZM10 13h2v1H10ZM4 14h2v1H4ZM10 14h2v1H10Z" },

  { bg: "#000", fg: "#fff", tx: 0, ty: -0.5, sc: 1,
    d: "M5 2h1v1H5ZM10 2h1v1H10ZM5 3h1v1H5ZM7 3h2v1H7ZM10 3h1v1H10ZM4 4h8v1H4ZM4 5h2v1H4ZM7 5h2v1H7ZM10 5h2v1H10ZM5 6h6v1H5ZM6 7h4v1H6ZM6 8h4v1H6ZM6 9h4v1H6ZM3 10h10v1H3ZM3 11h10v1H3ZM3 12h10v1H3ZM4 13h1v1H4ZM6 13h1v1H6ZM9 13h1v1H9ZM11 13h1v1H11ZM3 14h2v1H3ZM6 14h1v1H6ZM9 14h1v1H9ZM11 14h2v1H11Z" },

  { bg: "#000", fg: "#fff", tx: 0, ty: 0, sc: 1,
    d: "M4 1h2v1H4ZM10 1h2v1H10ZM5 2h1v1H5ZM10 2h1v1H10ZM5 3h1v1H5ZM10 3h1v1H10ZM5 4h6v1H5ZM4 5h8v1H4ZM3 6h2v1H3ZM7 6h2v1H7ZM11 6h2v1H11ZM4 7h8v1H4ZM5 8h6v1H5ZM5 9h6v1H5ZM4 10h8v1H4ZM4 11h8v1H4ZM5 12h6v1H5ZM5 13h2v1H5ZM9 13h2v1H9ZM5 14h2v1H5ZM9 14h2v1H9Z" },
];

const FRAME_ART_INDEX = [2, 3, 0, 1, 4];

const GROUND_Y = 480;
const TOWER_X = 860;
const TOWER_BASE_Y = GROUND_Y;
const TOWER_H = 140;
const K = TOWER_H / 140;
const T_BASE_W = 60 * K;
const T_TOP_W = 20 * K;
const T_RAIL1_D = 80 * K, T_RAIL1_W = 36 * K;
const T_RAIL2_D = 130 * K, T_RAIL2_W = 30 * K;
const T_ANT_D = 180 * K, T_ANT_W = 24;
const T_TIP_Y = TOWER_BASE_Y - TOWER_H;
const T_BEACON_D = 5 * K;
const T_BEACON_R = 4 * K;

type Frame = { cx: number; top: number; size: number };

const FRAMES: Frame[] = [
  { cx: 70,  top: 110, size: 96 },
  { cx: 185, top: 62,  size: 80 },
  { cx: 410, top: 120, size: 160 },
  { cx: 735, top: 150, size: 128 },
  { cx: 920, top: 138, size: 64 },
];

function nftChain(cx: number, top: number) {
  const links: React.ReactElement[] = [];
  const w = 9;
  const h = 24;
  const gap = 5;
  let y = 0;
  let i = 0;

  while (y + h <= top) {
    links.push(
      <rect
        key={`nft-chain-${cx}-${i}`}
        x={cx - w / 2}
        y={y}
        width={w}
        height={h}
        rx={w / 2}
        fill="none"
        stroke={RARE}
        strokeWidth="1.2"
        opacity="0.82"
        filter="url(#nftGlow)"
      />
    );
    y += h - gap;
    i += 1;
  }

  if (y < top) {
    links.push(
      <line
        key={`nft-chain-tail-${cx}`}
        x1={cx}
        y1={y}
        x2={cx}
        y2={top}
        stroke={RARE}
        strokeWidth="1.2"
        opacity="0.7"
      />
    );
  }

  links.push(
    <circle
      key={`nft-chain-hook-${cx}`}
      cx={cx}
      cy={top}
      r={3.2}
      fill={RARE}
      opacity="0.9"
      filter="url(#nftGlow)"
    />
  );

  return links;
}

function parseRuns(d: string): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const re = /M(\d+)\s+(\d+)h(\d+)v(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) out.push([+m[1], +m[2], +m[3], +m[4]]);
  return out;
}

const BG_KEYS = ["70:96", "185:80", "920:64"] as const;
const GEN_BY_FRAME: Record<string, bigint> = Object.fromEntries(BG_KEYS.map((k, i) => [k, bgTokenFor(i)]));

const _pixelCache = new Map<string, [number, number][]>();

function rowsToPx(rows: readonly string[]): [number, number][] {
  const px: [number, number][] = [];
  rows.forEach((row, y) => {
    const str = String(row);
    for (let x = 0; x < str.length; x++) if (str[x] === "#") px.push([x, y]);
  });
  return px;
}

function loadGenPixels(tokenId: bigint): Promise<[number, number][]> {
  const key = tokenId.toString();
  const done = _pixelCache.get(key);
  if (done) return Promise.resolve(done);

  const peek = peekSprites(tokenId);
  if (peek) {
    const px = rowsToPx(spriteFrame(peek, "down", false, 0, "right").frame.rows);
    if (px.length) { _pixelCache.set(key, px); return Promise.resolve(px); }
  }

  return loadSprites(tokenId).then((sprites) => {
    const px = rowsToPx(spriteFrame(sprites, "down", false, 0, "right").frame.rows);
    if (!px.length) throw new Error("empty sprite " + key);
    _pixelCache.set(key, px);
    return px;
  });
}

function GenSprite({ tokenId, s, fg, fallback }: {
  tokenId: bigint;
  s: number;
  fg: string;
  fallback: [number, number, number, number][];
}) {
  const [px, setPx] = useState<[number, number][] | null>(null);
  useEffect(() => {
    let alive = true;
    loadGenPixels(tokenId)
      .then((v) => { if (alive) setPx(v); })
      .catch(() => {});
    return () => { alive = false; };
  }, [tokenId]);
  const runs: [number, number, number, number][] = px
    ? px.map(([x, y]) => [x, y, 1, 1] as [number, number, number, number])
    : fallback;
  return (
    <>
      {runs.map(([rx, ry, rw, rh], j) => (
        <rect key={"gs-" + j} x={rx * s} y={ry * s} width={rw * s} height={rh * s} fill={fg} />
      ))}
    </>
  );
}

export default function RealNftBackground({ missions, towerActivated }: Props) {
  void towerActivated;
  const done =
    (missions?.bow ? 1 : 0) +
    (missions?.hat ? 1 : 0) +
    (missions?.amulet ? 1 : 0) +
    (missions?.arrows ? 1 : 0);

  const fill = MISSION_STEPS[Math.max(0, Math.min(4, done))];
  const fillH = TOWER_H * fill;
  const towerY = TOWER_BASE_Y - fillH;

  return (
    <>
      <defs>
        <linearGradient id="nftSky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="700">
          <stop offset="0%" stopColor="#0a0014"/>
          <stop offset="50%" stopColor="#12001f"/>
          <stop offset="100%" stopColor="#04000a"/>
        </linearGradient>
        <linearGradient id="nftGround" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="700">
          <stop offset="0%" stopColor="#1a0030"/>
          <stop offset="100%" stopColor="#06000f"/>
        </linearGradient>
        <filter id="nftGlow"><feGaussianBlur stdDeviation="4" result="b1"/><feGaussianBlur stdDeviation="8" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="nftBrush" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="nftSplat" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2"/></filter>
      </defs>

      <rect x="-20000" y="-20000" width="60000" height="60000" fill="url(#nftSky)"/>

      <g filter="url(#nftBrush)">
        {Array.from({ length: 8 }).map((_, i) => {
          const cx = 40 + i * 120 + ((i * 53) % 60);
          const cy = 70 + ((i * 71) % 150);
          const rx = 80 + ((i * 37) % 90);
          const ry = 26 + ((i * 19) % 42);
          const rot = ((i * 47) % 70) - 35;
          const c = PALETTE[i % PALETTE.length];
          const o = 0.10 + ((i * 13) % 8) / 60;
          return <ellipse key={"cl"+i} cx={cx} cy={cy} rx={rx} ry={ry} fill={c} opacity={o} transform={`rotate(${rot} ${cx} ${cy})`}/>;
        })}
      </g>

      <g filter="url(#nftSplat)">
        {[
          { x: 118, y: 74,  r: 1.8, o: 0.78, c: "#e6ccff" },
          { x: 306, y: 158, r: 1.2, o: 0.58, c: "#aa00ff" },
          { x: 502, y: 62,  r: 2.1, o: 0.84, c: "#ffffff" },
          { x: 688, y: 190, r: 1.4, o: 0.62, c: "#cc77ff" },
          { x: 834, y: 96,  r: 1.9, o: 0.76, c: "#e6ccff" },
          { x: 928, y: 214, r: 1.1, o: 0.52, c: "#aa00ff" },
        ].map((st, i) => (
          <circle key={"nft-star-" + i} cx={st.x} cy={st.y} r={st.r} fill={st.c} opacity={st.o} />
        ))}
      </g>

      {FRAMES.map((f, i) => {
        const half = f.size / 2;
        const art = NFT_ART[FRAME_ART_INDEX[i]];
        const s = f.size / 16;
        const artX = Math.round(f.cx - half + s * art.tx);
        const artY = Math.round(f.top + s * art.ty);

        return (
          <g key={"nft-frame-" + i}>
            {nftChain(f.cx, f.top)}

            <rect
              x={f.cx - half}
              y={f.top}
              width={f.size}
              height={f.size}
              fill={art.bg}
              shapeRendering="crispEdges"
            />

            <g
              className="nft-frame-art"
              shapeRendering="crispEdges"
              style={{ transformBox: "fill-box", transformOrigin: "center", transform: `translate(${artX}px, ${artY}px)`, willChange: "transform" } as any}
            >
              {GEN_BY_FRAME[f.cx + ":" + f.size] ? (
                <GenSprite
                  tokenId={GEN_BY_FRAME[f.cx + ":" + f.size]!}
                  s={s}
                  fg={art.fg}
                  fallback={parseRuns(art.d).map(
                    ([q, w, e, r]) => [q * art.sc, w * art.sc, e * art.sc, r * art.sc] as [number, number, number, number]
                  )}
                />
              ) : (
                parseRuns(art.d).map(([rx, ry, rw, rh], j) => (
                  <rect key={"run-" + j} x={rx * art.sc * s} y={ry * art.sc * s} width={rw * art.sc * s} height={rh * art.sc * s} fill={art.fg} />
                ))
              )}
            </g>

            <rect
              x={f.cx - half}
              y={f.top}
              width={f.size}
              height={f.size}
              fill="none"
              stroke={EPIC}
              strokeWidth="1.5"
            />
          </g>
        );
      })}

      <g>
        {fill > 0 && (
          <g>
            <defs>
              <clipPath id="nftTowerFillClip">
                <polygon points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`} />
              </clipPath>
            </defs>
            <g clipPath="url(#nftTowerFillClip)">
              <rect x={TOWER_X - T_BASE_W / 2} y={towerY} width={T_BASE_W} height={fillH} fill={EPIC} opacity="0.8" />
              <line x1={TOWER_X - T_BASE_W / 2} y1={towerY} x2={TOWER_X + T_BASE_W / 2} y2={towerY} stroke="#ff2bd6" strokeWidth="1.5" opacity="0.95" />
            </g>
          </g>
        )}

        <g opacity="0.9">
          <polygon
            points={`${TOWER_X - T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_BASE_W / 2},${TOWER_BASE_Y} ${TOWER_X + T_TOP_W / 2},${T_TIP_Y} ${TOWER_X - T_TOP_W / 2},${T_TIP_Y}`}
            fill="none"
            stroke={EPIC}
            strokeWidth="1.5"
            filter="url(#nftGlow)"
          />
          <line x1={TOWER_X - T_RAIL1_W / 2} y1={TOWER_BASE_Y - T_RAIL1_D} x2={TOWER_X + T_RAIL1_W / 2} y2={TOWER_BASE_Y - T_RAIL1_D} stroke={EPIC} strokeWidth="0.8" opacity="0.6"/>
          <line x1={TOWER_X - T_RAIL2_W / 2} y1={TOWER_BASE_Y - T_RAIL2_D} x2={TOWER_X + T_RAIL2_W / 2} y2={TOWER_BASE_Y - T_RAIL2_D} stroke={EPIC} strokeWidth="0.8" opacity="0.6"/>
          <line x1={TOWER_X - T_ANT_W / 2} y1={T_TIP_Y - T_BEACON_D - 35} x2={TOWER_X + T_ANT_W / 2} y2={T_TIP_Y - T_BEACON_D - 35} stroke={EPIC} strokeWidth="0.8" opacity="0.6"/>
          <circle cx={TOWER_X} cy={T_TIP_Y - T_BEACON_D} r={T_BEACON_R} fill="#ff2bd6" filter="url(#nftGlow)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>
      </g>

      <rect x="-20000" y="480" width="60000" height="20000" fill="url(#nftGround)"/>

      <g filter="url(#nftBrush)">
        {Array.from({ length: 14 }).map((_, i) => {
          const cx = 30 + i * 70 + ((i * 41) % 50);
          const cy = 492 + ((i * 53) % 150);
          const rx = 60 + ((i * 29) % 90);
          const ry = 6 + ((i * 17) % 14);
          const rot = ((i * 31) % 24) - 12;
          const c = PALETTE[(i * 2) % PALETTE.length];
          const o = 0.12 + ((i * 11) % 9) / 55;
          return <ellipse key={"gr"+i} cx={cx} cy={cy} rx={rx} ry={ry} fill={c} opacity={o} transform={`rotate(${rot} ${cx} ${cy})`}/>;
        })}
      </g>

      <path
        d="M-20000,481 Q120,476 260,482 T520,480 T780,483 T1040,479 T20000,482"
        fill="none"
        stroke={EPIC}
        strokeWidth="2.5"
        opacity="0.55"
        filter="url(#nftGlow)"
      />

    </>
  );
}
