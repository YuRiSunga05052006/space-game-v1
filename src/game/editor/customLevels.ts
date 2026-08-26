import { writeProgressItem } from '../cloud/progressStorage';
import type { EnemyKind } from '../enemies';
import { isWorld2Unlocked, isWorld3Unlocked } from '../worldProgress';
import {
  getAllBossOptions,
  getAllStoryEnemyOptions,
  isBossIdUnlocked,
  isStoryEnemyIdUnlocked,
  migrateLegacyEnemyId,
} from './editorCatalog';

export const MAX_CUSTOM_LEVEL_SLOTS = 10;
export const CUSTOM_LEVEL_VERSION = 1;
const STORAGE_KEY = 'star-blaster-custom-levels';

export type SpawnScaleBy = 'none' | 'score' | 'time';

export interface SpawnRule {
  enabled: boolean;
  /** Base spawn interval in ms (lower = more frequent). */
  intervalMs: number;
  /** 0–1 chance when a spawn tick fires (obstacles). */
  chance: number;
  scaleBy: SpawnScaleBy;
  /** How strongly score/time shortens the interval (0–1). */
  scaleStrength: number;
}

export type SurvivalEnemyId = EnemyKind;

export interface EnemySpawnRule extends SpawnRule {
  /** Survival kind, story-* id, or boss-* id. */
  id: string;
  maxOnScreen: number;
}

export interface EditorBackgroundConfig {
  skyTop: number;
  skyBottom: number;
  starColor: number;
  starsEnabled: boolean;
  /** Only used when starsEnabled is false. */
  obstructionEnabled: boolean;
  obstructionColor: number;
}

export interface WarpHoleConfig {
  id: string;
  scoreThreshold: number;
  subAreaId: string;
}

export interface FinishPanelConfig {
  id: string;
  scoreThreshold: number;
}

export interface CustomAreaContent {
  background: EditorBackgroundConfig;
  objects: {
    lootBoxes: SpawnRule;
    hearts: SpawnRule;
    powerStar: SpawnRule;
    shield: SpawnRule;
    invisibility: SpawnRule;
    fuelTank: SpawnRule;
  };
  obstacles: {
    asteroids: SpawnRule;
    comets: SpawnRule;
    blueMines: SpawnRule;
    grayMines: SpawnRule;
    /** Requires World 3 unlock. */
    redMines: SpawnRule;
    /** Requires World 3 unlock. */
    purpleMines: SpawnRule;
    brownMines: SpawnRule;
    planets: SpawnRule;
    moons: SpawnRule;
    blackHoles: SpawnRule;
    smallGravityFields: SpawnRule;
    largeGravityFields: SpawnRule;
  };
  enemies: {
    survival: EnemySpawnRule[];
    story: EnemySpawnRule[];
    bosses: EnemySpawnRule[];
    /** 0 = endless; >0 = clear after this many boss kills. */
    bossCount: number;
  };
  misc: {
    warpHoles: WarpHoleConfig[];
    finishPanels: FinishPanelConfig[];
  };
}

export interface CustomSubArea extends CustomAreaContent {
  id: string;
  name: string;
}

export interface CustomLevelDefinition extends CustomAreaContent {
  v: typeof CUSTOM_LEVEL_VERSION;
  name: string;
  subAreas: CustomSubArea[];
}

export type CustomLevelSlot = CustomLevelDefinition | null;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function defaultSpawnRule(overrides: Partial<SpawnRule> = {}): SpawnRule {
  return {
    enabled: false,
    intervalMs: 10000,
    chance: 1,
    scaleBy: 'none',
    scaleStrength: 0.3,
    ...overrides,
  };
}

function defaultSurvivalEnemy(id: SurvivalEnemyId, enabled = false): EnemySpawnRule {
  return {
    id,
    enabled,
    intervalMs: 9000,
    chance: 1,
    scaleBy: 'score',
    scaleStrength: 0.3,
    maxOnScreen: 2,
  };
}

function defaultStoryEnemy(id: string, enabled = false): EnemySpawnRule {
  return {
    id,
    enabled,
    intervalMs: 8000,
    chance: 1,
    scaleBy: 'none',
    scaleStrength: 0.2,
    maxOnScreen: 2,
  };
}

function defaultBossEnemy(id: string, enabled = false): EnemySpawnRule {
  return {
    id,
    enabled,
    intervalMs: 60000,
    chance: 1,
    scaleBy: 'score',
    scaleStrength: 0.2,
    maxOnScreen: 1,
  };
}

