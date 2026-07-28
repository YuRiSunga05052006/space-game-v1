import type { SecretLevelDefinition } from '../world1/secretLevels';

export const WORLD2_SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  galilean: {
    id: 'galilean',
    name: 'Galilean Moons',
    location: 'Galilean Moons — Io · Europa · Ganymede · Callisto',
    themeId: 'galilean',
    hasBoss: false,
    scoreThreshold: 7000,
    exitScoreThreshold: 7000,
    entryLevel: 11,
    worldId: 'world2',
    exitPanel: 'finish',
    finishUnlockLevel: 15,
  },
};

export function getWorld2SecretLevel(id: string): SecretLevelDefinition | undefined {
  return WORLD2_SECRET_LEVELS[id];
}
