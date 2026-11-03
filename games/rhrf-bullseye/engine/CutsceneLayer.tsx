import { buildTailPath } from "./tailPath";
import { wrapText } from "./textWrap";
import SpeechBubble from "./SpeechBubble";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDialogSkip, getSceneLines } from "./dialogs";
import { translate } from "./i18n";
import NpcCompanion from "./NpcCompanion";
import { residentTokenFor } from "./residentTokens";
import { getPlanetAccent, heroCenterX, getPlanetId, getLayout, targetX } from "./planets/planetRuntime";
import { PLAYER_Y, DIALOG_W, DIALOG_X, DIALOG_TOP } from "./geometry";
import { useLang } from "./i18n";

type Planet = "stable" | "nft" | "bitcoin";
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

type Phase = "arrival" | "thanks" | "departure" | "shield";

const REP_NAME: Record<Planet, string> = { stable: "PEG", nft: "MINT", bitcoin: "HASH" };
import { getSpeakerName } from "../lang/names";
const WHO_NAME: Record<string, string> = {
  rep: "", cyber: "CYBER HERO", crowd: "CROWD", ether: "ETHER",
  elder: "ELDER", cyber_npc: "CYBER",
};

const CROWD_POS: { x: number; y: number; rep?: boolean }[] = [
  { x: 322, y: 406, rep: true },
  { x: 346, y: 398 },
  { x: 370, y: 406 },
  { x: 394, y: 398 },
  { x: 418, y: 406 },
  { x: 358, y: 414 },
];

const ROWS = 3, STEP = 24, TEXT_TOP = 52, BTN_PAD = 46;
const BH = TEXT_TOP + ROWS * STEP + BTN_PAD;
const NPC_HALF = 37.5;
const TOP_PAD = 5;


function chunkLines(rows: string[]): string[][] {
  const c: string[][] = [];
  for (let i = 0; i < rows.length; i += ROWS) c.push(rows.slice(i, i + ROWS));
  return c.length ? c : [[""]];
}

function phaseKeyBase(planet: Planet, phase: Phase): string {
  return `${planet}${phase[0].toUpperCase()}${phase.slice(1)}`;
}

function phaseKey(planet: Planet, phase: Phase): string {
  if (phase === "shield") return `${planet}Shield`;
  return phaseKeyBase(planet, phase);
}

type CrowdMode =
  | "cluster"
  | "repOut"
  | "preFlee"
  | "flee"
  | "returnCluster"
  | "returnFace"
  | "returnRepOut"
  | "gather";

const START_HOLD_MS = 1500;
const REP_RETURN_MS = 850;
const RETURN_HOLD_MS = 1250;
const ANIM_MS = 820;
const RETURN_FACE_MS = 1000;
const DEPARTURE_WALK_MS = 3200;

const CLUSTER_CENTER_OFFSET = 168;
const REP_EXTRA_SPREAD = 28;
const FLEE_DISTANCE = 1700;

const REP_INDEX = Math.max(0, CROWD_POS.findIndex((p) => p.rep));
const SPREAD = [-28, -10, 9, 27, -19, 18];
const GATHER_OFFSETS = [0, 34, 62, 90, 118, 146];

function clampResidentX(x: number): number {
  return Math.max(80, Math.min(920, x));
}

function getCrowdLayout(mode: CrowdMode, planet: Planet): { x: number; y: number }[] {
  const pid = String(planet || getPlanetId());
  const heroLeft = getLayout(pid).hero === "left";
  const tx = targetX(pid);
  const dir = heroLeft ? 1 : -1;
  const clusterCx = tx + dir * CLUSTER_CENTER_OFFSET;

  let centers = CROWD_POS.map((pp, i) => ({
    x: clusterCx + (SPREAD[i] ?? 0) * 0.55,
    y: pp.y,
  }));

  if (mode === "cluster" || mode === "preFlee" || mode === "returnCluster" || mode === "returnFace") {
    centers = CROWD_POS.map((pp, i) => ({
      x: clusterCx + (SPREAD[i] ?? 0) * 0.55,
      y: pp.y,
    }));
  } else if (mode === "repOut" || mode === "returnRepOut") {
    centers = CROWD_POS.map((pp, i) =>
      i === REP_INDEX
        ? { x: tx, y: pp.y }
        : {
            x: clusterCx + dir * REP_EXTRA_SPREAD + (SPREAD[i] ?? 0) * 0.75,
            y: pp.y,
          }
    );
  } else if (mode === "flee") {
    centers = CROWD_POS.map((pp, i) => ({
      x: clusterCx + dir * FLEE_DISTANCE + (SPREAD[i] ?? 0) * 0.45,
      y: pp.y,
    }));
  } else if (mode === "gather") {
    centers = CROWD_POS.map((pp, i) => ({
      x: tx + dir * (i === REP_INDEX ? 0 : GATHER_OFFSETS[i % GATHER_OFFSETS.length]),
      y: pp.y,
    }));
  }

  const noClamp = mode === "flee";
  return centers.map((c) => ({
    x: (noClamp ? c.x : clampResidentX(c.x)) - NPC_HALF,
    y: c.y,
  }));
}

