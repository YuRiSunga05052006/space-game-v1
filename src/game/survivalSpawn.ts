import Phaser from 'phaser';
import { getEscalationLevel } from './difficulty';
import { getStoryEnemyDefinition as getW1StoryEnemy } from './world1/storyEnemyDefinitions';
import { getStoryEnemyDefinition as getW2StoryEnemy } from './world2/storyEnemyDefinitions';
import type { StoryEnemyDefinition } from './levelResolver';

const WORLD1_STORY_ENEMY_UNLOCK_SCORES: Record<number, number> = {
  1: 3000,
  2: 5000,
  3: 7000,
  4: 9000,
  5: 11000,
  6: 13000,
  7: 15000,
  8: 17000,
  9: 19000,
  10: 21000,
};

const WORLD2_STORY_ENEMY_UNLOCK_SCORES: Record<number, number> = {
  11: 23000,
  12: 25000,
  13: 27000,
  14: 29000,
  15: 31000,
  16: 33000,
  17: 35000,
  18: 37000,
  19: 39000,
  20: 41000,
};

const SURVIVAL_BOSS_FIRST_SCORE = 8000;
const SURVIVAL_BOSS_SCORE_STEP = 4000;
const WORLD1_SURVIVAL_BOSS_MAX_LEVEL = 10;
const WORLD2_SURVIVAL_BOSS_FIRST_SCORE = 24000;
const WORLD2_SURVIVAL_BOSS_SCORE_STEP = 4000;
const WORLD2_SURVIVAL_BOSS_MAX_LEVEL = 20;

const SURVIVAL_BOSS_BASE_DELAY_MS = 90_000;
const SURVIVAL_BOSS_MIN_DELAY_MS = 45_000;
const STORY_ENEMY_BASE_INTERVAL_MS = 10_000;
const STORY_ENEMY_MIN_INTERVAL_MS = 5000;

function getStoryEnemyScale(score: number): number {
  const escalation = getEscalationLevel(score);
  return Math.min(2, 1 + escalation * 0.1);
}

function getUnlockTable(worldId: string): Record<number, number> {
  return worldId === 'world2' ? WORLD2_STORY_ENEMY_UNLOCK_SCORES : WORLD1_STORY_ENEMY_UNLOCK_SCORES;
}

function getStoryEnemyDef(worldId: string, level: number): StoryEnemyDefinition {
  return worldId === 'world2' ? getW2StoryEnemy(level) : getW1StoryEnemy(level);
}

function getLevelRange(worldId: string): { min: number; max: number } {
  return worldId === 'world2' ? { min: 11, max: 20 } : { min: 1, max: 10 };
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

export function getMaxStoryEnemiesOnScreen(level: number, score: number, worldId = 'world1'): number {
  const base = getStoryEnemyDef(worldId, level).maxOnScreen;
  const bonus = Math.floor(getEscalationLevel(score) / 2);
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
  if (worldId === 'world2') {
    if (score < WORLD2_SURVIVAL_BOSS_FIRST_SCORE) return 0;
    const unlocked = 11 + Math.floor((score - WORLD2_SURVIVAL_BOSS_FIRST_SCORE) / WORLD2_SURVIVAL_BOSS_SCORE_STEP);
    return Math.min(WORLD2_SURVIVAL_BOSS_MAX_LEVEL, unlocked);
  }

  if (score < SURVIVAL_BOSS_FIRST_SCORE) return 0;
  const unlocked = 1 + Math.floor((score - SURVIVAL_BOSS_FIRST_SCORE) / SURVIVAL_BOSS_SCORE_STEP);
  return Math.min(WORLD1_SURVIVAL_BOSS_MAX_LEVEL, unlocked);
}

export function getSurvivalBossSpawnDelayMs(score: number, _bossesDefeated: number): number {
  const escalation = getEscalationLevel(score);
  return Math.max(SURVIVAL_BOSS_MIN_DELAY_MS, SURVIVAL_BOSS_BASE_DELAY_MS - escalation * 5000);
}

export function pickSurvivalBossLevel(score: number, _bossesDefeated: number, worldId = 'world1'): number | null {
  const maxLevel = getMaxUnlockedBossLevel(score, worldId);
  if (maxLevel === 0) return null;

  const minLevel = worldId === 'world2' ? 11 : 1;
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
  if (worldId === 'world2') {
    if (level < 11 || level > WORLD2_SURVIVAL_BOSS_MAX_LEVEL) return 0;
    return WORLD2_SURVIVAL_BOSS_FIRST_SCORE + (level - 11) * WORLD2_SURVIVAL_BOSS_SCORE_STEP;
  }
  if (level <= 0 || level > WORLD1_SURVIVAL_BOSS_MAX_LEVEL) return 0;
  return SURVIVAL_BOSS_FIRST_SCORE + (level - 1) * SURVIVAL_BOSS_SCORE_STEP;
}

export function computeSurvivalBossPoints(basePoints: number, score: number): number {
  const escalation = getEscalationLevel(score);
  const bonus = Math.floor(basePoints * escalation * 0.08);
  return basePoints + bonus;
}
