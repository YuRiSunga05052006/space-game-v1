import { WORLDS, getWorldNumber } from './worlds';

const STORAGE_PREFIX = 'star-blaster-survival-high-score';
const LEGACY_KEY = 'star-blaster-high-score';

function getStorageKey(worldId = 'world1'): string {
  return worldId === 'world1' ? STORAGE_PREFIX : `${STORAGE_PREFIX}-${worldId}`;
}

function migrateLegacyScore(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === null) return;
    if (localStorage.getItem(getStorageKey('world1')) === null) {
      localStorage.setItem(getStorageKey('world1'), legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getSurvivalHighScore(worldId = 'world1'): number {
  migrateLegacyScore();
  try {
    const raw = localStorage.getItem(getStorageKey(worldId));
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function getBestSurvivalHighScore(): number {
  migrateLegacyScore();
  let best = 0;
  for (const world of WORLDS) {
    best = Math.max(best, getSurvivalHighScore(world.id));
  }
  return best;
}

export function updateSurvivalHighScore(score: number, worldId = 'world1'): number {
  const current = getSurvivalHighScore(worldId);
  if (score <= current) return current;
  try {
    localStorage.setItem(getStorageKey(worldId), String(score));
  } catch {
    // ignore storage errors
  }
  return score;
}

export function formatSurvivalHighScoreLabel(worldId?: string): string {
  if (worldId === undefined) {
    return `SURVIVAL HIGH SCORE ${getBestSurvivalHighScore()}`;
  }

  const worldNum = getWorldNumber(worldId);
  const label = worldId === 'world1'
    ? 'SURVIVAL HIGH SCORE'
    : `WORLD ${worldNum} SURVIVAL HIGH SCORE`;
  return `${label} ${getSurvivalHighScore(worldId)}`;
}
