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
const ASCENT_DURATION_MS = 5500;
const BOOSTER_FALL_DURATION_MS = 1800;
const SHIP_DEPART_DURATION_MS = 1400;
const FADE_OUT_MS = 500;

type CutscenePhase =
  | 'countdown'
  | 'ascent'
  | 'separation'
  | 'boosterFall'
  | 'shipDepart'
  | 'done';

interface CloudSprite {
  gfx: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  speed: number;
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
  private padGfx?: Phaser.GameObjects.Graphics;

  private stack?: Phaser.GameObjects.Container;
  private shipGfx?: Phaser.GameObjects.Graphics;
  private booster?: Phaser.GameObjects.Image;
  private shipWingsDeployed = false;
  private electricRainbow = false;

  private boosterExhaust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private shipExhaust?: Phaser.GameObjects.Particles.ParticleEmitter;

  private clouds: CloudSprite[] = [];
  private altitude = 0;
  private groundOffset = 0;
  private ignitionStarted = false;
  private keys?: {
    enter: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private ascentElapsed = 0;
  private phaseElapsed = 0;
  private stackStartY = 0;

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
    this.altitude = 0;
    this.groundOffset = 0;
    this.ignitionStarted = false;
    this.shipWingsDeployed = false;
    this.ascentElapsed = 0;
    this.phaseElapsed = 0;
    this.clouds = [];

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

    if (this.phase === 'countdown' && this.ignitionStarted && this.boosterExhaust && this.stack) {
      this.positionBoosterExhaust();
      this.boosterExhaust.emitParticle();
      this.boosterExhaust.emitParticle();
    }

    if (this.phase === 'ascent') {
      this.updateAscent(delta);
    } else if (this.phase === 'boosterFall') {
      this.updateBoosterFall(delta);
    } else if (this.phase === 'shipDepart') {
      this.updateShipDepart(delta);
    }

    this.updateClouds(delta);
    this.redrawSky();
  }

  private createEnvironment(): void {
    this.skyGfx = this.add.graphics().setDepth(0);
    this.redrawSky();

    this.moon = this.add.circle(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.14, 22, 0xe8e8f0, 1);
    this.moon.setDepth(1);
    this.add.circle(GAME_WIDTH * 0.78 - 6, GAME_HEIGHT * 0.13, 5, 0xd0d0d8, 0.55).setDepth(1);
    this.add.circle(GAME_WIDTH * 0.78 + 5, GAME_HEIGHT * 0.15, 3.5, 0xd0d0d8, 0.4).setDepth(1);

    this.groundGfx = this.add.graphics().setDepth(2);
    this.padGfx = this.add.graphics().setDepth(3);
    this.redrawGroundAndPad();
  }

  private redrawSky(): void {
    if (!this.skyGfx) return;
    this.skyGfx.clear();

    const t = Phaser.Math.Clamp(this.altitude, 0, 1);
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

    if (this.moon) {
      this.moon.setAlpha(1 - t * 0.35);
    }
  }

