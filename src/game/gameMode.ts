export type GameMode = 'story' | 'survival';

export interface GameSceneData {
  mode?: GameMode;
  level?: number;
  worldId?: string;
  secretId?: string;
}

export function normalizeGameSceneData(data: GameSceneData = {}): Required<Pick<GameSceneData, 'mode' | 'level'>> & GameSceneData {
  return {
    mode: data.mode ?? 'survival',
    level: data.level ?? 1,
    worldId: data.worldId,
    secretId: data.secretId,
  };
}

export function getWorldIdFromLevel(level: number): string {
  if (level >= 21) return 'world3';
  if (level >= 11) return 'world2';
  return 'world1';
}
