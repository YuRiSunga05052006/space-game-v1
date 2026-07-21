import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getGoldCometCoinReward } from '../coinDrops';

export type CometVariant = 'normal' | 'gold';

export interface CometConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  variant?: CometVariant;
}

export const COMET_DAMAGE = 8;
export const COMET_POINTS = 45;
export const GOLD_COMET_POINTS = 80;

export class Comet extends Phaser.Physics.Arcade.Sprite {
  readonly variant: CometVariant;
  readonly coinReward: number;
  readonly points: number;
  readonly bodyDamage: number;
  private tailEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, config: CometConfig) {
    const variant = config.variant ?? 'normal';
    const texture = variant === 'gold' ? 'comet-gold' : 'comet';
    super(scene, config.x, config.y, texture);

    this.variant = variant;
    this.coinReward = variant === 'gold' ? getGoldCometCoinReward() : 0;
    this.points = variant === 'gold' ? GOLD_COMET_POINTS : COMET_POINTS;
    this.bodyDamage = COMET_DAMAGE;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(14);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);

    const moveAngle = Math.atan2(config.velocityY, config.velocityX);
    this.setRotation(moveAngle);

    if (variant === 'gold') {
      this.setTint(0xffee88);
    }

    if (scene.textures.exists('particle')) {
      const tailAngle = Phaser.Math.RadToDeg(moveAngle + Math.PI);
      this.tailEmitter = scene.add.particles(config.x, config.y, 'particle', {
        speed: { min: 20, max: 60 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 400,
        frequency: 40,
        tint: variant === 'gold' ? 0xffcc44 : 0x88aaff,
        angle: { min: tailAngle - 20, max: tailAngle + 20 },
        follow: this,
      });
      this.tailEmitter.setDepth(4);
    }
  }

  get isGold(): boolean {
    return this.variant === 'gold';
  }

  destroy(fromScene?: boolean): void {
    this.tailEmitter?.destroy();
    super.destroy(fromScene);
  }

  static randomConfig(variant?: CometVariant): CometConfig {
    const side = Phaser.Math.Between(0, 1);
    const x = side === 0 ? -30 : GAME_WIDTH + 30;
    const y = Phaser.Math.Between(40, GAME_HEIGHT * 0.4);
    const targetX = Phaser.Math.Between(60, GAME_WIDTH - 60);
    const targetY = GAME_HEIGHT + 40;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = Phaser.Math.Between(180, 260);
    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      variant,
    };
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
