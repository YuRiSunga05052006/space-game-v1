export interface SecretLevelDefinition {
  id: string;
  name: string;
  location: string;
  themeId: string;
  hasBoss: boolean;
  /** Score required to spawn the entry wormhole on entryLevel. */
  scoreThreshold: number;
  /** Score required to spawn the exit panel inside the secret level. */
  exitScoreThreshold: number;
  /** Story level where the entry wormhole appears. */
  entryLevel: number;
  /** Host world for this secret (defaults to world1). */
  worldId?: string;
  /** Warp unlocks a world; Finish unlocks a campaign level. */
  exitPanel?: 'warp' | 'finish';
  /** When exitPanel is finish, which story level to unlock. */
  finishUnlockLevel?: number;
  /** When true, gameplay uses a darkness overlay with spotlights. */
  darkLevel?: boolean;
  /** Obstruction fill color for dark levels (default black). */
  darkObstructionColor?: number;
}

export const SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  iss: {
    id: 'iss',
    name: 'International Space Station',
    location: 'International Space Station',
    themeId: 'iss',
    hasBoss: false,
    scoreThreshold: 5000,
    exitScoreThreshold: 5000,
    entryLevel: 1,
    worldId: 'world1',
    exitPanel: 'warp',
  },
  dawn: {
    id: 'dawn',
    name: 'Dawn',
    location: 'Dawn Mission — Ceres Transit',
    themeId: 'dawn',
    hasBoss: false,
    scoreThreshold: 7000,
    exitScoreThreshold: 6000,
    entryLevel: 6,
    worldId: 'world1',
    exitPanel: 'warp',
  },
};

export function getSecretLevel(id: string): SecretLevelDefinition | undefined {
  return SECRET_LEVELS[id];
}
