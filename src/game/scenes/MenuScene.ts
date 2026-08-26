import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { applyAudioSettings, ensureMusic, initAudio, startMusic } from '../audioManager';
import { formatHighScoreLabel } from '../gameFlow';
import { quitGame } from '../quitGame';
import { getAutoFire } from '../settings';
import { createMenuButton, resetMenuButtonHover } from '../ui/MenuButtons';
import { createSettingsPanel } from '../ui/SettingsPanel';
import { createResetProgressPanel } from '../ui/ResetProgressPanel';
import { runGuestResetSequence, type GuestResetSuckPayload } from '../ui/guestResetSequence';
import { createAlmanacPanel } from '../ui/AlmanacPanel';
import { createShopPanel } from '../ui/ShopPanel';
import { createAccountPanel, getAccountChipLabel } from '../ui/AccountPanel';
import { getCurrentUser, onAuthChange } from '../cloud/auth';
import { releaseEditorTypingKeys } from '../editor/ui/editorWidgets';
import type { User } from '@supabase/supabase-js';

const MENU_BUTTON_HIT_AREA = new Phaser.Geom.Rectangle(-110, -24, 220, 48);
const ACCOUNT_CHIP_DEPTH = 20;
/** Sits above the menu chip, below overlays — absorbs pointer hits so the chip cannot hover under panels. */
const ACCOUNT_CHIP_BLOCKER_DEPTH = 25;
const GUEST_RESET_UNLOCK_WORD = 'reset';

interface MenuSceneData {
  freshStart?: boolean;
}

export class MenuScene extends Phaser.Scene {
  private quitOverlay?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private resetProgressPanel?: Phaser.GameObjects.Container;
  private destroyResetProgressPanel?: () => void;
  private almanacPanel?: Phaser.GameObjects.Container;
  private shopPanel?: Phaser.GameObjects.Container;
  private accountPanel?: Phaser.GameObjects.Container;
  private accountChip?: Phaser.GameObjects.Text;
  private unsubscribeAuth?: () => void;
  private destroyAccountPanel?: () => void;
  private menuButtons: Phaser.GameObjects.Container[] = [];
  private menuButtonsEnabled = true;
  /** True while opening or showing a menu overlay (before panel refs may exist). */
  private menuOverlayActive = false;
  /** Guest + Settings open: finger cursor on the main-menu GUEST chip (not Reset Progress). */
  private guestSettingsChipPointer = false;
  private guestAwaitingResetTyping = false;
  private guestResetTyped = '';
  private settingsRevealReset?: () => void;
  private guestResetKeyHandler?: (event: KeyboardEvent) => void;
  private accountChipInputBlocker?: Phaser.GameObjects.Rectangle;
  private guestResetSequenceActive = false;
  private menuStars: Phaser.GameObjects.Image[] = [];
  private menuTitle?: Phaser.GameObjects.Text;
  private menuHighScore?: Phaser.GameObjects.Text;
  private menuInstructions?: Phaser.GameObjects.Text;
  private freshStart = false;

  private isMenuOverlayCoveringChip(): boolean {
    return (
      this.menuOverlayActive
      || !!(this.almanacPanel || this.settingsPanel || this.resetProgressPanel || this.shopPanel || this.accountPanel || this.quitOverlay)
    );
  }

  /** Main-menu chip stays visible under overlays; pointer only on menu or guest Settings. */
  private syncAccountChip(): void {
    const chip = this.accountChip;
    if (!chip) return;

    chip.setVisible(true);
    chip.setDepth(ACCOUNT_CHIP_DEPTH);

    const allowChipPointer = !this.isMenuOverlayCoveringChip() || this.guestSettingsChipPointer;
    if (allowChipPointer) {
      chip.setInteractive({ useHandCursor: true });
    } else {
      chip.disableInteractive();
      this.input.setDefaultCursor('default');
    }

    this.syncAccountChipInputBlocker();
  }

