
import { AIM_FLOOR, AIM_SHOT_CAP, AIM_SHOT_RANGE, AIM_STEP, BOW_SPEED_FACTOR, DWELL_BAND, FREE_START_SHOTS, MAX_STORED_SHOTS, PACK_SIZE, REGEN_MS } from "./balance.js";
import { hashString } from "./rng.js";

export type SaveData = Readonly<{
  version: 1;
  shots: number;
  regenAt: number;
  points: number;
  lifetime: number;
  head: number;
  bow: number;
  amulet: number;
  rareArrow: boolean;
  rareLeft: number;       // remaining Rare Arrow charges this session (starts at PACK uses? no: 1/shot while unlocked)
  bundlesStarter: boolean;
  bundlesChampion: boolean;
  bestRing: number;
  rfSpentShots: number;
}>;

const KEY_PREFIX = "rhrf-bullseye:";
const memory = new Map<string, string>();

function readRaw(key: string): string | null {
  try { return window.localStorage.getItem(key); }
  catch { return memory.get(key) ?? null; }
}
function writeRaw(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); }
  catch { memory.set(key, value); }
}

export function defaultSave(now: number): SaveData {
  return {
    version: 1, shots: FREE_START_SHOTS, regenAt: now + REGEN_MS, points: 0, lifetime: 0,
    head: 0, bow: 0, amulet: 0, rareArrow: false, rareLeft: 0,
    bundlesStarter: false, bundlesChampion: false, bestRing: 0, rfSpentShots: 0,
  };
}

export function loadSave(friendId: bigint): SaveData {
  const key = KEY_PREFIX + friendId.toString();
  const raw = readRaw(key);
  if (!raw) return defaultSave(Date.now());
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1 || typeof parsed.shots !== "number") return defaultSave(Date.now());
    const now = Date.now();
    return applyRegen({ ...defaultSave(now), ...parsed, version: 1 }, now);
  } catch { return defaultSave(Date.now()); }
}

export function saveState(friendId: bigint, state: SaveData): void {
  writeRaw(KEY_PREFIX + friendId.toString(), JSON.stringify(state));
}

export function applyRegen(state: SaveData, now: number): SaveData {
  if (state.shots >= MAX_STORED_SHOTS) return { ...state, regenAt: now + REGEN_MS };
  if (now < state.regenAt) return state;
  const gained = Math.min(MAX_STORED_SHOTS - state.shots, 1 + Math.floor((now - state.regenAt) / REGEN_MS));
  const shots = state.shots + gained;
  const regenAt = shots >= MAX_STORED_SHOTS ? now : state.regenAt + gained * REGEN_MS;
  return { ...state, shots, regenAt };
}

export function consumeShot(state: SaveData, now: number): SaveData {
  const shots = state.shots - 1;
  return { ...state, shots, lifetime: state.lifetime + 1, regenAt: shots === 0 ? now + REGEN_MS : state.regenAt };
}

export function aimLevel(state: SaveData): number { return state.head; }

export function wanderFactor(state: SaveData): number {
  const practice = Math.min(1, state.lifetime / AIM_SHOT_CAP) * AIM_SHOT_RANGE;
  return Math.max(AIM_FLOOR, 1 - state.head * AIM_STEP - practice);
}

export function dwellZone(state: SaveData): number {
  return 0.18 + state.head * DWELL_BAND;
}

export function bowSpeedFactor(state: SaveData): number {
  return Math.pow(1 / 0.82, state.bow);
}

export function nextShotInMs(state: SaveData, now: number): number {
  if (state.shots >= MAX_STORED_SHOTS) return 0;
  return Math.max(0, state.regenAt - now);
}
export function packFull(state: SaveData): boolean { return state.shots <= 0; }
export const PACK_LIMIT = PACK_SIZE;

export type Theme = Readonly<{
  skyTop: string; skyBottom: string; hills: string; ground: string; grass: string;
  trunk: string; leafA: string; leafB: string; ringA: string; ringB: string;
  bull: string; ink: string; paper: string; accent: string;
}>;
const PALETTES: readonly Theme[] = [
  { skyTop: "#1b1230", skyBottom: "#46306a", hills: "#2c2050", ground: "#27402c", grass: "#3f6b3a", trunk: "#5a3a24", leafA: "#2f7d3a", leafB: "#57a05c", ringA: "#101014", ringB: "#efead8", bull: "#d63a3a", ink: "#101014", paper: "#efead8", accent: "#ffc83d" },
  { skyTop: "#0e2430", skyBottom: "#276874", hills: "#17404a", ground: "#2c4a2e", grass: "#4a7a3c", trunk: "#4a3320", leafA: "#2f8a52", leafB: "#69b878", ringA: "#0c1418", ringB: "#e8f2ea", bull: "#e06a1f", ink: "#0c1418", paper: "#e8f2ea", accent: "#4ff0ff" },
  { skyTop: "#2a1424", skyBottom: "#7a3a58", hills: "#48243c", ground: "#3a2f22", grass: "#6a5a2e", trunk: "#5c3a2c", leafA: "#8a6a2e", leafB: "#c09a4a", ringA: "#181014", ringB: "#f4e8d8", bull: "#d02fa8", ink: "#181014", paper: "#f4e8d8", accent: "#ff5fd2" },
  { skyTop: "#101a30", skyBottom: "#3a5488", hills: "#243456", ground: "#22403a", grass: "#3a6a54", trunk: "#443044", leafA: "#3a7a64", leafB: "#7ab894", ringA: "#0a0e18", ringB: "#e4ecf4", bull: "#cc3344", ink: "#0a0e18", paper: "#e4ecf4", accent: "#a89cff" },
];
export function themeFor(friendId: bigint): Theme {
  return PALETTES[hashString(friendId.toString()) % PALETTES.length];
}
