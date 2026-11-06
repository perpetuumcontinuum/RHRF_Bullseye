import { buildTailPath } from "./tailPath";
import { useMemo } from "react";
import { wrapText } from "./textWrap";
import { getSceneLines } from "./dialogs";
import { useLang, translate } from "./i18n";
import { getLayout, getPlanetAccent, TOWER_ANT_Y } from "./planets/planetRuntime";
import { DIALOG_W, DIALOG_X, DIALOG_TOP } from "./geometry";
import type { DepartPose } from "./departPose";

const BEAM_BOT = TOWER_ANT_Y;
const BEAM_TOP = -80;

const ROWS = 3;
const STEP = 24;
const TEXT_TOP = 52;
const BTN_PAD = 46;
const BH = TEXT_TOP + ROWS * STEP + BTN_PAD;
const NPC_HALF = 37.5;
const TOP_PAD = 5;
const SPKR_GAP = 18;

const CROWD_SPK_CX = 370 + NPC_HALF;
const CROWD_TOP_Y = 398 - TOP_PAD;

function chunkLines(rows: string[]): string[][] {
  const c: string[][] = [];
  for (let i = 0; i < rows.length; i += ROWS) c.push(rows.slice(i, i + ROWS));
  return c.length ? c : [[""]];
}

export default function DepartOverlay({ planet, pose }: { planet: string; pose: DepartPose }) {
  const lang = useLang();
  const towerX = getLayout(planet).tower === "left" ? 140 : 860;
  const accent = getPlanetAccent(planet) || "#00ffff";

  const page = useMemo(() => {
    const key = `${planet}Departure` as any;
    let l = getSceneLines(key, lang) || [];
    if (!l.length) l = getSceneLines(key, "ru") || [];

    const txt = l
      .filter((x: any) => x.who === "crowd")
      .map((x: any) => x.text)
      .join(" ");

    const fallback = translate(lang, "ui.depart.fallback", undefined, "Safe travels, cyber-hero! Hooray! Hooray! Hooray!");

    const text = txt || fallback;
    const charsPerLine = Math.max(24, Math.floor((DIALOG_W - 36) / 9.4));
    const chunks = chunkLines(wrapText(text, charsPerLine));
    return chunks[0] || [""];
  }, [planet, lang]);

  const blobY = BEAM_BOT - (BEAM_BOT - BEAM_TOP) * pose.blob;

  const bw = DIALOG_W;
  const bx = DIALOG_X;
  const by = DIALOG_TOP;

  const tailY = by + BH;
  const spkCx = CROWD_SPK_CX;
  const spkTopY = CROWD_TOP_Y - SPKR_GAP;
  const isLeft = spkCx < bx + bw / 2;
  const TAIL_HALF = bw * 0.1;
  const tailCx = isLeft ? bx + bw * 0.25 : bx + bw * 0.75;
  const tailTipY = Math.max(tailY + 6, spkTopY);

const tailPath = buildTailPath(bx, by, bw, tailCx, TAIL_HALF, spkCx, tailY, tailTipY);

  const showDepartBubble = false;

  return (
    <g className="rf-depart-overlay" pointerEvents="none">
      {pose.blob > 0 && (
        <g opacity={pose.blob}>
          <g filter="url(#beamSoft)">
            <line
              x1={towerX}
              y1={BEAM_BOT}
              x2={towerX}
              y2={blobY}
              stroke={accent}
              strokeWidth="34"
              opacity="0.16"
              strokeLinecap="round"
            />
            <line
              x1={towerX}
              y1={BEAM_BOT}
              x2={towerX}
              y2={blobY}
              stroke="#ffffff"
              strokeWidth="22"
              opacity="0.30"
              strokeLinecap="round"
            />
            <line
              x1={towerX}
              y1={BEAM_BOT}
              x2={towerX}
              y2={blobY}
              stroke="#ffffff"
              strokeWidth="12"
              opacity="0.58"
              strokeLinecap="round"
            />
            <line
              x1={towerX}
              y1={BEAM_BOT}
              x2={towerX}
              y2={blobY}
              stroke={accent}
              strokeWidth="6"
              opacity="0.95"
              strokeLinecap="round"
            />
          </g>

          <circle cx={towerX} cy={blobY} r="12" fill={accent} opacity="0.35" />
          <rect
            x={towerX - 7}
            y={blobY - 7}
            width={14}
            height={14}
            fill="#000"
            stroke="#fff"
            strokeWidth="2"
            shapeRendering="crispEdges"
          />
        </g>
      )}

      {showDepartBubble && pose.cheer > 0 && (
        <g opacity={pose.cheer}>
          <path
            d={tailPath}
            fill="#000"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
            shapeRendering="auto"
          />

          <text
            x={bx + 18}
            y={by + 30}
            fill={accent || "#fff"}
            fontFamily="'Courier New', Courier, monospace"
            fontSize="14"
            fontWeight="900"
          >
            CROWD
          </text>

          {page.map((s, i) => (
            <text
              key={"dc-" + i}
              x={bx + 18}
              y={by + TEXT_TOP + i * STEP}
              fill="#fff"
              fontFamily="'Courier New', Courier, monospace"
              fontSize="16"
            >
              {s}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}
