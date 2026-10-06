import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const PLASMA_BALL_DAMAGE = 8;
export const PLASMA_BALL_RADIUS = 16;

export interface PlasmaBallConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export class PlasmaBall extends Phaser.Physics.Arcade.Sprite {
  readonly bodyDamage = PLASMA_BALL_DAMAGE;
  private nextHurtAt = 0;

  constructor(scene: Phaser.Scene, config: PlasmaBallConfig) {
    super(scene, config.x, config.y, 'plasma-ball');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(PLASMA_BALL_RADIUS);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);
  }

  static randomConfig(): PlasmaBallConfig {
    const fromTop = Math.random() < 0.7;
    const x = fromTop
      ? Phaser.Math.Between(40, GAME_WIDTH - 40)
      : (Math.random() < 0.5 ? -30 : GAME_WIDTH + 30);
    const y = fromTop
      ? Phaser.Math.Between(-70, -24)
      : Phaser.Math.Between(40, GAME_HEIGHT * 0.45);
    const targetX = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const targetY = GAME_HEIGHT + 40;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = Phaser.Math.Between(70, 120);
    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
    };
  }

  canHurt(time: number): boolean {
    return time >= this.nextHurtAt;
  }

  markHurt(time: number): void {
    this.nextHurtAt = time + 800;
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
