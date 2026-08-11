import {
  ALMANAC_ENTRIES,
  getVisibleAlmanacEntries,
  type AlmanacEntry,
} from '../almanac';
import type { EnemyKind } from '../enemies';
import { isWorld2Unlocked, isWorld3Unlocked } from '../worldProgress';

function canUseComets(): boolean {
  return isWorld2Unlocked() || isWorld3Unlocked();
}

function canUseWorld3(): boolean {
  return isWorld3Unlocked();
}

export interface EditorStoryEnemyOption {
  /** e.g. story-world1-3 or story-world2-galilean-1101 */
  id: string;
  name: string;
  worldId: 'world1' | 'world2' | 'world3';
  level: number;
  galilean: boolean;
}

export interface EditorBossOption {
  /** e.g. boss-world1-5 */
  id: string;
  name: string;
  worldId: 'world1' | 'world2' | 'world3';
  level: number;
}

const SURVIVAL_ID_BY_ALMANAC: Record<string, EnemyKind> = {
  'enemy-spider': 'spider',
  'enemy-seeker': 'seeker',
  'enemy-wasp': 'wasp',
  'enemy-turret': 'turret',
  'enemy-mine-carrier': 'mineCarrier',
  'enemy-flamethrower': 'flamethrower',
};

const LEGACY_STORY_IDS: Record<string, string> = {
  orbitalProbe: 'story-world1-1',
  lunarMite: 'story-world1-2',
  acidSkimmer: 'story-world1-3',
  solarDart: 'story-world1-4',
  dustStrider: 'story-world1-5',
  beltRaider: 'story-world1-10',
};

export function migrateLegacyEnemyId(id: string): string {
  if (LEGACY_STORY_IDS[id]) return LEGACY_STORY_IDS[id];
  if (id === 'boss') return 'boss-world1-1';
  return id;
}

export function isEditorObstacleVisible(
  kind: 'asteroids' | 'comets' | 'blueMines' | 'grayMines' | 'redMines' | 'purpleMines',
): boolean {
  switch (kind) {
    case 'asteroids':
    case 'blueMines':
    case 'grayMines':
      return true;
    case 'comets':
      return canUseComets();
    case 'redMines':
    case 'purpleMines':
      return canUseWorld3();
    default:
      return false;
  }
}

export function getVisibleSurvivalEnemyIds(): EnemyKind[] {
  const visible = new Set(
    getVisibleAlmanacEntries()
      .filter((e) => e.category === 'enemy')
      .map((e) => SURVIVAL_ID_BY_ALMANAC[e.id])
      .filter((id): id is EnemyKind => !!id),
  );
  const all: EnemyKind[] = [
    'spider',
    'seeker',
    'wasp',
    'turret',
    'mineCarrier',
    'flamethrower',
  ];
  return all.filter((id) => visible.has(id));
}

function parseStoryAlmanacEntry(entry: AlmanacEntry): EditorStoryEnemyOption | null {
  // story-enemy-world1-3
  const normal = /^story-enemy-(world[123])-(\d+)$/.exec(entry.id);
  if (normal) {
    return {
      id: `story-${normal[1]}-${normal[2]}`,
      name: entry.name,
      worldId: normal[1] as EditorStoryEnemyOption['worldId'],
      level: parseInt(normal[2], 10),
      galilean: false,
    };
  }
  // story-enemy-world2-galilean-1101
  const gal = /^story-enemy-(world2)-galilean-(\d+)$/.exec(entry.id);
  if (gal) {
    return {
      id: `story-world2-galilean-${gal[2]}`,
      name: entry.name,
      worldId: 'world2',
      level: parseInt(gal[2], 10),
      galilean: true,
    };
  }
  return null;
}

function parseBossAlmanacEntry(entry: AlmanacEntry): EditorBossOption | null {
  const m = /^boss-(world[123])-(\d+)$/.exec(entry.id);
  if (!m) return null;
  return {
    id: `boss-${m[1]}-${m[2]}`,
    name: entry.name,
    worldId: m[1] as EditorBossOption['worldId'],
    level: parseInt(m[2], 10),
  };
}

/** All story enemies that exist (for defaults / normalize), ignoring unlock. */
export function getAllStoryEnemyOptions(): EditorStoryEnemyOption[] {
  return ALMANAC_ENTRIES
    .filter((e) => e.category === 'storyEnemy')
    .map(parseStoryAlmanacEntry)
    .filter((o): o is EditorStoryEnemyOption => o != null);
}

/** All bosses that exist (for defaults / normalize), ignoring unlock. */
export function getAllBossOptions(): EditorBossOption[] {
  return ALMANAC_ENTRIES
    .filter((e) => e.category === 'boss')
    .map(parseBossAlmanacEntry)
    .filter((o): o is EditorBossOption => o != null);
}

/** Story enemies currently visible in the almanac (unlocked). */
export function getVisibleStoryEnemyOptions(): EditorStoryEnemyOption[] {
  return getVisibleAlmanacEntries()
    .filter((e) => e.category === 'storyEnemy')
    .map(parseStoryAlmanacEntry)
    .filter((o): o is EditorStoryEnemyOption => o != null);
}

/** Bosses currently visible in the almanac (unlocked). */
export function getVisibleBossOptions(): EditorBossOption[] {
  return getVisibleAlmanacEntries()
    .filter((e) => e.category === 'boss')
    .map(parseBossAlmanacEntry)
    .filter((o): o is EditorBossOption => o != null);
}

export function isStoryEnemyIdUnlocked(id: string): boolean {
  return getVisibleStoryEnemyOptions().some((o) => o.id === id);
}

export function isBossIdUnlocked(id: string): boolean {
  return getVisibleBossOptions().some((o) => o.id === id);
}

export function parseEditorStoryId(id: string): EditorStoryEnemyOption | null {
  const migrated = migrateLegacyEnemyId(id);
  const gal = /^story-world2-galilean-(\d+)$/.exec(migrated);
  if (gal) {
    return {
      id: migrated,
      name: migrated,
      worldId: 'world2',
      level: parseInt(gal[1], 10),
      galilean: true,
    };
  }
  const m = /^story-(world[123])-(\d+)$/.exec(migrated);
  if (!m) return null;
  return {
    id: migrated,
    name: migrated,
    worldId: m[1] as EditorStoryEnemyOption['worldId'],
    level: parseInt(m[2], 10),
    galilean: false,
  };
}

export function parseEditorBossId(id: string): EditorBossOption | null {
  const migrated = migrateLegacyEnemyId(id);
  const m = /^boss-(world[123])-(\d+)$/.exec(migrated);
  if (!m) return null;
  return {
    id: migrated,
    name: migrated,
    worldId: m[1] as EditorBossOption['worldId'],
    level: parseInt(m[2], 10),
  };
}
