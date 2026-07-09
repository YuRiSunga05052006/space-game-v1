import { getWorld1LevelCount } from './world1/levels';
import { getWorld2LevelCount } from './world2/levels';
import { isWorld2StoryUnlocked } from './worldProgress';

const STORAGE_KEY = 'star-blaster-story-progress';
const MAX_LEVEL = getWorld1LevelCount() + getWorld2LevelCount();

function readUnlocked(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [1];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [1];
    const levels = parsed
      .map((n) => parseInt(String(n), 10))
      .filter((n) => n >= 1 && n <= MAX_LEVEL);
    if (!levels.includes(1)) levels.unshift(1);
    return [...new Set(levels)].sort((a, b) => a - b);
  } catch {
    return [1];
  }
}

function writeUnlocked(levels: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(levels)].sort((a, b) => a - b)));
  } catch {
    // ignore storage errors
  }
}

export function getUnlockedLevels(): number[] {
  return readUnlocked();
}

export function isLevelUnlocked(level: number): boolean {
  if (level >= 11 && !isWorld2StoryUnlocked()) return false;
  return readUnlocked().includes(level);
}

export function unlockLevel(level: number): void {
  if (level < 1 || level > MAX_LEVEL) return;
  if (level >= 11 && !isWorld2StoryUnlocked()) return;
  const levels = readUnlocked();
  if (!levels.includes(level)) {
    levels.push(level);
    writeUnlocked(levels);
  }
}

export function getMaxLevelSlots(): number {
  return MAX_LEVEL;
}

export function getHighestUnlockedLevelForWorld(worldId: string): number {
  const world1Max = getWorld1LevelCount();
  const world2Max = getWorld1LevelCount() + getWorld2LevelCount();

  if (worldId === 'world2') {
    for (let level = world2Max; level > world1Max; level--) {
      if (isLevelUnlocked(level)) return level;
    }
    return world1Max + 1;
  }

  for (let level = world1Max; level >= 1; level--) {
    if (isLevelUnlocked(level)) return level;
  }
  return 1;
}
