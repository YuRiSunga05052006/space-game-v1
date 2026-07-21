export const MAX_POWER_UP_LEVEL = 5;

export const SHIELD_DURATION_MS: Record<number, number> = {
  1: 8000,
  2: 10000,
  3: 12000,
  4: 14000,
  5: 16000,
};

export const INVISIBILITY_DURATION_MS: Record<number, number> = {
  1: 4000,
  2: 5000,
  3: 6000,
  4: 7000,
  5: 8000,
};

export const FUEL_TANK_SCORE_CAP: Record<number, number> = {
  1: 1000,
  2: 1250,
  3: 1500,
  4: 1750,
  5: 2000,
};

export const FUEL_TANK_BOOST_DURATION_MS = 3000;
export const ENGINE_BOOST_DURATION_MS = 4000;
export const ENGINE_SCORE_CAP = 5000;
export const HYPERDRIVE_BOOST_DURATION_MS = 6000;
export const HYPERDRIVE_SCORE_CAP = 10000;

export function getShieldDurationMs(level: number): number {
  return SHIELD_DURATION_MS[level] ?? SHIELD_DURATION_MS[1];
}

export function getInvisibilityDurationMs(level: number): number {
  return INVISIBILITY_DURATION_MS[level] ?? INVISIBILITY_DURATION_MS[1];
}

export function getFuelTankScoreCap(level: number): number {
  return FUEL_TANK_SCORE_CAP[level] ?? FUEL_TANK_SCORE_CAP[1];
}
