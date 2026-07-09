import type { GameMode } from './gameMode';
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
    subtitle: 'Proxima → Sirius',
    locked: true,
    levelCount: 0,
    cardTheme: 'mercury',
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
  if (worldId === 'world2') return { min: 11, max: 20 };
  return { min: 1, max: 10 };
}

export function isWorldLocked(worldId: string, mode: GameMode = 'story'): boolean {
  if (worldId === 'world1') return false;
  return !checkWorldUnlocked(worldId, mode);
}

export function getPlayableWorlds(mode: GameMode = 'story'): WorldMeta[] {
  return WORLDS.filter((world) => !isWorldLocked(world.id, mode));
}
