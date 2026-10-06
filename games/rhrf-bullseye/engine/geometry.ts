// Shared character geometry, single source of truth for renderer and collisions
export const PLAYER_X = 240;
export const PLAYER_Y = 410;
export const PLAYER_WIDTH = 80;
export const PLAYER_HEIGHT = 80;

// Score popup flight target in SVG user units (viewBox 0 0 1000 700).
// These units scale with the scene, so the offset stays proportional on any
// screen size; +20 right of the previous 282 anchor.
export const SCORE_TARGET_X = 342;
export const SCORE_TARGET_Y = 40;

// Arrow popups spawn at a fixed point on the target ring
export const ARROW_POPUP_X = 580;
export const ARROW_POPUP_Y = 240;