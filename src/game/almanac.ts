import {
  SPIDER_BODY_DAMAGE,
  SPIDER_HEALTH,
  SPIDER_POINTS,
} from './entities/SpiderShip';
import {
  SEEKER_BODY_DAMAGE,
  SEEKER_HEALTH,
  SEEKER_POINTS,
} from './entities/SeekerDrone';
import {
  WASP_BODY_DAMAGE,
  WASP_HEALTH,
  WASP_POINTS,
} from './entities/KamikazeWasp';
import {
  TURRET_BODY_DAMAGE,
  TURRET_HEALTH,
  TURRET_POINTS,
} from './entities/PlasmaTurret';
import { ASTEROID_DAMAGE, ASTEROID_DATA, GOLD_ASTEROID_HEALTH, GOLD_ASTEROID_TEXTURES, type AsteroidSize } from './entities/Asteroid';
import { COMET_DAMAGE, COMET_POINTS, GOLD_COMET_POINTS } from './entities/Comet';
import { getGoldAsteroidCoinReward, getGoldCometCoinReward } from './coinDrops';
import { BOSS_DEFINITIONS as WORLD1_BOSSES } from './world1/bosses';
import { BOSS_DEFINITIONS as WORLD2_BOSSES } from './world2/bosses';
import { STORY_ENEMY_DEFINITIONS as WORLD1_STORY_ENEMIES, type StoryEnemyBehavior } from './world1/storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS as WORLD2_STORY_ENEMIES } from './world2/storyEnemyDefinitions';
import { getStoryEnemyUnlockScore, getSurvivalBossUnlockScore } from './survivalSpawn';
import { isWorld2Unlocked } from './worldProgress';

export type AlmanacCategory = 'asteroid' | 'goldAsteroid' | 'storyEnemy' | 'enemy' | 'boss' | 'comet' | 'goldComet';

export interface AlmanacEntry {
  id: string;
  category: AlmanacCategory;
  name: string;
  textureKey: string;
  textureScale?: number;
  subtitle?: string;
  description: string;
  stats: string;
  worldGated?: boolean;
}

const ASTEROID_NAMES: Record<AsteroidSize, string> = {
  lg: 'Large Asteroid',
  md: 'Medium Asteroid',
  sm: 'Small Asteroid',
};

const ASTEROID_DESCRIPTIONS: Record<AsteroidSize, string> = {
  lg: 'Slow, massive rock. Takes multiple hits to destroy.',
  md: 'Mid-sized drifting hazard with moderate speed.',
  sm: 'Fast fragment. Easy to break but dangerous on contact.',
};

const ASTEROID_SCALES: Record<AsteroidSize, number> = {
  lg: 1.15,
  md: 1,
  sm: 0.85,
};

function buildAsteroidEntries(): AlmanacEntry[] {
  const sizes: AsteroidSize[] = ['lg', 'md', 'sm'];
  return sizes.map((size) => {
    const data = ASTEROID_DATA[size];
    return {
      id: `asteroid-${size}`,
      category: 'asteroid',
      name: ASTEROID_NAMES[size],
      textureKey: data.texture,
      textureScale: ASTEROID_SCALES[size],
      description: ASTEROID_DESCRIPTIONS[size],
      stats: `HP ${data.health} · DMG ${ASTEROID_DAMAGE[size]} · ${data.points} pts`,
    };
  });
}

function buildGoldAsteroidEntries(): AlmanacEntry[] {
  const sizes: AsteroidSize[] = ['lg', 'md', 'sm'];
  const names: Record<AsteroidSize, string> = {
    lg: 'Large Gold Asteroid',
    md: 'Medium Gold Asteroid',
    sm: 'Small Gold Asteroid',
  };

  return sizes.map((size) => {
    const data = ASTEROID_DATA[size];
    const coins = getGoldAsteroidCoinReward(size);
    return {
      id: `gold-asteroid-${size}`,
      category: 'goldAsteroid',
      name: names[size],
      textureKey: GOLD_ASTEROID_TEXTURES[size],
      textureScale: ASTEROID_SCALES[size],
      description: 'Rare golden rock. Destroy with lasers or by ramming it to earn coins.',
      stats: `HP ${GOLD_ASTEROID_HEALTH[size]} · DMG ${ASTEROID_DAMAGE[size]} · ${data.points} pts · +${coins} coins`,
    };
  });
}

