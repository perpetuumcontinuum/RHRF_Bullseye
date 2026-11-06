import { getItemPrice } from "./engine/catalog";
import { JUMP_ARC_MS } from "./engine/jump";
import EntryFlow from "./engine/EntryFlow";
import React, { useState, useEffect, useRef, useMemo } from "react";
import LangMenu from "./engine/LangMenu";
import SessionNotice from "./engine/SessionNotice";
import { initI18n, setLang, useT, isRTL, useLang, getLang, translate } from "./engine/i18n";
import { rankForStreak, buildStreakMessage, buildTimeMessage, buildRfMessage, streakColor, isFinalRank, TIME_RANKS, RF_RANKS, KIND_COLOR, BadgeIcon } from "./engine/achievements";
import { getGameMode } from "./engine/catalog";
import { awardBadge } from "./engine/stats";
import { type GameStats, loadStats, saveStats } from "./engine/stats";
import { CATALOG, CONSUMABLE_CAP } from "./engine/catalog";
import {
  type PlanetMissions,
  emptyMissions,
  getMissionSupplyKind,
  loadMissions,
  missionItemIds,
  missionSupplyItemId,
  missionSupplyLabel,
  requiredRarity,
  saveMissions,
} from "./engine/missions";
import MissionList from "./engine/MissionList";
import { preloadNpcSprites } from "./engine/NpcCompanion";
import { createFriendSoundKit } from "@rarefriends/friendsdk/sounds";

try {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as unknown as Storage,
  });
} catch {}

const __rfOriginalConsoleError = (console as any).error.bind(console);
(console as any).error = (...args: any[]) => {
  const text = args.map((a) => {
    if (typeof a === "string") return a;
    if (a instanceof Error) return a.message;
    try { return String(a); } catch { return ""; }
  }).join(" ");

  if (
    text.includes("Failed to read the 'localStorage' property") ||
    text.includes("Failed to execute 'postMessage'") ||
    text.includes("allow-same-origin") ||
    text.includes("recipient window's origin ('null')")
  ) return;

  __rfOriginalConsoleError(...args);
};
let towerEventLockUntil = 0;
import { createFriendReader, spriteFrame } from "@rarefriends/friendsdk/sprites";
import Shop from "./engine/Shop";
import Hud from "./engine/Hud";
import ArrowHud from "./engine/ArrowHud";
import { SCORE_TARGET_X, SCORE_TARGET_Y, ARROW_POPUP_X, ARROW_POPUP_Y, NFT_ARROW_POPUP_X, NFT_ARROW_POPUP_Y, NFT_POPUP_DIP_DX, NFT_POPUP_DIP_DY, NFT_POPUP_DOWN, PLAYER_X, PLAYER_Y } from "./engine/geometry";
import TopHud from "./engine/TopBar";
import { calculateFinalScore, calculateScore, TARGET_CX, TARGET_CY, getRarityMult, TARGET_R, ARROW_START_X, ARROW_START_Y, getRandomPointInTarget, DEFAULT_WEAPON_COLORS } from "./engine/math";
import { isNftPlanet, getPlanetId, getPlanetTier, asteroidSpeedMult, getPlanetAccent, getNextPlanet, setPlanet, getLayout, targetX, heroX, heroLeftX, TOWER_ANT_Y, getPlanetMainColor } from "./engine/planets/planetRuntime";
import ArcLayer from "./engine/ArcLayer";
import ArcStage from "./engine/ArcStage";
import Guide from "./engine/Guide";
import Profile from "./engine/Profile";
import Scene from "./engine/Scene";
import "./style.css";

const TARGET_RESUME_LEAD_MS = 500;
const LASER_COOLDOWN_MS = 10000;
const ROBO_CYCLE = 100;
const GREAT_SINGULARITY_RF_PER_MIN = 500;
const ROBO_TOWER_X = 190;
const AUTO_BULLSEYE_R = 8.1;
const SALVO_GAP_MS = 1000;

const RUN_STORAGE_KEY = "rhrf-run-v1";

type SavedRun = {
  planet: string;
  inventory: string[];
  equippedBow: string | null;
  equippedHat: string | null;
  equippedAmulet: string | null;
  equippedArrow: string | null;
  lang?: string;
};

const RUN_BRIDGE_PREFIX = "RHRF_RUN:";

let _pendingRun: SavedRun | null | undefined;

function parseRun(raw: string): SavedRun | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedRun>;
    const planet = String(parsed.planet || "");
    if (!planet) return null;
    const inventory = Array.isArray(parsed.inventory) ? parsed.inventory.map((x) => String(x)) : [];
    const lang = typeof parsed.lang === "string" ? parsed.lang : undefined;
    return {
      planet,
      inventory,
      lang,
      equippedBow: typeof parsed.equippedBow === "string" ? parsed.equippedBow : null,
      equippedHat: typeof parsed.equippedHat === "string" ? parsed.equippedHat : null,
      equippedAmulet: typeof parsed.equippedAmulet === "string" ? parsed.equippedAmulet : null,
      equippedArrow: typeof parsed.equippedArrow === "string" ? parsed.equippedArrow : null,
    };
  } catch {
    return null;
  }
}

function takePendingRun(): SavedRun | null {
  if (_pendingRun !== undefined) return _pendingRun;
  _pendingRun = null;
  try {
    const raw = window.name || "";
    if (raw.startsWith(RUN_BRIDGE_PREFIX)) {
      window.name = "";
      _pendingRun = parseRun(raw.slice(RUN_BRIDGE_PREFIX.length));
    }
  } catch {}
  return _pendingRun;
}

function writeRunBridge(run: SavedRun): void {
  try {
    window.name = RUN_BRIDGE_PREFIX + JSON.stringify(run);
  } catch {}
}

function loadRun(): SavedRun | null {
  const pending = takePendingRun();
  if (pending) return pending;
  try {
    const raw = localStorage.getItem(RUN_STORAGE_KEY);
    return raw ? parseRun(raw) : null;
  } catch {
    return null;
  }
}

function saveRun(run: SavedRun): void {
  writeRunBridge(run);
  try { localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(run)); } catch {}
}

function getStarterSet(planetId: string) {
  const empty = {
    inventory: [] as string[],
    bow: null as string | null,
    hat: null as string | null,
    amulet: null as string | null,
    arrow: null as string | null,
  };
  if (planetId === "cyber" || planetId === "stable") return empty;
  const tier = getPlanetTier(planetId);
  if (tier <= 1) return empty;
  const ids = missionItemIds(tier - 1);
  return {
    inventory: [ids.bow, ids.hat, ids.amulet, ...Array<string>(CONSUMABLE_CAP).fill(ids.arrow)],
    bow: ids.bow,
    hat: ids.hat,
    amulet: ids.amulet,
    arrow: ids.arrow,
  };
}

let bootRun = takePendingRun();
if (bootRun && bootRun.planet) {
  try { (window as any).__RHRF_PLANET__ = bootRun.planet; } catch {}
}

const rwaLollipopPath = (() => {
  const cx = 580;
  const cy = 360;
  const turns = 7;
  const maxR = 780;
  const steps = 760;
  const a = maxR / (turns * 2 * Math.PI);
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * turns * 2 * Math.PI;
    const r = a * th;
    const x = cx + r * Math.cos(th);
    const y = cy + r * Math.sin(th);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d;
})();

function getInitialRf(): number {
  if (typeof window === "undefined") return 0;
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|::1/.test(window.location.hostname)) return 200000;
  return 0;
}

function RhrfBullseyeInner({ friendId, client }: { friendId: bigint; client?: any }) {
  const [gameStats, setGameStats] = useState<GameStats>(() => loadStats());
  const [arcMode, setArcMode] = useState<null | "intro" | "final" | "depart">(null);
  const arcIntroShownRef = useRef(false);
  const pendingNextRef = useRef<string>("");
  const addEarnedScore = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    setGameStats((prev) => {
      const next = { ...prev, earnedScore: prev.earnedScore + Math.floor(amount) };
      saveStats(next);
      return next;
    });
  };

  useEffect(() => { if (client) client.read().catch(() => {}); }, [client]);
  useEffect(() => {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='#0a0014'/><circle cx='32' cy='32' r='24' fill='none' stroke='#00ffff' stroke-width='4'/><circle cx='32' cy='32' r='15' fill='none' stroke='#ccff00' stroke-width='4'/><circle cx='32' cy='32' r='7' fill='#F7931A'/><line x1='32' y1='2' x2='32' y2='14' stroke='#ff00ff' stroke-width='4'/><line x1='32' y1='50' x2='32' y2='62' stroke='#ff00ff' stroke-width='4'/><line x1='2' y1='32' x2='14' y2='32' stroke='#ff00ff' stroke-width='4'/><line x1='50' y1='32' x2='62' y2='32' stroke='#ff00ff' stroke-width='4'/></svg>";
    let hostDoc: Document = document;
    try { if (window.top && window.top.document) hostDoc = window.top.document; } catch {}
    const link = hostDoc.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    hostDoc.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  const sounds = useMemo(() => createFriendSoundKit({ volume: 0.6 }), []);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlockAudio = async () => {
      if (unlockedRef.current) return;
      const ok = await sounds.unlock();
      if (ok) unlockedRef.current = true;
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [sounds]);

  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null);
  const [friendPixels, setFriendPixels] = useState<[number, number][]>([]);
  const [sidePixels, setSidePixels] = useState<[number, number][]>([]);
  const [backPixels, setBackPixels] = useState<[number, number][]>([]);
  const [leftPixels, setLeftPixels] = useState<[number, number][]>([]);
  const [heroWalkFrames, setHeroWalkFrames] = useState<{ down: [number, number][][]; right: [number, number][][]; up: [number, number][][]; left: [number, number][][] } | null>(null);
  const staticPixelsRef = useRef<{ down: [number, number][]; right: [number, number][]; up: [number, number][]; left: [number, number][] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(getInitialRf());
  const [isShooting, setIsShooting] = useState(false);
  const [forceSidePose, setForceSidePose] = useState(false);
  const [shotPhase, setShotPhase] = useState<'IDLE' | 'AIMING' | 'FLYING' | 'RESUMING'>('IDLE');
  const aimTimerRef = useRef<number | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpVariant, setJumpVariant] = useState("spin-360");
  const [isLaserFiring, setIsLaserFiring] = useState(false);
  const [laserCooldown, setLaserCooldown] = useState(false);
  const [asteroidPosition, setAsteroidPosition] = useState({ x: 0, y: 0 });
  const [asteroidVisible, setAsteroidVisible] = useState(false);
  const [explosions, setExplosions] = useState<Array<{id: number, x: number, y: number, particles: any[]}>>([]);

  useEffect(() => {
    const onAsteroidExplode = (e: CustomEvent<{x: number, y: number}>) => {
      const id = Date.now() + Math.random();
      const N = 30;
      const particles = Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const sp = 90 + Math.random() * 110;
        return {
          dx: Math.cos(a) * sp,
          dy: Math.sin(a) * sp - 30,
          fall: 50 + Math.random() * 60,
          rot: (Math.random() - 0.5) * 540,
          size: 4 + Math.floor(Math.random() * 4) * 2,
          delay: Math.random() * 0.08,
          pal: i % 10,
        };
      });
      setExplosions(prev => [...prev, { id, x: e.detail.x, y: e.detail.y, particles }]);
      setTimeout(() => {
        setExplosions(prev => prev.filter(exp => exp.id !== id));
      }, 2200);
    };
    window.addEventListener("rhrf-asteroid-explode", onAsteroidExplode as EventListener);
    return () => window.removeEventListener("rhrf-asteroid-explode", onAsteroidExplode as EventListener);
  }, []);

  const [landingGlow, setLandingGlow] = useState({ x: 0, y: 480, visible: false });
const [screenShake, setScreenShake] = useState(false);
const [asteroidWarning, setAsteroidWarning] = useState(false);
const [explosion, setExplosion] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [streakBanner, setStreakBanner] = useState<{ text: string; count: number; kind: "cyber" | "ghost" | "asteroid" | "time" | "rf" | "arcade" | "singularity"; badge: { icon: string; label: string } | null } | null>(null);
  const streaksRef = useRef({ cyber: 0, ghost: 0, asteroid: 0 });

  const unlockBadge = (id: string) => {
    if (getGameMode() === "arcade") return; // достижения не учитываются в аркаде; arcade_1 идёт через awardBadge (stats.ts) и не затронут
    setGameStats((prev) => {
      if (prev.earnedBadges.includes(id)) return prev;
      const next = { ...prev, earnedBadges: [...prev.earnedBadges, id] };
      saveStats(next);
      return next;
    });
  };

  const tt: (key: string, params?: Record<string, string | number>, fallback?: string) => string =
    (key, params, fallback) => translate(getLang(), key, params, fallback);
  const showStreakAlert = (kind: "cyber" | "ghost" | "asteroid") => {
    if (autoPilotRef.current || greatPilotRef.current) return;
    const count = streaksRef.current[kind];
    const rank = rankForStreak(kind, count);
    if (!rank) return;
    const already = loadStats().earnedBadges.includes(rank.id);
    if (already) return; // значок уже получен — ни баннера, ни повторной награды за ранг
    unlockBadge(rank.id);
    if (kind === "ghost") {
      const sb = getPlanetTier(getPlanetId());
      setTotalScore((v) => v + sb);
      addEarnedScore(sb);
    }
    if (getGameMode() === "arcade") return; // уведомления о достижениях не показываются в аркаде
    setStreakBanner({
      text: buildStreakMessage(kind, count, tt, undefined, already),
      count,
      kind,
      badge: already ? null : { icon: rank.icon, label: rank.label },
    });
    pt(() => setStreakBanner(null), !already && isFinalRank(kind, count) ? 60000 : 5000);
  };

  const showSingularityAlert = () => {
    const id = "singularity_1";
    const already = loadStats().earnedBadges.includes(id);
    if (already) return;
    unlockBadge(id);
    if (getGameMode() === "arcade") return;
    setStreakBanner({
      text: tt("notif.singularity", undefined, "SINGULARITY REACHED"),
      count: 1,
      kind: "singularity",
      badge: { icon: "s_1", label: tt("badge.singularity_1", undefined, "SINGULARITY LEGEND") },
    });
    pt(() => setStreakBanner(null), 5000);
  };

  const lastHoursRef = useRef<number | null>(null);

  useEffect(() => {
    const hours = Math.floor(gameStats.totalPlayMs / 3600000);
    if (lastHoursRef.current === null) {

      TIME_RANKS.filter((r) => r.n <= hours).forEach((r) => unlockBadge(r.id));
      lastHoursRef.current = hours;
      return;
    }
    const prevHours = lastHoursRef.current;
    lastHoursRef.current = hours;
    if (hours <= prevHours) return;
    const crossed = TIME_RANKS.filter((r) => r.n > prevHours && r.n <= hours);
    if (!crossed.length) return;
    const rank = crossed[crossed.length - 1];
    const already = loadStats().earnedBadges.includes(rank.id);
    if (already) return; // значок уже получен — молчим
    crossed.forEach((r) => unlockBadge(r.id));
    if (getGameMode() === "arcade") return; // уведомления о достижениях не показываются в аркаде
    setStreakBanner({
      text: buildTimeMessage(rank.n, tt, undefined, already),
      count: rank.n,
      kind: "time",
      badge: already ? null : { icon: rank.icon, label: rank.label },
    });
    pt(() => setStreakBanner(null), isFinalRank("time", rank.n) ? 60000 : 5000);
  }, [gameStats.totalPlayMs]);

  const lastRfRef = useRef<number | null>(null);

  useEffect(() => {
    const earned = gameStats.earnedScore;
    if (lastRfRef.current === null) {

      RF_RANKS.filter((r) => r.n <= earned).forEach((r) => unlockBadge(r.id));
      lastRfRef.current = earned;
      return;
    }
    const prev = lastRfRef.current;
    lastRfRef.current = earned;
    if (earned <= prev) return;
    const crossed = RF_RANKS.filter((r) => r.n > prev && r.n <= earned);
    if (!crossed.length) return;
    const rank = crossed[crossed.length - 1];
    const already = loadStats().earnedBadges.includes(rank.id);
    if (already) return; // значок уже получен — молчим в обоих режимах
    crossed.forEach((r) => unlockBadge(r.id));
    if (getGameMode() === "arcade") return; // уведомления о достижениях не показываются в аркаде
    setStreakBanner({
      text: buildRfMessage(rank.n, tt),
      count: rank.n,
      kind: "rf",
      badge: { icon: rank.icon, label: rank.label },
    });
    pt(() => setStreakBanner(null), isFinalRank("rf", rank.n) ? 60000 : 5000);
  }, [gameStats.earnedScore]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isTest = /localhost|127\.0\.0\.1/.test(host) || RHRF_TEST_HOSTS.includes(host);
    if (!isTest) return;
    (window as any).__RHRF_ADD_HOURS__ = (h: number) => {
      setGameStats((prev) => {
        const next = { ...prev, totalPlayMs: prev.totalPlayMs + Math.max(0, Math.floor(h)) * 3600000 };
        saveStats(next);
        return next;
      });
    };
    (window as any).__RHRF_ADD_RF__ = (v: number) => {
      setGameStats((prev) => {
        const next = { ...prev, earnedScore: prev.earnedScore + Math.max(0, Math.floor(v)) };
        saveStats(next);
        return next;
      });
    };
    return () => { delete (window as any).__RHRF_ADD_HOURS__; delete (window as any).__RHRF_ADD_RF__; };
  }, []);
