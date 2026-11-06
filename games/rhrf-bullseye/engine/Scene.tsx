import { useEffect as rwaWalkUseEffect, useMemo as rwaWalkUseMemo, useState as rwaWalkUseState } from "react";
import {useState, useEffect, useRef} from "react";
import { useT, useLang } from "./i18n";
import BackgroundEvents from "./BackgroundEvents";
import NftPlanetBackground from "./planets/nft-planet/NftPlanetBackground";
import BitcoinPlanetBackground from "./planets/bitcoin-planet/BitcoinPlanetBackground";
import BitcoinTarget from "./planets/bitcoin-planet/BitcoinTarget";
import NftTarget from "./planets/nft-planet/NftTarget";
import RwaPlanetBackground from "./planets/rwa-planet/RwaPlanetBackground";
import RwaBoss from "./planets/rwa-planet/RwaBoss";
import RwaEnergyWave from "./RwaEnergyWave";
import RealNftBackground from "./planets/nft-planet/RealNftBackground";
import CyberPlanetBackground from "./planets/cyber-planet/CyberPlanetBackground";
import TargetStand from "./planets/nft-planet/TargetStand";
import BitcoinTargetStand from "./planets/bitcoin-planet/BitcoinTargetStand";
import NftTargetStand from "./planets/nft-planet/NftTargetStand";
import { PLAYER_X, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT } from "./geometry";
import React from "react";
import { getPlanetAccent, getPlanetId, getLayout, mirrorX, heroLeftX, TOWER_ANT_Y, getPlanetMainColor } from "./planets/planetRuntime";
import type { PlanetMissions } from "./missions";
import { TARGET_CX, TARGET_CY, ARROW_START_X, ARROW_START_Y, getScoreColor, DEFAULT_WEAPON_COLORS } from "./math";
import CutsceneLayer from "./CutsceneLayer";
import MonoLayer from "./MonoLayer";
import DepartOverlay from "./DepartOverlay";
import { useDepartPose } from "./departPose";
import NpcCompanion from "./NpcCompanion";
import { getDialogSkip } from "./dialogs";

interface SceneProps {
  nftImageUrl?: string | null;
  missions?: PlanetMissions;
  towerActivated?: boolean;
  laserX: number;
  laserY: number;
  towerBeamActive?: boolean;
  waveR?: number;
  towerBeamColor?: string;
  isShooting: boolean;
  isJumping: boolean;
  jumpVariant?: string;
  isLaserFiring: boolean;
  rwaIntroDone?: boolean;
  onRwaMonologueDone?: () => void;
  rwaFarewellShown?: boolean;
  onRwaIntroDone?: () => void;
  rwaFacing?: "front" | "back";
  rwaRunesGray?: boolean;
  rwaStonePhase?: "alive" | "red" | "gone" | "gray";
  rwaTowerCharged?: boolean;
  rwaStoneDamage?: number;
  rwaWavePulses?: number;
  rwaWaveKey?: number;
  rwaHeroMode?: "normal" | "side" | "stand" | "fade" | "hidden";
  rwaPortalOpen?: boolean;
  rwaPortalPhase?: "closed" | "open" | "closing";
  onEnterPortal?: () => void;
  arrowQualityId?: string | null;
  bowQualityId?: string | null;
  shotPhase?: "IDLE" | "AIMING" | "FLYING" | "RESUMING";
  energyQualityId?: string | null;
  asteroidVisible: boolean;
  asteroidPosition: { x: number; y: number };
  explosions?: Array<{id: number, x: number, y: number, particles: any[]}>;
  landingGlow?: { x: number; y: number; visible: boolean };
  explosion?: { x: number; y: number; visible: boolean };
  arrowProgress: number;
  frozenLaser?: { x: number; y: number } | null;
  stuckArrows: { x: number; y: number; qualityId?: string | null; color?: string }[];
  scorePopups: {
    x: number;
    y: number;
    score: number;
    isBullseye?: boolean;
    color?: string;
    dx?: number;
    dy?: number;
    id: number;
  }[];
  isFallen?: boolean;
  fallRemaining?: number;
  friendPixels?: [number, number][];
  sidePixels?: [number, number][] | null;
  leftPixels?: [number, number][] | null;
  backPixels?: [number, number][] | null;
  forceSidePose?: boolean;
  equippedArmor?: string | null;
  clothingQualityId?: string | null;
  amuletQualityId?: string | null;
  isCyberStyle?: boolean;
  isMetalStyle?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isPaused?: boolean;
  rfCoins: { id: number; x: number; y: number; tx: number; ty: number; size: number; amount: number }[];
  onCoinDone?: (id: number) => void;
  onPopupDone?: (id: number) => void;
  onTogglePause?: () => void;
  onToggleTabPause?: () => void;
  autoPauseEnabled?: boolean;
  depart?: { planet: string; onDone: () => void } | null;
}

function RwaHeroWalkPixels({
  staticPixels,
  walkFrames,
  walking,
  hasClothing,
}: {
  staticPixels: [number, number][];
  walkFrames: [number, number][][];
  walking: boolean;
  hasClothing: boolean;
}) {
  const [frame, setFrame] = rwaWalkUseState(0);
  const [active, setActive] = rwaWalkUseState(false);

  rwaWalkUseEffect(() => {
    if (!walking || !walkFrames.length) {
      setFrame(0);
      setActive(false);
      return;
    }

    let id = 0;
    const tick = () => {
      if ((window as any).__RHRF_IS_PAUSED__) return;
      const isWalking = (window as any).__RHRF_RWA_WALKING__ !== false;
      if (isWalking) {
        setActive(true);
        setFrame((f) => f + 1);
      } else {
        setActive(false);
        setFrame(0);
      }
    };

    const start = () => {
      if (!id) id = window.setInterval(tick, 120);
    };
    const stop = () => {
      if (id) {
        window.clearInterval(id);
        id = 0;
      }
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
      setActive(false);
      setFrame(0);
    };
  }, [walking, walkFrames]);

  const px = active && walkFrames.length ? walkFrames[frame % walkFrames.length] : staticPixels;

  return (
    <>
      {px.map(([x, y], i) => (
        <rect
          key={"rwa-fo-" + i}
          x={x * 5 - 5}
          y={y * 5 - 5}
          width={15}
          height={15}
          className="friend-outline"
        />
      ))}
      {px.map(([x, y], i) => (
        <rect
          key={"rwa-fb-" + i}
          x={x * 5}
          y={y * 5}
          width={5}
          height={5}
          className="friend-body"
        />
      ))}
      {hasClothing &&
        px.map(([x, y], i) => (
          <rect
            key={"rwa-fc-" + i}
            x={x * 5}
            y={y * 5}
            width={5}
            height={5}
            className="friend-clothing-tint"
          />
        ))}
    </>
  );
}

