import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import {
  applyProgressData,
  collectProgressData,
  isProgressKey,
  setProgressChangeHandler,
} from './progressStorage';

const SAVE_DEBOUNCE_MS = 1500;
const PULL_TIMEOUT_MS = 8000;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
let pullInFlight: Promise<void> | null = null;

interface ProgressRow {
  data: Record<string, string>;
  updated_at: string;
}

function parseJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function maxNumber(a: string | undefined, b: string | undefined): string | undefined {
  const left = a ? Number.parseInt(a, 10) : 0;
  const right = b ? Number.parseInt(b, 10) : 0;
  const best = Math.max(
    Number.isFinite(left) ? left : 0,
    Number.isFinite(right) ? right : 0,
  );
  if (!a && !b) return undefined;
  return String(Math.max(0, best));
}

function unionStringArray(a: string | undefined, b: string | undefined): string | undefined {
  const left = parseJson(a);
  const right = parseJson(b);
  const ids = [
    ...(Array.isArray(left) ? left : []),
    ...(Array.isArray(right) ? right : []),
  ].filter((id): id is string => typeof id === 'string' || typeof id === 'number');
  if (ids.length === 0) return a ?? b;
  return JSON.stringify([...new Set(ids.map((id) => String(id)))]);
}

function orBooleans(a: string | undefined, b: string | undefined): string | undefined {
  const left = parseJson(a);
  const right = parseJson(b);
  if (!left && !right) return a ?? b;
  const merged: Record<string, boolean> = {};
  if (left && typeof left === 'object' && !Array.isArray(left)) {
    for (const [key, value] of Object.entries(left as Record<string, unknown>)) {
      merged[key] = value === true;
    }
  }
  if (right && typeof right === 'object' && !Array.isArray(right)) {
    for (const [key, value] of Object.entries(right as Record<string, unknown>)) {
      merged[key] = merged[key] === true || value === true;
    }
  }
  return JSON.stringify(merged);
}

function maxObjectNumbers(a: string | undefined, b: string | undefined): string | undefined {
  const left = parseJson(a);
  const right = parseJson(b);
  if (!left && !right) return a ?? b;
  const merged: Record<string, number> = {};
  const add = (source: unknown) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
      if (!Number.isFinite(n)) continue;
      merged[key] = Math.max(merged[key] ?? 0, n);
    }
  };
  add(left);
  add(right);
  return JSON.stringify(merged);
}

function mergeCustomLevels(a: string | undefined, b: string | undefined): string | undefined {
  const left = parseJson(a);
  const right = parseJson(b);
  if (!Array.isArray(left) && !Array.isArray(right)) return a ?? b;
  const length = Math.max(
    Array.isArray(left) ? left.length : 0,
    Array.isArray(right) ? right.length : 0,
    10,
  );
  const slots: unknown[] = [];
  for (let i = 0; i < length; i++) {
    const localSlot = Array.isArray(left) ? left[i] : null;
    const cloudSlot = Array.isArray(right) ? right[i] : null;
    if (localSlot == null) slots[i] = cloudSlot ?? null;
    else if (cloudSlot == null) slots[i] = localSlot;
    else slots[i] = localSlot;
  }
  return JSON.stringify(slots);
}

function mergeProgress(
  local: Record<string, string>,
  cloud: Record<string, string>,
): Record<string, string> {
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud)].filter(isProgressKey));
  const merged: Record<string, string> = {};

  for (const key of keys) {
    const a = local[key];
    const b = cloud[key];
    let next: string | undefined;

    if (key === 'star-blaster-coins' || key.startsWith('star-blaster-survival-high-score') || key === 'star-blaster-high-score') {
      next = maxNumber(a, b);
    } else if (key === 'star-blaster-story-progress' || key === 'star-blaster-owned-skins' || key === 'star-blaster-owned-shapes') {
      next = unionStringArray(a, b);
    } else if (key === 'star-blaster-world-progress') {
      next = orBooleans(a, b);
    } else if (key === 'star-blaster-powerup-levels' || key === 'star-blaster-powerup-inventory') {
      next = maxObjectNumbers(a, b);
    } else if (key === 'star-blaster-custom-levels') {
      next = mergeCustomLevels(a, b);
    } else {
      next = a ?? b;
    }

    if (next !== undefined) merged[key] = next;
  }

  return merged;
}

function asProgressData(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const data: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string') data[key] = entry;
  }
  return data;
}

async function getUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function fetchCloudRow(userId: string): Promise<ProgressRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('player_progress')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    data: asProgressData(data.data),
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : new Date().toISOString(),
  };
}

async function upsertCloudRow(userId: string, data: Record<string, string>): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('player_progress').upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn('Failed to save cloud progress:', error.message);
  }
}

export function scheduleCloudSave(): void {
  if (!isSupabaseConfigured()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushProgressToCloud();
  }, SAVE_DEBOUNCE_MS);
}

export async function flushProgressToCloud(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const userId = await getUserId();
  if (!userId) return;
  await upsertCloudRow(userId, collectProgressData());
}

export async function pullAndMergeProgress(): Promise<void> {
  if (pullInFlight) return pullInFlight;
  pullInFlight = (async () => {
    const userId = await getUserId();
    if (!userId) return;

    const local = collectProgressData();
    const cloud = await fetchCloudRow(userId);
    if (!cloud || Object.keys(cloud.data).length === 0) {
      await upsertCloudRow(userId, local);
      return;
    }

    const merged = mergeProgress(local, cloud.data);
    applyProgressData(merged);
    await upsertCloudRow(userId, merged);
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Failed to load cloud progress:', message);
  }).finally(() => {
    pullInFlight = null;
  });
  return pullInFlight;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function initCloudProgress(): Promise<void> {
  if (initialized) return;
  initialized = true;

  setProgressChangeHandler(scheduleCloudSave);

  if (!isSupabaseConfigured()) return;

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushProgressToCloud();
  });
  window.addEventListener('pagehide', () => {
    void flushProgressToCloud();
  });

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await withTimeout(pullAndMergeProgress(), PULL_TIMEOUT_MS);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Cloud progress sync failed:', message);
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      void pullAndMergeProgress();
    }
  });
}
