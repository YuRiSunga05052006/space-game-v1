import type { BossAppearanceId } from './bossAppearances';
import type { BossSpecialPattern, BossTier } from '../world3/bosses';

export type { BossSpecialPattern, BossTier };

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
  bossTier?: BossTier;
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

const SPECIALS: BossSpecialConfig[] = [
  { name: 'Ram Lance', cooldownMs: 7200, chargeMs: 1200, pattern: 'beam' },
  { name: 'Crown Ring', cooldownMs: 7100, chargeMs: 1100, pattern: 'ring', count: 8 },
  { name: 'Archer Fan', cooldownMs: 7000, chargeMs: 1200, pattern: 'fan', spreadDeg: 32, count: 5 },
  { name: 'Lion Cross', cooldownMs: 6900, chargeMs: 1300, pattern: 'cross' },
  { name: 'Phoenix Nova', cooldownMs: 6800, chargeMs: 1400, pattern: 'tripleLine' },
  { name: 'Southern Fan', cooldownMs: 6400, chargeMs: 1300, pattern: 'solarFan', spreadDeg: 42, count: 7 },
  { name: 'River Beam', cooldownMs: 6700, chargeMs: 1200, pattern: 'converge', count: 6 },
  { name: 'Demon Sniper', cooldownMs: 6600, chargeMs: 1400, pattern: 'sniper' },
  { name: 'Chain Barrage', cooldownMs: 6500, chargeMs: 1100, pattern: 'heavyTriple' },
  { name: 'Heart Ring', cooldownMs: 6400, chargeMs: 1200, pattern: 'ring', count: 10 },
  { name: 'Crane Lance', cooldownMs: 6300, chargeMs: 1300, pattern: 'beam' },
  { name: 'Dipper Fan', cooldownMs: 5800, chargeMs: 1500, pattern: 'doubleRing', count: 12 },
];

const APPEARANCE_IDS: BossAppearanceId[] = [
  'hamalSentinel',
  'alpheccaWarden',
  'kausArcher',
  'regulusLion',
  'ankaaStriker',
  'acruxTyrant',
  'cursaSentinel',
  'algolDemon',
  'alpheratzWarden',
  'corCaroliGuardian',
  'alnairHunter',
  'aliothTyrant',
];

const TIERS: BossTier[] = [
  'normal', 'normal', 'normal', 'normal', 'normal', 'mid',
  'normal', 'normal', 'normal', 'normal', 'normal', 'mid',
];

function buildBoss(level: number, index: number): BossDefinition {
  const meta = [
    { themeId: 'hamal', bossName: 'Hamal Orange Sentinel' },
    { themeId: 'alphecca', bossName: 'Alphecca Crown Warden' },
    { themeId: 'kausBorealis', bossName: 'Kaus Northern Archer' },
    { themeId: 'regulus', bossName: 'Regulus Lionheart' },
    { themeId: 'ankaa', bossName: 'Ankaa Phoenix Striker' },
    { themeId: 'southernCross', bossName: 'Acrux Southern Tyrant' },
    { themeId: 'cursa', bossName: 'Cursa River Sentinel' },
    { themeId: 'algol', bossName: 'Algol Demon Star' },
    { themeId: 'alpheratz', bossName: 'Alpheratz Chain Warden' },
    { themeId: 'corCaroli', bossName: 'Cor Caroli Heart Guardian' },
    { themeId: 'alnair', bossName: 'Alnair Crane Hunter' },
    { themeId: 'bigDipper', bossName: 'Alioth Dipper Tyrant' },
  ][index];

  const tier = TIERS[index];
  const baseHp = 760 + index * 16;
  const tierHpMult = tier === 'mid' ? 1.25 : 1;
  const tierScale = tier === 'mid' ? 1.22 : 1.08;
  const tierPoints = tier === 'mid' ? 3600 : 2500 + index * 40;

  return {
    level,
    themeId: meta.themeId,
    bossName: meta.bossName,
    textureKey: `boss-ship-w4-${meta.themeId}`,
    appearanceId: APPEARANCE_IDS[index],
    bossTier: tier,
    baseScale: tierScale,
    hitRadius: tier === 'mid' ? 32 : 29,
    baseHealth: Math.round(baseHp * tierHpMult),
    bodyDamage: tier === 'mid' ? 14 : 12,
    fireCooldown: 1300 - index * 12,
    velocityY: 68 + index * 0.4,
    fanEvery: 2,
    fanSpreadDeg: 20 + index,
    fanCount: 5 + Math.floor(index / 3),
    driftX: 32 + (index % 5) * 4,
    points: tierPoints,
    special: SPECIALS[index],
  };
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => {
    const level = 39 + i;
    return [level, buildBoss(level, i)];
  }),
);

export function getBossDefinition(level: number): BossDefinition {
  return BOSS_DEFINITIONS[level] ?? BOSS_DEFINITIONS[39];
}