export default function Scene({
  depart = null,
  nftImageUrl,
  missions,
  towerActivated,
  laserX,
  laserY,
  towerBeamActive,
  waveR = -1,
  towerBeamColor = "#ccff00",
  isShooting,
  isJumping,
  jumpVariant,
  isLaserFiring,
  rwaIntroDone,
  onRwaMonologueDone,
  rwaFarewellShown,
  onRwaIntroDone,
  rwaFacing,
  rwaRunesGray,
  rwaStonePhase,
  rwaTowerCharged,
  rwaStoneDamage,
  rwaWavePulses = 0,
  rwaWaveKey = 0,
  rwaHeroMode,
  rwaPortalOpen,
  rwaPortalPhase = "closed",
  onEnterPortal,
  arrowQualityId,
  bowQualityId,
  shotPhase,
  energyQualityId,
  asteroidVisible,
  asteroidPosition,
  explosions,
  landingGlow,
  explosion,
  arrowProgress,
  frozenLaser,
  stuckArrows,
  scorePopups,
  isFallen,
  fallRemaining,
  friendPixels,
  sidePixels,
  leftPixels,
  backPixels,
  forceSidePose,
  equippedArmor,
  clothingQualityId,
  amuletQualityId,
  isCyberStyle,
  isMetalStyle,
  isMuted,
  onToggleMute,
  isPaused,
  rfCoins,
  onCoinDone,
  onPopupDone,
  onTogglePause,
  onToggleTabPause,
  autoPauseEnabled = true,
}: SceneProps) {

  const sceneRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState("0 0 960 640");
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const BW = 960, BH = 640, MAX = 20000;
    const upd = () => {
      const r = el.getBoundingClientRect();
      const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
      const ar = cw / ch, ba = BW / BH;
      let x = 0, y = 0, w = BW, h = BH;
      if (ar > ba) { h = BH; w = Math.min(MAX, BH * ar); x = (BW - w) / 2; }
      else { w = BW; h = Math.min(MAX, BW / ar); y = (BH - h) / 2; }
      setViewBox(`${x} ${y} ${w} ${h}`);
    };
    upd();
    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(upd) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", upd);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", upd); };
  }, []);

  const t = useT();
  const cyberStyle = Boolean(isCyberStyle ?? (typeof window !== 'undefined' && (window as any).__RHRF_IS_CYBER__));
  const metalStyle = Boolean(isMetalStyle && cyberStyle);