export function createDefaultAreaContent(): CustomAreaContent {
  return {
    background: {
      skyTop: 0x0a1a3a,
      skyBottom: 0x1a3a6a,
      starColor: 0xaaccff,
      starsEnabled: true,
      obstructionEnabled: false,
      obstructionColor: 0x000000,
    },
    objects: {
      lootBoxes: defaultSpawnRule({ enabled: true, intervalMs: 0, chance: 1, scaleBy: 'score' }),
      hearts: defaultSpawnRule({ enabled: true, intervalMs: 12000, scaleBy: 'score' }),
      powerStar: defaultSpawnRule({ enabled: true, intervalMs: 30000 }),
      shield: defaultSpawnRule({ enabled: false, intervalMs: 45000 }),
      invisibility: defaultSpawnRule({ enabled: false, intervalMs: 55000 }),
      fuelTank: defaultSpawnRule({ enabled: false, intervalMs: 50000 }),
    },
    obstacles: {
      asteroids: defaultSpawnRule({
        enabled: true,
        intervalMs: 1200,
        chance: 1,
        scaleBy: 'time',
        scaleStrength: 0.4,
      }),
      comets: defaultSpawnRule({ enabled: false, intervalMs: 8000, chance: 0.35 }),
      blueMines: defaultSpawnRule({ enabled: false, intervalMs: 4000, chance: 0.5 }),
      grayMines: defaultSpawnRule({ enabled: false, intervalMs: 4000, chance: 0.5 }),
      redMines: defaultSpawnRule({ enabled: false, intervalMs: 4000, chance: 0.35 }),
      purpleMines: defaultSpawnRule({ enabled: false, intervalMs: 4000, chance: 0.35 }),
      brownMines: defaultSpawnRule({ enabled: false, intervalMs: 4000, chance: 0.5 }),
      planets: defaultSpawnRule({ enabled: false, intervalMs: 12000, chance: 0.25 }),
      moons: defaultSpawnRule({ enabled: false, intervalMs: 8000, chance: 0.35 }),
      blackHoles: defaultSpawnRule({ enabled: false, intervalMs: 15000, chance: 0.3 }),
      smallGravityFields: defaultSpawnRule({ enabled: false, intervalMs: 10000, chance: 0.35 }),
      largeGravityFields: defaultSpawnRule({ enabled: false, intervalMs: 14000, chance: 0.3 }),
    },
    enemies: {
      survival: [
        defaultSurvivalEnemy('spider'),
        defaultSurvivalEnemy('seeker'),
        defaultSurvivalEnemy('wasp'),
        defaultSurvivalEnemy('turret'),
        defaultSurvivalEnemy('mineCarrier'),
        defaultSurvivalEnemy('flamethrower'),
      ],
      story: getAllStoryEnemyOptions().map((o) => defaultStoryEnemy(o.id)),
      bosses: getAllBossOptions().map((o) => defaultBossEnemy(o.id)),
      bossCount: 0,
    },
    misc: {
      warpHoles: [],
      finishPanels: [],
    },
  };
}

export function createDefaultCustomLevel(name = 'Custom Level'): CustomLevelDefinition {
  return {
    v: CUSTOM_LEVEL_VERSION,
    name,
    ...createDefaultAreaContent(),
    subAreas: [],
  };
}

export function createDefaultSubArea(id: string, name: string): CustomSubArea {
  return {
    id,
    name,
    ...createDefaultAreaContent(),
  };
}

function emptySlots(): CustomLevelSlot[] {
  return Array.from({ length: MAX_CUSTOM_LEVEL_SLOTS }, () => null);
}

function readSlotsRaw(): CustomLevelSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySlots();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return emptySlots();
    const slots = emptySlots();
    for (let i = 0; i < MAX_CUSTOM_LEVEL_SLOTS; i++) {
      const item = parsed[i];
      if (item == null) {
        slots[i] = null;
        continue;
      }
      const validated = validateAndNormalizeLevel(item);
      slots[i] = validated.ok ? validated.level : null;
    }
    return slots;
  } catch {
    return emptySlots();
  }
}

function writeSlots(slots: CustomLevelSlot[]): void {
  writeProgressItem(STORAGE_KEY, JSON.stringify(slots));
}

