import type { GameMode } from './gameMode';

const STORAGE_KEY = 'star-blaster-world-progress';

export interface WorldProgressState {
  world2Story: boolean;
  world2Survival: boolean;
  secretIssUnlocked: boolean;
  secretIssComplete: boolean;
}

function readState(): WorldProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        world2Story: false,
        world2Survival: false,
        secretIssUnlocked: false,
        secretIssComplete: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<WorldProgressState>;
    return {
      world2Story: parsed.world2Story === true,
      world2Survival: parsed.world2Survival === true,
      secretIssUnlocked: parsed.secretIssUnlocked === true,
      secretIssComplete: parsed.secretIssComplete === true,
    };
  } catch {
    return {
      world2Story: false,
      world2Survival: false,
      secretIssUnlocked: false,
      secretIssComplete: false,
    };
  }
}

function writeState(state: WorldProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function isWorld2StoryUnlocked(): boolean {
  return readState().world2Story;
}

export function isWorld2SurvivalUnlocked(): boolean {
  return readState().world2Survival;
}

export function isWorld2Unlocked(): boolean {
  const state = readState();
  return state.world2Story || state.world2Survival;
}

export function isSecretIssUnlocked(): boolean {
  return readState().secretIssUnlocked;
}

export function isSecretIssComplete(): boolean {
  return readState().secretIssComplete;
}

export function unlockWorld2Story(): void {
  const state = readState();
  state.world2Story = true;
  state.world2Survival = true;
  writeState(state);
}

export function unlockWorld2Survival(): void {
  const state = readState();
  state.world2Survival = true;
  writeState(state);
}

export function unlockSecretIss(): void {
  const state = readState();
  state.secretIssUnlocked = true;
  writeState(state);
}

export function completeSecretIss(): void {
  const state = readState();
  state.secretIssComplete = true;
  state.world2Story = true;
  state.world2Survival = true;
  writeState(state);
}

export function isWorldUnlocked(worldId: string, mode: GameMode): boolean {
  if (worldId === 'world1') return true;
  if (worldId === 'world2') {
    return mode === 'story' ? isWorld2StoryUnlocked() : isWorld2SurvivalUnlocked();
  }
  return false;
}
