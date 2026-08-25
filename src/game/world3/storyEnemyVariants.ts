import type { StoryEnemyAppearanceId } from './storyEnemyAppearances';
import type { StoryEnemyDefinition } from './storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS } from './storyEnemyDefinitions';

/** Synthetic level IDs for World 3 multi-star story enemy variants. */
export const WORLD3_VARIANT_PARENT_LEVELS = [22, 24, 26, 28, 35, 37] as const;

export type World3VariantParentLevel = (typeof WORLD3_VARIANT_PARENT_LEVELS)[number];

export interface StoryEnemyPaletteOverride {
  hull: number;
  hullDark: number;
  trim: number;
  core: number;
  glow: number;
}

export interface World3StoryEnemyVariant extends StoryEnemyDefinition {
  parentLevel: number;
  groupName: string;
  paletteOverride?: StoryEnemyPaletteOverride;
}

export interface World3StoryEnemyGroup {
  groupName: string;
  parentLevel: number;
  variantLevels: number[];
}

interface VariantSpec {
  level: number;
  enemyName: string;
  textureKeySuffix: string;
  paletteOverride?: StoryEnemyPaletteOverride;
}

interface GroupSpec {
  parentLevel: number;
  variants: VariantSpec[];
}

const YELLOW_DWARF: StoryEnemyPaletteOverride = {
  hull: 0xffdd88,
  hullDark: 0xccaa44,
  trim: 0xffeeaa,
  core: 0xffffff,
  glow: 0xffee99,
};

const ORANGE_DWARF: StoryEnemyPaletteOverride = {
  hull: 0xdd8844,
  hullDark: 0xaa5522,
  trim: 0xffaa66,
  core: 0xffffff,
  glow: 0xffbb77,
};

const T_BROWN_DWARF: StoryEnemyPaletteOverride = {
  hull: 0x663322,
  hullDark: 0x441811,
  trim: 0xaa6644,
  core: 0xddaa88,
  glow: 0x884422,
};

const WHITE_MAIN: StoryEnemyPaletteOverride = {
  hull: 0xaaccff,
  hullDark: 0x6688bb,
  trim: 0xeeffff,
  core: 0xffffff,
  glow: 0xddeeff,
};

const WHITE_DWARF: StoryEnemyPaletteOverride = {
  hull: 0xddddee,
  hullDark: 0x9999aa,
  trim: 0xffffff,
  core: 0xffffff,
  glow: 0xeeeeff,
};

const RED_DWARF: StoryEnemyPaletteOverride = {
  hull: 0xcc3322,
  hullDark: 0x881811,
  trim: 0xff6644,
  core: 0xffaa88,
  glow: 0xff5533,
};

const GROUP_SPECS: GroupSpec[] = [
  {
    parentLevel: 22,
    variants: [
      { level: 2201, enemyName: 'Alpha Centauri A Twin Scout', textureKeySuffix: 'alphaCentauri-a' },
      { level: 2202, enemyName: 'Alpha Centauri B Twin Scout', textureKeySuffix: 'alphaCentauri-b', paletteOverride: ORANGE_DWARF },
    ],
  },
  {
    parentLevel: 24,
    variants: [
      { level: 2401, enemyName: 'Luhman Brown Probe 1', textureKeySuffix: 'luhman-1' },
      { level: 2402, enemyName: 'Luhman Brown Probe 2', textureKeySuffix: 'luhman-2', paletteOverride: T_BROWN_DWARF },
    ],
  },
  {
    parentLevel: 26,
    variants: [
      { level: 2601, enemyName: 'Sirius A Light Raider', textureKeySuffix: 'sirius-a' },
      { level: 2602, enemyName: 'Sirius B Light Raider', textureKeySuffix: 'sirius-b', paletteOverride: WHITE_DWARF },
    ],
  },
  {
    parentLevel: 28,
    variants: [
      { level: 2801, enemyName: 'Procyon A White Dart', textureKeySuffix: 'procyon-a' },
      { level: 2802, enemyName: 'Procyon B White Dart', textureKeySuffix: 'procyon-b', paletteOverride: WHITE_DWARF },
    ],
  },
  {
    parentLevel: 35,
    variants: [
      { level: 3501, enemyName: 'Capella A Binary Weaver 1', textureKeySuffix: 'capella-a1' },
      { level: 3502, enemyName: 'Capella A Binary Weaver 2', textureKeySuffix: 'capella-a2', paletteOverride: YELLOW_DWARF },
      { level: 3503, enemyName: 'Capella H Binary Weaver', textureKeySuffix: 'capella-h', paletteOverride: RED_DWARF },
      { level: 3504, enemyName: 'Capella L Binary Weaver', textureKeySuffix: 'capella-l', paletteOverride: RED_DWARF },
    ],
  },
  {
    parentLevel: 37,
    variants: [
      { level: 3701, enemyName: 'Castor A Sextuple Phantom 1', textureKeySuffix: 'castor-a1' },
      { level: 3702, enemyName: 'Castor A Sextuple Phantom 2', textureKeySuffix: 'castor-a2', paletteOverride: RED_DWARF },
      { level: 3703, enemyName: 'Castor B Sextuple Phantom 1', textureKeySuffix: 'castor-b1', paletteOverride: WHITE_MAIN },
      { level: 3704, enemyName: 'Castor B Sextuple Phantom 2', textureKeySuffix: 'castor-b2', paletteOverride: RED_DWARF },
      { level: 3705, enemyName: 'Castor C Sextuple Phantom 1', textureKeySuffix: 'castor-c1', paletteOverride: RED_DWARF },
      { level: 3706, enemyName: 'Castor C Sextuple Phantom 2', textureKeySuffix: 'castor-c2', paletteOverride: RED_DWARF },
    ],
  },
];

