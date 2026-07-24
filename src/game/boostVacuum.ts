import Phaser from 'phaser';
import type { Player } from './entities/Player';
import type { Asteroid } from './entities/Asteroid';
import type { Comet } from './entities/Comet';
import type { Mine } from './entities/Mine';
import type { MineCarrier } from './entities/MineCarrier';

const ABSORB_RADIUS = 40;
const PULL_ACCEL = 480;
const MAX_PULL_SPEED = 420;

export interface BoostVacuumAbsorbPayload {
  points: number;
  x: number;
  y: number;
  explosionCount: number;
  coinReward?: number;
  spawnBlueMine?: boolean;
}

export interface BoostVacuumGroups {
  asteroids: Phaser.Physics.Arcade.Group;
  comets: Phaser.Physics.Arcade.Group;
  mines: Phaser.Physics.Arcade.Group;
  mineCarriers: Phaser.Physics.Arcade.Group;
  spiderShips: Phaser.Physics.Arcade.Group;
  seekerDrones: Phaser.Physics.Arcade.Group;
  kamikazeWasps: Phaser.Physics.Arcade.Group;
  plasmaTurrets: Phaser.Physics.Arcade.Group;
  storyEnemies: Phaser.Physics.Arcade.Group;
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function pullToward(
  sprite: Phaser.Physics.Arcade.Sprite,
  px: number,
  py: number,
  delta: number,
): boolean {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body || !sprite.active) return false;

  const d2 = distSq(sprite.x, sprite.y, px, py);
  if (d2 <= ABSORB_RADIUS * ABSORB_RADIUS) return true;

  const dist = Math.sqrt(d2) || 1;
  const dt = delta / 1000;
  const pull = PULL_ACCEL * (1 + 100 / dist);
  let vx = body.velocity.x + (px - sprite.x) / dist * pull * dt;
  let vy = body.velocity.y + (py - sprite.y) / dist * pull * dt;
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > MAX_PULL_SPEED) {
    vx = (vx / speed) * MAX_PULL_SPEED;
    vy = (vy / speed) * MAX_PULL_SPEED;
  }
  body.setVelocity(vx, vy);
  return false;
}

function forEachActive(
  group: Phaser.Physics.Arcade.Group,
  fn: (obj: Phaser.Physics.Arcade.Sprite) => void,
): void {
  group.children.each((child) => {
    const sprite = child as Phaser.Physics.Arcade.Sprite;
    if (sprite.active) fn(sprite);
    return true;
  });
}

function enemyPoints(sprite: Phaser.Physics.Arcade.Sprite): number {
  return (sprite as unknown as { points: number }).points;
}

export function updateBoostVacuum(
  player: Player,
  groups: BoostVacuumGroups,
  delta: number,
  onAbsorb: (payload: BoostVacuumAbsorbPayload) => void,
): void {
  const px = player.x;
  const py = player.y;

  forEachActive(groups.asteroids, (sprite) => {
    if (pullToward(sprite, px, py, delta)) {
      const asteroid = sprite as Asteroid;
      const explosionCount = asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5;
      onAbsorb({
        points: asteroid.points,
        x: asteroid.x,
        y: asteroid.y,
        explosionCount,
        coinReward: asteroid.isGold ? asteroid.coinReward : undefined,
      });
      asteroid.destroy();
    }
  });

  forEachActive(groups.comets, (sprite) => {
    if (pullToward(sprite, px, py, delta)) {
      const comet = sprite as Comet;
      onAbsorb({
        points: comet.points,
        x: comet.x,
        y: comet.y,
        explosionCount: 10,
        coinReward: comet.coinReward > 0 ? comet.coinReward : undefined,
      });
      comet.destroy();
    }
  });

  forEachActive(groups.mines, (sprite) => {
    if (pullToward(sprite, px, py, delta)) {
      const mine = sprite as Mine;
      onAbsorb({
        points: mine.points,
        x: mine.x,
        y: mine.y,
        explosionCount: 8,
      });
      mine.destroy();
    }
  });

  forEachActive(groups.mineCarriers, (sprite) => {
    if (pullToward(sprite, px, py, delta)) {
      const carrier = sprite as MineCarrier;
      onAbsorb({
        points: carrier.points,
        x: carrier.x,
        y: carrier.y,
        explosionCount: 8,
        spawnBlueMine: true,
      });
      carrier.destroy();
    }
  });

  const absorbEnemy = (
    sprite: Phaser.Physics.Arcade.Sprite,
    points: number,
    explosionCount: number,
  ) => {
    if (pullToward(sprite, px, py, delta)) {
      onAbsorb({ points, x: sprite.x, y: sprite.y, explosionCount });
      sprite.destroy();
    }
  };

  forEachActive(groups.spiderShips, (s) => absorbEnemy(s, enemyPoints(s), 8));
  forEachActive(groups.seekerDrones, (s) => absorbEnemy(s, enemyPoints(s), 6));
  forEachActive(groups.kamikazeWasps, (s) => absorbEnemy(s, enemyPoints(s), 6));
  forEachActive(groups.plasmaTurrets, (s) => absorbEnemy(s, enemyPoints(s), 8));
  forEachActive(groups.storyEnemies, (s) => absorbEnemy(s, enemyPoints(s), 8));
}