const impactTimersRef = useRef<number[]>([]);
const asteroidKilledRef = useRef(false);
  const asteroidSeqRef = useRef(0);
  const asteroidLiveRef = useRef(false);
  const asteroidPosLiveRef = useRef({ x: 0, y: 0 });
  const asteroidArmedRef = useRef(false);
  const salvoDoneRef = useRef(false);
  const shieldDoneRef = useRef(false);
  const [laserTargetY, setLaserTargetY] = useState(0);
  const [arrowProgress, setArrowProgress] = useState(0);
  const [laserPos, setLaserPos] = useState(getRandomPointInTarget());
  const [laserTarget, setLaserTarget] = useState(getRandomPointInTarget());
  const [stuckArrows, setStuckArrows] = useState<{x: number, y: number, qualityId: string | null; color?: string}[]>([]);
  const shotTargetRef = useRef<{ x: number; y: number } | null>(null);
  const laserPosLiveRef = useRef(laserPos);
  const [scorePopups, setScorePopups] = useState<{x: number, y: number, score: number, isBullseye?: boolean, color?: string, dx?: number, dy?: number, swoosh?: boolean, sx?: number, sy?: number, id: number}[]>([]);

  const [rfCoins, setRfCoins] = useState<{ id: number; x: number; y: number; tx: number; ty: number; size: number; amount: number }[]>([]);
  const [missions, setMissions] = useState<Record<string, PlanetMissions>>(() => loadMissions());
  const [rwaBulls, setRwaBulls] = useState(0);
  const [rwaMissions, setRwaMissions] = useState({ bow: false, hat: false, amulet: false, arrows: false });
  const rwaBullsRef = useRef(0);
  const [rwaIntroDone, setRwaIntroDone] = useState(false);
  const [rwaFarewellShown, setRwaFarewellShown] = useState(false);
  const [rwaFacing, setRwaFacing] = useState<"front" | "back">("front");
  const [rwaRunesGray] = useState(false);
  const [rwaTowerReady, setRwaTowerReady] = useState(false);
  const [rwaTowerCharged, setRwaTowerCharged] = useState(false);
  const rwaTowerChargedRef = useRef(false);
  const [rwaStoneDamage, setRwaStoneDamage] = useState(0);
  const rwaStoneDamageRef = useRef(0);
  const [rwaWavePulses, setRwaWavePulses] = useState(0);
  const [rwaWaveKey, setRwaWaveKey] = useState(0);
  const [rwaStonePhase, setRwaStonePhase] = useState<"alive" | "red" | "gone" | "gray">("alive");
  const rwaStonePhaseRef = useRef<"alive" | "red" | "gone" | "gray">("alive");
  const rwaBannerTimerRef = useRef<number | null>(null);
  const [rwaHeroMode, setRwaHeroMode] = useState<"normal" | "side" | "stand" | "fade" | "hidden">("normal");
  const [rwaSpiral, setRwaSpiral] = useState(false);
  const [rwaEnded, setRwaEnded] = useState(false);
  const [rwaPortalOpen, setRwaPortalOpen] = useState(false);
  const rwaPortalOpenRef = useRef(false);
  const [rwaPortalPhase, setRwaPortalPhase] = useState<"closed" | "open" | "closing">("closed");
  const rwaHeroModeRef = useRef<"normal" | "side" | "stand" | "fade" | "hidden">("normal");

  useEffect(() => {
    if (rwaBulls === 0 && rwaStoneDamageRef.current > 0) {
      rwaStoneDamageRef.current = 0;
      setRwaStoneDamage(0);
    }
  }, [rwaBulls]);
  const enterRwaPortalRef = useRef<() => void>(() => {});
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator as any).maxTouchPoints > 0);

  const showRwaBanner = (text: string, count = 0, ms = 2500) => {
    if (rwaBannerTimerRef.current !== null) window.clearTimeout(rwaBannerTimerRef.current);
    setStreakBanner({ text, count, kind: "cyber", badge: null });
    rwaBannerTimerRef.current = window.setTimeout(() => {
      setStreakBanner(null);
      rwaBannerTimerRef.current = null;
    }, ms);
  };
  const rwaFacingRef = useRef<"front" | "back">("front");
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let face: "front" | "back" = "front";

    const apply = (f: "front" | "back") => {
      face = f;
      rwaFacingRef.current = f;
      setRwaFacing(f);
    };

    let prevPlanet = getPlanetId();
    const loop = () => {
      if (cancelled) return;
      const planet = getPlanetId();
      if (planet !== prevPlanet) {
        prevPlanet = planet;
        if (planet === "rwa") {
          rwaBullsRef.current = 0;
          rwaTowerChargedRef.current = false;
          setRwaTowerCharged(false);
          rwaStoneDamageRef.current = 0;
          setRwaStoneDamage(0);
          setRwaWavePulses(0);
          setRwaWaveKey(0);
          setRwaBulls(0);
          setRwaMissions({ bow: false, hat: false, amulet: false, arrows: false });
          setRwaTowerReady(false);
          rwaStonePhaseRef.current = "alive";
          setRwaStonePhase("alive");
          setRwaIntroDone(false);
          setRwaFarewellShown(false);
          setRwaHeroMode("normal");
          rwaHeroModeRef.current = "normal";
          rwaPortalOpenRef.current = false;
          setRwaPortalOpen(false);
          setRwaPortalPhase("closed");
          setRwaSpiral(false);
          setRwaEnded(false);
        }
      }
      const active = planet === "rwa" && cyberRef.current;
      if (!active) {
        if (face !== "front") apply("front");
        timer = window.setTimeout(loop, 500);
        return;
      }

      const hold = face === "front"
        ? 13000 + Math.random() * 6000
        : 4000 + Math.random() * 4000;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        apply(face === "front" ? "back" : "front");
        loop();
      }, hold);
    };

    loop();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const scoreTargetSvg = () => {
    const svg = document.getElementById("rhrf-scene-svg") as unknown as SVGSVGElement | null;
    const el = document.querySelector(".rf-top-bar__score");
    if (!svg || !el) return { x: 342, y: 40 };

    const r = el.getBoundingClientRect();
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 342, y: 40 };

    const pt = svg.createSVGPoint();
    pt.x = r.left + r.width / 2;
    pt.y = r.top + r.height / 2;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const spawnRfCoin = (sx: number, sy: number, amount: number) => {
    const value = Math.floor(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    const svg = document.getElementById("rhrf-scene-svg") as SVGSVGElement | null;
    const rfEl = document.querySelector(".rf-top-bar__rf");
    let tx = 658;
    let ty = 40;

    if (svg && rfEl) {
      const r = rfEl.getBoundingClientRect();
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = r.left + r.width / 2;
        pt.y = r.top + r.height / 2;
        const local = pt.matrixTransform(ctm.inverse());
        tx = local.x;
        ty = local.y;
      }
    }

    const coinStartX = getPlanetId() === "bitcoin" ? Math.max(60, Math.min(sx, tx - 420)) : sx;
    const id = Date.now() + Math.random();
    const size = 70;
    const off = 22 + 10 + size / 2;
    const y = sy - off;

    setRfCoins((arr) => [...arr, { id, x: coinStartX, y, tx, ty, size, amount: value }]);

    window.setTimeout(() => {
      const el = document.querySelector(".rf-top-bar__rf");
      if (!el) return;
      const box = el as HTMLElement;
      box.classList.remove("rf-top-bar__rf--zebra");
      void box.offsetWidth;
      box.classList.add("rf-top-bar__rf--zebra");
      window.setTimeout(() => box.classList.remove("rf-top-bar__rf--zebra"), 950);
    }, 1000);
  };;
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const CYBER_BULLSEYE_COLOR = "cyber";
  const [showShop, setShowShop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const showShopRef = useRef(false);
  const showProfileRef = useRef(false);
  const showGuideRef = useRef(false);
  const showLangRef = useRef(false);

  const isMenuOpenRef = () =>
    showShopRef.current || showProfileRef.current || showGuideRef.current || showLangRef.current;

  useEffect(() => {
    showShopRef.current = showShop;
    showProfileRef.current = showProfile;
    showGuideRef.current = showGuide;
    showLangRef.current = showLang;
  }, [showShop, showProfile, showGuide, showLang]);

  const menuOpen = showShop || showProfile || showGuide || showLang;
  const overlayWasPausedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (menuOpen) {
      if (overlayWasPausedRef.current === null) {
        overlayWasPausedRef.current = pausedRef.current;
        setIsPaused(true);
      }
    } else if (overlayWasPausedRef.current !== null) {
      setIsPaused(overlayWasPausedRef.current);
      overlayWasPausedRef.current = null;
    }
  }, [menuOpen]);
  const usedRun = bootRun ?? loadRun();
  const useStarter = usedRun === null;
  const starter = useStarter ? getStarterSet(getPlanetId()) : null;
  const [inventory, setInventory] = useState<string[]>(usedRun ? usedRun.inventory : (starter?.inventory ?? []));
  const [equippedBow, setEquippedBow] = useState<string | null>(usedRun ? usedRun.equippedBow : (starter?.bow ?? null));
  const [equippedAmulet, setEquippedAmulet] = useState<string | null>(usedRun ? usedRun.equippedAmulet : (starter?.amulet ?? null));
  const [equippedHat, setEquippedHat] = useState<string | null>(usedRun ? usedRun.equippedHat : (starter?.hat ?? null));
  const [equippedArrow, setEquippedArrow] = useState<string | null>(usedRun ? usedRun.equippedArrow : (starter?.arrow ?? null));
  const [equippedArmor, setEquippedArmor] = useState<string | null>(null);
  const [isFallen, setIsFallen] = useState(false);

  useEffect(() => {
    (window as any).__RHRF_IS_JUMPING__ = isJumping;
  }, [isJumping]);

  useEffect(() => {
    (window as any).__RHRF_IS_FALLEN__ = isFallen;
  }, [isFallen]);
  const [fallRemaining, setFallRemaining] = useState(0);
  const [equippedEnergy, setEquippedEnergy] = useState<string | null>(null);
  const [autoSet, setAutoSet] = useState<Set<string>>(new Set());
  const [shotArrowId, setShotArrowId] = useState<string | null>(null);
  const [towerEnergyId, setTowerEnergyId] = useState<string | null>(null);
  const [towerActivated, setTowerActivated] = useState(false);
  const [towerBeamActive, setTowerBeamActive] = useState(false);
  const [waveR, setWaveR] = useState(-1);
  const waveRafRef = useRef(0);
  const inputLockedRef = useRef(false);
  const salvoBeamSeqRef = useRef(0);
  const salvoActiveRef = useRef(false);
  const salvoKilledRef = useRef(0);
  const salvoSpawnRef = useRef<(() => void) | null>(null);
  const salvoTimersRef = useRef<number[]>([]);
  const salvoSpawnedRef = useRef(0);
  const salvoClockRef = useRef(0);
  const salvoLastRef = useRef(0);
  const salvoRafRef = useRef(0);
  const [equippedConsumable, setEquippedConsumable] = useState<string | null>(null);

  const [isCyberStyle, setIsCyberStyle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [entryDone, setEntryDone] = useState(Boolean(bootRun));
  useEffect(() => {
    (window as any).__RHRF_IS_PAUSED__ = isPaused;
    pausedRef.current = isPaused;
    const svg = document.getElementById("rhrf-scene-svg") as SVGSVGElement | null;
    try {
      void svg;
      document.querySelectorAll("svg").forEach((el) => {
        const svgEl = el as SVGSVGElement;
        if (isPaused) svgEl.pauseAnimations?.();
        else svgEl.unpauseAnimations?.();
      });
    } catch {}
  }, [isPaused]);
  const pausedRef = useRef(false);
  const AUTO_PAUSE_HIDDEN_KEY = "rf-auto-pause-on-hidden";
  const [autoPauseOnHidden, setAutoPauseOnHidden] = useState(() => {
    try { return localStorage.getItem(AUTO_PAUSE_HIDDEN_KEY) !== "0"; } catch { return true; }
  });
  const autoPauseOnHiddenRef = useRef(autoPauseOnHidden);
  autoPauseOnHiddenRef.current = autoPauseOnHidden;

  useEffect(() => { if (bootRun?.lang) setLang(bootRun.lang); else initI18n(); }, []);

  const cyberPlateauNotifiedRef = useRef(false);

  useEffect(() => {
    let prevPlanet = getPlanetId();

    const tryNotify = () => {
      const planet = getPlanetId();

      if (planet !== prevPlanet) {
        prevPlanet = planet;
        if (planet !== "cyber") {
          cyberPlateauNotifiedRef.current = false;
        }
      }

      if (planet !== "cyber") return;
      if (!entryDone) return;
      if (getGameMode() !== "leaderboard") return;
      if (cyberPlateauNotifiedRef.current) return;

      cyberPlateauNotifiedRef.current = true;

      const fresh = awardBadge("arcade_1");
      window.dispatchEvent(
        new CustomEvent("rhrf:arcade-complete", { detail: { fresh } })
      );
    };

    tryNotify();
    const id = window.setInterval(tryNotify, 250);
    return () => window.clearInterval(id);
  }, [entryDone]);
  const langCode = useLang();
  useEffect(() => {
    const el = gameContainerRef.current;
    if (el) el.classList.toggle("rf-rtl", isRTL(langCode));
  }, [langCode]);
  const t = useT();
  useEffect(() => {

    const onVisibility = () => {
      if (document.hidden && autoPauseOnHiddenRef.current) {
        pausedRef.current = true;
        (window as any).__RHRF_IS_PAUSED__ = true;
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let started = false;
    const kick = () => {
      if (started) return;
      started = true;
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        const c: AudioContext = new AC();
        const g = c.createGain();
        g.gain.value = 0.0001;
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = 60;
        o.connect(g);
        g.connect(c.destination);
        o.start();
        if (c.state === "suspended") void c.resume();
        ctx = c;
        osc = o;
      } catch {}
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      try { osc?.stop(); } catch {}
      try { void ctx?.close(); } catch {}
    };
  }, []);

  const ptSeqRef = useRef(0);
  const ptMapRef = useRef(new Map<number, { fn: () => void; remaining: number }>());
  const ptRafRef = useRef(0);

  const pt = (fn: () => void, ms: number): number => {
    const id = ++ptSeqRef.current;
    ptMapRef.current.set(id, { fn, remaining: ms });
    return id;
  };

  useEffect(() => {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (!pausedRef.current && ptMapRef.current.size > 0) {
        const fired: number[] = [];
        ptMapRef.current.forEach((v, id) => {
          v.remaining -= dt;
          if (v.remaining <= 0) fired.push(id);
        });
        fired.forEach((id) => {
          const item = ptMapRef.current.get(id);
          ptMapRef.current.delete(id);
          item?.fn();
        });
      }
      ptRafRef.current = requestAnimationFrame(tick);
    };
    ptRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(ptRafRef.current);
      ptMapRef.current.clear();
    };
  }, []);
  const asteroidPausedRef = useRef(false);
  const asteroidPauseSinceRef = useRef(0);
  const asteroidPauseAccumRef = useRef(0);
  const arrowPausedRef = useRef(false);
  const arrowPauseSinceRef = useRef(0);
  const arrowPauseAccumRef = useRef(0);
  const asteroidFinalXRef = useRef(0);
  const jumpPausedRef = useRef(false);
  const jumpPauseSinceRef = useRef(0);
  const jumpPauseAccumRef = useRef(0);
  const mutedRef = useRef(false);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;

      const kit = sounds as any;

      try {
        if (typeof kit.setVolume === "function") {
          kit.setVolume(next ? 0 : 0.6);
        }
      } catch {
      }

      return next;
    });
  };

  const toggleAutoPauseOnHidden = () => {
    setAutoPauseOnHidden((prev) => {
      const next = !prev;
      autoPauseOnHiddenRef.current = next;
      try { localStorage.setItem(AUTO_PAUSE_HIDDEN_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const togglePause = () => {
    if (menuOpen) return;
    setIsPaused((prev) => {
      const next = !prev;
      pausedRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const el = gameContainerRef.current;
    if (!el) return;
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 960, h / 640);
      el.style.setProperty("--rf-scale", String(s));
    };
    apply();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(apply);
      ro.observe(document.documentElement);
    }
    window.addEventListener("resize", apply);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  const playSound = (name: string) => {
    if (mutedRef.current) return;

    const kit = sounds as any;

    try {
      if (typeof kit.setVolume === "function") {
        kit.setVolume(0.6);
      }

      if (typeof kit.play === "function") {
        kit.play(name);
      } else if (typeof kit.playSound === "function") {
        kit.playSound(name);
      } else if (typeof kit.trigger === "function") {
        kit.trigger(name);
      } else if (typeof kit.emit === "function") {
        kit.emit(name);
      }
    } catch {
    }
  };

      const hasCyberUnlock = useMemo(() => {
    const owned = new Set(inventory.map((id) => String(id).toLowerCase()));
    const required = [
      "bow_rare", "bow_epic", "bow_legendary",
      "hat_rare", "hat_epic", "hat_legendary",
      "amulet_rare", "amulet_epic", "amulet_legendary",
    ];
    return required.every((id) => owned.has(id));
  }, [inventory]);
  const effectiveCyberStyle = Boolean(isCyberStyle && hasCyberUnlock);
  const [autoPilot, setAutoPilot] = useState(false);
  const [greatPilot, setGreatPilot] = useState(false);

  useEffect(() => {
    if (autoPilot && effectiveCyberStyle) showSingularityAlert();
  }, [autoPilot, effectiveCyberStyle]);
  const fireRef = useRef<() => void>(() => {});
  const autoPilotRef = useRef(false);
  const greatPilotRef = useRef(false);
  const roboSourceRef = useRef<"auto" | "manual" | null>(null);
  const roboPendingRef = useRef<{ ch: "b" | "a" | "g" } | null>(null);
  const lastJumpSourceRef = useRef<"auto" | "manual" | null>(null);
  const lastTowerSourceRef = useRef<"auto" | "manual" | null>(null);
  const prevGreatRef = useRef(false);
  const totalScoreRef = useRef(0);
  autoPilotRef.current = autoPilot;
  greatPilotRef.current = greatPilot;
  totalScoreRef.current = totalScore;
  (window as any).__RHRF_ROBO_ACTIVE__ = autoPilot;
  (window as any).__RHRF_GREAT_ACTIVE__ = greatPilot;
  const [roboUi, setRoboUi] = useState<{ b: number; a: number; g: number } | null>(null);
  const [rerollMsg, setRerollMsg] = useState<string | null>(null);
  const roboRef = useRef<{
    b: { left: number; skill: number; step: number; misses: boolean[] };
    a: { left: number; skill: number; step: number; misses: boolean[] };
    g: { left: number; skill: number; step: number; misses: boolean[] };
    lastAstSeq: number;
    pendAstSeq: number | null;
    ghostEnc: boolean;
    pendGhost: boolean;
  } | null>(null);
  const roboColor = autoPilot ? "#c8d0d9" : "#8f99a6";
  const roboBg = autoPilot ? "#6f7884" : "#11161c";
  const rollSkill = () => 90 + Math.floor(Math.random() * 11);
  const ROBO_CH = { b: "BULLSEYE", a: "ASTEROID", g: "GHOST" } as const;

  const makeRoboMisses = (skill: number) => {
    const arr = new Array<boolean>(ROBO_CYCLE).fill(false);
    const missCount = Math.max(0, ROBO_CYCLE - skill);
    const pool = Array.from({ length: ROBO_CYCLE }, (_, i) => i);
    for (let i = 0; i < missCount; i++) {
      const j = i + Math.floor(Math.random() * (ROBO_CYCLE - i));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
      arr[pool[i]] = true;
    }
    return arr;
  };

  const makeRoboCh = () => {
    const skill = rollSkill();
    return { left: ROBO_CYCLE, skill, step: 0, misses: makeRoboMisses(skill) };
  };

  const isRoboMiss = (ch: "b" | "a" | "g") => {
    if (greatPilotRef.current) return false;
    const st = roboRef.current;
    if (!st) return false;
    const e = st[ch];
    return !!e.misses[Math.min(e.step, ROBO_CYCLE - 1)];
  };

  const syncRoboUi = () => {
    const st = roboRef.current;
    if (!st) return;
    setRoboUi({ b: st.b.left, a: st.a.left, g: st.g.left });
  };

  const advanceRobo = (ch: "b" | "a" | "g") => {
    if (greatPilotRef.current) return;
    const st = roboRef.current;
    if (!st) return;
    const e = st[ch];

    e.step += 1;
    e.left = Math.max(0, ROBO_CYCLE - e.step);

    if (ch === "a") st.pendAstSeq = null;
    if (ch === "g") {
      st.ghostEnc = false;
      st.pendGhost = false;
    }

    if (e.left <= 0) {
      e.skill = rollSkill();
      e.step = 0;
      e.left = ROBO_CYCLE;
      e.misses = makeRoboMisses(e.skill);
      setRerollMsg(`${ROBO_CH[ch]} REROLL — ${e.skill}%`);
      pt(() => setRerollMsg(null), 5000);
    }

    syncRoboUi();
  };
  const towerFireRef = useRef<() => void>(() => {});
  const jumpRef = useRef<() => void>(() => {});
  const ghostJumpPendingRef = useRef(false);
  const cyberRef = useRef(false);
  const hatRef = useRef<string | null>(null);
  const amuletRef = useRef<string | null>(null);
  const bowRef = useRef<string | null>(null);
  const armorRef = useRef<string | null>(null);
  const inventoryRef = useRef<string[]>([]);
  const equippedArrowRef = useRef<string | null>(null);
  const equippedEnergyRef = useRef<string | null>(null);
  equippedEnergyRef.current = equippedEnergy;

  const popupIdCounter = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef<any>({ fire: null, towerFire: null, jump: null });

  useEffect(() => {
    equippedArrowRef.current = equippedArrow;
  }, [equippedArrow]);
  const stateRef = useRef<'IDLE' | 'SHOOTING'>('IDLE');
  const resumingRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFriendSprite = async () => {
      try {
        const sprites = await createFriendReader().read(friendId);
        const parseRows = (rows: string[]) => {
          const pixels: [number, number][] = [];
          rows.forEach((row, y) => {
            [...String(row)].forEach((pixel, x) => {
              if (pixel === "#") pixels.push([x, y]);
            });
          });
          return pixels;
        };

        const frontFrame = spriteFrame(sprites, "down", false, 0, "right").frame;
        const frontPixels = parseRows((frontFrame as any).rows ?? []);

        let sidePixelsLoaded: [number, number][] = [];
        try {
          const sideFrame = spriteFrame(sprites, "right", false, 0, "right").frame;
          sidePixelsLoaded = parseRows((sideFrame as any).rows ?? []);
        } catch {
          sidePixelsLoaded = [];
        }
        let backPixelsLoaded: [number, number][] = [];
        try {
          const backFrame = spriteFrame(sprites, "up", false, 0, "right").frame;
          backPixelsLoaded = parseRows((backFrame as any).rows ?? []);
        } catch {
          backPixelsLoaded = [];
        }
        let leftPixelsLoaded: [number, number][] = [];
        try {
          const leftFrame = spriteFrame(sprites, "left", false, 0, "right").frame;
          leftPixelsLoaded = parseRows((leftFrame as any).rows ?? []);
        } catch {
          leftPixelsLoaded = [];
        }

        const readWalk = (facing: "down" | "right" | "up" | "left") => {
          try {
            const clip = (sprites as any).clips?.walk?.[facing];
            const len = Array.isArray(clip) ? clip.length : 0;
            if (!len) return [] as [number, number][][];
            const frames: [number, number][][] = [];
            for (let i = 0; i < len; i++) {
              const fr = spriteFrame(sprites, facing, true, i, "right").frame;
              const px = parseRows((fr as any).rows ?? []);
              if (px.length) frames.push(px);
            }
            return frames;
          } catch {
            return [] as [number, number][][];
          }
        };

        const bbox = (px: [number, number][]) => {
          if (!px.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
          let minX = px[0][0], minY = px[0][1], maxX = px[0][0], maxY = px[0][1];
          for (const [x, y] of px) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
          return { minX, minY, maxX, maxY };
        };

        const centerOf = (b: { minX: number; minY: number; maxX: number; maxY: number }) => ({
          x: (b.minX + b.maxX + 1) / 2,
          y: (b.minY + b.maxY + 1) / 2,
        });

        const normalizeWalk = (base: [number, number][], frames: [number, number][][]) => {
          if (!base.length || !frames.length) return frames;
          const bc = centerOf(bbox(base));
          return frames
            .map((px) => {
              const fc = centerOf(bbox(px));
              const dx = bc.x - fc.x;
              const dy = bc.y - fc.y;
              return px.map(([x, y]) => [x + dx, y + dy] as [number, number]);
            })
            .filter((px) => px.length > 0);
        };

        const walkFrames = {
          down: normalizeWalk(frontPixels, readWalk("down")),
          right: normalizeWalk(sidePixelsLoaded, readWalk("right")),
          up: normalizeWalk(backPixelsLoaded, readWalk("up")),
          left: normalizeWalk(leftPixelsLoaded, readWalk("left")),
        };

        if (!cancelled) {
          staticPixelsRef.current = { down: frontPixels, right: sidePixelsLoaded, up: backPixelsLoaded, left: leftPixelsLoaded };
          (window as any).__RHRF_HERO_WALK_FRAMES__ = walkFrames;
          setHeroWalkFrames(walkFrames);
          setFriendPixels(frontPixels);
          setSidePixels(sidePixelsLoaded);
          setBackPixels(backPixelsLoaded);
          setLeftPixels(leftPixelsLoaded);
          if (frontPixels.length > 0) setNftImageUrl(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("[RF] friend sprite load failed", err);
        if (!cancelled) setLoading(false);
      }
    };

    loadFriendSprite();

    return () => {
      cancelled = true;
    };
  }, [friendId]);

  useEffect(() => {
    if (arcMode !== "depart") return;
    const statics = staticPixelsRef.current;
    const walks = heroWalkFrames;
    if (!statics || !walks) return;
    const hasWalk = [walks.down, walks.right, walks.up, walks.left].some((a) => a && a.length > 0);
    if (!hasWalk) return;
    let frame = 0;
    let id = 0;
    let lastWalking = false;
    const applyStatic = () => {
      setFriendPixels(statics.down);
      setSidePixels(statics.right);
      setBackPixels(statics.up);
      setLeftPixels(statics.left);
    };
    const applyWalk = () => {
      const down = walks.down.length ? walks.down[frame % walks.down.length] : statics.down;
      const right = walks.right.length ? walks.right[frame % walks.right.length] : statics.right;
      const up = walks.up.length ? walks.up[frame % walks.up.length] : statics.up;
      const left = walks.left.length ? walks.left[frame % walks.left.length] : statics.left;
      setFriendPixels(down);
      setSidePixels(right);
      setBackPixels(up);
      setLeftPixels(left);
    };
    const tick = () => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      const walking = Boolean((window as any).__RHRF_DEPART_WALKING__);
      if (walking) {
        if (!lastWalking) {
          lastWalking = true;
          frame = 0;
          applyWalk();
        } else {
          frame += 1;
          applyWalk();
        }
      } else if (lastWalking) {
        lastWalking = false;
        frame = 0;
        applyStatic();
      }
    };
    const start = () => {
      if (id) return;
      id = window.setInterval(tick, 120);
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
    return () => {
      stop();
      window.clearInterval(watch);
      applyStatic();
      (window as any).__RHRF_DEPART_WALKING__ = false;
    };
  }, [arcMode, heroWalkFrames]);

  useEffect(() => {
    if (loading) return;
    let raf: number;

    const loop = () => {

      if (pausedRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (stateRef.current === 'IDLE' || resumingRef.current) {
        setLaserPos(prev => {
          const dx = laserTarget.x - prev.x;
          const dy = laserTarget.y - prev.y;
          if (Math.sqrt(dx*dx + dy*dy) < 1) {
            setLaserTarget(getSmartTarget(equippedHat));
            return prev;
          }
          const amuletSlow = getRarityMult(amuletRef.current ?? equippedAmulet) + ((cyberRef.current || autoPilotRef.current) ? 1 : 0);
          const speed = Math.min((0.32 + Math.random() * 0.96) / amuletSlow, 0.85);
          const next = { x: prev.x + dx * speed, y: prev.y + dy * speed };
          laserPosLiveRef.current = next;
          return next;
        });
}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loading, laserTarget, laserPos]);

  useEffect(() => {
        const onSatellitePass = () => {
      const pid = getPlanetId();
      const cyberMap = pid === "cyber";
      const energyId = cyberMap
        ? "energy_rare"
        : pid === "bitcoin"
          ? "energy_legendary"
          : pid === "nft"
            ? "energy_epic"
            : "energy_rare";

      if (cyberMap) {
        (window as any).__RHRF_SAT_DROP_ID__ = energyId;
        (window as any).__RHRF_SAT_DROP_MODE__ =
          greatPilotRef.current ? "gold" :
          autoPilotRef.current ? "metal" :
          "rare";
      }
      setInventory((inv) => {
        if (inv.filter((x) => x === energyId).length >= 100) return inv;
        return [...inv, energyId];
      });
    };
    window.addEventListener('rhrf-satellite-pass', onSatellitePass);
    return () => window.removeEventListener('rhrf-satellite-pass', onSatellitePass);
  }, []);

  const getCount = (id: string) => inventory.filter((x) => x === id).length;

  const consumeOne = (id: string | null) => {
    if (!id) return;

    setInventory((inv) => {
      const idx = inv.indexOf(id);
      if (idx === -1) return inv;

      return [
        ...inv.slice(0, idx),
        ...inv.slice(idx + 1),
      ];
    });
  };

  const getBowMultiplier = (id: string | null) => {
    if (!id) return 1;
    if (id.includes("legendary")) return 1.8;
    if (id.includes("epic")) return 1.35;
    if (id.includes("rare")) return 1.1;
    return 1;
  };

  const getSmartTarget = (hatId: string | null) => {
    const mult = getRarityMult(hatId) + ((cyberRef.current || autoPilotRef.current) ? 1 : 0);
    const centerChance = 0.05 * mult;
    if (Math.random() < centerChance) {
      return { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 };
    }
    return getRandomPointInTarget();
  };
  const getArrowMultiplier = (id: string | null) => {
    if (!id) return 1;
    if (id.includes("legendary")) return 2.2;
    if (id.includes("epic")) return 1.6;
    if (id.includes("rare")) return 1.25;
    return 1;
  };

  const arrowColorById = (id: string | null) => {
    const v = String(id || "").toLowerCase();
    if (v.includes("legendary")) return "#F7931A";
    if (v.includes("epic")) return "#aa00ff";
    if (v.includes("rare")) return "#ccff00";
    const pl = getPlanetId();
    if (pl === "cyber") {
      if (greatPilotRef.current) return "#d6b45a";
      if (autoPilotRef.current) return "#8f99a6";
      return "#ff0000";
    }
    return DEFAULT_WEAPON_COLORS[pl] || "#000000";
  };

  const openOverlay = (which: "shop" | "guide" | "profile" | "lang") => {
    setShowShop(which === "shop");
    setShowGuide(which === "guide");
    setShowProfile(which === "profile");
    setShowLang(which === "lang");
  };

  const handleFire = () => {
    const source = roboSourceRef.current || "manual";
    roboSourceRef.current = null;
    if (greatPilotRef.current && source !== "auto") return;
    if (pausedRef.current) return;
    if (getPlanetId() === "rwa" && !rwaIntroDone) return;
    if (stateRef.current !== 'IDLE' || isJumping || isLaserFiring || isFallen || shotPhase !== 'IDLE' || rwaEnded || rwaPortalOpenRef.current || rwaHeroModeRef.current !== "normal") return;
    stateRef.current = 'SHOOTING';

    setStuckArrows([]);
    shotTargetRef.current = { x: laserPosLiveRef.current.x, y: laserPosLiveRef.current.y };

    const arrowId = equippedArrowRef.current ?? equippedArrow;
    const arrowToUse = arrowId && inventoryRef.current.filter((x) => x === arrowId).length > 0 ? arrowId : null;
    setShotArrowId(arrowToUse);
    consumeOne(arrowToUse);

    const bowId = bowRef.current ?? equippedBow;
    const bowRank = getRarityMult(bowId) + ((cyberRef.current || autoPilotRef.current) ? 1 : 0);

    let aimTime = 1500;
    if (bowRank >= 5) aimTime = 300;
    else if (bowRank === 4) aimTime = 600;
    else if (bowRank === 3) aimTime = 900;
    else if (bowRank === 2) aimTime = 1200;

    setShotPhase('AIMING');
    setIsShooting(true);
    setForceSidePose(true);
    window.setTimeout(() => setForceSidePose(false), 1400);
    playSound('action-start');
    setArrowProgress(0);

    if (aimTimerRef.current) clearTimeout(aimTimerRef.current);

    aimTimerRef.current = window.setTimeout(function onAimDone() {

      if (pausedRef.current) {
        aimTimerRef.current = window.setTimeout(onAimDone, 50);
        return;
      }
      setShotPhase('FLYING');

      let start = Date.now();
      const duration = 400;
      arrowPauseAccumRef.current = 0;
      arrowPausedRef.current = false;

      const animateFlight = () => {

        if (pausedRef.current) {
          if (!arrowPausedRef.current) {
            arrowPausedRef.current = true;
            arrowPauseSinceRef.current = Date.now();
          }
          requestAnimationFrame(animateFlight);
          return;
        }
        if (arrowPausedRef.current) {
          arrowPauseAccumRef.current += Date.now() - arrowPauseSinceRef.current;
          arrowPausedRef.current = false;
        }
        const elapsed = Date.now() - start - arrowPauseAccumRef.current;
        const progress = Math.min(elapsed / duration, 1);
        setArrowProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animateFlight);
        } else {
          const frozen = shotTargetRef.current ?? { x: laserPos.x, y: laserPos.y };
          const lx = frozen.x;
          const ly = frozen.y;
          const planetForScore = getPlanetId();
          const rwaDist = Math.hypot(lx, ly);
          const rwaPlanet = planetForScore === "rwa";
          const rwaAlive = rwaPlanet && rwaStonePhaseRef.current === "alive";
          const rwaBodyHit = rwaAlive && rwaDist <= TARGET_R;
          const rwaLit = rwaAlive && cyberRef.current && rwaFacingRef.current === "front";
          const rwaBullseye = rwaAlive && rwaDist <= 14;
          let baseScore = 0;

          if (rwaPlanet) {
            if (rwaAlive) {
              const hx = targetX(getPlanetId()) + lx;
              const hy = TARGET_CY + ly;

              if (rwaBodyHit) {
                playSound('impact');
                setStuckArrows((arr) => [...arr.slice(-1), { x: hx, y: hy, qualityId: arrowToUse, color: arrowColorById(arrowToUse) }]);
              }

              if (rwaLit) {
                if (rwaBullseye) {
                  if (rwaTowerChargedRef.current) {
                    showRwaBanner("TOWER CHARGED — FIRE REQUIRED", rwaBullsRef.current, 1800);
                  } else {
                    rwaBullsRef.current += 1;
                    const n = rwaBullsRef.current;
                    setRwaBulls(n);

                    if (n === 3 || n === 6 || n === 9) {
                      rwaTowerChargedRef.current = true;
                      setRwaTowerCharged(true);
                      showRwaBanner(`x${n} STREAK — TOWER CHARGED`, n, 2200);
                    } else if (n >= 10) {
                      setRwaTowerReady(true);
                      if (!rwaMissions.arrows) setRwaMissions((m) => ({ ...m, arrows: true }));
                      showRwaBanner("x10 STREAK — TOWER READY", n, 3200);
                    } else {
                      showRwaBanner(`x${n} STREAK`, n, 1800);
                    }

                    if (n >= 3 && !rwaMissions.bow) setRwaMissions((m) => ({ ...m, bow: true }));
                    if (n >= 6 && !rwaMissions.hat) setRwaMissions((m) => ({ ...m, hat: true }));
                    if (n >= 9 && !rwaMissions.amulet) setRwaMissions((m) => ({ ...m, amulet: true }));
                  }
                } else {
                  const hadStreak = rwaBullsRef.current > 0 || rwaTowerChargedRef.current;
                  rwaBullsRef.current = 0;
                  setRwaBulls(0);
                  rwaTowerChargedRef.current = false;
                  setRwaTowerCharged(false);
                  setRwaTowerReady(false);
                  setRwaMissions({ bow: false, hat: false, amulet: false, arrows: false });
                  if (hadStreak) showRwaBanner("STREAK BROKEN — MISSION RESET", 0, 2600);
                }
              } else {
                if (rwaBullseye) {
                  showRwaBanner("MISSION NOT COUNTED — STREAK NOT BROKEN", rwaBullsRef.current, 2600);
                } else {
                  const hadStreak = rwaBullsRef.current > 0;
                  rwaBullsRef.current = 0;
                  setRwaBulls(0);
                  rwaTowerChargedRef.current = false;
                  setRwaTowerCharged(false);
                  setRwaTowerReady(false);
                  setRwaMissions({ bow: false, hat: false, amulet: false, arrows: false });
                  if (hadStreak) showRwaBanner("STREAK BROKEN — MISSION RESET", 0, 2600);
                }
              }
            }
          } else {
            baseScore = calculateScore(rwaDist);
          }

          if (planetForScore !== "rwa" && baseScore > 0) {
            const multiplier = getRarityMult(arrowToUse) + ((cyberRef.current || autoPilotRef.current) ? 1 : 0);
            const finalScore = Math.max(1, Math.floor(calculateFinalScore(baseScore, multiplier)));
            if (planetForScore !== "rwa") {
              recordEvent("cyber", baseScore === 10, source);
              if (baseScore === 10) showStreakAlert("cyber");
            }

            const hx = targetX(getPlanetId()) + lx;
            const hy = TARGET_CY + ly;
            const popupId = Date.now() + Math.random();

            setTotalScore((score) => score + finalScore);

            addEarnedScore(finalScore);
            playSound('impact');
            setStuckArrows((arr) => [...arr.slice(getPlanetId() === "rwa" ? -1 : -4), { x: hx, y: hy, qualityId: arrowToUse, color: arrowColorById(arrowToUse) }]);
            const isBullseyeHit = baseScore === 10;
        const popupColor =
          baseScore === 10 ? CYBER_BULLSEYE_COLOR :
          baseScore >= 7 ? "#F7931A" :
          baseScore >= 4 ? "#aa00ff" :
          "#ccff00";
        const effectivePopupColor = popupColor;
{
              const bitcoin = getPlanetId() === "bitcoin";
              const realNft = getPlanetId() === "nft";
              const nft = isNftPlanet();
              const px = targetX(getPlanetId());
              const py = ARROW_POPUP_Y;
              spawnRfCoin(px, py, finalScore);
              setScorePopups((arr) => [...arr, {
                x: px, y: py,
                dx: scoreTargetSvg().x - px, dy: scoreTargetSvg().y - py,

                score: finalScore, isBullseye: baseScore === 10, color: effectivePopupColor, id: popupId,
              }]);
            }
if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
setFlashColor(effectivePopupColor);

flashTimerRef.current = window.setTimeout(() => {
  flashTimerRef.current = null;
  setFlashColor(null);
}, 2100);

            window.setTimeout(() => {
              setScorePopups((arr) => arr.filter((p) => p.id !== popupId));
            }, 2100);
          }

          resumingRef.current = true;
          setLaserTarget(getSmartTarget(equippedHat));
          const np = getRandomPointInTarget();
          laserPosLiveRef.current = np;
          setLaserPos(np);
          setShotPhase('RESUMING');
          setIsShooting(false);
          setArrowProgress(0);
          if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = window.setTimeout(function onResumeDone() {
            if (pausedRef.current) {
              resumeTimerRef.current = window.setTimeout(onResumeDone, 50);
              return;
            }
            resumeTimerRef.current = null;
            resumingRef.current = false;
            stateRef.current = 'IDLE';
            setShotPhase('IDLE');
          }, TARGET_RESUME_LEAD_MS);
        }
      };

      requestAnimationFrame(animateFlight);
    }, aimTime);
  };

  const jumpingRef = useRef(false);
  const jumpRafRef = useRef(0);

  useEffect(() => {
    fireRef.current = handleFire;
  });

  useEffect(() => {
    if (!effectiveCyberStyle) {
      setAutoPilot(false);
      setGreatPilot(false);
    }
  }, [effectiveCyberStyle]);

  useEffect(() => {
    (window as any).__RHRF_ROBO_ACTIVE__ = autoPilot;

    if (!autoPilot) {
      setStreakBanner((b) => (b && b.kind === "arcade" ? b : null));
      setGreatPilot(false);
      const old = roboRef.current;
      if (old) {
        old.lastAstSeq = -1;
        old.pendAstSeq = null;
        old.ghostEnc = false;
        old.pendGhost = false;
      }
      setRoboUi(null);
      setRerollMsg(null);
      return;
    }

    let st = roboRef.current;
    const fresh = !st;

    if (!st) {
      st = {
        b: makeRoboCh(),
        a: makeRoboCh(),
        g: makeRoboCh(),
        lastAstSeq: -1,
        pendAstSeq: null,
        ghostEnc: false,
        pendGhost: false,
      };
      roboRef.current = st;
    } else {
      st.lastAstSeq = -1;
      st.pendAstSeq = null;
      st.ghostEnc = false;
      st.pendGhost = false;
    }

    const rs = st;
    syncRoboUi();

    const fmt = (ch: "b" | "a" | "g") =>
      `${ROBO_CH[ch]} ${rs[ch].left}@${rs[ch].skill}%`;

    setRerollMsg(
      fresh
        ? `SINGULARITY START — ${fmt("b")} · ${fmt("a")} · ${fmt("g")}`
        : `SINGULARITY RESUME — ${fmt("b")} · ${fmt("a")} · ${fmt("g")}`
    );
    pt(() => setRerollMsg(null), 5000);
  }, [autoPilot]);

  useEffect(() => {
    const on = autoPilot && effectiveCyberStyle;
    const greatOn = greatPilot && effectiveCyberStyle;
    document.documentElement.classList.toggle("rf-metal-active", on);
    document.documentElement.classList.toggle("rf-great-active", greatOn);
    return () => {
      document.documentElement.classList.remove("rf-metal-active");
      document.documentElement.classList.remove("rf-great-active");
    };
  }, [autoPilot, greatPilot, effectiveCyberStyle]);

  useEffect(() => {
    const wasGreat = prevGreatRef.current;
    prevGreatRef.current = greatPilot;

    const st = roboRef.current;
    if (st) {
      st.lastAstSeq = -1;
      st.pendAstSeq = null;
      st.ghostEnc = false;
      st.pendGhost = false;
    }
    roboPendingRef.current = null;
    roboSourceRef.current = null;

    if (!effectiveCyberStyle) return;

    if (greatPilot) {
      setRerollMsg("GREAT SINGULARITY — 100% SUCCESS");
    } else if (wasGreat && autoPilot && st) {
      setRerollMsg(`SINGULARITY RESUME — ${ROBO_CH.b} ${st.b.left}@${st.b.skill}% · ${ROBO_CH.a} ${st.a.left}@${st.a.skill}% · ${ROBO_CH.g} ${st.g.left}@${st.g.skill}%`);
    } else {
      return;
    }

    pt(() => setRerollMsg(null), 5000);
  }, [greatPilot, autoPilot, effectiveCyberStyle]);

  useEffect(() => {
    if (!greatPilot || GREAT_SINGULARITY_RF_PER_MIN <= 0) return;
    const cost = GREAT_SINGULARITY_RF_PER_MIN;
    const id = window.setInterval(() => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      if (totalScoreRef.current < cost) {
        setGreatPilot(false);
        setRerollMsg("GREAT OFF — NOT ENOUGH RF");
        pt(() => setRerollMsg(null), 5000);
        return;
      }
      setTotalScore((v) => Math.max(0, v - cost));
      setRerollMsg(`GREAT SINGULARITY — -${cost} RF`);
      pt(() => setRerollMsg(null), 5000);
    }, 60000);
    return () => window.clearInterval(id);
  }, [greatPilot]);

  useEffect(() => {
    if (!autoPilot) return;
    const id = window.setInterval(() => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      if (isFallen || towerActivated || arcMode === "depart") return;

      const st = roboRef.current;
      const jumpNow = Boolean((window as any).__RHRF_GHOST_JUMP_NOW__);

      if (st && jumpNow && !st.ghostEnc) {
        st.ghostEnc = true;
        st.pendGhost = isRoboMiss("g");
        roboPendingRef.current = { ch: "g" };
        lastJumpSourceRef.current = "auto";
      }

      if (st?.ghostEnc) {
        if (!jumpNow) {
          st.ghostEnc = false;
          st.pendGhost = false;
          roboPendingRef.current = null;
        } else if (!st.pendGhost && shotPhase === "IDLE" && !isJumping) {
          roboSourceRef.current = "auto";
          jumpRef.current();
        }
        return;
      }

      if (isLaserFiring) return;

      if (asteroidLiveRef.current && !asteroidKilledRef.current && st) {
        const seq = asteroidSeqRef.current;
        if (st.lastAstSeq !== seq) {
          st.lastAstSeq = seq;
          const miss = isRoboMiss("a");
          st.pendAstSeq = miss ? seq : null;
          roboPendingRef.current = { ch: "a" };
          lastTowerSourceRef.current = miss ? "auto" : null;
        }
        if (st.pendAstSeq !== seq) {
          const ap = asteroidPosLiveRef.current;
          if (Math.abs(ap.x - ROBO_TOWER_X) <= 45 && ap.y <= 330) {
            roboSourceRef.current = "auto";
            towerFireRef.current();
            return;
          }
        }
      }

      if (shotPhase !== "IDLE" || isJumping) return;
      if ((window as any).__RHRF_GHOST_NO_FIRE__) return;

      const lp = laserPosLiveRef.current;
      const inBull = Math.hypot(lp.x, lp.y) <= AUTO_BULLSEYE_R;
      const miss = isRoboMiss("b");

      if (miss) {
        if (inBull) return;
      } else if (!inBull) {
        return;
      }

      roboSourceRef.current = "auto";
      roboPendingRef.current = { ch: "b" };
      fireRef.current();
    }, 70);
    return () => window.clearInterval(id);
  }, [autoPilot, isFallen, shotPhase, isJumping, isLaserFiring, towerActivated, arcMode]);

  const handleJump = () => {
    const source = roboSourceRef.current || "manual";
    roboSourceRef.current = null;
    lastJumpSourceRef.current = source;
    if (greatPilotRef.current && source !== "auto") return;
    if (pausedRef.current) return;
    if (stateRef.current !== 'IDLE' || jumpingRef.current || isShooting || isFallen) return;
    jumpingRef.current = true;
    cancelAnimationFrame(jumpRafRef.current);
    setIsJumping(true);
    (window as any).__RHRF_JUMP_STARTED_AT__ = Date.now();
    playSound('select');
    const selectedJumpVariant = [
      "spin-360",
      "spin-reverse",
      "spin-720",
      "spin-double-reverse",
      "flip-horizontal",
      "tilt-mix",
      "feet-up",
      "flip-vertical",
      "side-somersault",
    ][Math.floor(Math.random() * 9)];
    setJumpVariant(selectedJumpVariant);

    const isSideSomersault = selectedJumpVariant === "side-somersault";
    let sidePoseEnded = false;
    setForceSidePose(isSideSomersault);

    const jumpT0 = Date.now();
    jumpPauseAccumRef.current = 0;
    jumpPausedRef.current = false;
    const checkJumpEnd = () => {
      if (pausedRef.current) {
        if (!jumpPausedRef.current) {
          jumpPausedRef.current = true;
          jumpPauseSinceRef.current = Date.now();
        }
        jumpRafRef.current = requestAnimationFrame(checkJumpEnd);
        return;
      }
      if (jumpPausedRef.current) {
        jumpPauseAccumRef.current += Date.now() - jumpPauseSinceRef.current;
        jumpPausedRef.current = false;
      }
      const jumpElapsed = Date.now() - jumpT0 - jumpPauseAccumRef.current;

      if (isSideSomersault && !sidePoseEnded && jumpElapsed >= JUMP_ARC_MS - 190) {
        sidePoseEnded = true;
        setForceSidePose(false);
      }

      if (jumpElapsed >= JUMP_ARC_MS) {
        jumpingRef.current = false;
        jumpRafRef.current = 0;
        (window as any).__RHRF_JUMP_STARTED_AT__ = 0;
        setIsJumping(false);
        setForceSidePose(false);
      } else {
        jumpRafRef.current = requestAnimationFrame(checkJumpEnd);
      }
    };
    jumpRafRef.current = requestAnimationFrame(checkJumpEnd);
  };

  useEffect(() => {
    const onGhostHit = () => {
      if (greatPilotRef.current) {
        if (!jumpingRef.current) { roboSourceRef.current = "auto"; lastJumpSourceRef.current = "auto"; jumpRef.current(); }
        return;
      }

      recordEvent("ghost", false, lastJumpSourceRef.current || "manual");

      const armorId = armorRef.current;
      const hasArmor = Boolean(armorId && inventoryRef.current.includes(armorId));
      const armorRank = armorId && hasArmor ? getRarityMult(armorId) : 1;
      const cyberShieldBonus = (cyberRef.current || autoPilotRef.current) ? 1 : 0;
      const duration = Math.max(1000, 8000 - (armorRank - 1) * 2000 - cyberShieldBonus * 1000);

      if (hasArmor && armorId) removeOneFromInventory(armorId);

      cancelAnimationFrame(jumpRafRef.current);
      jumpRafRef.current = 0;
      jumpingRef.current = false;
      (window as any).__RHRF_JUMP_STARTED_AT__ = 0;
      setIsJumping(false);
      setIsFallen(true);
      playSound('impact');
      setFallRemaining(Math.ceil(duration / 1000));
    };

    window.addEventListener("rhrf-ghost-hit", onGhostHit);
    return () => window.removeEventListener("rhrf-ghost-hit", onGhostHit);
  }, [equippedArmor]);

  useEffect(() => {
    if (!isFallen) return;

    if (isPaused) return;

    if (fallRemaining <= 0) {
      const done = window.setTimeout(() => setIsFallen(false), 300);
      return () => window.clearTimeout(done);
    }

    const tick = window.setTimeout(() => {
      setFallRemaining((n) => Math.max(0, n - 1));
    }, 1000);

    return () => window.clearTimeout(tick);
  }, [isFallen, fallRemaining, isPaused]);

  const jumpElapsedAtPauseRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {

      const start = Number((window as any).__RHRF_JUMP_STARTED_AT__ || 0);
      if (start > 0) jumpElapsedAtPauseRef.current = Date.now() - start;
    } else if (jumpElapsedAtPauseRef.current !== null) {

      (window as any).__RHRF_JUMP_STARTED_AT__ = Date.now() - jumpElapsedAtPauseRef.current;
      jumpElapsedAtPauseRef.current = null;
    }
  }, [isPaused]);

  useEffect(() => {
    if (isFallen || fallRemaining > 0) return;

    const armorId = armorRef.current;
    if (!armorId || !inventoryRef.current.includes(armorId)) return;

    setEquippedArmor((prev) => (prev === armorId ? prev : armorId));
  }, [isFallen, fallRemaining]);

  useEffect(() => {
    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const dataUrlToBlob = (dataUrl: string) => {
      const parts = dataUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new Blob([bytes], { type: mime });
    };

    const collectCss = () => {
      let css = "";
      const sheets = Array.from(document.styleSheets) as any[];

      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []) as any[];
          for (const rule of rules) {
            css += String(rule.cssText || "") + "\n";
          }
        } catch {
          continue;
        }
      }

      return css;
    };

    const onShareScreenshot = async () => {

      const svg = document.getElementById("rhrf-scene-svg") as SVGSVGElement | null;
      if (!svg) {
        return;
      }

      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1000");
      clone.setAttribute("height", "700");

      const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleEl.textContent = collectCss();
      clone.insertBefore(styleEl, clone.firstChild);

      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      let blob: Blob = svgBlob;
      let ext = "svg";
      let type = "image/svg+xml";

      try {
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("SVG screenshot load failed"));
          img.src = svgUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 700;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.fillStyle = "#050015";
        ctx.fillRect(0, 0, 1000, 700);
        ctx.drawImage(img, 0, 0, 1000, 700);

        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);

        if (jpegDataUrl.startsWith("data:image/jpeg")) {
          blob = dataUrlToBlob(jpegDataUrl);
          ext = "jpg";
          type = "image/jpeg";
        }
      } catch {
        blob = svgBlob;
        ext = "svg";
        type = "image/svg+xml";
      } finally {
        URL.revokeObjectURL(svgUrl);
      }

      const filename = `rhrf-bullseye-${Date.now()}.${ext}`;
      const isProd = window.location.hostname.includes('rarefriends.com');
      const gameLink = isProd
        ? window.location.href.split('?')[0]
        : window.location.origin + window.location.pathname;

      const cyberStatus = effectiveCyberStyle ? t("share.cyberOn") : t("share.standard");
      const scoreStr = totalScore.toLocaleString();

      let latestBadgeText = "";
      if (gameStats?.earnedBadges && gameStats.earnedBadges.length > 0) {
        const lastId = gameStats.earnedBadges[gameStats.earnedBadges.length - 1];
        latestBadgeText = t("share.latestBadge", { badge: t("badge." + lastId) });
      }

      const messageParts = [
        t("share.tagline1"),
        t("share.tagline2"),
        t("share.score", { score: scoreStr }),
        t("share.mode", { mode: cyberStatus }),
        ...(latestBadgeText ? [latestBadgeText] : []),
        t("share.tagline3"),
        "#RareFriends #RHRFBullseye",
        gameLink
      ];

      const text = messageParts.join(" ");
      const file = new File([blob], filename, { type });
      const nav = navigator as any;

      try {
        if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
          await nav.share({
            files: [file],
            title: t("share.title"),
            text,
          });
          return;
        }
      } catch {
      }

      downloadBlob(blob, filename);

      try {
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer"
        );
      } catch {
      }
    };

    window.addEventListener("rhrf-share-screenshot", onShareScreenshot as EventListener);
    return () => window.removeEventListener("rhrf-share-screenshot", onShareScreenshot as EventListener);
  }, [totalScore]);

  useEffect(() => {
    setGameStats((prev) => {
      const next: GameStats = {
        ...prev,
        sessionStartTime: Date.now(),
        currentSessionMs: 0,
        currentCyberStreak: 0,
        currentGhostStreak: 0,
        currentAsteroidStreak: 0,
      };
      saveStats(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setGameStats((prev) => {
        const next: GameStats = {
          ...prev,
          currentSessionMs: Date.now() - prev.sessionStartTime,
          totalPlayMs: prev.totalPlayMs + 1000,
        };
        saveStats(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const recordEvent = (type: "cyber" | "apple" | "asteroid" | "ghost", success: boolean, source: "auto" | "manual" = "manual") => {
    const roboCh: "b" | "a" | "g" = type === "cyber" || type === "apple" ? "b" : type === "asteroid" ? "a" : "g";

    if (autoPilotRef.current) {
      if (roboPendingRef.current?.ch === roboCh) roboPendingRef.current = null;
      if (source === "auto") advanceRobo(roboCh);
      return;
    }
    if (type === "cyber" || type === "apple") streaksRef.current.cyber = success ? streaksRef.current.cyber + 1 : 0;
    if (type === "asteroid") streaksRef.current.asteroid = success ? streaksRef.current.asteroid + 1 : 0;
    if (type === "ghost") streaksRef.current.ghost = success ? streaksRef.current.ghost + 1 : 0;
    setGameStats((prev) => {
      const next: GameStats = { ...prev };

      if (type === "cyber" || type === "apple") {
        if (success) {
          next.currentCyberStreak = prev.currentCyberStreak + 1;
          next.bestCyberStreak = Math.max(prev.bestCyberStreak, next.currentCyberStreak);
        } else {
          next.currentCyberStreak = 0;
        }
      }

      if (type === "asteroid") {
        if (success) {
          next.currentAsteroidStreak = prev.currentAsteroidStreak + 1;
          next.bestAsteroidStreak = Math.max(prev.bestAsteroidStreak, next.currentAsteroidStreak);
        } else {
          next.currentAsteroidStreak = 0;
        }
      }

      if (type === "ghost") {
        if (success) {
          next.currentGhostStreak = prev.currentGhostStreak + 1;
          next.bestGhostStreak = Math.max(prev.bestGhostStreak, next.currentGhostStreak);
        } else {
          next.currentGhostStreak = 0;
        }
      }

      saveStats(next);
      return next;
    });
  };

  useEffect(() => {
    const onGhostDodged = () => {
        recordEvent("ghost", true, lastJumpSourceRef.current || "manual");
        const roll = Math.floor(Math.random() * 100) + 1;
        const gain = roll === 1 ? 100 : 1;
        setTotalScore((v) => v + gain);
        addEarnedScore(gain);

        const bitcoin = getPlanetId() === "bitcoin";
        const realNft = getPlanetId() === "nft";
        const nft = isNftPlanet();
        const px = heroLeftX(getPlanetId());
        const py = PLAYER_Y - 30;

        setScorePopups((arr) => [...arr, {
          x: px,
          y: py,
          dx: scoreTargetSvg().x - px, dy: scoreTargetSvg().y - py,
          score: gain,
          color: gain === 100 ? "#d6b45a" : bitcoin ? "#F7931A" : realNft ? "#aa00ff" : nft ? "#C7E36C" : "#00ffff",
          id: Date.now() + Math.random(),
        }]);
        spawnRfCoin(px, py, gain);
        showStreakAlert("ghost");
      };
    window.addEventListener("rhrf-ghost-dodged", onGhostDodged);
    return () => window.removeEventListener("rhrf-ghost-dodged", onGhostDodged);

  }, []);

  const handleTowerFire = () => {
    const source = roboSourceRef.current || "manual";
    roboSourceRef.current = null;
    lastTowerSourceRef.current = source;
    if (greatPilotRef.current && source !== "auto") return;
    if (pausedRef.current) return;

    if (getPlanetId() === "rwa" && !rwaIntroDone) return;
    if (laserCooldown || isLaserFiring || rwaEnded) return;

    if (getPlanetId() === "rwa") {
      if (!rwaTowerChargedRef.current) return;

      const n = rwaBullsRef.current;
      const stage = n >= 9 ? 3 : n >= 6 ? 2 : 1;

      rwaStoneDamageRef.current = stage;
      setRwaStoneDamage(stage);
      rwaTowerChargedRef.current = false;
      setRwaTowerCharged(false);
      pt(() => {
        setRwaWavePulses(stage);
        setRwaWaveKey((k) => k + 1);
      }, 320);
      showRwaBanner(`TOWER FIRED — STONE ${stage}/3`, stage, 2000);
    }

    const energyToUse = equippedEnergy && getCount(equippedEnergy) > 0 ? equippedEnergy : null;
    setTowerEnergyId(energyToUse);
    consumeOne(energyToUse);

    setIsLaserFiring(true);
    setLaserCooldown(true);
    playSound('action-start');
    setTimeout(() => setIsLaserFiring(false), 800);
    setTimeout(() => setLaserCooldown(false), LASER_COOLDOWN_MS);
  };

  useEffect(() => {
    if (!entryDone || pausedRef.current || !towerActivated || !asteroidVisible || asteroidKilledRef.current || salvoActiveRef.current) return;
    const pid = getPlanetId();
    const BEAM: Record<string, { x: number; y: number; dir: "up" | "down" }> = {
      stable: { x: 140, y: 305, dir: "up" },
      nft: { x: 860, y: 340, dir: "up" },
      bitcoin: { x: 860, y: 305, dir: "up" },
      rwa: { x: 140, y: 340, dir: "up" },
    };
    const beam = BEAM[pid];
    if (!beam) return;

    const ax = asteroidPosition.x;
    const ay = asteroidPosition.y;

    const hit = beam.dir === "up"
      ? Math.abs(ax - beam.x) <= 24 && ay <= beam.y
      : Math.abs(ax - beam.x) <= 24 && ay >= beam.y;

    if (hit) {
      asteroidKilledRef.current = true;
      setAsteroidVisible(false);

      window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x: ax, y: Math.min(ay, 480) } }));
      setExplosion({ x: ax, y: Math.min(ay, 480), visible: true });
      setSuccessMessage(t("msg.asteroidDeflected"));

      impactTimersRef.current.push(pt(() => setSuccessMessage(null), 2500));
      impactTimersRef.current.push(pt(() => setExplosion({ x: 0, y: 0, visible: false }), 1500));
    }
  }, [entryDone, towerActivated, asteroidVisible, asteroidPosition]);

  useEffect(() => {
    towerFireRef.current = handleTowerFire;
    jumpRef.current = handleJump;
  });

  useEffect(() => {
    if (pausedRef.current || !isLaserFiring || !asteroidVisible || asteroidKilledRef.current) return;
    const ax = asteroidPosition.x;
    const ay = asteroidPosition.y;
    const pid = getPlanetId();
    const hitLaser = Math.abs(ax - (pid === "cyber" ? 190 : (getLayout(pid).tower === "left" ? 140 : 860))) <= 45 && ay <= 330;
    if (hitLaser) {
      setAsteroidVisible(false);
      asteroidKilledRef.current = true;
      window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x: ax, y: Math.min(ay, 480) } }));
      setExplosion({ x: ax, y: Math.min(ay, 480), visible: true });
      setSuccessMessage(t("msg.asteroidDeflected"));
      recordEvent("asteroid", true, lastTowerSourceRef.current || "manual");
      pt(() => showStreakAlert("asteroid"), 300);
      pt(() => setSuccessMessage(null), 2500);
      impactTimersRef.current.push(pt(() => setExplosion({ x: 0, y: 0, visible: false }), 1500));
      const energyMult = getRarityMult(equippedEnergy) + ((cyberRef.current || autoPilotRef.current) ? 1 : 0);
      const reward = 15 * energyMult;
      setTotalScore((v) => v + reward);
      addEarnedScore(reward);
      const energyColor = effectiveCyberStyle && !equippedEnergy ? "cyber" : equippedEnergy?.includes("legendary") ? "#F7931A" : equippedEnergy?.includes("epic") ? "#aa00ff" : equippedEnergy?.includes("rare") ? "#ccff00" : "#ccff00";
      const popupId = Date.now() + Math.random();
      {
        const nft = isNftPlanet();
        const bitcoin = getPlanetId() === "bitcoin";
        const px = ax;
        const py = ay;
        setScorePopups((arr) => [...arr, {
          x: px, y: py,
          dx: scoreTargetSvg().x - px, dy: scoreTargetSvg().y - py,

          score: reward, color: energyColor, id: popupId,
        }]);
        spawnRfCoin(px, py, reward);
      }

    }
  }, [isLaserFiring, asteroidVisible, asteroidPosition, equippedEnergy, effectiveCyberStyle]);

  useEffect(() => {
    if (!entryDone) return;
    const spawnAsteroid = () => {

      if (pausedRef.current || (window as any).__RHRF_CUTSCENE__) return;
      if (getPlanetId() === "rwa") return;
      const now = Date.now();
      if (!salvoActiveRef.current) {
        if (now < towerEventLockUntil) return;
        towerEventLockUntil = now + 30000;
      }

      const seq = ++asteroidSeqRef.current;
      const spawnPos = getLayout(getPlanetId()).tower === "left" ? { x: 0, y: 0 } : { x: 1000, y: 0 };
      asteroidLiveRef.current = true;
      setAsteroidVisible(true);
      asteroidKilledRef.current = false;
      asteroidArmedRef.current = false;
      asteroidPosLiveRef.current = { ...spawnPos };
      setAsteroidPosition(spawnPos);
      let elapsed = 0;
      let lastTs = performance.now();
      const animate = () => {
        if (seq !== asteroidSeqRef.current || asteroidKilledRef.current) return;

        const nowTs = performance.now();
        const dt = Math.min(nowTs - lastTs, 100);
        lastTs = nowTs;

        if (pausedRef.current || (window as any).__RHRF_CUTSCENE__) {
          requestAnimationFrame(animate);
          return;
        }

        elapsed += dt;
        const progress = elapsed / (3056 / asteroidSpeedMult(getPlanetTier(getPlanetId())));
        if (progress >= 1) {
          asteroidLiveRef.current = false;
          asteroidArmedRef.current = false;
          setAsteroidVisible(false);

          if (!asteroidKilledRef.current) {
          const astAutoMiss = autoPilotRef.current && roboRef.current?.pendAstSeq === asteroidSeqRef.current;
          recordEvent("asteroid", false, astAutoMiss ? "auto" : lastTowerSourceRef.current || "manual");
            impactTimersRef.current.push(pt(() => {
              if (!cyberRef.current && !pausedRef.current && !showShopRef.current && !showProfileRef.current && !showGuideRef.current && !showLangRef.current) setScreenShake(true);
              setAsteroidWarning(true);
              setLandingGlow({ x: asteroidFinalXRef.current, y: 480, visible: true });
              playSound('impact');
            }, 1000));
            impactTimersRef.current.push(pt(() => setScreenShake(false), 2000));
            impactTimersRef.current.push(pt(() => { setAsteroidWarning(false); setLandingGlow((g) => ({ ...g, visible: false })); }, 3500));
          }
          return;
        }
        const stable = isNftPlanet();
        const realNft = getPlanetId() === "nft";
        const bitcoin = getPlanetId() === "bitcoin";
        const sx = getLayout(getPlanetId()).tower === "left" ? 0 : 1000;
        const x = sx + (500 - sx) * progress;
        const y = 560 * progress;
        asteroidFinalXRef.current = x;
        asteroidPosLiveRef.current = { x, y };
        asteroidArmedRef.current = true;
        setAsteroidPosition({ x, y });
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

salvoSpawnRef.current = spawnAsteroid;

let asteroidTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleNextAsteroid = (first = false) => {
      const delay = first ? 20000 : 85000 + Math.random() * 10000;
      asteroidTimer = setTimeout(() => {
        spawnAsteroid();
        scheduleNextAsteroid();
      }, delay);
    };
    scheduleNextAsteroid(true);
    return () => {
if (asteroidTimer) clearTimeout(asteroidTimer);
impactTimersRef.current.forEach((t) => clearTimeout(t));
};
  }, [entryDone]);
  useEffect(() => {

    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        !active.closest(".rf-top-bar, .rf-lang-picker, .rf-pause-btn, .rf-share-btn, .rf-mute-btn, .rf-tab-btn, .rf-hud-top, .rf-hud-main, .rf-hud-mini, [data-no-bubble-dismiss]") &&
        [
          "ArrowUp",
          "KeyW",
          "Digit1",
          "Numpad1",
          "Digit2",
          "Numpad2",
          "Digit3",
          "Numpad3",
          "KeyF",
          "KeyJ",
          "KeyK",
        ].includes(e.code)
      ) {
        window.dispatchEvent(new Event("rhrf:dismiss-dialog"));
      }
      const k = e.code;
      if (e.repeat) return;

      if (k === 'Escape' || e.key === 'Escape') {
        setShowShop(false);
        setShowProfile(false);
        setShowGuide(false);
        setShowLang(false);
        if (isMenuOpenRef()) playSound('select');
        return;
      }
      const t = e.target as HTMLElement | null;

      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) && !t.closest('.rf-hud-top')) return;

      if (t && typeof (t as Element).closest === "function" && (t as Element).closest("[data-rf-skip-space]")) return;
      const h = handlersRef.current;

      if (k === 'Space') {
        e.preventDefault();
        if (!isMenuOpenRef()) togglePause();
        return;
      }

      const isHotkey =
        k === 'Digit1' || k === 'Numpad1' ||
        k === 'Digit2' || k === 'Numpad2' ||
        k === 'Digit3' || k === 'Numpad3' ||
        k === 'Digit4' || k === 'Numpad4' ||
        k === 'KeyM' || k === 'Digit5' || k === 'Numpad5' ||
        k === 'KeyS' || k === 'Digit6' || k === 'Numpad6' ||
        k === 'KeyP' || k === 'Digit7' || k === 'Numpad7' ||
        k === 'KeyG' || k === 'Digit8' || k === 'Numpad8';

      if (isHotkey) {
        e.preventDefault();
        if (isMenuOpenRef()) return;
        if (inputLockedRef.current) return;
        if (k === 'Digit1' || k === 'Numpad1') { if (h.towerFire) h.towerFire(); }
        else if (k === 'Digit2' || k === 'Numpad2') { if (h.fire) h.fire(); }
        else if (k === 'Digit3' || k === 'Numpad3') { if (h.jump) h.jump(); }
        else if (k === 'Digit4' || k === 'Numpad4') { togglePause(); }
        else if (k === 'KeyM' || k === 'Digit5' || k === 'Numpad5') { toggleMute(); }
        else if (k === 'KeyS' || k === 'Digit6' || k === 'Numpad6') { openOverlay("shop"); playSound('select'); }
        else if (k === 'KeyP' || k === 'Digit7' || k === 'Numpad7') { openOverlay("profile"); playSound('select'); }
        else if (k === 'KeyG' || k === 'Digit8' || k === 'Numpad8') {
          if (getPlanetId() === "rwa" && rwaPortalOpenRef.current && rwaHeroModeRef.current === "normal") {
            enterRwaPortalRef.current();
          } else {
            openOverlay("guide");
            playSound('select');
          }
        }
        else if (k === 'KeyL' || k === 'Digit9' || k === 'Numpad9') { openOverlay("lang"); playSound('select'); }
        return;
      }

      if (t && t.tagName === 'BUTTON') return;
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, []);

  const getItemCategory = (item: any): string => {
    const raw = `${item?.id || ""} ${item?.name || ""} ${item?.category || ""} ${item?.type || ""}`.toLowerCase();
    if (raw.includes("bow")) return "bow";
    if (raw.includes("hat") || raw.includes("head") || raw.includes("helmet") || raw.includes("crown")) return "hat";
    if (raw.includes("amulet") || raw.includes("neck") || raw.includes("charm")) return "amulet";
    return "consumable";
  };

  const getOwnedCount = (id: string) => inventory.filter((x: string) => x === id).length;

  const handleAddConsumable = (item: any, amount: number) => {
    if (getItemCategory(item) !== "consumable") return;

    const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
    const owned = getOwnedCount(String(item.id));
    const price = Number(getItemPrice(item) || 0);
    const cost = price * safeAmount;

    if (owned + safeAmount > 100 || totalScore < cost) return;

    setTotalScore((s) => s - cost);
    setInventory((inv) => [...inv, ...Array<string>(safeAmount).fill(String(item.id))]);
    playSound('purchase');
  };

  const handleToggleAuto = (item: any) => {
    const id = String(item?.id ?? "");
    if (!id) return;
    setAutoSet((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    playSound("select");
  };

  useEffect(() => {
    if (!autoSet.size) return;
    autoSet.forEach((id) => {
      const item = CATALOG.find((i: any) => i.id === id);
      if (!item) return;
      const owned = inventory.filter((x) => x === id).length;
      if (owned > 10) return;
      const price = Number(getItemPrice(item) || 0);
      const buy = Math.min(CONSUMABLE_CAP - owned, price > 0 ? Math.floor(totalScore / price) : 0);
      if (buy <= 0) { setAutoSet((prev) => { const n = new Set(prev); n.delete(id); return n; }); return; }
      setTotalScore((s) => s - price * buy);
      setInventory((inv) => [...inv, ...Array<string>(buy).fill(id)]);
    });
  }, [inventory, totalScore, autoSet]);

  const handleBuy = (item: any) => {
    const category = getItemCategory(item);

    if (category === "consumable") {
      handleAddConsumable(item, 1);
      return;
    }

    if (totalScore >= getItemPrice(item) && !inventory.includes(item.id)) {
      setTotalScore((s) => s - getItemPrice(item));
      setInventory((inv) => [...inv, item.id]);
      playSound('purchase');
    }
  };

  const handleEquip = (itemId: string) => {
    if (itemId.includes("bow")) {
      setEquippedBow(prev => prev === itemId ? null : itemId);
    } else if (itemId.includes("amulet")) {
      setEquippedAmulet(prev => prev === itemId ? null : itemId);
    } else if (itemId.includes("hat")) {
      setEquippedHat(prev => prev === itemId ? null : itemId);
    } else if (itemId.includes("arrow") || itemId.includes("armor") || itemId.includes("energy")) {
      setEquippedConsumable(prev => prev === itemId ? null : itemId);
    }
  };

  const removeInventoryItems = (id: string, amount: number) => {
    setInventory((inv) => {
      let remaining = Math.max(0, Math.floor(Number(amount) || 0));
      return inv.filter((x) => {
        if (x === id && remaining > 0) {
          remaining -= 1;
          return false;
        }
        return true;
      });
    });
  };

  const clearEquipForItem = (item: any) => {
    const id = String(item.id);

    if (item.category === "bow") {
      setEquippedBow((prev) => prev === id ? null : prev);
    } else if (item.category === "hat") {
      setEquippedHat((prev) => prev === id ? null : prev);
    } else if (item.category === "amulet") {
      setEquippedAmulet((prev) => prev === id ? null : prev);
    } else {
      setEquippedConsumable((prev) => prev === id ? null : prev);
    }
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of inventory) {
      map[id] = (map[id] || 0) + 1;
    }
    return map;
  }, [inventory]);

  useEffect(() => {
    const planetId = getPlanetId();
    const tier = getPlanetTier(planetId);
    const ids = missionItemIds(tier);
    const supplyId = missionSupplyItemId(planetId, tier);
    const supplyEquipped =
      supplyId.startsWith("arrow_") ? equippedArrow :
      supplyId.startsWith("energy_") ? equippedEnergy :
      equippedArmor;

    const achieved: PlanetMissions = {
      bow: equippedBow === ids.bow,
      hat: equippedHat === ids.hat,
      amulet: equippedAmulet === ids.amulet,
      arrows: supplyEquipped === supplyId && inventory.filter((x) => x === supplyId).length >= CONSUMABLE_CAP,
    };

    setMissions((prev) => {
      const next = {
        ...prev,
        [planetId]: achieved,
      };
      saveMissions(next);
      return next;
    });
  }, [inventory, equippedBow, equippedHat, equippedAmulet, equippedArrow, equippedEnergy, equippedArmor]);

  useEffect(() => {
    saveRun({
      planet: getPlanetId(),
      inventory,
      equippedBow,
      equippedHat,
      equippedAmulet,
      equippedArrow,
      lang: getLang(),
    });
  }, [inventory, equippedBow, equippedHat, equippedAmulet, equippedArrow]);

  function tryDepart() {
    if (!salvoDoneRef.current || !shieldDoneRef.current) return;
    salvoDoneRef.current = false;
    shieldDoneRef.current = false;

    setArcMode("depart");
  }

  const startTowerWave = () => {
    const pid = getPlanetId();
    const bx = getLayout(pid).tower === "left" ? 140 : 860;
    const TIP = TOWER_ANT_Y;
    const targetSeq = asteroidSeqRef.current;
    const PURGE_DUR = 500, PURGE_R = 1700;
    const MAIN_DUR = 1800, MAIN_R = 1700;
    let phase: 0 | 1 = 0;
    let t0 = performance.now();
    let last = t0;
    let purgeSent = false;
    (window as any).__RHRF_TOWER_SHIELD__ = true;
    (window as any).__RHRF_WAVE_ORIGIN__ = { x: bx, y: TIP };
    cancelAnimationFrame(waveRafRef.current);

    const stop = () => { setWaveR(-1); (window as any).__RHRF_WAVE_R__ = -1; };

    const killByWave = (x: number, y: number) => {
      if (pausedRef.current) return;
      asteroidLiveRef.current = false;
      asteroidKilledRef.current = true;
      asteroidArmedRef.current = false;
      setAsteroidVisible(false);
      const ey = Math.max(0, Math.min(y, 480));
      playSound("impact");
      window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x, y: ey } }));
      setExplosion({ x, y: ey, visible: true });
      impactTimersRef.current.push(window.setTimeout(() => setExplosion({ x: 0, y: 0, visible: false }), 1500));
    };

    const sweep = (r: number) => {
      if (!asteroidLiveRef.current || asteroidKilledRef.current || asteroidSeqRef.current !== targetSeq) return;
      const ap = asteroidPosLiveRef.current;
      if (Math.hypot(ap.x - bx, ap.y - TIP) <= r + 45) killByWave(ap.x, ap.y);
    };

    const tick = (now: number) => {
      if (getPlanetId() !== pid) { stop(); return; }
      if (pausedRef.current) {
        t0 += now - last;
        last = now;
        waveRafRef.current = requestAnimationFrame(tick);
        return;
      }
      last = now;
      const e = now - t0;

      if (phase === 0) {
        const p = Math.min(1, e / PURGE_DUR);
        const r = p * PURGE_R;
        setWaveR(r);
        (window as any).__RHRF_WAVE_R__ = r;
        if (!purgeSent) {
          purgeSent = true;
          window.dispatchEvent(new CustomEvent("rhrf-tower-purge"));
        }
        sweep(r);
        if (p >= 1) {
          phase = 1;
          t0 = now;
          last = now;
          setWaveR(0);
          (window as any).__RHRF_WAVE_R__ = 0;
        }
      } else {
        const p = Math.min(1, e / MAIN_DUR);
        const r = p * MAIN_R;
        setWaveR(r);
        (window as any).__RHRF_WAVE_R__ = r;
        if (p >= 1) {
          window.dispatchEvent(new CustomEvent("rhrf-tower-purge"));
          stop();
          salvoBeamSeqRef.current = asteroidSeqRef.current;
          setTowerBeamActive(true);
          window.dispatchEvent(new CustomEvent("rhrf:cutscene-phase", { detail: "shield" }));
          return;
        }
      }

      waveRafRef.current = requestAnimationFrame(tick);
    };

    waveRafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (rwaHeroMode !== "side") return;
    // P32: RWA leg animation disabled: per-frame sidePixels updates caused jank during rAF portal walk.
  }, [rwaHeroMode]);

  useEffect(() => {
    if (getPlanetId() !== "rwa" || !rwaPortalOpen || rwaHeroMode !== "side") return;
    const onDone = () => {
      if (rwaHeroModeRef.current === "side") {
        rwaHeroModeRef.current = "stand";
        setRwaHeroMode("stand");
      }
    };
    window.addEventListener("rhrf:rwa-portal-walk-done", onDone);
    return () => window.removeEventListener("rhrf:rwa-portal-walk-done", onDone);
  }, [getPlanetId, rwaPortalOpen, rwaHeroMode]);

  useEffect(() => {
    inputLockedRef.current = Boolean(towerActivated || arcMode === "depart" || isFallen || greatPilot);
    (window as any).__RHRF_INPUT_LOCKED__ = inputLockedRef.current;
  }, [towerActivated, arcMode, isFallen, greatPilot]);

  useEffect(() => {
    const onShieldDone = () => { shieldDoneRef.current = true; tryDepart(); };
    window.addEventListener("rhrf:shield-done", onShieldDone);
    return () => window.removeEventListener("rhrf:shield-done", onShieldDone);
  }, []);

  const handleActivateTower = () => {
    if (salvoActiveRef.current) return;

    const planetId0 = getPlanetId();
    const tier0 = getPlanetTier(planetId0);
    const ids0 = missionItemIds(tier0);
    const supplyId0 = missionSupplyItemId(planetId0, tier0);
    const supplyEquipped0 =
      supplyId0.startsWith("arrow_") ? equippedArrow :
      supplyId0.startsWith("energy_") ? equippedEnergy :
      equippedArmor;

    const ready =
      equippedBow === ids0.bow &&
      equippedHat === ids0.hat &&
      equippedAmulet === ids0.amulet &&
      supplyEquipped0 === supplyId0 &&
      inventory.filter((x) => x === supplyId0).length >= CONSUMABLE_CAP;
    if (!ready) return;
    setTowerActivated(true);
    playSound("action-start");

    const planetId = getPlanetId();
    const nextPlanet = getNextPlanet(planetId);

    saveRun({
      planet: nextPlanet,
      inventory,
      equippedBow,
      equippedHat,
      equippedAmulet,
      equippedArrow,
      lang: getLang(),
    });

    const isSalvoPlanet = planetId === "stable" || planetId === "nft" || planetId === "bitcoin";

    if (isSalvoPlanet) {
      salvoActiveRef.current = true;
      salvoKilledRef.current = 0;
      salvoSpawnedRef.current = 0;
      salvoClockRef.current = 0;
      salvoTimersRef.current = [];
      asteroidArmedRef.current = false;
      cancelAnimationFrame(salvoRafRef.current);
      salvoDoneRef.current = false;
      shieldDoneRef.current = false;
      startTowerWave();
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("planet", nextPlanet);
      window.history.replaceState(null, "", url.toString());
    } catch {}

    window.setTimeout(() => {
      setPlanet(nextPlanet);
      window.location.reload();
    }, 2000);
  };

  useEffect(() => {
    if (!towerBeamActive || !salvoActiveRef.current) return;
    if (asteroidKilledRef.current) return;
    if (!asteroidVisible && !asteroidLiveRef.current) return;
    if (!asteroidArmedRef.current) return;
    const pid = getPlanetId();
    if (pausedRef.current) return;
    const towerLeft = getLayout(pid).tower === "left";
    const bx = towerLeft ? 140 : 860;
    const ap = asteroidPosLiveRef.current;
    const ax = ap.x;
    const ay = ap.y;
    const isSalvoAsteroid = asteroidSeqRef.current > salvoBeamSeqRef.current;
    const crossed = towerLeft ? ax >= bx - 18 : ax <= bx + 18;
    const inBeam = ay >= -20 && ay <= TOWER_ANT_Y + 20;
    if (!crossed || !inBeam) return;

    const ey = Math.max(0, Math.min(ay, 480));
    setAsteroidVisible(false);
    asteroidKilledRef.current = true;
    asteroidLiveRef.current = false;
    asteroidArmedRef.current = false;
    if (isSalvoAsteroid) salvoKilledRef.current += 1;
    playSound("impact");
    window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x: ax, y: ey } }));
    setExplosion({ x: ax, y: ey, visible: true });
    impactTimersRef.current.push(window.setTimeout(() => setExplosion({ x: 0, y: 0, visible: false }), 1500));

    if (salvoKilledRef.current >= 3) {
      salvoActiveRef.current = false;
      salvoTimersRef.current.forEach((t) => window.clearTimeout(t));
      salvoTimersRef.current = [];
      const nextPlanet = pid === "rwa" ? "arc-final" : getNextPlanet(pid);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("planet", nextPlanet);
        window.history.replaceState(null, "", url.toString());
      } catch {}
      window.setTimeout(() => {
        if (nextPlanet === "arc-final") {
          setArcMode("final");
        } else {
          pendingNextRef.current = nextPlanet;
          salvoDoneRef.current = true;
          tryDepart();
        }
      }, 900);
    }
  }, [towerBeamActive, asteroidVisible, asteroidPosition]);

  useEffect(() => {
    if (!towerBeamActive || !salvoActiveRef.current) return;
    salvoSpawnedRef.current = 0;
    salvoClockRef.current = 0;
    salvoLastRef.current = performance.now();

    const tick = (now: number) => {
      if (!towerBeamActive || !salvoActiveRef.current) return;

      if (pausedRef.current) {
        salvoLastRef.current = now;
        salvoRafRef.current = requestAnimationFrame(tick);
        return;
      }

      salvoClockRef.current += now - salvoLastRef.current;
      salvoLastRef.current = now;

      if (
        salvoSpawnedRef.current < 3 &&
        salvoClockRef.current >= salvoSpawnedRef.current * SALVO_GAP_MS &&
        (!asteroidLiveRef.current || asteroidKilledRef.current)
      ) {
        const before = asteroidSeqRef.current;
        salvoSpawnRef.current?.();
        if (asteroidSeqRef.current > before) salvoSpawnedRef.current += 1;
      }

      if (salvoSpawnedRef.current < 3 || salvoKilledRef.current < 3) {
        salvoRafRef.current = requestAnimationFrame(tick);
      }
    };

    salvoRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(salvoRafRef.current);
  }, [towerBeamActive]);

  const handleToggleEquipItem = (item: any) => {
    const id = String(item.id);
    if (!inventory.includes(id)) return;
  playSound('select');

    if (id.startsWith("arrow_")) {
      setEquippedArrow((prev) => (prev === id ? null : id));
    } else if (id.startsWith("armor_")) {
      setEquippedArmor((prev) => (prev === id ? null : id));
    } else if (id.startsWith("energy_")) {
      setEquippedEnergy((prev) => (prev === id ? null : id));
    } else if (item.category === "bow") {
      setEquippedBow((prev) => (prev === id ? null : id));
    } else if (item.category === "hat") {
      setEquippedHat((prev) => (prev === id ? null : id));
    } else if (item.category === "amulet") {
      setEquippedAmulet((prev) => (prev === id ? null : id));
    }
  };

    const removeOneFromInventory = (id: string | null) => {
    if (!id) return;

    const inv = inventoryRef.current;
    const idx = inv.indexOf(id);
    if (idx === -1) return;

    const next = [...inv];
    next.splice(idx, 1);

    inventoryRef.current = next;
    setInventory(next);

    if (!next.includes(id)) {
      if (id.startsWith("armor_")) setEquippedArmor(null);
      if (id.startsWith("arrow_")) setEquippedArrow(null);
      if (id.startsWith("energy_")) setEquippedEnergy(null);
    }
  };

