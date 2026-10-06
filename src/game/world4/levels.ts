export interface World4LevelMeta {
  level: number;
  location: string;
  themeId: string;
  bossName: string;
}

export const WORLD4_LEVELS: World4LevelMeta[] = [
  { level: 39, location: 'Hamal', themeId: 'hamal', bossName: 'Hamal Orange Sentinel' },
  { level: 40, location: 'Alphecca', themeId: 'alphecca', bossName: 'Alphecca Crown Warden' },
  { level: 41, location: 'Kaus Borealis', themeId: 'kausBorealis', bossName: 'Kaus Northern Archer' },
  { level: 42, location: 'Regulus', themeId: 'regulus', bossName: 'Regulus Lionheart' },
  { level: 43, location: 'Ankaa', themeId: 'ankaa', bossName: 'Ankaa Phoenix Striker' },
  { level: 44, location: 'Southern Cross', themeId: 'southernCross', bossName: 'Acrux Southern Tyrant' },
  { level: 45, location: 'Cursa', themeId: 'cursa', bossName: 'Cursa River Sentinel' },
  { level: 46, location: 'Algol', themeId: 'algol', bossName: 'Algol Demon Star' },
  { level: 47, location: 'Alpheratz', themeId: 'alpheratz', bossName: 'Alpheratz Chain Warden' },
  { level: 48, location: 'Cor Caroli', themeId: 'corCaroli', bossName: 'Cor Caroli Heart Guardian' },
  { level: 49, location: 'Alnair', themeId: 'alnair', bossName: 'Alnair Crane Hunter' },
  { level: 50, location: 'Big Dipper', themeId: 'bigDipper', bossName: 'Alioth Dipper Tyrant' },
];

/** Map labels only. These levels have no enemies, bosses, or gameplay. */
export interface World4ComingSoonMeta {
  level: number;
  location: string;
  bossTier?: 'mid' | 'finale';
}

export const WORLD4_COMING_SOON: World4ComingSoonMeta[] = [
  { level: 51, location: 'Elnath' },
  { level: 52, location: 'Achernar' },
  { level: 53, location: 'Kaus Australis' },
  { level: 54, location: 'Alphard' },
  { level: 55, location: 'R Doradus' },
  { level: 56, location: 'Mirach', bossTier: 'mid' },
  { level: 57, location: 'Methuselah Star' },
  { level: 58, location: 'Delta Scuti' },
  { level: 59, location: 'Cassiopeia' },
  { level: 60, location: 'Nunki' },
  { level: 61, location: 'Spica' },
  { level: 62, location: 'Bellatrix', bossTier: 'finale' },
];

export function getWorld4Level(level: number): World4LevelMeta {
  const index = level - 39;
  return WORLD4_LEVELS[index] ?? WORLD4_LEVELS[0];
}

export function getWorld4LevelCount(): number {
  return WORLD4_LEVELS.length;
}

export function isWorld4ComingSoonLevel(level: number): boolean {
  return WORLD4_COMING_SOON.some((entry) => entry.level === level);
}

export function getWorld4ComingSoon(level: number): World4ComingSoonMeta | undefined {
  return WORLD4_COMING_SOON.find((entry) => entry.level === level);
}