export function getCustomLevelSlots(): CustomLevelSlot[] {
  return readSlotsRaw();
}

export function getCustomLevel(slotIndex: number): CustomLevelDefinition | null {
  if (slotIndex < 0 || slotIndex >= MAX_CUSTOM_LEVEL_SLOTS) return null;
  return readSlotsRaw()[slotIndex] ?? null;
}

export function saveCustomLevel(slotIndex: number, level: CustomLevelDefinition): CustomLevelDefinition | null {
  if (slotIndex < 0 || slotIndex >= MAX_CUSTOM_LEVEL_SLOTS) return null;
  const validated = validateAndNormalizeLevel(level);
  if (!validated.ok) return null;
  // Read raw slots without re-normalizing other entries through a second pass that
  // could interact with in-memory edits — still validate each existing slot safely.
  let slots = emptySlots();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (let i = 0; i < MAX_CUSTOM_LEVEL_SLOTS; i++) {
          if (i === slotIndex) continue;
          const item = parsed[i];
          if (item == null) {
            slots[i] = null;
            continue;
          }
          const other = validateAndNormalizeLevel(item);
          slots[i] = other.ok ? other.level : null;
        }
      }
    }
  } catch {
    slots = emptySlots();
  }
  slots[slotIndex] = validated.level;
  writeSlots(slots);
  return validated.level;
}

export function deleteCustomLevel(slotIndex: number): boolean {
  if (slotIndex < 0 || slotIndex >= MAX_CUSTOM_LEVEL_SLOTS) return false;
  const slots = readSlotsRaw();
  slots[slotIndex] = null;
  writeSlots(slots);
  return true;
}

export function getAreaContent(
  level: CustomLevelDefinition,
  subAreaId?: string,
): CustomAreaContent {
  if (!subAreaId) return level;
  const sub = level.subAreas.find((s) => s.id === subAreaId);
  return sub ?? level;
}

export function canUseComets(): boolean {
  return isWorld2Unlocked() || isWorld3Unlocked();
}

/** Red mines, purple mines, and mine carriers in the editor. */
export function canUseWorld3EditorContent(): boolean {
  return isWorld3Unlocked();
}

export function canUseRedMines(): boolean {
  return canUseWorld3EditorContent();
}

export function canUsePurpleMines(): boolean {
  return canUseWorld3EditorContent();
}

export function canUseMineCarriers(): boolean {
  return canUseWorld3EditorContent();
}

export function canUseFlamethrowers(): boolean {
  return isWorld2Unlocked() || isWorld3Unlocked();
}

function applyEditorContentGates(area: CustomAreaContent): void {
  if (area.obstacles.comets.enabled && !canUseComets()) {
    area.obstacles.comets.enabled = false;
  }
  if (area.obstacles.redMines.enabled && !canUseRedMines()) {
    area.obstacles.redMines.enabled = false;
  }
  if (area.obstacles.purpleMines.enabled && !canUsePurpleMines()) {
    area.obstacles.purpleMines.enabled = false;
  }
  if (area.objects.fuelTank.enabled && area.enemies.bossCount > 0) {
    area.objects.fuelTank.enabled = false;
  }
  for (const rule of area.enemies.survival) {
    if (rule.id === 'mineCarrier' && !canUseMineCarriers()) {
      rule.enabled = false;
    }
    if (rule.id === 'flamethrower' && !canUseFlamethrowers()) {
      rule.enabled = false;
    }
  }
  for (const rule of area.enemies.story) {
    if (rule.enabled && !isStoryEnemyIdUnlocked(rule.id)) {
      rule.enabled = false;
    }
  }
  for (const rule of area.enemies.bosses) {
    if (rule.enabled && !isBossIdUnlocked(rule.id)) {
      rule.enabled = false;
    }
  }
}

export type ValidateResult =
  | { ok: true; level: CustomLevelDefinition }
  | { ok: false; error: string };

function readNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSpawnRule(raw: unknown, fallback: SpawnRule): SpawnRule {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SpawnRule>;
  const scaleBy = r.scaleBy === 'score' || r.scaleBy === 'time' || r.scaleBy === 'none'
    ? r.scaleBy
    : fallback.scaleBy;
  return {
    enabled: r.enabled === true,
    // Use nullish checks — `||` would treat intervalMs 0 as missing and reset it.
    intervalMs: clamp(readNumber(r.intervalMs, fallback.intervalMs), 0, 300000),
    chance: clamp(readNumber(r.chance, fallback.chance), 0, 1),
    scaleBy,
    scaleStrength: clamp(readNumber(r.scaleStrength, fallback.scaleStrength), 0, 1),
  };
}