const handleToggleCyberStyle = () => {
    if (!hasCyberUnlock) return;

    const next = !isCyberStyle;
    setIsCyberStyle(next);

    // P38MIN3C: cyber no longer clears equipment on toggle.

    playSound('select');
  };

  const handleSellItem = (item: any, amount: number, rate: number) => {
    const id = String(item.id);
    const owned = inventory.filter((x) => x === id).length;
    const sellAmount = Math.min(Math.max(1, Math.floor(Number(amount) || 1)), owned);

    if (sellAmount <= 0) return;

    const revenue = Math.floor(Number(getItemPrice(item) || 0) * Number(rate || 0)) * sellAmount;
    let removed = 0;

    setInventory((inv) =>
      inv.filter((x) => {
        if (x === id && removed < sellAmount) {
          removed += 1;
          return false;
        }
        return true;
      })
    );

    setTotalScore((score) => score + revenue);

    const remaining = owned - sellAmount;
    if (remaining <= 0) {
      if (id.startsWith("arrow_")) {
        setEquippedArrow((prev) => (prev === id ? null : prev));
      } else if (id.startsWith("armor_")) {
        setEquippedArmor((prev) => (prev === id ? null : prev));
      } else if (id.startsWith("energy_")) {
        setEquippedEnergy((prev) => (prev === id ? null : prev));
      } else if (item.category === "bow") {
        setEquippedBow((prev) => (prev === id ? null : prev));
      } else if (item.category === "hat") {
        setEquippedHat((prev) => (prev === id ? null : prev));
      } else if (item.category === "amulet") {
        setEquippedAmulet((prev) => (prev === id ? null : prev));
      }
    }
  };

  handlersRef.current.fire = (...args: any[]) => {
      window.dispatchEvent(new Event("rhrf:dismiss-dialog"));
      return (handleFire as any)(...args);
    };
  handlersRef.current.towerFire = (...args: any[]) => {
      window.dispatchEvent(new Event("rhrf:dismiss-dialog"));
      return (handleTowerFire as any)(...args);
    };
  handlersRef.current.jump = (...args: any[]) => {
      window.dispatchEvent(new Event("rhrf:dismiss-dialog"));
      return (handleJump as any)(...args);
    };

  useEffect(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [loading]);

