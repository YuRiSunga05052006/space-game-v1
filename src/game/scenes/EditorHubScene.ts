import Phaser from 'phaser';
import { startMusic, stopMusic } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  copyTextToClipboard,
  createDefaultCustomLevel,
  decodeLevelCode,
  deleteCustomLevel,
  encodeLevelCode,
  getCustomLevel,
  getCustomLevelSlots,
  MAX_CUSTOM_LEVEL_SLOTS,
  saveCustomLevel,
} from '../editor/customLevels';
import { confirmYesNo, promptText, showToast } from '../editor/ui/editorWidgets';
import { createMenuButton } from '../ui/MenuButtons';

export class EditorHubScene extends Phaser.Scene {
  private selectedSlot = 0;
  private slotLabels: Phaser.GameObjects.Text[] = [];
  private actionRoot?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'EditorHubScene' });
  }

  init(data?: { selectedSlot?: number }): void {
    if (typeof data?.selectedSlot === 'number') {
      this.selectedSlot = Phaser.Math.Clamp(data.selectedSlot, 0, MAX_CUSTOM_LEVEL_SLOTS - 1);
    }
  }

  create(): void {
    stopMusic();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e27);

    for (let i = 0; i < 30; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        'star',
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.15, 0.55));
      star.setScale(Phaser.Math.FloatBetween(0.4, 1.2));
    }

    this.add.text(GAME_WIDTH / 2, 28, 'LEVEL EDITOR', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#44ff88',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 52, 'Select a slot', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#8899bb',
    }).setOrigin(0.5);

    this.buildSlotList();
    this.refreshActions();
  }

  private buildSlotList(): void {
    this.slotLabels.forEach((t) => t.destroy());
    this.slotLabels = [];
    const slots = getCustomLevelSlots();
    const startY = 72;
    const colWidth = 160;
    for (let i = 0; i < MAX_CUSTOM_LEVEL_SLOTS; i++) {
      const level = slots[i];
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      const label = level ? `${i + 1}. ${level.name}` : `${i + 1}. EMPTY`;
      const x = GAME_WIDTH / 2 + (col === 0 ? -colWidth / 2 : colWidth / 2);
      const text = this.add.text(x, startY + row * 22, label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        fontStyle: i === this.selectedSlot ? '700' : '400',
        color: i === this.selectedSlot ? '#44ff88' : (level ? '#ccddee' : '#556677'),
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerup', () => {
        this.selectedSlot = i;
        this.buildSlotList();
        this.refreshActions();
      });
      this.slotLabels.push(text);
    }
  }

  private refreshActions(): void {
    this.actionRoot?.destroy();
    this.actionRoot = this.add.container(0, 0);

    const filled = getCustomLevel(this.selectedSlot) != null;
    const buttons: Array<{ label: string; color: number; onClick: () => void }> = [];

    if (!filled) {
      buttons.push({
        label: 'CREATE',
        color: 0x44ff88,
        onClick: () => this.onCreate(),
      });
    } else {
      buttons.push(
        {
          label: 'EDIT',
          color: 0x00d4ff,
          onClick: () => this.transitionTo('EditorEditScene', {
            slotIndex: this.selectedSlot,
          }),
        },
        {
          label: 'DELETE',
          color: 0xff4466,
          onClick: () => this.onDelete(),
        },
        {
          label: 'CODE',
          color: 0xaa88ff,
          onClick: () => void this.onCode(),
        },
        {
          label: 'PLAY',
          color: 0xffcc00,
          onClick: () => this.onPlay(),
        },
      );
    }

    buttons.push(
      {
        label: 'LOAD',
        color: 0x00d4ff,
        onClick: () => void this.onLoad(),
      },
      {
        label: 'BACK',
        color: 0x8899bb,
        onClick: () => {
          startMusic();
          this.transitionTo('ModeSelectScene');
        },
      },
    );

    const startY = 210;
    buttons.forEach((btn, i) => {
      const { container } = createMenuButton(this, {
        label: btn.label,
        y: startY + i * 50,
        color: btn.color,
        onClick: btn.onClick,
      });
      container.setX(GAME_WIDTH / 2);
      this.actionRoot!.add(container);
    });
  }

  private onCreate(): void {
    const name = promptText('Level name:', `Custom Level ${this.selectedSlot + 1}`);
    if (name === null) return;
    const level = createDefaultCustomLevel(name.trim() || `Custom Level ${this.selectedSlot + 1}`);
    saveCustomLevel(this.selectedSlot, level);
    this.transitionTo('EditorEditScene', { slotIndex: this.selectedSlot });
  }

  private onDelete(): void {
    confirmYesNo(this, 'Delete this custom level?', () => {
      deleteCustomLevel(this.selectedSlot);
      showToast(this, 'Level deleted', '#ff4466');
      this.buildSlotList();
      this.refreshActions();
    });
  }

  private async onCode(): Promise<void> {
    const level = getCustomLevel(this.selectedSlot);
    if (!level) return;
    const code = encodeLevelCode(level);
    const ok = await copyTextToClipboard(code);
    showToast(this, ok ? 'Level code copied!' : 'Copy failed — see console', ok ? '#44ff88' : '#ff4466');
    if (!ok) {
      console.log('[Editor] Level code:', code);
    }
  }

  private async onLoad(): Promise<void> {
    let pasted = '';
    try {
      if (navigator.clipboard?.readText) {
        pasted = await navigator.clipboard.readText();
      }
    } catch {
      // ignore
    }
    const code = promptText('Paste level code:', pasted);
    if (code === null || !code.trim()) return;

    const result = decodeLevelCode(code);
    if (!result.ok) {
      showToast(this, result.error, '#ff4466');
      return;
    }

    const existing = getCustomLevel(this.selectedSlot);
    const write = () => {
      saveCustomLevel(this.selectedSlot, result.level);
      showToast(this, 'Level loaded!', '#44ff88');
      this.buildSlotList();
      this.refreshActions();
    };

    if (existing) {
      confirmYesNo(this, 'Overwrite this slot?', write);
    } else {
      write();
    }
  }

  private onPlay(): void {
    const level = getCustomLevel(this.selectedSlot);
    if (!level) return;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LaunchCutsceneScene', {
        mode: 'editor',
        customSlotIndex: this.selectedSlot,
        level: 1,
        worldId: 'world1',
      });
    });
  }

  private transitionTo(sceneKey: string, data?: object): void {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }
}
