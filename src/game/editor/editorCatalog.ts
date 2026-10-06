import {
  ALMANAC_ENTRIES,
  getVisibleAlmanacEntries,
  type AlmanacEntry,
} from '../almanac';
import type { EnemyKind } from '../enemies';
import { isWorld2Unlocked, isWorld3Unlocked, isWorld4Unlocked } from '../worldProgress';
import { GALILEAN_SWARM_DRONE_GROUP } from '../world2/galileanEnemies';
import {
  hasWorld3Variants,
  WORLD3_STORY_ENEMY_GROUPS,
} from '../world3/storyEnemyVariants';
import {
  hasWorld4Variants,
  WORLD4_STORY_ENEMY_GROUPS,
} from '../world4/storyEnemyVariants';

function canUseComets(): boolean {
  return isWorld2Unlocked() || isWorld3Unlocked() || isWorld4Unlocked();
}

function canUseWorld4(): boolean {
  return isWorld4Unlocked();
}

function canUseWorld3(): boolean {
  return isWorld3Unlocked();
}

export interface EditorStoryEnemyOption {
  /** e.g. story-world1-3, story-world2-galilean-1101, story-world3-variant-2201 */
  id: string;
  name: string;
  worldId: 'world1' | 'world2' | 'world3' | 'world4';
  level: number;
  galilean: boolean;
  world3Variant: boolean;
  world4Variant: boolean;
}

export interface EditorStoryEnemyGroupOption {
  groupName: string;
  parentLevel: number;
  variants: EditorStoryEnemyOption[];
  /** Keep the parent enemy, then show this group after it. */
  insertAfterParent?: boolean;
}

export interface EditorBossOption {
  /** e.g. boss-world1-5 */
  id: string;
  name: string;
  worldId: 'world1' | 'world2' | 'world3' | 'world4';
  level: number;
}

const SURVIVAL_ID_BY_ALMANAC: Record<string, EnemyKind> = {
  'enemy-spider': 'spider',
  'enemy-seeker': 'seeker',
  'enemy-wasp': 'wasp',
  'enemy-turret': 'turret',
  'enemy-mine-carrier': 'mineCarrier',
  'enemy-flamethrower': 'flamethrower',
  'enemy-rabies': 'rabies',
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
  kind:
    | 'asteroids'
    | 'comets'
    | 'blueMines'
    | 'grayMines'
    | 'redMines'
    | 'purpleMines'
    | 'brownMines'
    | 'planets'
    | 'moons'
    | 'blackHoles'
    | 'smallGravityFields'
    | 'largeGravityFields'
    | 'icePanels'
    | 'plasmaBalls'
    | 'fans',
): boolean {
  switch (kind) {
    case 'asteroids':
    case 'blueMines':
    case 'grayMines':
    case 'brownMines':
    case 'planets':
    case 'moons':
    case 'blackHoles':
    case 'smallGravityFields':
    case 'largeGravityFields':
      return true;
    case 'comets':
      return canUseComets();
    case 'redMines':
    case 'purpleMines':
      return canUseWorld3();
    case 'icePanels':
    case 'plasmaBalls':
    case 'fans':
      return canUseWorld4();
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
    'rabies',
  ];
  return all.filter((id) => visible.has(id));
}

function parseStoryAlmanacEntry(entry: AlmanacEntry): EditorStoryEnemyOption | null {
  // story-enemy-world3-variant-2201
  const w4Variant = /^story-enemy-(world4)-variant-(\d+)$/.exec(entry.id);
  if (w4Variant) {
    return {
      id: `story-${w4Variant[1]}-variant-${w4Variant[2]}`,
      name: entry.name,
      worldId: 'world4',
      level: parseInt(w4Variant[2], 10),
      galilean: false,
      world3Variant: false,
      world4Variant: true,
    };
  }
  const w3Variant = /^story-enemy-(world3)-variant-(\d+)$/.exec(entry.id);
  if (w3Variant) {
    return {
      id: `story-${w3Variant[1]}-variant-${w3Variant[2]}`,
      name: entry.name,
      worldId: 'world3',
      level: parseInt(w3Variant[2], 10),
      galilean: false,
      world3Variant: true,
      world4Variant: false,
    };
  }
  // story-enemy-world1-3
  const normal = /^story-enemy-(world[1234])-(\d+)$/.exec(entry.id);
  if (normal) {
    return {
      id: `story-${normal[1]}-${normal[2]}`,
      name: entry.name,
      worldId: normal[1] as EditorStoryEnemyOption['worldId'],
      level: parseInt(normal[2], 10),
      galilean: false,
      world3Variant: false,
      world4Variant: false,
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
      world3Variant: false,
      world4Variant: false,
    };
  }
  return null;
}

