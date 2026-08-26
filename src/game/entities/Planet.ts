import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getGoldPlanetCoinReward } from '../coinDrops';
import type { GravitySource } from '../gravityField';

export type PlanetVariant = 'normal' | 'gold';

export interface PlanetConfig {
  variant?: PlanetVariant;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export const PLANET_BODY_RADIUS = 44;
export const PLANET_GRAVITY_RADIUS = 200;
export const PLANET_GRAVITY_STRENGTH = 320;
export const PLANET_HEALTH = 8;
export const GOLD_PLANET_HEALTH = 15;
export const PLANET_POINTS = 50;

export class Planet extends Phaser.Physics.Arcade.Sprite implements GravitySource {
  readonly variant: PlanetVariant;
  readonly coinReward: number;
  readonly gravityRadius = PLANET_GRAVITY_RADIUS;
  readonly gravityStrength = PLANET_GRAVITY_STRENGTH;
  readonly points = PLANET_POINTS;
  health: number;

  constructor(scene: Phaser.Scene, config: PlanetConfig) {
    const variant = config.variant ?? 'normal';
    const texture = variant === 'gold' ? 'planet-gold' : 'planet';
    super(scene, config.x, config.y, texture);

    this.variant = variant;
    this.coinReward = variant === 'gold' ? getGoldPlanetCoinReward() : 0;
    this.health = variant === 'gold' ? GOLD_PLANET_HEALTH : PLANET_HEALTH;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(PLANET_BODY_RADIUS);
    this.setImmovable(true);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);
    this.setAngularVelocity(Phaser.Math.Between(-20, 20));
    if (variant === 'gold') {
      this.setTint(0xffee88);
    }
  }

  get isGold(): boolean {
    return this.variant === 'gold';
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
      if (this.isGold) this.setTint(0xffee88);
    });

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  static randomConfig(): PlanetConfig {
    const speed = 55 * Phaser.Math.FloatBetween(0.85, 1.15);
    const spawnFromTop = Math.random() < 0.65;
    let x: number;
    let y: number;
    let velocityX: number;
    let velocityY: number;

    if (spawnFromTop) {
      x = Phaser.Math.Between(60, GAME_WIDTH - 60);
      y = Phaser.Math.Between(-100, -40);
      velocityX = Phaser.Math.Between(-30, 30);
      velocityY = speed;
    } else {
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? -60 : GAME_WIDTH + 60;
      y = Phaser.Math.Between(60, GAME_HEIGHT * 0.5);
      velocityX = fromLeft ? speed * 0.5 : -speed * 0.5;
      velocityY = Phaser.Math.Between(speed * 0.2, speed * 0.5);
    }

    return { x, y, velocityX, velocityY };
  }

  isOffScreen(): boolean {
    const margin = 100;
    return (
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}