function buildVariant(parent: StoryEnemyDefinition, spec: VariantSpec, groupName: string): World3StoryEnemyVariant {
  return {
    ...parent,
    level: spec.level,
    parentLevel: parent.level,
    groupName,
    enemyName: spec.enemyName,
    textureKey: `story-enemy-w3-${spec.textureKeySuffix}`,
    paletteOverride: spec.paletteOverride,
  };
}

export const WORLD3_STORY_ENEMY_GROUPS: World3StoryEnemyGroup[] = GROUP_SPECS.map((group) => ({
  groupName: STORY_ENEMY_DEFINITIONS[group.parentLevel].enemyName,
  parentLevel: group.parentLevel,
  variantLevels: group.variants.map((v) => v.level),
}));

export const WORLD3_STORY_ENEMY_VARIANTS: Record<number, World3StoryEnemyVariant> = Object.fromEntries(
  GROUP_SPECS.flatMap((group) => {
    const parent = STORY_ENEMY_DEFINITIONS[group.parentLevel];
    const groupName = parent.enemyName;
    return group.variants.map((spec) => [
      spec.level,
      buildVariant(parent, spec, groupName),
    ]);
  }),
);

const VARIANT_LEVEL_SET = new Set(Object.keys(WORLD3_STORY_ENEMY_VARIANTS).map(Number));

export function isWorld3VariantLevel(level: number): boolean {
  return VARIANT_LEVEL_SET.has(level);
}

export function hasWorld3Variants(parentLevel: number): boolean {
  return WORLD3_VARIANT_PARENT_LEVELS.includes(parentLevel as World3VariantParentLevel);
}

export function getWorld3VariantDefinition(level: number): World3StoryEnemyVariant {
  return WORLD3_STORY_ENEMY_VARIANTS[level] ?? WORLD3_STORY_ENEMY_VARIANTS[2201];
}

export function getWorld3VariantPool(parentLevel: number): World3StoryEnemyVariant[] {
  const group = WORLD3_STORY_ENEMY_GROUPS.find((g) => g.parentLevel === parentLevel);
  if (!group) return [];
  return group.variantLevels.map((level) => WORLD3_STORY_ENEMY_VARIANTS[level]);
}

export function getWorld3VariantParentLevel(level: number): number | null {
  const variant = WORLD3_STORY_ENEMY_VARIANTS[level];
  return variant?.parentLevel ?? null;
}

export function pickWorld3StoryEnemyVariant(
  parentLevel: number,
  countsByLevel: Record<number, number>,
): World3StoryEnemyVariant | null {
  const pool = getWorld3VariantPool(parentLevel);
  const parent = STORY_ENEMY_DEFINITIONS[parentLevel];
  const totalActive = pool.reduce((sum, v) => sum + (countsByLevel[v.level] ?? 0), 0);
  if (totalActive >= parent.maxOnScreen) return null;

  const available = pool.filter((v) => {
    // Per-variant cap: share parent maxOnScreen evenly, minimum 1 each when pool is small
    const perVariantCap = Math.max(1, Math.ceil(parent.maxOnScreen / pool.length));
    return (countsByLevel[v.level] ?? 0) < perVariantCap;
  });
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getWorld3StoryEnemyGroupsForLevel(parentLevel: number): World3StoryEnemyGroup | undefined {
  return WORLD3_STORY_ENEMY_GROUPS.find((g) => g.parentLevel === parentLevel);
}

export function getVariantAppearanceId(level: number): StoryEnemyAppearanceId {
  const parentLevel = getWorld3VariantParentLevel(level);
  if (parentLevel == null) return 'proximaSkiff';
  return STORY_ENEMY_DEFINITIONS[parentLevel].appearanceId;
}
