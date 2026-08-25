import {
  applyProgressData,
  clearActiveProgressData,
  collectProgressData,
} from './progressStorage';

const GUEST_SNAPSHOT_KEY = 'star-blaster-guest-progress';

/** Persist the current local progress as the guest profile (before signing in). */
export function saveGuestProgressSnapshot(): void {
  try {
    localStorage.setItem(GUEST_SNAPSHOT_KEY, JSON.stringify(collectProgressData()));
  } catch {
    // ignore storage errors
  }
}

/** Swap active local progress to the saved guest profile (after sign-out). */
export function activateGuestProfile(): void {
  clearActiveProgressData();

  try {
    const raw = localStorage.getItem(GUEST_SNAPSHOT_KEY);
    if (!raw) return;

    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;

    applyProgressData(data as Record<string, string>);
  } catch {
    // ignore parse errors — cleared active progress is a valid fresh guest state
  }
}
