import { getWorld1LevelCount } from './world1/levels';
import { getWorld2LevelCount } from './world2/levels';
import { getWorld3LevelCount } from './world3/levels';
import { getWorldLevelRange } from './worlds';
import { isWorld2StoryUnlocked, isWorld3StoryUnlocked } from './worldProgress';

const STORAGE_KEY = 'star-blaster-story-progress';
const MAX_LEVEL = getWorld1LevelCount() + getWorld2LevelCount() + getWorld3LevelCount();

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
  const world2Min = getWorldLevelRange('world2').min;
  const world3Min = getWorldLevelRange('world3').min;
  if (level >= world2Min && level < world3Min && !isWorld2StoryUnlocked()) return false;
  if (level >= world3Min && !isWorld3StoryUnlocked()) return false;
  if (level === world3Min && isWorld3StoryUnlocked()) return true;
  return readUnlocked().includes(level);
}

export function unlockLevel(level: number): void {
  if (level < 1 || level > MAX_LEVEL) return;
  const world2Min = getWorldLevelRange('world2').min;
  const world3Min = getWorldLevelRange('world3').min;
  if (level >= world2Min && level < world3Min && !isWorld2StoryUnlocked()) return;
  if (level >= world3Min && !isWorld3StoryUnlocked()) return;
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
  const { min, max } = getWorldLevelRange(worldId);

  for (let level = max; level >= min; level--) {
    if (isLevelUnlocked(level)) return level;
  }
  return min;
}
