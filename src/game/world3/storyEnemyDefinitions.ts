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
  { enemyName: 'Proxima Flare Skiff', themeId: 'proxima', appearanceId: 'proximaSkiff', health: 3, bodyDamage: 7, points: 68, hitRadius: 11, behavior: 'driftLaser', spawnIntervalMs: 3900, maxOnScreen: 3, moveSpeed: 62, fireCooldownMs: 2500 },
  { enemyName: 'Alpha Centauri Twin Scout', themeId: 'alphaCentauri', appearanceId: 'alphaScout', health: 3, bodyDamage: 7, points: 70, hitRadius: 11, behavior: 'homing', spawnIntervalMs: 3800, maxOnScreen: 3, moveSpeed: 100 },
  { enemyName: "Barnard's Drift Cutter", themeId: 'barnard', appearanceId: 'barnardCutter', health: 3, bodyDamage: 7, points: 72, hitRadius: 11, behavior: 'zigzagDive', spawnIntervalMs: 3700, maxOnScreen: 3, moveSpeed: 118 },
  { enemyName: 'Luhman Brown Probe', themeId: 'luhman', appearanceId: 'luhmanProbe', health: 3, bodyDamage: 8, points: 74, hitRadius: 12, behavior: 'playerDive', spawnIntervalMs: 3600, maxOnScreen: 3, moveSpeed: 148 },
  { enemyName: 'Wolf 359 Flare Striker', themeId: 'wolf359', appearanceId: 'wolfStriker', health: 4, bodyDamage: 8, points: 76, hitRadius: 12, behavior: 'hybridHunter', spawnIntervalMs: 3500, maxOnScreen: 3, moveSpeed: 88, fireCooldownMs: 3000 },
  { enemyName: 'Sirius A Light Raider', themeId: 'sirius', appearanceId: 'siriusRaider', health: 4, bodyDamage: 8, points: 80, hitRadius: 12, behavior: 'lateralLaser', spawnIntervalMs: 3400, maxOnScreen: 3, moveSpeed: 50, fireCooldownMs: 2700, spreadDeg: 14, shotCount: 2 },
  { enemyName: 'Epsilon Debris Skimmer', themeId: 'epsilonEridani', appearanceId: 'epsilonSkimmer', health: 4, bodyDamage: 8, points: 82, hitRadius: 12, behavior: 'spreadFire', spawnIntervalMs: 3300, maxOnScreen: 3, moveSpeed: 44, fireCooldownMs: 2900, spreadDeg: 18, shotCount: 3 },
  { enemyName: 'Procyon White Dart', themeId: 'procyon', appearanceId: 'procyonDart', health: 4, bodyDamage: 8, points: 84, hitRadius: 11, behavior: 'playerDive', spawnIntervalMs: 3200, maxOnScreen: 3, moveSpeed: 152 },
  { enemyName: 'Van Maanen Ghost Skiff', themeId: 'vanMaanen', appearanceId: 'vanMaanenGhost', health: 4, bodyDamage: 9, points: 86, hitRadius: 12, behavior: 'patrolDash', spawnIntervalMs: 3100, maxOnScreen: 3, moveSpeed: 68 },
  { enemyName: 'Altair Spin Blade', themeId: 'altair', appearanceId: 'altairBlade', health: 4, bodyDamage: 9, points: 88, hitRadius: 12, behavior: 'fanFire', spawnIntervalMs: 3000, maxOnScreen: 2, moveSpeed: 40, fireCooldownMs: 2600, spreadDeg: 12, shotCount: 5 },
  { enemyName: 'Vega Pole Skimmer', themeId: 'vega', appearanceId: 'vegaSkimmer', health: 4, bodyDamage: 9, points: 90, hitRadius: 12, behavior: 'driftLaser', spawnIntervalMs: 2900, maxOnScreen: 3, moveSpeed: 58, fireCooldownMs: 2400 },
  { enemyName: 'Pollux Orange Leech', themeId: 'pollux', appearanceId: 'polluxLeech', health: 5, bodyDamage: 9, points: 94, hitRadius: 13, behavior: 'homing', spawnIntervalMs: 2800, maxOnScreen: 3, moveSpeed: 108 },
  { enemyName: 'Arcturus K Giant Hunter', themeId: 'arcturus', appearanceId: 'arcturusHunter', health: 5, bodyDamage: 9, points: 96, hitRadius: 13, behavior: 'hybridHunter', spawnIntervalMs: 2700, maxOnScreen: 3, moveSpeed: 82, fireCooldownMs: 2800 },
  { enemyName: 'TRAPPIST Planet Hopper', themeId: 'trappist', appearanceId: 'trappistHopper', health: 5, bodyDamage: 10, points: 98, hitRadius: 12, behavior: 'zigzagDive', spawnIntervalMs: 2600, maxOnScreen: 3, moveSpeed: 122 },
  { enemyName: 'Capella Binary Weaver', themeId: 'capella', appearanceId: 'capellaWeaver', health: 5, bodyDamage: 10, points: 100, hitRadius: 13, behavior: 'fanFire', spawnIntervalMs: 2500, maxOnScreen: 2, moveSpeed: 36, fireCooldownMs: 2500, spreadDeg: 14, shotCount: 5 },
  { enemyName: 'Alderamin Delta Stalker', themeId: 'alderamin', appearanceId: 'alderaminStalker', health: 5, bodyDamage: 10, points: 102, hitRadius: 13, behavior: 'lateralLaser', spawnIntervalMs: 2400, maxOnScreen: 2, moveSpeed: 46, fireCooldownMs: 2600, spreadDeg: 16, shotCount: 2 },
  { enemyName: 'Castor Sextuple Phantom', themeId: 'castor', appearanceId: 'castorPhantom', health: 5, bodyDamage: 10, points: 104, hitRadius: 13, behavior: 'patrolDash', spawnIntervalMs: 2300, maxOnScreen: 3, moveSpeed: 72 },
  { enemyName: 'Aldebaran Red Herald', themeId: 'aldebaran', appearanceId: 'aldebaranHerald', health: 6, bodyDamage: 11, points: 110, hitRadius: 14, behavior: 'spreadFire', spawnIntervalMs: 2200, maxOnScreen: 3, moveSpeed: 40, fireCooldownMs: 2800, spreadDeg: 22, shotCount: 4 },
];

export const STORY_ENEMY_DEFINITIONS: Record<number, StoryEnemyDefinition> = Object.fromEntries(
  ENEMIES.map((enemy, i) => {
    const level = 21 + i;
    return [level, { ...enemy, level, textureKey: `story-enemy-w3-${enemy.themeId}` }];
  }),
);

export function getStoryEnemyDefinition(level: number): StoryEnemyDefinition {
  return STORY_ENEMY_DEFINITIONS[level] ?? STORY_ENEMY_DEFINITIONS[21];
}
