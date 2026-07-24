import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export type MineVariant = 'gray' | 'red' | 'purple' | 'blue';

export interface MineConfig {
  variant: MineVariant;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface MineBlastStats {
  texture: string;
  bodyRadius: number;
  playerDamage: number;
  blastRadius: number;
  points: number;
  canChainCarriers: boolean;
  damagesPlayer: boolean;
}

export const MINE_DATA: Record<MineVariant, MineBlastStats> = {
  gray: {
    texture: 'mine-gray',
    // Match Mine Carrier hitbox (circle 12 on 36px sprite).
    bodyRadius: 12,
    playerDamage: 6,
    blastRadius: 70,
    points: 30,
    canChainCarriers: false,
    damagesPlayer: true,
  },
  blue: {
    texture: 'mine-blue',
    bodyRadius: 12,
    playerDamage: 0,
    blastRadius: 70,
    points: 30,
    canChainCarriers: true,
    damagesPlayer: false,
  },
  red: {
    texture: 'mine-red',
    // Midway between carrier-sized and boss-sized mines.
    bodyRadius: 20,
    playerDamage: 12,
    blastRadius: 100,
    points: 50,
    canChainCarriers: true,
    damagesPlayer: true,
  },
  purple: {
    texture: 'mine-purple',
    // Comparable to a big boss hit radius (~28–35).
    bodyRadius: 30,
    playerDamage: 20,
    blastRadius: 140,
    points: 80,
    canChainCarriers: true,
    damagesPlayer: true,
  },
};

const MINE_SPEED: Record<MineVariant, number> = {
  gray: 90,
  blue: 90,
  red: 75,
  purple: 60,
};

export class Mine extends Phaser.Physics.Arcade.Sprite {
  readonly variant: MineVariant;
  readonly playerDamage: number;
  readonly blastRadius: number;
  readonly points: number;
  readonly canChainCarriers: boolean;
  readonly damagesPlayer: boolean;
  private pushCooldownMs = 0;

  constructor(scene: Phaser.Scene, config: MineConfig) {
    const data = MINE_DATA[config.variant];
    super(scene, config.x, config.y, data.texture);

    this.variant = config.variant;
    this.playerDamage = data.playerDamage;
    this.blastRadius = data.blastRadius;
    this.points = data.points;
    this.canChainCarriers = data.canChainCarriers;
    this.damagesPlayer = data.damagesPlayer;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(data.bodyRadius);
    this.setDepth(5);
    this.setVelocity(config.velocityX, config.velocityY);
    this.setAngularVelocity(Phaser.Math.Between(-40, 40));
  }

  get isBlue(): boolean {
    return this.variant === 'blue';
  }

  static randomConfig(variant: MineVariant): MineConfig {
    const speed = MINE_SPEED[variant] * Phaser.Math.FloatBetween(0.85, 1.15);
    const spawnFromTop = Math.random() < 0.7;
    let x: number;
    let y: number;
    let velocityX: number;
    let velocityY: number;

    if (spawnFromTop) {
      x = Phaser.Math.Between(30, GAME_WIDTH - 30);
      y = Phaser.Math.Between(-70, -20);
      velocityX = Phaser.Math.Between(-50, 50);
      velocityY = speed;
    } else {
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? -40 : GAME_WIDTH + 40;
      y = Phaser.Math.Between(40, GAME_HEIGHT * 0.55);
      velocityX = fromLeft ? speed * 0.7 : -speed * 0.7;
      velocityY = Phaser.Math.Between(speed * 0.35, speed * 0.85);
    }

    return { variant, x, y, velocityX, velocityY };
  }

  static spawnAt(
    scene: Phaser.Scene,
    variant: MineVariant,
    x: number,
    y: number,
  ): Mine {
    const speed = MINE_SPEED[variant] * Phaser.Math.FloatBetween(0.5, 0.9);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return new Mine(scene, {
      variant,
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
    });
  }

  canAcceptPush(): boolean {
    return this.isBlue && this.pushCooldownMs <= 0;
  }

  applyPlayerPush(playerX: number, playerY: number): void {
    if (!this.canAcceptPush()) return;
    const angle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
    // Slow kick so the player can steer blue mines with repeated nudges.
    const pushSpeed = 95;
    this.setVelocity(Math.cos(angle) * pushSpeed, Math.sin(angle) * pushSpeed);
    this.pushCooldownMs = 120;
  }

  updateMine(_time: number, delta: number): void {
    if (this.pushCooldownMs > 0) {
      this.pushCooldownMs = Math.max(0, this.pushCooldownMs - delta);
    }
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
