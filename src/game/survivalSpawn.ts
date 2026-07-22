import Phaser from 'phaser';
import { getEscalationLevel, getSurvivalEnemyCountBonus } from './difficulty';
import { getStoryEnemyDefinition as getW1StoryEnemy } from './world1/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getW2StoryEnemy } from './world2/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getW3StoryEnemy } from './world3/storyEnemyDefinitions';
import type { StoryEnemyDefinition } from './levelResolver';
import { getWorldLevelRange } from './worlds';

interface WorldSurvivalConfig {
  min: number;
  max: number;
  enemyScores: Record<number, number>;
  bossFirst: number;
  bossStep: number;
}

const WORLD1_STORY_ENEMY_UNLOCK_SCORES: Record<number, number> = {
  1: 0, 2: 2000, 3: 4000, 4: 6000, 5: 8000,
  6: 10000, 7: 12000, 8: 14000, 9: 16000, 10: 18000,
};

const WORLD2_STORY_ENEMY_UNLOCK_SCORES: Record<number, number> = {
  11: 1000, 12: 3000, 13: 5000, 14: 7000, 15: 9000,
  16: 11000, 17: 13000, 18: 15000, 19: 17000, 20: 19000,
};

const WORLD3_STORY_ENEMY_UNLOCK_SCORES: Record<number, number> = Object.fromEntries(
  Array.from({ length: 18 }, (_, i) => [21 + i, 1000 + i * 1000]),
);

const WORLD_SURVIVAL_CONFIG: Record<string, WorldSurvivalConfig> = {
  world1: {
    min: 1,
    max: 10,
    enemyScores: WORLD1_STORY_ENEMY_UNLOCK_SCORES,
    bossFirst: 8000,
    bossStep: 4000,
  },
  world2: {
    min: 11,
    max: 20,
    enemyScores: WORLD2_STORY_ENEMY_UNLOCK_SCORES,
    bossFirst: 12000,
    bossStep: 4000,
  },
  world3: {
    min: 21,
    max: 38,
    enemyScores: WORLD3_STORY_ENEMY_UNLOCK_SCORES,
    bossFirst: 12000,
    bossStep: 4000,
  },
};

const SURVIVAL_BOSS_BASE_DELAY_MS = 90_000;
const SURVIVAL_BOSS_MIN_DELAY_MS = 45_000;
const STORY_ENEMY_BASE_INTERVAL_MS = 10_000;
const STORY_ENEMY_MIN_INTERVAL_MS = 5000;

function getStoryEnemyScale(score: number): number {
  const escalation = getEscalationLevel(score);
  return Math.min(2, 1 + escalation * 0.1);
}

function getSurvivalConfig(worldId: string): WorldSurvivalConfig {
  const config = WORLD_SURVIVAL_CONFIG[worldId] ?? WORLD_SURVIVAL_CONFIG.world1;
  const range = getWorldLevelRange(worldId);
  return { ...config, min: range.min, max: range.max };
}

function getUnlockTable(worldId: string): Record<number, number> {
  return getSurvivalConfig(worldId).enemyScores;
}

function getStoryEnemyDef(worldId: string, level: number): StoryEnemyDefinition {
  if (worldId === 'world3') return getW3StoryEnemy(level);
  if (worldId === 'world2') return getW2StoryEnemy(level);
  return getW1StoryEnemy(level);
}

function getLevelRange(worldId: string): { min: number; max: number } {
  const range = getWorldLevelRange(worldId);
  return { min: range.min, max: range.max };
}

export function getUnlockedStoryEnemyLevels(score: number, worldId = 'world1'): number[] {
  const table = getUnlockTable(worldId);
  const { min, max } = getLevelRange(worldId);
  const levels: number[] = [];
  for (let level = min; level <= max; level++) {
    if (score >= (table[level] ?? Infinity)) {
      levels.push(level);
    }
  }
  return levels;
}

const STORY_ENEMY_SURVIVAL_EXTRA_CAP = 2;