const SURVIVAL_ENEMY_DESCRIPTION_SUFFIX = ' Generic survival enemy — unlocks as your score rises.';

const STORY_SURVIVAL_SUFFIX = ' Also unlocks in Survival mode at higher scores.';

const ENEMY_ENTRIES: AlmanacEntry[] = [
  {
    id: 'enemy-spider',
    category: 'enemy',
    name: 'Spider Ship',
    textureKey: 'spider-ship',
    textureScale: 1.1,
    subtitle: 'Survival · 1000+ score',
    description: `Eight-legged raider that fires aimed lasers.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${SPIDER_HEALTH} · DMG ${SPIDER_BODY_DAMAGE} · ${SPIDER_POINTS} pts`,
  },
  {
    id: 'enemy-seeker',
    category: 'enemy',
    name: 'Seeker Drone',
    textureKey: 'seeker-drone',
    subtitle: 'Survival · 2000+ score',
    description: `Homing drone that accelerates toward your ship.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${SEEKER_HEALTH} · DMG ${SEEKER_BODY_DAMAGE} · ${SEEKER_POINTS} pts`,
  },
  {
    id: 'enemy-wasp',
    category: 'enemy',
    name: 'Kamikaze Wasp',
    textureKey: 'kamikaze-wasp',
    subtitle: 'Survival · 4000+ score',
    description: `Zigzagging dive bomber built for ram attacks.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${WASP_HEALTH} · DMG ${WASP_BODY_DAMAGE} · ${WASP_POINTS} pts`,
  },
  {
    id: 'enemy-turret',
    category: 'enemy',
    name: 'Plasma Turret',
    textureKey: 'plasma-turret',
    subtitle: 'Survival · 5000+ score',
    description: `Slow-floating gun platform with triple-spread shots.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${TURRET_HEALTH} · DMG ${TURRET_BODY_DAMAGE} · ${TURRET_POINTS} pts`,
  },
];

const STORY_BEHAVIOR_DESCRIPTIONS: Record<StoryEnemyBehavior, string> = {
  driftLaser: 'Drifts inward and fires aimed lasers.',
  homing: 'Homing pursuer that accelerates toward your ship.',
  zigzagDive: 'Zigzagging dive bomber built for ram attacks.',
  playerDive: 'Launches in a straight rush aimed at your position.',
  lateralLaser: 'Enters from the side and fires spread shots.',
  spreadFire: 'Slow floater that fires a three-shot spread.',
  fanFire: 'Weaver platform that fires a wide fan of lasers.',
  patrolDash: 'Patrols slowly, then dashes at your ship.',
  hybridHunter: 'Chases your ship and fires periodic lasers.',
};

function buildStoryEnemyEntries(
  definitions: Record<number, { level: number; enemyName: string; textureKey: string; health: number; bodyDamage: number; points: number; behavior: StoryEnemyBehavior }>,
  worldId: string,
  worldLabel: string,
): AlmanacEntry[] {
  return Object.values(definitions)
    .sort((a, b) => a.level - b.level)
    .map((enemy) => {
      const unlockScore = getStoryEnemyUnlockScore(enemy.level, worldId);
      return {
        id: `story-enemy-${worldId}-${enemy.level}`,
        category: 'storyEnemy' as const,
        name: enemy.enemyName,
        textureKey: enemy.textureKey,
        textureScale: 1,
        subtitle: `${worldLabel} L${enemy.level} · Survival ${unlockScore}+ score`,
        description: `${STORY_BEHAVIOR_DESCRIPTIONS[enemy.behavior]} Story levels use this enemy exclusively.${STORY_SURVIVAL_SUFFIX}`,
        stats: `HP ${enemy.health} · DMG ${enemy.bodyDamage} · ${enemy.points} pts`,
        worldGated: worldId === 'world2',
      };
    });
}

