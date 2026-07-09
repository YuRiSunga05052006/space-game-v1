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

export function formatSurvivalHighScoreLabel(worldId = 'world1'): string {
  const label = worldId === 'world2' ? 'WORLD 2 SURVIVAL HIGH SCORE' : 'SURVIVAL HIGH SCORE';
  return `${label} ${getSurvivalHighScore(worldId)}`;
}