(window as any).__RHRF_IS_CYBER__ = Boolean(isCyberStyle && hasCyberUnlock);
  (window as any).__RHRF_HAS_CYBER_UNLOCK__ = Boolean(hasCyberUnlock);

    useEffect(() => {
    const onToggle = () => handleToggleCyberStyle();
    window.addEventListener("rhrf-toggle-cyber", onToggle as EventListener);
    return () => window.removeEventListener("rhrf-toggle-cyber", onToggle as EventListener);
  }, [handleToggleCyberStyle, hasCyberUnlock]);

    useEffect(() => {
    if (isCyberStyle && !hasCyberUnlock) {
      setIsCyberStyle(false);
    }
  }, [isCyberStyle, hasCyberUnlock]);

  cyberRef.current = Boolean(isCyberStyle && hasCyberUnlock);
  mutedRef.current = isMuted;
  armorRef.current = equippedArmor;
  inventoryRef.current = inventory;
  // P38MIN3C: cyber no longer clears equipment via effect; toggling cyber remains optional.

  const RHRF_TEST_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1", ""];
  const RHRF_TEST_ENABLED =
    typeof window !== "undefined" && RHRF_TEST_HOSTS.includes(window.location.hostname);

  useEffect(() => {
    if (!RHRF_TEST_ENABLED) return;
    const w = window as any;
    const addRF = (amount: number = 10000) => {
      const v = Math.max(0, Math.floor(Number(amount) || 0));
      if (v > 0) setTotalScore((x) => x + v);
    };
    const setRF = (amount: number = 0) => {
      setTotalScore(Math.max(0, Math.floor(Number(amount) || 0)));
    };
    const addItem = (id: string, count: number = 1) => {
      const n = Math.max(0, Math.floor(Number(count) || 0));
      const cid = String(id || "").trim();
      if (cid && n > 0) setInventory((inv) => [...inv, ...Array(n).fill(cid)]);
    };
    const addAllLegendaries = () => {
      setInventory((inv) => [...inv, "bow_legendary", "hat_legendary", "amulet_legendary"]);
    };
    w.__RHRF_TEST__ = { addRF, setRF, addItem, addAllLegendaries };
    const onPlanetMsg = (e: MessageEvent) => {
      const d = e.data as any;
      if (d && d.type === "rf:set-planet") {
        const planet = String(d.planet || "cyber");
        (window as any).__RHRF_PLANET__ = planet;
        try { localStorage.setItem("rf-planet", planet); } catch {}
      }
    };
    window.addEventListener("message", onPlanetMsg);
    return () => { delete w.__RHRF_TEST__; window.removeEventListener("message", onPlanetMsg); };
  }, []);