function buildBossEntries(
  definitions: Record<number, { level: number; bossName: string; textureKey: string; baseScale?: number; baseHealth: number; bodyDamage: number; points: number; special: { name: string } }>,
  worldId: string,
  worldLabel: string,
): AlmanacEntry[] {
  return Object.values(definitions)
    .sort((a, b) => a.level - b.level)
    .map((boss) => {
      const survivalUnlock = getSurvivalBossUnlockScore(boss.level, worldId);
      return {
        id: `boss-${worldId}-${boss.level}`,
        category: 'boss' as const,
        name: boss.bossName,
        textureKey: boss.textureKey,
        textureScale: boss.baseScale ?? 1,
        subtitle: `${worldLabel} L${boss.level} · Survival ${survivalUnlock}+ score`,
        description: `Special: ${boss.special.name}. Story: defeating ends the level. Survival: awards points and coins, then the run continues.`,
        stats: `HP ${boss.baseHealth} · DMG ${boss.bodyDamage} · ${boss.points} pts`,
        worldGated: worldId === 'world2',
      };
    });
}

function buildCometEntries(): AlmanacEntry[] {
  const goldCoins = getGoldCometCoinReward();
  return [
    {
      id: 'comet-normal',
      category: 'comet',
      name: 'Comet',
      textureKey: 'comet',
      textureScale: 1,
      subtitle: 'Story L16+ · World 2 Survival',
      description: 'Fast icy hazard with a glowing tail. Appears from Kuiper Belt onward.',
      stats: `DMG ${COMET_DAMAGE} · ${COMET_POINTS} pts`,
      worldGated: true,
    },
    {
      id: 'comet-gold',
      category: 'goldComet',
      name: 'Gold Comet',
      textureKey: 'comet-gold',
      textureScale: 1,
      subtitle: 'Story L16+ · World 2 Survival',
      description: 'Rare golden comet. Destroy to earn bonus coins.',
      stats: `DMG ${COMET_DAMAGE} · ${GOLD_COMET_POINTS} pts · +${goldCoins} coins`,
      worldGated: true,
    },
  ];
}

export const ALMANAC_ENTRIES: AlmanacEntry[] = [
  ...buildAsteroidEntries(),
  ...buildGoldAsteroidEntries(),
  ...buildStoryEnemyEntries(WORLD1_STORY_ENEMIES, 'world1', 'Story W1'),
  ...buildStoryEnemyEntries(WORLD2_STORY_ENEMIES, 'world2', 'Story W2'),
  ...ENEMY_ENTRIES,
  ...buildBossEntries(WORLD1_BOSSES, 'world1', 'Story W1'),
  ...buildBossEntries(WORLD2_BOSSES, 'world2', 'Story W2'),
  ...buildCometEntries(),
];

export const ALMANAC_SECTIONS: { label: string; category: AlmanacCategory }[] = [
  { label: 'ASTEROIDS', category: 'asteroid' },
  { label: 'GOLD ASTEROIDS', category: 'goldAsteroid' },
  { label: 'STORY ENEMIES', category: 'storyEnemy' },
  { label: 'SURVIVAL ENEMIES', category: 'enemy' },
  { label: 'BOSSES', category: 'boss' },
  { label: 'COMETS', category: 'comet' },
  { label: 'GOLD COMETS', category: 'goldComet' },
];

export function isAlmanacEntryVisible(entry: AlmanacEntry): boolean {
  if (!entry.worldGated) return true;
  return isWorld2Unlocked();
}

export function getVisibleAlmanacEntries(): AlmanacEntry[] {
  return ALMANAC_ENTRIES.filter(isAlmanacEntryVisible);
}

export function getVisibleAlmanacSections(): { label: string; category: AlmanacCategory }[] {
  return ALMANAC_SECTIONS.filter((section) =>
    getVisibleAlmanacEntries().some((entry) => entry.category === section.category),
  );
}
