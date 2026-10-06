import type { StoryEnemyDefinition } from './storyEnemyDefinitions';
import { STORY_ENEMY_DEFINITIONS } from './storyEnemyDefinitions';

/** Synthetic level IDs for World 4 multi-star story enemy variants. */
export const WORLD4_VARIANT_PARENT_LEVELS = [40, 42, 44, 46, 47, 48, 50] as const;

export type World4VariantParentLevel = (typeof WORLD4_VARIANT_PARENT_LEVELS)[number];

export interface StoryEnemyPaletteOverride {
  hull: number;
  hullDark: number;
  trim: number;
  core: number;
  glow: number;
}

export interface World4StoryEnemyVariant extends StoryEnemyDefinition {
  parentLevel: number;
  groupName: string;
  paletteOverride?: StoryEnemyPaletteOverride;
}

export interface World4StoryEnemyGroup {
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

const BLUE_WHITE: StoryEnemyPaletteOverride = {
  hull: 0x88aaee,
  hullDark: 0x4466aa,
  trim: 0xddeeff,
  core: 0xffffff,
  glow: 0xaaccff,
};

const HOT_BLUE: StoryEnemyPaletteOverride = {
  hull: 0x6688dd,
  hullDark: 0x334488,
  trim: 0xaaccff,
  core: 0xffffff,
  glow: 0x99bbff,
};

const WHITE_MAIN: StoryEnemyPaletteOverride = {
  hull: 0xccddee,
  hullDark: 0x8899aa,
  trim: 0xffffff,
  core: 0xffffff,
  glow: 0xeeeeff,
};

const YELLOW_WHITE: StoryEnemyPaletteOverride = {
  hull: 0xffeecc,
  hullDark: 0xccaa66,
  trim: 0xfff6dd,
  core: 0xffffff,
  glow: 0xffeebb,
};

const ORANGE_GIANT: StoryEnemyPaletteOverride = {
  hull: 0xdd7722,
  hullDark: 0xaa4411,
  trim: 0xffaa55,
  core: 0xffddaa,
  glow: 0xff9944,
};

const RED_GIANT: StoryEnemyPaletteOverride = {
  hull: 0xcc3322,
  hullDark: 0x881411,
  trim: 0xff6644,
  core: 0xffaa88,
  glow: 0xff5533,
};

const GROUP_SPECS: GroupSpec[] = [
  {
    parentLevel: 40,
    variants: [
      { level: 4001, enemyName: 'Alphecca A Crown Scout', textureKeySuffix: 'alphecca-a', paletteOverride: WHITE_MAIN },
      { level: 4002, enemyName: 'Alphecca B Crown Scout', textureKeySuffix: 'alphecca-b', paletteOverride: YELLOW_WHITE },
    ],
  },
  {
    parentLevel: 42,
    variants: [
      { level: 4201, enemyName: 'Regulus A Lion Scout', textureKeySuffix: 'regulus-a', paletteOverride: BLUE_WHITE },
      { level: 4202, enemyName: 'Regulus B Lion Scout', textureKeySuffix: 'regulus-b', paletteOverride: ORANGE_GIANT },
      { level: 4203, enemyName: 'Regulus C Lion Scout', textureKeySuffix: 'regulus-c', paletteOverride: RED_GIANT },
    ],
  },
  {
    parentLevel: 44,
    variants: [
      { level: 4401, enemyName: 'Acrux Aa Raider', textureKeySuffix: 'acrux-aa', paletteOverride: HOT_BLUE },
      { level: 4402, enemyName: 'Acrux Ab Raider', textureKeySuffix: 'acrux-ab', paletteOverride: BLUE_WHITE },
      { level: 4403, enemyName: 'Acrux Ba Raider', textureKeySuffix: 'acrux-ba', paletteOverride: HOT_BLUE },
      { level: 4404, enemyName: 'Acrux Bb Raider', textureKeySuffix: 'acrux-bb', paletteOverride: BLUE_WHITE },
      { level: 4405, enemyName: 'Mimosa A Raider', textureKeySuffix: 'mimosa-a', paletteOverride: HOT_BLUE },
      { level: 4406, enemyName: 'Mimosa B Raider', textureKeySuffix: 'mimosa-b', paletteOverride: WHITE_MAIN },
      { level: 4407, enemyName: 'Gacrux Raider', textureKeySuffix: 'gacrux', paletteOverride: RED_GIANT },
      { level: 4408, enemyName: 'Delta Crucis Raider', textureKeySuffix: 'delta-crucis', paletteOverride: BLUE_WHITE },
      { level: 4409, enemyName: 'Epsilon Crucis Raider', textureKeySuffix: 'epsilon-crucis', paletteOverride: ORANGE_GIANT },
    ],
  },
  {
    parentLevel: 46,
    variants: [
      { level: 4601, enemyName: 'Algol A Demon Scout', textureKeySuffix: 'algol-a', paletteOverride: BLUE_WHITE },
      { level: 4602, enemyName: 'Algol B Demon Scout', textureKeySuffix: 'algol-b', paletteOverride: ORANGE_GIANT },
      { level: 4603, enemyName: 'Algol C Demon Scout', textureKeySuffix: 'algol-c', paletteOverride: WHITE_MAIN },
    ],
  },
  {
    parentLevel: 47,
    variants: [
      { level: 4701, enemyName: 'Alpheratz A Chain Scout', textureKeySuffix: 'alpheratz-a', paletteOverride: BLUE_WHITE },
      { level: 4702, enemyName: 'Alpheratz B Chain Scout', textureKeySuffix: 'alpheratz-b', paletteOverride: WHITE_MAIN },
    ],
  },
  {
    parentLevel: 48,
    variants: [
      { level: 4801, enemyName: 'Cor Caroli A Heart Scout', textureKeySuffix: 'cor-caroli-a', paletteOverride: WHITE_MAIN },
      { level: 4802, enemyName: 'Cor Caroli B Heart Scout', textureKeySuffix: 'cor-caroli-b', paletteOverride: YELLOW_WHITE },
    ],
  },
  {
    parentLevel: 50,
    variants: [
      { level: 5001, enemyName: 'Alioth Raider', textureKeySuffix: 'alioth', paletteOverride: WHITE_MAIN },
      { level: 5002, enemyName: 'Dubhe A Raider', textureKeySuffix: 'dubhe-a', paletteOverride: ORANGE_GIANT },
      { level: 5003, enemyName: 'Dubhe B Raider', textureKeySuffix: 'dubhe-b', paletteOverride: WHITE_MAIN },
      { level: 5004, enemyName: 'Alkaid Raider', textureKeySuffix: 'alkaid', paletteOverride: BLUE_WHITE },
      { level: 5005, enemyName: 'Mizar Aa Raider', textureKeySuffix: 'mizar-aa', paletteOverride: WHITE_MAIN },
      { level: 5006, enemyName: 'Mizar Ab Raider', textureKeySuffix: 'mizar-ab', paletteOverride: YELLOW_WHITE },
      { level: 5007, enemyName: 'Mizar Ba Raider', textureKeySuffix: 'mizar-ba', paletteOverride: WHITE_MAIN },
      { level: 5008, enemyName: 'Mizar Bb Raider', textureKeySuffix: 'mizar-bb', paletteOverride: BLUE_WHITE },
      { level: 5009, enemyName: 'Merak Raider', textureKeySuffix: 'merak', paletteOverride: WHITE_MAIN },
      { level: 5010, enemyName: 'Phecda A Raider', textureKeySuffix: 'phecda-a', paletteOverride: WHITE_MAIN },
      { level: 5011, enemyName: 'Phecda B Raider', textureKeySuffix: 'phecda-b', paletteOverride: YELLOW_WHITE },
      { level: 5012, enemyName: 'Megrez Raider', textureKeySuffix: 'megrez', paletteOverride: BLUE_WHITE },
    ],
  },
];

function buildVariant(parent: StoryEnemyDefinition, spec: VariantSpec, groupName: string): World4StoryEnemyVariant {
  return {
    ...parent,
    level: spec.level,
    parentLevel: parent.level,
    groupName,
    enemyName: spec.enemyName,
    textureKey: `story-enemy-w4-${spec.textureKeySuffix}`,
    paletteOverride: spec.paletteOverride,
  };
}

export const WORLD4_STORY_ENEMY_GROUPS: World4StoryEnemyGroup[] = GROUP_SPECS.map((group) => ({
  groupName: STORY_ENEMY_DEFINITIONS[group.parentLevel].enemyName,
  parentLevel: group.parentLevel,
  variantLevels: group.variants.map((v) => v.level),
}));

export const WORLD4_STORY_ENEMY_VARIANTS: Record<number, World4StoryEnemyVariant> = Object.fromEntries(
  GROUP_SPECS.flatMap((group) => {
    const parent = STORY_ENEMY_DEFINITIONS[group.parentLevel];
    const groupName = parent.enemyName;
    return group.variants.map((spec) => [
      spec.level,
      buildVariant(parent, spec, groupName),
    ]);
  }),
);

const VARIANT_LEVEL_SET = new Set(Object.keys(WORLD4_STORY_ENEMY_VARIANTS).map(Number));

export function isWorld4VariantLevel(level: number): boolean {
  return VARIANT_LEVEL_SET.has(level);
}

export function hasWorld4Variants(parentLevel: number): boolean {
  return WORLD4_VARIANT_PARENT_LEVELS.includes(parentLevel as World4VariantParentLevel);
}

export function getWorld4VariantDefinition(level: number): World4StoryEnemyVariant {
  return WORLD4_STORY_ENEMY_VARIANTS[level] ?? WORLD4_STORY_ENEMY_VARIANTS[4001];
}

export function getWorld4VariantPool(parentLevel: number): World4StoryEnemyVariant[] {
  const group = WORLD4_STORY_ENEMY_GROUPS.find((g) => g.parentLevel === parentLevel);
  if (!group) return [];
  return group.variantLevels.map((level) => WORLD4_STORY_ENEMY_VARIANTS[level]);
}

export function getWorld4VariantParentLevel(level: number): number | null {
  const variant = WORLD4_STORY_ENEMY_VARIANTS[level];
  return variant?.parentLevel ?? null;
}

export function pickWorld4StoryEnemyVariant(
  parentLevel: number,
  countsByLevel: Record<number, number>,
): World4StoryEnemyVariant | null {
  const pool = getWorld4VariantPool(parentLevel);
  const parent = STORY_ENEMY_DEFINITIONS[parentLevel];
  const totalActive = pool.reduce((sum, v) => sum + (countsByLevel[v.level] ?? 0), 0);
  if (totalActive >= parent.maxOnScreen) return null;

  const available = pool.filter((v) => {
    const perVariantCap = Math.max(1, Math.ceil(parent.maxOnScreen / pool.length));
    return (countsByLevel[v.level] ?? 0) < perVariantCap;
  });
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getWorld4StoryEnemyGroupsForLevel(parentLevel: number): World4StoryEnemyGroup | undefined {
  return WORLD4_STORY_ENEMY_GROUPS.find((g) => g.parentLevel === parentLevel);
}
