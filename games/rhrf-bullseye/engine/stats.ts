export interface GameStats {
  sessionStartTime: number;
  currentSessionMs: number;
  totalPlayMs: number;
  earnedScore: number;

  currentCyberStreak: number;
  bestCyberStreak: number;

  currentGhostStreak: number;
  bestGhostStreak: number;

  currentAsteroidStreak: number;
  bestAsteroidStreak: number;

  earnedBadges: string[];
}

const MIN_STREAK = 3;
const STORAGE_KEY = "rhrf_bullseye_stats_v2";
const OLD_STORAGE_KEY = "rhrf_bullseye_stats_v1";

export const defaultStats: GameStats = {
  sessionStartTime: Date.now(),
  currentSessionMs: 0,
  totalPlayMs: 0,
  earnedScore: 0,

  currentCyberStreak: 0,
  bestCyberStreak: 0,

  currentGhostStreak: 0,
  bestGhostStreak: 0,

  currentAsteroidStreak: 0,
  bestAsteroidStreak: 0,
  earnedBadges: [],
};

function migrate(raw: any): GameStats {
  const next: GameStats = { ...defaultStats, sessionStartTime: Date.now() };

  if (!raw || typeof raw !== "object") return next;

  next.sessionStartTime = Number(raw.sessionStartTime) || Date.now();
  next.currentSessionMs = Number(raw.currentSessionMs ?? raw.currentTimePlayedMs) || 0;
  next.totalPlayMs = Number(raw.totalPlayMs ?? raw.currentTimePlayedMs) || 0;
  next.earnedScore = Number(raw.earnedScore ?? raw.totalScore) || 0;

  next.currentCyberStreak = Number(raw.currentCyberStreak ?? raw.currentAppleStreak) || 0;
  next.bestCyberStreak = Number(raw.bestCyberStreak ?? raw.maxAppleStreak) || 0;

  next.currentGhostStreak = Number(raw.currentGhostStreak ?? raw.currentGhostJumpStreak) || 0;
  next.bestGhostStreak = Number(raw.bestGhostStreak ?? raw.maxGhostJumpStreak) || 0;

  next.currentAsteroidStreak = Number(raw.currentAsteroidStreak ?? raw.currentAsteroidKillStreak) || 0;
  next.bestAsteroidStreak = Number(raw.bestAsteroidStreak ?? raw.maxAsteroidKillStreak) || 0;
  next.earnedBadges = Array.isArray(raw.earnedBadges) ? raw.earnedBadges.map(String) : [];

  return next;
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));

    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) return migrate(JSON.parse(oldRaw));
  } catch {
  }

  return { ...defaultStats, sessionStartTime: Date.now() };
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
  }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}