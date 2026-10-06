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

const ENEMIES: Omit<StoryEnemyDefinition, 'level' | 'textureKey'>[] = [
  { enemyName: 'Hamal Orange Skiff', themeId: 'hamal', appearanceId: 'hamalSkiff', health: 7, bodyDamage: 11, points: 114, hitRadius: 14, behavior: 'driftLaser', spawnIntervalMs: 2100, maxOnScreen: 3, moveSpeed: 58, fireCooldownMs: 2300 },
  { enemyName: 'Alphecca Crown Scout', themeId: 'alphecca', appearanceId: 'alpheccaScout', health: 7, bodyDamage: 11, points: 116, hitRadius: 13, behavior: 'homing', spawnIntervalMs: 2050, maxOnScreen: 3, moveSpeed: 104 },
  { enemyName: 'Kaus Northern Skiff', themeId: 'kausBorealis', appearanceId: 'kausSkiff', health: 7, bodyDamage: 11, points: 118, hitRadius: 14, behavior: 'spreadFire', spawnIntervalMs: 2000, maxOnScreen: 3, moveSpeed: 42, fireCooldownMs: 2600, spreadDeg: 18, shotCount: 3 },
  { enemyName: 'Regulus Lion Scout', themeId: 'regulus', appearanceId: 'regulusScout', health: 8, bodyDamage: 12, points: 122, hitRadius: 14, behavior: 'lateralLaser', spawnIntervalMs: 1950, maxOnScreen: 3, moveSpeed: 48, fireCooldownMs: 2400, spreadDeg: 16, shotCount: 2 },
  { enemyName: 'Ankaa Phoenix Skiff', themeId: 'ankaa', appearanceId: 'ankaaSkiff', health: 8, bodyDamage: 12, points: 124, hitRadius: 14, behavior: 'hybridHunter', spawnIntervalMs: 1900, maxOnScreen: 3, moveSpeed: 86, fireCooldownMs: 2600 },
  { enemyName: 'Southern Cross Raider', themeId: 'southernCross', appearanceId: 'southernRaider', health: 8, bodyDamage: 12, points: 130, hitRadius: 13, behavior: 'fanFire', spawnIntervalMs: 1850, maxOnScreen: 4, moveSpeed: 40, fireCooldownMs: 2400, spreadDeg: 16, shotCount: 5 },
  { enemyName: 'Cursa River Skiff', themeId: 'cursa', appearanceId: 'cursaSkiff', health: 8, bodyDamage: 12, points: 128, hitRadius: 13, behavior: 'zigzagDive', spawnIntervalMs: 1800, maxOnScreen: 3, moveSpeed: 120 },
  { enemyName: 'Algol Demon Scout', themeId: 'algol', appearanceId: 'algolScout', health: 8, bodyDamage: 13, points: 132, hitRadius: 14, behavior: 'playerDive', spawnIntervalMs: 1750, maxOnScreen: 3, moveSpeed: 140 },
  { enemyName: 'Alpheratz Chain Scout', themeId: 'alpheratz', appearanceId: 'alpheratzScout', health: 9, bodyDamage: 13, points: 134, hitRadius: 13, behavior: 'patrolDash', spawnIntervalMs: 1700, maxOnScreen: 3, moveSpeed: 70 },
  { enemyName: 'Cor Caroli Heart Scout', themeId: 'corCaroli', appearanceId: 'corCaroliScout', health: 9, bodyDamage: 13, points: 136, hitRadius: 13, behavior: 'driftLaser', spawnIntervalMs: 1650, maxOnScreen: 3, moveSpeed: 56, fireCooldownMs: 2200 },
  { enemyName: 'Alnair Crane Skiff', themeId: 'alnair', appearanceId: 'alnairSkiff', health: 9, bodyDamage: 13, points: 138, hitRadius: 14, behavior: 'spreadFire', spawnIntervalMs: 1600, maxOnScreen: 3, moveSpeed: 44, fireCooldownMs: 2400, spreadDeg: 20, shotCount: 4 },
  { enemyName: 'Big Dipper Raider', themeId: 'bigDipper', appearanceId: 'dipperRaider', health: 9, bodyDamage: 14, points: 146, hitRadius: 14, behavior: 'fanFire', spawnIntervalMs: 1550, maxOnScreen: 4, moveSpeed: 38, fireCooldownMs: 2300, spreadDeg: 18, shotCount: 5 },
];

export const STORY_ENEMY_DEFINITIONS: Record<number, StoryEnemyDefinition> = Object.fromEntries(
  ENEMIES.map((enemy, i) => {
    const level = 39 + i;
    return [level, { ...enemy, level, textureKey: `story-enemy-w4-${enemy.themeId}` }];
  }),
);

export function getStoryEnemyDefinition(level: number): StoryEnemyDefinition {
  return STORY_ENEMY_DEFINITIONS[level] ?? STORY_ENEMY_DEFINITIONS[39];
}