function normalizeEnemyRule(raw: unknown, fallback: EnemySpawnRule): EnemySpawnRule {
  const base = normalizeSpawnRule(raw, fallback);
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<EnemySpawnRule>;
  return {
    ...base,
    id: fallback.id,
    maxOnScreen: clamp(Math.floor(Number(r.maxOnScreen ?? fallback.maxOnScreen) || 1), 1, 12),
  };
}

function normalizeBackground(raw: unknown): EditorBackgroundConfig {
  const def = createDefaultAreaContent().background;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<EditorBackgroundConfig>;
  return {
    skyTop: Number(r.skyTop ?? def.skyTop) || def.skyTop,
    skyBottom: Number(r.skyBottom ?? def.skyBottom) || def.skyBottom,
    starColor: Number(r.starColor ?? def.starColor) || def.starColor,
    starsEnabled: r.starsEnabled !== false,
    obstructionEnabled: r.obstructionEnabled === true,
    obstructionColor: Number(r.obstructionColor ?? def.obstructionColor) || 0,
  };
}

function looksLikeSpawnRule(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw) && 'enabled' in (raw as object);
}

/** Supports legacy `{ mines, redMines: bool, purpleMines: bool }` and the per-variant rules. */
function normalizeObstacles(
  raw: Partial<CustomAreaContent['obstacles']> & Record<string, unknown>,
  def: CustomAreaContent['obstacles'],
): CustomAreaContent['obstacles'] {
  const legacyMines = raw.mines;
  const hasPerVariant =
    looksLikeSpawnRule(raw.blueMines)
    || looksLikeSpawnRule(raw.grayMines)
    || looksLikeSpawnRule(raw.redMines)
    || looksLikeSpawnRule(raw.purpleMines);

  let blueMines: SpawnRule;
  let grayMines: SpawnRule;
  let redMines: SpawnRule;
  let purpleMines: SpawnRule;

  if (!hasPerVariant && looksLikeSpawnRule(legacyMines)) {
    const base = normalizeSpawnRule(legacyMines, def.blueMines);
    // Legacy levels stored red/purple as booleans on the shared mines rule.
    const legacyFlags = raw as Record<string, unknown>;
    blueMines = { ...base };
    grayMines = { ...base };
    redMines = {
      ...base,
      enabled: legacyFlags.redMines === true && base.enabled && canUseRedMines(),
    };
    purpleMines = {
      ...base,
      enabled: legacyFlags.purpleMines === true && base.enabled && canUsePurpleMines(),
    };
  } else {
    blueMines = normalizeSpawnRule(raw.blueMines, def.blueMines);
    grayMines = normalizeSpawnRule(raw.grayMines, def.grayMines);

    // Prefer per-variant rules; also accept leftover legacy boolean flags mixed in.
    // Known keys are typed as SpawnRule, so read extras through unknown.
    const legacyFlags = raw as Record<string, unknown>;
    const timingBase =
      looksLikeSpawnRule(raw.grayMines)
        ? grayMines
        : looksLikeSpawnRule(raw.blueMines)
          ? blueMines
          : def.redMines;

    if (looksLikeSpawnRule(raw.redMines)) {
      redMines = normalizeSpawnRule(raw.redMines, def.redMines);
    } else if (legacyFlags.redMines === true) {
      redMines = { ...timingBase, enabled: canUseRedMines() };
    } else {
      redMines = normalizeSpawnRule(undefined, def.redMines);
    }

    if (looksLikeSpawnRule(raw.purpleMines)) {
      purpleMines = normalizeSpawnRule(raw.purpleMines, def.purpleMines);
    } else if (legacyFlags.purpleMines === true) {
      purpleMines = { ...timingBase, enabled: canUsePurpleMines() };
    } else {
      purpleMines = normalizeSpawnRule(undefined, def.purpleMines);
    }

    if (!canUseRedMines()) redMines.enabled = false;
    if (!canUsePurpleMines()) purpleMines.enabled = false;
  }

  return {
    asteroids: normalizeSpawnRule(raw.asteroids, def.asteroids),
    comets: normalizeSpawnRule(raw.comets, def.comets),
    blueMines,
    grayMines,
    redMines,
    purpleMines,
    brownMines: normalizeSpawnRule(raw.brownMines, def.brownMines),
    planets: normalizeSpawnRule(raw.planets, def.planets),
    moons: normalizeSpawnRule(raw.moons, def.moons),
    blackHoles: normalizeSpawnRule(raw.blackHoles, def.blackHoles),
    smallGravityFields: normalizeSpawnRule(raw.smallGravityFields, def.smallGravityFields),
    largeGravityFields: normalizeSpawnRule(raw.largeGravityFields, def.largeGravityFields),
  };
}

