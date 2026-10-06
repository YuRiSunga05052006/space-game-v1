import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BOSS_SPECIAL_LASER_DAMAGE, LASER_DAMAGE } from './EnemyLaser';

export const RABIES_HEALTH = 8;
export const RABIES_POINTS = 48;
export const RABIES_BODY_DAMAGE = 6;
export const RABIES_FIRE_COOLDOWN = 700;
export const RABIES_PINK_DAMAGE = LASER_DAMAGE * 2;

export interface RabiesShipConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export type RabiesLaserStyle = 'red' | 'pink' | 'purple';

export interface RabiesShot {
  style: RabiesLaserStyle;
  damage: number;
  isSpecial: boolean;
}

export type RabiesFireCallback = (x: number, y: number, angle: number, shot: RabiesShot) => void;

export class RabiesShip extends Phaser.Physics.Arcade.Sprite {
  health = RABIES_HEALTH;
  readonly points = RABIES_POINTS;
  readonly bodyDamage = RABIES_BODY_DAMAGE;
  private lastFired = 0;
  private shotsFired = 0;

  constructor(
    scene: Phaser.Scene,
    config: RabiesShipConfig,
    private onFire: RabiesFireCallback,
  ) {
    super(scene, config.x, config.y, 'rabies-ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(15);
    this.setDepth(6);
    this.setVelocity(config.velocityX, config.velocityY);
  }

  static randomConfig(): RabiesShipConfig {
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const y = Phaser.Math.Between(-70, -24);
    const targetX = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const angle = Phaser.Math.Angle.Between(x, y, targetX, GAME_HEIGHT * 0.45);
    const speed = Phaser.Math.Between(45, 75);
    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
    };
  }

  tryFire(time: number, targetX: number, targetY: number): void {
    if (time < this.lastFired + RABIES_FIRE_COOLDOWN) return;
    this.lastFired = time;
    this.shotsFired += 1;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.onFire(this.x, this.y, angle, shotForCount(this.shotsFired));
  }

  takeHit(): boolean {
    return this.takeDamage(1);
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.setTint(0xff88aa);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
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

function shotForCount(count: number): RabiesShot {
  if (count <= 4) {
    return { style: 'red', damage: LASER_DAMAGE, isSpecial: false };
  }
  if (count <= 8) {
    return { style: 'pink', damage: RABIES_PINK_DAMAGE, isSpecial: false };
  }
  return { style: 'purple', damage: BOSS_SPECIAL_LASER_DAMAGE, isSpecial: true };
}