useEffect(() => {
if (!entryDone || arcIntroShownRef.current) return;
try {
  if (localStorage.getItem("rf-arc-intro-shown")) return;
} catch {}
const firstRun = !bootRun || !(bootRun as any).planet || (bootRun as any).planet === "arc-intro";
if (!firstRun) return;
  if (getPlanetId() === "stable") {
    arcIntroShownRef.current = true;
    try { localStorage.setItem("rf-arc-intro-shown", "1"); } catch {}
    setArcMode("intro");
  }
}, [entryDone]);

useEffect(() => {
  if (!entryDone) return;
  let raw = "";
  try { raw = String((window as any).__RHRF_PLANET__ || ""); } catch {}
  if (!raw) { try { raw = localStorage.getItem("rf-planet") || ""; } catch {} }
  if (raw === "arc-final") setArcMode("final");
}, [entryDone]);

useEffect(() => {
  const onExit = () => {
    try {
      (window as any).__RHRF_PLANET__ = "cyber";
      localStorage.setItem("rf-planet", "cyber");
      localStorage.removeItem(RUN_STORAGE_KEY);
      (window as any).__RHRF_ROBO_ACTIVE__ = false;
      (window as any).__RHRF_IS_CYBER__ = false;
    } catch {}
    bootRun = null;
    setInventory([]);
    setEquippedBow(null);
    setEquippedHat(null);
    setEquippedAmulet(null);
    setEquippedArrow(null);
    setIsCyberStyle(false);
    setAutoPilot(false);
    setTotalScore(getInitialRf());
    setStreakBanner(null);
    setSuccessMessage(null);
    setRfCoins([]);
    setScorePopups([]);
    setStuckArrows([]);
    setExplosions([]);
    setAsteroidVisible(false);
    setGameStats((prev) => {
      const next: GameStats = {
        ...prev,
        sessionStartTime: Date.now(),
        currentSessionMs: 0,
        earnedScore: 0,
        currentCyberStreak: 0,
        currentGhostStreak: 0,
        currentAsteroidStreak: 0,
      };
      try { saveStats(next); } catch {}
      return next;
    });
    setArcMode(null);
    setEntryDone(false);
  };
  window.addEventListener("rhrf:exit-game", onExit);
  return () => window.removeEventListener("rhrf:exit-game", onExit);
}, []);
  useEffect(() => {
    const onArcade = (e: Event) => {
      const fresh = Boolean((e as CustomEvent).detail?.fresh);
      setStreakBanner({
        text: t("arc.title.line"),
        count: 1,
        kind: "arcade",
        badge: fresh ? { icon: "c_plateau", label: t("badge.arcade_1") } : null,
      });
      pt(() => setStreakBanner(null), 5000);
    };
    window.addEventListener("rhrf:arcade-complete", onArcade as EventListener);
    return () => window.removeEventListener("rhrf:arcade-complete", onArcade as EventListener);
  }, [t]);

