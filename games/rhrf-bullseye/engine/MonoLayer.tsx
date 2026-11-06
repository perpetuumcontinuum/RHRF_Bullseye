import { buildTailPath } from "./tailPath";
import { wrapText } from "./textWrap";
import SpeechBubble from "./SpeechBubble";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDialogSkip, getSceneLines } from "./dialogs";
import { translate } from "./i18n";
import { useLang } from "./i18n";
import { heroCenterX } from "./planets/planetRuntime";
import { PLAYER_Y, DIALOG_W, DIALOG_X, DIALOG_TOP } from "./geometry";

import { getSpeakerName } from "../lang/names";
const WHO_NAME: Record<string, string> = {
  cyber: "CYBER HERO", ether: "ETHER", crowd: "CROWD",
  elder: "ELDER", cyber_npc: "CYBER", rep: "",
};

const ROWS = 3, STEP = 24, TEXT_TOP = 52, BTN_PAD = 46;
const BH = TEXT_TOP + ROWS * STEP + BTN_PAD;
const TOP_PAD = 5;

function chunkLines(rows: string[]): string[][] {
  const c: string[][] = [];
  for (let i = 0; i < rows.length; i += ROWS) c.push(rows.slice(i, i + ROWS));
  return c.length ? c : [[""]];
}

export default function MonoLayer({
  active = true,
  dismissible = true,
  onDone,
  sceneKey = "rwaFarewell",
}: { active?: boolean; dismissible?: boolean; onDone?: () => void; sceneKey?: string } = {}) {
  const lang = useLang();
  const [idx, setIdx] = useState(0);
  const [part, setPart] = useState(0);
  const [visible, setVisible] = useState(false);
  const chunksRef = useRef<string[][]>([[""]]);

  const baseLines = useMemo(() => getSceneLines(sceneKey as any, lang), [lang]);
  const lines = useMemo(
    () => (baseLines && baseLines.length ? baseLines : getSceneLines(sceneKey as any, "ru") || []),
    [baseLines]
  );

  useEffect(() => { (window as any).__RHRF_CUTSCENE__ = visible; return () => { (window as any).__RHRF_CUTSCENE__ = false; }; }, [visible]);
  useEffect(() => { setPart(0); }, [idx]);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (active) { setIdx(0); setPart(0); setVisible(true); }
    else setVisible(false);
  }, [active]);

  const cyberCx = heroCenterX("rwa");
  const cyberTop = PLAYER_Y - TOP_PAD;

  const bw = DIALOG_W;
  const bx = DIALOG_X;
  const charsPerLine = Math.max(24, Math.floor((bw - 36) / 9.4));

  const wrappedAll = lines.map((l) => wrapText(l.text, charsPerLine));
  const chunks = chunkLines(wrappedAll[idx] || [""]);
  chunksRef.current = chunks;
  const page = chunks[Math.min(part, chunks.length - 1)] || [""];
  const bh = BH;
  const by = DIALOG_TOP;

  function finish() { setVisible(false); onDoneRef.current?.(); }

  useEffect(() => {
    const onDismissDialog = () => {
      if (!dismissible) return;
      if (visible) finish();
    };
    window.addEventListener("rhrf:dismiss-dialog", onDismissDialog);
    return () => window.removeEventListener("rhrf:dismiss-dialog", onDismissDialog);
  }, [visible]);
  function advance() {
    const c = chunksRef.current;
    if (part < c.length - 1) { setPart(part + 1); return; }
    setPart(0);
    if (idx < lines.length - 1) setIdx(idx + 1);
    else finish();
  }

  function back() {
    const c = chunksRef.current;
    if (part > 0) { setPart(part - 1); return; }
    if (idx > 0) {
      setIdx(idx - 1);
      const prev = chunkLines(wrappedAll[idx - 1] || [""]);
      setPart(Math.max(0, prev.length - 1));
    }
  }

  useEffect(() => {
    if (!visible || lines.length === 0) return;
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
  }, [visible, idx, part, lines.length]);

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
      if (t.closest(".rf-mono-back")) { back(); return; }
      if (t.closest(".rf-mono-skip")) { finish(); return; }
      if (t.closest(".rf-mono-next")) { advance(); return; }
      if (t.closest(MENU_SELECTOR)) return;
      advance();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [visible, idx, part, lines.length]);

  const line = lines[idx];
  if (!visible || !line) return null;

  const skipLabel = getDialogSkip(lang);
  const nextLabel = translate(lang, "ui.dialog.next", undefined, "NEXT");
  const backLabel = translate(lang, "ui.dialog.back", undefined, "BACK");
  const who = String(line.who);
  const speakerName = getSpeakerName(who, lang, { sceneKey });

  const SPKR_GAP = 18;
  const spkCx = cyberCx;
  const spkTopY = cyberTop - SPKR_GAP;
  const TAIL_HALF = bw * 0.10;
  const tailCx = bx + bw * 0.25;
  const tailY = by + bh;
  const tailTipY = Math.max(tailY + 6, spkTopY);
  const tailPath = buildTailPath(bx, by, bw, tailCx, TAIL_HALF, spkCx, tailY, tailTipY);

  const nextW = Math.max(90, nextLabel.length * 8.2 + 32);
  const skipW = Math.max(80, skipLabel.length * 7.4 + 30);
  const backW = Math.max(80, backLabel.length * 8.2 + 30);
  const skipX = bx + bw - skipW - 24;
  const nextX = Math.max(bx + 24 + backW + 20, skipX - nextW - 20);
  const backX = Math.max(bx + 24, nextX - backW - 20);
  const canBack = idx > 0 || part > 0;
  const btnY = by + bh - BTN_PAD - 2;
  const btnTextY = btnY + 21;

  return (
    <g className="rf-cutscene-layer">
      <SpeechBubble
        bx={bx} by={by} bw={bw} tailPath={tailPath} ns="mono"
        accent="#00ffff" speakerName={speakerName} page={page}
        btnY={btnY} btnTextY={btnTextY}
        backLabel={backLabel} nextLabel={nextLabel} skipLabel={skipLabel}
        canBack={canBack}
      />
    </g>
  );
}
