import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyAudioSettings, initAudio, startMusic } from '../audioManager';
import { formatHighScoreLabel } from '../gameFlow';
import { quitGame } from '../quitGame';
import { getAutoFire } from '../settings';
import { createMenuButton, resetMenuButtonHover } from '../ui/MenuButtons';
import { createSettingsPanel } from '../ui/SettingsPanel';
import { createAlmanacPanel } from '../ui/AlmanacPanel';
import { createShopPanel } from '../ui/ShopPanel';

const MENU_BUTTON_HIT_AREA = new Phaser.Geom.Rectangle(-110, -24, 220, 48);

export class MenuScene extends Phaser.Scene {
  private quitOverlay?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private almanacPanel?: Phaser.GameObjects.Container;
  private shopPanel?: Phaser.GameObjects.Container;
  private menuButtons: Phaser.GameObjects.Container[] = [];
  private menuButtonsEnabled = true;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.almanacPanel = undefined;
    this.settingsPanel = undefined;
    this.shopPanel = undefined;
    this.quitOverlay = undefined;
    this.menuButtons = [];
    this.menuButtonsEnabled = true;

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.createStarfield();
    this.createTitle();
    this.createHighScore();
    this.createInstructions();
    this.createActionButtons();

    this.input.keyboard?.once('keydown-SPACE', () => {
      if (this.isMenuOverlayOpen()) return;
      initAudio();
      startMusic();
      this.openModeSelect();
    });
    this.input.keyboard?.once('keydown-ENTER', () => {
      if (this.isMenuOverlayOpen()) return;
      initAudio();
      startMusic();
      this.openModeSelect();
    });
  }

  shutdown(): void {
    this.almanacPanel?.destroy();
    this.settingsPanel?.destroy();
    this.shopPanel?.destroy();
    this.quitOverlay?.destroy();
    this.almanacPanel = undefined;
    this.settingsPanel = undefined;
    this.shopPanel = undefined;
    this.quitOverlay = undefined;
    this.menuButtons = [];
    this.menuButtonsEnabled = true;
  }

  private isMenuOverlayOpen(): boolean {
    return !!(this.almanacPanel || this.settingsPanel || this.shopPanel || this.quitOverlay);
  }

  private setMenuButtonsEnabled(enabled: boolean): void {
    if (this.menuButtonsEnabled === enabled) return;
    this.menuButtonsEnabled = enabled;
    for (const container of this.menuButtons) {
      if (enabled) {
        container.setInteractive(MENU_BUTTON_HIT_AREA, Phaser.Geom.Rectangle.Contains);
        if (container.input) container.input.cursor = 'pointer';
        container.setAlpha(1);
      } else {
        resetMenuButtonHover(container);
        container.disableInteractive();
        container.setAlpha(0.35);
      }
    }
    if (!enabled) {
      this.input.setDefaultCursor('default');
    }
  }

  private openMenuOverlay(): void {
    this.setMenuButtonsEnabled(false);
  }

  private closeMenuOverlay(): void {
    if (!this.isMenuOverlayOpen()) {
      this.setMenuButtonsEnabled(true);
    }
  }

  private createStarfield(): void {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 180, 'STAR\nBLASTER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '48px',
      fontStyle: '900',
      color: '#00d4ff',
      align: 'center',
      stroke: '#003344',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHighScore(): void {
    this.add.text(GAME_WIDTH / 2, 300, formatHighScoreLabel(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#ffcc00',
    }).setOrigin(0.5);
  }

  private createInstructions(): void {
    const isMobile = this.sys.game.device.input.touch;
    const moveText = isMobile
      ? 'Drag to fly your rocket'
      : 'WASD or arrows to move';
    const shootText = getAutoFire() ? 'Auto-fire enabled' : 'Space / FIRE to shoot';

    this.add.text(GAME_WIDTH / 2, 400, `${moveText}\n${shootText}\nDodge & destroy asteroids\nEsc to pause`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      color: '#8899bb',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5);
  }

  private createActionButtons(): void {
    const btnHeight = 48;
    const gap = 14;
    const bottomPad = 48;

    const quitY = GAME_HEIGHT - bottomPad - btnHeight / 2;
    const settingsY = quitY - btnHeight - gap;
    const shopY = settingsY - btnHeight - gap;
    const almanacY = shopY - btnHeight - gap;
    const launchY = almanacY - btnHeight - gap;

    const { container: launchBtn } = createMenuButton(this, {
      label: 'LAUNCH',
      y: launchY,
      onClick: () => {
        if (this.isMenuOverlayOpen()) return;
        initAudio();
        startMusic();
        this.openModeSelect();
      },
    });
    launchBtn.setX(GAME_WIDTH / 2);
    this.menuButtons.push(launchBtn);
    this.tweens.add({
      targets: launchBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const { container: almanacBtn } = createMenuButton(this, {
      label: 'ALMANAC',
      y: almanacY,
      color: 0x8899bb,
      onClick: () => {
        initAudio();
        this.showAlmanacPanel();
      },
    });
    almanacBtn.setX(GAME_WIDTH / 2);
    this.menuButtons.push(almanacBtn);

    const { container: shopBtn } = createMenuButton(this, {
      label: 'SHOP',
      y: shopY,
      color: 0x8899bb,
      onClick: () => {
        initAudio();
        this.showShopPanel();
      },
    });
    shopBtn.setX(GAME_WIDTH / 2);
    this.menuButtons.push(shopBtn);

    const { container: settingsBtn } = createMenuButton(this, {
      label: 'SETTINGS',
      y: settingsY,
      color: 0x8899bb,
      onClick: () => {
        initAudio();
        this.showSettingsPanel();
      },
    });
    settingsBtn.setX(GAME_WIDTH / 2);
    this.menuButtons.push(settingsBtn);

    const { container: quitBtn } = createMenuButton(this, {
      label: 'QUIT',
      y: quitY,
      color: 0xff4466,
      onClick: () => this.showQuitConfirm(),
    });
    quitBtn.setX(GAME_WIDTH / 2);
    this.menuButtons.push(quitBtn);
  }

  private showSettingsPanel(): void {
    if (this.isMenuOverlayOpen()) return;
    this.openMenuOverlay();

    const panel = createSettingsPanel(this, 300, {
      onBack: () => {
        panel.destroy();
        this.settingsPanel = undefined;
        this.closeMenuOverlay();
      },
      onSoundVolumeChange: () => applyAudioSettings(),
      onMusicVolumeChange: () => applyAudioSettings(),
    });
    this.settingsPanel = panel.root;
  }

  private showAlmanacPanel(): void {
    if (this.isMenuOverlayOpen()) return;
    this.openMenuOverlay();

    const panel = createAlmanacPanel(this, 300, {
      onBack: () => {
        panel.destroy();
        this.almanacPanel = undefined;
        this.closeMenuOverlay();
      },
    });
    this.almanacPanel = panel.root;
  }

  private showShopPanel(): void {
    if (this.isMenuOverlayOpen()) return;
    this.openMenuOverlay();

    const panel = createShopPanel(this, 300, {
      onBack: () => {
        panel.destroy();
        this.shopPanel = undefined;
        this.closeMenuOverlay();
      },
    });
    this.shopPanel = panel.root;
  }

  private showQuitConfirm(): void {
    if (this.isMenuOverlayOpen()) return;
    this.openMenuOverlay();

    const root = this.add.container(0, 0).setDepth(300);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8,
    );
    root.add(overlay);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Quit game?', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(0.5);
    root.add(prompt);

    const { container: yesBtn } = createMenuButton(this, {
      label: 'YES',
      y: GAME_HEIGHT / 2 + 10,
      color: 0xff4466,
      onClick: () => this.showQuitFarewell(root),
    });
    yesBtn.setX(GAME_WIDTH / 2);
    root.add(yesBtn);

    const { container: noBtn } = createMenuButton(this, {
      label: 'NO',
      y: GAME_HEIGHT / 2 + 74,
      onClick: () => {
        root.destroy();
        this.quitOverlay = undefined;
        this.closeMenuOverlay();
      },
    });
    noBtn.setX(GAME_WIDTH / 2);
    root.add(noBtn);

    this.quitOverlay = root;
  }

  private showQuitFarewell(root: Phaser.GameObjects.Container): void {
    root.removeAll(true);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8,
    );
    root.add(overlay);

    const message = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Thanks for Playing!',
      {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '16px',
        color: '#8899bb',
        align: 'center',
        lineSpacing: 10,
      },
    ).setOrigin(0.5);
    root.add(message);

    quitGame();
  }

  private openModeSelect(): void {
    if (this.isMenuOverlayOpen()) return;
    initAudio();
    startMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ModeSelectScene');
    });
  }
}