function normalizeAreaContent(raw: unknown): CustomAreaContent {
  const def = createDefaultAreaContent();
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<CustomAreaContent>;
  const objects = (r.objects && typeof r.objects === 'object' ? r.objects : {}) as Partial<CustomAreaContent['objects']>;
  const obstacles = (r.obstacles && typeof r.obstacles === 'object' ? r.obstacles : {}) as Partial<CustomAreaContent['obstacles']>;
  const enemies = (r.enemies && typeof r.enemies === 'object' ? r.enemies : {}) as Partial<CustomAreaContent['enemies']>;
  const misc = (r.misc && typeof r.misc === 'object' ? r.misc : {}) as Partial<CustomAreaContent['misc']>;

  const survivalDefaults = def.enemies.survival;
  const storyDefaults = def.enemies.story;
  const bossDefaults = def.enemies.bosses;

  const survivalRaw = Array.isArray(enemies.survival) ? enemies.survival : [];
  const storyRaw = (Array.isArray(enemies.story) ? enemies.story : []).map((x) => {
    const rule = x as Partial<EnemySpawnRule>;
    return { ...rule, id: migrateLegacyEnemyId(String(rule.id ?? '')) };
  });
  let bossRaw = (Array.isArray(enemies.bosses) ? enemies.bosses : []).map((x) => {
    const rule = x as Partial<EnemySpawnRule>;
    return { ...rule, id: migrateLegacyEnemyId(String(rule.id ?? '')) };
  });

  // Legacy single "boss" rule → copy settings onto all World 1 bosses.
  const legacyBoss = (Array.isArray(enemies.bosses) ? enemies.bosses : [])
    .find((x) => (x as Partial<EnemySpawnRule>)?.id === 'boss') as Partial<EnemySpawnRule> | undefined;
  if (legacyBoss) {
    bossRaw = bossDefaults.map((d) => {
      if (!d.id.startsWith('boss-world1-')) return { id: d.id };
      return { ...legacyBoss, id: d.id };
    });
  }

  return {
    background: normalizeBackground(r.background),
    objects: {
      lootBoxes: normalizeSpawnRule(objects.lootBoxes, def.objects.lootBoxes),
      hearts: normalizeSpawnRule(objects.hearts, def.objects.hearts),
      powerStar: normalizeSpawnRule(objects.powerStar, def.objects.powerStar),
      shield: normalizeSpawnRule(objects.shield, def.objects.shield),
      invisibility: normalizeSpawnRule(objects.invisibility, def.objects.invisibility),
      fuelTank: normalizeSpawnRule(objects.fuelTank, def.objects.fuelTank),
    },
    obstacles: normalizeObstacles(obstacles, def.obstacles),
    enemies: {
      survival: survivalDefaults.map((d) => {
        const rule = normalizeEnemyRule(survivalRaw.find((x) => x.id === d.id), d);
        if (rule.id === 'mineCarrier' && !canUseMineCarriers()) {
          rule.enabled = false;
        }
        if (rule.id === 'flamethrower' && !canUseFlamethrowers()) {
          rule.enabled = false;
        }
        return rule;
      }),
      story: storyDefaults.map((d) => normalizeEnemyRule(storyRaw.find((x) => x.id === d.id), d)),
      bosses: bossDefaults.map((d) => normalizeEnemyRule(bossRaw.find((x) => x.id === d.id), d)),
      bossCount: clamp(Math.floor(Number(enemies.bossCount ?? 0) || 0), 0, 99),
    },
    misc: {
      warpHoles: Array.isArray(misc.warpHoles)
        ? misc.warpHoles
          .filter((w) => w && typeof w === 'object')
          .map((w, i) => {
            const hole = w as Partial<WarpHoleConfig>;
            return {
              id: String(hole.id ?? `warp-${i}`),
              scoreThreshold: clamp(Math.floor(Number(hole.scoreThreshold) || 5000), 0, 999999),
              subAreaId: String(hole.subAreaId ?? ''),
            };
          })
          .filter((w) => w.subAreaId.length > 0)
          .slice(0, 8)
        : [],
      finishPanels: Array.isArray(misc.finishPanels)
        ? misc.finishPanels
          .filter((f) => f && typeof f === 'object')
          .map((f, i) => {
            const panel = f as Partial<FinishPanelConfig>;
            return {
              id: String(panel.id ?? `finish-${i}`),
              scoreThreshold: clamp(Math.floor(Number(panel.scoreThreshold) || 5000), 0, 999999),
            };
          })
          .slice(0, 4)
        : [],
    },
  };
}

