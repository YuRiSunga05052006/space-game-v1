import type { AsteroidSize } from './entities/Asteroid';

export const GOLD_ASTEROID_SPAWN_CHANCE = 0.025;
export const MAX_GOLD_ASTEROIDS_ON_SCREEN = 1;
export const SPECIAL_SKIN_GOLD_SPAWN_MULTIPLIER = 1.75;

export const GOLD_ASTEROID_COINS: Record<AsteroidSize, number> = {
  sm: 3,
  md: 6,
  lg: 10,
};

export const ENEMY_COIN_DROP_CHANCE = 0.1;
export const ENEMY_COIN_REWARD = 5;

export function getGoldAsteroidCoinReward(size: AsteroidSize): number {
  return GOLD_ASTEROID_COINS[size];
}

export function getGoldAsteroidSpawnChance(survivalBonus: boolean): number {
  return survivalBonus
    ? GOLD_ASTEROID_SPAWN_CHANCE * SPECIAL_SKIN_GOLD_SPAWN_MULTIPLIER
    : GOLD_ASTEROID_SPAWN_CHANCE;
}

export function rollEnemyCoinDrop(): number | null {
  if (Math.random() < ENEMY_COIN_DROP_CHANCE) {
    return ENEMY_COIN_REWARD;
  }
  return null;
}

export const COMET_SPAWN_CHANCE = 0.03;
/** Higher chance from Story L16+ (Kuiper Belt onward) and World 3+. */
export const COMET_SPAWN_CHANCE_FREQUENT = 0.06;
export const COMET_SPAWN_INTERVAL_MS = 3500;
export const COMET_SPAWN_INTERVAL_FREQUENT_MS = 2200;
export const GOLD_COMET_SPAWN_CHANCE = 0.005;
export const GOLD_COMET_SPAWN_CHANCE_FREQUENT = 0.01;
export const MAX_COMETS_ON_SCREEN = 2;
export const GOLD_COMET_COIN_REWARD = 15;

export const MINE_SPAWN_CHANCE = 0.04;
/** Cap for gray / red / purple mines. Blue mines are uncapped. */
export const MAX_MINES_ON_SCREEN = 4;
/** Per-color soft cap in Level Editor play for limited (non-blue) mine colors. */
export const MAX_MINES_PER_VARIANT_EDITOR = 3;

export function getGoldCometCoinReward(): number {
  return GOLD_COMET_COIN_REWARD;
}

export function getGoldCometSpawnChance(survivalBonus: boolean, frequent = false): number {
  const base = frequent ? GOLD_COMET_SPAWN_CHANCE_FREQUENT : GOLD_COMET_SPAWN_CHANCE;
  return survivalBonus
    ? base * SPECIAL_SKIN_GOLD_SPAWN_MULTIPLIER
    : base;
}

export function getCometSpawnChance(frequent: boolean): number {
  return frequent ? COMET_SPAWN_CHANCE_FREQUENT : COMET_SPAWN_CHANCE;
}

export function getCometSpawnIntervalMs(frequent: boolean): number {
  return frequent ? COMET_SPAWN_INTERVAL_FREQUENT_MS : COMET_SPAWN_INTERVAL_MS;
}
