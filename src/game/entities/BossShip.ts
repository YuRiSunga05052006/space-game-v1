import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { BossDefinition } from '../levelResolver';

export type BossFireCallback = (x: number, y: number, angle: number) => void;
export type BossSpecialCallback = () => void;

export class BossShip extends Phaser.Physics.Arcade.Sprite {
  health: number;
  readonly maxHealth: number;
  readonly bodyDamage: number;
  readonly points: number;
  readonly definition: BossDefinition;
  readonly bossName: string;

  private readonly fireCooldown: number;
  private readonly fanEvery: number;
  private readonly fanSpreadRad: number;
  private readonly fanCount: number;
  private readonly velocityY: number;
  private readonly driftX: number;
  private lastFired = 0;
  private fanShotCounter = 0;
  private driftDir = 1;

  private specialCooldownAt = 0;
  private chargeStartedAt = 0;
  private charging = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    definition: BossDefinition,
    private onFire: BossFireCallback,
    private onSpecial: BossSpecialCallback,
    healthOverride?: number,
    maxHealthOverride?: number,
    pointsOverride?: number,
  ) {
    super(scene, x, y, definition.textureKey);

    this.definition = definition;
    this.bossName = definition.bossName;
    this.maxHealth = maxHealthOverride ?? healthOverride ?? definition.baseHealth;
    this.health = healthOverride ?? this.maxHealth;
    this.velocityY = definition.velocityY;
    this.driftX = definition.driftX;
    this.bodyDamage = definition.bodyDamage;
    this.points = pointsOverride ?? definition.points;
    this.fireCooldown = definition.fireCooldown;
    this.fanEvery = definition.fanEvery;
    this.fanSpreadRad = (definition.fanSpreadDeg * Math.PI) / 180;
    this.fanCount = definition.fanCount;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);

    this.setCircle(definition.hitRadius ?? 28);
    this.setDepth(8);
    this.setVelocity(definition.driftX, definition.velocityY);
    this.clearTint();

    const baseScale = definition.baseScale ?? 1;
    let healthScale = 1;
    if (this.maxHealth >= 300) {
      healthScale = 1.1;
    } else if (this.maxHealth >= 200) {
      healthScale = 1.05;
    }
    this.setScale(baseScale * healthScale);

    this.specialCooldownAt = scene.time.now + definition.special.cooldownMs;
  }

  tryFire(time: number, targetX: number, targetY: number): void {
    if (this.charging) return;
    if (time < this.lastFired + this.fireCooldown) return;

    this.lastFired = time;
    this.fanShotCounter += 1;

    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

    if (this.fanEvery > 0 && this.fanShotCounter % this.fanEvery === 0) {
      const half = (this.fanCount - 1) / 2;
      for (let i = 0; i < this.fanCount; i++) {
        const t = half === 0 ? 0 : (i / half) - 1;
        this.onFire(this.x, this.y, baseAngle + t * this.fanSpreadRad);
      }
    } else {
      this.onFire(this.x, this.y, baseAngle);
    }
  }

  updateMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const minY = 90;
    const maxY = GAME_HEIGHT * 0.42;

    if (this.y < minY) {
      body.setVelocityY(Math.max(this.velocityY, 40));
    } else if (this.y > maxY) {
      body.setVelocityY(-Math.abs(this.velocityY) * 0.5);
    } else if (body.velocity.y === 0) {
      body.setVelocityY(this.velocityY);
    }

    if (this.driftX !== 0) {
      if (this.x <= 60) this.driftDir = 1;
      if (this.x >= GAME_WIDTH - 60) this.driftDir = -1;
      body.setVelocityX(this.driftX * this.driftDir);
    }
  }

  updateSpecial(time: number): void {
    const special = this.definition.special;

    if (this.charging) {
      if (time >= this.chargeStartedAt + special.chargeMs) {
        this.charging = false;
        this.specialCooldownAt = time + special.cooldownMs;
        this.onSpecial();
      }
      return;
    }

    if (time >= this.specialCooldownAt) {
      this.charging = true;
      this.chargeStartedAt = time;
    }
  }

  isCharging(): boolean {
    return this.charging;
  }

  getSpecialName(): string {
    return this.definition.special.name;
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(80, () => this.clearTint());

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
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

  respawnFromTop(): void {
    this.setPosition(GAME_WIDTH / 2, 100);
    this.setVelocity(this.driftX * this.driftDir, this.velocityY);
  }
}
