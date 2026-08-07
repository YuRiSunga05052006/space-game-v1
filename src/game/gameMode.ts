export type GameMode = 'story' | 'survival' | 'editor';

export interface GameSceneData {
  mode?: GameMode;
  level?: number;
  worldId?: string;
  secretId?: string;
  /** When true, keep main theme playback position (e.g. wormhole → secret). */
  continueMusic?: boolean;
  /** Editor mode: which custom level slot (0–9). */
  customSlotIndex?: number;
  /** Editor mode: optional sub-area id inside the custom level. */
  customSubAreaId?: string;
  /** Editor mode: carry score across warp into a sub-area. */
  carryScore?: number;
}

export function normalizeGameSceneData(data: GameSceneData = {}): Required<Pick<GameSceneData, 'mode' | 'level'>> & GameSceneData {
  const mode = data.mode === 'story' || data.mode === 'survival' || data.mode === 'editor'
    ? data.mode
    : 'survival';
  return {
    mode,
    level: data.level ?? 1,
    worldId: data.worldId,
    secretId: data.secretId,
    continueMusic: data.continueMusic === true,
    customSlotIndex: typeof data.customSlotIndex === 'number' ? data.customSlotIndex : undefined,
    customSubAreaId: data.customSubAreaId,
    carryScore: typeof data.carryScore === 'number' ? data.carryScore : undefined,
  };
}

export function getWorldIdFromLevel(level: number): string {
  if (level >= 21) return 'world3';
  if (level >= 11) return 'world2';
  return 'world1';
}
