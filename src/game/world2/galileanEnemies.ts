import type { StoryEnemyDefinition } from './storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS } from './storyEnemyDefinitions';

/** Synthetic levels for Galilean moon enemies (outside campaign L11–20). */
export const GALILEAN_MOON_LEVELS = {
  io: 1101,
  europa: 1102,
  ganymede: 1103,
  callisto: 1104,
} as const;

export type GalileanMoonId = keyof typeof GALILEAN_MOON_LEVELS;

export const GALILEAN_SURVIVAL_UNLOCK_SCORES: Record<number, number> = {
  [GALILEAN_MOON_LEVELS.io]: 1500,
  [GALILEAN_MOON_LEVELS.europa]: 2500,
  [GALILEAN_MOON_LEVELS.ganymede]: 3500,
  [GALILEAN_MOON_LEVELS.callisto]: 4500,
};

export const GALILEAN_MOON_ENEMIES: Record<number, StoryEnemyDefinition> = {
  [GALILEAN_MOON_LEVELS.io]: {
    level: GALILEAN_MOON_LEVELS.io,
    enemyName: 'Io Magma Skimmer',
    themeId: 'io',
    textureKey: 'story-enemy-io',
    appearanceId: 'ioMagma',
    health: 2,
    bodyDamage: 6,
    points: 44,
    hitRadius: 11,
    behavior: 'zigzagDive',
    spawnIntervalMs: 5200,
    maxOnScreen: 2,
    moveSpeed: 130,
  },
  [GALILEAN_MOON_LEVELS.europa]: {
    level: GALILEAN_MOON_LEVELS.europa,
    enemyName: 'Europa Ice Drifter',
    themeId: 'europa',
    textureKey: 'story-enemy-europa',
    appearanceId: 'europaIce',
    health: 2,
    bodyDamage: 5,
    points: 42,
    hitRadius: 11,
    behavior: 'driftLaser',
    spawnIntervalMs: 5400,
    maxOnScreen: 2,
    moveSpeed: 55,
    fireCooldownMs: 2400,
  },
  [GALILEAN_MOON_LEVELS.ganymede]: {
    level: GALILEAN_MOON_LEVELS.ganymede,
    enemyName: 'Ganymede Colossus',
    themeId: 'ganymede',
    textureKey: 'story-enemy-ganymede',
    appearanceId: 'ganymedeColossus',
    health: 4,
    bodyDamage: 7,
    points: 55,
    hitRadius: 14,
    behavior: 'hybridHunter',
    spawnIntervalMs: 6000,
    maxOnScreen: 2,
    moveSpeed: 78,
    fireCooldownMs: 2800,
  },
  [GALILEAN_MOON_LEVELS.callisto]: {
    level: GALILEAN_MOON_LEVELS.callisto,
    enemyName: 'Callisto Crater Stalker',
    themeId: 'callisto',
    textureKey: 'story-enemy-callisto',
    appearanceId: 'callistoStalker',
    health: 3,
    bodyDamage: 6,
    points: 48,
    hitRadius: 12,
    behavior: 'homing',
    spawnIntervalMs: 5600,
    maxOnScreen: 2,
    moveSpeed: 70,
  },
};

export function isGalileanMoonLevel(level: number): boolean {
  return level >= GALILEAN_MOON_LEVELS.io && level <= GALILEAN_MOON_LEVELS.callisto;
}

export function getGalileanMoonEnemyDefinition(level: number): StoryEnemyDefinition {
  return GALILEAN_MOON_ENEMIES[level] ?? GALILEAN_MOON_ENEMIES[GALILEAN_MOON_LEVELS.io];
}

/** Enemies that spawn inside the Galilean Moons secret (4 moons + Jovian Swarm Drone). */
export function getGalileanSecretSpawnPool(): StoryEnemyDefinition[] {
  return [
    ...Object.values(GALILEAN_MOON_ENEMIES),
    STORY_ENEMY_DEFINITIONS[11],
  ];
}

export function pickGalileanSecretEnemy(
  countsByLevel: Record<number, number>,
): StoryEnemyDefinition | null {
  const pool = getGalileanSecretSpawnPool().filter(
    (def) => (countsByLevel[def.level] ?? 0) < def.maxOnScreen,
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
