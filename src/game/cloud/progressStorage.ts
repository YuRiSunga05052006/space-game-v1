const PREFIX = 'star-blaster-';
const LOCAL_ONLY_KEYS = new Set([
  'star-blaster-auto-fire',
  'star-blaster-sound-volume',
  'star-blaster-music-volume',
]);

let applyingRemote = false;
let onChange: (() => void) | null = null;

export function isProgressKey(key: string): boolean {
  return key.startsWith(PREFIX) && !LOCAL_ONLY_KEYS.has(key);
}

export function setProgressChangeHandler(handler: (() => void) | null): void {
  onChange = handler;
}

export function writeProgressItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
  if (!applyingRemote) onChange?.();
}

export function removeProgressItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
  if (!applyingRemote) onChange?.();
}

export function collectProgressData(): Record<string, string> {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !isProgressKey(key)) continue;
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  } catch {
    // ignore storage errors
  }
  return data;
}

export function applyProgressData(data: Record<string, string>): void {
  applyingRemote = true;
  try {
    for (const [key, value] of Object.entries(data)) {
      if (!isProgressKey(key) || typeof value !== 'string') continue;
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage errors
  } finally {
    applyingRemote = false;
  }
}
