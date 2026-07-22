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
  1: 200,
  2: 400,
  3: 600,
  4: 800,
  5: 1000,
};

export const ENGINE_SCORE_CAP = 2500;
export const HYPERDRIVE_SCORE_CAP = 7500;

/** Invisibility + mercy invincibility after Fuel Tank / Engine / Hyperdrive boost ends. */
export const POST_SCORE_BOOST_INVISIBILITY_MS = 5000;
export const POST_SCORE_BOOST_MERCY_INVINCIBILITY_MS = 5000;

export function getShieldDurationMs(level: number): number {
  return SHIELD_DURATION_MS[level] ?? SHIELD_DURATION_MS[1];
}

export function getInvisibilityDurationMs(level: number): number {
  return INVISIBILITY_DURATION_MS[level] ?? INVISIBILITY_DURATION_MS[1];
}

export function getFuelTankScoreCap(level: number): number {
  return FUEL_TANK_SCORE_CAP[level] ?? FUEL_TANK_SCORE_CAP[1];
}

export const DEATH_BOMB_RADIUS_PX: Record<number, number> = {
  1: 90,
  2: 105,
  3: 120,
  4: 135,
  5: 150,
};

export const DEATH_BOMB_DAMAGE: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 8,
};

export function getDeathBombRadius(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_POWER_UP_LEVEL, Math.floor(level)));
  return DEATH_BOMB_RADIUS_PX[clamped] ?? DEATH_BOMB_RADIUS_PX[1];
}

export function getDeathBombDamage(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_POWER_UP_LEVEL, Math.floor(level)));
  return DEATH_BOMB_DAMAGE[clamped] ?? DEATH_BOMB_DAMAGE[1];
}
