import { getStoryEnemyDefinition } from './levelResolver';
import { getWorldIdFromLevel } from './gameMode';

export function getStoryEnemySpawnInterval(level: number): number {
  const worldId = getWorldIdFromLevel(level);
  return getStoryEnemyDefinition(worldId, level).spawnIntervalMs;
}

export function getStoryEnemyMaxOnScreen(level: number): number {
  const worldId = getWorldIdFromLevel(level);
  return getStoryEnemyDefinition(worldId, level).maxOnScreen;
}

export function canSpawnStoryEnemy(level: number, activeCount: number): boolean {
  return activeCount < getStoryEnemyMaxOnScreen(level);
}
