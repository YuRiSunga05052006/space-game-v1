import type { StoryEnemyAppearanceId } from './storyEnemyAppearances';

export type StoryEnemyBehavior =
  | 'driftLaser'
  | 'homing'
  | 'zigzagDive'
  | 'playerDive'
  | 'lateralLaser'
  | 'spreadFire'
  | 'fanFire'
  | 'patrolDash'
  | 'hybridHunter';

export interface StoryEnemyDefinition {
  level: number;
  enemyName: string;
  themeId: string;
  textureKey: string;
  appearanceId: StoryEnemyAppearanceId;
  health: number;
  bodyDamage: number;
  points: number;
  hitRadius: number;
  behavior: StoryEnemyBehavior;
  spawnIntervalMs: number;
  maxOnScreen: number;
  moveSpeed: number;
  fireCooldownMs?: number;
  spreadDeg?: number;
  shotCount?: number;
}

export const STORY_ENEMY_DEFINITIONS: Record<number, StoryEnemyDefinition> = {
  11: {
    level: 11,
    enemyName: 'Jovian Swarm Drone',
    themeId: 'jupiter',
    textureKey: 'story-enemy-jupiter',
    appearanceId: 'jovianDrone',
    health: 2,
    bodyDamage: 5,
    points: 38,
    hitRadius: 11,
    behavior: 'driftLaser',
    spawnIntervalMs: 5800,
    maxOnScreen: 3,
    moveSpeed: 60,
    fireCooldownMs: 2600,
  },
  12: {
    level: 12,
    enemyName: 'Ring Fragment Skimmer',
    themeId: 'saturn',
    textureKey: 'story-enemy-saturn',
    appearanceId: 'ringSkimmer',
    health: 2,
    bodyDamage: 5,
    points: 40,
    hitRadius: 11,
    behavior: 'zigzagDive',
    spawnIntervalMs: 5600,
    maxOnScreen: 3,
    moveSpeed: 115,
  },
  13: {
    level: 13,
    enemyName: 'Methane Fog Leech',
    themeId: 'titan',
    textureKey: 'story-enemy-titan',
    appearanceId: 'methaneLeech',
    health: 2,
    bodyDamage: 5,
    points: 42,
    hitRadius: 12,
    behavior: 'homing',
    spawnIntervalMs: 5400,
    maxOnScreen: 3,
    moveSpeed: 95,
  },
  14: {
    level: 14,
    enemyName: 'Axial Ice Dart',
    themeId: 'uranus',
    textureKey: 'story-enemy-uranus',
    appearanceId: 'iceDart',
    health: 2,
    bodyDamage: 6,
    points: 44,
    hitRadius: 10,
    behavior: 'playerDive',
    spawnIntervalMs: 5200,
    maxOnScreen: 3,
    moveSpeed: 145,
  },
  15: {
    level: 15,
    enemyName: 'Triton Hunter',
    themeId: 'neptune',
    textureKey: 'story-enemy-neptune',
    appearanceId: 'tritonHunter',
    health: 3,
    bodyDamage: 6,
    points: 48,
    hitRadius: 12,
    behavior: 'hybridHunter',
    spawnIntervalMs: 5000,
    maxOnScreen: 3,
    moveSpeed: 85,
    fireCooldownMs: 3200,
  },
  16: {
    level: 16,
    enemyName: 'Kuiper Shard Stalker',
    themeId: 'kuiper',
    textureKey: 'story-enemy-kuiper',
    appearanceId: 'kuiperStalker',
    health: 3,
    bodyDamage: 6,
    points: 50,
    hitRadius: 12,
    behavior: 'homing',
    spawnIntervalMs: 4800,
    maxOnScreen: 3,
    moveSpeed: 105,
  },
  17: {
    level: 17,
    enemyName: 'Plutonian Frost Raider',
    themeId: 'pluto',
    textureKey: 'story-enemy-pluto',
    appearanceId: 'frostRaider',
    health: 3,
    bodyDamage: 6,
    points: 52,
    hitRadius: 12,
    behavior: 'lateralLaser',
    spawnIntervalMs: 4700,
    maxOnScreen: 2,
    moveSpeed: 48,
    fireCooldownMs: 2800,
    spreadDeg: 14,
    shotCount: 2,
  },
  18: {
    level: 18,
    enemyName: 'Eris Shadow Weaver',
    themeId: 'eris',
    textureKey: 'story-enemy-eris',
    appearanceId: 'shadowWeaver',
    health: 3,
    bodyDamage: 7,
    points: 55,
    hitRadius: 12,
    behavior: 'fanFire',
    spawnIntervalMs: 4500,
    maxOnScreen: 2,
    moveSpeed: 38,
    fireCooldownMs: 2700,
    spreadDeg: 12,
    shotCount: 5,
  },
  19: {
    level: 19,
    enemyName: 'Sednoid Phantom',
    themeId: 'sedna',
    textureKey: 'story-enemy-sedna',
    appearanceId: 'sednoidPhantom',
    health: 3,
    bodyDamage: 7,
    points: 58,
    hitRadius: 11,
    behavior: 'patrolDash',
    spawnIntervalMs: 4300,
    maxOnScreen: 3,
    moveSpeed: 65,
  },
  20: {
    level: 20,
    enemyName: 'Comet Herald',
    themeId: 'oort',
    textureKey: 'story-enemy-oort',
    appearanceId: 'cometHerald',
    health: 4,
    bodyDamage: 7,
    points: 65,
    hitRadius: 13,
    behavior: 'spreadFire',
    spawnIntervalMs: 4000,
    maxOnScreen: 3,
    moveSpeed: 42,
    fireCooldownMs: 3000,
    spreadDeg: 20,
    shotCount: 4,
  },
};

export function getStoryEnemyDefinition(level: number): StoryEnemyDefinition {
  return STORY_ENEMY_DEFINITIONS[level] ?? STORY_ENEMY_DEFINITIONS[11];
}
