
import { expectedReward, maximumPrize, parseChanceGame, RF } from "@rarefriends/friendsdk/game";
import definition from "../game.json" with { type: "json" };

export const GAME = parseChanceGame(definition);
export const RF_UNIT = RF;

export const PACK_SIZE = 10;
export const REGEN_MS = 3 * 60_000;
export const MAX_STORED_SHOTS = 60;
export const FREE_START_SHOTS = 10;

export const HEAD_PRICES = [40, 120, 300] as const;
export const BOW_PRICES = [30, 90, 220] as const;
export const AMULET_PRICES = [50, 140, 340] as const;
export const RARE_ARROW_PRICE = 25;
export const STARTER_BUNDLE_PRICE = 60;
export const CHAMPION_BUNDLE_PRICE = 400;
export const SHOT_PACK_PTS = 8;
export const SHOT_PACK_RF = 1n * RF;
export const SHOT_PACK_QTY = 5;
export const REFILL_WAIT_MS = 10 * 60_000;

export const AIM_STEP = 0.07;
export const AIM_SHOT_RANGE = 0.11;
export const AIM_SHOT_CAP = 500;
export const AIM_FLOOR = 0.70;
export const DWELL_BAND = 0.06;

export const BOW_SPEED_FACTOR = 0.82;

export const AMULET_MULT = [1, 1.5, 2, 3] as const;

export const WANDER_BASE_R = 22;
export const WANDER_PERIOD_X_S = 3.1;
export const WANDER_PERIOD_Y_S = 2.3;
export const DWELL_CYCLE_S = 2.6;
export const DWELL_CHANCE = 0.45;

export const FLIGHT_MS = 260;
export const STICK_MS = 700;
export const BOW_ANIM_MS = 1000;
export const JUMP_MS = 420;
export const CHEER_PARTICLES = 18;

export const EXPECTED_REWARD = expectedReward(GAME);
export const MAX_PRIZE = maximumPrize(GAME);

export const TIER_POINTS = [0, 1, 2, 5] as const;