export function validateAndNormalizeLevel(raw: unknown): ValidateResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid level data.' };
  }
  const obj = raw as Partial<CustomLevelDefinition>;
  if (obj.v !== CUSTOM_LEVEL_VERSION && obj.v !== undefined) {
    // Accept missing v as v1 after normalize; reject future versions.
    if (typeof obj.v === 'number' && obj.v > CUSTOM_LEVEL_VERSION) {
      return { ok: false, error: `Unsupported level version ${obj.v}.` };
    }
  }

  const area = normalizeAreaContent(obj);
  applyEditorContentGates(area);

  const subAreasRaw = Array.isArray(obj.subAreas) ? obj.subAreas : [];
  const subAreas: CustomSubArea[] = subAreasRaw
    .filter((s) => s && typeof s === 'object')
    .slice(0, 8)
    .map((s, i) => {
      const sub = s as Partial<CustomSubArea>;
      const content = normalizeAreaContent(sub);
      applyEditorContentGates(content);
      return {
        id: String(sub.id ?? `sub-${i + 1}`),
        name: String(sub.name ?? `Sub-Area ${i + 1}`).slice(0, 32),
        ...content,
      };
    });

  // Drop warp holes pointing at missing sub-areas.
  const subIds = new Set(subAreas.map((s) => s.id));
  area.misc.warpHoles = area.misc.warpHoles.filter((w) => subIds.has(w.subAreaId));
  for (const sub of subAreas) {
    sub.misc.warpHoles = sub.misc.warpHoles.filter((w) => subIds.has(w.subAreaId) && w.subAreaId !== sub.id);
  }

  const name = String(obj.name ?? 'Custom Level').trim().slice(0, 32) || 'Custom Level';

  return {
    ok: true,
    level: {
      v: CUSTOM_LEVEL_VERSION,
      name,
      ...area,
      subAreas,
    },
  };
}

/** Compact shareable code (base64 JSON). */
export function encodeLevelCode(level: CustomLevelDefinition): string {
  const validated = validateAndNormalizeLevel(level);
  if (!validated.ok) return '';
  const json = JSON.stringify(validated.level);
  try {
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return json;
  }
}

export function decodeLevelCode(code: string): ValidateResult {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: 'Empty code.' };

  let json = trimmed;
  try {
    if (!trimmed.startsWith('{')) {
      json = decodeURIComponent(escape(atob(trimmed)));
    }
  } catch {
    // try as raw JSON
    json = trimmed;
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    return validateAndNormalizeLevel(parsed);
  } catch {
    return { ok: false, error: 'Could not parse level code.' };
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function pasteTextFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Compute effective spawn interval from a rule given score and elapsed ms.
 * Returns Number.POSITIVE_INFINITY when disabled.
 */
export function getEffectiveIntervalMs(
  rule: SpawnRule,
  score: number,
  elapsedMs: number,
): number {
  if (!rule.enabled) return Number.POSITIVE_INFINITY;
  // Never allow 0ms (every-frame) spawns — that softlocks the ship under asteroid spam.
  const base = Math.max(400, rule.intervalMs <= 0 ? 400 : rule.intervalMs);
  let interval = base;
  if (rule.scaleBy === 'score') {
    const steps = Math.floor(score / 1000);
    interval = base * (1 - rule.scaleStrength * Math.min(0.85, steps * 0.08));
  } else if (rule.scaleBy === 'time') {
    const steps = Math.floor(elapsedMs / 10000);
    interval = base * (1 - rule.scaleStrength * Math.min(0.85, steps * 0.08));
  }
  return Math.max(400, interval);
}
