import { getWorldIdFromLevel } from './gameMode';
import { getWorldNumber } from './worlds';
import { getWorld1Level } from './world1/levels';
import { getWorld2Level } from './world2/levels';
import { getWorld3Level } from './world3/levels';
import { getSecretLevel, type SecretLevelDefinition } from './world1/secretLevels';
import { getBackgroundTheme as getWorld1Theme, type BackgroundTheme } from './world1/backgrounds';
import { getBackgroundTheme as getWorld2Theme } from './world2/backgrounds';
import { getBackgroundTheme as getWorld3Theme } from './world3/backgrounds';
import { getWorldCardTheme } from './worldCardThemes';
import { getBossDefinition as getWorld1Boss } from './world1/bosses';
import { getBossDefinition as getWorld2Boss } from './world2/bosses';
import { getBossDefinition as getWorld3Boss } from './world3/bosses';
import { getStoryEnemyDefinition as getWorld1StoryEnemy } from './world1/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getWorld2StoryEnemy } from './world2/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getWorld3StoryEnemy } from './world3/storyEnemyDefinitions';
import {
  getWorld1MapNode,
  getWorld1MapRouteLevels,
  SUN_POSITION as WORLD1_SUN,
  WORLD1_MAP_NODES,
  WORLD1_ORBITS,
  WORLD1_BACKGROUND_ASTEROIDS,
  WORLD1_ASTEROID_BELT,
  getEarthPosition,
  EARTH_MOON_ORBIT_RADIUS,
} from './world1/mapLayout';
import {
  getWorld2MapNode,
  getWorld2MapRouteLevels,
  getWorld2RouteWaypoints,
  SUN_POSITION as WORLD2_SUN,
  WORLD2_MAP_NODES,
  WORLD2_ORBITS,
} from './world2/mapLayout';
import {
  getWorld3MapNode,
  getWorld3MapRouteLevels,
  getWorld3RouteWaypoints,
  SUN_POSITION as WORLD3_SUN,
  WORLD3_MAP_NODES,
  WORLD3_ORBITS,
} from './world3/mapLayout';

export type BossDefinition =
  | import('./world1/bosses').BossDefinition
  | import('./world2/bosses').BossDefinition
  | import('./world3/bosses').BossDefinition;
export type StoryEnemyDefinition =
  | import('./world1/storyEnemyDefinitions').StoryEnemyDefinition
  | import('./world2/storyEnemyDefinitions').StoryEnemyDefinition
  | import('./world3/storyEnemyDefinitions').StoryEnemyDefinition;
export type { StoryEnemyBehavior } from './world1/storyEnemyDefinitions';
export type { BackgroundTheme } from './world1/backgrounds';

export interface LevelMeta {
  level: number;
  location: string;
  themeId: string;
  bossName: string;
}

function resolveContentWorldId(worldId: string, level: number): string {
  if (worldId === 'world3' || level >= 21) return 'world3';
  if (worldId === 'world2' || level >= 11) return 'world2';
  return 'world1';
}

export function resolveWorldId(worldId?: string, level?: number, secretId?: string): string {
  if (secretId) return 'world1';
  if (worldId) return worldId;
  if (level !== undefined) return getWorldIdFromLevel(level);
  return 'world1';
}

export function getLevelMeta(worldId: string, level: number, secretId?: string): LevelMeta {
  if (secretId) {
    const secret = getSecretLevel(secretId);
    if (secret) {
      return {
        level,
        location: secret.location,
        themeId: secret.themeId,
        bossName: '',
      };
    }
  }

  const contentWorld = resolveContentWorldId(worldId, level);
  if (contentWorld === 'world3') {
    const meta = getWorld3Level(level);
    return { level: meta.level, location: meta.location, themeId: meta.themeId, bossName: meta.bossName };
  }
  if (contentWorld === 'world2') {
    const meta = getWorld2Level(level);
    return { level: meta.level, location: meta.location, themeId: meta.themeId, bossName: meta.bossName };
  }

  const meta = getWorld1Level(level);
  return { level: meta.level, location: meta.location, themeId: meta.themeId, bossName: meta.bossName };
}