  private syncAccountChipInputBlocker(): void {
    const needsBlocker = this.isMenuOverlayCoveringChip() && !this.guestSettingsChipPointer;

    if (!needsBlocker) {
      this.accountChipInputBlocker?.destroy();
      this.accountChipInputBlocker = undefined;
      return;
    }

    if (this.accountChipInputBlocker) return;

    const blocker = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0,
    );
    blocker.setDepth(ACCOUNT_CHIP_BLOCKER_DEPTH);
    blocker.setInteractive({ useHandCursor: false });
    if (blocker.input) blocker.input.cursor = 'default';
    this.accountChipInputBlocker = blocker;
  }

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data?: MenuSceneData): void {
    this.freshStart = data?.freshStart ?? false;
  }

  create(): void {
    this.almanacPanel = undefined;
    this.settingsPanel = undefined;
    this.resetProgressPanel = undefined;
    this.destroyResetProgressPanel = undefined;
    this.shopPanel = undefined;
    this.accountPanel = undefined;
    this.destroyAccountPanel = undefined;
    this.quitOverlay = undefined;
    this.menuButtons = [];
    this.menuButtonsEnabled = true;
    this.menuOverlayActive = false;
    this.guestResetSequenceActive = false;
    this.menuStars = [];

    if (this.freshStart) {
      this.cameras.main.setBackgroundColor('#0a0e27');
      this.cameras.main.fadeIn(700, 0, 0, 0);
    } else {
      this.cameras.main.fadeIn(400, 0, 0, 0);
    }
    releaseEditorTypingKeys(this);
    initAudio();
    if (this.freshStart) {
      startMusic();
    } else {
      ensureMusic();
    }
    this.createStarfield();
    this.createTitle();
    this.createAccountChip();
    this.createHighScore();
    this.createInstructions();
    this.createActionButtons();

    this.input.keyboard?.once('keydown-SPACE', () => {
      if (this.isMenuOverlayOpen()) return;
      initAudio();
      ensureMusic();
      this.openModeSelect();
    });
    this.input.keyboard?.once('keydown-ENTER', () => {
      if (this.isMenuOverlayOpen()) return;
      initAudio();
      ensureMusic();
      this.openModeSelect();
    });
  }

  shutdown(): void {
    this.disableGuestResetUnlock();
    this.accountChipInputBlocker?.destroy();
    this.accountChipInputBlocker = undefined;
    this.almanacPanel?.destroy();
    this.settingsPanel?.destroy();
    this.destroyResetProgressPanel?.();
    this.shopPanel?.destroy();
    this.destroyAccountPanel?.();
    this.quitOverlay?.destroy();
    this.unsubscribeAuth?.();
    this.almanacPanel = undefined;
    this.settingsPanel = undefined;
    this.resetProgressPanel = undefined;
    this.destroyResetProgressPanel = undefined;
    this.shopPanel = undefined;
    this.accountPanel = undefined;
    this.accountChip = undefined;
    this.unsubscribeAuth = undefined;
    this.destroyAccountPanel = undefined;
    this.quitOverlay = undefined;
    this.menuButtons = [];
    this.menuButtonsEnabled = true;
    this.menuOverlayActive = false;
    this.guestResetSequenceActive = false;
    this.menuStars = [];
  }

  private isMenuOverlayOpen(): boolean {
    if (this.guestResetSequenceActive) return true;
    return (
      this.menuOverlayActive
      || !!(this.almanacPanel || this.settingsPanel || this.resetProgressPanel || this.shopPanel || this.accountPanel || this.quitOverlay)
    );
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
    this.menuOverlayActive = true;
    this.setMenuButtonsEnabled(false);
    this.syncAccountChip();
  }

  private closeMenuOverlay(): void {
    if (this.almanacPanel || this.settingsPanel || this.resetProgressPanel || this.shopPanel || this.accountPanel || this.quitOverlay) {
      return;
    }
    this.menuOverlayActive = false;
    this.setMenuButtonsEnabled(true);
    this.syncAccountChip();
  }

  private createStarfield(): void {
    this.menuStars = [];
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      this.menuStars.push(star);
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
    this.menuTitle = title;

    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createAccountChip(): void {
    const chip = this.add.text(GAME_WIDTH - 16, 18, 'GUEST', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(1, 0).setPadding(10, 8).setDepth(ACCOUNT_CHIP_DEPTH);
    chip.setInteractive({ useHandCursor: true });
    chip.on('pointerup', () => {
      initAudio();
      if (this.guestSettingsChipPointer) {
        if (this.settingsRevealReset) this.handleGuestChipResetUnlock();
        return;
      }
      if (this.isMenuOverlayOpen()) return;
      this.showAccountPanel();
    });
    this.accountChip = chip;

    void getCurrentUser().then((user) => {
      if (!this.accountChip) return;
      this.accountChip.setText(getAccountChipLabel(user));
    });
    this.unsubscribeAuth = onAuthChange((user: User | null) => {
      this.accountChip?.setText(getAccountChipLabel(user));
    });
    this.syncAccountChip();
  }

  private createHighScore(): void {
    this.menuHighScore = this.add.text(GAME_WIDTH / 2, 300, formatHighScoreLabel(), {
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

    this.menuInstructions = this.add.text(GAME_WIDTH / 2, 400, `${moveText}\n${shootText}\nDodge & destroy asteroids\nEsc to pause`, {
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
        ensureMusic();
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

  private enableGuestResetUnlock(revealResetProgress: () => void): void {
    this.settingsRevealReset = revealResetProgress;
    this.guestAwaitingResetTyping = false;
    this.guestResetTyped = '';

    if (this.guestResetKeyHandler) return;

    this.guestResetKeyHandler = (event: KeyboardEvent) => {
      if (!this.guestAwaitingResetTyping || !this.settingsRevealReset) return;

      const key = event.key.toLowerCase();
      if (key.length !== 1 || key < 'a' || key > 'z') return;

      this.guestResetTyped += key;
      if (this.guestResetTyped === GUEST_RESET_UNLOCK_WORD) {
        this.settingsRevealReset?.();
        this.finishGuestResetUnlock();
        return;
      }
      if (!GUEST_RESET_UNLOCK_WORD.startsWith(this.guestResetTyped)) {
        this.guestResetTyped = '';
      }
    };
    this.input.keyboard?.on('keydown', this.guestResetKeyHandler);
  }

  private finishGuestResetUnlock(): void {
    this.guestAwaitingResetTyping = false;
    this.guestResetTyped = '';
    this.settingsRevealReset = undefined;
  }

  private disableGuestResetUnlock(): void {
    this.guestSettingsChipPointer = false;
    this.guestAwaitingResetTyping = false;
    this.guestResetTyped = '';
    this.settingsRevealReset = undefined;
    if (this.guestResetKeyHandler) {
      this.input.keyboard?.off('keydown', this.guestResetKeyHandler);
      this.guestResetKeyHandler = undefined;
    }
    this.syncAccountChip();
  }

  private handleGuestChipResetUnlock(): void {
    if (this.sys.game.device.input.touch) {
      this.settingsRevealReset?.();
      this.finishGuestResetUnlock();
      return;
    }
    this.guestAwaitingResetTyping = true;
    this.guestResetTyped = '';
  }

  private showSettingsPanel(resetProgressUnlocked = false): void {
    if (this.settingsPanel) return;
    this.openMenuOverlay();

    void getCurrentUser().then((user) => {
      if (!this.scene.isActive('MenuScene')) return;

      const isGuest = !user;
      const panel = createSettingsPanel(this, 300, {
        guestResetEnabled: isGuest,
        resetProgressUnlocked,
        onResetProgress: isGuest
          ? () => {
              this.guestSettingsChipPointer = false;
              this.finishGuestResetUnlock();
              panel.destroy();
              this.settingsPanel = undefined;
              this.showResetProgressPanel();
            }
          : undefined,
        onBack: () => {
          this.disableGuestResetUnlock();
          panel.destroy();
          this.settingsPanel = undefined;
          this.closeMenuOverlay();
        },
        onSoundVolumeChange: () => applyAudioSettings(),
        onMusicVolumeChange: () => applyAudioSettings(),
      });
      this.settingsPanel = panel.root;

      if (isGuest) {
        this.guestSettingsChipPointer = true;
        if (!resetProgressUnlocked) {
          this.enableGuestResetUnlock(panel.revealResetProgress);
        }
      } else {
        this.guestSettingsChipPointer = false;
      }
      this.syncAccountChip();
    });
  }

  private showResetProgressPanel(): void {
    if (this.resetProgressPanel) return;
    this.guestSettingsChipPointer = false;
    this.openMenuOverlay();

    const panel = createResetProgressPanel(this, 310, {
      onBack: () => {
        this.destroyResetProgressPanel?.();
        this.destroyResetProgressPanel = undefined;
        this.resetProgressPanel = undefined;
        this.showSettingsPanel(true);
      },
      onResetTriggered: () => this.beginGuestResetSequence(),
    });
    this.resetProgressPanel = panel.root;
    this.destroyResetProgressPanel = panel.destroy;
    this.syncAccountChip();
  }

  private collectMenuSuckPayload(): GuestResetSuckPayload {
    const texts: Phaser.GameObjects.Text[] = [];
    if (this.menuHighScore) texts.push(this.menuHighScore);
    if (this.menuInstructions) texts.push(this.menuInstructions);
    if (this.accountChip) texts.push(this.accountChip);

    return {
      stars: [...this.menuStars],
      buttons: [...this.menuButtons],
      title: this.menuTitle,
      texts,
    };
  }

  private dismissAllMenuOverlays(): void {
    this.disableGuestResetUnlock();
    this.destroyResetProgressPanel?.();
    this.destroyResetProgressPanel = undefined;
    this.resetProgressPanel = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.almanacPanel?.destroy();
    this.almanacPanel = undefined;
    this.shopPanel?.destroy();
    this.shopPanel = undefined;
    this.destroyAccountPanel?.();
    this.destroyAccountPanel = undefined;
    this.accountPanel = undefined;
    this.quitOverlay?.destroy();
    this.quitOverlay = undefined;
    this.menuOverlayActive = false;
    this.guestSettingsChipPointer = false;
    this.syncAccountChipInputBlocker();
  }

  private beginGuestResetSequence(): void {
    if (this.guestResetSequenceActive) return;
    this.guestResetSequenceActive = true;
    this.setMenuButtonsEnabled(false);
    this.dismissAllMenuOverlays();

    void initAudio();
    runGuestResetSequence(this, this.collectMenuSuckPayload(), () => {
      this.scene.restart({ freshStart: true });
    });
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
    this.syncAccountChip();
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
    this.syncAccountChip();
  }

  private showAccountPanel(): void {
    if (this.isMenuOverlayOpen()) return;
    this.openMenuOverlay();

    const panel = createAccountPanel(this, 300, {
      onBack: () => {
        this.destroyAccountPanel?.();
        this.destroyAccountPanel = undefined;
        this.accountPanel = undefined;
        this.closeMenuOverlay();
      },
      onAuthChange: () => {
        this.destroyAccountPanel?.();
        this.destroyAccountPanel = undefined;
        this.accountPanel = undefined;
        this.scene.restart();
      },
    });
    this.accountPanel = panel.root;
    this.destroyAccountPanel = panel.destroy;
    this.syncAccountChip();
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
    this.syncAccountChip();
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
    ensureMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ModeSelectScene');
    });
  }
}
