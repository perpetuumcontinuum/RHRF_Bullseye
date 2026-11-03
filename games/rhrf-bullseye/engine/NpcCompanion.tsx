import { useEffect, useState } from "react";
import { loadSprites, peekSprites, spriteFrame, DEFAULT_TOKEN, type GenerationSprites, type SpriteFacing } from "./spriteLoader";
export { preloadNpcSprites } from "./spriteLoader";

const STEP = 5;
const WALK_MS = 120;

void loadSprites(DEFAULT_TOKEN).catch(() => {});

function decodeRows(rows: readonly string[]): [number, number][] {
  const px: [number, number][] = [];
  rows.forEach((row, y) => {
    const s = String(row);
    for (let x = 0; x < s.length; x++) if (s[x] === "#") px.push([x, y]);
  });
  return px;
}

function pickFrame(sprites: GenerationSprites, facing: SpriteFacing, walking: boolean, frame: number): [number, number][] {
  const clip = walking ? sprites.clips?.walk?.[facing] : sprites.clips?.idle?.[facing];
  const len = Array.isArray(clip) ? clip.length : 0;
  const f = len > 0 ? frame % len : 0;
  const res = spriteFrame(sprites, facing, walking && len > 0, f, "right");
  let px = decodeRows(res.frame.rows);
  if (!px.length && facing !== "down") px = decodeRows(spriteFrame(sprites, "down", false, 0, "right").frame.rows);
  return px;
}

export default function NpcCompanion({
  tokenId = DEFAULT_TOKEN,
  x = 345,
  y = 410,
  accent,
  speaker = false,
  facing = "down",
  walking = false,
}: {
  tokenId?: bigint;
  x?: number;
  y?: number;
  accent?: string;
  speaker?: boolean;
  facing?: SpriteFacing;
  walking?: boolean;
}) {
  const [sprites, setSprites] = useState<GenerationSprites | null>(() => peekSprites(tokenId));
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const cached = peekSprites(tokenId);
    if (cached) {
      setSprites(cached);
      return;
    }

    let alive = true;
    loadSprites(tokenId)
      .then((v) => { if (alive) setSprites(v); })
      .catch((e) => console.warn("[NPC] FAIL", tokenId.toString(), e));
    return () => { alive = false; };
  }, [tokenId]);

  useEffect(() => {
    if (!walking || !sprites) { setFrame(0); return; }
    let id = 0;
    const start = () => {
      if (id) return;
      id = window.setInterval(() => {
        if ((window as any).__RHRF_IS_PAUSED__) return;
        setFrame((f) => f + 1);
      }, WALK_MS);
    };
    const stop = () => {
      if (!id) return;
      window.clearInterval(id);
      id = 0;
    };
    const sync = () => {
      if ((window as any).__RHRF_IS_PAUSED__) stop();
      else start();
    };
    sync();
    const watch = window.setInterval(sync, 200);
    return () => { stop(); window.clearInterval(watch); };
  }, [walking, sprites]);

  if (!sprites) return null;
  const px = pickFrame(sprites, facing, walking, frame);
  if (!px.length) return null;

  const bounds = px.reduce(
    (a, [gx]) => ({ minGx: Math.min(a.minGx, gx), maxGx: Math.max(a.maxGx, gx) }),
    { minGx: 999, maxGx: -999 },
  );
  const centerX = ((bounds.minGx + bounds.maxGx) / 2) * STEP + STEP / 2;
  const pedW = Math.round((bounds.maxGx - bounds.minGx + 1) * STEP + (speaker ? 34 : 24));
  const pedX = Math.round(centerX - pedW / 2);
  const pedY = speaker ? 70 : 72;
  const pedH = speaker ? 20 : 16;
  const innerX = pedX + 5;
  const innerW = Math.max(0, pedW - 10);

  return (
    <g
      shapeRendering="crispEdges"
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: `translate(${x}px, ${y}px)`,
        willChange: "transform",
      } as any}
      pointerEvents="none"
    >
      {accent && (
        <g shapeRendering="crispEdges">
          <rect
            x={pedX}
            y={pedY}
            width={pedW}
            height={pedH}
            fill={accent}
            opacity={speaker ? 0.54 : 0.36}
          />
          <rect
            x={pedX}
            y={pedY}
            width={pedW}
            height={pedH}
            fill="none"
            stroke="#ffffff"
            strokeWidth={speaker ? 2.4 : 1.8}
            opacity={speaker ? 0.42 : 0.24}
          />
          <rect
            x={innerX}
            y={pedY + 5}
            width={innerW}
            height={6}
            fill="#ffffff"
            opacity={speaker ? 0.18 : 0.12}
          />
        </g>
      )}
      {px.map(([gx, gy], i) => (
        <rect key={"no-" + i} x={gx * STEP - STEP} y={gy * STEP - STEP} width={STEP * 3} height={STEP * 3} className="friend-outline" />
      ))}
      {px.map(([gx, gy], i) => (
        <rect key={"nb-" + i} x={gx * STEP} y={gy * STEP} width={STEP} height={STEP} className="friend-body" />
      ))}
    </g>
  );
}
