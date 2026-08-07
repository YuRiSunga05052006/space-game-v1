import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { startInvincibilityTheme, stopInvincibilityTheme } from '../audioManager';
import { getEquippedShapeId } from '../playerShapes';
import { getEquippedSkinTextureKey, getEquippedSkinId, PLAYER_SKINS } from '../playerSkins';
import {
  escapeUpperTextureKey,
  getRainbowCyclePhase,
  getThrusterTints,
  lowerModuleTextureKey,
  makeRainbowPalette,
  ROCKET_CANNON_OFFSET_Y,
  ROCKET_CANNON_TEXTURE_KEY,
  ROCKET_ENGINE_OFFSET_Y,
  ROCKET_ESCAPE_TEXTURE_HEIGHT,
  ROCKET_LOWER_OFFSET_Y,
  ROCKET_TEXTURE_HEIGHT,
  ROCKET_TEXTURE_WIDTH,
  ROCKET_UPPER_OFFSET_Y,
  sampleRainbowColor,
} from '../rocketAppearances';
import { drawShapeAssembled } from '../rocketShapes';
import {
  buildFirePattern,
  computePlayerPowerScore,
  createDefaultLoadout,
  getWeaponById,
  type BulletSpawn,
  type WeaponLoadout,
} from '../weapons';

