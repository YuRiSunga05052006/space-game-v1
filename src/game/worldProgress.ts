import { writeProgressItem } from './cloud/progressStorage';
import type { GameMode } from './gameMode';
import { getWorldLevelRange } from './worlds';

const STORAGE_KEY = 'star-blaster-world-progress';
const STORY_STORAGE_KEY = 'star-blaster-story-progress';

export interface WorldProgressState {
  world2Story: boolean;
  world2Survival: boolean;
  world3Story: boolean;
  world3Survival: boolean;
  secretIssUnlocked: boolean;
  secretIssComplete: boolean;
  secretDawnUnlocked: boolean;
  secretDawnComplete: boolean;
  secretGalileanUnlocked: boolean;
  secretGalileanComplete: boolean;
  secretWise0855Unlocked: boolean;
  secretWise0855Complete: boolean;
}

function defaultState(): WorldProgressState {
  return {
    world2Story: false,
    world2Survival: false,
    world3Story: false,
    world3Survival: false,
    secretIssUnlocked: false,
    secretIssComplete: false,
    secretDawnUnlocked: false,
    secretDawnComplete: false,
    secretGalileanUnlocked: false,
    secretGalileanComplete: false,
    secretWise0855Unlocked: false,
    secretWise0855Complete: false,
  };
}

function readState(): WorldProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<WorldProgressState>;
    return {
      world2Story: parsed.world2Story === true,
      world2Survival: parsed.world2Survival === true,
      world3Story: parsed.world3Story === true,
      world3Survival: parsed.world3Survival === true,
      secretIssUnlocked: parsed.secretIssUnlocked === true,
      secretIssComplete: parsed.secretIssComplete === true,
      secretDawnUnlocked: parsed.secretDawnUnlocked === true,
      secretDawnComplete: parsed.secretDawnComplete === true,
      secretGalileanUnlocked: parsed.secretGalileanUnlocked === true,
      secretGalileanComplete: parsed.secretGalileanComplete === true,
      secretWise0855Unlocked: parsed.secretWise0855Unlocked === true,
      secretWise0855Complete: parsed.secretWise0855Complete === true,
    };
  } catch {
    return defaultState();
  }
}

function unlockStoryLevelInStorage(level: number): void {
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) {
      writeProgressItem(STORY_STORAGE_KEY, JSON.stringify([1, level].sort((a, b) => a - b)));
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    const levels = parsed
      .map((n) => parseInt(String(n), 10))
      .filter((n) => n >= 1 && n <= 38);
    if (!levels.includes(level)) {
      levels.push(level);
      writeProgressItem(STORY_STORAGE_KEY, JSON.stringify([...new Set(levels)].sort((a, b) => a - b)));
    }
  } catch {
    // ignore storage errors
  }
}

function writeState(state: WorldProgressState): void {
  writeProgressItem(STORAGE_KEY, JSON.stringify(state));
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

export function isWorld3StoryUnlocked(): boolean {
  return readState().world3Story;
}

export function isWorld3SurvivalUnlocked(): boolean {
  return readState().world3Survival;
}

export function isWorld3Unlocked(): boolean {
  const state = readState();
  return state.world3Story || state.world3Survival;
}

export function isSecretIssUnlocked(): boolean {
  return readState().secretIssUnlocked;
}

export function isSecretIssComplete(): boolean {
  return readState().secretIssComplete;
}

export function isSecretDawnUnlocked(): boolean {
  return readState().secretDawnUnlocked;
}

export function isSecretDawnComplete(): boolean {
  return readState().secretDawnComplete;
}

export function isSecretGalileanUnlocked(): boolean {
  return readState().secretGalileanUnlocked;
}

export function isSecretGalileanComplete(): boolean {
  return readState().secretGalileanComplete;
}

export function isSecretWise0855Unlocked(): boolean {
  return readState().secretWise0855Unlocked;
}

export function isSecretWise0855Complete(): boolean {
  return readState().secretWise0855Complete;
}

export function isLevel20Complete(): boolean {
  const { max } = getWorldLevelRange('world2');
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return false;
    return parsed.includes(max);
  } catch {
    return false;
  }
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

export function unlockSecretDawn(): void {
  const state = readState();
  state.secretDawnUnlocked = true;
  writeState(state);
}

export function completeSecretDawn(): void {
  const state = readState();
  state.secretDawnComplete = true;
  tryUnlockWorld3(state);
  writeState(state);
}

export function unlockSecretGalilean(): void {
  const state = readState();
  state.secretGalileanUnlocked = true;
  writeState(state);
}

export function completeSecretGalilean(): void {
  const state = readState();
  state.secretGalileanComplete = true;
  state.secretGalileanUnlocked = true;
  writeState(state);
}

export function unlockSecretWise0855(): void {
  const state = readState();
  state.secretWise0855Unlocked = true;
  writeState(state);
}

export function completeSecretWise0855(): void {
  const state = readState();
  state.secretWise0855Complete = true;
  state.secretWise0855Unlocked = true;
  writeState(state);
}

export function tryUnlockWorld3(state?: WorldProgressState): void {
  const s = state ?? readState();
  if (isLevel20Complete() || s.secretDawnComplete) {
    s.world3Story = true;
    s.world3Survival = true;
    unlockStoryLevelInStorage(getWorldLevelRange('world3').min);
    if (!state) writeState(s);
  }
}

export function onLevel20Cleared(): void {
  const state = readState();
  tryUnlockWorld3(state);
  writeState(state);
}

export function isWorldUnlocked(worldId: string, mode: GameMode): boolean {
  if (worldId === 'world1') return true;
  if (worldId === 'world2') {
    return mode === 'story' ? isWorld2StoryUnlocked() : isWorld2SurvivalUnlocked();
  }
  if (worldId === 'world3') {
    return mode === 'story' ? isWorld3StoryUnlocked() : isWorld3SurvivalUnlocked();
  }
  return false;
}

export function unlockAllWorldsAndSecrets(): void {
  writeState({
    world2Story: true,
    world2Survival: true,
    world3Story: true,
    world3Survival: true,
    secretIssUnlocked: true,
    secretIssComplete: true,
    secretDawnUnlocked: true,
    secretDawnComplete: true,
    secretGalileanUnlocked: true,
    secretGalileanComplete: true,
    secretWise0855Unlocked: true,
    secretWise0855Complete: true,
  });
}
