import Phaser from 'phaser';
import {
  initAudio,
  preloadRocketEngineSfx,
  startRocketEngineSfx,
  stopRocketEngineSfx,
} from '../audioManager';
import {
  BOOSTER_DEPLOYED_TEXTURE_KEY,
  BOOSTER_TEXTURE_HEIGHT,
  BOOSTER_TEXTURE_KEY,
} from '../boosterAppearances';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { normalizeGameSceneData, type GameSceneData } from '../gameMode';
import { getEquippedSkinId, PLAYER_SKINS } from '../playerSkins';
import {
  drawAssembledRocket,
  drawElectricRainbowRocket,
  getRainbowCyclePhase,
  getRocketSkinPalette,
  ROCKET_TEXTURE_HEIGHT,
  ROCKET_TEXTURE_WIDTH,
  sampleRainbowColor,
} from '../rocketAppearances';

const COUNTDOWN_SECONDS = 12;
const IGNITION_AT_SECONDS = 5;
const STACK_SCALE = 1.35;
/** Scaled px of ship/booster overlap so the interstage sleeves over the twin engines. */
const STACK_OVERLAP_PX = 24;

/** Slow climb from pad to mid-screen (longer = less snap). */
const CLIMB_TO_MID_MS = 10000;
/** How far ground must scroll before Earth is considered gone. */
const GROUND_GONE_OFFSET = GAME_HEIGHT - 90;
/** Climb progress (0–1) when clouds begin after leaving the pad. */
const CLOUDS_START_PROGRESS = 0.08;
/** Climb progress when clouds start thinning with altitude. */
const CLOUD_FADE_START_PROGRESS = 0.4;
/** Climb progress when the cloud layer is fully gone. */
const CLOUD_FADE_END_PROGRESS = 0.92;
const CLOUD_SPAWN_INTERVAL_MS = 520;
/** Time for sky to go from day blue to fully dark. */
const SKY_DARKEN_MS = 2800;
/** Slow booster fall speed (px/s). */
const BOOSTER_FALL_SPEED = 95;
const SHIP_DEPART_SPEED = 320;
const FADE_OUT_MS = 500;

type CutscenePhase =
  | 'countdown'
  | 'ascent'
  | 'skyDarken'
  | 'boosterFall'
  | 'shipDepart'
  | 'done';

interface CloudSprite {
  gfx: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  speed: number;
  baseAlpha: number;
}

export class LaunchCutsceneScene extends Phaser.Scene {
  private sceneData: GameSceneData = {};
  private phase: CutscenePhase = 'countdown';
  private finished = false;

  private countdownRemaining = COUNTDOWN_SECONDS;
  private countdownText?: Phaser.GameObjects.Text;
  private skipHitArea?: Phaser.GameObjects.Rectangle;

  private skyGfx?: Phaser.GameObjects.Graphics;
  private groundGfx?: Phaser.GameObjects.Graphics;
  private moon?: Phaser.GameObjects.Arc;
  private moonCraters: Phaser.GameObjects.Arc[] = [];
  private padGfx?: Phaser.GameObjects.Graphics;
  private stars: Phaser.GameObjects.Image[] = [];
  private starBaseAlphas: number[] = [];

  private stack?: Phaser.GameObjects.Container;
  private shipGfx?: Phaser.GameObjects.Graphics;
  private booster?: Phaser.GameObjects.Image;
  private shipWingsDeployed = false;
  private electricRainbow = false;

  private boosterExhaust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private shipExhaust?: Phaser.GameObjects.Particles.ParticleEmitter;

