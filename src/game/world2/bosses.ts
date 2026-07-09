import type { BossAppearanceId } from './bossAppearances';

export type BossSpecialPattern =
  | 'beam'
  | 'fan'
  | 'ring'
  | 'solarFan'
  | 'tripleLine'
  | 'sniper'
  | 'heavyTriple'
  | 'cross'
  | 'converge'
  | 'doubleRing';

export interface BossSpecialConfig {
  name: string;
  cooldownMs: number;
  chargeMs: number;
  pattern: BossSpecialPattern;
  spreadDeg?: number;
  count?: number;
}

export interface BossDefinition {
  level: number;
  themeId: string;
  bossName: string;
  textureKey: string;
  appearanceId: BossAppearanceId;
  baseScale?: number;
  hitRadius?: number;
  baseHealth: number;
  bodyDamage: number;
  fireCooldown: number;
  velocityY: number;
  fanEvery: number;
  fanSpreadDeg: number;
  fanCount: number;
  driftX: number;
  points: number;
  special: BossSpecialConfig;
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = {
  11: {
    level: 11,
    themeId: 'jupiter',
    bossName: 'Jovian Storm Warden',
    textureKey: 'boss-ship-jupiter',
    appearanceId: 'jovianWarden',
    baseScale: 1.05,
    hitRadius: 27,
    baseHealth: 200,
    bodyDamage: 8,
    fireCooldown: 1700,
    velocityY: 58,
    fanEvery: 2,
    fanSpreadDeg: 16,
    fanCount: 4,
    driftX: 30,
    points: 1200,
    special: { name: 'Storm Lance', cooldownMs: 7800, chargeMs: 1200, pattern: 'beam' },
  },
  12: {
    level: 12,
    themeId: 'saturn',
    bossName: 'Saturn Ring Reaver',
    textureKey: 'boss-ship-saturn',
    appearanceId: 'ringReaver',
    baseScale: 1.05,
    hitRadius: 28,
    baseHealth: 210,
    bodyDamage: 8,
    fireCooldown: 1650,
    velocityY: 59,
    fanEvery: 2,
    fanSpreadDeg: 20,
    fanCount: 5,
    driftX: 40,
    points: 1300,
    special: { name: 'Ring Shredder', cooldownMs: 7600, chargeMs: 1100, pattern: 'ring', count: 8 },
  },
  13: {
    level: 13,
    themeId: 'titan',
    bossName: 'Titan Methane Tyrant',
    textureKey: 'boss-ship-titan',
    appearanceId: 'methaneTyrant',
    baseScale: 1.08,
    hitRadius: 28,
    baseHealth: 220,
    bodyDamage: 8,
    fireCooldown: 1550,
    velocityY: 60,
    fanEvery: 2,
    fanSpreadDeg: 24,
    fanCount: 5,
    driftX: 25,
    points: 1400,
    special: { name: 'Methane Surge', cooldownMs: 7400, chargeMs: 1200, pattern: 'fan', spreadDeg: 32, count: 5 },
  },
  14: {
    level: 14,
    themeId: 'uranus',
    bossName: 'Uranian Tilt Guardian',
    textureKey: 'boss-ship-uranus',
    appearanceId: 'tiltGuardian',
    baseScale: 1.1,
    hitRadius: 29,
    baseHealth: 230,
    bodyDamage: 9,
    fireCooldown: 1500,
    velocityY: 61,
    fanEvery: 2,
    fanSpreadDeg: 28,
    fanCount: 6,
    driftX: 45,
    points: 1500,
    special: { name: 'Axial Crossfire', cooldownMs: 7200, chargeMs: 1300, pattern: 'cross' },
  },
  15: {
    level: 15,
    themeId: 'neptune',
    bossName: 'Neptunian Leviathan',
    textureKey: 'boss-ship-neptune',
    appearanceId: 'neptunianLeviathan',
    baseScale: 1.2,
    hitRadius: 31,
    baseHealth: 300,
    bodyDamage: 9,
    fireCooldown: 1250,
    velocityY: 64,
    fanEvery: 2,
    fanSpreadDeg: 30,
    fanCount: 7,
    driftX: 35,
    points: 1800,
    special: { name: 'Leviathan Crush', cooldownMs: 6800, chargeMs: 1500, pattern: 'tripleLine' },
  },
  16: {
    level: 16,
    themeId: 'kuiper',
    bossName: 'Kuiper Belt Marauder',
    textureKey: 'boss-ship-kuiper',
    appearanceId: 'kuiperMarauder',
    baseScale: 1.08,
    hitRadius: 28,
    baseHealth: 240,
    bodyDamage: 9,
    fireCooldown: 1480,
    velocityY: 62,
    fanEvery: 2,
    fanSpreadDeg: 18,
    fanCount: 5,
    driftX: 50,
    points: 1600,
    special: { name: 'Shard Barrage', cooldownMs: 7000, chargeMs: 1100, pattern: 'heavyTriple' },
  },
  17: {
    level: 17,
    themeId: 'pluto',
    bossName: 'Pluto Dark Sentinel',
    textureKey: 'boss-ship-pluto',
    appearanceId: 'plutoSentinel',
    baseScale: 1.1,
    hitRadius: 29,
    baseHealth: 250,
    bodyDamage: 9,
    fireCooldown: 1420,
    velocityY: 63,
    fanEvery: 2,
    fanSpreadDeg: 22,
    fanCount: 6,
    driftX: 30,
    points: 1700,
    special: { name: 'Frost Convergence', cooldownMs: 6900, chargeMs: 1200, pattern: 'converge', count: 6 },
  },
  18: {
    level: 18,
    themeId: 'eris',
    bossName: 'Eris Void Reaper',
    textureKey: 'boss-ship-eris',
    appearanceId: 'erisReaper',
    baseScale: 1.1,
    hitRadius: 30,
    baseHealth: 260,
    bodyDamage: 10,
    fireCooldown: 1380,
    velocityY: 64,
    fanEvery: 2,
    fanSpreadDeg: 26,
    fanCount: 6,
    driftX: 55,
    points: 1800,
    special: { name: 'Void Sniper', cooldownMs: 6700, chargeMs: 1400, pattern: 'sniper' },
  },
  19: {
    level: 19,
    themeId: 'sedna',
    bossName: 'Sedna Wraith Lord',
    textureKey: 'boss-ship-sedna',
    appearanceId: 'sednaWraith',
    baseScale: 1.12,
    hitRadius: 30,
    baseHealth: 275,
    bodyDamage: 10,
    fireCooldown: 1320,
    velocityY: 65,
    fanEvery: 2,
    fanSpreadDeg: 30,
    fanCount: 7,
    driftX: 40,
    points: 1900,
    special: { name: 'Wraith Nova', cooldownMs: 6600, chargeMs: 1300, pattern: 'solarFan', spreadDeg: 45, count: 6 },
  },
  20: {
    level: 20,
    themeId: 'oort',
    bossName: 'Oort Cloud Sovereign',
    textureKey: 'boss-ship-oort',
    appearanceId: 'oortSovereign',
    baseScale: 1.35,
    hitRadius: 33,
    baseHealth: 380,
    bodyDamage: 11,
    fireCooldown: 1050,
    velocityY: 68,
    fanEvery: 2,
    fanSpreadDeg: 34,
    fanCount: 9,
    driftX: 45,
    points: 2200,
    special: { name: 'Sovereign Extinction', cooldownMs: 6000, chargeMs: 1700, pattern: 'doubleRing', count: 12 },
  },
};

export function getBossDefinition(level: number): BossDefinition {
  return BOSS_DEFINITIONS[level] ?? BOSS_DEFINITIONS[11];
}
