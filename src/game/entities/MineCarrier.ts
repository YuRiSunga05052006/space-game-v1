import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const MINE_CARRIER_HEALTH = 4;
export const MINE_CARRIER_POINTS = 60;
export const MINE_CARRIER_BODY_DAMAGE = 14;
export const MINE_CARRIER_BLAST_RADIUS = 110;
export const MINE_CARRIER_MAX_SPEED = 85;

export interface MineCarrierConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export class MineCarrier extends Phaser.Physics.Arcade.Sprite {
  health = MINE_CARRIER_HEALTH;
  readonly points = MINE_CARRIER_POINTS;
  readonly playerDamage = MINE_CARRIER_BODY_DAMAGE;
  readonly blastRadius = MINE_CARRIER_BLAST_RADIUS;
  readonly canChainCarriers = true;
  readonly damagesPlayer = true;

  constructor(scene: Phaser.Scene, config: MineCarrierConfig) {
    super(scene, config.x, config.y, 'mine-carrier');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(12);
    this.setDepth(6);
    this.setVelocity(config.velocityX, config.velocityY);
  }

  static randomConfig(): MineCarrierConfig {
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const y = Phaser.Math.Between(-70, -25);
    return {
      x,
      y,
      velocityX: Phaser.Math.Between(-25, 25),
      velocityY: Phaser.Math.Between(40, 65),
    };
  }

  updateCarrier(playerX: number, playerY: number, _delta: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const accel = 95;
    body.setAcceleration(Math.cos(angle) * accel, Math.sin(angle) * accel);

    const speed = body.velocity.length();
    if (speed > MINE_CARRIER_MAX_SPEED) {
      body.velocity.normalize().scale(MINE_CARRIER_MAX_SPEED);
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.setTint(0xff88aa);
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
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}
