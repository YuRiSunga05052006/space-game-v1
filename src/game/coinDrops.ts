import type { AsteroidSize } from './entities/Asteroid';

export const GOLD_ASTEROID_SPAWN_CHANCE = 0.025;
export const MAX_GOLD_ASTEROIDS_ON_SCREEN = 1;

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

export function rollEnemyCoinDrop(): number | null {
  if (Math.random() < ENEMY_COIN_DROP_CHANCE) {
    return ENEMY_COIN_REWARD;
  }
  return null;
}

export const COMET_SPAWN_CHANCE = 0.03;
export const GOLD_COMET_SPAWN_CHANCE = 0.005;
export const MAX_COMETS_ON_SCREEN = 2;
export const GOLD_COMET_COIN_REWARD = 15;

export function getGoldCometCoinReward(): number {
  return GOLD_COMET_COIN_REWARD;
}