if (loading || !entryDone) {
    return <EntryFlow onEnterGame={() => { setEntryDone(true); void preloadNpcSprites().catch(() => {}); }} loading={loading} />;
  }

if (arcMode && arcMode !== "depart") {
  return (
    <div className={"scene-container rf-arc-root" + (isPaused ? " rf-paused-root" : "")}>
      <ArcStage mode={arcMode}>
        {(vb) => (
          <ArcLayer
            mode={arcMode}
            vb={vb}
            pixels={friendPixels}
            sidePixels={sidePixels}
            backPixels={backPixels}
            accent={getPlanetMainColor(getPlanetId())}
            onComplete={(m) => {
              if (m === "intro") {
                setArcMode(null);
                setPlanet("stable");
                (window as any).__RHRF_PLANET__ = "stable";
                setEntryDone(true);
              } else if (m === "depart") {
                const nx = pendingNextRef.current || getNextPlanet(getPlanetId());
                pendingNextRef.current = "";
                salvoKilledRef.current = 0;
                setTowerActivated(false);
                setTowerBeamActive(false);
                setAsteroidVisible(false);
                setArcMode(null);
                setPlanet(nx);
                (window as any).__RHRF_PLANET__ = nx;
              } else {
                setArcMode(null);
                setPlanet("cyber");
                (window as any).__RHRF_PLANET__ = "cyber";
                setEntryDone(true);
                setRwaEnded(false);
                setRwaPortalOpen(false);
                setRwaPortalPhase("closed");
                setRwaHeroMode("normal");
                setRwaStonePhase("alive");
              }
            }}
          />
        )}
      </ArcStage>

      {/* rf-arc-banner-inside */}
      {streakBanner && (streakBanner.kind === "arcade" || getGameMode() !== "arcade") && (() => {
        const isFinal = isFinalRank(streakBanner.kind, streakBanner.count);
        return (
          <div
            className={`rf-overlay-msg rf-streak-msg rf-shake-text${isFinal ? " rf-streak-final" : ""}${streakBanner.kind === "arcade" ? " rf-streak-always" : ""}`}
            style={{ ["--rf-streak-color" as any]: KIND_COLOR[streakBanner.kind] } as any}
          >
            <div className="rf-streak-line">{streakBanner.text}</div>
            {streakBanner.badge && (
              <div className="rf-streak-badge">
                <BadgeIcon id={streakBanner.badge.icon} size={22} />
                <span>{t("badge.unlockedPrefix")} {streakBanner.badge.label}</span>
              </div>
            )}
          </div>
        );
      })()}

      {isPaused && (
        <svg
          viewBox="0 0 960 640"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 60 }}
        >
          <g pointerEvents="none">
            <rect x="-20000" y="-20000" width="60000" height="60000" fill="#050015" opacity="0.72" />
            <g className="rf-glitch-container">
              <text
                x="480"
                y="335"
                textAnchor="middle"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="54"
                fontWeight="bold"
                fill="#c0f"
                letterSpacing="4"
                className="rf-glitch-text-base"
              >
                {t("scene.paused")}
              </text>
              <text
                x="480"
                y="335"
                textAnchor="middle"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="54"
                fontWeight="bold"
                fill="#ccff00"
                letterSpacing="4"
                className="rf-glitch-text-r"
              >
                {t("scene.paused")}
              </text>
              <text
                x="480"
                y="335"
                textAnchor="middle"
                fontFamily="'Courier New', Courier, monospace"
                fontSize="54"
                fontWeight="bold"
                fill="#ccff00"
                letterSpacing="4"
                className="rf-glitch-text-g"
              >
                {t("scene.paused")}
              </text>
            </g>
          </g>
        </svg>
      )}
    </div>
  );
}

  const currentPlanetId = getPlanetId();

  const activateRwaTower = () => {
    if (
      getPlanetId() !== "rwa" ||
      !rwaTowerReady ||
      rwaStonePhase !== "alive" ||
      !effectiveCyberStyle ||
      !cyberRef.current ||
      isLaserFiring ||
      laserCooldown ||
      rwaEnded ||
      pausedRef.current
    ) return;

    setTowerActivated(true);
    setIsLaserFiring(true);
    setLaserCooldown(true);
    setRwaTowerReady(false);
    setRwaSpiral(false);
    setRwaEnded(false);
    setRwaHeroMode("normal");
    rwaHeroModeRef.current = "normal";
    rwaPortalOpenRef.current = false;
    setRwaPortalOpen(false);
    setRwaPortalPhase("closed");
    rwaStonePhaseRef.current = "alive";
    setRwaStonePhase("alive");
    playSound("impact");
    showRwaBanner("TOWER FIRING", 0, 1800);

    pt(() => {
      rwaStonePhaseRef.current = "red";
      setRwaStonePhase("red");
    }, 800);

    pt(() => {
      window.dispatchEvent(new CustomEvent("rhrf-asteroid-explode", { detail: { x: TARGET_CX, y: TARGET_CY } }));
      rwaStonePhaseRef.current = "gone";
      setRwaStonePhase("gone");
      setStuckArrows([]);
      setIsLaserFiring(false);
      setLaserCooldown(false);
      setTowerActivated(false);
    }, 3800);
  };

  const onRwaIntroDone = () => setRwaIntroDone(true);

  const openRwaPortal = () => {
    if (getPlanetId() !== "rwa") return;
    if (rwaStonePhaseRef.current !== "gone") return;
    if (rwaPortalOpenRef.current) return;
    setRwaFarewellShown(true);
    rwaPortalOpenRef.current = true;
    setRwaPortalOpen(true);
    setRwaPortalPhase("open");
    showRwaBanner(isTouchDevice ? "TAP THE BEAM" : "PRESS G TO ENTER PORTAL", 0, 6000);
  };

  const enterRwaPortal = () => {
    if (
      getPlanetId() !== "rwa" ||
      !rwaPortalOpenRef.current ||
      rwaHeroModeRef.current !== "normal" ||
      rwaEnded ||
      pausedRef.current
    ) return;

    rwaHeroModeRef.current = "side";
    setRwaHeroMode("side");
    showRwaBanner("ENTERING PORTAL", 0, 2600);

    pt(() => {
      rwaHeroModeRef.current = "fade";
      setRwaHeroMode("fade");
    }, 6500);

    pt(() => {
      rwaHeroModeRef.current = "hidden";
      setRwaHeroMode("hidden");
      setRwaPortalPhase("closing");
      showRwaBanner("PORTAL CLOSED", 0, 2600);
    }, 8750);

    pt(() => {
      rwaPortalOpenRef.current = false;
      setRwaPortalOpen(false);
      setRwaPortalPhase("closed");
      setArcMode("final");
    }, 9850);
  };

  enterRwaPortalRef.current = enterRwaPortal;

  const currentTier = getPlanetTier(currentPlanetId);

  const rarityLabel = requiredRarity(currentTier).toUpperCase();
  const currentSupplyId = missionSupplyItemId(currentPlanetId, currentTier);
  const currentSupplyCount = inventory.filter((x) => x === currentSupplyId).length;
  const currentSupplyLabel = missionSupplyLabel(getMissionSupplyKind(currentPlanetId));
  const currentMissions = currentPlanetId === "rwa"
    ? rwaMissions
    : (missions[currentPlanetId] || emptyMissions());

  return (
    <div ref={gameContainerRef} tabIndex={0}  style={{ ["--rf-beam-color" as any]: getPlanetMainColor(currentPlanetId) }} className={"scene-container" + (screenShake ? " screen-shake" : "") + (effectiveCyberStyle ? " cyber-active" : "") + (isPaused ? " rf-paused-root" : "") + ((showShop || showProfile || showGuide || showLang) ? " rf-overlay-open" : "")}>

      <div className="scanline-overlay" />
      <div className="vignette" />

      {showShop && (
        <Shop onToggleEquip={handleToggleEquipItem}  onAddConsumable={handleAddConsumable} onToggleAuto={handleToggleAuto} autoSet={autoSet} equippedConsumable={equippedConsumable}
          score={totalScore}
          inventory={inventory}
          equippedBow={equippedBow}
          equippedAmulet={equippedAmulet}
          equippedHat={equippedHat}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onClose={() => { setShowShop(false); playSound('select'); }}

        equippedArrow={equippedArrow}
        equippedArmor={equippedArmor}
        equippedEnergy={equippedEnergy}
          isCyberStyle={effectiveCyberStyle}
          hasCyberUnlock={Boolean(hasCyberUnlock)}
          onToggleCyber={handleToggleCyberStyle}
        />
      )}

            <TopHud
        score={gameStats.earnedScore}
        rf={totalScore}
        onShop={() => { openOverlay("shop"); playSound('select'); }}
        onGuide={() => { openOverlay("guide"); playSound('select'); }}
        onProfile={() => { openOverlay("profile"); playSound('select'); }}
        onLang={() => { openOverlay("lang"); playSound('select'); }}
        flashColor={flashColor}
        metalStyle={autoPilot}
        greatStyle={greatPilot}
        isPaused={isPaused}
        isMuted={isMuted}
        autoPauseEnabled={autoPauseOnHidden}
        onTogglePause={togglePause}
        onToggleMute={toggleMute}
        onToggleTabPause={toggleAutoPauseOnHidden}
      />

<div className="rf-shake-layer">
<Scene
        nftImageUrl={nftImageUrl}
        missions={currentMissions}
        towerActivated={towerActivated}
        laserX={laserPos.x}
        laserY={laserPos.y}
        towerBeamActive={towerBeamActive}
        waveR={waveR}
        towerBeamColor={
          currentPlanetId === "cyber"
            ? greatPilot ? "#d6b45a" : autoPilot ? "#8f99a6" : effectiveCyberStyle ? "cyber" : "#ff0000"
            : getPlanetMainColor(currentPlanetId)
        }
        isShooting={isShooting}
        isJumping={isJumping}
        isLaserFiring={isLaserFiring}
        rwaIntroDone={rwaIntroDone}
        onRwaMonologueDone={openRwaPortal}
        onRwaIntroDone={onRwaIntroDone}
        rwaFacing={rwaFacing}
        rwaRunesGray={rwaRunesGray}
        rwaStonePhase={rwaStonePhase}
        rwaTowerCharged={rwaTowerCharged}
        rwaStoneDamage={rwaStoneDamage}
        rwaWavePulses={rwaWavePulses}
        rwaWaveKey={rwaWaveKey}
        rwaHeroMode={rwaHeroMode}
        rwaPortalOpen={rwaPortalOpen}
        rwaPortalPhase={rwaPortalPhase}
         rwaFarewellShown={rwaFarewellShown}
        onEnterPortal={enterRwaPortal}
        asteroidVisible={asteroidVisible}
        asteroidPosition={asteroidPosition}
        explosions={explosions}
        landingGlow={landingGlow}
        arrowProgress={arrowProgress}
        frozenLaser={shotTargetRef.current}
        isMetalStyle={autoPilot}
        stuckArrows={stuckArrows}
        scorePopups={scorePopups}
  depart={arcMode === "depart" ? {
        planet: getPlanetId(),
        onDone: () => {
          const nx = pendingNextRef.current || getNextPlanet(getPlanetId());
          pendingNextRef.current = "";
          salvoKilledRef.current = 0;
          setTowerActivated(false);
          setTowerBeamActive(false);
          setAsteroidVisible(false);
          asteroidLiveRef.current = false;
          salvoDoneRef.current = false;
          shieldDoneRef.current = false;
          cancelAnimationFrame(waveRafRef.current);
          setWaveR(-1);
          (window as any).__RHRF_WAVE_R__ = -1;
          (window as any).__RHRF_TOWER_SHIELD__ = false;
          // P319 CLEAR TRANSIENT
          setStuckArrows([]);
          setScorePopups([]);
          setRfCoins([]);
          setExplosions([]);
          setArcMode(null);
          setPlanet(nx);
          (window as any).__RHRF_PLANET__ = nx;
        },
      } : null}
      rfCoins={rfCoins}
        onCoinDone={(id) => setRfCoins((arr) => arr.filter((c) => c.id !== id))}

        arrowQualityId={shotArrowId}
        energyQualityId={towerEnergyId}
        shotPhase={shotPhase}
        bowQualityId={effectiveCyberStyle ? null : equippedBow}
        isFallen={isFallen}
        fallRemaining={fallRemaining}
       friendPixels={friendPixels} sidePixels={sidePixels} leftPixels={leftPixels} backPixels={backPixels} forceSidePose={forceSidePose} jumpVariant={jumpVariant} equippedArmor={equippedArmor} clothingQualityId={effectiveCyberStyle ? null : equippedHat} amuletQualityId={effectiveCyberStyle ? null : equippedAmulet} isCyberStyle={effectiveCyberStyle}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isPaused={isPaused}
        onPopupDone={(id) => setScorePopups((arr) => arr.filter((p) => p.id !== id))}
        onTogglePause={togglePause}
        autoPauseEnabled={autoPauseOnHidden}
        onToggleTabPause={toggleAutoPauseOnHidden}
      />

      </div>
      {asteroidWarning && (
        <div className="rf-overlay-msg rf-msg-red rf-shake-text">
           {t("msg.asteroidReached")}
        </div>
      )}
      {successMessage && (
        <div className="rf-overlay-msg rf-msg-green rf-shake-text">
           {successMessage}
        </div>
      )}

      {rerollMsg && (
        <div className="rf-overlay-msg rf-streak-msg" style={{ ["--rf-streak-color" as any]: "#cfd6df" } as any}>
          <div className="rf-streak-line">{rerollMsg}</div>
        </div>
      )}
      {streakBanner && (streakBanner.kind === "arcade" || getGameMode() !== "arcade") && (() => {
        const isFinal = isFinalRank(streakBanner.kind, streakBanner.count);
        return (
          <div
            className={`rf-overlay-msg rf-streak-msg rf-shake-text${isFinal ? " rf-streak-final" : ""}${streakBanner.kind === "arcade" ? " rf-streak-always" : ""}`}
            style={{ ["--rf-streak-color" as any]: KIND_COLOR[streakBanner.kind] } as any}
          >
            <div className="rf-streak-line">{streakBanner.text}</div>
            {streakBanner.badge && (
              <div className="rf-streak-badge">
                <BadgeIcon id={streakBanner.badge.icon} size={22} />
                <span>{t("badge.unlockedPrefix")} {streakBanner.badge.label}</span>
              </div>
            )}
          </div>
        );
      })()}

      <SessionNotice />
      <div className="rf-hud-top">
      <ArrowHud
        inventory={inventory}
        equippedArrow={equippedArrow}
        equippedArmor={equippedArmor}
        equippedEnergy={equippedEnergy}
        onEquipArrow={(id: string) => {
          setEquippedArrow((prev) => {
            if (prev === id) return null;
            if (!Array.isArray(inventory) || !inventory.includes(id)) return prev;
            return id;
          });
        }}
        onEquipArmor={(id: string) => {
          setEquippedArmor((prev) => {
            if (prev === id) return null;
            if (!Array.isArray(inventory) || !inventory.includes(id)) return prev;
            return id;
          });
        }}
        onEquipEnergy={(id: string) => {
          setEquippedEnergy((prev) => {
            if (prev === id) return null;
            if (!Array.isArray(inventory) || !inventory.includes(id)) return prev;
            return id;
          });
        }}
        isPaused={isPaused}
      />
      </div>
      <div className="rf-bottom-row">
      {currentPlanetId === "cyber" && effectiveCyberStyle && !greatPilot && (
        <div className="rf-singularity-row rf-singularity-basic" style={{ gridColumn: "1 / -1", justifySelf: "center", display: "flex", alignItems: "center", gap: ".5em" }}>
          <button
            title="CYBER ROBO SINGULARITY"
            aria-pressed={autoPilot}
            onClick={() => setAutoPilot((v) => !v)}
            style={{ width: "calc(var(--rf-ui-h) * 0.5)", height: "calc(var(--rf-ui-h) * 0.5)", border: "1px solid #8a94a0", borderRadius: "6px", background: roboBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", boxSizing: "border-box" }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "72%", height: "72%", display: "block" }}>
              <rect x="6" y="3" width="12" height="9" rx="2" fill="none" stroke={roboColor} strokeWidth="2"/>
              <rect x="9" y="6.5" width="2" height="2" fill={roboColor}/>
              <rect x="13" y="6.5" width="2" height="2" fill={roboColor}/>
              <line x1="12" y1="1" x2="12" y2="3" stroke={roboColor} strokeWidth="2"/>
              <rect x="7" y="13" width="10" height="8" rx="2" fill="none" stroke={roboColor} strokeWidth="2"/>
              <line x1="4" y1="15" x2="7" y2="15" stroke={roboColor} strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="15" x2="20" y2="15" stroke={roboColor} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {autoPilot && roboUi && (
            <div style={{ font: "800 clamp(10px,1.6vmin,14px)/1 monospace", letterSpacing: ".06em", color: "#cfd6df", whiteSpace: "nowrap" }}>
              {roboUi.b}<span style={{ opacity: .45 }}> | </span>{roboUi.a}<span style={{ opacity: .45 }}> | </span>{roboUi.g}
            </div>
          )}
          {autoPilot && (
            <button
              title="ENTER GREAT SINGULARITY"
              aria-pressed={greatPilot}
              onClick={() => setGreatPilot(true)}
              style={{ width: "calc(var(--rf-ui-h) * 0.5)", height: "calc(var(--rf-ui-h) * 0.5)", border: "1px solid #b8923f", borderRadius: "6px", background: "#8a6a1f", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", boxSizing: "border-box" }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "72%", height: "72%", display: "block" }}>
                <rect x="6" y="3" width="12" height="9" rx="2" fill="none" stroke="#f5dc8a" strokeWidth="2"/>
                <rect x="9" y="6.5" width="2" height="2" fill="#f5dc8a"/>
                <rect x="13" y="6.5" width="2" height="2" fill="#f5dc8a"/>
                <line x1="12" y1="1" x2="12" y2="3" stroke="#f5dc8a" strokeWidth="2"/>
                <rect x="7" y="13" width="10" height="8" rx="2" fill="none" stroke="#f5dc8a" strokeWidth="2"/>
                <line x1="4" y1="15" x2="7" y2="15" stroke="#f5dc8a" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="15" x2="20" y2="15" stroke="#f5dc8a" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}
      {currentPlanetId === "cyber" && effectiveCyberStyle && greatPilot && (
        <div className="rf-singularity-row rf-singularity-great" style={{ gridColumn: "1 / -1", justifySelf: "center", display: "flex", alignItems: "center", gap: ".5em" }}>
          <button
            title="EXIT GREAT SINGULARITY"
            aria-pressed={greatPilot}
            onClick={() => setGreatPilot(false)}
            style={{ width: "var(--rf-ui-h)", height: "var(--rf-ui-h)", border: "1px solid #f5dc8a", borderRadius: "8px", background: "linear-gradient(160deg,#8a6a1f,#d6b45a 55%,#fff0b8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", boxSizing: "border-box", boxShadow: "0 0 12px rgba(245,220,138,.35)" }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "72%", height: "72%", display: "block" }}>
              <rect x="6" y="3" width="12" height="9" rx="2" fill="none" stroke="#2b1d07" strokeWidth="2"/>
              <rect x="9" y="6.5" width="2" height="2" fill="#2b1d07"/>
              <rect x="13" y="6.5" width="2" height="2" fill="#2b1d07"/>
              <line x1="12" y1="1" x2="12" y2="3" stroke="#2b1d07" strokeWidth="2"/>
              <rect x="7" y="13" width="10" height="8" rx="2" fill="none" stroke="#2b1d07" strokeWidth="2"/>
              <line x1="4" y1="15" x2="7" y2="15" stroke="#2b1d07" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="15" x2="20" y2="15" stroke="#2b1d07" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
      <div className={`controls-row${isPaused ? " rf-paused-lock" : ""}`} style={currentPlanetId === "cyber" && effectiveCyberStyle && greatPilot ? { display: "none" } : undefined}>
        {currentPlanetId !== "cyber" && (
        <MissionList
          planetId={currentPlanetId}
          missions={currentMissions}
          rarityLabel={rarityLabel}
          rwaPortalOpen={rwaPortalOpen}
          rwaTouch={isTouchDevice}
          rwaCyberReady={effectiveCyberStyle}
          onOpenProfile={() => { (window as any).__RHRF_PROFILE_TAB__ = currentPlanetId === "rwa" ? "cyber" : "equipment"; openOverlay("profile"); }}
          rwaBulls={rwaBulls}
          rwaTowerReady={rwaTowerReady && effectiveCyberStyle && rwaStonePhase === "alive"}
          onActivateTower={currentPlanetId === "rwa" ? activateRwaTower : handleActivateTower}
          accent={getPlanetAccent(currentPlanetId)}
          arrowCount={currentSupplyCount}
          arrowCap={CONSUMABLE_CAP}
          supplyLabel={currentSupplyLabel}
          disabled={towerActivated}
          towerActivated={towerActivated}
        />
      )}
        <button className={`fire-tower-btn rf-ui-item rf-ui-item--fire${laserCooldown ? " rf-on-cd" : ""}${currentPlanetId === "rwa" && rwaTowerCharged ? " rf-rwa-fire-charged" : ""}`} style={(() => { const c = autoPilot ? "#8f99a6" : (equippedEnergy && getCount(equippedEnergy) > 0 && equippedEnergy.includes("legendary")) ? "#F7931A" : (equippedEnergy && getCount(equippedEnergy) > 0 && equippedEnergy.includes("epic")) ? "#aa00ff" : (equippedEnergy && getCount(equippedEnergy) > 0 && equippedEnergy.includes("rare")) ? "#ccff00" : (currentPlanetId === "cyber" && arcMode !== "depart" && !effectiveCyberStyle ? "#ff0000" : "#000000"); const d = c === "#000000" ? "#ffffff" : c; return { borderColor: d, color: d }; })()} disabled={isFallen || laserCooldown || isLaserFiring || towerActivated || arcMode === "depart" || (currentPlanetId === "rwa" && !rwaTowerCharged)} onClick={() => {
            window.dispatchEvent(new Event("rhrf:dismiss-dialog"));
            handleTowerFire();
          }}>
          {t("btn.fire")}
        </button>
        <button className="shot-btn rf-ui-item rf-ui-item--shot" style={(() => { const c = autoPilot ? "#8f99a6" : (equippedArrow && getCount(equippedArrow) > 0 && equippedArrow.includes("legendary")) ? "#F7931A" : (equippedArrow && getCount(equippedArrow) > 0 && equippedArrow.includes("epic")) ? "#aa00ff" : (equippedArrow && getCount(equippedArrow) > 0 && equippedArrow.includes("rare")) ? "#ccff00" : (currentPlanetId === "cyber" && arcMode !== "depart" && !effectiveCyberStyle ? "#ff0000" : "#000000"); const d = c === "#000000" ? "#ffffff" : c; return { borderColor: d, color: d }; })()} disabled={isFallen || shotPhase !== 'IDLE' || isJumping || isLaserFiring || towerActivated || arcMode === "depart"} onClick={() => { window.dispatchEvent(new Event("rhrf:dismiss-dialog")); handleFire(); }}>
          {t("btn.shot")}
        </button>
        <button className="jump-btn rf-ui-item rf-ui-item--jump" disabled={isFallen || shotPhase !== 'IDLE' || isJumping || isShooting || towerActivated || arcMode === "depart"} onClick={() => { window.dispatchEvent(new Event("rhrf:dismiss-dialog")); handleJump(); }}>
          {t("btn.jump")}
        </button>
      </div>

      </div>

      {showGuide && <Guide onClose={() => { setShowGuide(false); playSound('select'); }} />}
      {showLang && <LangMenu onClose={() => { setShowLang(false); playSound('select'); }} onSelect={() => playSound('select')} />}

      {showProfile && (
        <Profile
          onToggleEquip={handleToggleEquipItem}
          onSell={handleSellItem}
          score={totalScore}
          inventory={inventory}
          equippedBow={equippedBow}
          equippedAmulet={equippedAmulet}
          equippedHat={equippedHat}
          equippedArrow={equippedArrow}
          equippedArmor={equippedArmor}
          equippedEnergy={equippedEnergy}
          isCyberStyle={effectiveCyberStyle}
          hasCyberUnlock={Boolean(hasCyberUnlock)}
          onToggleCyber={handleToggleCyberStyle}
          onClose={() => { setShowProfile(false); playSound('select'); }}

          gameStats={gameStats}
          friendId={friendId}
        />
      )}
    </div>
  );
}

export default function RhrfBullseye({ friendId, client }: { friendId?: bigint | null; client?: any }) {
  if (friendId === null || friendId === undefined) {
    return <div style={{ padding: 24, color: "#fff", fontFamily: "monospace" }}>{translate(getLang(), "sdk.chooseFriend", undefined, "Choose a Friend to play")}</div>;
  }
  return <RhrfBullseyeInner friendId={friendId} client={client} />;
}
