import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export type FanFacing = 'up' | 'down' | 'left' | 'right';

export const FAN_GUST_MS = 1800;
export const FAN_QUIET_MS = 1400;
export const FAN_WIND_LENGTH = 190;
export const FAN_WIND_HALF_WIDTH = 28;
/** Acceleration applied to the ship and kicked mines while a gust is active. */
export const FAN_PUSH_ACCEL = 280;

export interface FanConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: FanFacing;
}

const FACINGS: FanFacing[] = ['up', 'down', 'left', 'right'];

export class Fan extends Phaser.Physics.Arcade.Sprite {
  readonly facing: FanFacing;
  private gustTimer = 0;
  private gusting = true;
  private windGfx?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: FanConfig) {
    super(scene, config.x, config.y, 'fan');
    this.facing = config.facing;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(16);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);
    this.setRotation(facingRotation(config.facing));
    this.windGfx = scene.add.graphics();
    this.windGfx.setDepth(4);
  }

  static randomConfig(): FanConfig {
    return {
      x: Phaser.Math.Between(60, GAME_WIDTH - 60),
      y: Phaser.Math.Between(-80, -30),
      velocityX: Phaser.Math.Between(-15, 15),
      velocityY: Phaser.Math.Between(40, 70),
      facing: FACINGS[Phaser.Math.Between(0, FACINGS.length - 1)],
    };
  }

  get isGusting(): boolean {
    return this.gusting;
  }

  updateFan(delta: number): void {
    this.gustTimer += delta;
    const span = this.gusting ? FAN_GUST_MS : FAN_QUIET_MS;
    if (this.gustTimer >= span) {
      this.gustTimer = 0;
      this.gusting = !this.gusting;
    }
    this.drawWind();
  }

  containsInWind(x: number, y: number): boolean {
    if (!this.gusting) return false;
    const dx = x - this.x;
    const dy = y - this.y;
    const along = this.facing === 'right' ? dx
      : this.facing === 'left' ? -dx
        : this.facing === 'down' ? dy
          : -dy;
    const across = this.facing === 'left' || this.facing === 'right' ? Math.abs(dy) : Math.abs(dx);
    return along > 8 && along < FAN_WIND_LENGTH && across <= FAN_WIND_HALF_WIDTH;
  }

  windAcceleration(): { x: number; y: number } {
    switch (this.facing) {
      case 'right': return { x: FAN_PUSH_ACCEL, y: 0 };
      case 'left': return { x: -FAN_PUSH_ACCEL, y: 0 };
      case 'down': return { x: 0, y: FAN_PUSH_ACCEL };
      default: return { x: 0, y: -FAN_PUSH_ACCEL };
    }
  }

  destroy(fromScene?: boolean): void {
    this.windGfx?.destroy();
    super.destroy(fromScene);
  }

  isOffScreen(): boolean {
    const margin = 120;
    return (
      this.x < -margin
      || this.x > GAME_WIDTH + margin
      || this.y < -margin
      || this.y > GAME_HEIGHT + margin
    );
  }

  private drawWind(): void {
    const g = this.windGfx;
    if (!g) return;
    g.clear();
    if (!this.gusting) return;
    g.lineStyle(2, 0xaaddff, 0.35);
    const dir = this.windAcceleration();
    const len = Math.hypot(dir.x, dir.y) || 1;
    const ux = dir.x / len;
    const uy = dir.y / len;
    const px = -uy;
    const py = ux;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 14;
      const x0 = this.x + px * offset + ux * 22;
      const y0 = this.y + py * offset + uy * 22;
      const x1 = x0 + ux * (FAN_WIND_LENGTH - 30);
      const y1 = y0 + uy * (FAN_WIND_LENGTH - 30);
      g.lineBetween(x0, y0, x1, y1);
    }
  }
}

function facingRotation(facing: FanFacing): number {
  switch (facing) {
    case 'right': return 0;
    case 'down': return Math.PI / 2;
    case 'left': return Math.PI;
    default: return -Math.PI / 2;
  }
}