  private clouds: CloudSprite[] = [];
  private skyDarkness = 0;
  private groundOffset = 0;
  private ignitionStarted = false;
  private earthGone = false;
  private keys?: {
    enter: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private phaseElapsed = 0;
  private stackStartY = 0;
  private stackMidY = 0;
  private cloudSpawnTimer = 0;
  private cloudLayerAlpha = 0;
  private cloudsStarted = false;

  constructor() {
    super({ key: 'LaunchCutsceneScene' });
  }

  init(data: GameSceneData): void {
    this.sceneData = normalizeGameSceneData(data);
  }

  create(): void {
    this.finished = false;
    this.phase = 'countdown';
    this.countdownRemaining = COUNTDOWN_SECONDS;
    this.skyDarkness = 0;
    this.groundOffset = 0;
    this.ignitionStarted = false;
    this.earthGone = false;
    this.shipWingsDeployed = false;
    this.phaseElapsed = 0;
    this.clouds = [];
    this.cloudSpawnTimer = 0;
    this.cloudLayerAlpha = 0;
    this.cloudsStarted = false;
    this.moonCraters = [];
    this.stars = [];
    this.starBaseAlphas = [];

    void initAudio();
    preloadRocketEngineSfx();

    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.createEnvironment();
    this.createStack();
    this.createUi();
    this.bindSkipInput();

    this.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_SECONDS - 1,
      callback: () => this.tickCountdown(),
    });
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;

    if (this.keys && (Phaser.Input.Keyboard.JustDown(this.keys.enter)
      || Phaser.Input.Keyboard.JustDown(this.keys.space))) {
      this.finishCutscene();
      return;
    }

    if (this.electricRainbow && this.shipGfx && this.phase !== 'done') {
      this.redrawShip();
    }

    const boosterFiring =
      this.ignitionStarted
      && (this.phase === 'countdown'
        || this.phase === 'ascent'
        || this.phase === 'skyDarken');

    if (boosterFiring && this.boosterExhaust && this.stack) {
      this.positionBoosterExhaust();
      this.boosterExhaust.emitParticle();
      this.boosterExhaust.emitParticle();
      if (this.phase !== 'countdown') {
        this.boosterExhaust.emitParticle();
      }
    }

    if (this.phase === 'ascent') {
      this.updateAscent(delta);
    } else if (this.phase === 'skyDarken') {
      this.updateSkyDarken(delta);
    } else if (this.phase === 'boosterFall') {
      this.updateBoosterFall(delta);
    } else if (this.phase === 'shipDepart') {
      this.updateShipDepart(delta);
    }

