export interface SecretLevelDefinition {
  id: string;
  name: string;
  location: string;
  themeId: string;
  hasBoss: boolean;
  /** Score required to spawn wormhole (enter) or warp panel (exit). */
  scoreThreshold: number;
  /** Story level where the entry wormhole appears. */
  entryLevel: number;
}

export const SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  iss: {
    id: 'iss',
    name: 'International Space Station',
    location: 'International Space Station',
    themeId: 'iss',
    hasBoss: false,
    scoreThreshold: 5000,
    entryLevel: 1,
  },
  dawn: {
    id: 'dawn',
    name: 'Dawn',
    location: 'Dawn Mission — Ceres Transit',
    themeId: 'dawn',
    hasBoss: false,
    scoreThreshold: 6000,
    entryLevel: 6,
  },
};

export function getSecretLevel(id: string): SecretLevelDefinition | undefined {
  return SECRET_LEVELS[id];
}
