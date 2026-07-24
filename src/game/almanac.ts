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
import {
  MINE_CARRIER_BLAST_RADIUS,
  MINE_CARRIER_BODY_DAMAGE,
  MINE_CARRIER_HEALTH,
  MINE_CARRIER_POINTS,
} from './entities/MineCarrier';
import { MINE_DATA, type MineVariant } from './entities/Mine';
import { ASTEROID_DAMAGE, ASTEROID_DATA, GOLD_ASTEROID_HEALTH, GOLD_ASTEROID_TEXTURES, type AsteroidSize } from './entities/Asteroid';
import { COMET_DAMAGE, COMET_POINTS, GOLD_COMET_POINTS } from './entities/Comet';
import { getGoldAsteroidCoinReward, getGoldCometCoinReward } from './coinDrops';
import { BOSS_DEFINITIONS as WORLD1_BOSSES } from './world1/bosses';
import { BOSS_DEFINITIONS as WORLD2_BOSSES } from './world2/bosses';
import { BOSS_DEFINITIONS as WORLD3_BOSSES } from './world3/bosses';
import { STORY_ENEMY_DEFINITIONS as WORLD1_STORY_ENEMIES, type StoryEnemyBehavior } from './world1/storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS as WORLD2_STORY_ENEMIES } from './world2/storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS as WORLD3_STORY_ENEMIES } from './world3/storyEnemyDefinitions';
import { getStoryEnemyUnlockScore, getSurvivalBossUnlockScore } from './survivalSpawn';
import { MINE_CARRIER_UNLOCK_SCORE } from './enemies';
import { isWorld2Unlocked, isWorld3Unlocked } from './worldProgress';

export type AlmanacCategory =
  | 'asteroid'
  | 'goldAsteroid'
  | 'storyEnemy'
  | 'enemy'
  | 'boss'
  | 'comet'
  | 'goldComet'
  | 'mine';
export type AlmanacPage = 'shared' | 'world1' | 'world2' | 'world3';

export interface AlmanacEntry {
  id: string;
  category: AlmanacCategory;
  name: string;
  textureKey: string;
  textureScale?: number;
  subtitle?: string;
  description: string;
  stats: string;
  almanacPage: AlmanacPage;
  /** When true, only shown on Shared after World 3 unlock. */
  requiresWorld3?: boolean;
}

export interface AlmanacPageInfo {
  id: AlmanacPage;
  label: string;
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
      almanacPage: 'shared',
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
      almanacPage: 'shared',
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
    almanacPage: 'shared',
  },
  {
    id: 'enemy-seeker',
    category: 'enemy',
    name: 'Seeker Drone',
    textureKey: 'seeker-drone',
    subtitle: 'Survival · 2000+ score',
    description: `Homing drone that accelerates toward your ship.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${SEEKER_HEALTH} · DMG ${SEEKER_BODY_DAMAGE} · ${SEEKER_POINTS} pts`,
    almanacPage: 'shared',
  },
  {
    id: 'enemy-wasp',
    category: 'enemy',
    name: 'Kamikaze Wasp',
    textureKey: 'kamikaze-wasp',
    subtitle: 'Survival · 4000+ score',
    description: `Zigzagging dive bomber built for ram attacks.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${WASP_HEALTH} · DMG ${WASP_BODY_DAMAGE} · ${WASP_POINTS} pts`,
    almanacPage: 'shared',
  },
  {
    id: 'enemy-turret',
    category: 'enemy',
    name: 'Plasma Turret',
    textureKey: 'plasma-turret',
    subtitle: 'Survival · 5000+ score',
    description: `Slow-floating gun platform with triple-spread shots.${SURVIVAL_ENEMY_DESCRIPTION_SUFFIX}`,
    stats: `HP ${TURRET_HEALTH} · DMG ${TURRET_BODY_DAMAGE} · ${TURRET_POINTS} pts`,
    almanacPage: 'shared',
  },
  {
    id: 'enemy-mine-carrier',
    category: 'enemy',
    name: 'Mine Carrier',
    textureKey: 'mine-carrier',
    textureScale: 1.1,
    subtitle: `Story W3 L27+ · Survival W3 ${MINE_CARRIER_UNLOCK_SCORE}+ score`,
    description:
      'Does not fire lasers. Rams explode in a blast that damages you, enemies, obstacles, and can chain mines and other carriers. Defeating one leaves a Blue Mine behind.',
    stats: `HP ${MINE_CARRIER_HEALTH} · Blast DMG ${MINE_CARRIER_BODY_DAMAGE} · R ${MINE_CARRIER_BLAST_RADIUS} · ${MINE_CARRIER_POINTS} pts`,
    almanacPage: 'shared',
    requiresWorld3: true,
  },
];

