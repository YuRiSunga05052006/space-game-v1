import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getEquippedSkinTextureKey, getEquippedSkinId, PLAYER_SKINS } from '../playerSkins';
import { getThrusterTints, ROCKET_ENGINE_OFFSET_Y } from '../rocketAppearances';
import {
  buildFirePattern,
  computePlayerPowerScore,
  createDefaultLoadout,
  getWeaponById,
  type BulletSpawn,
  type WeaponLoadout,
} from '../weapons';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly baseMaxSpeed = 280;
  private lastFired = 0;
  private thruster?: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeTrail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeEmitCooldown = 0;
  private readonly smokeEmitIntervalMs = 16;
  private readonly engineWorldPos = new Phaser.Math.Vector2();
  private readonly worldMatrix = new Phaser.GameObjects.Components.TransformMatrix();
  private isMoving = false;

  private invincible = false;
  private invincibleTimer?: Phaser.Time.TimerEvent;
  private rainbowGlow?: Phaser.GameObjects.Graphics;
  private rainbowTween?: Phaser.Tweens.Tween;
  private glowHue = 0;

  private loadout: WeaponLoadout = createDefaultLoadout();
  private ownedWeaponIds: string[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getEquippedSkinTextureKey());
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDrag(0);
    this.applySpeedMultiplier();
    this.setSize(20, 36);
    this.setOffset(6, 8);
    this.setDepth(10);

    this.createThruster();
  }

  private applySpeedMultiplier(): void {
    this.setMaxVelocity(this.baseMaxSpeed * this.loadout.speedMultiplier);
  }

  getOwnedWeaponIds(): string[] {
    return [...this.ownedWeaponIds];
  }

  getOwnedWeaponNames(): string[] {
    return this.ownedWeaponIds
      .map((id) => getWeaponById(id)?.name)
      .filter((name): name is string => name !== undefined);
  }

  addWeapon(weaponId: string): boolean {
    if (this.ownedWeaponIds.includes(weaponId)) return false;
    const weapon = getWeaponById(weaponId);
    if (!weapon) return false;

    weapon.apply(this.loadout);
    this.ownedWeaponIds.push(weaponId);
    this.applySpeedMultiplier();
    return true;
  }

  getFirePattern(): BulletSpawn[] {
    return buildFirePattern(this.loadout);
  }

  getFireCooldownMs(): number {
    return this.loadout.fireCooldownMs;
  }

  getLoadout(): WeaponLoadout {
    return { ...this.loadout };
  }

  getPowerScore(): number {
    return computePlayerPowerScore(this.loadout, this.ownedWeaponIds.length);
  }

  private createThruster(): void {
    const equippedSkin = PLAYER_SKINS.find((skin) => skin.id === getEquippedSkinId());
    const tint = equippedSkin
      ? getThrusterTints(equippedSkin.appearanceId)
      : [0xff6b35, 0xffcc00, 0xff4400];

    this.thruster = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 140 },
      scale: { start: 1.4, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 700,
      tint,
      angle: {
        onEmit: () => {
          const exhaustDeg = Phaser.Math.RadToDeg(this.rotation) + 90;
          return Phaser.Math.FloatBetween(exhaustDeg - 12, exhaustDeg + 12);
        },
      },
      frequency: -1,
    });
    this.thruster.setDepth(9);

    this.smokeTrail = this.scene.add.particles(0, 0, 'smoke-particle', {
      speed: { min: 0, max: 2 },
      scale: { start: 0.85, end: 0.3 },
      alpha: { start: 0.28, end: 0 },
      lifespan: 900,
      tint,
      rotate: {
        onEmit: () => Phaser.Math.RadToDeg(this.rotation) + 90 + Phaser.Math.FloatBetween(-8, 8),
      },
      frequency: -1,
    });
    this.smokeTrail.setDepth(8);
  }

  private getEngineWorldPosition(): { x: number; y: number } {
    this.getWorldTransformMatrix(this.worldMatrix);
    this.worldMatrix.transformPoint(0, ROCKET_ENGINE_OFFSET_Y, this.engineWorldPos);
    return { x: this.engineWorldPos.x, y: this.engineWorldPos.y };
  }

  isInvincible(): boolean {
    return this.invincible;
  }

  activateInvincibility(durationMs: number): void {
    this.invincible = true;
    this.invincibleTimer?.remove(false);
    this.invincibleTimer = this.scene.time.delayedCall(durationMs, () => {
      this.deactivateInvincibility();
    });
    this.startRainbowGlow();
  }

  deactivateInvincibility(): void {
    this.invincible = false;
    this.invincibleTimer?.remove(false);
    this.invincibleTimer = undefined;
    this.stopRainbowGlow();
  }

  private startRainbowGlow(): void {
    this.stopRainbowGlow();

    this.rainbowGlow = this.scene.add.graphics();
    this.rainbowGlow.setDepth(9);
    this.drawRainbowGlow();

    this.rainbowTween = this.scene.tweens.add({
      targets: this,
      glowHue: 360,
      duration: 1500,
      repeat: -1,
      onUpdate: () => this.drawRainbowGlow(),
    });
  }

  private stopRainbowGlow(): void {
    this.rainbowTween?.stop();
    this.rainbowTween = undefined;
    this.rainbowGlow?.destroy();
    this.rainbowGlow = undefined;
    this.glowHue = 0;
  }

  private drawRainbowGlow(): void {
    if (!this.rainbowGlow) return;

    const color = Phaser.Display.Color.HSVToRGB(this.glowHue / 360, 1, 1) as Phaser.Display.Color;
    const colorHex = color.color;

    this.rainbowGlow.clear();
    this.rainbowGlow.setPosition(this.x, this.y);

    this.rainbowGlow.fillStyle(colorHex, 0.15);
    this.rainbowGlow.fillCircle(0, 0, 36);

    this.rainbowGlow.lineStyle(3, colorHex, 0.7);
    this.rainbowGlow.strokeCircle(0, 0, 28);

    this.rainbowGlow.lineStyle(2, colorHex, 0.4);
    this.rainbowGlow.strokeCircle(0, 0, 34);
  }

  moveByVector(vx: number, vy: number): void {
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len < 0.1) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;
    const nx = vx / len;
    const ny = vy / len;
    const speed = this.baseMaxSpeed * this.loadout.speedMultiplier;
    this.setVelocity(nx * speed, ny * speed);

    const angle = Phaser.Math.RadToDeg(Math.atan2(ny, nx)) + 90;
    this.setRotation(Phaser.Math.DegToRad(angle));
  }

  stopMove(): void {
    this.setVelocity(0, 0);
    this.isMoving = false;
  }

  hideForDeath(): void {
    this.stopMove();
    this.setVisible(false);
    this.thruster?.setVisible(false);
    this.smokeTrail?.setVisible(false);
    if (this.body) {
      this.body.enable = false;
    }
  }

  updateThruster(_time: number, _delta: number): void {
    if (this.isMoving && this.thruster) {
      const engine = this.getEngineWorldPosition();
      this.thruster.setPosition(engine.x, engine.y);
      this.thruster.emitParticle();
      this.thruster.emitParticle();
      this.thruster.emitParticle();

      if (this.smokeTrail) {
        this.smokeEmitCooldown += _delta;
        if (this.smokeEmitCooldown >= this.smokeEmitIntervalMs) {
          this.smokeEmitCooldown = 0;
          const perpRad = this.rotation;
          const spreads = [0, 6, -6, 10, -10];
          for (const spread of spreads) {
            this.smokeTrail.emitParticleAt(
              engine.x + Math.cos(perpRad) * spread,
              engine.y + Math.sin(perpRad) * spread,
            );
          }
        }
      }
    } else {
      this.smokeEmitCooldown = 0;
    }
    if (this.invincible && this.rainbowGlow) {
      this.drawRainbowGlow();
    }
  }

  canFire(time: number): boolean {
    return time > this.lastFired + this.loadout.fireCooldownMs;
  }

  consumeFire(time: number): void {
    this.lastFired = time;
  }

  getBulletSpawnPoint(): { x: number; y: number } {
    this.getWorldTransformMatrix(this.worldMatrix);
    this.worldMatrix.transformPoint(0, -ROCKET_ENGINE_OFFSET_Y, this.engineWorldPos);
    return { x: this.engineWorldPos.x, y: this.engineWorldPos.y };
  }

  moveTowardTarget(tx: number, ty: number, strength = 1): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      this.stopMove();
      return;
    }

    this.moveByVector((dx / dist) * strength, (dy / dist) * strength);
  }

  clampToBounds(): void {
    this.x = Phaser.Math.Clamp(this.x, 20, GAME_WIDTH - 20);
    this.y = Phaser.Math.Clamp(this.y, 40, GAME_HEIGHT - 40);
  }

  destroy(fromScene?: boolean): void {
    this.deactivateInvincibility();
    this.thruster?.destroy();
    this.smokeTrail?.destroy();
    super.destroy(fromScene);
  }
}
