export type DifficultyTier = 'easy' | 'medium' | 'hard';

export const ESCALATION_START_SCORE = 3000;
export const ESCALATION_STEP_SCORE = 1000;

export function getDifficultyTier(score: number): DifficultyTier {
  if (score < 1000) return 'easy';
  if (score <= 2000) return 'medium';
  return 'hard';
}

/** 0 below 3000; +1 at 3000, +2 at 4000, etc. */
export function getEscalationLevel(score: number): number {
  if (score < ESCALATION_START_SCORE) return 0;
  return Math.floor((score - ESCALATION_START_SCORE) / ESCALATION_STEP_SCORE) + 1;
}

/** Survival: extra concurrent enemy ships (+1 per step, capped). */
export const SURVIVAL_ENEMY_COUNT_STEP_SCORE = 2500;
export const SURVIVAL_ENEMY_COUNT_BONUS_CAP = 3;

export function getSurvivalEnemyCountBonus(score: number): number {
  if (score <= 0) return 0;
  return Math.min(
    SURVIVAL_ENEMY_COUNT_BONUS_CAP,
    Math.floor(score / SURVIVAL_ENEMY_COUNT_STEP_SCORE),
  );
}

export const HEART_SPAWN_MS: Record<DifficultyTier, number> = {
  easy: 10000,
  medium: 15000,
  hard: 20000,
};

const SPIDER_SPAWN_MS_BASE = 9000;
const MAX_SPIDERS_BASE = 2;
const ASTEROID_INTERVAL_REDUCTION_PER_LEVEL = 100;
const MAX_ASTEROID_INTERVAL_REDUCTION = 50;
const MIN_ASTEROID_SPAWN_MS = 350;

export function shouldSpawnSpiders(score: number): boolean {
  return getDifficultyTier(score) === 'medium' || score >= ESCALATION_START_SCORE;
}

export function getSpiderSpawnMs(score: number): number {
  const level = getEscalationLevel(score);
  if (level === 0) return SPIDER_SPAWN_MS_BASE;
  return Math.max(3500, SPIDER_SPAWN_MS_BASE - level * 1500);
}

export function getMaxSpidersOnScreen(score: number): number {
  if (!shouldSpawnSpiders(score)) return 0;
  return MAX_SPIDERS_BASE + getEscalationLevel(score);
}

/** Score-based multi-spawn disabled — asteroids stay at 1 per tick. */
export function getExtraAsteroidSpawns(_score: number): number {
  return 0;
}

export function getEscalatedAsteroidSpawnInterval(baseInterval: number, score: number): number {
  const reduction = Math.min(
    MAX_ASTEROID_INTERVAL_REDUCTION,
    getEscalationLevel(score) * ASTEROID_INTERVAL_REDUCTION_PER_LEVEL,
  );
  return Math.max(MIN_ASTEROID_SPAWN_MS, baseInterval - reduction);
}