const pixelBounds = (() => {
    if (!friendPixels || friendPixels.length === 0) {
      return { minX: 0, maxX: 15, minY: 0, maxY: 15 };
    }

    const xs = friendPixels.map((point) => point[0]);
    const ys = friendPixels.map((point) => point[1]);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  })();

  const PIXEL_SIZE = 5;

  const spriteLeft = pixelBounds.minX * PIXEL_SIZE;
  const spriteRight = (pixelBounds.maxX + 1) * PIXEL_SIZE;
  const spriteTop = pixelBounds.minY * PIXEL_SIZE;
  const spriteBottom = (pixelBounds.maxY + 1) * PIXEL_SIZE;

  const spriteCenterX = (spriteLeft + spriteRight) / 2;
  const spriteCenterY = (spriteTop + spriteBottom) / 2;
  const spriteWidth = spriteRight - spriteLeft;
  const spriteHeight = spriteBottom - spriteTop;

  const fallDropY = spriteHeight / 2;
  const fallBodyCenterY = spriteCenterY + fallDropY;

  const fallTimerX = spriteCenterX;

  const fallTimerY = fallBodyCenterY - 82;
  const RARITY_COLORS: Record<string, string> = {
    rare: "#ccff00",
    epic: "#aa00ff",
    legendary: "#F7931A",
  };

  const getRarityKey = (id?: string | null) => {
    const value = String(id || "").toLowerCase();
    if (value.includes("legendary")) return "legendary";
    if (value.includes("epic")) return "epic";
    if (value.includes("rare")) return "rare";
    return null;
  };
  const isCyberLeaderboard = getPlanetId() === "cyber" && !depart;
  const isCyberLeaderboardBase = isCyberLeaderboard && !cyberStyle;
  const towerBeamX = getPlanetId() === "cyber" ? 190 : (getLayout(getPlanetId()).tower === "left" ? 140 : 860);
  const weaponBaseColor = isCyberLeaderboardBase
    ? "#ff0000"
    : DEFAULT_WEAPON_COLORS[getPlanetId()] ||
      getPlanetAccent(getPlanetId()) ||
      "#ccff00";
  const arrowColor = RARITY_COLORS[getRarityKey(arrowQualityId) || ""] || (isCyberLeaderboardBase ? "#ff0000" : "#000000");
  const laserColor = RARITY_COLORS[getRarityKey(energyQualityId) || ""] || (towerBeamColor === "cyber" ? "var(--cyber-fill, #00ffff)" : towerBeamColor) || (isCyberLeaderboardBase ? "#ff0000" : "#ccff00");
  const beamColor = towerBeamColor === "cyber" || towerBeamColor === "#d6b45a" || towerBeamColor === "#8f99a6" || metalStyle ? "var(--cyber-fill, #00ffff)" : RARITY_COLORS[getRarityKey(energyQualityId) || ""] || towerBeamColor || (isCyberLeaderboardBase ? "#ff0000" : "#ccff00");
  const bowColor = RARITY_COLORS[getRarityKey(bowQualityId) || ""] || weaponBaseColor;

  const getArmorColor = (id?: string | null) => {
    if (!id) return null;
    const val = String(id).toLowerCase();
    if (val.includes("legendary")) return "#F7931A";
    if (val.includes("epic")) return "#aa00ff";
    if (val.includes("rare")) return "#ccff00";
    return null;
  };

  const armorColor = cyberStyle ? "var(--cyber-fill, #00ffff)" : getArmorColor(equippedArmor);
  const clothingColor = RARITY_COLORS[getRarityKey(clothingQualityId) || ""] || null;
  const amuletColor = RARITY_COLORS[getRarityKey(amuletQualityId) || ""] || null;
  const clothingRarity = getRarityKey(clothingQualityId);

  const characterClass = [
    cyberStyle ? "friend-cyber" : "",
  metalStyle ? "rf-metal" : "",
    armorColor ? "armor-on" : "",
    clothingColor ? "clothing-on" : "",
    clothingRarity === "legendary" ? "clothing-legendary" : "",
    clothingRarity === "epic" ? "clothing-epic" : "",
    clothingRarity === "rare" ? "clothing-rare" : "",
  ].filter(Boolean).join(" ");

  const aimFrozen = Boolean(frozenLaser) && (shotPhase === "AIMING" || shotPhase === "FLYING");
  const aimX = aimFrozen && frozenLaser ? frozenLaser.x : laserX;
  const aimY = aimFrozen && frozenLaser ? frozenLaser.y : laserY;
  const heroSide = getLayout(getPlanetId()).hero;
  const mx = (x: number) => mirrorX(x, heroSide);
  const heroDir = heroSide === "right" ? -1 : 1;
  const ASX = mx(ARROW_START_X);

  const hitX = mx(TARGET_CX) + aimX;
  const hitY = TARGET_CY + aimY;

  const cx = ASX + (hitX - ASX) * arrowProgress;
  const cy = ARROW_START_Y + (hitY - ARROW_START_Y) * arrowProgress;
  const vx = hitX - ASX;
  const vy = hitY - ARROW_START_Y;
  const len = Math.sqrt(vx*vx + vy*vy) || 1;
  const ux = vx / len;
  const uy = vy / len;

  const tipX = cx, tipY = cy;
  const tailX = cx - ux * 40, tailY = cy - uy * 40;
  const trailX = cx - ux * 90, trailY = cy - uy * 90;

  const px = -uy, py = ux;
  const h1x = tipX, h1y = tipY;
  const h2x = tipX - ux * 10 + px * 5, h2y = tipY - uy * 10 + py * 5;
  const h3x = tipX - ux * 10 - px * 5, h3y = tipY - uy * 10 - py * 5;

  const BOW_TOP_X = mx(306.03);
  const BOW_TOP_Y = 410.11;
  const BOW_BOTTOM_X = mx(329.97);
  const BOW_BOTTOM_Y = 475.89;
  const BOW_MID_X = mx(318);
  const BOW_MID_Y = 443;

  const stringPull =
    shotPhase === "AIMING" ||
    (shotPhase === "FLYING" && arrowProgress < 0.12);

  const [cutsceneFace, setCutsceneFace] = useState<null | "crowd" | "player">(null);
  useEffect(() => {
    const on = (e: Event) => setCutsceneFace((((e as CustomEvent).detail || {}) as any).facing ?? null);
    window.addEventListener("rhrf:cutscene-face", on as EventListener);
    return () => window.removeEventListener("rhrf:cutscene-face", on as EventListener);
  }, []);
  const sidePoseRequested = Boolean(stringPull || forceSidePose || cutsceneFace === "crowd");

  const stringX = stringPull ? tailX : BOW_MID_X;
  const stringY = stringPull ? tailY : BOW_MID_Y;

  const BOW_IDLE_ANGLE = -20;
  const aimAngleRad = Math.atan2(hitY - BOW_MID_Y, Math.abs(hitX - BOW_MID_X));
  const aimAngleDeg = (aimAngleRad * 180) / Math.PI;
  const bowAngle = (shotPhase === "IDLE" || shotPhase === "RESUMING") ? BOW_IDLE_ANGLE : aimAngleDeg;

  const rotatePoint = (x: number, y: number, cx: number, cy: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  };

  const BOW_ARM_HALF = 35;
  const bowRad = (bowAngle * Math.PI) / 180;
  const rotatedBowTop = {
    x: BOW_MID_X + heroDir * BOW_ARM_HALF * Math.sin(bowRad),
    y: BOW_MID_Y - BOW_ARM_HALF * Math.cos(bowRad),
  };
  const rotatedBowBottom = {
    x: BOW_MID_X - heroDir * BOW_ARM_HALF * Math.sin(bowRad),
    y: BOW_MID_Y + BOW_ARM_HALF * Math.cos(bowRad),
  };

  const getPlanet = () => {
    try {
      const w = window as any;
      if (w.__RHRF_PLANET__) return String(w.__RHRF_PLANET__);
      const q = new URLSearchParams(window.location.search).get("planet");
      if (q) return q;
      return localStorage.getItem("rf-planet") || "cyber";
    } catch {
      return "cyber";
    }
  };
  const isStable = getPlanet() === "stable";
  const isRealNft = getPlanet() === "nft";
  const isBitcoin = getPlanet() === "bitcoin";
  const isRwa = getPlanet() === "rwa";
  const hasCutscene = isStable || isRealNft || isBitcoin;
  const [combatBlocked, setCombatBlocked] = useState(hasCutscene);
  const planetIdForCombatReset = getPlanet();
  useEffect(() => {
    setCombatBlocked(
      planetIdForCombatReset === "stable" ||
      planetIdForCombatReset === "nft" ||
      planetIdForCombatReset === "bitcoin"
    );
  }, [planetIdForCombatReset]);
  const rwaWalkTimerRef = useRef(0);
  const departDx = depart ? ((getLayout(getPlanet()).tower === "left" ? 140 : 860) - (heroLeftX(getPlanet()) + 40)) : 0;
  const dp = useDepartPose(Boolean(depart), departDx, depart?.onDone);
  const rwaPortalEntering = isRwa && (rwaHeroMode === "side" || rwaHeroMode === "stand" || rwaHeroMode === "fade");
  const rwaSidePose = isRwa && rwaHeroMode === "side";
  const sidePixelsAvailable = Boolean(sidePixels && sidePixels.length > 0);
  const useSidePixels = Boolean((sidePoseRequested || rwaSidePose) && sidePixelsAvailable);
  const facePixels = (f: "down" | "left" | "right" | "up"): [number, number][] => {
    const front = friendPixels ?? [];
    if (f === "down") return front;
    if (f === "right") return sidePixels && sidePixels.length ? (sidePixels as [number, number][]) : front;
    if (f === "left") return leftPixels && leftPixels.length ? (leftPixels as [number, number][]) : (sidePixels && sidePixels.length ? (sidePixels as [number, number][]) : front);
    return backPixels && backPixels.length ? (backPixels as [number, number][]) : (sidePixels && sidePixels.length ? (sidePixels as [number, number][]) : front);
  };
  const activePixels: [number, number][] = depart && dp ? facePixels(dp.face) : useSidePixels ? (sidePixels as [number, number][]) : (friendPixels ?? []);

  const computeCenterOffset = (pts: [number, number][]): { x: number; y: number } => {
    if (!pts || pts.length === 0 || !friendPixels || friendPixels.length === 0) {
      return { x: 0, y: 0 };
    }

    const bounds = (pts: [number, number][]) => {
      const xs = pts.map((pt) => pt[0]);
      const ys = pts.map((pt) => pt[1]);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    };

    const fb = bounds(friendPixels);
    const sb = bounds(pts);

    const fcx = ((fb.minX + fb.maxX + 1) / 2) * 5;
    const fcy = ((fb.minY + fb.maxY + 1) / 2) * 5;
    const scx = ((sb.minX + sb.maxX + 1) / 2) * 5;
    const scy = ((sb.minY + sb.maxY + 1) / 2) * 5;

    return { x: fcx - scx, y: fcy - scy };
  };
  const renderOffset = depart && dp
    ? computeCenterOffset(activePixels)
    : useSidePixels ? computeCenterOffset(sidePixels as [number, number][]) : { x: 0, y: 0 };

  const rwaPortalDeltaX = TARGET_CX - PLAYER_X - spriteCenterX;
  const rwaWalkDur = Math.min(5200, Math.max(900, Math.abs(rwaPortalDeltaX) * 7));
  const rwaWalkDelay = 700;
  const heroCenterDeltaX = rwaPortalEntering ? rwaPortalDeltaX : 0;
  const heroShiftX = renderOffset.x + heroCenterDeltaX;

  const cutscenePlanet = isStable ? "stable" : isRealNft ? "nft" : "bitcoin";
  const [instantResetPlanet, setInstantResetPlanet] = useState<string | null>(null);

  useEffect(() => {
    setInstantResetPlanet(cutscenePlanet);
    const t = window.setTimeout(() => setInstantResetPlanet(null), 90);
    return () => window.clearTimeout(t);
  }, [cutscenePlanet]);
  const heroShiftY = renderOffset.y;
  const heroOpacity = isRwa && (rwaHeroMode === "fade" || rwaHeroMode === "hidden") ? 0 : 1;
  const heroTransition =
    isRwa && rwaHeroMode === "side"
      ? `transform ${rwaWalkDur}ms linear ${rwaWalkDelay}ms`
      : isRwa && (rwaHeroMode === "fade" || rwaHeroMode === "hidden")
      ? "opacity 2.25s linear"
      : undefined;
  const heroScaleX = (sidePoseRequested || rwaSidePose) && !sidePixelsAvailable ? 0.55 : 1;
  const rwaWalkFrames = rwaWalkUseMemo(() => {
    if (!isRwa || rwaHeroMode !== "side") return [] as [number, number][][];
    const raw = ((window as any).__RHRF_HERO_WALK_FRAMES__?.right ?? []) as [number, number][][];
    return Array.isArray(raw) ? raw.filter((p) => Array.isArray(p) && p.length > 0) : [];
  }, [isRwa, rwaHeroMode]);

  useEffect(() => {
    if (!isRwa) return;

    if (rwaHeroMode === "side") {
      window.clearTimeout(rwaWalkTimerRef.current);
      (window as any).__RHRF_RWA_WALKING__ = false;
      rwaWalkTimerRef.current = window.setTimeout(() => {
        (window as any).__RHRF_RWA_WALKING__ = true;
        rwaWalkTimerRef.current = window.setTimeout(() => {
          (window as any).__RHRF_RWA_WALKING__ = false;
          window.dispatchEvent(new CustomEvent("rhrf:rwa-portal-walk-done"));
        }, rwaWalkDur);
      }, rwaWalkDelay);
      return;
    }

    (window as any).__RHRF_RWA_WALKING__ = false;
    window.clearTimeout(rwaWalkTimerRef.current);
  }, [isRwa, rwaHeroMode, rwaWalkDur, rwaWalkDelay]);

  useEffect(() => () => {
    window.clearTimeout(rwaWalkTimerRef.current);
    (window as any).__RHRF_RWA_WALKING__ = false;
  }, []);

  const rwaBeamX1 = 140;
  const rwaBeamY1 = 330;
  const rwaBeamDx = TARGET_CX - rwaBeamX1;
  const rwaBeamDy = TARGET_CY - rwaBeamY1;
  const rwaBeamLen = Math.hypot(rwaBeamDx, rwaBeamDy);
  const rwaBeamAngle = (Math.atan2(rwaBeamDy, rwaBeamDx) * 180) / Math.PI;

  const planetId = getPlanet();
  const crosshairColor = amuletColor || weaponBaseColor;
  return (
    <svg id="rhrf-scene-svg" ref={sceneRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className={`${cyberStyle || isRwa ? "rf-cyber-root" : ""}${metalStyle ? " rf-metal-root" : ""}${isStable ? " rf-stable-root" : ""}`.trim() || undefined} style={{ color: arrowColor, ["--rf-arrow-color" as any]: arrowColor, ["--rf-laser-color" as any]: laserColor } as any}>
      <defs>
        <linearGradient id="skyGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
          <stop offset="0%" stopColor="#0a0020"/><stop offset="30%" stopColor="#1a0040"/>
          <stop offset="60%" stopColor="#0d0030"/><stop offset="100%" stopColor="#050015"/>
        </linearGradient>
        <linearGradient id="groundGrad" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="700">
          <stop offset="0%" stopColor="#1a0044"/><stop offset="50%" stopColor="#0d0022"/>
          <stop offset="100%" stopColor="#050010"/>
        </linearGradient>
        <filter id="neonGlowCyan"><feGaussianBlur stdDeviation="4" result="b1"/><feGaussianBlur stdDeviation="8" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowWhite" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="wblur"/>
          <feFlood floodColor="#ffffff" floodOpacity="0.92" result="wglow"/>
          <feComposite in="wglow" in2="wblur" operator="in" result="wcolored"/>
          <feMerge>
            <feMergeNode in="wcolored"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="neonGlowPink"><feGaussianBlur stdDeviation="3" result="b1"/><feGaussianBlur stdDeviation="7" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowYellow"><feGaussianBlur stdDeviation="5" result="b1"/><feGaussianBlur stdDeviation="12" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="softGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="wideGlowYellow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="4" result="w1"/><feGaussianBlur stdDeviation="9" result="w2"/><feMerge><feMergeNode in="w2"/><feMergeNode in="w1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="beamSoft" x="-140%" y="-20%" width="380%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="sb" />
          <feComponentTransfer in="sb" result="sba"><feFuncA type="linear" slope="0.72" /></feComponentTransfer>
          <feMerge><feMergeNode in="sba" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <filter id="bigGlow"><feGaussianBlur stdDeviation="20" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffcc"/><stop offset="50%" stopColor="#ffee66"/><stop offset="100%" stopColor="#F7931A"/>
        </radialGradient>
      <radialGradient id="moonGradRed" cx="42%" cy="38%" r="68%">
        <stop offset="0%" stopColor="#5c0a08"/>
        <stop offset="38%" stopColor="#8b170e"/>
        <stop offset="72%" stopColor="#c03e1c"/>
        <stop offset="92%" stopColor="#e26a29"/>
        <stop offset="100%" stopColor="#fb8b35"/>
      </radialGradient>
      <filter id="neonGlowRed" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feFlood floodColor="#c03e1c" floodOpacity="0.85" result="c"/>
        <feComposite in="c" in2="b" operator="in" result="g"/>
        <feMerge>
          <feMergeNode in="g"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
        <filter id="bowGlowPinkTight" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.35" result="b"/>
          <feComponentTransfer in="b" result="bo"><feFuncA type="linear" slope="0.72"/></feComponentTransfer>
          <feMerge><feMergeNode in="bo"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bowGlowCyanTight" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b"/>
          <feComponentTransfer in="b" result="bo"><feFuncA type="linear" slope="0.68"/></feComponentTransfer>
          <feMerge><feMergeNode in="bo"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bowStringGlowTight" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.05" result="b"/>
          <feComponentTransfer in="b" result="bo"><feFuncA type="linear" slope="0.58"/></feComponentTransfer>
          <feMerge><feMergeNode in="bo"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="treeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a0050"/><stop offset="50%" stopColor="#1a0035"/><stop offset="100%" stopColor="#2a0050"/>
        </linearGradient>
      <clipPath id="rfHorizonClip"><rect x="-20000" y="-20000" width="60000" height="20480" /></clipPath>
</defs>

      {isStable && <NftPlanetBackground towerActivated={towerActivated} missions={missions} />}
      {isRealNft && <RealNftBackground viewBox={viewBox} missions={missions} towerActivated={towerActivated} />}
      {isBitcoin && <BitcoinPlanetBackground missions={missions} towerActivated={towerActivated} />}
      {isRwa && <RwaPlanetBackground viewBox={viewBox} missions={missions} towerActivated={towerActivated} rwaHeroMode={rwaHeroMode} rwaStonePhase={rwaStonePhase} />}
      {!isStable && !isRealNft && !isBitcoin && !isRwa && <CyberPlanetBackground viewBox={viewBox} />}

<g clipPath="url(#rfHorizonClip)">
      {isBitcoin && <BitcoinTargetStand />}
      {isRealNft && <NftTargetStand />}
      {asteroidVisible && (() => {
        const astMain = isRealNft ? "#aa00ff" : isBitcoin ? "#F7931A" : isRwa ? "#00ffff" : isStable ? "#C7E36C" : "#8B4513";
        const astBody = isRealNft ? "#8a00cc" : isBitcoin ? "#c46a00" : isRwa ? "#0a8f8f" : isStable ? "#C7E36C" : "#A0522D";
        const astCrater = isRealNft ? "#4a0070" : isBitcoin ? "#7a3d00" : isRwa ? "#063a3a" : isStable ? "#C7E36C" : "#654321";
        return (
          <g transform={`translate(${asteroidPosition.x}, ${asteroidPosition.y})`}>
            <circle r="20" fill={astMain} filter="url(#softGlow)" />
            <circle r="15" fill={astBody} />
            <circle cx="-5" cy="-5" r="3" fill={astCrater} />
            <circle cx="7" cy="3" r="2" fill={astCrater} />
          </g>
        );
      })()}
{landingGlow?.visible && (
        <g clipPath="url(#rfHorizonClip)">
          <ellipse
            className="rf-landing-glow-wide"
            cx={500}
            cy={506}
            rx={620}
            ry={28}
            fill={isStable ? "#314012" : isRealNft ? "#5a0080" : isRwa ? "#063a3a" : "#ff2bd6"}
          />
          <ellipse
            className="rf-landing-glow-mid"
            cx={landingGlow.x}
            cy={502}
            rx={430}
            ry={36}
            fill={isStable ? "#C7E36C" : isBitcoin ? "#F7931A" : isRwa ? "#00ffff" : "#ff1493"}
          />
          <ellipse
            className="rf-landing-glow"
            cx={landingGlow.x}
            cy={496}
            rx={130}
            ry={44}
            fill={isStable ? "#C7E36C" : isRealNft ? "#cc77ff" : isBitcoin ? "#ffc36b" : isRwa ? "#8bfaff" : "#ff6ae0"}
          />
        </g>
      )}
            </g>
            <g>
      <BackgroundEvents />

      {!isRwa && (
        <g className="rf-target-rings" transform={`translate(${mx(TARGET_CX)}, 360)`} pointerEvents="none">
          <defs>
            <radialGradient id="rfBullseyeCoreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff">
                <animate
                  attributeName="stop-color"
                  values="#00ffff;#ffffff;#aa00ff;#00ffff"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="55%" stopColor="#00ffff">
                <animate
                  attributeName="stop-color"
                  values="#00ffff;#aa00ff;#ffffff;#00ffff"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#063a3a" />
            </radialGradient>
          </defs>

          <circle r="81" fill="#050015" stroke="#1a0030" strokeWidth="1" />
          <circle r="68.85" fill="none" stroke="#ccff00" strokeWidth="24.3" opacity="0.88" />
          <circle r="44.55" fill="none" stroke="#aa00ff" strokeWidth="24.3" opacity="0.92" />
          <circle r="20.25" fill="none" stroke="#F7931A" strokeWidth="24.3" opacity="0.97" />
          <circle r="8.1"  fill="none" stroke="#000000" strokeWidth="2.5" opacity="0.85" />
          <circle r="32.4" fill="none" stroke="#000000" strokeWidth="2.5" opacity="0.85" />
          <circle r="56.7" fill="none" stroke="#000000" strokeWidth="2.5" opacity="0.85" />
          {isStable && (
        <g transform="scale(0.786944) translate(-96.9147, -97.0001)" opacity="0.22" fill="#000000" fillRule="evenodd" stroke="#000000" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round">
          <path d="M168.887 102.452C166.099 139.698 134.987 169.051 97.0161 169.051C57.2109 169.051 24.9424 136.793 24.9424 97.0002C24.9424 57.2075 57.2109 24.9492 97.0161 24.9492C134.924 24.9492 165.997 54.2062 168.873 91.3651H134.414C141.936 74.7437 142.391 59.6421 134.165 52.7419C122.017 42.5517 95.537 54.1062 75.0201 78.5496C54.5032 102.993 47.7189 131.069 59.8668 141.259C72.0148 151.449 98.4949 139.895 119.012 115.451C122.588 111.191 125.747 106.82 128.461 102.452H102.43V109.924L120.121 117.025L131.251 102.452H168.887Z" vectorEffect="non-scaling-stroke" />
        </g>
      )}

          <circle r="8.1" fill="url(#rfBullseyeCoreGrad)" filter={metalStyle ? "none" : "url(#neonGlowPink)"} />
          <circle r="2.8" fill="#ffffff" opacity="0.92">
            {!metalStyle && <animate attributeName="opacity" values="0.45;1;0.45" dur="0.9s" repeatCount="indefinite" />}
          </circle>
        </g>
      )}
      {isStable && <TargetStand />}
      {isRealNft && <NftTarget />}
      {isBitcoin && (
        <g transform={`translate(${mx(TARGET_CX)}, ${TARGET_CY})`} pointerEvents="none">
          <BitcoinTarget />
        </g>
      )}
      {isRwa && <RwaBoss layer="stone" facing={rwaFacing} cyberStyle={cyberStyle} forcedGray={rwaRunesGray} phase={rwaStonePhase} towerCharged={rwaTowerCharged} damage={rwaStoneDamage} />}


      {!depart && (
      <g transform={`translate(${heroLeftX(getPlanetId())}, ${PLAYER_Y})`}>
        <g
          transform={undefined}
          className={[characterClass, isFallen ? "rf-archer-fallen" : ""].filter(Boolean).join(" ") || undefined}
          style={{
            ["--armor-color" as any]: armorColor || undefined,
            ["--clothing-color" as any]: clothingColor || undefined,
            ["--cx" as any]: `${spriteCenterX}px`,
            ["--cy" as any]: `${spriteCenterY}px`,
            ["--drop" as any]: `${fallDropY}px`,
          }}
        >
          {activePixels && activePixels.length > 0 ? (
            <g
              className={`nft-archer ${isJumping && !isFallen ? `nft-archer-jumping jump-${jumpVariant || "spin-360"}` : ""}${isPaused ? " rf-archer-paused" : ""}`}
              shapeRendering="crispEdges"
              style={{ transformBox: "fill-box", transformOrigin: "center", transform: `translate(${heroShiftX}px, ${heroShiftY}px) scaleX(${depart && dp ? 1 : heroDir * heroScaleX})`, opacity: depart && dp ? dp.op : heroOpacity, transition: instantResetPlanet ? "none" : heroTransition, ["--jump-offset-x" as any]: `${heroShiftX}px`, ["--jump-offset-y" as any]: `${heroShiftY}px`, ["--jump-flip" as any]: String(depart && dp ? 1 : heroDir * heroScaleX) } as any}>
              {isRwa && rwaSidePose && rwaWalkFrames.length > 0 ? (
                <RwaHeroWalkPixels
                  staticPixels={activePixels}
                  walkFrames={rwaWalkFrames}
                  walking={rwaHeroMode === "side"}
                  hasClothing={Boolean(clothingColor)}
                />
              ) : (
                <>
                  {activePixels.map(([x, y], i) => (
                    <rect
                      key={"fo-" + i}
                      x={x * 5 - 5}
                      y={y * 5 - 5}
                      width={15}
                      height={15}
                      className="friend-outline"
                    />
                  ))}
                  {activePixels.map(([x, y], i) => (
                    <rect
                      key={"fb-" + i}
                      x={x * 5}
                      y={y * 5}
                      width={5}
                      height={5}
                      className="friend-body"
                    />
                  ))}

                  {clothingColor &&
                    activePixels.map(([x, y], i) => (
                      <rect
                        key={"fc-" + i}
                        x={x * 5}
                        y={y * 5}
                        width={5}
                        height={5}
                        className="friend-clothing-tint"
                      />
                    ))}
                </>
              )}
            </g>
          ) : nftImageUrl ? (
            <image
              href={nftImageUrl}
              x="0"
              y="0"
              width={PLAYER_WIDTH}
              height={PLAYER_HEIGHT}
              className={`nft-archer ${isJumping && !isFallen ? `nft-archer-jumping jump-${jumpVariant || "spin-360"}` : ""}${isPaused ? " rf-archer-paused" : ""}`}
            />
          ) : null}
        </g>

                {isFallen && (
          <g className="rf-fall-timer-glow" transform={`translate(${fallTimerX}, ${fallTimerY})`} pointerEvents="none">
            <rect
              x="-24"
              y="-24"
              width="48"
              height="34"
              rx="8"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="24"
              fontWeight="bold"
              fill="#ffffff"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.6"
              paintOrder="stroke fill markers"
            >
              {fallRemaining ?? 0}
            </text>
          </g>
        )}
      </g>
      )}

      {!depart && !towerActivated && !combatBlocked && !isJumping && !isFallen && !(isRwa && (!rwaIntroDone || rwaPortalOpen || rwaPortalEntering || rwaStonePhase !== "alive")) && (
        <g className="rf-bow-group" style={{ transform: `translate(${heroShiftX}px, ${heroShiftY}px)`, opacity: heroOpacity, transition: instantResetPlanet ? "none" : heroTransition } as any}>
          <g className={`${cyberStyle ? "friend-cyber" : ""}${metalStyle ? " rf-metal" : ""}${!cyberStyle && bowColor === "#000000" ? " rf-entity-dark" : ""}`.trim() || undefined} transform={`translate(${BOW_MID_X}, ${BOW_MID_Y}) scale(${heroDir},1) rotate(${bowAngle})`}>
            <path d="M 0,-35 Q 15,-20 15,0 Q 15,20 0,35" fill="none" stroke={isCyberLeaderboardBase && !bowQualityId ? "#ff0000" : cyberStyle ? "var(--cyber-fill)" : bowColor} strokeWidth="3.4" filter={(isCyberLeaderboardBase && !bowQualityId) ? "none" : (isRwa && cyberStyle) ? "url(#bowGlowCyanTight)" : "url(#bowGlowPinkTight)"}/>
          </g>
          <polyline
            className={`bow-string ${cyberStyle ? "friend-cyber" : ""}${metalStyle ? " rf-metal" : ""}${!cyberStyle && bowColor === "#000000" ? " rf-entity-dark" : ""}`}
            points={`${rotatedBowTop.x},${rotatedBowTop.y} ${stringX},${stringY} ${rotatedBowBottom.x},${rotatedBowBottom.y}`}
            fill="none"
            stroke={isCyberLeaderboardBase && !bowQualityId ? "#ff0000" : cyberStyle ? "var(--cyber-fill)" : bowColor}
            strokeWidth="2.0"
            filter={(isCyberLeaderboardBase && !bowQualityId) ? "none" : "url(#bowStringGlowTight)"}
            opacity="1"
          />
        </g>
      )}
      {isRwa && rwaWavePulses > 0 && (
        <RwaEnergyWave
          key={`rwa-wave-${rwaWaveKey}`}
          pulses={rwaWavePulses}
          waveKey={rwaWaveKey}
          isPaused={isPaused}
          isJumping={isJumping}
          isFallen={isFallen}
        />
      )}

      {isRwa && <RwaBoss layer="trim" facing={rwaFacing} cyberStyle={cyberStyle} forcedGray={rwaRunesGray} phase={rwaStonePhase} towerCharged={rwaTowerCharged} damage={rwaStoneDamage} />}
      {!depart && !towerActivated && !combatBlocked && !(isRwa && (!rwaIntroDone || rwaPortalOpen || rwaStonePhase !== "alive")) && (<g className={`rf-crosshair-group ${cyberStyle ? "friend-cyber rf-laser-cyber" : ""}${metalStyle ? " rf-metal" : ""}${!cyberStyle && crosshairColor === "#000000" ? " rf-entity-dark" : ""}`.trim()} transform={`translate(${mx(TARGET_CX) + aimX}, ${TARGET_CY + aimY})`}>
        <circle cx="0" cy="0" r="10" fill="none" stroke={crosshairColor} strokeWidth="1.5" filter="url(#neonGlowPink)"/>
        <circle cx="0" cy="0" r="2" fill={crosshairColor} filter="url(#neonGlowPink)"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke={crosshairColor} strokeWidth="1" filter="url(#neonGlowPink)"/>
        <line x1="0" y1="-14" x2="0" y2="14" stroke={crosshairColor} strokeWidth="1" filter="url(#neonGlowPink)"/>
      </g>)}
{isShooting && !(isRwa && (rwaPortalOpen || rwaStonePhase !== "alive")) && (
        <g className={`${cyberStyle ? "rf-laser-cyber" : ""}${metalStyle ? " rf-metal" : ""}${!cyberStyle && arrowColor === "#000000" ? " rf-entity-dark" : ""}`.trim() || undefined}>
          <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke={arrowColor} strokeWidth="2.5" filter="url(#neonGlowCyan)"/>
          <polygon points={`${h1x},${h1y} ${h2x},${h2y} ${h3x},${h3y}`} fill={arrowColor} filter="url(#neonGlowYellow)"/>
          <line x1={trailX} y1={trailY} x2={tailX} y2={tailY} stroke={arrowColor} strokeWidth="1" opacity="0.4" filter="url(#softGlow)" strokeDasharray="4,4"/>
        </g>
      )}
{explosion?.visible && (
<g transform={`translate(${explosion.x}, ${explosion.y})`}>
<circle r="25" fill="#F7931A" opacity="0.8" filter="url(#bigGlow)">
<animate attributeName="r" values="25;45;0" dur="1s" fill="freeze"/>
<animate attributeName="opacity" values="0.8;0.4;0" dur="1s" fill="freeze"/>
</circle>
<circle r="15" fill="#ff3300" opacity="0.9">
<animate attributeName="r" values="15;30;0" dur="0.8s" fill="freeze"/>
<animate attributeName="opacity" values="0.9;0.5;0" dur="0.8s" fill="freeze"/>
</circle>
</g>
)}
{stuckArrows.map((a, i) => {
          const svx = a.x - ASX, svy = a.y - ARROW_START_Y;
          const slen = Math.sqrt(svx * svx + svy * svy) || 1;
          const sux = svx / slen, suy = svy / slen;
          const spx = -suy, spy = sux;
          const tx = a.x, ty = a.y;
          const tailX2 = tx - sux * 40, tailY2 = ty - suy * 40;
          const h2x2 = tx - sux * 10 + spx * 5, h2y2 = ty - suy * 10 + spy * 5;
          const h3x2 = tx - sux * 10 - spx * 5, h3y2 = ty - suy * 10 - spy * 5;
          const col = RARITY_COLORS[getRarityKey(a.qualityId) || ""] || a.color || arrowColor;
          return (
            <g key={`rf-stuck-${i}`} className={`rf-stuck-force${cyberStyle ? " rf-laser-cyber" : ""}${metalStyle ? " rf-metal" : ""}${!cyberStyle && col === "#000000" ? " rf-entity-dark" : ""}`} style={{ pointerEvents: "none" }}>
              <line x1={tailX2} y1={tailY2} x2={tx} y2={ty} stroke={col} strokeWidth="2.5" filter="url(#neonGlowCyan)" />
              <polygon points={`${tx},${ty} ${h2x2},${h2y2} ${h3x2},${h3y2}`} fill={col} filter="url(#neonGlowYellow)" />
            </g>
          );
        })}

</g>

            {scorePopups.map((popup) => {
        const color = popup.color || getScoreColor(popup.score);
        const cyberPopup = color === "cyber";
        const popupColor = cyberPopup ? "var(--cyber-fill, #00ffff)" : color;

        return (
          <g key={popup.id} transform={`translate(${popup.x}, ${popup.y})`}>
            <g
              className={`score-popup ${cyberPopup ? "rf-score-popup-cyber" : ""}${isPaused ? " rf-popup-paused" : ""}${(popup as any).swoosh ? " rf-score-popup-swoosh" : ""}`}
              style={{ ["--dx" as any]: `${popup.dx ?? -238}px`, ["--dy" as any]: `${popup.dy ?? -200}px`, ...(((popup as any).swoosh ? { ["--sx" as any]: `${(popup as any).sx ?? -25}px`, ["--sy" as any]: `${(popup as any).sy ?? 160}px` } : {}) as any) } as any}
              onAnimationEnd={(e) => { if (e.currentTarget === e.target) onPopupDone?.(popup.id); }}
            >
              <rect
                x="-35"
                y="-22"
                width="70"
                height="32"
                rx="4"
                fill="#0a001488"
                strokeWidth="1.5"
                style={{ stroke: popupColor }}
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="22"
                fontWeight="bold"
                style={{ fill: popupColor }}
                filter={isRwa ? "url(#neonGlowCyan)" : cyberPopup ? "url(#neonGlowPink)" : "url(#neonGlowYellow)"}
              >
                {popup.isBullseye ? `+${popup.score}!` : `+${popup.score}`}
              </text>
            </g>
          </g>
        );
      })}

            {rfCoins.map((coin) => (
        <g key={coin.id} transform={`translate(${coin.x}, ${coin.y})`}>
          <g
            className={`rf-svg-coin${isPaused ? " rf-popup-paused" : ""}`}
            style={{ ["--dx" as any]: `${coin.tx - coin.x}px`, ["--dy" as any]: `${coin.ty - coin.y}px` }}
            onAnimationEnd={(e) => { if (e.currentTarget === e.target) onCoinDone?.(coin.id); }}
          >
            <g transform={`scale(${coin.size / 130})`}>
              <g shapeRendering="crispEdges">
                <path
                  d="M-28-58H28V-52H40V-42H50V-28H56V28H50V42H40V52H28V58H-28V52H-40V42H-50V28H-56V-28H-50V-42H-40V-52H-28Z"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="5"
                />
                <path
                  d="M-28-58H28V-52H40V-42H50V-28H56V28H50V42H40V52H28V58H-28V52H-40V42H-50V28H-56V-28H-50V-42H-40V-52H-28Z"
                  transform="scale(.85)"
                  fill="#000"
                />
                <path
                  d="M-24-43H24M-43-22V22M43-22V22M-24 43H24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <g transform="translate(-36 -36) scale(9)">
                  <rect width="8" height="8" fill="#000" />
                  <path
                    d="M1 1h1v1h-1zM2 1h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM1 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM1 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z"
                    fill="#fff"
                  />
                </g>
                <rect x="-36" y="-40" width="6" height="6" fill="#ccff00" />
              </g>
            </g>
          </g>
        </g>
      ))}

{waveR >= 0 && !isRwa && (() => {
        const wx = towerBeamX;
        const wop = Math.max(0, 1 - waveR / 1700);
        const waveColor = beamColor;
        return (
          <g pointerEvents="none" className={metalStyle ? "friend-cyber rf-metal" : undefined}>
            <circle cx={wx} cy={TOWER_ANT_Y} r={waveR} fill="none" strokeWidth="7" opacity={wop * 0.92} style={{ stroke: waveColor }} />
            <circle cx={wx} cy={TOWER_ANT_Y} r={waveR + 4.5} fill="none" stroke="#fff" strokeWidth="2" opacity={wop * 0.85} />
            <circle cx={wx} cy={TOWER_ANT_Y} r={Math.max(0, waveR - 4.5)} fill="none" stroke="#fff" strokeWidth="2" opacity={wop * 0.6} />
          </g>
        );
      })()}
      {!isRwa && towerBeamActive && (() => {
        const bx = towerBeamX;
        const TIP = TOWER_ANT_Y;
        const OVER = isRwa ? 1200 : 0;
        const cyberFill = "var(--cyber-fill, #00ffff)";
        const layers = isRwa
          ? [{ w: 34, o: 0.16, c: cyberFill }, { w: 22, o: 0.30, c: "#ffffff" }, { w: 12, o: 0.58, c: "#ffffff" }, { w: 6, o: 0.95, c: cyberFill }]
          : [{ w: 34, o: 0.16, c: beamColor }, { w: 22, o: 0.30, c: "#ffffff" }, { w: 12, o: 0.58, c: "#ffffff" }, { w: 6, o: 0.95, c: beamColor }];
        return (
          <g pointerEvents="none" filter={metalStyle ? "none" : "url(#beamSoft)"} className={metalStyle ? "friend-cyber rf-metal" : undefined}>
            {layers.map((b, i) => (
              <rect key={i} className="rf-tower-beam-rect" x={bx - b.w / 2} y={-OVER} width={b.w} height={TIP + OVER} opacity={b.o} style={{ fill: b.c, transformBox: "fill-box", transformOrigin: "center bottom" } as any} />
            ))}
          </g>
        );
      })()}
      {isLaserFiring && !isRwa && (
        <g className={metalStyle ? "friend-cyber rf-metal" : undefined}>
          <rect
            x={towerBeamX - 5}
            y={(isStable || isRealNft || isBitcoin || isCyberLeaderboard) ? 95 : 115}
            width="10"
            height={(isStable || isRealNft || isBitcoin || isCyberLeaderboard) ? 190 : 200}
            style={{ fill: beamColor, stroke: beamColor }}
            filter={metalStyle ? "none" : "url(#neonGlowPink)"}
            className="laser-beam"
          />
        </g>
      )}
      {isRwa && (isLaserFiring || towerBeamActive || rwaStonePhase === "red") && (
        <g
          className="rf-laser-cyber"
          transform={`translate(${rwaBeamX1}, ${rwaBeamY1}) rotate(${rwaBeamAngle})`}
          filter="url(#neonGlowCyan)"
          pointerEvents="none"
        >
          <rect
            x="0"
            y="-10"
            width={rwaBeamLen}
            height="20"
            rx="10"
            className="rf-cyber-beam-rect"
            style={{ fill: "var(--cyber-fill, #00ffff)" }}
          />
          <rect
            x="4"
            y="-3"
            width={Math.max(0, rwaBeamLen - 8)}
            height="6"
            rx="3"
            className="rf-cyber-core-rect"
            style={{ fill: "#ffffff", opacity: 0.82 }}
          />
          <circle cx="0" cy="0" r="13" style={{ fill: "var(--cyber-fill, #00ffff)" }} opacity="0.5" />
          <circle cx={rwaBeamLen} cy="0" r="16" style={{ fill: "var(--cyber-fill, #00ffff)" }} opacity="0.55" />
          <circle cx={rwaBeamLen} cy="0" r="6" style={{ fill: "#ffffff" }} opacity="0.9" />
        </g>
      )}
            {isRwa && (rwaPortalPhase === "open" || rwaPortalPhase === "closing") && (
        <g
          pointerEvents={rwaPortalPhase === "open" ? "auto" : "none"}
          className={`rf-laser-cyber rf-rwa-portal rf-rwa-portal-${rwaPortalPhase}`}
          style={{ cursor: rwaPortalPhase === "open" ? "pointer" : "default" } as any}
          onClick={() => {
            if (rwaPortalPhase === "open") onEnterPortal?.();
          }}
        >
          <ellipse
            className="rf-rwa-portal-ellipse"
            cx={TARGET_CX}
            cy={PLAYER_Y + PLAYER_HEIGHT}
            rx="72"
            ry="18"
            fill="var(--cyber-fill, #00ffff)"
            opacity="0.35"
            filter="url(#neonGlowCyan)"
          />
          <g className="rf-rwa-portal-beam">
            <rect
              x={TARGET_CX - 48}
              y="88"
              width="96"
              height={PLAYER_Y + PLAYER_HEIGHT - 88}
              fill="var(--cyber-fill, #00ffff)"
              opacity="0.22"
              filter="url(#neonGlowCyan)"
              className="laser-beam"
            />
            <rect
              x={TARGET_CX - 22}
              y="98"
              width="44"
              height={PLAYER_Y + PLAYER_HEIGHT - 98}
              fill="var(--cyber-fill, #00ffff)"
              opacity="0.42"
              filter="url(#neonGlowCyan)"
            />
            <rect
              x={TARGET_CX - 7}
              y="108"
              width="14"
              height={PLAYER_Y + PLAYER_HEIGHT - 108}
              fill="#ffffff"
              opacity="0.78"
              filter="url(#neonGlowCyan)"
              style={{ fill: "#ffffff" }}
            />
          </g>
        </g>
      )}

      {(explosions || []).map(exp => (
        <g key={exp.id} transform={`translate(${exp.x}, ${exp.y})`}>
          {exp.particles.map((p, i) => {
          const col = beamColor;
          return (
            <rect
              key={i}
              width={p.size}
              height={p.size}
              x={-p.size / 2}
              y={-p.size / 2}
              className="rf-asteroid-particle"
              style={{ fill: col, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--fall': `${p.fall}px`, '--rot': `${p.rot}deg`, '--pc': col, animationDelay: `${p.delay}s` } as React.CSSProperties}
            />
            );
          })}
        </g>
      ))}
    {depart && dp && <DepartOverlay planet={depart.planet} pose={dp} />}
    {isRwa && (
      <>
        <MonoLayer
          sceneKey="rwaIntro"
          active={rwaStonePhase === "alive" && !rwaIntroDone}
          dismissible={false}
          onDone={onRwaIntroDone}
        />
        <MonoLayer
          sceneKey="rwaFarewell"
          active={rwaStonePhase === "gone" && !rwaPortalOpen && !rwaFarewellShown}
          dismissible={false}
          onDone={onRwaMonologueDone}
        />
      </>
    )}
    {(isStable || isRealNft || isBitcoin) && (
      <CutsceneLayer key={cutscenePlanet} towerActivated={towerActivated}
        planet={isStable ? "stable" : isRealNft ? "nft" : "bitcoin"}
        onDialogChange={setCombatBlocked}
      />
    )}
          {depart && dp && (
        <g
          transform={`translate(${heroLeftX(getPlanetId()) + dp.ox}, ${PLAYER_Y + dp.oy}) translate(40, 80) scale(${dp.s}) translate(-40, -80)`}
          pointerEvents="none"
        >
          <g
            className={[characterClass, isFallen ? "rf-archer-fallen" : ""].filter(Boolean).join(" ") || undefined}
            style={{
              ["--armor-color" as any]: armorColor || undefined,
              ["--clothing-color" as any]: clothingColor || undefined,
              ["--cx" as any]: `${spriteCenterX}px`,
              ["--cy" as any]: `${spriteCenterY}px`,
              ["--drop" as any]: `${fallDropY}px`,
            }}
          >
            {activePixels && activePixels.length > 0 ? (
              <g
                className={`nft-archer ${isJumping && !isFallen ? `nft-archer-jumping jump-${jumpVariant || "spin-360"}` : ""}${isPaused ? " rf-archer-paused" : ""}`}
                shapeRendering="crispEdges"
                style={{ transformBox: "fill-box", transformOrigin: "center", transform: `translate(${heroShiftX}px, ${heroShiftY}px) scaleX(1)`, opacity: dp.op, transition: instantResetPlanet ? "none" : heroTransition, ["--jump-offset-x" as any]: `${heroShiftX}px`, ["--jump-offset-y" as any]: `${heroShiftY}px`, ["--jump-flip" as any]: "1" } as any}
              >
                {activePixels.map(([x, y], i) => (
                  <rect key={"top-fo-" + i} x={x * 5 - 5} y={y * 5 - 5} width={15} height={15} className="friend-outline" />
                ))}
                {activePixels.map(([x, y], i) => (
                  <rect key={"top-fb-" + i} x={x * 5} y={y * 5} width={5} height={5} className="friend-body" />
                ))}
                {clothingColor &&
                  activePixels.map(([x, y], i) => (
                    <rect key={"top-fc-" + i} x={x * 5} y={y * 5} width={5} height={5} className="friend-clothing-tint" />
                  ))}
              </g>
            ) : nftImageUrl ? (
              <g opacity={dp.op}>
                <image
                  href={nftImageUrl}
                  x="0"
                  y="0"
                  width={PLAYER_WIDTH}
                  height={PLAYER_HEIGHT}
                  className={`nft-archer ${isJumping && !isFallen ? `nft-archer-jumping jump-${jumpVariant || "spin-360"}` : ""}${isPaused ? " rf-archer-paused" : ""}`}
                />
              </g>
            ) : null}
          </g>

          {isFallen && (
            <g className="rf-fall-timer-glow" transform={`translate(${fallTimerX}, ${fallTimerY})`} pointerEvents="none">
              <rect x="-24" y="-24" width="48" height="34" rx="8" fill="none" stroke="#ffffff" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fontFamily="monospace" fontSize="24" fontWeight="bold" fill="#ffffff" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" paintOrder="stroke fill markers">
                {fallRemaining ?? 0}
              </text>
            </g>
          )}
        </g>
      )}


      {isPaused && (
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
      )}

<g><circle cx="890" cy="95" r="4" fill="#ff0000" filter="url(#neonGlowPink)"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"></animate></circle><text x="900" y="100" font-family="monospace" font-size="14" fill="#ff0000" filter="url(#neonGlowPink)" opacity="1">REC</text></g>
      <g
        className="rf-tab-btn"
        transform="translate(65, 45)"
        role="button"
        tabIndex={0}
        pointerEvents="all"
        aria-label={autoPauseEnabled ? "TAB PAUSE ON" : "TAB PAUSE OFF"}
        onClick={() => onToggleTabPause?.()}
        onKeyDown={(e: any) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleTabPause?.();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <title>{autoPauseEnabled ? "Auto-pause on tab hidden: ON" : "Auto-pause on tab hidden: OFF"}</title>
        <circle cx="0" cy="0" r="18" fill="transparent" stroke="none" />
        <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke={autoPauseEnabled ? "#00ff88" : "#ff4d4d"} strokeWidth="1.5" />
        <path
          d="M -8 -5 H 8 V 4 H -8 Z M -5 -5 V -8 H 5 V -5"
          fill="none"
          stroke={autoPauseEnabled ? "#00ff88" : "#ff4d4d"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {!autoPauseEnabled && (
          <line x1="-12" y1="12" x2="12" y2="-12" stroke="#ff4d4d" strokeWidth="2.5" strokeLinecap="round" />
        )}
      </g>
      <g
        className="rf-mute-btn"
        transform="translate(895, 45)"
        role="button"
        tabIndex={0}
        pointerEvents="all"
        onClick={() => onToggleMute?.()}
        onKeyDown={(e: any) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleMute?.();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <circle cx="0" cy="0" r="18" fill="transparent" stroke="none" />
        <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke="#ff00ff" strokeWidth="1.5" />

        <path
          d="M -4,-4 L -1,-4 L 3,-7 L 3,7 L -1,4 L -4,4 Z"
          fill="none"
          stroke="#ff00ff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {!isMuted && (
          <>
            <path
              d="M 5,-3 Q 7,0 5,3"
              fill="none"
              stroke="#ff00ff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 7,-5 Q 10,0 7,5"
              fill="none"
              stroke="#ff00ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
          </>
        )}

        {isMuted && (
          <line
            x1="-7"
            y1="-7"
            x2="8"
            y2="8"
            stroke="#ff0000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </g>
      <g
        className="rf-pause-btn"
        transform="translate(935, 45)"
        role="button"
        tabIndex={0}
        pointerEvents="all"
        onClick={() => onTogglePause?.()}
        onKeyDown={(e: any) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTogglePause?.();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <circle cx="0" cy="0" r="18" fill="transparent" stroke="none" />
        <rect x="-14.5" y="-14.5" width="29" height="29" rx="4" fill="#0a0014" stroke="#ccff00" strokeWidth="1.5" />

        {isPaused ? (
          <polygon
            points="-5,-7 7,0 -5,7"
            fill="none"
            stroke="#ccff00"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <line x1="-4" y1="-7" x2="-4" y2="7" stroke="#ccff00" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="-7" x2="4" y2="7" stroke="#ccff00" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
      </g>
      <g
        className="rf-share-btn"
        transform="translate(810, 45)"
        role="button"
        tabIndex={0}
        pointerEvents="all"
        onClick={() => window.dispatchEvent(new CustomEvent("rhrf-share-screenshot"))}
        onKeyDown={(e: any) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("rhrf-share-screenshot"));
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <circle cx="0" cy="0" r="18" fill="transparent" stroke="none" />
        <circle cx="0" cy="0" r="14.5" fill="#0a0014" stroke="#00ffff" strokeWidth="1.5" />
        <text x="0" y="6" textAnchor="middle" fontFamily="monospace" fontSize="18" fill="#00ffff">𝕏</text>
      </g>
      </svg>
  );
}
