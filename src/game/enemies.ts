import Phaser from 'phaser';
import { getEscalationLevel } from './difficulty';

export type EnemyKind = 'spider' | 'seeker' | 'wasp' | 'turret';

const ENEMY_BASE_INTERVAL: Record<EnemyKind, number> = {
  spider: 9000,
  seeker: 11000,
  wasp: 13000,
  turret: 15000,
};

const ENEMY_INTERVAL_REDUCTION: Record<EnemyKind, number> = {
  spider: 1200,
  seeker: 800,
  wasp: 1000,
  turret: 900,
};

const ENEMY_MIN_INTERVAL: Record<EnemyKind, number> = {
  spider: 3500,
  seeker: 5000,
  wasp: 5500,
  turret: 6000,
};

const ENEMY_BASE_MAX: Record<EnemyKind, number> = {
  spider: 2,
  seeker: 2,
  wasp: 2,
  turret: 1,
};

/** Minimum ms between any enemy spawn attempt. */
export const ENEMY_SPAWN_TICK_MS = 2500;

/** Score bands: 0-999 none, 1000+ spider, 2000+ seeker, 4000+ wasp, 5000+ turret. */
export function getUnlockedEnemyKinds(score: number): EnemyKind[] {
  const kinds: EnemyKind[] = [];
  if (score >= 1000) kinds.push('spider');
  if (score >= 2000) kinds.push('seeker');
  if (score >= 4000) kinds.push('wasp');
  if (score >= 5000) kinds.push('turret');
  return kinds;
}

export function getEnemySpawnMs(kind: EnemyKind, score: number): number {
  const level = getEscalationLevel(score);
  const base = ENEMY_BASE_INTERVAL[kind];
  const reduction = level * ENEMY_INTERVAL_REDUCTION[kind];
  return Math.max(ENEMY_MIN_INTERVAL[kind], base - reduction);
}

export function getMaxOnScreen(kind: EnemyKind, score: number): number {
  if (!getUnlockedEnemyKinds(score).includes(kind)) return 0;

  const level = getEscalationLevel(score);
  let max = ENEMY_BASE_MAX[kind];

  switch (kind) {
    case 'spider':
      max += level;
      break;
    case 'seeker':
      max += Math.floor(level / 2);
      break;
    case 'wasp':
      max += level;
      break;
    case 'turret':
      if (score >= 7000) max += 1;
      max += Math.floor(level / 2);
      break;
  }

  return max;
}

function getEnemyWeight(kind: EnemyKind, score: number): number {
  const level = getEscalationLevel(score);
  switch (kind) {
    case 'spider':
      return score >= 1000 ? 3 + level : 0;
    case 'seeker':
      return score >= 2000 ? 3 + Math.floor(level / 2) : 0;
    case 'wasp':
      return score >= 4000 ? 4 + level : 0;
    case 'turret':
      return score >= 5000 ? 3 + level : 0;
    default:
      return 1;
  }
}

export function pickEnemyToSpawn(
  score: number,
  counts: Record<EnemyKind, number>,
): EnemyKind | null {
  const unlocked = getUnlockedEnemyKinds(score);
  if (unlocked.length === 0) return null;

  const candidates = unlocked.filter((kind) => counts[kind] < getMaxOnScreen(kind, score));
  if (candidates.length === 0) return null;

  const weighted: EnemyKind[] = [];
  for (const kind of candidates) {
    const weight = getEnemyWeight(kind, score);
    for (let i = 0; i < weight; i++) weighted.push(kind);
  }

  if (weighted.length === 0) return null;
  return weighted[Phaser.Math.Between(0, weighted.length - 1)];
}

export function getEnemySpawnInterval(score: number): number {
  const unlocked = getUnlockedEnemyKinds(score);
  if (unlocked.length === 0) return ENEMY_SPAWN_TICK_MS;

  const fastest = Math.min(...unlocked.map((k) => getEnemySpawnMs(k, score)));
  return Math.max(ENEMY_SPAWN_TICK_MS, fastest);
}
