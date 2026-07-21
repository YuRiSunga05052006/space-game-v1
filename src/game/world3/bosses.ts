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

export type BossTier = 'normal' | 'mid' | 'finale';

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
  { name: 'Stellar Lance', cooldownMs: 7500, chargeMs: 1200, pattern: 'beam' },
  { name: 'Binary Ring', cooldownMs: 7400, chargeMs: 1100, pattern: 'ring', count: 8 },
  { name: 'Flare Surge', cooldownMs: 7300, chargeMs: 1200, pattern: 'fan', spreadDeg: 30, count: 5 },
  { name: 'Cross Nebula', cooldownMs: 7200, chargeMs: 1300, pattern: 'cross' },
  { name: 'Triple Nova', cooldownMs: 7100, chargeMs: 1400, pattern: 'tripleLine' },
  { name: 'Solar Fan Burst', cooldownMs: 7000, chargeMs: 1200, pattern: 'solarFan', spreadDeg: 40, count: 6 },
  { name: 'Convergence Beam', cooldownMs: 6900, chargeMs: 1300, pattern: 'converge', count: 6 },
  { name: 'Void Sniper', cooldownMs: 6800, chargeMs: 1400, pattern: 'sniper' },
  { name: 'Heavy Shard Barrage', cooldownMs: 6700, chargeMs: 1100, pattern: 'heavyTriple' },
];

const APPEARANCE_IDS: BossAppearanceId[] = [
  'proximaRaider', 'alphaWarden', 'barnardHunter', 'luhmanTyrant', 'wolfStriker',
  'siriusTyrant', 'epsilonSentinel', 'procyonGuardian', 'vanMaanenPhantom', 'altairSpinner',
  'vegaDancer', 'polluxGiant', 'arcturusWarden', 'trappistOverlord', 'capellaReaver',
  'alderaminSentinel', 'castorWeaver', 'aldebaranColossus',
];

const TIERS: BossTier[] = [
  'normal', 'normal', 'normal', 'normal', 'normal', 'mid',
  'normal', 'normal', 'normal', 'normal', 'normal', 'mid',
  'normal', 'normal', 'normal', 'normal', 'normal', 'finale',
];

function buildBoss(level: number, index: number): BossDefinition {
  const meta = [
    { themeId: 'proxima', bossName: 'Proxima Red Dwarf Raider' },
    { themeId: 'alphaCentauri', bossName: 'Alpha Binary Warden' },
    { themeId: 'barnard', bossName: "Barnard's Runaway Hunter" },
    { themeId: 'luhman', bossName: 'Luhman Brown Dwarf Tyrant' },
    { themeId: 'wolf359', bossName: 'Wolf Flare Striker' },
    { themeId: 'sirius', bossName: 'Sirius Binary Tyrant' },
    { themeId: 'epsilonEridani', bossName: 'Epsilon Dust Sentinel' },
    { themeId: 'procyon', bossName: 'Procyon White Guardian' },
    { themeId: 'vanMaanen', bossName: "Van Maanen's White Phantom" },
    { themeId: 'altair', bossName: 'Altair Rapid Spinner' },
    { themeId: 'vega', bossName: 'Vega Pole Dancer' },
    { themeId: 'pollux', bossName: 'Pollux Orange Giant' },
    { themeId: 'arcturus', bossName: 'Arcturus K Giant Warden' },
    { themeId: 'trappist', bossName: 'TRAPPIST System Overlord' },
    { themeId: 'capella', bossName: 'Capella Binary Reaver' },
    { themeId: 'alderamin', bossName: 'Alderamin Delta Sentinel' },
    { themeId: 'castor', bossName: 'Castor Sextuple Weaver' },
    { themeId: 'aldebaran', bossName: 'Aldebaran Red Colossus' },
  ][index];

  const tier = TIERS[index];
  const baseHp = 400 + index * 8;
  const tierHpMult = tier === 'mid' ? 1.25 : tier === 'finale' ? 1.4 : 1;
  const tierScale = tier === 'mid' ? 1.2 : tier === 'finale' ? 1.4 : 1.05 + index * 0.005;
  const tierPoints = tier === 'mid' ? 2800 : tier === 'finale' ? 3500 : 2300 + index * 50;

  const special = tier === 'finale'
    ? { name: 'Colossus Extinction', cooldownMs: 5800, chargeMs: 1700, pattern: 'doubleRing' as const, count: 14 }
    : SPECIALS[index % SPECIALS.length];

  return {
    level,
    themeId: meta.themeId,
    bossName: meta.bossName,
    textureKey: `boss-ship-w3-${meta.themeId}`,
    appearanceId: APPEARANCE_IDS[index],
    bossTier: tier,
    baseScale: tierScale,
    hitRadius: tier === 'finale' ? 35 : tier === 'mid' ? 31 : 28,
    baseHealth: Math.round(baseHp * tierHpMult),
    bodyDamage: tier === 'finale' ? 13 : tier === 'mid' ? 12 : 11 + Math.floor(index / 6),
    fireCooldown: tier === 'finale' ? 980 : 1400 - index * 15,
    velocityY: 66 + index * 0.5,
    fanEvery: 2,
    fanSpreadDeg: 18 + index,
    fanCount: 4 + Math.floor(index / 3),
    driftX: 30 + (index % 5) * 5,
    points: tierPoints,
    special,
  };
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = Object.fromEntries(
  Array.from({ length: 18 }, (_, i) => {
    const level = 21 + i;
    return [level, buildBoss(level, i)];
  }),
);

export function getBossDefinition(level: number): BossDefinition {
  return BOSS_DEFINITIONS[level] ?? BOSS_DEFINITIONS[21];
}
