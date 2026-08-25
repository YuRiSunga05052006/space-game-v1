import type { DifficultyTier } from './difficulty';

export const SPACE_DEBRIS_SPAWN_CHANCE: Record<DifficultyTier, number> = {
  easy: 0.05,
  medium: 0.1,
  hard: 0.2,
};

export function rollSpaceDebrisInsteadOfHeart(tier: DifficultyTier): boolean {
  return Math.random() < SPACE_DEBRIS_SPAWN_CHANCE[tier];
}
