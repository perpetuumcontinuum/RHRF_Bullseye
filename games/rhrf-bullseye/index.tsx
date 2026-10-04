import React, { useState, useEffect, useRef, useMemo } from "react";
import { rankForStreak, buildStreakMessage, streakGradient, BadgeIcon } from "./engine/achievements";
import { type GameStats, loadStats, saveStats } from "./engine/stats";
import { createFriendSoundKit } from "@rarefriends/friendsdk/sounds";

// RHRF_SANDBOX_NOISE_FILTER: neutralize unavailable sandbox storage and known SDK bridge noise.
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
import { SCORE_TARGET_X, SCORE_TARGET_Y, ARROW_POPUP_X, ARROW_POPUP_Y } from "./engine/geometry";
import TopHud from "./engine/TopBar";
import { SHOP_ITEMS, calculateFinalScore, calculateScore, TARGET_CX, TARGET_CY, getRarityMult, TARGET_R, ARROW_START_X, ARROW_START_Y, getRandomPointInTarget, getScoreColor } from "./engine/math";
import Guide from "./engine/Guide";
import Profile from "./engine/Profile";
import Scene from "./engine/Scene";
import "./style.css";

// milliseconds the crosshair travels before SHOT unlocks again
const TARGET_RESUME_LEAD_MS = 500;
const LASER_COOLDOWN_MS = 10000;

export default function RhrfBullseye({ friendId, client }: { friendId?: bigint | null; client?: any }) {
  const [gameStats, setGameStats] = useState<GameStats>(() => loadStats());
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
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='#0a0014'/><circle cx='32' cy='32' r='24' fill='none' stroke='#00ffff' stroke-width='4'/><circle cx='32' cy='32' r='15' fill='none' stroke='#ccff00' stroke-width='4'/><circle cx='32' cy='32' r='7' fill='#ffaa00'/><line x1='32' y1='2' x2='32' y2='14' stroke='#ff00ff' stroke-width='4'/><line x1='32' y1='50' x2='32' y2='62' stroke='#ff00ff' stroke-width='4'/><line x1='2' y1='32' x2='14' y2='32' stroke='#ff00ff' stroke-width='4'/><line x1='50' y1='32' x2='62' y2='32' stroke='#ff00ff' stroke-width='4'/></svg>";
    let hostDoc: Document = document;
    try { if (window.top && window.top.document) hostDoc = window.top.document; } catch {}
    const link = hostDoc.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    hostDoc.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  if (friendId === null || friendId === undefined) {
    return <div style={{ padding: 24, color: "#fff", fontFamily: "monospace" }}>Choose a Friend to play</div>;
  }

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
  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [shotPhase, setShotPhase] = useState<'IDLE' | 'AIMING' | 'FLYING' | 'RESUMING'>('IDLE');
  const aimTimerRef = useRef<number | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpVariant, setJumpVariant] = useState("spin-360");
  const [isLaserFiring, setIsLaserFiring] = useState(false);
  const [laserCooldown, setLaserCooldown] = useState(false);
  const [asteroidPosition, setAsteroidPosition] = useState({ x: 0, y: 0 });
  const [asteroidVisible, setAsteroidVisible] = useState(false);
  const [landingGlow, setLandingGlow] = useState({ x: 0, y: 480, visible: false });
const [screenShake, setScreenShake] = useState(false);
const [asteroidWarning, setAsteroidWarning] = useState(false);
const [explosion, setExplosion] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [streakBanner, setStreakBanner] = useState<{ text: string; count: number } | null>(null);
  const streaksRef = useRef({ cyber: 0, ghost: 0, asteroid: 0 });

  const unlockBadge = (id: string) => {
    setGameStats((prev) => {
      if (prev.earnedBadges.includes(id)) return prev;
      const next = { ...prev, earnedBadges: [...prev.earnedBadges, id] };
      saveStats(next);
      return next;
    });
  };

  const showStreakAlert = (kind: "cyber" | "ghost" | "asteroid") => {
    const count = streaksRef.current[kind];
    const rank = rankForStreak(count);
    if (!rank) return; // только пороги: 3, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101
    unlockBadge(rank.id);
    setStreakBanner({ text: buildStreakMessage(kind, count), count });
    pt(() => setStreakBanner(null), count >= 101 ? 60000 : 2500);
  };
