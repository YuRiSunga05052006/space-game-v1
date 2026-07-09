export interface BossLevelConfig {
  spawnMs: number;
  coinReward: number;
}

export const BOSS_LEVEL_CONFIG: Record<number, BossLevelConfig> = {
  1: { spawnMs: 120_000, coinReward: 100 },
  2: { spawnMs: 150_000, coinReward: 120 },
  3: { spawnMs: 150_000, coinReward: 140 },
  4: { spawnMs: 150_000, coinReward: 160 },
  5: { spawnMs: 240_000, coinReward: 200 },
  6: { spawnMs: 180_000, coinReward: 220 },
  7: { spawnMs: 180_000, coinReward: 240 },
  8: { spawnMs: 180_000, coinReward: 260 },
  9: { spawnMs: 180_000, coinReward: 280 },
  10: { spawnMs: 360_000, coinReward: 350 },
  11: { spawnMs: 150_000, coinReward: 380 },
  12: { spawnMs: 180_000, coinReward: 400 },
  13: { spawnMs: 180_000, coinReward: 420 },
  14: { spawnMs: 180_000, coinReward: 440 },
  15: { spawnMs: 300_000, coinReward: 460 },
  16: { spawnMs: 210_000, coinReward: 470 },
  17: { spawnMs: 210_000, coinReward: 480 },
  18: { spawnMs: 210_000, coinReward: 490 },
  19: { spawnMs: 210_000, coinReward: 495 },
  20: { spawnMs: 420_000, coinReward: 500 },
};

export function getBossConfigForLevel(level: number): BossLevelConfig {
  return BOSS_LEVEL_CONFIG[level] ?? BOSS_LEVEL_CONFIG[1];
}

export function getBossSpawnMsForLevel(level: number): number {
  return getBossConfigForLevel(level).spawnMs;
}

export function formatBossWaitTime(level: number): string {
  const ms = getBossSpawnMsForLevel(level);
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec === 0 ? `${min}:00` : `${min}:${sec.toString().padStart(2, '0')}`;
}
