

import { createFriendReader, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";

export function friendFrame(rows: readonly string[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (pixel === "#") ctx.fillRect(x - 1, y - 1, 3, 3);
    });
  });
  ctx.fillStyle = "#000";
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (pixel === "#") ctx.fillRect(x, y, 1, 1);
    });
  });
  return canvas;
}

export async function loadFriendSprite(friendId: bigint): Promise<HTMLCanvasElement | null> {
  try {
    const reader = createFriendReader();
    const sprites: GenerationSprites = await reader.read(friendId);
    
    const frame = spriteFrame(sprites, "down", false, 0, "right").frame;
    if (frame.rows && frame.rows.length > 0) {
    }
    
    const canvas = friendFrame(frame.rows);
    return canvas;
  } catch (err) {
    console.error("[ART] Failed to load sprite:", err);
    return null;
  }
}

export interface RenderState {
  friendSprite: HTMLCanvasElement | null;
  archerState: "idle" | "bow" | "jump";
  arrowAnim: { active: boolean; startX: number; startY: number; endX: number; endY: number; progress: number } | null;
  crosshair: { x: number; y: number };
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
  floatingTexts: { x: number; y: number; text: string; life: number; color: string }[];
  rankColor: string;
  rankGlow: string;
  aimLevel: number;
  screenShake: number;
}

export function renderScene(ctx: CanvasRenderingContext2D, state: RenderState, canvasW: number, canvasH: number): void {
  
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const shakeX = (Math.random() - 0.5) * state.screenShake;
  const shakeY = (Math.random() - 0.5) * state.screenShake;
  ctx.translate(shakeX, shakeY);

  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, "#1a1c2c");
  grad.addColorStop(1, "#2d1b2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = "#16213e";
  ctx.fillRect(0, 100, canvasW, 60);

  ctx.fillStyle = "#5d4037";
  ctx.fillRect(40, 80, 8, 40);
  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.arc(44, 70, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#388e3c";
  ctx.beginPath();
  ctx.arc(44, 60, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5d4037";
  ctx.fillRect(178, 60, 4, 40);
  for (let i = 10; i >= 1; i--) {
    ctx.fillStyle = i % 2 === 0 ? "#1a1c2c" : "#ffffff";
    ctx.beginPath();
    ctx.arc(180, 60, i * 2, 0, Math.PI * 2);
    ctx.fill();
    if (i === 10) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("10", 180, 62);
    }
  }

  const archerX = 80;
  const archerY = 100;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(archerX + 24, archerY + 48, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.friendSprite) {
    const scale = 3;
    const jumpY = state.archerState === "jump" ? Math.sin(Date.now() / 50) * 3 : 0;
    const drawX = archerX;
    const drawY = archerY - 16 * scale + jumpY;

    if (state.aimLevel >= 4) {
      ctx.shadowColor = state.rankGlow;
      ctx.shadowBlur = 8;
    }

    ctx.drawImage(state.friendSprite, drawX, drawY, 16 * scale, 16 * scale);

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = state.rankColor;
    ctx.fillRect(drawX, drawY, 16 * scale, 16 * scale);
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

    if (state.archerState !== "idle" || state.arrowAnim?.active) {
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drawX + 30, drawY + 20, 12, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  } else {

    const scale = 3;
    const drawX = archerX;
    const drawY = archerY - 16 * scale;
    ctx.fillStyle = state.rankColor;
    ctx.fillRect(drawX, drawY, 16 * scale, 16 * scale);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("?", drawX + 24, drawY + 32);
  }

  if (!state.arrowAnim?.active) {
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(state.crosshair.x - 8, state.crosshair.y);
    ctx.lineTo(state.crosshair.x + 8, state.crosshair.y);
    ctx.moveTo(state.crosshair.x, state.crosshair.y - 8);
    ctx.lineTo(state.crosshair.x, state.crosshair.y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(state.crosshair.x, state.crosshair.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