const impactTimersRef = useRef<number[]>([]);
const asteroidKilledRef = useRef(false);
  const [laserTargetY, setLaserTargetY] = useState(0);
  const [arrowProgress, setArrowProgress] = useState(0);
  const [laserPos, setLaserPos] = useState(getRandomPointInTarget());
  const [laserTarget, setLaserTarget] = useState(getRandomPointInTarget());
  const [stuckArrows, setStuckArrows] = useState<{x: number, y: number, color: string}[]>([]);
  const shotTargetRef = useRef<{ x: number; y: number } | null>(null);
  const laserPosLiveRef = useRef(laserPos);
  const [scorePopups, setScorePopups] = useState<{x: number, y: number, score: number, isBullseye?: boolean, color?: string, dx?: number, dy?: number, id: number}[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const CYBER_BULLSEYE_COLOR = "cyber";
  const [showShop, setShowShop] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const showShopRef = useRef(false);
  const showProfileRef = useRef(false);
  const showGuideRef = useRef(false);

  const isMenuOpenRef = () =>
    showShopRef.current || showProfileRef.current || showGuideRef.current;

  useEffect(() => {
    showShopRef.current = showShop;
    showProfileRef.current = showProfile;
    showGuideRef.current = showGuide;
  }, [showShop, showProfile, showGuide]);

  const menuOpen = showShop || showProfile || showGuide;
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
  const [inventory, setInventory] = useState<string[]>([]);
  const [equippedBow, setEquippedBow] = useState<string | null>(null);
  const [equippedAmulet, setEquippedAmulet] = useState<string | null>(null);
  const [equippedHat, setEquippedHat] = useState<string | null>(null);
  const [equippedArrow, setEquippedArrow] = useState<string | null>(null);
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
  const [shotArrowId, setShotArrowId] = useState<string | null>(null);
  const [towerEnergyId, setTowerEnergyId] = useState<string | null>(null);
  const [equippedConsumable, setEquippedConsumable] = useState<string | null>(null);

  const [isCyberStyle, setIsCyberStyle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    // Lives after the declaration to avoid a temporal dead zone hit
    (window as any).__RHRF_IS_PAUSED__ = isPaused;
    pausedRef.current = isPaused;
  }, [isPaused]);
  const pausedRef = useRef(false);
  useEffect(() => {
    // Freeze the simulation when the browser tab is hidden. Otherwise rAF stops
    // but Date.now keeps running, so on return the asteroid can instantly reach
    // the planet and queued effect timers can dump stale banners.
    const onVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        (window as any).__RHRF_IS_PAUSED__ = true;
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  // Effect timers (messages, shake, explosion) must not expire behind the
  // pause overlay: remaining time only drains while unpaused
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
    const ids = inventory.map((id) => String(id).toLowerCase());

    const hasLegendaryCategory = (categories: string[]) =>
      ids.some((id) => id.includes("legendary") && categories.some((c) => id.includes(c)));

    const result =
      hasLegendaryCategory(["bow"]) &&
      hasLegendaryCategory(["hat", "head", "helmet", "hood", "clothing", "outfit"]) &&
      hasLegendaryCategory(["amulet"]);

    return result;
  }, [inventory]);
  const effectiveCyberStyle = Boolean(isCyberStyle && hasCyberUnlock);
  const cyberRef = useRef(false);
  const hatRef = useRef<string | null>(null);
  const amuletRef = useRef<string | null>(null);
  const bowRef = useRef<string | null>(null);
  const armorRef = useRef<string | null>(null);
  const inventoryRef = useRef<string[]>([]);
  
  const popupIdCounter = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef<any>({ fire: null, towerFire: null, jump: null });
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

        if (!cancelled) {
          setFriendPixels(frontPixels);
          setSidePixels(sidePixelsLoaded);
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
    if (loading) return;
    let raf: number;
    
    const loop = () => {
      // Frozen during pause so the reticle and target stop drifting
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
          const amuletSlow = cyberRef.current ? 4 : getRarityMult(amuletRef.current ?? equippedAmulet);
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
      setInventory((inv) => {
        // mirror catalog CONSUMABLE_CAP (100) for the satellite-granted energy charge
        if (inv.filter((x) => x === 'energy_rare').length >= 100) return inv;
        return [...inv, 'energy_rare'];
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
    const mult = cyberRef.current ? 4 : getRarityMult(hatId);
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
    if (v.includes("legendary")) return "#ffaa00";
    if (v.includes("epic")) return "#aa00ff";
    if (v.includes("rare")) return "#ccff00";
    return "#ff0000";
  };

  const handleFire = () => {
    if (pausedRef.current) return;
    if (stateRef.current !== 'IDLE' || isJumping || isLaserFiring || isFallen || shotPhase !== 'IDLE') return;
    stateRef.current = 'SHOOTING';

    setStuckArrows([]);
    shotTargetRef.current = { x: laserPosLiveRef.current.x, y: laserPosLiveRef.current.y };

    const arrowToUse = equippedArrow && getCount(equippedArrow) > 0 ? equippedArrow : null;
    setShotArrowId(arrowToUse);
    consumeOne(arrowToUse);

    let aimTime = 1200;
    if (equippedArrow?.includes("legendary")) aimTime = 300;
    else if (equippedArrow?.includes("epic")) aimTime = 600;
    else if (equippedArrow?.includes("rare")) aimTime = 900;

    setShotPhase('AIMING');
    setIsShooting(true);
    playSound('action-start');
    setArrowProgress(0);

    if (aimTimerRef.current) clearTimeout(aimTimerRef.current);

    aimTimerRef.current = window.setTimeout(function onAimDone() {
      // Release is deferred while paused so no phase flips behind the overlay
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
        // In-flight arrow holds position during pause
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
          const dist = Math.hypot(lx, ly);
          const baseScore = calculateScore(dist);

          if (baseScore > 0) {
            const multiplier = (cyberRef.current ? 4 : getRarityMult(bowRef.current ?? equippedBow)) * getRarityMult(arrowToUse);
            const finalScore = Math.max(1, Math.floor(calculateFinalScore(baseScore, multiplier)));
            recordEvent("cyber", baseScore === 10);
      if (baseScore === 10) showStreakAlert("cyber");

            const hx = TARGET_CX + lx;
            const hy = TARGET_CY + ly;
            const popupId = Date.now() + Math.random();

            setTotalScore((score) => score + finalScore);

            addEarnedScore(finalScore);
            playSound('impact');
            setStuckArrows((arr) => [...arr.slice(-4), { x: hx, y: hy, color: arrowColorById(shotArrowId) }]);
            const popupColor = getScoreColor(baseScore);
const isBullseyeHit = baseScore === 10;
const effectivePopupColor = isBullseyeHit ? CYBER_BULLSEYE_COLOR : popupColor;
setScorePopups((arr) => [...arr, { x: ARROW_POPUP_X, y: ARROW_POPUP_Y, dx: SCORE_TARGET_X - ARROW_POPUP_X, dy: SCORE_TARGET_Y - ARROW_POPUP_Y, score: finalScore, isBullseye: baseScore === 10, color: effectivePopupColor, id: popupId }]);
if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
setFlashColor(effectivePopupColor);
// hold the hit color until the score popup animation finishes
flashTimerRef.current = window.setTimeout(() => {
  flashTimerRef.current = null;
  setFlashColor(null);
}, 2100);

            window.setTimeout(() => {
              setScorePopups((arr) => arr.filter((p) => p.id !== popupId));
            }, 2100);
          }

          // crosshair escapes immediately, buttons stay locked
          // for TARGET_RESUME_LEAD_MS so spam-clicking cannot
          // catch a target that has not moved yet
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

  const handleJump = () => {
    if (pausedRef.current) return;
    if (stateRef.current !== 'IDLE' || isJumping || isShooting || isLaserFiring || isFallen) return;
    setIsJumping(true);
    (window as any).__RHRF_JUMP_STARTED_AT__ = Date.now();
    playSound('select');
    setJumpVariant(["spin-360", "spin-reverse", "spin-720", "spin-double-reverse", "flip-horizontal", "tilt-mix", "feet-up", "flip-vertical"][Math.floor(Math.random() * 8)]);
    // Pausable jump clock: the 1200ms arc advances only in game time
    const jumpT0 = Date.now();
    jumpPauseAccumRef.current = 0;
    jumpPausedRef.current = false;
    const checkJumpEnd = () => {
      if (pausedRef.current) {
        if (!jumpPausedRef.current) {
          jumpPausedRef.current = true;
          jumpPauseSinceRef.current = Date.now();
        }
        requestAnimationFrame(checkJumpEnd);
        return;
      }
      if (jumpPausedRef.current) {
        jumpPauseAccumRef.current += Date.now() - jumpPauseSinceRef.current;
        jumpPausedRef.current = false;
      }
      if (Date.now() - jumpT0 - jumpPauseAccumRef.current >= 1200) {
        setIsJumping(false);
      } else {
        requestAnimationFrame(checkJumpEnd);
      }
    };
    requestAnimationFrame(checkJumpEnd);
  };

  useEffect(() => {
    const onGhostHit = () => {
      // Hit validation is owned by the collision loop in BackgroundEvents
      recordEvent("ghost", false);

      const armorId = armorRef.current;
      let duration = 8000;

      if (armorId && inventoryRef.current.includes(armorId)) {
        if (armorId.includes("legendary")) duration = 2000;
        else if (armorId.includes("epic")) duration = 4000;
        else if (armorId.includes("rare")) duration = 6000;

        removeOneFromInventory(armorId);
      }

      setIsJumping(false);
      setIsFallen(true);
      playSound('impact');
      setFallRemaining(Math.ceil(duration / 1000));
    };

    window.addEventListener("rhrf-ghost-hit", onGhostHit);
    return () => window.removeEventListener("rhrf-ghost-hit", onGhostHit);
  }, [isJumping, isFallen, equippedArmor]);

  useEffect(() => {
    if (!isFallen) return;
    // Freeze fall timer while paused to preserve character state
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
      // Freeze jump clock: store elapsed so the safe-air window survives pause
      const start = Number((window as any).__RHRF_JUMP_STARTED_AT__ || 0);
      if (start > 0) jumpElapsedAtPauseRef.current = Date.now() - start;
    } else if (jumpElapsedAtPauseRef.current !== null) {
      // Resume jump clock from the preserved offset
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

      
      const cyberStatus = effectiveCyberStyle ? "CYBER ACTIVATED" : "STANDARD LOADOUT";
      const scoreStr = totalScore.toLocaleString();
      
      const messageParts = [
        "DEFEND THE PLANET.",
        "Asteroids incoming. Ghosts hunting.",
        `My Score: ${scoreStr} RF`,
        `Mode: ${cyberStatus}`,
        "Master reaction. Climb ranks. Earn RF.",
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
            title: "RHRF Bullseye",
            text,
          });
          return;
        }
      } catch {
      }

      downloadBlob(blob, filename);

      try {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
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

  const recordEvent = (type: "cyber" | "apple" | "asteroid" | "ghost", success: boolean) => {
    // Mirror streak counters into a ref for synchronous reads by showStreakAlert
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
    const onGhostDodged = () => { recordEvent("ghost", true); showStreakAlert("ghost"); };
    window.addEventListener("rhrf-ghost-dodged", onGhostDodged);
    return () => window.removeEventListener("rhrf-ghost-dodged", onGhostDodged);

  }, []);

  const handleTowerFire = () => {
    if (pausedRef.current) return;
    // Tower laser is independent of bow/jump/fall: only its own cooldown gates it
    if (laserCooldown || isLaserFiring) return;

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
    if (pausedRef.current || !isLaserFiring || !asteroidVisible) return;
    const ax = asteroidPosition.x;
    const ay = asteroidPosition.y;
    if (Math.abs(ax - 190) <= 45 && ay <= 330) {
      setAsteroidVisible(false);
asteroidKilledRef.current = true;
setExplosion({x: ax, y: ay, visible: true});
          setSuccessMessage("ASTEROID DEFLECTED!");
          recordEvent("asteroid", true);
          pt(() => showStreakAlert("asteroid"), 300);
          pt(() => setSuccessMessage(null), 2500);
impactTimersRef.current.push(pt(() => setExplosion({x: 0, y: 0, visible: false}), 1500));
      const mult = equippedEnergy?.includes("legendary") ? 4 : equippedEnergy?.includes("epic") ? 3 : equippedEnergy?.includes("rare") ? 2 : 1;
      const reward = 25 * mult;
      const energyColor = equippedEnergy?.includes("legendary") ? "#ffaa00" : equippedEnergy?.includes("epic") ? "#aa00ff" : equippedEnergy?.includes("rare") ? "#ccff00" : "#ff3366";
      setTotalScore((s) => s + reward);
      addEarnedScore(reward);
      const pid = Date.now() + Math.random();
      setScorePopups((arr) => [...arr, { x: ax, y: ay, dx: SCORE_TARGET_X - ax, dy: SCORE_TARGET_Y - ay, score: reward, color: energyColor, id: pid }]);
      // removal now driven by score-popup onAnimationEnd (pause-safe)
    }
  }, [isLaserFiring, asteroidVisible, asteroidPosition, equippedEnergy]);

  useEffect(() => {
    const spawnAsteroid = () => {
      // Hold off spawning while paused; the scheduler will retry
      if (pausedRef.current) return;
      const now = Date.now();
      if (now < towerEventLockUntil) return;
      towerEventLockUntil = now + 30000;

      setAsteroidVisible(true);
      asteroidKilledRef.current = false;
      setAsteroidPosition({ x: 0, y: 0 });
      let startTime = Date.now();
      asteroidPauseAccumRef.current = 0;
      asteroidPausedRef.current = false;
      const animate = () => {
        // While paused: keep the rAF loop alive but do not advance position
        if (pausedRef.current) {
          if (!asteroidPausedRef.current) {
            asteroidPausedRef.current = true;
            asteroidPauseSinceRef.current = Date.now();
          }
          requestAnimationFrame(animate);
          return;
        }
        // On resume: bank the paused span so progress continues where it stopped
        if (asteroidPausedRef.current) {
          asteroidPauseAccumRef.current += Date.now() - asteroidPauseSinceRef.current;
          asteroidPausedRef.current = false;
        }
        const elapsed = Date.now() - startTime - asteroidPauseAccumRef.current;
        const progress = elapsed / 3056;
        if (progress >= 1) {
          setAsteroidVisible(false);

          if (!asteroidKilledRef.current) {
          recordEvent("asteroid", false);
            impactTimersRef.current.push(pt(() => {
              if (!cyberRef.current && !pausedRef.current && !showShopRef.current && !showProfileRef.current && !showGuideRef.current) setScreenShake(true);
              setAsteroidWarning(true);
              setLandingGlow({ x: asteroidFinalXRef.current, y: 480, visible: true });
              playSound('impact');
            }, 1000));
            impactTimersRef.current.push(pt(() => setScreenShake(false), 2000));
            impactTimersRef.current.push(pt(() => { setAsteroidWarning(false); setLandingGlow((g) => ({ ...g, visible: false })); }, 3500));
          }
          return;
        }
        const x = 685 * progress;
        const y = 480 * progress;
        asteroidFinalXRef.current = x;
        setAsteroidPosition({ x, y });
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

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
  }, []);
  useEffect(() => {

    const handleKey = (e: KeyboardEvent) => {
      const k = e.code;
      if (e.repeat) return;
      // Escape closes overlays regardless of focused element (buttons keep focus after click)
      if (k === 'Escape' || e.key === 'Escape') {
        setShowShop(false);
        setShowProfile(false);
        setShowGuide(false);
        if (isMenuOpenRef()) playSound('select');
        return;
      }
      const t = e.target as HTMLElement | null;
      // Text entry fields never trigger hotkeys
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const h = handlersRef.current;

      // Every game hotkey is dispatched BEFORE the BUTTON guard. After a mouse
      // click the focused button swallows un-prevented keys as a native
      // re-activation, which is why digits only worked after clicking away.
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
        if (k === 'Digit1' || k === 'Numpad1') { if (h.towerFire) h.towerFire(); }
        else if (k === 'Digit2' || k === 'Numpad2') { if (h.fire) h.fire(); }
        else if (k === 'Digit3' || k === 'Numpad3') { if (h.jump) h.jump(); }
        else if (k === 'Digit4' || k === 'Numpad4') { togglePause(); }
        else if (k === 'KeyM' || k === 'Digit5' || k === 'Numpad5') { toggleMute(); }
        else if (k === 'KeyS' || k === 'Digit6' || k === 'Numpad6') { setShowShop(true); playSound('select'); }
        else if (k === 'KeyP' || k === 'Digit7' || k === 'Numpad7') { setShowProfile(true); playSound('select'); }
        else if (k === 'KeyG' || k === 'Digit8' || k === 'Numpad8') { setShowGuide(true); playSound('select'); }
        return;
      }

      // Unknown keys keep the original focus guard
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
    const price = Number(item.price || 0);
    const cost = price * safeAmount;

    if (owned + safeAmount > 100 || totalScore < cost) return;

    setTotalScore((s) => s - cost);
    setInventory((inv) => [...inv, ...Array<string>(safeAmount).fill(String(item.id))]);
  };

  const handleBuy = (item: any) => {
    const category = getItemCategory(item);

    if (category === "consumable") {
      handleAddConsumable(item, 1);
      return;
    }

    if (totalScore >= item.price && !inventory.includes(item.id)) {
      setTotalScore((s) => s - item.price);
      setInventory((inv) => [...inv, item.id]);
      playSound('purchase');
    }
  };

  const handleEquip = (itemId: string) => {
    if (effectiveCyberStyle) {
      const lower = "";
      const isConsumable =
        lower.includes("arrow") ||
        lower.includes("armor") ||
        lower.includes("energy");

      if (!isConsumable) return;
    }
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

  const handleToggleEquipItem = (item: any) => {
    const id = String(item.id);
    if (effectiveCyberStyle) {
      const lower = String(id).toLowerCase();
      const category = String((item && item.category) || "").toLowerCase();
      const isConsumable =
        category === "consumable" ||
        lower.includes("arrow") ||
        lower.includes("armor") ||
        lower.includes("energy");

      if (!isConsumable) return;
    }
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

    if (next) {
      setEquippedBow(null);
      setEquippedHat(null);
      setEquippedAmulet(null);
    }

    playSound('select');
  };

  const handleSellItem = (item: any, amount: number, rate: number) => {
    const id = String(item.id);
    const owned = inventory.filter((x) => x === id).length;
    const sellAmount = Math.min(Math.max(1, Math.floor(Number(amount) || 1)), owned);

    if (sellAmount <= 0) return;

    const revenue = Math.floor(Number(item.price || 0) * Number(rate || 0)) * sellAmount;
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

  
  handlersRef.current.fire = handleFire;
  handlersRef.current.towerFire = handleTowerFire;
  handlersRef.current.jump = handleJump;

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
  useEffect(() => {
    if (effectiveCyberStyle) {
      setEquippedBow(null);
      setEquippedHat(null);
      setEquippedAmulet(null);
    }
  }, [effectiveCyberStyle]);

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
    try {
      const u = new URL(window.location.href);
      const trf = Number(u.searchParams.get("testRF") || 0);
      if (trf > 0) addRF(trf);
      const ti = u.searchParams.get("testItems");
      if (ti) ti.split(",").map((x) => x.trim()).filter(Boolean).forEach((id) => addItem(id, 1));
    } catch {}
    return () => { delete w.__RHRF_TEST__; };
  }, []);

if (loading) {
    return <div className="rf-loading-screen">LOADING RHRF BULLSEYE...</div>;
  }

  return (
    <div ref={gameContainerRef} tabIndex={0}  className={"scene-container" + (screenShake ? " screen-shake" : "") + (effectiveCyberStyle ? " cyber-active" : "") + (isPaused ? " rf-paused-root" : "") + ((showShop || showProfile || showGuide) ? " rf-overlay-open" : "")}>
      

      <div className="scanline-overlay" />
      <div className="vignette" />
      
      {showShop && (
        <Shop onToggleEquip={handleToggleEquipItem}  onAddConsumable={handleAddConsumable} equippedConsumable={equippedConsumable} 
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
        score={totalScore}
        onShop={() => { setShowShop(true); playSound('select'); }}
        onGuide={() => { setShowGuide(true); playSound('select'); }}
        onProfile={() => { setShowProfile(true); playSound('select'); }}
        flashColor={flashColor}
      />

<div className="rf-shake-layer">
<Scene 
        nftImageUrl={nftImageUrl}
        laserX={laserPos.x}
        laserY={laserPos.y}
        isShooting={isShooting}
        isJumping={isJumping}
        isLaserFiring={isLaserFiring}
        asteroidVisible={asteroidVisible}
        asteroidPosition={asteroidPosition}
        landingGlow={landingGlow}
        arrowProgress={arrowProgress}
        frozenLaser={shotTargetRef.current}
        stuckArrows={stuckArrows}
        scorePopups={scorePopups}
      
        arrowQualityId={shotArrowId}
        energyQualityId={towerEnergyId}
        shotPhase={shotPhase}
        bowQualityId={equippedBow}
        isFallen={isFallen}
        fallRemaining={fallRemaining}
       friendPixels={friendPixels} sidePixels={sidePixels} jumpVariant={jumpVariant} equippedArmor={equippedArmor} clothingQualityId={equippedHat} amuletQualityId={equippedAmulet} isCyberStyle={effectiveCyberStyle}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isPaused={isPaused}
        onPopupDone={(id) => setScorePopups((arr) => arr.filter((p) => p.id !== id))}
        onTogglePause={togglePause}
      />

      </div>
      {asteroidWarning && (
        <div className="rf-overlay-msg rf-msg-red rf-shake-text">
           ASTEROID REACHED THE PLANET SURFACE
        </div>
      )}

      {successMessage && (
        <div className="rf-overlay-msg rf-msg-green rf-shake-text">
           {successMessage}
        </div>
      )}


      {streakBanner && (() => {
        const g = streakGradient(streakBanner.count);
        const isFinal = streakBanner.count >= 101;
        return (
          <div
            className={`rf-overlay-msg rf-streak-msg rf-shake-text${isFinal ? " rf-streak-final" : ""}`}
            style={{
              background: `linear-gradient(90deg, ${g.from}, ${g.to}, ${g.from})`,
              ...(isFinal ? { backgroundSize: "300% 100%" } : {}),
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 0 6px ${g.glow}) drop-shadow(0 0 16px ${g.glow})`,
            }}
          >
            {isFinal && (
              <span className="rf-streak-final-icon">
                <BadgeIcon id="rare_legend" size={26} />
              </span>
            )}
            {streakBanner.text}
          </div>
        );
      })()}

      <div className="rf-bottom-row">
      <div className={`controls-row${isPaused ? " rf-paused-lock" : ""}`}>
        <button className={`fire-tower-btn${laserCooldown ? " rf-on-cd" : ""}`} disabled={laserCooldown || isLaserFiring} onClick={handleTowerFire}>
          FIRE
        </button>
        <button className="shot-btn" disabled={isFallen || shotPhase !== 'IDLE' || isJumping || isLaserFiring} onClick={handleFire}>
          SHOT
        </button>
        <button className="jump-btn" disabled={isFallen || shotPhase !== 'IDLE' || isJumping || isShooting || isLaserFiring} onClick={handleJump}>
          JUMP
        </button>
      </div>

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

      {showGuide && <Guide onClose={() => { setShowGuide(false); playSound('select'); }} />}
      
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
