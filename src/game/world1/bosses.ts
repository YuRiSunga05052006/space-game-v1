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
  /** Spread in degrees for fan-style patterns. */
  spreadDeg?: number;
  /** Shot count override where applicable. */
  count?: number;
}

export interface BossDefinition {
  level: number;
  themeId: string;
  bossName: string;
  baseHealth: number;
  bodyDamage: number;
  fireCooldown: number;
  velocityY: number;
  fanEvery: number;
  fanSpreadDeg: number;
  fanCount: number;
  /** Horizontal drift speed for weaving bosses. */
  driftX: number;
  points: number;
  special: BossSpecialConfig;
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = {
  1: {
    level: 1,
    themeId: 'earth',
    bossName: 'Orbital Sentinel',
    baseHealth: 120,
    bodyDamage: 6,
    fireCooldown: 2200,
    velocityY: 52,
    fanEvery: 0,
    fanSpreadDeg: 0,
    fanCount: 0,
    driftX: 0,
    points: 500,
    special: { name: 'Orbital Death Beam', cooldownMs: 9000, chargeMs: 1200, pattern: 'beam' },
  },
  2: {
    level: 2,
    themeId: 'moon',
    bossName: 'Lunar Crawler',
    baseHealth: 140,
    bodyDamage: 6,
    fireCooldown: 1600,
    velocityY: 55,
    fanEvery: 2,
    fanSpreadDeg: 14,
    fanCount: 3,
    driftX: 35,
    points: 600,
    special: { name: 'Tri-Crawler Strike', cooldownMs: 8500, chargeMs: 1000, pattern: 'fan', spreadDeg: 28, count: 3 },
  },
  3: {
    level: 3,
    themeId: 'venus',
    bossName: 'Venusian Swarm Queen',
    baseHealth: 160,
    bodyDamage: 7,
    fireCooldown: 1400,
    velocityY: 56,
    fanEvery: 2,
    fanSpreadDeg: 22,
    fanCount: 4,
    driftX: 0,
    points: 700,
    special: { name: 'Swarm Annihilation', cooldownMs: 8000, chargeMs: 1100, pattern: 'ring', count: 8 },
  },
  4: {
    level: 4,
    themeId: 'mercury',
    bossName: 'Solar Flare Golem',
    baseHealth: 190,
    bodyDamage: 7,
    fireCooldown: 1500,
    velocityY: 58,
    fanEvery: 2,
    fanSpreadDeg: 40,
    fanCount: 5,
    driftX: 0,
    points: 800,
    special: { name: 'Solar Core Burst', cooldownMs: 8200, chargeMs: 1300, pattern: 'solarFan', spreadDeg: 50, count: 5 },
  },
  5: {
    level: 5,
    themeId: 'mars',
    bossName: 'Martian War Titan',
    baseHealth: 240,
    bodyDamage: 8,
    fireCooldown: 1300,
    velocityY: 62,
    fanEvery: 2,
    fanSpreadDeg: 26,
    fanCount: 7,
    driftX: 25,
    points: 1000,
    special: { name: 'Titan Obliterator', cooldownMs: 7500, chargeMs: 1400, pattern: 'tripleLine' },
  },
  6: {
    level: 6,
    themeId: 'beltEntry',
    bossName: 'Belt Marauder',
    baseHealth: 176,
    bodyDamage: 7,
    fireCooldown: 1800,
    velocityY: 60,
    fanEvery: 3,
    fanSpreadDeg: 12,
    fanCount: 3,
    driftX: 45,
    points: 1100,
    special: { name: 'Belt Sniper Shot', cooldownMs: 7000, chargeMs: 1500, pattern: 'sniper' },
  },
  7: {
    level: 7,
    themeId: 'vesta',
    bossName: 'Vesta Crusher',
    baseHealth: 182,
    bodyDamage: 8,
    fireCooldown: 1550,
    velocityY: 61,
    fanEvery: 2,
    fanSpreadDeg: 18,
    fanCount: 4,
    driftX: 50,
    points: 1200,
    special: { name: 'Crusher Impact', cooldownMs: 7800, chargeMs: 1200, pattern: 'heavyTriple' },
  },
  8: {
    level: 8,
    themeId: 'pallas',
    bossName: 'Pallas Weaver',
    baseHealth: 188,
    bodyDamage: 8,
    fireCooldown: 1450,
    velocityY: 63,
    fanEvery: 2,
    fanSpreadDeg: 30,
    fanCount: 5,
    driftX: 55,
    points: 1300,
    special: { name: 'Weaver Nova', cooldownMs: 7600, chargeMs: 1100, pattern: 'cross' },
  },
  9: {
    level: 9,
    themeId: 'ceres',
    bossName: 'Ceres Guardian',
    baseHealth: 196,
    bodyDamage: 8,
    fireCooldown: 1400,
    velocityY: 64,
    fanEvery: 2,
    fanSpreadDeg: 24,
    fanCount: 6,
    driftX: 30,
    points: 1400,
    special: { name: 'Guardian Judgment', cooldownMs: 7200, chargeMs: 1300, pattern: 'converge', count: 5 },
  },
  10: {
    level: 10,
    themeId: 'beltFinale',
    bossName: 'Belt Overlord',
    baseHealth: 320,
    bodyDamage: 9,
    fireCooldown: 1100,
    velocityY: 66,
    fanEvery: 2,
    fanSpreadDeg: 32,
    fanCount: 9,
    driftX: 40,
    points: 1600,
    special: { name: 'Overlord Extinction', cooldownMs: 6500, chargeMs: 1600, pattern: 'doubleRing', count: 10 },
  },
};

<<<<<<< Updated upstream
export const BOSS_SPECIAL_DAMAGE = 10;

=======
>>>>>>> Stashed changes
export function getBossDefinition(level: number): BossDefinition {
  return BOSS_DEFINITIONS[level] ?? BOSS_DEFINITIONS[1];
}
