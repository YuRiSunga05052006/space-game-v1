import Phaser from 'phaser';
import type { Asteroid } from './entities/Asteroid';
import type { Comet } from './entities/Comet';
import type { Mine } from './entities/Mine';
import type { MineCarrier } from './entities/MineCarrier';
import type { Planet } from './entities/Planet';
import type { Moon } from './entities/Moon';

export interface MineBlastSource {
  x: number;
  y: number;
  blastRadius: number;
  playerDamage: number;
  damagesPlayer: boolean;
  canChainCarriers: boolean;
  points?: number;
}

export interface MineBlastGroups {
  asteroids: Phaser.Physics.Arcade.Group;
  comets: Phaser.Physics.Arcade.Group;
  planets: Phaser.Physics.Arcade.Group;
  moons: Phaser.Physics.Arcade.Group;
  mines: Phaser.Physics.Arcade.Group;
  mineCarriers: Phaser.Physics.Arcade.Group;
  spiderShips: Phaser.Physics.Arcade.Group;
  seekerDrones: Phaser.Physics.Arcade.Group;
  kamikazeWasps: Phaser.Physics.Arcade.Group;
  plasmaTurrets: Phaser.Physics.Arcade.Group;
  flamethrowerShips: Phaser.Physics.Arcade.Group;
  storyEnemies: Phaser.Physics.Arcade.Group;
  bossShips: Phaser.Physics.Arcade.Group;
}

export interface MineBlastPlayerDamageMeta {
  /** True only for the initial player-ram contact blast (not chain / radius falloff). */
  fromContact?: boolean;
}