  private redrawGroundAndPad(): void {
    if (!this.groundGfx || !this.padGfx) return;
    this.groundGfx.clear();
    this.padGfx.clear();

    const groundY = GAME_HEIGHT - 110 + this.groundOffset;
    if (groundY > GAME_HEIGHT + 40) return;

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
    const stackH = shipH + boosterH - 10;

    const groundY = GAME_HEIGHT - 110;
    const stackBottom = groundY - 8;
    this.stackStartY = stackBottom - stackH / 2;

    this.stack = this.add.container(GAME_WIDTH / 2, this.stackStartY);
    this.stack.setDepth(10);

    this.booster = this.add.image(0, shipH / 2 - 4, BOOSTER_TEXTURE_KEY);
    this.booster.setScale(STACK_SCALE);

    this.shipGfx = this.add.graphics();
    this.redrawShip();
    this.shipGfx.setPosition(0, -boosterH / 2 - 2);
    this.shipGfx.setScale(STACK_SCALE);

    this.stack.add([this.booster, this.shipGfx]);

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
      this.beginAscent();
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

  private beginAscent(): void {
    if (this.phase !== 'countdown') return;
    this.phase = 'ascent';
    this.ascentElapsed = 0;
    this.countdownText?.setVisible(false);

    if (!this.ignitionStarted) {
      this.startIgnition();
    }

    this.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => {
        if (this.phase === 'ascent' && this.altitude > 0.08 && this.altitude < 0.85) {
          this.spawnCloud();
        }
      },
    });
  }

  private updateAscent(delta: number): void {
    if (!this.stack) return;
    this.ascentElapsed += delta;
    const t = Phaser.Math.Clamp(this.ascentElapsed / ASCENT_DURATION_MS, 0, 1);
    const ease = t * t;
    this.altitude = ease;

    this.stack.y = this.stackStartY - ease * (GAME_HEIGHT * 0.55);

    this.groundOffset = ease * 220;
    this.redrawGroundAndPad();
    this.positionBoosterExhaust();
    this.boosterExhaust?.emitParticle();
    this.boosterExhaust?.emitParticle();
    this.boosterExhaust?.emitParticle();

    if (t < 0.25) {
      this.cameras.main.setScroll(
        Phaser.Math.FloatBetween(-1.5, 1.5),
        Phaser.Math.FloatBetween(-1.5, 1.5),
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }

    if (t >= 1) {
      this.beginSeparation();
    }
  }

  private beginSeparation(): void {
    if (this.phase !== 'ascent') return;
    this.phase = 'separation';
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

    this.phase = 'boosterFall';
    this.phaseElapsed = 0;
  }

  private updateBoosterFall(delta: number): void {
    this.phaseElapsed += delta;
    if (this.booster) {
      this.booster.y += (220 + this.phaseElapsed * 0.35) * (delta / 1000);
      this.booster.x += Math.sin(this.phaseElapsed / 180) * 0.4;
      this.booster.rotation += 0.008 * (delta / 16);
    }

    if (
      (this.booster && this.booster.y > GAME_HEIGHT + 80)
      || this.phaseElapsed >= BOOSTER_FALL_DURATION_MS
    ) {
      this.booster?.destroy();
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

    this.stack.y -= 380 * (delta / 1000);
    const exhaustY = this.stack.y + this.shipGfx.y + (ROCKET_TEXTURE_HEIGHT * STACK_SCALE) / 2 - 4;
    this.shipExhaust?.setPosition(this.stack.x, exhaustY);
    this.shipExhaust?.emitParticle();
    this.shipExhaust?.emitParticle();

    if (this.phaseElapsed >= SHIP_DEPART_DURATION_MS || this.stack.y < -80) {
      this.finishCutscene();
    }
  }

  private spawnCloud(): void {
    const w = Phaser.Math.Between(50, 100);
    const h = Phaser.Math.Between(18, 32);
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const y = -20;
    const gfx = this.add.graphics().setDepth(5);
    gfx.fillStyle(0xffffff, 0.55);
    gfx.fillEllipse(0, 0, w, h);
    gfx.fillEllipse(-w * 0.25, 4, w * 0.55, h * 0.7);
    gfx.fillEllipse(w * 0.28, 2, w * 0.5, h * 0.65);
    gfx.setPosition(x, y);
    this.clouds.push({
      gfx,
      x,
      y,
      speed: Phaser.Math.Between(180, 320),
    });
  }

  private updateClouds(delta: number): void {
    if (
      this.phase !== 'ascent'
      && this.phase !== 'separation'
      && this.phase !== 'boosterFall'
      && this.phase !== 'shipDepart'
    ) {
      return;
    }
    const scroll = this.phase === 'ascent' ? 1 : 0.35;
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.y += c.speed * scroll * (delta / 1000);
      c.gfx.setPosition(c.x, c.y);
      c.gfx.setAlpha(0.55 * (1 - Phaser.Math.Clamp(this.altitude, 0, 1)));
      if (c.y > GAME_HEIGHT + 40) {
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