const MINE_NAMES: Record<MineVariant, string> = {
  gray: 'Gray Mine',
  blue: 'Blue Mine',
  red: 'Red Mine',
  purple: 'Purple Mine',
};

const MINE_SUBTITLES: Record<MineVariant, string> = {
  gray: 'Story W3 L21+ · All Survival · ISS & Dawn',
  blue: 'Story W3 L21+ · All Survival · ISS & Dawn',
  red: 'Survival W3 · 6000+ score',
  purple: 'Survival W3 · 9000+ score',
};

const MINE_DESCRIPTIONS: Record<MineVariant, string> = {
  gray:
    'Small naval mine. Immune to lasers. Player collision detonates it, damaging you, enemies, and obstacles, and can chain other mines (not Mine Carriers).',
  blue:
    'Small naval mine. Immune to lasers. Player collision pushes it instead of detonating. Explodes on enemy contact — damages enemies and obstacles and can chain mines/carriers, but never damages you.',
  red:
    'Medium naval mine. Immune to lasers. Player collision detonates a moderate blast that can chain mines and Mine Carriers. Does not appear in Story Mode yet.',
  purple:
    'Large naval mine. Immune to lasers. Player collision detonates a massive blast that can chain mines and Mine Carriers. Does not appear in Story Mode yet.',
};

function buildMineEntries(): AlmanacEntry[] {
  const variants: MineVariant[] = ['gray', 'blue', 'red', 'purple'];
  return variants.map((variant) => {
    const data = MINE_DATA[variant];
    const dmgLabel = data.damagesPlayer ? `DMG ${data.playerDamage}` : 'DMG 0 (safe)';
    const isWorld3Exclusive = variant === 'red' || variant === 'purple';
    return {
      id: `mine-${variant}`,
      category: 'mine' as const,
      name: MINE_NAMES[variant],
      textureKey: data.texture,
      textureScale: variant === 'purple' ? 0.7 : variant === 'red' ? 0.85 : 1.1,
      subtitle: MINE_SUBTITLES[variant],
      description: MINE_DESCRIPTIONS[variant],
      stats: `${dmgLabel} · R ${data.blastRadius} · ${data.points} pts`,
      almanacPage: 'shared' as const,
      // Gray/Blue always listed; Red/Purple unlock with World 3.
      requiresWorld3: isWorld3Exclusive,
    };
  });
}

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
  worldId: AlmanacPage,
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
        almanacPage: worldId,
      };
    });
}

function buildBossEntries(
  definitions: Record<number, { level: number; bossName: string; textureKey: string; baseScale?: number; baseHealth: number; bodyDamage: number; points: number; special: { name: string } }>,
  worldId: AlmanacPage,
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
        almanacPage: worldId,
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
      subtitle: 'Story L16+ · World 2+ Survival · All World 3+',
      description: 'Fast icy hazard with a glowing tail. From Kuiper Belt onward in World 2; all levels in World 3+.',
      stats: `DMG ${COMET_DAMAGE} · ${COMET_POINTS} pts`,
      almanacPage: 'shared',
    },
    {
      id: 'comet-gold',
      category: 'goldComet',
      name: 'Gold Comet',
      textureKey: 'comet-gold',
      textureScale: 1,
      subtitle: 'Story L16+ · World 2+ Survival · All World 3+',
      description: 'Rare golden comet. Destroy to earn bonus coins.',
      stats: `DMG ${COMET_DAMAGE} · ${GOLD_COMET_POINTS} pts · +${goldCoins} coins`,
      almanacPage: 'shared',
    },
  ];
}