    this.updateCloudMotion(delta);
    this.redrawSky();
  }

  private createEnvironment(): void {
    this.skyGfx = this.add.graphics().setDepth(0);
    this.redrawSky();

    this.createStars();

    this.moon = this.add.circle(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.14, 22, 0xe8e8f0, 1);
    this.moon.setDepth(2);
    this.moonCraters = [
      this.add.circle(GAME_WIDTH * 0.78 - 6, GAME_HEIGHT * 0.13, 5, 0xd0d0d8, 0.55).setDepth(2),
      this.add.circle(GAME_WIDTH * 0.78 + 5, GAME_HEIGHT * 0.15, 3.5, 0xd0d0d8, 0.4).setDepth(2),
    ];

    this.groundGfx = this.add.graphics().setDepth(3);
    this.padGfx = this.add.graphics().setDepth(4);
    this.redrawGroundAndPad();
  }

  private createStars(): void {
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setTint(0xffffff);
      const baseAlpha = Phaser.Math.FloatBetween(0.35, 0.95);
      star.setAlpha(0);
      star.setScale(Phaser.Math.FloatBetween(0.5, 2));
      star.setDepth(1);
      this.stars.push(star);
      this.starBaseAlphas.push(baseAlpha);
    }
  }

  private updateStarVisibility(): void {
    // Stars fade in with sky darkening; fully visible once sky is completely dark.
    const visibility = Phaser.Math.Clamp(this.skyDarkness, 0, 1);
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].setAlpha(this.starBaseAlphas[i] * visibility);
    }
  }

  private redrawSky(): void {
    if (!this.skyGfx) return;
    this.skyGfx.clear();

    const t = Phaser.Math.Clamp(this.skyDarkness, 0, 1);
    const top = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x4aa3ff),
      Phaser.Display.Color.ValueToColor(0x02040c),
      100,
      Math.floor(t * 100),
    );
    const mid = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x87c6ff),
      Phaser.Display.Color.ValueToColor(0x0a1028),
      100,
      Math.floor(t * 100),
    );
    const bot = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xb8ddff),
      Phaser.Display.Color.ValueToColor(0x12182a),
      100,
      Math.floor(t * 100),
    );

    const bands = 24;
    for (let i = 0; i < bands; i++) {
      const u = i / (bands - 1);
      const from = u < 0.5 ? top : mid;
      const to = u < 0.5 ? mid : bot;
      const frac = u < 0.5 ? u * 2 : (u - 0.5) * 2;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(Phaser.Display.Color.GetColor(from.r, from.g, from.b)),
        Phaser.Display.Color.ValueToColor(Phaser.Display.Color.GetColor(to.r, to.g, to.b)),
        100,
        Math.floor(frac * 100),
      );
      const color = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      const y = (GAME_HEIGHT / bands) * i;
      this.skyGfx.fillStyle(color, 1);
      this.skyGfx.fillRect(0, y, GAME_WIDTH, GAME_HEIGHT / bands + 1);
    }

    const moonAlpha = 1 - t * 0.35;
    if (this.moon) this.moon.setAlpha(moonAlpha);
    if (this.moonCraters[0]) this.moonCraters[0].setAlpha(0.55 * moonAlpha);
    if (this.moonCraters[1]) this.moonCraters[1].setAlpha(0.4 * moonAlpha);

    this.updateStarVisibility();
  }

  private redrawGroundAndPad(): void {
    if (!this.groundGfx || !this.padGfx) return;
    this.groundGfx.clear();
    this.padGfx.clear();

    // Once Earth is gone (or the surface has left the screen), hide ground and pad towers.
    if (this.earthGone) return;

    const groundY = GAME_HEIGHT - 110 + this.groundOffset;
    if (groundY >= GAME_HEIGHT) {
      // Surface off-screen — clear towers so they cannot poke into the sky.
      return;
    }

    this.groundGfx.fillStyle(0x3a8f3a, 1);
    this.groundGfx.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY + 20);
    this.groundGfx.fillStyle(0x2f7a2f, 1);
    this.groundGfx.fillEllipse(GAME_WIDTH * 0.3, groundY + 10, 90, 24);
    this.groundGfx.fillEllipse(GAME_WIDTH * 0.7, groundY + 18, 110, 28);
    this.groundGfx.fillStyle(0x4aaa4a, 1);
    this.groundGfx.fillEllipse(GAME_WIDTH * 0.5, groundY + 6, 70, 16);

    const padX = GAME_WIDTH / 2;
    const padTop = groundY - 8;
    this.padGfx.fillStyle(0x555560, 1);
    this.padGfx.fillRect(padX - 48, padTop, 96, 14);
    this.padGfx.fillStyle(0x3a3a44, 1);
    this.padGfx.fillRect(padX - 36, padTop - 6, 72, 8);
    this.padGfx.fillStyle(0x888892, 1);
    this.padGfx.fillRect(padX - 6, padTop - 50, 4, 50);
    this.padGfx.fillRect(padX + 20, padTop - 40, 3, 40);
  }

  private createStack(): void {
    const equippedId = getEquippedSkinId();
    const skin = PLAYER_SKINS.find((s) => s.id === equippedId) ?? PLAYER_SKINS[0];
    this.electricRainbow = skin.appearanceId === 'electricRainbow';

    const shipH = ROCKET_TEXTURE_HEIGHT * STACK_SCALE;
    const boosterH = BOOSTER_TEXTURE_HEIGHT * STACK_SCALE;
    const stackH = shipH + boosterH - STACK_OVERLAP_PX;

    const groundY = GAME_HEIGHT - 110;
    const stackBottom = groundY - 8;
    this.stackStartY = stackBottom - stackH / 2;
    this.stackMidY = GAME_HEIGHT / 2;

    this.stack = this.add.container(GAME_WIDTH / 2, this.stackStartY);
    this.stack.setDepth(10);

    this.shipGfx = this.add.graphics();
    this.redrawShip();
    this.shipGfx.setPosition(0, -boosterH / 2 + STACK_OVERLAP_PX / 2);
    this.shipGfx.setScale(STACK_SCALE);

    // Booster on top of ship so the interstage visually covers the twin engines.
    this.booster = this.add.image(0, shipH / 2 - STACK_OVERLAP_PX / 2, BOOSTER_TEXTURE_KEY);
    this.booster.setScale(STACK_SCALE);

    this.stack.add([this.shipGfx, this.booster]);

    this.boosterExhaust = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 180 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 420,
      tint: [0xff6b35, 0xffcc00, 0xffaa44, 0xffffff],
      frequency: -1,
      angle: { min: 75, max: 105 },
    });
    this.boosterExhaust.setDepth(9);

    this.shipExhaust = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 120 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      tint: [0xff6b35, 0xffcc00, 0x66ccff],
      frequency: -1,
      angle: { min: 80, max: 100 },
    });
    this.shipExhaust.setDepth(11);
  }

  private redrawShip(): void {
    if (!this.shipGfx) return;
    this.shipGfx.clear();

    const ox = -ROCKET_TEXTURE_WIDTH / 2;
    const oy = -ROCKET_TEXTURE_HEIGHT / 2;
    const opts = {
      includeCannon: true,
      lowerWingsDeployed: this.shipWingsDeployed,
    };

    if (this.electricRainbow) {
      const phase = getRainbowCyclePhase(this.time.now);
      drawElectricRainbowRocket(
        this.shipGfx,
        sampleRainbowColor(phase),
        sampleRainbowColor(phase),
        ox,
        oy,
        opts,
      );
      return;
    }

    const skin = PLAYER_SKINS.find((s) => s.id === getEquippedSkinId()) ?? PLAYER_SKINS[0];
    drawAssembledRocket(
      this.shipGfx,
      getRocketSkinPalette(skin.appearanceId),
      ox,
      oy,
      opts,
    );
  }

  private createUi(): void {
    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, String(COUNTDOWN_SECONDS), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '72px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#003366',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50);

    this.add.text(GAME_WIDTH - 16, 18, 'SKIP', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      fontStyle: '700',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(50).setAlpha(0.85);

    this.skipHitArea = this.add.rectangle(GAME_WIDTH - 48, 28, 72, 36, 0x000000, 0.01)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    this.skipHitArea.on('pointerup', () => this.finishCutscene());
  }

  private bindSkipInput(): void {
    if (!this.input.keyboard) return;
    this.keys = {
      enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  private tickCountdown(): void {
    if (this.finished || this.phase !== 'countdown') return;

    this.countdownRemaining -= 1;
    if (this.countdownText) {
      this.countdownText.setText(
        this.countdownRemaining > 0 ? String(this.countdownRemaining) : 'LIFTOFF',
      );
    }

    if (this.countdownRemaining === IGNITION_AT_SECONDS && !this.ignitionStarted) {
      this.startIgnition();
    }

    if (this.countdownRemaining <= 0) {
      this.beginClimbToMid();
    }
  }

  private startIgnition(): void {
    this.ignitionStarted = true;
    startRocketEngineSfx();
    this.positionBoosterExhaust();
  }

  private positionBoosterExhaust(): void {
    if (!this.stack || !this.boosterExhaust || !this.booster) return;
    const boosterH = BOOSTER_TEXTURE_HEIGHT * STACK_SCALE;
    this.boosterExhaust.setPosition(
      this.stack.x,
      this.stack.y + this.booster.y + boosterH / 2 - 4,
    );
  }

  private beginClimbToMid(): void {
    if (this.phase !== 'countdown') return;
    this.phase = 'ascent';
    this.phaseElapsed = 0;
    this.cloudsStarted = false;
    this.cloudLayerAlpha = 0;
    this.cloudSpawnTimer = 0;
    this.countdownText?.setVisible(false);

    if (!this.ignitionStarted) {
      this.startIgnition();
    }
  }

  /**
   * Slow climb to mid-screen. Clouds appear after leaving the pad and thin out
   * with altitude; sky darkens only after the cloud layer has faded.
   */
  private updateAscent(delta: number): void {
    if (!this.stack) return;
    this.phaseElapsed += delta;
    const t = Phaser.Math.Clamp(this.phaseElapsed / CLIMB_TO_MID_MS, 0, 1);
    // Ease-out: starts gently from the pad, never snaps to mid.
    const ease = 1 - (1 - t) * (1 - t);

    this.stack.y = Phaser.Math.Linear(this.stackStartY, this.stackMidY, ease);

    this.groundOffset = Phaser.Math.Linear(0, GROUND_GONE_OFFSET + 60, ease);
    this.redrawGroundAndPad();

    const groundY = GAME_HEIGHT - 110 + this.groundOffset;
    if (!this.earthGone && groundY >= GAME_HEIGHT) {
      this.earthGone = true;
      this.redrawGroundAndPad();
    }

    if (t < 0.15) {
      this.cameras.main.setScroll(
        Phaser.Math.FloatBetween(-1.0, 1.0),
        Phaser.Math.FloatBetween(-1.0, 1.0),
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }

    // Clouds after leaving the launchpad
    if (!this.cloudsStarted && t >= CLOUDS_START_PROGRESS) {
      this.cloudsStarted = true;
      this.cloudLayerAlpha = 1;
      this.cloudSpawnTimer = CLOUD_SPAWN_INTERVAL_MS;
    }

    if (this.cloudsStarted) {
      // Thinner clouds the higher you go
      if (t <= CLOUD_FADE_START_PROGRESS) {
        this.cloudLayerAlpha = 1;
      } else if (t >= CLOUD_FADE_END_PROGRESS) {
        this.cloudLayerAlpha = 0;
      } else {
        const fadeT = (t - CLOUD_FADE_START_PROGRESS)
          / (CLOUD_FADE_END_PROGRESS - CLOUD_FADE_START_PROGRESS);
        this.cloudLayerAlpha = 1 - fadeT;
      }

      // Keep spawning while the layer is still visible
      if (this.cloudLayerAlpha > 0.05) {
        this.cloudSpawnTimer += delta;
        if (this.cloudSpawnTimer >= CLOUD_SPAWN_INTERVAL_MS) {
          this.cloudSpawnTimer = 0;
          this.spawnCloud();
        }
      }

      this.applyCloudLayerAlpha();
    }

    // At mid-screen with clouds fully faded → darken sky
    if (t >= 1 && this.cloudLayerAlpha <= 0.01) {
      this.clearClouds();
      this.beginSkyDarken();
    }
  }

  private beginSkyDarken(): void {
    if (this.phase !== 'ascent') return;
    this.phase = 'skyDarken';
    this.phaseElapsed = 0;
    this.skyDarkness = 0;
    this.cameras.main.setScroll(0, 0);
    if (this.stack) {
      this.stack.y = this.stackMidY;
    }
  }

  private updateSkyDarken(delta: number): void {
    this.phaseElapsed += delta;
    this.skyDarkness = Phaser.Math.Clamp(this.phaseElapsed / SKY_DARKEN_MS, 0, 1);

    if (this.skyDarkness >= 1) {
      this.beginSeparation();
    }
  }

  private beginSeparation(): void {
    if (this.phase !== 'skyDarken') return;
    this.phase = 'boosterFall';
    this.phaseElapsed = 0;
    this.cameras.main.setScroll(0, 0);

    stopRocketEngineSfx();

    this.shipWingsDeployed = true;
    this.redrawShip();

    if (this.booster) {
      this.booster.setTexture(BOOSTER_DEPLOYED_TEXTURE_KEY);
    }

    if (this.stack && this.booster) {
      const worldX = this.stack.x + this.booster.x;
      const worldY = this.stack.y + this.booster.y;
      this.stack.remove(this.booster);
      this.booster.setPosition(worldX, worldY);
      this.booster.setDepth(8);
    }
  }

  private updateBoosterFall(delta: number): void {
    this.phaseElapsed += delta;
    if (this.booster) {
      // Slow fall
      this.booster.y += BOOSTER_FALL_SPEED * (delta / 1000);
      this.booster.x += Math.sin(this.phaseElapsed / 400) * 0.25;
      this.booster.rotation += 0.003 * (delta / 16);
    }

    if (this.booster && this.booster.y > GAME_HEIGHT + 80) {
      this.booster.destroy();
      this.booster = undefined;
      this.beginShipDepart();
    }
  }

  private beginShipDepart(): void {
    if (this.phase === 'shipDepart' || this.phase === 'done') return;
    this.phase = 'shipDepart';
    this.phaseElapsed = 0;
    startRocketEngineSfx();
  }

  private updateShipDepart(delta: number): void {
    if (!this.stack || !this.shipGfx) return;
    this.phaseElapsed += delta;

    this.stack.y -= SHIP_DEPART_SPEED * (delta / 1000);
    const exhaustY = this.stack.y + this.shipGfx.y + (ROCKET_TEXTURE_HEIGHT * STACK_SCALE) / 2 - 4;
    this.shipExhaust?.setPosition(this.stack.x, exhaustY);
    this.shipExhaust?.emitParticle();
    this.shipExhaust?.emitParticle();

    if (this.stack.y < -100) {
      this.finishCutscene();
    }
  }

  private spawnCloud(): void {
    const w = Phaser.Math.Between(50, 100);
    const h = Phaser.Math.Between(18, 32);
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const y = -30;
    const baseAlpha = Phaser.Math.FloatBetween(0.55, 0.85);
    const gfx = this.add.graphics().setDepth(5);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillEllipse(0, 0, w, h);
    gfx.fillEllipse(-w * 0.25, 4, w * 0.55, h * 0.7);
    gfx.fillEllipse(w * 0.28, 2, w * 0.5, h * 0.65);
    gfx.setPosition(x, y);
    gfx.setAlpha(baseAlpha * this.cloudLayerAlpha);
    this.clouds.push({
      gfx,
      x,
      y,
      speed: Phaser.Math.Between(110, 180),
      baseAlpha,
    });
  }

  private applyCloudLayerAlpha(): void {
    for (const c of this.clouds) {
      c.gfx.setAlpha(c.baseAlpha * this.cloudLayerAlpha);
    }
  }

  private clearClouds(): void {
    for (const c of this.clouds) {
      c.gfx.destroy();
    }
    this.clouds = [];
  }

  private updateCloudMotion(delta: number): void {
    if (this.phase !== 'ascent') return;

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.y += c.speed * (delta / 1000);
      c.gfx.setPosition(c.x, c.y);
      c.gfx.setAlpha(c.baseAlpha * this.cloudLayerAlpha);
      if (c.y > GAME_HEIGHT + 40 || this.cloudLayerAlpha <= 0.01) {
        c.gfx.destroy();
        this.clouds.splice(i, 1);
      }
    }
  }

  private finishCutscene(): void {
    if (this.finished) return;
    this.finished = true;
    this.phase = 'done';

    stopRocketEngineSfx();
    this.cameras.main.setScroll(0, 0);

    this.cameras.main.fadeOut(FADE_OUT_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      stopRocketEngineSfx();
      this.scene.start('GameScene', this.sceneData);
    });
  }
}
