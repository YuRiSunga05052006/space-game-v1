import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const FLAMETHROWER_HEALTH = 3;
export const FLAMETHROWER_POINTS = 30;
export const FLAMETHROWER_FIRE_COOLDOWN = 3000;
export const FLAMETHROWER_BODY_DAMAGE = 4;

export interface FlamethrowerShipConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export type FlamethrowerFireCallback = (x: number, y: number, angle: number) => void;

export class FlamethrowerShip extends Phaser.Physics.Arcade.Sprite {
  health = FLAMETHROWER_HEALTH;
  readonly points = FLAMETHROWER_POINTS;
  readonly bodyDamage = FLAMETHROWER_BODY_DAMAGE;
  private lastFired = 0;

  constructor(
    scene: Phaser.Scene,
    config: FlamethrowerShipConfig,
    private onSummonPlume: FlamethrowerFireCallback,
  ) {
    super(scene, config.x, config.y, 'flamethrower-ship');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(14);
    this.setDepth(6);
    this.setVelocity(config.velocityX, config.velocityY);
    this.setAngularVelocity(Phaser.Math.Between(-30, 30));
  }

  static randomConfig(): FlamethrowerShipConfig {
    const fromTop = Math.random() < 0.6;
    let x: number;
    let y: number;

    if (fromTop) {
      x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      y = Phaser.Math.Between(-60, -20);
    } else {
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? -40 : GAME_WIDTH + 40;
      y = Phaser.Math.Between(60, GAME_HEIGHT * 0.45);
    }

    const targetX = GAME_WIDTH / 2;
    const targetY = GAME_HEIGHT * 0.55;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = Phaser.Math.Between(40, 70);

    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
    };
  }

  tryFire(time: number, targetX: number, targetY: number): void {
    if (time < this.lastFired + FLAMETHROWER_FIRE_COOLDOWN) return;

    this.lastFired = time;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.onSummonPlume(this.x, this.y, angle);
  }

  takeHit(): boolean {
    this.health -= 1;
    this.setTint(0xff8888);
    this.scene.time.delayedCall(80, () => this.clearTint());

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.setTint(0xff8888);
    this.scene.time.delayedCall(80, () => this.clearTint());

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  isOffScreen(): boolean {
    const margin = 80;
    return (
      this.x < -margin
      || this.x > GAME_WIDTH + margin
      || this.y < -margin
      || this.y > GAME_HEIGHT + margin
    );
  }
}
