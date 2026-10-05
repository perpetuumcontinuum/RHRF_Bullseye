import { useT } from "./i18n";
import BackgroundEvents from "./BackgroundEvents";
import { PLAYER_X, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT } from "./geometry";
import React from "react";
import { TARGET_CX, TARGET_CY, ARROW_START_X, ARROW_START_Y, getScoreColor } from "./math";

interface SceneProps {
  nftImageUrl?: string | null;
  laserX: number;
  laserY: number;
  isShooting: boolean;
  isJumping: boolean;
  jumpVariant?: string;
  isLaserFiring: boolean;
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
  stuckArrows: { x: number; y: number; color?: string }[];
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
  equippedArmor?: string | null;
  clothingQualityId?: string | null;
  amuletQualityId?: string | null;
  isCyberStyle?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isPaused?: boolean;
  onPopupDone?: (id: number) => void;
  onTogglePause?: () => void;
}

export default function Scene({
  nftImageUrl,
  laserX,
  laserY,
  isShooting,
  isJumping,
  jumpVariant,
  isLaserFiring,
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
  equippedArmor,
  clothingQualityId,
  amuletQualityId,
  isCyberStyle,
  isMuted,
  onToggleMute,
  isPaused,
  onPopupDone,
  onTogglePause,
}: SceneProps) {
  const t = useT();
  const cyberStyle = Boolean(isCyberStyle ?? (typeof window !== 'undefined' && (window as any).__RHRF_IS_CYBER__));
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
    legendary: "#ffaa00",
  };

  const getRarityKey = (id?: string | null) => {
    const value = String(id || "").toLowerCase();
    if (value.includes("legendary")) return "legendary";
    if (value.includes("epic")) return "epic";
    if (value.includes("rare")) return "rare";
    return null;
  };

  const arrowColor = RARITY_COLORS[getRarityKey(arrowQualityId) || ""] || "#ff0000";
  const laserColor = RARITY_COLORS[getRarityKey(energyQualityId) || ""] || "#ff0000";
  const bowColor = RARITY_COLORS[getRarityKey(bowQualityId) || ""] || "#ff0000";

  const getArmorColor = (id?: string | null) => {
    if (!id) return null;
    const val = String(id).toLowerCase();
    if (val.includes("legendary")) return "#ffaa00";
    if (val.includes("epic")) return "#aa00ff";
    if (val.includes("rare")) return "#ccff00";
    return null;
  };

  const armorColor = getArmorColor(equippedArmor);
  const clothingColor = RARITY_COLORS[getRarityKey(clothingQualityId) || ""] || null;
  const amuletColor = RARITY_COLORS[getRarityKey(amuletQualityId) || ""] || null;
  const clothingRarity = getRarityKey(clothingQualityId);

  const characterClass = [
    cyberStyle ? "friend-cyber" : "",
    armorColor ? "armor-on" : "",
    clothingColor ? "clothing-on" : "",
    clothingRarity === "legendary" ? "clothing-legendary" : "",
    clothingRarity === "epic" ? "clothing-epic" : "",
    clothingRarity === "rare" ? "clothing-rare" : "",
  ].filter(Boolean).join(" ");

  
  const aimFrozen = Boolean(frozenLaser) && (shotPhase === "AIMING" || shotPhase === "FLYING");
  const aimX = aimFrozen && frozenLaser ? frozenLaser.x : laserX;
  const aimY = aimFrozen && frozenLaser ? frozenLaser.y : laserY;
  const hitX = TARGET_CX + aimX;
  const hitY = TARGET_CY + aimY;
  
  const cx = ARROW_START_X + (hitX - ARROW_START_X) * arrowProgress;
  const cy = ARROW_START_Y + (hitY - ARROW_START_Y) * arrowProgress;
  const vx = hitX - ARROW_START_X;
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

  const BOW_TOP_X = 306.03;
  const BOW_TOP_Y = 410.11;
  const BOW_BOTTOM_X = 329.97;
  const BOW_BOTTOM_Y = 475.89;
  const BOW_MID_X = 318;
  const BOW_MID_Y = 443;

  const stringPull =
    shotPhase === "AIMING" ||
    (shotPhase === "FLYING" && arrowProgress < 0.12);

  const useSidePixels = Boolean(stringPull && sidePixels && sidePixels.length > 0);
  const activePixels: [number, number][] = useSidePixels ? (sidePixels as [number, number][]) : (friendPixels ?? []);

  const renderOffset = (() => {
    if (!useSidePixels || !friendPixels || friendPixels.length === 0 || !sidePixels || sidePixels.length === 0) {
      return { x: 0, y: 0 };
    }

    const bounds = (pts: [number, number][]) => {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    };

    const fb = bounds(friendPixels);
    const sb = bounds(sidePixels);

    const fcx = ((fb.minX + fb.maxX + 1) / 2) * 5;
    const fcy = ((fb.minY + fb.maxY + 1) / 2) * 5;
    const scx = ((sb.minX + sb.maxX + 1) / 2) * 5;
    const scy = ((sb.minY + sb.maxY + 1) / 2) * 5;

    return { x: fcx - scx, y: fcy - scy };
  })();

  const stringX = stringPull ? tailX : BOW_MID_X;
  const stringY = stringPull ? tailY : BOW_MID_Y;

  const BOW_IDLE_ANGLE = -20;
  const aimAngleRad = Math.atan2(hitY - BOW_MID_Y, hitX - BOW_MID_X);
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
    x: BOW_MID_X + BOW_ARM_HALF * Math.sin(bowRad),
    y: BOW_MID_Y - BOW_ARM_HALF * Math.cos(bowRad),
  };
  const rotatedBowBottom = {
    x: BOW_MID_X - BOW_ARM_HALF * Math.sin(bowRad),
    y: BOW_MID_Y + BOW_ARM_HALF * Math.cos(bowRad),
  };

  return (
    <svg id="rhrf-scene-svg" viewBox="0 0 960 640" xmlns="http://www.w3.org/2000/svg" style={{ color: arrowColor, ["--rf-arrow-color" as any]: arrowColor, ["--rf-laser-color" as any]: laserColor } as any}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0020"/><stop offset="30%" stopColor="#1a0040"/>
          <stop offset="60%" stopColor="#0d0030"/><stop offset="100%" stopColor="#050015"/>
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0044"/><stop offset="50%" stopColor="#0d0022"/>
          <stop offset="100%" stopColor="#050010"/>
        </linearGradient>
        <filter id="neonGlowCyan"><feGaussianBlur stdDeviation="4" result="b1"/><feGaussianBlur stdDeviation="8" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowPink"><feGaussianBlur stdDeviation="3" result="b1"/><feGaussianBlur stdDeviation="7" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowYellow"><feGaussianBlur stdDeviation="5" result="b1"/><feGaussianBlur stdDeviation="12" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="softGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="bigGlow"><feGaussianBlur stdDeviation="20" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffcc"/><stop offset="50%" stopColor="#ffee66"/><stop offset="100%" stopColor="#ffaa00"/>
        </radialGradient>
      {/* Blood moon: charcoal core -> arterial crimson -> copper ember limb */}
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
        <linearGradient id="treeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a0050"/><stop offset="50%" stopColor="#1a0035"/><stop offset="100%" stopColor="#2a0050"/>
        </linearGradient>
      </defs>

      <rect width="1000" height="700" fill="url(#skyGrad)"/>
      
      <g opacity="0.8">
        <rect x="50" y="380" width="30" height="100" fill="#1a0044" stroke="#ff00ff33" strokeWidth="0.5"/>
        <rect x="90" y="350" width="25" height="130" fill="#1a0044" stroke="#ff00ff33" strokeWidth="0.5"/>
        <rect x="750" y="360" width="35" height="120" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
        <rect x="840" y="370" width="30" height="110" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
        <rect x="910" y="380" width="40" height="100" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
      </g>

      <g>
        <circle cx="100" cy="60" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="320" cy="40" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="550" cy="30" r="2" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="780" cy="50" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle>
              <circle cx="40" cy="95" r="1.2" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.9;0.25" dur="2.4s" repeatCount="indefinite" /></circle>
        <circle cx="150" cy="130" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.2;0.75;0.2" dur="2.8s" repeatCount="indefinite" /></circle>
        <circle cx="205" cy="72" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.3;0.85;0.3" dur="1.7s" repeatCount="indefinite" /></circle>
        <circle cx="430" cy="95" r="1.6" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.95;0.25" dur="2.1s" repeatCount="indefinite" /></circle>
        <circle cx="660" cy="85" r="1.3" fill="#ffffff"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.9s" repeatCount="indefinite" /></circle>
        <circle cx="905" cy="70" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.3s" repeatCount="indefinite" /></circle>
</g>

      <g>
        <circle cx="800" cy="120" r="58" fill="#e26a2933" filter="url(#bigGlow)"/>
        <circle cx="800" cy="120" r="42" fill="url(#moonGradRed)" filter="url(#neonGlowRed)"/>
        <circle cx="785" cy="110" r="6" fill="#520104" opacity="0.7"/>
        <circle cx="810" cy="130" r="8" fill="#6E0A05" opacity="0.8"/>
        <circle cx="800" cy="120" r="42" fill="none" stroke="#fb8b35" strokeWidth="1.2" opacity="0.55"/>
      </g>
      <circle cx="800" cy="120" r="65" fill="none" stroke="#ffaa0033" strokeWidth="1"/>

      
      
{asteroidVisible && (
        <g transform={`translate(${asteroidPosition.x}, ${asteroidPosition.y})`}>
          <circle r="20" fill="#8B4513" filter="url(#softGlow)" />
          <circle r="15" fill="#A0522D" />
          <circle cx="-5" cy="-5" r="3" fill="#654321" />
          <circle cx="7" cy="3" r="2" fill="#654321" />
        </g>
      )}
{landingGlow?.visible && (
        <g>
          {/* Tier 1: uniform haze across the entire horizon, independent of impact x */}
          <ellipse
            className="rf-landing-glow-wide"
            cx={500}
            cy={484}
            rx={620}
            ry={28}
            fill="#ff2bd6"
          />
          {/* Tier 2: mass bias toward the impact point */}
          <ellipse
            className="rf-landing-glow-mid"
            cx={landingGlow.x}
            cy={481}
            rx={430}
            ry={36}
            fill="#ff1493"
          />
          {/* Tier 3: near core right where it went under */}
          <ellipse
            className="rf-landing-glow"
            cx={landingGlow.x}
            cy={478}
            rx={130}
            ry={44}
            fill="#ff6ae0"
          />
        </g>
      )}
      <rect x="0" y="480" width="1000" height="220" fill="url(#groundGrad)"/>
      <line x1="0" y1="480" x2="1000" y2="480" stroke="#ff00ff" strokeWidth="2" filter="url(#neonGlowPink)" opacity="0.6"/>
      
      <g filter="url(#softGlow)">
        <line x1="100" y1="490" x2="95" y2="470" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
        <line x1="200" y1="490" x2="196" y2="472" stroke="#00ffcc" strokeWidth="1" opacity="0.6"/>
        <line x1="400" y1="488" x2="397" y2="468" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
        <line x1="700" y1="491" x2="695" y2="473" stroke="#00ffaa" strokeWidth="1" opacity="0.6"/>
        <line x1="900" y1="489" x2="897" y2="471" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
      </g>

      <g>
        <rect x="560" y="280" width="40" height="200" fill="url(#treeGrad)" rx="3"/>
        <rect x="560" y="280" width="40" height="200" fill="none" stroke="#cc00ff" strokeWidth="1.5" rx="3" filter="url(#neonGlowPink)" opacity="0.5"/>
        <line x1="560" y1="320" x2="500" y2="280" stroke="#2a0050" strokeWidth="12" strokeLinecap="round"/>
        <line x1="600" y1="310" x2="660" y2="270" stroke="#2a0050" strokeWidth="12" strokeLinecap="round"/>
        
        <g filter="url(#neonGlowCyan)" opacity="0.7">
          <circle cx="490" cy="255" r="25" fill="#00ffaa11" stroke="#00ffaa" strokeWidth="1"/>
          <circle cx="510" cy="240" r="20" fill="#00ffcc11" stroke="#00ffcc" strokeWidth="0.8"/>
        </g>
        <g filter="url(#neonGlowPink)" opacity="0.6">
          <circle cx="660" cy="250" r="25" fill="#ff00ff11" stroke="#ff00ff" strokeWidth="1"/>
          <circle cx="645" cy="265" r="20" fill="#ff00ff11" stroke="#ff00ff" strokeWidth="0.8"/>
        </g>
      </g>

      {}
      <g transform="translate(-560, 0)" opacity="0.8">
        <polygon points="720,480 740,340 760,340 780,480" fill="#1a0035" stroke="#ff0066" strokeWidth="1" filter="url(#softGlow)"/>
        <line x1="730" y1="300" x2="770" y2="300" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <line x1="735" y1="350" x2="765" y2="350" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <line x1="738" y1="400" x2="762" y2="400" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <circle cx="750" cy="335" r="4" fill="#ff0000" filter="url(#neonGlowPink)"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
      </g>
      {}
      <g>
        <rect x="55" y="390" width="4" height="4" fill="#00ffff" opacity="0.8"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="65" y="410" width="4" height="4" fill="#ff00ff" opacity="0.7"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="75" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/></rect>
        <rect x="95" y="365" width="4" height="4" fill="#00ffff" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></rect>
        <rect x="105" y="385" width="4" height="4" fill="#ff00ff" opacity="0.8"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite"/></rect>
        <rect x="755" y="375" width="4" height="4" fill="#00ffff" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="765" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="815" y="405" width="4" height="4" fill="#ff00ff" opacity="0.7"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite"/></rect>
        <rect x="855" y="385" width="4" height="4" fill="#00ffff" opacity="0.8"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="925" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/></rect>
      </g>
      <BackgroundEvents />

      <g transform={`translate(${PLAYER_X}, ${PLAYER_Y})`}>
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
             transform={`translate(${renderOffset.x}, ${renderOffset.y})`}>
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

      {!isJumping && !isFallen && <g className={cyberStyle ? "friend-cyber" : undefined} transform={`translate(${BOW_MID_X}, ${BOW_MID_Y}) rotate(${bowAngle})`}>
        <path d="M 0,-35 Q 15,-20 15,0 Q 15,20 0,35" fill="none" stroke={cyberStyle ? "var(--cyber-fill)" : bowColor} strokeWidth="3" filter="url(#neonGlowPink)"/>
      </g>}
      {!isJumping && !isFallen && <polyline
        className={`bow-string ${cyberStyle ? "friend-cyber" : ""}`}
        points={`${rotatedBowTop.x},${rotatedBowTop.y} ${stringX},${stringY} ${rotatedBowBottom.x},${rotatedBowBottom.y}`}
        fill="none"
        stroke={cyberStyle ? "var(--cyber-fill)" : bowColor}
        strokeWidth="1.8"
        filter="url(#neonGlowYellow)"
        opacity="1"
      />}

      <g className="rf-target-rings" transform="translate(580, 360)" pointerEvents="none">
        <defs>
          <radialGradient id="rfBullseyeCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff">
              <animate
                attributeName="stop-color"
                values="#ffffff;#aa00ff;#00ffff;#ffffff"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="55%" stopColor="#aa00ff">
              <animate
                attributeName="stop-color"
                values="#aa00ff;#00ffff;#ffffff;#aa00ff"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#3a0066" />
          </radialGradient>
        </defs>

        <circle r="81" fill="#070012" stroke="#1a0030" strokeWidth="1" />

        <circle
          r="68.85"
          fill="none"
          stroke="#00ffff"
          strokeWidth="24.3"
          opacity="0.72"
        />
        <circle
          r="44.55"
          fill="none"
          stroke="#ccff00"
          strokeWidth="24.3"
          opacity="0.78"
        />
        <circle
          r="20.25"
          fill="none"
          stroke="#aa00ff"
          strokeWidth="24.3"
          opacity="0.86"
        />

        <circle r="32.4" fill="none" stroke="#050015" strokeWidth="1.5" opacity="0.85" />
        <circle r="56.7" fill="none" stroke="#050015" strokeWidth="1.5" opacity="0.85" />
        <circle r="8.1" fill="none" stroke="#050015" strokeWidth="1.2" opacity="0.9" />

        <circle r="8.1" fill="url(#rfBullseyeCoreGrad)" filter="url(#neonGlowPink)" />

        <circle r="2.8" fill="#ffffff" opacity="0.92">
          <animate
            attributeName="opacity"
            values="0.45;1;0.45"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="81" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.16" />
      </g>
      <g className={cyberStyle ? "friend-cyber rf-laser-cyber" : undefined} transform={`translate(${TARGET_CX + aimX}, ${TARGET_CY + aimY})`}>
        <circle cx="0" cy="0" r="10" fill="none" stroke={amuletColor || "#000"} strokeWidth="1.5" filter="url(#neonGlowPink)"/>
        <circle cx="0" cy="0" r="2" fill={amuletColor || "#000"} filter="url(#neonGlowPink)"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke={amuletColor || "#000"} strokeWidth="1" filter="url(#neonGlowPink)"/>
        <line x1="0" y1="-14" x2="0" y2="14" stroke={amuletColor || "#000"} strokeWidth="1" filter="url(#neonGlowPink)"/>
      </g>

      {isShooting && (
        <g>
          <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke={arrowColor} strokeWidth="2.5" filter="url(#neonGlowCyan)"/>
          <polygon points={`${h1x},${h1y} ${h2x},${h2y} ${h3x},${h3y}`} fill={arrowColor} filter="url(#neonGlowYellow)"/>
          <line x1={trailX} y1={trailY} x2={tailX} y2={tailY} stroke={arrowColor} strokeWidth="1" opacity="0.4" filter="url(#softGlow)" strokeDasharray="4,4"/>
        </g>
      )}


            {scorePopups.map((popup) => {
        const color = popup.color || getScoreColor(popup.score);
        const cyberPopup = color === "cyber";
        const popupColor = cyberPopup ? "#00ffff" : color;

        return (
          <g key={popup.id} transform={`translate(${popup.x}, ${popup.y})`}>
            <g
              className={`score-popup ${cyberPopup ? "rf-score-popup-cyber" : ""}${isPaused ? " rf-popup-paused" : ""}`}
              style={{ ["--dx" as any]: `${popup.dx ?? -238}px`, ["--dy" as any]: `${popup.dy ?? -200}px` } as any}
              onAnimationEnd={(e) => { if (e.currentTarget === e.target) onPopupDone?.(popup.id); }}
            >
              <rect
                x="-35"
                y="-22"
                width="70"
                height="32"
                rx="4"
                fill="#0a001488"
                stroke={popupColor}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="22"
                fontWeight="bold"
                fill={popupColor}
                filter={cyberPopup ? "url(#neonGlowPink)" : "url(#neonGlowYellow)"}
              >
                {popup.isBullseye ? `+${popup.score}!` : `+${popup.score}`}
              </text>
            </g>
          </g>
        );
      })}

{explosion?.visible && (
<g transform={`translate(${explosion.x}, ${explosion.y})`}>
<circle r="25" fill="#ffaa00" opacity="0.8" filter="url(#bigGlow)">
<animate attributeName="r" values="25;45;0" dur="1s" fill="freeze"/>
<animate attributeName="opacity" values="0.8;0.4;0" dur="1s" fill="freeze"/>
</circle>
<circle r="15" fill="#ff3300" opacity="0.9">
<animate attributeName="r" values="15;30;0" dur="0.8s" fill="freeze"/>
<animate attributeName="opacity" values="0.9;0.5;0" dur="0.8s" fill="freeze"/>
</circle>
</g>
)}
{}
      {stuckArrows.map((a, i) => {
          const svx = a.x - ARROW_START_X, svy = a.y - ARROW_START_Y;
          const slen = Math.sqrt(svx * svx + svy * svy) || 1;
          const sux = svx / slen, suy = svy / slen;
          const spx = -suy, spy = sux;
          const tx = a.x, ty = a.y;
          const tailX2 = tx - sux * 40, tailY2 = ty - suy * 40;
          const h2x2 = tx - sux * 10 + spx * 5, h2y2 = ty - suy * 10 + spy * 5;
          const h3x2 = tx - sux * 10 - spx * 5, h3y2 = ty - suy * 10 - spy * 5;
          const col = a.color || arrowColor;
          return (
            <g key={`rf-stuck-${i}`} className="rf-stuck-force" style={{ pointerEvents: "none" }}>
              <line x1={tailX2} y1={tailY2} x2={tx} y2={ty} stroke={col} strokeWidth="2.5" filter="url(#neonGlowCyan)" />
              <polygon points={`${tx},${ty} ${h2x2},${h2y2} ${h3x2},${h3y2}`} fill={col} filter="url(#neonGlowYellow)" />
            </g>
          );
        })}
{isPaused && (
        <g pointerEvents="none">
          <rect x="0" y="0" width="1000" height="700" fill="#050015" opacity="0.72" />
          <g className="rf-glitch-container">
            <text
              x="500"
              y="355"
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
              x="500"
              y="355"
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
              x="500"
              y="355"
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
        className="rf-mute-btn"
        transform="translate(850, 45)"
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
        <circle cx="1" cy="0" r="14.5" fill="#0a0014" stroke="#ff00ff" strokeWidth="1.5" />

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
        transform="translate(890, 45)"
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
        <circle cx="0" cy="0" r="14.5" fill="#0a0014" stroke="#ccff00" strokeWidth="1.5" />

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
      {}
      {}
      {isLaserFiring && (
        <rect x="185" y="130" width="10" height="200" fill="#ff0000" filter="url(#neonGlowPink)" className="laser-beam" />
      )}
    
        
      {/* Asteroid explosion particles */}
      {(explosions || []).map(exp => (
        <g key={exp.id} transform={`translate(${exp.x}, ${exp.y})`}>
          {exp.particles.map((p, i) => (
            <rect
              key={i}
              width={p.size}
              height={p.size}
              x={-p.size / 2}
              y={-p.size / 2}
              fill={p.c}
              className="rf-asteroid-particle"
              style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--fall': `${p.fall}px`, '--rot': `${p.rot}deg`, '--pc': p.c, animationDelay: `${p.delay}s` } as React.CSSProperties}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}