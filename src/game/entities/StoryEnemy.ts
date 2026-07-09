import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { StoryEnemyDefinition, StoryEnemyBehavior } from '../levelResolver';

export type StoryEnemyFireCallback = (x: number, y: number, angle: number) => void;

export interface StoryEnemyConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  phase?: number;
}

const PATROL_DASH_INTERVAL_MS = 2200;

export class StoryEnemy extends Phaser.Physics.Arcade.Sprite {
  health: number;
  readonly points: number;
  readonly bodyDamage: number;
  private readonly definition: StoryEnemyDefinition;
  private readonly onFire: StoryEnemyFireCallback | null;
  private lastFired = 0;
  private zigzagTime = 0;
  private readonly phase: number;
  private lastDash = 0;
  private isDashing = false;

  constructor(
    scene: Phaser.Scene,
    definition: StoryEnemyDefinition,
    config: StoryEnemyConfig,
    onFire: StoryEnemyFireCallback | null,
  ) {
    super(scene, config.x, config.y, definition.textureKey);

    this.definition = definition;
    this.onFire = onFire;
    this.health = definition.health;
    this.points = definition.points;
    this.bodyDamage = definition.bodyDamage;
    this.phase = config.phase ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(definition.hitRadius);
    this.setDepth(6);
    this.setVelocity(config.velocityX, config.velocityY);

    if (definition.behavior === 'homing' && definition.level >= 6) {
      this.setAngularVelocity(Phaser.Math.Between(-60, 60));
    } else if (definition.behavior === 'driftLaser') {
      this.setAngularVelocity(Phaser.Math.Between(-30, 30));
    }
  }

  static randomConfig(
    definition: StoryEnemyDefinition,
    playerX = GAME_WIDTH / 2,
    playerY = GAME_HEIGHT - 120,
  ): StoryEnemyConfig {
    const speed = definition.moveSpeed;

    switch (definition.behavior) {
      case 'playerDive': {
        const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
        const y = Phaser.Math.Between(-70, -25);
        const angle = Phaser.Math.Angle.Between(x, y, playerX, playerY);
        return {
          x,
          y,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
        };
      }
      case 'lateralLaser': {
        const fromLeft = Math.random() < 0.5;
        return {
          x: fromLeft ? Phaser.Math.Between(40, 100) : Phaser.Math.Between(GAME_WIDTH - 100, GAME_WIDTH - 40),
          y: Phaser.Math.Between(-50, GAME_HEIGHT * 0.3),
          velocityX: fromLeft ? speed * 0.6 : -speed * 0.6,
          velocityY: Phaser.Math.Between(20, 40),
        };
      }
      case 'zigzagDive':
        return {
          x: Phaser.Math.Between(50, GAME_WIDTH - 50),
          y: Phaser.Math.Between(-70, -25),
          velocityX: 0,
          velocityY: speed,
          phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        };
      case 'spreadFire':
      case 'fanFire':
        return {
          x: Phaser.Math.Between(60, GAME_WIDTH - 60),
          y: Phaser.Math.Between(-60, -20),
          velocityX: Phaser.Math.Between(-25, 25),
          velocityY: speed * 0.5,
        };
      case 'patrolDash':
      case 'hybridHunter':
      case 'homing':
      case 'driftLaser':
      default: {
        const fromTop = Math.random() < 0.65;
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
        const driftSpeed = speed * Phaser.Math.FloatBetween(0.75, 1.1);

        return {
          x,
          y,
          velocityX: Math.cos(angle) * driftSpeed,
          velocityY: Math.sin(angle) * driftSpeed,
          phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        };
      }
    }
  }

