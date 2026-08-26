import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getGoldMoonCoinReward } from '../coinDrops';
import type { GravitySource } from '../gravityField';

export type MoonVariant = 'normal' | 'gold';

export interface MoonConfig {
  variant?: MoonVariant;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export const MOON_BODY_RADIUS = 26;
export const MOON_GRAVITY_RADIUS = 130;
export const MOON_GRAVITY_STRENGTH = 190;
export const MOON_HEALTH = 4;
export const GOLD_MOON_HEALTH = 10;
export const MOON_POINTS = 30;

export class Moon extends Phaser.Physics.Arcade.Sprite implements GravitySource {
  readonly variant: MoonVariant;
  readonly coinReward: number;
  readonly gravityRadius = MOON_GRAVITY_RADIUS;
  readonly gravityStrength = MOON_GRAVITY_STRENGTH;
  readonly points = MOON_POINTS;
  health: number;

  constructor(scene: Phaser.Scene, config: MoonConfig) {
    const variant = config.variant ?? 'normal';
    const texture = variant === 'gold' ? 'moon-gold' : 'moon';
    super(scene, config.x, config.y, texture);

    this.variant = variant;
    this.coinReward = variant === 'gold' ? getGoldMoonCoinReward() : 0;
    this.health = variant === 'gold' ? GOLD_MOON_HEALTH : MOON_HEALTH;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(MOON_BODY_RADIUS);
    this.setImmovable(true);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);
    this.setAngularVelocity(Phaser.Math.Between(-40, 40));
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

  static randomConfig(): MoonConfig {
    const speed = 85 * Phaser.Math.FloatBetween(0.85, 1.15);
    const spawnFromTop = Math.random() < 0.7;
    let x: number;
    let y: number;
    let velocityX: number;
    let velocityY: number;

    if (spawnFromTop) {
      x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      y = Phaser.Math.Between(-70, -20);
      velocityX = Phaser.Math.Between(-40, 40);
      velocityY = speed;
    } else {
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? -40 : GAME_WIDTH + 40;
      y = Phaser.Math.Between(40, GAME_HEIGHT * 0.55);
      velocityX = fromLeft ? speed * 0.65 : -speed * 0.65;
      velocityY = Phaser.Math.Between(speed * 0.3, speed * 0.75);
    }

    return { x, y, velocityX, velocityY };
  }

  isOffScreen(): boolean {
    const margin = 80;
    return (
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}