export function getMaxStoryEnemiesOnScreen(level: number, score: number, worldId = 'world1'): number {
  const base = getStoryEnemyDef(worldId, level).maxOnScreen;
  const bonus = Math.min(STORY_ENEMY_SURVIVAL_EXTRA_CAP, getSurvivalEnemyCountBonus(score));
  return base + bonus;
}

export function getStoryEnemySpawnInterval(score: number): number {
  const escalation = getEscalationLevel(score);
  return Math.max(STORY_ENEMY_MIN_INTERVAL_MS, STORY_ENEMY_BASE_INTERVAL_MS - escalation * 800);
}

function getStoryEnemyWeight(level: number, score: number, worldId: string): number {
  const unlocked = getUnlockedStoryEnemyLevels(score, worldId);
  if (!unlocked.includes(level)) return 0;

  const index = unlocked.indexOf(level);
  const tierBonus = index + 1;
  const escalation = getEscalationLevel(score);
  return 2 + tierBonus + Math.floor(escalation / 2);
}

export function pickStoryEnemyToSpawn(
  score: number,
  countsByLevel: Record<number, number>,
  worldId = 'world1',
): number | null {
  const unlocked = getUnlockedStoryEnemyLevels(score, worldId);
  if (unlocked.length === 0) return null;

  const candidates = unlocked.filter(
    (level) => (countsByLevel[level] ?? 0) < getMaxStoryEnemiesOnScreen(level, score, worldId),
  );
  if (candidates.length === 0) return null;

  const weighted: number[] = [];
  for (const level of candidates) {
    const weight = getStoryEnemyWeight(level, score, worldId);
    for (let i = 0; i < weight; i++) weighted.push(level);
  }

  if (weighted.length === 0) return null;
  return weighted[Phaser.Math.Between(0, weighted.length - 1)];
}

export function scaleStoryEnemyDefinition(
  definition: StoryEnemyDefinition,
  score: number,
): StoryEnemyDefinition {
  const scale = getStoryEnemyScale(score);
  return {
    ...definition,
    health: Math.max(1, Math.round(definition.health * scale)),
    bodyDamage: Math.max(1, Math.round(definition.bodyDamage * scale)),
    moveSpeed: Math.round(definition.moveSpeed * Math.min(1.5, scale)),
  };
}

export function getMaxUnlockedBossLevel(score: number, worldId = 'world1'): number {
  const config = getSurvivalConfig(worldId);
  if (score < config.bossFirst) return 0;
  const unlocked = config.min + Math.floor((score - config.bossFirst) / config.bossStep);
  return Math.min(config.max, unlocked);
}

export function getSurvivalBossSpawnDelayMs(score: number, _bossesDefeated: number): number {
  const escalation = getEscalationLevel(score);
  return Math.max(SURVIVAL_BOSS_MIN_DELAY_MS, SURVIVAL_BOSS_BASE_DELAY_MS - escalation * 5000);
}

export function pickSurvivalBossLevel(score: number, _bossesDefeated: number, worldId = 'world1'): number | null {
  const maxLevel = getMaxUnlockedBossLevel(score, worldId);
  if (maxLevel === 0) return null;

  const minLevel = getSurvivalConfig(worldId).min;
  const weighted: number[] = [];
  for (let level = minLevel; level <= maxLevel; level++) {
    const weight = 1 + Math.floor((level - minLevel + 1) / 2);
    for (let i = 0; i < weight; i++) weighted.push(level);
  }

  if (weighted.length === 0) return null;
  return weighted[Phaser.Math.Between(0, weighted.length - 1)];
}

export function getStoryEnemyUnlockScore(level: number, worldId = 'world1'): number {
  const table = getUnlockTable(worldId);
  return table[level] ?? 0;
}

export function getSurvivalBossUnlockScore(level: number, worldId = 'world1'): number {
  const config = getSurvivalConfig(worldId);
  if (level < config.min || level > config.max) return 0;
  return config.bossFirst + (level - config.min) * config.bossStep;
}

export function computeSurvivalBossPoints(basePoints: number, score: number): number {
  const escalation = getEscalationLevel(score);
  const bonus = Math.floor(basePoints * escalation * 0.08);
  return basePoints + bonus;
}