  updateEnemy(time: number, playerX: number, playerY: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.definition.behavior) {
      case 'driftLaser':
        this.tryAimedFire(time, playerX, playerY);
        break;
      case 'homing':
        this.applyHoming(body, playerX, playerY, this.definition.moveSpeed);
        break;
      case 'zigzagDive':
        this.zigzagTime += delta / 1000;
        body.setVelocityX(Math.sin(this.zigzagTime * 4 + this.phase) * 140);
        break;
      case 'playerDive':
        break;
      case 'lateralLaser':
        this.trySpreadFire(time, playerX, playerY);
        break;
      case 'spreadFire':
        this.trySpreadFire(time, playerX, playerY);
        break;
      case 'fanFire':
        this.tryFanFire(time, playerX, playerY);
        break;
      case 'patrolDash':
        this.updatePatrolDash(time, body, playerX, playerY, delta);
        break;
      case 'hybridHunter':
        this.applyHoming(body, playerX, playerY, this.definition.moveSpeed);
        this.tryAimedFire(time, playerX, playerY);
        break;
    }
  }

  private applyHoming(
    body: Phaser.Physics.Arcade.Body,
    playerX: number,
    playerY: number,
    maxSpeed: number,
  ): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    const accel = this.definition.level >= 6 ? 220 : 180;
    body.setAcceleration(Math.cos(angle) * accel, Math.sin(angle) * accel);

    const speed = body.velocity.length();
    if (speed > maxSpeed) {
      body.velocity.normalize().scale(maxSpeed);
    }
  }

  private updatePatrolDash(
    time: number,
    body: Phaser.Physics.Arcade.Body,
    playerX: number,
    playerY: number,
    _delta: number,
  ): void {
    if (time >= this.lastDash + PATROL_DASH_INTERVAL_MS) {
      this.lastDash = time;
      this.isDashing = true;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      const dashSpeed = this.definition.moveSpeed * 2.2;
      body.setAcceleration(0, 0);
      body.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);
      this.scene.time.delayedCall(600, () => {
        if (!this.active) return;
        this.isDashing = false;
        body.setVelocity(body.velocity.x * 0.3, body.velocity.y * 0.3);
      });
    } else if (!this.isDashing) {
      body.setAcceleration(0, 0);
    }
  }

  private tryAimedFire(time: number, targetX: number, targetY: number): void {
    const cooldown = this.definition.fireCooldownMs ?? 2800;
    if (!this.onFire || time < this.lastFired + cooldown) return;

    this.lastFired = time;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.onFire(this.x, this.y, angle);
  }

  private trySpreadFire(time: number, targetX: number, targetY: number): void {
    const cooldown = this.definition.fireCooldownMs ?? 3000;
    if (!this.onFire || time < this.lastFired + cooldown) return;

    this.lastFired = time;
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const spread = ((this.definition.spreadDeg ?? 18) * Math.PI) / 180;
    const count = this.definition.shotCount ?? 3;

    if (count <= 1) {
      this.onFire(this.x, this.y, baseAngle);
      return;
    }

    const step = spread / (count - 1);
    const start = baseAngle - spread / 2;
    for (let i = 0; i < count; i++) {
      this.onFire(this.x, this.y, start + step * i);
    }
  }

  private tryFanFire(time: number, targetX: number, targetY: number): void {
    const cooldown = this.definition.fireCooldownMs ?? 3000;
    if (!this.onFire || time < this.lastFired + cooldown) return;

    this.lastFired = time;
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const spread = ((this.definition.spreadDeg ?? 10) * Math.PI) / 180;
    const count = this.definition.shotCount ?? 5;
    const half = (count - 1) / 2;

    for (let i = 0; i < count; i++) {
      this.onFire(this.x, this.y, baseAngle + (i - half) * spread);
    }
  }

  get level(): number {
    return this.definition.level;
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
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}

export function storyEnemyNeedsFire(behavior: StoryEnemyBehavior): boolean {
  return behavior === 'driftLaser'
    || behavior === 'lateralLaser'
    || behavior === 'spreadFire'
    || behavior === 'fanFire'
    || behavior === 'hybridHunter';
}
