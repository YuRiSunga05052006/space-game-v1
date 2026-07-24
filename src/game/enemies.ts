import Phaser from 'phaser';
import { getEscalationLevel, getSurvivalEnemyCountBonus } from './difficulty';

export type EnemyKind = 'spider' | 'seeker' | 'wasp' | 'turret' | 'mineCarrier';

const ENEMY_BASE_INTERVAL: Record<EnemyKind, number> = {
  spider: 9000,
  seeker: 11000,
  wasp: 13000,
  turret: 15000,
  mineCarrier: 14000,
};

const ENEMY_INTERVAL_REDUCTION: Record<EnemyKind, number> = {
  spider: 1200,
  seeker: 800,
  wasp: 1000,
  turret: 900,
  mineCarrier: 900,
};

const ENEMY_MIN_INTERVAL: Record<EnemyKind, number> = {
  spider: 3500,
  seeker: 5000,
  wasp: 5500,
  turret: 6000,
  mineCarrier: 6000,
};

const ENEMY_BASE_MAX: Record<EnemyKind, number> = {
  spider: 2,
  seeker: 2,
  wasp: 2,
  turret: 1,
  mineCarrier: 2,
};

const ENEMY_SURVIVAL_MAX: Record<EnemyKind, number> = {
  spider: 5,
  seeker: 4,
  wasp: 5,
  turret: 3,
  mineCarrier: 3,
};

/** Minimum ms between any enemy spawn attempt. */
export const ENEMY_SPAWN_TICK_MS = 2500;

export const MINE_CARRIER_UNLOCK_SCORE = 3000;

/**
 * Score bands: 0-999 none, 1000+ spider, 2000+ seeker, 3000+ mineCarrier (W3), 4000+ wasp, 5000+ turret.
 * Story Mode passes storyLevel so Mine Carriers only unlock at L27+.
 */
export function getUnlockedEnemyKinds(
  score: number,
  worldId = 'world1',
  storyLevel?: number,
): EnemyKind[] {
  const kinds: EnemyKind[] = [];
  if (score >= 1000) kinds.push('spider');
  if (score >= 2000) kinds.push('seeker');
  if (
    score >= MINE_CARRIER_UNLOCK_SCORE
    && worldId === 'world3'
    && (storyLevel === undefined || storyLevel >= 27)
  ) {
    kinds.push('mineCarrier');
  }
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

export function getMaxOnScreen(
  kind: EnemyKind,
  score: number,
  survival = false,
  worldId = 'world1',
  storyLevel?: number,
): number {
  if (!getUnlockedEnemyKinds(score, worldId, storyLevel).includes(kind)) return 0;

  let max = ENEMY_BASE_MAX[kind];

  if (survival) {
    const bonus = getSurvivalEnemyCountBonus(score);
    switch (kind) {
      case 'spider':
      case 'wasp':
        max += bonus;
        break;
      case 'seeker':
      case 'mineCarrier':
        max += Math.ceil(bonus / 2);
        break;
      case 'turret':
        if (score >= 7000) max += 1;
        max += Math.floor(bonus / 2);
        break;
    }
    return Math.min(max, ENEMY_SURVIVAL_MAX[kind]);
  }

  const level = getEscalationLevel(score);

  switch (kind) {
    case 'spider':
      max += level;
      break;
    case 'seeker':
    case 'mineCarrier':
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

function getEnemyWeight(kind: EnemyKind, score: number, worldId: string, storyLevel?: number): number {
  const level = getEscalationLevel(score);
  switch (kind) {
    case 'spider':
      return score >= 1000 ? 3 + level : 0;
    case 'seeker':
      return score >= 2000 ? 3 + Math.floor(level / 2) : 0;
    case 'mineCarrier':
      return getUnlockedEnemyKinds(score, worldId, storyLevel).includes('mineCarrier')
        ? 3 + level
        : 0;
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
  survival = false,
  worldId = 'world1',
  storyLevel?: number,
): EnemyKind | null {
  const unlocked = getUnlockedEnemyKinds(score, worldId, storyLevel);
  if (unlocked.length === 0) return null;

  const candidates = unlocked.filter(
    (kind) => counts[kind] < getMaxOnScreen(kind, score, survival, worldId, storyLevel),
  );
  if (candidates.length === 0) return null;

  const weighted: EnemyKind[] = [];
  for (const kind of candidates) {
    const weight = getEnemyWeight(kind, score, worldId, storyLevel);
    for (let i = 0; i < weight; i++) weighted.push(kind);
  }

  if (weighted.length === 0) return null;
  return weighted[Phaser.Math.Between(0, weighted.length - 1)];
}

export function getEnemySpawnInterval(score: number, worldId = 'world1', storyLevel?: number): number {
  const unlocked = getUnlockedEnemyKinds(score, worldId, storyLevel);
  if (unlocked.length === 0) return ENEMY_SPAWN_TICK_MS;

  const fastest = Math.min(...unlocked.map((k) => getEnemySpawnMs(k, score)));
  return Math.max(ENEMY_SPAWN_TICK_MS, fastest);
}