export default function CutsceneLayer({ planet, towerActivated = false, onDialogChange }: { planet: Planet; towerActivated?: boolean; onDialogChange?: (open: boolean) => void }) {
  const lang = useLang();
  const [phase, setPhase] = useState<Phase>("arrival");
  const [idx, setIdx] = useState(0);
  const [part, setPart] = useState(0);
  const [visible, setVisible] = useState(false);
  const chunksRef = useRef<string[][]>([[""]]);
  const thanksDoneRef = useRef(false);
  const [flee, setFlee] = useState(false);
  const [returning, setReturning] = useState(false);
  const [crowdMode, setCrowdMode] = useState<CrowdMode>("cluster");
  const [introDone, setIntroDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstFrame, setFirstFrame] = useState(true);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setFirstFrame(false));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const reducedMotion = useMemo(() => {
    try {
      return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);
  void towerActivated;
  const hasCutscene = planet === "stable" || planet === "nft" || planet === "bitcoin";
  useEffect(() => {
    if (!introDone || visible || phase !== "arrival") return;
    if (crowdMode === "repOut" || crowdMode === "returnRepOut") {
      setCrowdMode("preFlee");
    } else {
      setFlee(true);
    }
  }, [introDone, visible, phase, crowdMode]);
  useEffect(() => {
    if (phase === "shield" && flee) {
      setFlee(false); setReturning(true);
            const cancel = pausedTimeout(() => setReturning(false), 1300);
      return cancel;
    }
  }, [phase, flee]);
  useEffect(() => {
    setPhase("arrival");
    setIdx(0);
    setPart(0);
    setVisible(false);
    setFlee(false);
    setReturning(false);
    setCrowdMode("cluster");
    setIntroDone(false);
    setIsAnimating(false);
    thanksDoneRef.current = false;
  }, [planet]);

  useEffect(() => {
    if (introDone) return;
    const cancel = pausedTimeout(() => {
      setIntroDone(true);
      setVisible(true);
      setCrowdMode("repOut");
    }, START_HOLD_MS);
    return cancel;
  }, [introDone, planet]);

  useEffect(() => {
    setIsAnimating(true);
    const cancel = pausedTimeout(() => setIsAnimating(false), ANIM_MS);
    return cancel;
  }, [crowdMode]);

  useEffect(() => {
    if (crowdMode !== "preFlee") return;
    const cancel = pausedTimeout(() => setCrowdMode("flee"), REP_RETURN_MS);
    return cancel;
  }, [crowdMode]);

  useEffect(() => {
    if (phase !== "shield" || crowdMode !== "flee") return;
    setCrowdMode("returnCluster");
  }, [phase, crowdMode]);

  useEffect(() => {
    if (crowdMode !== "returnCluster") return;
    const cancel = pausedTimeout(() => setCrowdMode("returnFace"), ANIM_MS + 120);
    return cancel;
  }, [crowdMode]);

  useEffect(() => {
    if (crowdMode !== "returnFace") return;
    const cancel = pausedTimeout(() => {
      setCrowdMode("returnRepOut");
      setVisible(true);
    }, RETURN_FACE_MS);
    return cancel;
  }, [crowdMode]);

  useEffect(() => {
    const facing =
      crowdMode === "repOut" || crowdMode === "returnRepOut" || crowdMode === "gather"
        ? "crowd"
        : "player";
    window.dispatchEvent(new CustomEvent("rhrf:cutscene-face", { detail: { facing } }));
  }, [crowdMode]);

  useEffect(
    () => () => {
      window.dispatchEvent(new CustomEvent("rhrf:cutscene-face", { detail: { facing: "player" } }));
    },
    []
  );

  useEffect(() => {
    if (phase !== "departure") return;
    if (crowdMode !== "repOut" && crowdMode !== "returnRepOut") return;

    const cancel = pausedTimeout(() => {
      setCrowdMode("gather");
      setVisible(true);
    }, DEPARTURE_WALK_MS);

    return cancel;
  }, [phase, crowdMode]);
  useEffect(() => { setPart(0); }, [idx, phase]);
  useEffect(() => {
    const dialogModal = visible && phase !== "shield";
    const preCombatBlock = hasCutscene && phase === "arrival" && crowdMode !== "flee";
    const blocked = dialogModal || preCombatBlock;

    (window as any).__RHRF_CUTSCENE__ = blocked;
    onDialogChange?.(blocked);

    return () => {
      (window as any).__RHRF_CUTSCENE__ = false;
    };
  }, [visible, phase, crowdMode, hasCutscene, onDialogChange]);

  const accent = useMemo(() => { try { return getPlanetAccent(planet); } catch { return undefined; } }, [planet]);
  const lines = useMemo(() => {
    const k = phaseKey(planet, phase) as any;
    const l = getSceneLines(k, lang) || [];
    return l.length ? l : (getSceneLines(k, "ru") || []);
  }, [planet, phase, lang]);

  useEffect(() => {
    const onStart = () => {
        setPhase("arrival");
        setIdx(0);
        setPart(0);
        setVisible(false);
        setFlee(false);
        setReturning(false);
        setCrowdMode("cluster");
        setIntroDone(false);
        setIsAnimating(false);
        thanksDoneRef.current = false;
      };
    const onPhase = (event: Event) => {
      const d = (event as CustomEvent<Phase>).detail;
      if (d === "arrival" || d === "thanks" || d === "departure" || d === "shield") {
          setPhase(d);
          setIdx(0);
          setPart(0);
          setVisible(d !== "shield");
          if (d === "shield") {
            setFlee(false);
            setReturning(false);
            thanksDoneRef.current = false;
          }
        }
    };
    window.addEventListener("rhrf:cutscene-start", onStart);
    window.addEventListener("rhrf:cutscene-phase", onPhase as EventListener);
    return () => { window.removeEventListener("rhrf:cutscene-start", onStart); window.removeEventListener("rhrf:cutscene-phase", onPhase as EventListener); };
  }, []);

  const cyberCx = heroCenterX(planet);
  const bw = DIALOG_W;
  const bx = DIALOG_X;

  const charsPerLine = Math.max(24, Math.floor((bw - 36) / 9.4));
  const wrappedAll = lines.map((l) => wrapText(l.text, charsPerLine));
  const wrapped = wrappedAll[idx] || [""];
  const chunks = chunkLines(wrapped);
  chunksRef.current = chunks;
  const page = chunks[Math.min(part, chunks.length - 1)] || [""];

  const crowdTop = Math.min(...CROWD_POS.map((p) => p.y)) - TOP_PAD;
  const cyberTop = PLAYER_Y - TOP_PAD;
  const by = DIALOG_TOP;

  function finish() {
    if (phase === "shield") {
      setPhase("thanks");
      setIdx(0);
      setPart(0);
      setVisible(true);
      return;
    }

    if (phase === "thanks") {
      if (!thanksDoneRef.current) {
        thanksDoneRef.current = true;
        window.dispatchEvent(new CustomEvent("rhrf:shield-done"));
      }
      setPhase("departure");
      setIdx(0);
      setPart(0);
      setVisible(true);
      return;
    }

    setVisible(false);
  }

  useEffect(() => {
    const onDismissDialog = () => {
      if (visible && phase !== "shield") finish();
    };
    window.addEventListener("rhrf:dismiss-dialog", onDismissDialog);
    return () => window.removeEventListener("rhrf:dismiss-dialog", onDismissDialog);
  }, [visible, phase]);
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
  }, [visible, idx, part, lines.length, phase]);

  useEffect(() => {
    if (!visible) return;
    const MENU_SELECTOR =
      ".rf-top-bar, .rf-lang-picker, .rf-lang-overlay, .rf-lang-panel, " +
      ".rf-lang-option, .rf-lang-close, .rf-lang-header, .rf-lang-title, " +
      ".rf-lang-grid, .rf-lang-code, .rf-lang-name, .rf-pause-btn, .rf-share-btn, .rf-mute-btn, .rf-tab-btn, " +
      ".rf-hud-main, .rf-hud-mini, [data-no-bubble-dismiss]";
    const onPointerDown = (event: PointerEvent) => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest(".rf-cutscene-back")) { back(); return; }
      if (target.closest(".rf-cutscene-skip")) { finish(); return; }
      if (target.closest(".rf-cutscene-next")) { advance(); return; }
      if (target.closest(MENU_SELECTOR)) return;
      advance();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [visible, idx, part, lines.length, phase]);

  const line = lines[idx];
  const skipLabel = getDialogSkip(lang);
  const nextLabel = translate(lang, "ui.dialog.next", undefined, "NEXT");
  const backLabel = translate(lang, "ui.dialog.back", undefined, "BACK");
  const speakerName = line ? (line.who === "rep" ? REP_NAME[planet] : getSpeakerName(String(line.who), lang, { planet, phase })) : "";
  const who = line ? String(line.who) : "";

  const SPKR_GAP = 18;
  const crowdLayout = getCrowdLayout(crowdMode, planet);
  const leaderCx =
    crowdLayout[REP_INDEX]?.x != null
      ? crowdLayout[REP_INDEX].x + NPC_HALF
      : bx + bw / 2;
  const crowdCenterCx =
    crowdLayout.length
      ? crowdLayout.reduce((acc, p) => acc + p.x + NPC_HALF, 0) / crowdLayout.length
      : bx + bw / 2;

  // P323 SAFE CROWD TAIL: только кончик в центр, основание фиксированное
  const useCrowdCenter =
    (crowdMode === "gather" && (who === "crowd" || who === "rep")) ||
    (phase === "departure" && who === "crowd");

  const spkCx =
    useCrowdCenter
      ? crowdCenterCx
      : who === "rep" || who === "crowd"
        ? leaderCx
        : who === "cyber" || who === "cyber_npc"
          ? cyberCx
          : bx + bw / 2;

  const spkTopY = (who === "cyber" || who === "cyber_npc" ? cyberTop : crowdTop) - SPKR_GAP;
  const isLeft = spkCx < bx + bw / 2;
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
  const canBack = idx > 0 || part > 0;
  const btnY = by + BH - BTN_PAD - 2;
  const btnTextY = btnY + 21;
  const cyberCenterX = heroCenterX(planet);
  const fleeDir = leaderCx < cyberCenterX ? -1 : 1;
  const faceCyber = cyberCenterX < leaderCx ? "left" : "right";
  const moving =
    (isAnimating && crowdMode !== "returnFace") ||
    crowdMode === "flee" ||
    crowdMode === "returnCluster" ||
    flee ||
    returning;
  const bubbleVisible = visible;
  const cheer = phase === "departure" && crowdMode === "gather";

  return (
    <g className="rf-cutscene-layer">
      {CROWD_POS.map((_p, i) => {
        const pos = crowdLayout[i];
        const away = fleeDir < 0 ? "left" : "right";
        let facing: "down" | "left" | "right" = "down";
        if (crowdMode === "flee") facing = away;
        else if (crowdMode === "returnCluster") facing = faceCyber;
        else if (crowdMode === "returnFace") facing = "down";
        else if (crowdMode === "preFlee") facing = i === REP_INDEX ? away : "down";
        else if (crowdMode === "repOut" || crowdMode === "returnRepOut") facing = i === REP_INDEX ? faceCyber : "down";
        else if (crowdMode === "gather") facing = "down";

        return (
          <g
            key={"crowd-wrap-" + i}
            className="rf-crowd-wrap"
            style={{
              transform: `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`,
              transition: firstFrame || reducedMotion ? "none" : `transform ${ANIM_MS}ms cubic-bezier(.22,.61,.36,1)`,
              willChange: "transform",
            }}
          >
            <g
              className={cheer ? "rf-crowd-cheer-jump" : undefined}
              style={
                cheer
                  ? {
                      animationDelay: `${(i * 0.17 + (i % 3) * 0.09).toFixed(2)}s`,
                      animationDuration: `${(0.78 + (i % 4) * 0.08).toFixed(2)}s`,
                    }
                  : undefined
              }
            >
              <NpcCompanion
                tokenId={residentTokenFor(i, REP_INDEX, planet)}
                x={0}
                y={0}
                accent={accent}
                speaker={i === REP_INDEX && crowdMode !== "gather"}
                facing={facing}
                walking={moving || (i === REP_INDEX && crowdMode === "preFlee")}
              />
            </g>
          </g>
        );
      })}

      {bubbleVisible && line && (
        <SpeechBubble
          bx={bx}
          by={by}
          bw={bw}
          tailPath={tailPath}
          ns="cutscene"
          accent={accent}
          speakerName={speakerName}
          page={page}
          btnY={btnY}
          btnTextY={btnTextY}
          backLabel={backLabel}
          nextLabel={nextLabel}
          skipLabel={skipLabel}
          canBack={canBack}
          onBack={back}
          onNext={advance}
          onSkip={finish}
        />
      )}
    </g>
  );
}