function parseBossAlmanacEntry(entry: AlmanacEntry): EditorBossOption | null {
  const m = /^boss-(world[1234])-(\d+)$/.exec(entry.id);
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

/** Story enemies grouped under a category header (W2 Galilean moons, W3 multi-star families). */
export function getVisibleStoryEnemyGroupsForWorld(
  worldId: 'world1' | 'world2' | 'world3' | 'world4',
): EditorStoryEnemyGroupOption[] {
  const options = getVisibleStoryEnemyOptions().filter((o) => o.worldId === worldId);

  if (worldId === 'world2') {
    const variants = options
      .filter((o) => o.galilean)
      .sort((a, b) => a.level - b.level);
    if (variants.length === 0) return [];
    return [{
      groupName: GALILEAN_SWARM_DRONE_GROUP.groupName,
      parentLevel: GALILEAN_SWARM_DRONE_GROUP.insertAfterLevel,
      variants,
      insertAfterParent: true,
    }];
  }

  if (worldId === 'world4') {
    const byLevel = new Map(options.map((o) => [o.level, o]));
    return WORLD4_STORY_ENEMY_GROUPS
      .map((group) => ({
        groupName: group.groupName,
        parentLevel: group.parentLevel,
        variants: group.variantLevels
          .map((level) => byLevel.get(level))
          .filter((o): o is EditorStoryEnemyOption => o != null),
      }))
      .filter((g) => g.variants.length > 0);
  }

  if (worldId !== 'world3') return [];

  const byLevel = new Map(options.map((o) => [o.level, o]));

  return WORLD3_STORY_ENEMY_GROUPS
    .map((group) => ({
      groupName: group.groupName,
      parentLevel: group.parentLevel,
      variants: group.variantLevels
        .map((level) => byLevel.get(level))
        .filter((o): o is EditorStoryEnemyOption => o != null),
    }))
    .filter((g) => g.variants.length > 0);
}

/** Flat story enemy options for a world tab, excluding enemies shown inside a group. */
export function getVisibleStoryEnemyOptionsForWorld(
  worldId: 'world1' | 'world2' | 'world3' | 'world4' | 'world5' | 'world6' | 'world7' | 'world8',
): EditorStoryEnemyOption[] {
  if (worldId !== 'world1' && worldId !== 'world2' && worldId !== 'world3' && worldId !== 'world4') return [];
  return getVisibleStoryEnemyOptions().filter((o) => {
    if (o.worldId !== worldId) return false;
    if (worldId === 'world2' && o.galilean) return false;
    if (worldId === 'world3' && hasWorld3Variants(o.level) && !o.world3Variant) return false;
    if (worldId === 'world4' && hasWorld4Variants(o.level) && !o.world4Variant) return false;
    return true;
  });
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
  const w4Var = /^story-world4-variant-(\d+)$/.exec(migrated);
  if (w4Var) {
    return {
      id: migrated,
      name: migrated,
      worldId: 'world4',
      level: parseInt(w4Var[1], 10),
      galilean: false,
      world3Variant: false,
      world4Variant: true,
    };
  }
  const w3Var = /^story-world3-variant-(\d+)$/.exec(migrated);
  if (w3Var) {
    return {
      id: migrated,
      name: migrated,
      worldId: 'world3',
      level: parseInt(w3Var[1], 10),
      galilean: false,
      world3Variant: true,
      world4Variant: false,
    };
  }
  const gal = /^story-world2-galilean-(\d+)$/.exec(migrated);
  if (gal) {
    return {
      id: migrated,
      name: migrated,
      worldId: 'world2',
      level: parseInt(gal[1], 10),
      galilean: true,
      world3Variant: false,
      world4Variant: false,
    };
  }
  const m = /^story-(world[1234])-(\d+)$/.exec(migrated);
  if (!m) return null;
  return {
    id: migrated,
    name: migrated,
    worldId: m[1] as EditorStoryEnemyOption['worldId'],
    level: parseInt(m[2], 10),
    galilean: false,
    world3Variant: false,
    world4Variant: false,
  };
}

export function parseEditorBossId(id: string): EditorBossOption | null {
  const migrated = migrateLegacyEnemyId(id);
  const m = /^boss-(world[1234])-(\d+)$/.exec(migrated);
  if (!m) return null;
  return {
    id: migrated,
    name: migrated,
    worldId: m[1] as EditorBossOption['worldId'],
    level: parseInt(m[2], 10),
  };
}
