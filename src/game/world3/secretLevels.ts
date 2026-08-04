import type { SecretLevelDefinition } from '../world1/secretLevels';

export const WORLD3_SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  wise0855: {
    id: 'wise0855',
    name: 'WISE 0855-0714',
    location: 'WISE 0855-0714',
    themeId: 'wise0855',
    hasBoss: false,
    scoreThreshold: 7000,
    exitScoreThreshold: 7000,
    entryLevel: 24,
    worldId: 'world3',
    exitPanel: 'finish',
    finishUnlockLevel: 32,
    darkLevel: true,
    darkObstructionColor: 0x000000,
  },
};

export function getWorld3SecretLevel(id: string): SecretLevelDefinition | undefined {
  return WORLD3_SECRET_LEVELS[id];
}
