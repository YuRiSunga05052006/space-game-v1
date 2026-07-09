export interface World2LevelMeta {
  level: number;
  location: string;
  themeId: string;
  bossName: string;
}

export const WORLD2_LEVELS: World2LevelMeta[] = [
  { level: 11, location: 'Jupiter', themeId: 'jupiter', bossName: 'Jovian Storm Warden' },
  { level: 12, location: 'Saturn', themeId: 'saturn', bossName: 'Saturn Ring Reaver' },
  { level: 13, location: 'Titan Transit', themeId: 'titan', bossName: 'Titan Methane Tyrant' },
  { level: 14, location: 'Uranus', themeId: 'uranus', bossName: 'Uranian Tilt Guardian' },
  { level: 15, location: 'Neptune', themeId: 'neptune', bossName: 'Neptunian Leviathan' },
  { level: 16, location: 'Kuiper Belt', themeId: 'kuiper', bossName: 'Kuiper Belt Marauder' },
  { level: 17, location: 'Pluto Approach', themeId: 'pluto', bossName: 'Pluto Dark Sentinel' },
  { level: 18, location: 'Eris Approach', themeId: 'eris', bossName: 'Eris Void Reaper' },
  { level: 19, location: 'Sednoid Sector', themeId: 'sedna', bossName: 'Sedna Wraith Lord' },
  { level: 20, location: 'Oort Cloud', themeId: 'oort', bossName: 'Oort Cloud Sovereign' },
];

export function getWorld2Level(level: number): World2LevelMeta {
  const index = level - 11;
  return WORLD2_LEVELS[index] ?? WORLD2_LEVELS[0];
}

export function getWorld2LevelCount(): number {
  return WORLD2_LEVELS.length;
}