export interface MineBlastCallbacks {
  onPlayExplosionSfx: () => void;
  onSpawnBlastRing: (x: number, y: number, radius: number) => void;
  onSpawnExplosion: (x: number, y: number, count: number) => void;
  onDamagePlayer: (damage: number, meta?: MineBlastPlayerDamageMeta) => void;
  onAsteroidDestroyed: (
    x: number,
    y: number,
    points: number,
    coinReward: number,
    explosionCount: number,
  ) => void;
  onEnemyDestroyed: (x: number, y: number, points: number, explosionCount: number) => void;
  onBossDamaged: (
    x: number,
    y: number,
    damage: number,
    result: { killed: boolean; points: number; healthRemaining: number },
  ) => void;
  onMineDestroyed: (x: number, y: number, points: number) => void;
  onCarrierChained: (x: number, y: number, points: number) => void;
  onPlanetDestroyed?: (
    x: number,
    y: number,
    points: number,
    coinReward: number,
    explosionCount: number,
  ) => void;
  onMoonDestroyed?: (
    x: number,
    y: number,
    points: number,
    coinReward: number,
    explosionCount: number,
  ) => void;
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
  callbacks: MineBlastCallbacks,
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
  callbacks: MineBlastCallbacks,
  explosionCount: number,
): void {
  if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;

  const enemy = sprite as Phaser.Physics.Arcade.Sprite & {
    takeDamage?: (n: number) => boolean;
    points?: number;
  };
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

function hitPlanet(
  planet: Planet,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  callbacks: MineBlastCallbacks,
): void {
  if (!withinRadius(planet.x, planet.y, cx, cy, radius)) return;

  const { x, y, points, coinReward } = planet;
  if (planet.takeDamage(damage)) {
    callbacks.onPlanetDestroyed?.(x, y, points, coinReward, 14);
  }
}

function hitMoon(
  moon: Moon,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  callbacks: MineBlastCallbacks,
): void {
  if (!withinRadius(moon.x, moon.y, cx, cy, radius)) return;

  const { x, y, points, coinReward } = moon;
  if (moon.takeDamage(damage)) {
    callbacks.onMoonDestroyed?.(x, y, points, coinReward, 8);
  }
}

export function blastDamageForRadius(radius: number): number {
  if (radius >= 130) return 8;
  if (radius >= 100) return 6;
  if (radius >= 90) return 5;
  return 4;
}

/**
 * Player damage falls off with distance from the blast center.
 * Ramming / overlapping the mine or carrier counts as epicenter → full damage.
 * Outside the blast radius → 0.
 */
export function scalePlayerBlastDamage(
  maxDamage: number,
  dist: number,
  blastRadius: number,
): number {
  if (maxDamage <= 0 || blastRadius <= 0 || dist >= blastRadius) return 0;

  // Player + mine/carrier body overlap still reads as "closest" (full damage).
  const epicenterPad = Math.min(32, blastRadius * 0.4);
  const adjusted = Math.max(0, dist - epicenterPad);
  const falloffSpan = blastRadius - epicenterPad;
  if (adjusted <= 0 || falloffSpan <= 0) return maxDamage;

  const factor = 1 - adjusted / falloffSpan;
  return Math.max(1, Math.round(maxDamage * factor));
}

export interface DetonateMineBlastOptions {
  skipPlayerDamage?: boolean;
  /**
   * Player rammed this mine/carrier. First blast deals full playerDamage
   * (no distance falloff), regardless of approach angle / body sizes.
   */
  contactFullDamage?: boolean;
  playerX?: number;
  playerY?: number;
}

/**
 * Detonate a mine/carrier blast and chain into nearby mines (and carriers when allowed).
 * Sources must already be removed from the world before calling.
 */
export function detonateMineBlast(
  initial: MineBlastSource,
  groups: MineBlastGroups,
  callbacks: MineBlastCallbacks,
  options?: DetonateMineBlastOptions,
): void {
  const queue: MineBlastSource[] = [initial];
  const visitedMines = new Set<Phaser.Physics.Arcade.Sprite>();
  const visitedCarriers = new Set<Phaser.Physics.Arcade.Sprite>();
  let safety = 0;
  let useContactFullDamage = options?.contactFullDamage === true;

  while (queue.length > 0 && safety < 64) {
    safety += 1;
    const source = queue.shift()!;
    const { x: cx, y: cy, blastRadius: radius } = source;
    const damage = blastDamageForRadius(radius);

    callbacks.onPlayExplosionSfx();
    callbacks.onSpawnBlastRing(cx, cy, radius);
    callbacks.onSpawnExplosion(cx, cy, radius >= 120 ? 18 : radius >= 90 ? 14 : 10);

    if (
      source.damagesPlayer
      && source.playerDamage > 0
      && !options?.skipPlayerDamage
      && options?.playerX !== undefined
      && options?.playerY !== undefined
    ) {
      let scaled: number;
      let fromContact = false;
      if (useContactFullDamage) {
        scaled = source.playerDamage;
        useContactFullDamage = false;
        fromContact = true;
      } else {
        const dist = Math.hypot(options.playerX - cx, options.playerY - cy);
        scaled = scalePlayerBlastDamage(source.playerDamage, dist, radius);
      }
      if (scaled > 0) {
        callbacks.onDamagePlayer(scaled, fromContact ? { fromContact: true } : undefined);
      }
    }

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

    forEachActive(groups.planets, (sprite) => {
      hitPlanet(sprite as Planet, cx, cy, radius, damage, callbacks);
    });

    forEachActive(groups.moons, (sprite) => {
      hitMoon(sprite as Moon, cx, cy, radius, damage, callbacks);
    });

    const enemyGroups: { group: Phaser.Physics.Arcade.Group; explosionCount: number }[] = [
      { group: groups.spiderShips, explosionCount: 8 },
      { group: groups.seekerDrones, explosionCount: 6 },
      { group: groups.kamikazeWasps, explosionCount: 6 },
      { group: groups.plasmaTurrets, explosionCount: 8 },
      { group: groups.flamethrowerShips, explosionCount: 8 },
      { group: groups.storyEnemies, explosionCount: 8 },
    ];

    for (const { group, explosionCount } of enemyGroups) {
      forEachActive(group, (sprite) => {
        hitEnemySprite(sprite, cx, cy, radius, damage, callbacks, explosionCount);
      });
    }

    forEachActive(groups.bossShips, (sprite) => {
      const boss = sprite as Phaser.Physics.Arcade.Sprite & {
        takeDamage?: (n: number) => boolean;
        points?: number;
        health?: number;
      };
      const body = sprite.body as Phaser.Physics.Arcade.Body | undefined;
      const hitPad = body ? Math.max(body.halfWidth, body.halfHeight) : 28;
      // Include boss body size so edge blasts still connect.
      if (!withinRadius(sprite.x, sprite.y, cx, cy, radius + hitPad)) return;
      if (typeof boss.takeDamage !== 'function') return;

      const points = boss.points ?? 0;
      const x = sprite.x;
      const y = sprite.y;
      const killed = boss.takeDamage(damage);
      callbacks.onBossDamaged(x, y, damage, {
        killed,
        points,
        healthRemaining: killed ? 0 : (boss.health ?? 0),
      });
    });

    const chainedMines: Mine[] = [];
    forEachActive(groups.mines, (sprite) => {
      if (visitedMines.has(sprite)) return;
      if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;
      const mine = sprite as Mine;
      // Dormant blue mines are inert — blasts pass through without chaining them.
      if (mine.isDormantBlue) return;
      chainedMines.push(mine);
    });
    for (const mine of chainedMines) {
      if (!mine.active || visitedMines.has(mine)) continue;
      visitedMines.add(mine);
      const next: MineBlastSource = {
        x: mine.x,
        y: mine.y,
        blastRadius: mine.blastRadius,
        playerDamage: mine.playerDamage,
        damagesPlayer: mine.damagesPlayer,
        canChainCarriers: mine.canChainCarriers,
        points: mine.points,
      };
      callbacks.onMineDestroyed(mine.x, mine.y, mine.points);
      mine.destroy();
      queue.push(next);
    }

    if (source.canChainCarriers) {
      const chainedCarriers: MineCarrier[] = [];
      forEachActive(groups.mineCarriers, (sprite) => {
        if (visitedCarriers.has(sprite)) return;
        if (!withinRadius(sprite.x, sprite.y, cx, cy, radius)) return;
        chainedCarriers.push(sprite as MineCarrier);
      });
      for (const carrier of chainedCarriers) {
        if (!carrier.active || visitedCarriers.has(carrier)) continue;
        visitedCarriers.add(carrier);
        const next: MineBlastSource = {
          x: carrier.x,
          y: carrier.y,
          blastRadius: carrier.blastRadius,
          playerDamage: carrier.playerDamage,
          damagesPlayer: carrier.damagesPlayer,
          canChainCarriers: carrier.canChainCarriers,
          points: carrier.points,
        };
        callbacks.onCarrierChained(carrier.x, carrier.y, carrier.points);
        carrier.destroy();
        queue.push(next);
      }
    }
  }
}
