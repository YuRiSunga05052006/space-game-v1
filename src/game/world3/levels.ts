export interface World3LevelMeta {
  level: number;
  location: string;
  themeId: string;
  bossName: string;
}

export const WORLD3_LEVELS: World3LevelMeta[] = [
  { level: 21, location: 'Proxima Centauri', themeId: 'proxima', bossName: 'Proxima Red Dwarf Raider' },
  { level: 22, location: 'Alpha Centauri', themeId: 'alphaCentauri', bossName: 'Alpha Binary Warden' },
  { level: 23, location: "Barnard's Star", themeId: 'barnard', bossName: "Barnard's Runaway Hunter" },
  { level: 24, location: 'Luhman 16', themeId: 'luhman', bossName: 'Luhman Brown Dwarf Tyrant' },
  { level: 25, location: 'Wolf 359', themeId: 'wolf359', bossName: 'Wolf Flare Striker' },
  { level: 26, location: 'Sirius', themeId: 'sirius', bossName: 'Sirius Binary Tyrant' },
  { level: 27, location: 'Epsilon Eridani', themeId: 'epsilonEridani', bossName: 'Epsilon Dust Sentinel' },
  { level: 28, location: 'Procyon', themeId: 'procyon', bossName: 'Procyon White Guardian' },
  { level: 29, location: "Van Maanen's Star", themeId: 'vanMaanen', bossName: "Van Maanen's White Phantom" },
  { level: 30, location: 'Altair', themeId: 'altair', bossName: 'Altair Rapid Spinner' },
  { level: 31, location: 'Vega', themeId: 'vega', bossName: 'Vega Pole Dancer' },
  { level: 32, location: 'Pollux', themeId: 'pollux', bossName: 'Pollux Orange Giant' },
  { level: 33, location: 'Arcturus', themeId: 'arcturus', bossName: 'Arcturus K Giant Warden' },
  { level: 34, location: 'TRAPPIST-1', themeId: 'trappist', bossName: 'TRAPPIST System Overlord' },
  { level: 35, location: 'Capella', themeId: 'capella', bossName: 'Capella Binary Reaver' },
  { level: 36, location: 'Alderamin', themeId: 'alderamin', bossName: 'Alderamin Delta Sentinel' },
  { level: 37, location: 'Castor', themeId: 'castor', bossName: 'Castor Sextuple Weaver' },
  { level: 38, location: 'Aldebaran', themeId: 'aldebaran', bossName: 'Aldebaran Red Colossus' },
];

export function getWorld3Level(level: number): World3LevelMeta {
  const index = level - 21;
  return WORLD3_LEVELS[index] ?? WORLD3_LEVELS[0];
}

export function getWorld3LevelCount(): number {
  return WORLD3_LEVELS.length;
}
