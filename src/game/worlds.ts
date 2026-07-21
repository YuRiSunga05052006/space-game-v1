import type { GameMode } from './gameMode';
import { getWorld1LevelCount } from './world1/levels';
import { getWorld2LevelCount } from './world2/levels';
import { getWorld3LevelCount } from './world3/levels';
import { isWorldUnlocked as checkWorldUnlocked } from './worldProgress';

export interface WorldMeta {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  locked: boolean;
  levelCount: number;
  cardTheme: string;
}

export const WORLD_LEVEL_RANGES: Record<string, { min: number; max: number }> = {
  world1: { min: 1, max: getWorld1LevelCount() },
  world2: { min: getWorld1LevelCount() + 1, max: getWorld1LevelCount() + getWorld2LevelCount() },
  world3: {
    min: getWorld1LevelCount() + getWorld2LevelCount() + 1,
    max: getWorld1LevelCount() + getWorld2LevelCount() + getWorld3LevelCount(),
  },
};

export const WORLDS: WorldMeta[] = [
  {
    id: 'world1',
    number: 1,
    title: 'Inner Solar System',
    subtitle: 'Earth → Asteroid Belt',
    locked: false,
    levelCount: 10,
    cardTheme: 'earth',
  },
  {
    id: 'world2',
    number: 2,
    title: 'Outer Solar System',
    subtitle: 'Jupiter → Oort Cloud',
    locked: true,
    levelCount: 10,
    cardTheme: 'jupiter',
  },
  {
    id: 'world3',
    number: 3,
    title: 'Stellar Neighbors',
    subtitle: 'Proxima Centauri → Aldebaran',
    locked: true,
    levelCount: 18,
    cardTheme: 'sirius',
  },
  {
    id: 'world4',
    number: 4,
    title: 'The Nebula',
    subtitle: 'Deep frontier',
    locked: true,
    levelCount: 0,
    cardTheme: 'beltFinale',
  },
];

export function getWorld(id: string): WorldMeta | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function getWorldLevelRange(worldId: string): { min: number; max: number } {
  return WORLD_LEVEL_RANGES[worldId] ?? WORLD_LEVEL_RANGES.world1;
}

export function getWorldNumber(worldId: string): number {
  const world = getWorld(worldId);
  return world?.number ?? 1;
}

export function isWorldLocked(worldId: string, mode: GameMode = 'story'): boolean {
  if (worldId === 'world1') return false;
  return !checkWorldUnlocked(worldId, mode);
}

export function getPlayableWorlds(mode: GameMode = 'story'): WorldMeta[] {
  return WORLDS.filter((world) => !isWorldLocked(world.id, mode));
}
