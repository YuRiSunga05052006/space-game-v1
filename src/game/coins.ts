import { writeProgressItem } from './cloud/progressStorage';

const STORAGE_KEY = 'star-blaster-coins';

export function getCoins(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function addCoins(amount: number): number {
  const next = getCoins() + Math.max(0, amount);
  writeProgressItem(STORAGE_KEY, String(next));
  return next;
}

export function formatCoinsLabel(): string {
  return `COINS: ${getCoins()}`;
}

export function formatRunCoinsLabel(runCoins: number): string {
  return runCoins > 0 ? `COINS +${runCoins}` : 'COINS 0';
}

export function canAfford(amount: number): boolean {
  return getCoins() >= Math.max(0, amount);
}

export function spendCoins(amount: number): boolean {
  const cost = Math.max(0, amount);
  if (!canAfford(cost)) return false;

  const next = getCoins() - cost;
  writeProgressItem(STORAGE_KEY, String(next));
  return true;
}