export const ALMANAC_ENTRIES: AlmanacEntry[] = [
  ...buildAsteroidEntries(),
  ...buildGoldAsteroidEntries(),
  ...ENEMY_ENTRIES,
  ...buildMineEntries(),
  ...buildCometEntries(),
  ...buildStoryEnemyEntries(WORLD1_STORY_ENEMIES, 'world1', 'Story W1'),
  ...buildBossEntries(WORLD1_BOSSES, 'world1', 'Story W1'),
  ...buildStoryEnemyEntries(WORLD2_STORY_ENEMIES, 'world2', 'Story W2'),
  ...buildBossEntries(WORLD2_BOSSES, 'world2', 'Story W2'),
  ...buildStoryEnemyEntries(WORLD3_STORY_ENEMIES, 'world3', 'Story W3'),
  ...buildBossEntries(WORLD3_BOSSES, 'world3', 'Story W3'),
];

const PAGE_SECTIONS: Record<AlmanacPage, { label: string; category: AlmanacCategory }[]> = {
  shared: [
    { label: 'ASTEROIDS', category: 'asteroid' },
    { label: 'GOLD ASTEROIDS', category: 'goldAsteroid' },
    { label: 'SURVIVAL ENEMIES', category: 'enemy' },
    { label: 'MINES', category: 'mine' },
    { label: 'COMETS', category: 'comet' },
    { label: 'GOLD COMETS', category: 'goldComet' },
  ],
  world1: [
    { label: 'STORY ENEMIES', category: 'storyEnemy' },
    { label: 'BOSSES', category: 'boss' },
  ],
  world2: [
    { label: 'STORY ENEMIES', category: 'storyEnemy' },
    { label: 'BOSSES', category: 'boss' },
  ],
  world3: [
    { label: 'STORY ENEMIES', category: 'storyEnemy' },
    { label: 'BOSSES', category: 'boss' },
  ],
};

export const ALMANAC_PAGES: AlmanacPageInfo[] = [
  { id: 'shared', label: 'SHARED' },
  { id: 'world1', label: 'WORLD 1' },
  { id: 'world2', label: 'WORLD 2' },
  { id: 'world3', label: 'WORLD 3' },
];

export function isAlmanacPageUnlocked(page: AlmanacPage): boolean {
  if (page === 'shared' || page === 'world1') return true;
  if (page === 'world2') return isWorld2Unlocked();
  if (page === 'world3') return isWorld3Unlocked();
  return false;
}

export function getVisibleEntriesForPage(page: AlmanacPage): AlmanacEntry[] {
  if (!isAlmanacPageUnlocked(page)) return [];
  const world3Unlocked = isWorld3Unlocked();
  return ALMANAC_ENTRIES.filter((entry) => {
    if (entry.almanacPage !== page) return false;
    if (entry.requiresWorld3 && !world3Unlocked) return false;
    return true;
  });
}

export function getVisibleSectionsForPage(page: AlmanacPage): { label: string; category: AlmanacCategory }[] {
  const entries = getVisibleEntriesForPage(page);
  return PAGE_SECTIONS[page].filter((section) =>
    entries.some((entry) => entry.category === section.category),
  );
}

/** @deprecated Use getVisibleEntriesForPage */
export function getVisibleAlmanacEntries(): AlmanacEntry[] {
  return ALMANAC_PAGES.flatMap((page) => getVisibleEntriesForPage(page.id));
}

/** @deprecated Use getVisibleSectionsForPage */
export function getVisibleAlmanacSections(): { label: string; category: AlmanacCategory }[] {
  return ALMANAC_PAGES.flatMap((page) => getVisibleSectionsForPage(page.id));
}