export function getBackgroundTheme(worldId: string, themeId: string): BackgroundTheme {
  if (themeId === 'iss' || themeId === 'dawn') {
    return getWorld1Theme(themeId);
  }
  if (
    worldId === 'world5'
    || worldId === 'world6'
    || worldId === 'world7'
    || worldId === 'world8'
  ) {
    return getWorldCardTheme(worldId);
  }
  if (worldId === 'world3') {
    return getWorld3Theme(themeId);
  }
  if (worldId === 'world2') {
    return getWorld2Theme(themeId);
  }
  return getWorld1Theme(themeId);
}

const SURVIVAL_WORLD_THEME_IDS: Record<string, string> = {
  world1: 'earth',
  world2: 'jupiter',
  world3: 'sirius',
};

export function getSurvivalBackgroundTheme(worldId: string): BackgroundTheme {
  const themeId = SURVIVAL_WORLD_THEME_IDS[worldId] ?? SURVIVAL_WORLD_THEME_IDS.world1;
  return getBackgroundTheme(worldId, themeId);
}

export function getSurvivalHudLabel(worldId: string): string {
  return `WORLD ${getWorldNumber(worldId)} SURVIVAL`;
}

export function getBossDefinition(worldId: string, level: number): BossDefinition {
  const contentWorld = resolveContentWorldId(worldId, level);
  if (contentWorld === 'world3') return getWorld3Boss(level);
  if (contentWorld === 'world2') return getWorld2Boss(level);
  return getWorld1Boss(level);
}

export function getStoryEnemyDefinition(worldId: string, level: number): StoryEnemyDefinition {
  const contentWorld = resolveContentWorldId(worldId, level);
  if (contentWorld === 'world3') return getWorld3StoryEnemy(level);
  if (contentWorld === 'world2') return getWorld2StoryEnemy(level);
  return getWorld1StoryEnemy(level);
}

export function getMapLayout(worldId: string) {
  if (worldId === 'world3') {
    return {
      sunPosition: WORLD3_SUN,
      orbits: WORLD3_ORBITS,
      nodes: WORLD3_MAP_NODES,
      getMapNode: getWorld3MapNode,
      getRouteLevels: getWorld3MapRouteLevels,
      getRouteWaypoints: getWorld3RouteWaypoints,
      planetDecorations: undefined,
      backgroundAsteroids: undefined,
      asteroidBelt: undefined,
      earthPosition: undefined,
      earthMoonOrbitRadius: undefined,
      routeStyle: 'dashedCyan' as const,
    };
  }
  if (worldId === 'world2') {
    return {
      sunPosition: WORLD2_SUN,
      orbits: WORLD2_ORBITS,
      nodes: WORLD2_MAP_NODES,
      getMapNode: getWorld2MapNode,
      getRouteLevels: getWorld2MapRouteLevels,
      getRouteWaypoints: getWorld2RouteWaypoints,
      planetDecorations: undefined,
      backgroundAsteroids: undefined,
      asteroidBelt: undefined,
      earthPosition: undefined,
      earthMoonOrbitRadius: undefined,
      routeStyle: 'dashedCyan' as const,
    };
  }
  return {
    sunPosition: WORLD1_SUN,
    orbits: WORLD1_ORBITS,
    nodes: WORLD1_MAP_NODES,
    getMapNode: getWorld1MapNode,
    getRouteLevels: getWorld1MapRouteLevels,
    getRouteWaypoints: undefined,
    backgroundAsteroids: WORLD1_BACKGROUND_ASTEROIDS,
    asteroidBelt: WORLD1_ASTEROID_BELT,
    earthPosition: getEarthPosition(),
    earthMoonOrbitRadius: EARTH_MOON_ORBIT_RADIUS,
    routeStyle: 'dashedCyan' as const,
  };
}

export function getSecretLevelMeta(secretId: string): SecretLevelDefinition | undefined {
  return getSecretLevel(secretId);
}
