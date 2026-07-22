import Phaser from 'phaser';
import type { Asteroid } from './entities/Asteroid';
import type { Comet } from './entities/Comet';
import { getDeathBombDamage, getDeathBombRadius } from './powerUpEffects';

export interface DeathBombGroups {
  asteroids: Phaser.Physics.Arcade.Group;
  comets: Phaser.Physics.Arcade.Group;
  spiderShips: Phaser.Physics.Arcade.Group;
  seekerDrones: Phaser.Physics.Arcade.Group;
  kamikazeWasps: Phaser.Physics.Arcade.Group;
  plasmaTurrets: Phaser.Physics.Arcade.Group;
  storyEnemies: Phaser.Physics.Arcade.Group;
  bossShips: Phaser.Physics.Arcade.Group;
}

export interface DeathBombCallbacks {
  onAsteroidDestroyed: (
    x: number,
    y: number,
    points: number,
    coinReward: number,
    explosionCount: number,
  ) => void;
  onEnemyDestroyed: (x: number, y: number, points: number, explosionCount: number) => void;
  onBossDamaged: (x: number, y: number, damage: number) => void;
  spawnBlastRing: (x: number, y: number, radius: number) => void;
}

function withinRadius(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const dx = sx - cx;
  const dy = sy - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function forEachActive(
  group: Phaser.Physics.Arcade.Group,
  fn: (sprite: Phaser.Physics.Arcade.Sprite) => void,
): void {
  group.children.each((child) => {
    const sprite = child as Phaser.Physics.Arcade.Sprite;
    if (sprite.active) fn(sprite);
    return true;
  });
}

function hitAsteroid(
  asteroid: Asteroid,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  callbacks: DeathBombCallbacks,
): void {
  if (!withinRadius(asteroid.x, asteroid.y, cx, cy, radius)) return;

  const explosionCount = asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5;
  const { x, y, points, coinReward } = asteroid;
  if (asteroid.takeDamage(damage)) {
    asteroid.destroy();
    callbacks.onAsteroidDestroyed(x, y, points, coinReward, explosionCount);
  }
}

function hitEnemySprite(
  sprite: Phaser.Physics.Arcade.Sprite,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  callbacks: DeathBombCallbacks,
  explosionCount: number,
): void {
  if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;

  const enemy = sprite as Phaser.Physics.Arcade.Sprite & { takeDamage?: (n: number) => boolean; points?: number };
  const points = enemy.points ?? 0;
  const x = sprite.x;
  const y = sprite.y;

  if (typeof enemy.takeDamage === 'function') {
    if (enemy.takeDamage(damage)) {
      sprite.destroy();
      callbacks.onEnemyDestroyed(x, y, points, explosionCount);
    }
  } else {
    sprite.destroy();
    callbacks.onEnemyDestroyed(x, y, points, explosionCount);
  }
}

export function detonateDeathBomb(
  cx: number,
  cy: number,
  level: number,
  groups: DeathBombGroups,
  callbacks: DeathBombCallbacks,
): void {
  const radius = getDeathBombRadius(level);
  const damage = getDeathBombDamage(level);

  callbacks.spawnBlastRing(cx, cy, radius);

  forEachActive(groups.asteroids, (sprite) => {
    hitAsteroid(sprite as Asteroid, cx, cy, radius, damage, callbacks);
  });

  forEachActive(groups.comets, (sprite) => {
    if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;
    const comet = sprite as Comet;
    const { x, y, points, coinReward } = comet;
    comet.destroy();
    callbacks.onAsteroidDestroyed(x, y, points, coinReward, 10);
  });

  const enemyGroups: { group: Phaser.Physics.Arcade.Group; explosionCount: number }[] = [
    { group: groups.spiderShips, explosionCount: 8 },
    { group: groups.seekerDrones, explosionCount: 6 },
    { group: groups.kamikazeWasps, explosionCount: 6 },
    { group: groups.plasmaTurrets, explosionCount: 8 },
    { group: groups.storyEnemies, explosionCount: 8 },
  ];

  for (const { group, explosionCount } of enemyGroups) {
    forEachActive(group, (sprite) => {
      hitEnemySprite(sprite, cx, cy, radius, damage, callbacks, explosionCount);
    });
  }

  forEachActive(groups.bossShips, (sprite) => {
    if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;
    const boss = sprite as Phaser.Physics.Arcade.Sprite & { takeDamage?: (n: number) => boolean };
    if (typeof boss.takeDamage === 'function') {
      callbacks.onBossDamaged(sprite.x, sprite.y, damage);
      boss.takeDamage(damage);
    }
  });
}
