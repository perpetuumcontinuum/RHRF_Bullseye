// Single source of truth for the jump arc. handleJump flips isJumping off at
// JUMP_ARC_MS, and BackgroundEvents validates the ghost dodge against the SAME
// arc — so the player is never visually airborne but mechanically vulnerable.
// Safe window is symmetric: 200ms takeoff + 200ms landing inside the arc.
export const JUMP_ARC_MS = 1155;
export const JUMP_SAFE_START_MS = 200;
export const JUMP_SAFE_END_MS = JUMP_ARC_MS - JUMP_SAFE_START_MS; // 955