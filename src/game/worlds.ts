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
    subtitle: 'Jupiter → Neptune',
    locked: true,
    levelCount: 0,
    cardTheme: 'mars',
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

export function getPlayableWorlds(): WorldMeta[] {
  return WORLDS.filter((world) => !world.locked);
}
