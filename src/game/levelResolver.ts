import { getWorldIdFromLevel } from './gameMode';
import { getWorld1Level } from './world1/levels';
import { getWorld2Level } from './world2/levels';
import { getSecretLevel, type SecretLevelDefinition } from './world1/secretLevels';
import { getBackgroundTheme as getWorld1Theme, type BackgroundTheme } from './world1/backgrounds';
import { getBackgroundTheme as getWorld2Theme } from './world2/backgrounds';
import { getBossDefinition as getWorld1Boss } from './world1/bosses';
import { getBossDefinition as getWorld2Boss } from './world2/bosses';
import { getStoryEnemyDefinition as getWorld1StoryEnemy } from './world1/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getWorld2StoryEnemy } from './world2/storyEnemyDefinitions';
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
  SUN_POSITION as WORLD2_SUN,
  WORLD2_MAP_NODES,
  WORLD2_ORBITS,
} from './world2/mapLayout';

export type BossDefinition =
  | import('./world1/bosses').BossDefinition
  | import('./world2/bosses').BossDefinition;
export type StoryEnemyDefinition =
  | import('./world1/storyEnemyDefinitions').StoryEnemyDefinition
  | import('./world2/storyEnemyDefinitions').StoryEnemyDefinition;
export type { StoryEnemyBehavior } from './world1/storyEnemyDefinitions';
export type { BackgroundTheme } from './world1/backgrounds';

export interface LevelMeta {
  level: number;
  location: string;
  themeId: string;
  bossName: string;
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

  if (worldId === 'world2' || level >= 11) {
    const meta = getWorld2Level(level);
    return { level: meta.level, location: meta.location, themeId: meta.themeId, bossName: meta.bossName };
  }

  const meta = getWorld1Level(level);
  return { level: meta.level, location: meta.location, themeId: meta.themeId, bossName: meta.bossName };
}

export function getBackgroundTheme(worldId: string, themeId: string): BackgroundTheme {
  if (themeId === 'iss') {
    return getWorld1Theme('iss');
  }
  if (worldId === 'world2') {
    return getWorld2Theme(themeId);
  }
  return getWorld1Theme(themeId);
}

export function getBossDefinition(worldId: string, level: number): BossDefinition {
  if (worldId === 'world2' || level >= 11) {
    return getWorld2Boss(level);
  }
  return getWorld1Boss(level);
}

export function getStoryEnemyDefinition(worldId: string, level: number): StoryEnemyDefinition {
  if (worldId === 'world2' || level >= 11) {
    return getWorld2StoryEnemy(level);
  }
  return getWorld1StoryEnemy(level);
}

export function getMapLayout(worldId: string) {
  if (worldId === 'world2') {
    return {
      sunPosition: WORLD2_SUN,
      orbits: WORLD2_ORBITS,
      nodes: WORLD2_MAP_NODES,
      getMapNode: getWorld2MapNode,
      getRouteLevels: getWorld2MapRouteLevels,
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