const FAIL_ESCAPE_DURATION_MS = 1100;
const FAIL_ESCAPE_SPEED = 520;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly baseMaxSpeed = 280;
  private lastFired = 0;
  private thruster?: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeTrail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeEmitCooldown = 0;
  private readonly smokeEmitIntervalMs = 16;
  private readonly engineWorldPos = new Phaser.Math.Vector2();
  private readonly cannonWorldPos = new Phaser.Math.Vector2();
  private readonly worldMatrix = new Phaser.GameObjects.Components.TransformMatrix();
  private isMoving = false;
  private cannon?: Phaser.GameObjects.Image;
  private readonly skinTextureKey: string;

  private invincible = false;
  private invincibleTimer?: Phaser.Time.TimerEvent;
  private rainbowGlow?: Phaser.GameObjects.Graphics;
  private rainbowTween?: Phaser.Tweens.Tween;
  private rainbowShipGfx?: Phaser.GameObjects.Graphics;
  private readonly electricRainbowSkin: boolean;
  private glowHue = 0;

  private shielded = false;
  private shieldTimer?: Phaser.Time.TimerEvent;
  private shieldGlow?: Phaser.GameObjects.Graphics;
  private onShieldBreak?: () => void;

  private invisible = false;
  private invisibleTimer?: Phaser.Time.TimerEvent;
  private invisibleBaseAlpha = 1;

  private boosting = false;
  private boostTimer?: Phaser.Time.TimerEvent;
  private boostScoreCap = 0;
  private boostPointsEarned = 0;
  private onBoostCapReached?: () => void;
  private boostGlow?: Phaser.GameObjects.Graphics;
  private readonly boostSpeedMultiplier = 1.45;
  private mercyInvincibleUntil = 0;

  private loadout: WeaponLoadout = createDefaultLoadout();
  private ownedWeaponIds: string[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const textureKey = getEquippedSkinTextureKey();
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.skinTextureKey = textureKey;
    this.electricRainbowSkin = getEquippedSkinId() === 'electricRainbow';

    this.setCollideWorldBounds(true);
    this.setDrag(0);
    this.applySpeedMultiplier();
    this.setSize(22, 44);
    this.setOffset(9, 10);
    this.setDepth(10);

    if (this.electricRainbowSkin) {
      this.rainbowShipGfx = scene.add.graphics();
      this.rainbowShipGfx.setDepth(10);
      this.setAlpha(0);
    }

    this.createCannon();
    this.createThruster();
  }

  private createCannon(): void {
    this.cannon = this.scene.add.image(0, 0, ROCKET_CANNON_TEXTURE_KEY);
    this.cannon.setDepth(11);
    this.cannon.setOrigin(0.5, 0.85);
  }

  private applySpeedMultiplier(): void {
    const boostMult = this.boosting ? this.boostSpeedMultiplier : 1;
    this.setMaxVelocity(this.baseMaxSpeed * this.loadout.speedMultiplier * boostMult);
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
    const electricRainbow = equippedSkin?.appearanceId === 'electricRainbow';
    const tint = equippedSkin
      ? getThrusterTints(equippedSkin.appearanceId)
      : [0xff6b35, 0xffcc00, 0xff4400];

    const particleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      speed: { min: 60, max: 140 },
      scale: { start: 1.4, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 700,
      angle: {
        onEmit: () => {
          const exhaustDeg = Phaser.Math.RadToDeg(this.rotation) + 90;
          return Phaser.Math.FloatBetween(exhaustDeg - 12, exhaustDeg + 12);
        },
      },
      frequency: -1,
    };

    if (electricRainbow) {
      particleConfig.tint = {
        onEmit: () => sampleRainbowColor(getRainbowCyclePhase(this.scene.time.now)),
      };
    } else {
      particleConfig.tint = tint;
    }

    this.thruster = this.scene.add.particles(0, 0, 'particle', particleConfig);
    this.thruster.setDepth(9);

    const smokeConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      speed: { min: 0, max: 2 },
      scale: { start: 0.85, end: 0.3 },
      alpha: { start: 0.28, end: 0 },
      lifespan: 900,
      rotate: {
        onEmit: () => Phaser.Math.RadToDeg(this.rotation) + 90 + Phaser.Math.FloatBetween(-8, 8),
      },
      frequency: -1,
    };

    if (electricRainbow) {
      smokeConfig.tint = {
        onEmit: () => sampleRainbowColor(getRainbowCyclePhase(this.scene.time.now)),
      };
    } else {
      smokeConfig.tint = tint;
    }

    this.smokeTrail = this.scene.add.particles(0, 0, 'smoke-particle', smokeConfig);
    this.smokeTrail.setDepth(8);
  }

  private updateRainbowShip(): void {
    if (!this.rainbowShipGfx || !this.active) return;

    const phase = getRainbowCyclePhase(this.scene.time.now);
    const bodyColor = sampleRainbowColor(phase);
    const engineColor = sampleRainbowColor(phase);

    this.rainbowShipGfx.clear();
    this.rainbowShipGfx.setPosition(this.x, this.y);
    this.rainbowShipGfx.setRotation(this.rotation);
    this.rainbowShipGfx.setVisible(true);
    this.rainbowShipGfx.setAlpha(this.invisible ? this.alpha : 1);

    drawShapeAssembled(
      getEquippedShapeId(),
      this.rainbowShipGfx,
      makeRainbowPalette(bodyColor, engineColor),
      -ROCKET_TEXTURE_WIDTH / 2,
      -ROCKET_TEXTURE_HEIGHT / 2,
    );
  }

  private updateCannonVisual(): void {
    if (!this.cannon) return;

    if (!this.visible) {
      this.cannon.setVisible(false);
      return;
    }

    this.getWorldTransformMatrix(this.worldMatrix);
    this.worldMatrix.transformPoint(0, ROCKET_CANNON_OFFSET_Y, this.cannonWorldPos);
    this.cannon.setPosition(this.cannonWorldPos.x, this.cannonWorldPos.y);
    // Keep barrel pointing screen-up regardless of hull angle.
    this.cannon.setRotation(0);
    this.cannon.setVisible(true);
    this.cannon.setAlpha(this.invisible ? 0.35 : 1);
  }

  private getEngineWorldPosition(): { x: number; y: number } {
    this.getWorldTransformMatrix(this.worldMatrix);
    this.worldMatrix.transformPoint(0, ROCKET_ENGINE_OFFSET_Y, this.engineWorldPos);
    return { x: this.engineWorldPos.x, y: this.engineWorldPos.y };
  }

  isInvincible(): boolean {
    return this.invincible;
  }

  isShielded(): boolean {
    return this.shielded;
  }

  isInvisible(): boolean {
    return this.invisible;
  }

  isBoosting(): boolean {
    return this.boosting;
  }

  isDamageImmune(): boolean {
    return this.invincible || this.shielded || this.invisible || this.boosting || this.isMercyInvincible();
  }

  isMercyInvincible(): boolean {
    return this.scene.time.now < this.mercyInvincibleUntil;
  }

  grantMercyInvincibility(durationMs: number): void {
    this.mercyInvincibleUntil = Math.max(
      this.mercyInvincibleUntil,
      this.scene.time.now + durationMs,
    );
  }

  clearMercyInvincibility(): void {
    this.mercyInvincibleUntil = 0;
  }

  isGhostMode(): boolean {
    return this.invisible;
  }

  getBoostScoreCap(): number {
    return this.boostScoreCap;
  }

  getBoostPointsEarned(): number {
    return this.boostPointsEarned;
  }

  addBoostPoints(amount: number): boolean {
    if (!this.boosting || amount <= 0) return false;
    this.boostPointsEarned += amount;
    if (this.boostPointsEarned >= this.boostScoreCap) {
      this.deactivateBoostMode(true);
      return true;
    }
    return false;
  }

  activateShield(durationMs: number, onBreak?: () => void): void {
    this.deactivateShield(false);
    this.shielded = true;
    this.onShieldBreak = onBreak;
    this.shieldTimer = this.scene.time.delayedCall(durationMs, () => {
      this.deactivateShield(false);
    });
    this.startShieldGlow();
  }

  breakShield(): void {
    if (!this.shielded) return;
    const callback = this.onShieldBreak;
    this.deactivateShield(false);
    callback?.();
  }

  deactivateShield(triggerCallback = false): void {
    if (!this.shielded) return;
    this.shielded = false;
    this.shieldTimer?.remove(false);
    this.shieldTimer = undefined;
    if (triggerCallback) {
      this.onShieldBreak?.();
    }
    this.onShieldBreak = undefined;
    this.stopShieldGlow();
  }

  activateInvisibility(durationMs: number): void {
    this.deactivateInvisibility();
    this.invisible = true;
    this.invisibleBaseAlpha = this.alpha;
    this.setAlpha(0.35);
    this.rainbowShipGfx?.setAlpha(0.35);
    this.invisibleTimer = this.scene.time.delayedCall(durationMs, () => {
      this.deactivateInvisibility();
    });
  }

  deactivateInvisibility(): void {
    if (!this.invisible) return;
    this.invisible = false;
    this.invisibleTimer?.remove(false);
    this.invisibleTimer = undefined;
    this.setAlpha(this.invisibleBaseAlpha);
    this.rainbowShipGfx?.setAlpha(this.electricRainbowSkin ? 1 : this.invisibleBaseAlpha);
  }

  activateBoostMode(options: {
    scoreCap: number;
    durationMs?: number;
    onEnd?: () => void;
  }): void {
    this.deactivateBoostMode(false);
    this.boosting = true;
    this.boostScoreCap = options.scoreCap;
    this.boostPointsEarned = 0;
    this.onBoostCapReached = options.onEnd;
    this.boostTimer?.remove(false);
    this.boostTimer = undefined;
    if (options.durationMs != null && options.durationMs > 0) {
      this.boostTimer = this.scene.time.delayedCall(options.durationMs, () => {
        this.deactivateBoostMode(true);
      });
    }
    this.startBoostGlow();
    this.applySpeedMultiplier();
  }

  /**
   * Add bonus to the boost denominator while keeping the current numerator.
   * Used when collecting a Fuel Tank during an active Fuel Tank / Engine / Hyperdrive boost.
   */
  extendBoostScoreCap(bonus: number): boolean {
    if (!this.boosting || bonus <= 0) return false;
    this.boostScoreCap += bonus;
    return true;
  }

  deactivateBoostMode(triggerCallback = false): void {
    if (!this.boosting) return;
    this.boosting = false;
    this.boostTimer?.remove(false);
    this.boostTimer = undefined;
    this.boostScoreCap = 0;
    this.boostPointsEarned = 0;
    if (triggerCallback) {
      this.onBoostCapReached?.();
    }
    this.onBoostCapReached = undefined;
    this.stopBoostGlow();
    this.applySpeedMultiplier();
  }

  absorbHit(): boolean {
    if (this.invisible || this.boosting || this.invincible || this.isMercyInvincible()) return true;
    if (this.shielded) {
      this.breakShield();
      return true;
    }
    return false;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  activateInvincibility(durationMs: number): void {
    this.invincible = true;
    this.invincibleTimer?.remove(false);
    this.invincibleTimer = this.scene.time.delayedCall(durationMs, () => {
      this.deactivateInvincibility();
    });
    this.startRainbowGlow();
    startInvincibilityTheme();
  }

  deactivateInvincibility(): void {
    this.invincible = false;
    this.invincibleTimer?.remove(false);
    this.invincibleTimer = undefined;
    this.stopRainbowGlow();
    stopInvincibilityTheme();
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
    const boostMult = this.boosting ? this.boostSpeedMultiplier : 1;
    const speed = this.baseMaxSpeed * this.loadout.speedMultiplier * boostMult;
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
    this.rainbowShipGfx?.setVisible(false);
    this.cannon?.setVisible(false);
    this.thruster?.setVisible(false);
    this.smokeTrail?.setVisible(false);
    this.rainbowGlow?.setVisible(false);
    this.shieldGlow?.setVisible(false);
    this.boostGlow?.setVisible(false);
    if (this.body) {
      this.body.enable = false;
    }
  }

  /**
   * Separates the ship on fatal hit: lower module explodes, upper escape module
   * deploys wings and flies away. Returns explosion center for VFX.
   */
  playFailSeparation(): { explosionX: number; explosionY: number } {
    this.getWorldTransformMatrix(this.worldMatrix);

    const lowerPos = new Phaser.Math.Vector2();
    const upperPos = new Phaser.Math.Vector2();
    this.worldMatrix.transformPoint(0, ROCKET_LOWER_OFFSET_Y, lowerPos);
    this.worldMatrix.transformPoint(0, ROCKET_UPPER_OFFSET_Y, upperPos);

    const facing = this.rotation;
    this.hideForDeath();

    const lower = this.scene.add.image(
      lowerPos.x,
      lowerPos.y,
      lowerModuleTextureKey(this.skinTextureKey),
    );
    lower.setRotation(facing);
    lower.setDepth(10);

    const escape = this.scene.add.image(
      upperPos.x,
      upperPos.y,
      escapeUpperTextureKey(this.skinTextureKey),
    );
    escape.setRotation(facing);
    escape.setDepth(12);

    // Fly roughly along current nose direction (screen-up when upright).
    const escapeAngle = facing - Math.PI / 2;
    const targetX = upperPos.x + Math.cos(escapeAngle) * FAIL_ESCAPE_SPEED * (FAIL_ESCAPE_DURATION_MS / 1000);
    const targetY = upperPos.y + Math.sin(escapeAngle) * FAIL_ESCAPE_SPEED * (FAIL_ESCAPE_DURATION_MS / 1000);

    this.scene.tweens.add({
      targets: escape,
      x: targetX,
      y: targetY,
      duration: FAIL_ESCAPE_DURATION_MS,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        escape.destroy();
      },
    });

    // Brief thruster burst from the escape module's hidden engines.
    const escapeThruster = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 40, max: 100 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 280,
      tint: [0x66ccff, 0xaaddff, 0xffffff],
      frequency: 30,
      angle: Phaser.Math.RadToDeg(facing) + 90,
    });
    escapeThruster.setDepth(11);
    escapeThruster.startFollow(escape, 0, ROCKET_ESCAPE_TEXTURE_HEIGHT * 0.35, true);

    this.scene.time.delayedCall(400, () => {
      escapeThruster.stop();
      escapeThruster.destroy();
    });

    this.scene.time.delayedCall(80, () => {
      lower.destroy();
    });

    return { explosionX: lowerPos.x, explosionY: lowerPos.y };
  }

  updateThruster(_time: number, _delta: number): void {
    if (this.electricRainbowSkin) {
      this.updateRainbowShip();
    }
    this.updateCannonVisual();

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
    if (this.shielded && this.shieldGlow) {
      this.drawShieldGlow();
    }
    if (this.boosting && this.boostGlow) {
      this.drawBoostGlow();
    }
  }

  canFire(time: number): boolean {
    return time > this.lastFired + this.loadout.fireCooldownMs;
  }

  consumeFire(time: number): void {
    this.lastFired = time;
  }

  getBulletSpawnPoint(): { x: number; y: number } {
    // Muzzle sits above the cannon in screen space (always fires toward top of screen).
    this.getWorldTransformMatrix(this.worldMatrix);
    this.worldMatrix.transformPoint(0, ROCKET_CANNON_OFFSET_Y, this.cannonWorldPos);
    return { x: this.cannonWorldPos.x, y: this.cannonWorldPos.y - 10 };
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

  private startShieldGlow(): void {
    this.stopShieldGlow();
    this.shieldGlow = this.scene.add.graphics();
    this.shieldGlow.setDepth(9);
    this.drawShieldGlow();
  }

  private stopShieldGlow(): void {
    this.shieldGlow?.destroy();
    this.shieldGlow = undefined;
  }

  private drawShieldGlow(): void {
    if (!this.shieldGlow) return;
    this.shieldGlow.clear();
    this.shieldGlow.setPosition(this.x, this.y);
    this.shieldGlow.lineStyle(3, 0x44ddff, 0.85);
    this.shieldGlow.strokeCircle(0, 0, 30);
    this.shieldGlow.lineStyle(2, 0x88eeff, 0.45);
    this.shieldGlow.strokeCircle(0, 0, 34);
  }

  private startBoostGlow(): void {
    this.stopBoostGlow();
    this.boostGlow = this.scene.add.graphics();
    this.boostGlow.setDepth(9);
    this.drawBoostGlow();
  }

  private stopBoostGlow(): void {
    this.boostGlow?.destroy();
    this.boostGlow = undefined;
  }

  private drawBoostGlow(): void {
    if (!this.boostGlow) return;
    this.boostGlow.clear();
    this.boostGlow.setPosition(this.x, this.y);
    this.boostGlow.fillStyle(0xffaa00, 0.12);
    this.boostGlow.fillCircle(0, 0, 34);
    this.boostGlow.lineStyle(2, 0xffcc44, 0.75);
    this.boostGlow.strokeCircle(0, 0, 28);
  }

  destroy(fromScene?: boolean): void {
    this.deactivateInvincibility();
    this.deactivateShield(false);
    this.deactivateInvisibility();
    this.deactivateBoostMode(false);
    this.clearMercyInvincibility();
    this.thruster?.destroy();
    this.smokeTrail?.destroy();
    this.rainbowShipGfx?.destroy();
    this.cannon?.destroy();
    super.destroy(fromScene);
  }
}
