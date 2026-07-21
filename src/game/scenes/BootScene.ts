import Phaser from 'phaser';
import { BOSS_DEFINITIONS as WORLD1_BOSSES } from '../world1/bosses';
import { drawBossAppearance as drawWorld1Boss, getBossAppearancePalette as getWorld1BossPalette } from '../world1/bossAppearances';
import { STORY_ENEMY_DEFINITIONS as WORLD1_STORY_ENEMIES } from '../world1/storyEnemyDefinitions';
import { drawStoryEnemyAppearance as drawWorld1StoryEnemy, getStoryEnemyAppearancePalette as getWorld1StoryEnemyPalette } from '../world1/storyEnemyAppearances';
import { BOSS_DEFINITIONS as WORLD2_BOSSES } from '../world2/bosses';
import { drawBossAppearance as drawWorld2Boss, getBossAppearancePalette as getWorld2BossPalette } from '../world2/bossAppearances';
import { STORY_ENEMY_DEFINITIONS as WORLD2_STORY_ENEMIES } from '../world2/storyEnemyDefinitions';
import { drawStoryEnemyAppearance as drawWorld2StoryEnemy, getStoryEnemyAppearancePalette as getWorld2StoryEnemyPalette } from '../world2/storyEnemyAppearances';
import { BOSS_DEFINITIONS as WORLD3_BOSSES } from '../world3/bosses';
import { drawBossAppearance as drawWorld3Boss, getBossAppearancePalette as getWorld3BossPalette } from '../world3/bossAppearances';
import { STORY_ENEMY_DEFINITIONS as WORLD3_STORY_ENEMIES } from '../world3/storyEnemyDefinitions';
import { drawStoryEnemyAppearance as drawWorld3StoryEnemy, getStoryEnemyAppearancePalette as getWorld3StoryEnemyPalette } from '../world3/storyEnemyAppearances';
import { PLAYER_SKINS } from '../playerSkins';
import { drawRocketSkin } from '../rocketAppearances';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('shop-skins-tab-icon', '/assets/shop-skins-tab.png');
    this.load.image('shop-powerups-tab-icon', '/assets/shop-powerups-tab.png');
  }

  create(): void {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    this.createRocketSkinTextures();
    this.createBulletTexture();
    this.createAsteroidTextures();
    this.createStarTexture();
    this.createParticleTexture();
    this.createSmokeParticleTexture();
    this.createHeartTexture();
    this.createPowerStarTexture();
    this.createSpiderShipTexture();
    this.createEnemyLaserTexture();
    this.createBossSpecialLaserTexture();
    this.createLootBoxTexture();
    this.createHeavyBulletTexture();
    this.createSeekerDroneTexture();
    this.createKamikazeWaspTexture();
    this.createPlasmaTurretTexture();
    this.createBossShipTextures();
    this.createStoryEnemyTextures();
    this.createWormholeTexture();
    this.createWarpPanelTexture();
    this.createCometTextures();
    this.createPowerUpPickupTextures();
  }

  private createRocketSkinTextures(): void {
    for (const skin of PLAYER_SKINS) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      drawRocketSkin(g, skin.appearanceId);
      g.generateTexture(skin.textureKey, 32, 52);
      g.destroy();
    }
  }

  private createBulletTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x00ffcc);
    g.fillRoundedRect(0, 0, 6, 16, 3);
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(1, 2, 4, 6, 2);
    g.generateTexture('bullet', 6, 16);
    g.destroy();
  }

  private createAsteroidTextures(): void {
    const sizes = [
      { key: 'asteroid-lg', goldKey: 'asteroid-gold-lg', radius: 28, color: 0x8b7355, goldColor: 0xffcc00 },
      { key: 'asteroid-md', goldKey: 'asteroid-gold-md', radius: 20, color: 0xa0886a, goldColor: 0xffcc00 },
      { key: 'asteroid-sm', goldKey: 'asteroid-gold-sm', radius: 12, color: 0xb89b7a, goldColor: 0xffcc00 },
    ];

    for (const { key, goldKey, radius, color, goldColor } of sizes) {
      const size = radius * 2 + 4;
      const cx = size / 2;
      const cy = size / 2;
      const points = 8;
      const radii: number[] = [];
      for (let i = 0; i < points; i++) {
        radii.push(radius * (0.75 + Math.random() * 0.35));
      }

      const drawAsteroid = (textureKey: string, fillColor: number, highlightColor: number) => {
        const g = this.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(fillColor);
        g.beginPath();
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const r = radii[i];
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();
        g.fillPath();
        g.fillStyle(highlightColor, 0.45);
        g.fillCircle(cx - radius * 0.15, cy - radius * 0.12, radius * 0.22);
        g.fillStyle(0x000000, 0.2);
        g.fillCircle(cx - radius * 0.2, cy - radius * 0.15, radius * 0.18);
        g.generateTexture(textureKey, size, size);
        g.destroy();
      };

      drawAsteroid(key, color, 0x000000);
      drawAsteroid(goldKey, goldColor, 0xffee88);
    }
  }

  private createStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    g.destroy();
  }

  private createParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  private createSmokeParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 0.1);
    g.fillEllipse(28, 12, 52, 22);
    g.fillStyle(0xffffff, 0.22);
    g.fillEllipse(28, 12, 38, 16);
    g.fillStyle(0xffffff, 0.38);
    g.fillEllipse(28, 12, 24, 10);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(28, 12, 12, 5);
    g.generateTexture('smoke-particle', 56, 24);
    g.destroy();
  }

  private createHeartTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 12;
    const cy = 11;
    g.fillStyle(0xff4466);
    g.fillCircle(cx - 5, cy - 2, 6);
    g.fillCircle(cx + 5, cy - 2, 6);
    g.fillTriangle(cx - 11, cy, cx + 11, cy, cx, cy + 12);
    g.fillStyle(0xff8899, 0.6);
    g.fillCircle(cx - 3, cy - 4, 2);
    g.generateTexture('heart', 24, 24);
    g.destroy();
  }

  private createPowerStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 12;
    const cy = 12;
    const outer = 10;
    const inner = 4;

    g.fillStyle(0xffcc00, 1);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 2, cy - 3, 2);
    g.generateTexture('power-star', 24, 24);
    g.destroy();
  }

  private createSpiderShipTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 18;
    const cy = 18;

    g.lineStyle(3, 0x661111, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const legLen = 14;
      g.lineBetween(
        cx + Math.cos(angle) * 6,
        cy + Math.sin(angle) * 6,
        cx + Math.cos(angle) * legLen,
        cy + Math.sin(angle) * legLen,
      );
    }

    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx, cy, 10);
    g.fillStyle(0x991111, 1);
    g.fillTriangle(cx, cy - 10, cx - 8, cy + 6, cx + 8, cy + 6);

    g.fillStyle(0xff4444, 1);
    g.fillCircle(cx, cy - 2, 4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 1, cy - 3, 1.5);

    g.generateTexture('spider-ship', 36, 36);
    g.destroy();
  }

  private createEnemyLaserTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff2244, 1);
    g.fillRoundedRect(0, 0, 8, 20, 2);
    g.fillStyle(0xff8899, 0.9);
    g.fillRoundedRect(2, 2, 4, 8, 1);
    g.generateTexture('enemy-laser', 8, 20);
    g.destroy();
  }

  private createBossSpecialLaserTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6611bb, 1);
    g.fillRoundedRect(0, 0, 10, 24, 2);
    g.fillStyle(0xaa44ff, 0.95);
    g.fillRoundedRect(2, 2, 6, 12, 1);
    g.fillStyle(0xddbbff, 0.85);
    g.fillRoundedRect(4, 4, 2, 8, 1);
    g.generateTexture('boss-special-laser', 10, 24);
    g.destroy();
  }

  private createLootBoxTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const s = 28;
    g.fillStyle(0x5533aa, 0.4);
    g.fillRoundedRect(-2, -2, s + 4, s + 4, 4);
    g.fillStyle(0xffcc00, 1);
    g.fillRoundedRect(0, 0, s, s, 4);
    g.fillStyle(0xcc9900, 1);
    g.fillRect(4, 4, s - 8, s - 8);
    g.lineStyle(2, 0xaa66ff, 1);
    g.strokeRoundedRect(0, 0, s, s, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(s / 2 - 2, 2, 4, s - 4);
    g.fillRect(2, s / 2 - 2, s - 4, 4);
    g.generateTexture('loot-box', s, s);
    g.destroy();
  }

  private createHeavyBulletTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff8844, 1);
    g.fillRoundedRect(0, 0, 10, 20, 4);
    g.fillStyle(0xffcc88, 0.9);
    g.fillRoundedRect(2, 2, 6, 8, 2);
    g.generateTexture('bullet-heavy', 10, 20);
    g.destroy();
  }

  private createSeekerDroneTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 14;
    const cy = 14;
    g.fillStyle(0x662200, 1);
    g.fillTriangle(cx, cy - 12, cx - 12, cy + 8, cx + 12, cy + 8);
    g.fillStyle(0xff7722, 1);
    g.fillTriangle(cx, cy - 8, cx - 7, cy + 4, cx + 7, cy + 4);
    g.fillStyle(0xffaa44, 1);
    g.fillCircle(cx, cy, 4);
    g.generateTexture('seeker-drone', 28, 28);
    g.destroy();
  }

  private createKamikazeWaspTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 14;
    const cy = 14;
    g.fillStyle(0xccaa00, 1);
    g.fillEllipse(cx, cy, 10, 16);
    g.fillStyle(0xffee44, 0.9);
    g.fillEllipse(cx, cy - 2, 6, 10);
    g.fillStyle(0x886600, 1);
    g.fillTriangle(cx - 14, cy - 2, cx - 4, cy, cx - 4, cy + 6);
    g.fillTriangle(cx + 14, cy - 2, cx + 4, cy, cx + 4, cy + 6);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx, cy - 6, 2);
    g.generateTexture('kamikaze-wasp', 28, 28);
    g.destroy();
  }

  private createPlasmaTurretTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 16;
    const cy = 18;
    g.fillStyle(0x442266, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * 14;
      const y = cy + Math.sin(angle) * 12;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
    g.fillStyle(0xaa44ff, 1);
    g.fillRect(cx - 3, cy - 16, 6, 14);
    g.fillStyle(0xdd88ff, 0.9);
    g.fillCircle(cx, cy - 16, 4);
    g.generateTexture('plasma-turret', 32, 32);
    g.destroy();
  }

  private createBossShipTextures(): void {
    for (const definition of Object.values(WORLD1_BOSSES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld1BossPalette(definition.themeId);
      drawWorld1Boss(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 64, 64);
      g.destroy();
    }
    for (const definition of Object.values(WORLD2_BOSSES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld2BossPalette(definition.themeId);
      drawWorld2Boss(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 64, 64);
      g.destroy();
    }
    for (const definition of Object.values(WORLD3_BOSSES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld3BossPalette(definition.themeId);
      drawWorld3Boss(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 64, 64);
      g.destroy();
    }
  }

  private createStoryEnemyTextures(): void {
    for (const definition of Object.values(WORLD1_STORY_ENEMIES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld1StoryEnemyPalette(definition.themeId);
      drawWorld1StoryEnemy(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 32, 36);
      g.destroy();
    }
    for (const definition of Object.values(WORLD2_STORY_ENEMIES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld2StoryEnemyPalette(definition.themeId);
      drawWorld2StoryEnemy(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 32, 36);
      g.destroy();
    }
    for (const definition of Object.values(WORLD3_STORY_ENEMIES)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const palette = getWorld3StoryEnemyPalette(definition.themeId);
      drawWorld3StoryEnemy(g, definition.appearanceId, palette);
      g.generateTexture(definition.textureKey, 32, 36);
      g.destroy();
    }
  }

  private createWormholeTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 32;
    const cy = 32;
    g.lineStyle(4, 0x8844ff, 0.9);
    g.strokeCircle(cx, cy, 26);
    g.lineStyle(2, 0xaa66ff, 0.7);
    g.strokeCircle(cx, cy, 18);
    g.fillStyle(0x220044, 0.6);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(0xcc88ff, 0.85);
    g.fillCircle(cx, cy, 6);
    g.generateTexture('wormhole', 64, 64);
    g.destroy();
  }

  private createWarpPanelTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const s = 48;
    g.fillStyle(0x004466, 0.5);
    g.fillRoundedRect(0, 0, s, s, 6);
    g.lineStyle(3, 0x00d4ff, 0.95);
    g.strokeRoundedRect(4, 4, s - 8, s - 8, 4);
    g.fillStyle(0x00d4ff, 0.4);
    g.fillRoundedRect(10, 10, s - 20, s - 20, 3);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(s / 2, 14, s / 2 - 8, s - 14, s / 2 + 8, s - 14);
    g.generateTexture('warp-panel', s, s);
    g.destroy();
  }

  private createCometTextures(): void {
    const drawComet = (key: string, core: number, tail: number) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(tail, 0.35);
      g.fillTriangle(8, 16, 28, 8, 28, 24);
      g.fillStyle(tail, 0.2);
      g.fillTriangle(0, 16, 16, 10, 16, 22);
      g.fillStyle(core, 1);
      g.fillCircle(30, 16, 10);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(27, 13, 4);
      g.generateTexture(key, 40, 32);
      g.destroy();
    };
    drawComet('comet', 0x88aaff, 0x4466aa);
    drawComet('comet-gold', 0xffcc44, 0xcc8822);
  }

  private createPowerUpPickupTextures(): void {
    const shield = this.make.graphics({ x: 0, y: 0 }, false);
    shield.fillStyle(0x113344, 0.9);
    shield.fillCircle(16, 16, 14);
    shield.lineStyle(3, 0x44ddff, 1);
    shield.strokeCircle(16, 16, 12);
    shield.fillStyle(0x88eeff, 0.8);
    shield.fillTriangle(16, 8, 22, 18, 10, 18);
    shield.generateTexture('shield-pickup', 32, 32);
    shield.destroy();

    const invis = this.make.graphics({ x: 0, y: 0 }, false);
    invis.fillStyle(0x221144, 0.55);
    invis.fillCircle(16, 16, 14);
    invis.lineStyle(2, 0xaa88ff, 0.9);
    invis.strokeCircle(16, 16, 12);
    invis.fillStyle(0xddccff, 0.35);
    invis.fillCircle(16, 16, 6);
    invis.generateTexture('invisibility-pickup', 32, 32);
    invis.destroy();

    const fuel = this.make.graphics({ x: 0, y: 0 }, false);
    fuel.fillStyle(0x334411, 0.95);
    fuel.fillRoundedRect(6, 8, 20, 18, 4);
    fuel.fillStyle(0x88cc22, 0.95);
    fuel.fillRoundedRect(8, 10, 16, 14, 3);
    fuel.fillStyle(0xcccccc, 0.95);
    fuel.fillRect(24, 12, 4, 10);
    fuel.fillStyle(0xffee44, 0.9);
    fuel.fillRect(10, 13, 4, 8);
    fuel.generateTexture('fuel-tank-pickup', 32, 32);
    fuel.destroy();

    const engine = this.make.graphics({ x: 0, y: 0 }, false);
    engine.fillStyle(0x553300, 0.95);
    engine.fillRoundedRect(8, 10, 16, 14, 3);
    engine.fillStyle(0xffaa00, 0.95);
    engine.fillTriangle(16, 6, 24, 24, 8, 24);
    engine.fillStyle(0xffee88, 0.9);
    engine.fillCircle(16, 18, 4);
    engine.generateTexture('engine-powerup', 32, 32);
    engine.destroy();

    const hyper = this.make.graphics({ x: 0, y: 0 }, false);
    hyper.fillStyle(0x113355, 0.95);
    hyper.fillRoundedRect(6, 8, 20, 18, 4);
    hyper.fillStyle(0x00d4ff, 0.95);
    hyper.fillTriangle(16, 4, 26, 24, 6, 24);
    hyper.lineStyle(2, 0x88eeff, 0.9);
    hyper.strokeCircle(16, 16, 10);
    hyper.generateTexture('hyperdrive-powerup', 32, 32);
    hyper.destroy();
  }
}
