import Phaser from 'phaser';
import { playSfx, initAudio, stopMusic } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  createDefaultSubArea,
  getCustomLevel,
  saveCustomLevel,
  type CustomLevelDefinition,
  type CustomSubArea,
  type EnemySpawnRule,
} from '../editor/customLevels';
import {
  getVisibleBossOptions,
  getVisibleStoryEnemyOptions,
  getVisibleSurvivalEnemyIds,
  isEditorObstacleVisible,
} from '../editor/editorCatalog';
import {
  confirmYesNo,
  createDomTextInput,
  createRgbColorRow,
  createSpawnRuleBlock,
  createStepperRow,
  createToggleRow,
  promptText,
  showToast,
} from '../editor/ui/editorWidgets';
import { isPowerUpOwned } from '../playerPowerUps';
import { createMenuButton } from '../ui/MenuButtons';
import { isWorld2Unlocked, isWorld3Unlocked } from '../worldProgress';

type EditPanel = 'menu' | 'objects' | 'obstacles' | 'enemies' | 'background' | 'misc' | 'save';
type EnemyTab =
  | 'survival'
  | 'world1'
  | 'world2'
  | 'world3'
  | 'world4'
  | 'world5'
  | 'world6'
  | 'world7'
  | 'world8';

interface EditorEditData {
  slotIndex: number;
  /** When set, edit this sub-area instead of the main level. */
  subAreaId?: string;
}

const SCROLL_TOP = 70;
const SCROLL_BOTTOM_RESERVE = 78;

export class EditorEditScene extends Phaser.Scene {
  private slotIndex = 0;
  private subAreaId?: string;
  private draft!: CustomLevelDefinition;
  private dirty = false;
  private panel: EditPanel = 'menu';
  private enemyTab: EnemyTab = 'survival';
  private contentRoot?: Phaser.GameObjects.Container;
  private scrollPanel?: Phaser.GameObjects.Container;
  private scrollY = 0;
  private scrollMinY = 0;
  private scrollDragging = false;
  private scrollDragStartPointerY = 0;
  private scrollDragStartScrollY = 0;
  private scrollMoved = false;

  constructor() {
    super({ key: 'EditorEditScene' });
  }

  init(data: EditorEditData): void {
    this.slotIndex = data.slotIndex;
    this.subAreaId = data.subAreaId;
    this.panel = 'menu';
    this.enemyTab = 'survival';
    this.scrollY = 0;
    this.dirty = false;
  }

  create(): void {
    stopMusic();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e27);

    const loaded = getCustomLevel(this.slotIndex);
    if (!loaded) {
      this.scene.start('EditorHubScene', { selectedSlot: this.slotIndex });
      return;
    }
    this.draft = JSON.parse(JSON.stringify(loaded)) as CustomLevelDefinition;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearScrollHandlers();
      this.contentRoot?.destroy(true);
      this.contentRoot = undefined;
    });
    this.render();
  }

  private getEditingArea(): CustomLevelDefinition | CustomSubArea {
    if (!this.subAreaId) return this.draft;
    const sub = this.draft.subAreas.find((s) => s.id === this.subAreaId);
    return sub ?? this.draft;
  }

  private markDirty(): void {
    this.dirty = true;
  }

  private render(): void {
    this.clearScrollHandlers();
    // Destroy DOM inputs with the panel so focus/state doesn't leak across views.
    this.contentRoot?.destroy(true);
    this.contentRoot = this.add.container(0, 0);
    this.scrollPanel = undefined;

    const title = this.subAreaId
      ? `SUB-AREA: ${this.getEditingArea().name}`
      : `EDIT: ${this.draft.name}`;

    this.contentRoot.add(this.add.text(GAME_WIDTH / 2, 28, title, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#44ff88',
    }).setOrigin(0.5));

    if (this.panel === 'menu') {
      this.renderMenu();
    } else if (this.panel === 'objects') {
      this.renderObjects();
    } else if (this.panel === 'obstacles') {
      this.renderObstacles();
    } else if (this.panel === 'enemies') {
      this.renderEnemies();
    } else if (this.panel === 'background') {
      this.renderBackground();
    } else if (this.panel === 'misc') {
      this.renderMisc();
    } else if (this.panel === 'save') {
      this.renderSave();
    }
  }

  private renderMenu(): void {
    const buttons = [
      { label: 'OBJECTS', color: 0x00d4ff, panel: 'objects' as const },
      { label: 'OBSTACLES', color: 0xff8866, panel: 'obstacles' as const },
      { label: 'ENEMIES', color: 0xff4466, panel: 'enemies' as const },
      { label: 'BACKGROUND', color: 0xaa88ff, panel: 'background' as const },
      { label: 'MISC', color: 0xffcc00, panel: 'misc' as const },
      { label: 'SAVE', color: 0x44ff88, panel: 'save' as const },
    ];

    const startY = 100;
    buttons.forEach((btn, i) => {
      const { container } = createMenuButton(this, {
        label: btn.label,
        y: startY + i * 54,
        color: btn.color,
        onClick: () => {
          this.panel = btn.panel;
          this.enemyTab = 'survival';
          this.scrollY = 0;
          this.render();
        },
      });
      container.setX(GAME_WIDTH / 2);
      this.contentRoot!.add(container);
    });

    const { container: back } = createMenuButton(this, {
      label: 'BACK',
      y: GAME_HEIGHT - 50,
      color: 0x8899bb,
      onClick: () => this.onBack(),
    });
    back.setX(GAME_WIDTH / 2);
    this.contentRoot!.add(back);
  }

  private addBackToMenu(): void {
    const { container } = createMenuButton(this, {
      label: 'BACK',
      y: GAME_HEIGHT - 40,
      color: 0x8899bb,
      onClick: () => {
        this.panel = 'menu';
        this.enemyTab = 'survival';
        this.scrollY = 0;
        this.render();
      },
    });
    container.setX(GAME_WIDTH / 2);
    this.contentRoot!.add(container);
  }

  private clearScrollHandlers(): void {
    this.input.off('wheel', this.onScrollWheel, this);
    this.input.off('pointerdown', this.onScrollPointerDown, this);
    this.input.off('pointermove', this.onScrollPointerMove, this);
    this.input.off('pointerup', this.onScrollPointerUp, this);
    this.input.off('pointerupoutside', this.onScrollPointerUp, this);
    this.scrollDragging = false;
    this.scrollMoved = false;
  }

  /** Fixed panel — no wheel / drag scrolling (Background, Misc, Save). */
  private beginStaticPanel(top = SCROLL_TOP): Phaser.GameObjects.Container {
    this.clearScrollHandlers();
    this.scrollY = 0;
    const panel = this.add.container(GAME_WIDTH / 2, top);
    this.contentRoot!.add(panel);
    this.scrollPanel = panel;
    return panel;
  }

  /** Scrollable panel for Objects / Obstacles / Enemies. Call finalizeScroll(height) after building. */
  private beginScrollPanel(top = SCROLL_TOP): Phaser.GameObjects.Container {
    this.clearScrollHandlers();
    const panel = this.add.container(GAME_WIDTH / 2, top + this.scrollY);
    this.contentRoot!.add(panel);
    this.scrollPanel = panel;
    return panel;
  }

  private finalizeScroll(contentHeight: number, top = SCROLL_TOP): void {
    if (!this.scrollPanel) return;
    const viewHeight = GAME_HEIGHT - top - SCROLL_BOTTOM_RESERVE;
    this.scrollMinY = Math.min(0, viewHeight - contentHeight - 16);
    this.scrollY = Phaser.Math.Clamp(this.scrollY, this.scrollMinY, 0);
    this.scrollPanel.setY(top + this.scrollY);

    this.input.on('wheel', this.onScrollWheel, this);
    this.input.on('pointerdown', this.onScrollPointerDown, this);
    this.input.on('pointermove', this.onScrollPointerMove, this);
    this.input.on('pointerup', this.onScrollPointerUp, this);
    this.input.on('pointerupoutside', this.onScrollPointerUp, this);

    this.addScrollButtons(top);
  }

  private addScrollButtons(top: number): void {
    if (this.scrollMinY >= 0) return;

    const makeBtn = (y: number, label: string, delta: number) => {
      const btn = this.add.text(GAME_WIDTH - 28, y, label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        color: '#00d4ff',
        backgroundColor: '#1a1f3aaa',
        padding: { x: 8, y: 6 },
      }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setInteractive({ useHandCursor: true });
      btn.on('pointerup', () => {
        void initAudio().then(() => playSfx('ui'));
        this.applyScroll(this.scrollY + delta, top);
      });
      this.contentRoot!.add(btn);
    };

    makeBtn(top + 24, '▲', 120);
    makeBtn(GAME_HEIGHT - SCROLL_BOTTOM_RESERVE - 24, '▼', -120);
  }

  private applyScroll(nextY: number, top = SCROLL_TOP): void {
    this.scrollY = Phaser.Math.Clamp(nextY, this.scrollMinY, 0);
    this.scrollPanel?.setY(top + this.scrollY);
  }

  private onScrollWheel(
    _pointer: Phaser.Input.Pointer,
    _currentlyOver: unknown,
    _dx: number,
    dy: number,
  ): void {
    if (!this.scrollPanel || this.scrollMinY >= 0) return;
    this.applyScroll(this.scrollY - dy * 0.45);
  }

  private onScrollPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.scrollPanel || this.scrollMinY >= 0) return;
    // Ignore drags that start on DOM form controls.
    const target = pointer.event?.target as HTMLElement | null | undefined;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) {
      return;
    }
    this.scrollDragging = true;
    this.scrollMoved = false;
    this.scrollDragStartPointerY = pointer.y;
    this.scrollDragStartScrollY = this.scrollY;
  }

  private onScrollPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.scrollDragging || !this.scrollPanel) return;
    const dy = pointer.y - this.scrollDragStartPointerY;
    // Require a small drag threshold so taps on steppers / toggles still count as clicks.
    if (Math.abs(dy) <= 8) return;
    this.scrollMoved = true;
    this.applyScroll(this.scrollDragStartScrollY + dy);
  }

  private onScrollPointerUp(): void {
    this.scrollDragging = false;
  }

  private renderObjects(): void {
    const area = this.getEditingArea();
    const panel = this.beginScrollPanel();
    let y = 0;

    const addRule = (title: string, key: keyof typeof area.objects) => {
      const block = createSpawnRuleBlock(this, title, area.objects[key], (next) => {
        area.objects[key] = next;
        this.markDirty();
      });
      block.setY(y);
      panel.add(block);
      y += ((block as Phaser.GameObjects.Container & { blockHeight?: number }).blockHeight ?? 160) + 16;
    };

    addRule('Loot Boxes', 'lootBoxes');
    addRule('Hearts', 'hearts');
    addRule('Power Star', 'powerStar');
    // Match survival: pickups only appear after buying the power-up in the Shop.
    if (isPowerUpOwned('shield')) {
      addRule('Shield', 'shield');
    }
    if (isPowerUpOwned('invisibility')) {
      addRule('Invisibility', 'invisibility');
    }

    this.finalizeScroll(y);
    this.addBackToMenu();
  }

  private renderObstacles(): void {
    const area = this.getEditingArea();
    const panel = this.beginScrollPanel();
    let y = 0;

    const addRule = (
      title: string,
      key: keyof typeof area.obstacles,
      opts?: { showChance?: boolean; disabled?: boolean; disabledHint?: string },
    ) => {
      const block = createSpawnRuleBlock(this, title, area.obstacles[key], (next) => {
        area.obstacles[key] = next;
        this.markDirty();
      }, opts);
      block.setY(y);
      panel.add(block);
      y += ((block as Phaser.GameObjects.Container & { blockHeight?: number }).blockHeight ?? 160) + 16;
    };

    addRule('Asteroids', 'asteroids', { showChance: false });
    if (isEditorObstacleVisible('comets')) {
      addRule('Comets', 'comets', { showChance: true });
    }
    if (isEditorObstacleVisible('blueMines')) {
      addRule('Blue Mines', 'blueMines', { showChance: true });
    }
    if (isEditorObstacleVisible('grayMines')) {
      addRule('Gray Mines', 'grayMines', { showChance: true });
    }
    if (isEditorObstacleVisible('redMines')) {
      addRule('Red Mines', 'redMines', { showChance: true });
    }
    if (isEditorObstacleVisible('purpleMines')) {
      addRule('Purple Mines', 'purpleMines', { showChance: true });
    }

    this.finalizeScroll(y);
    this.addBackToMenu();
  }

  private isEnemyTabUnlocked(tab: EnemyTab): boolean {
    if (tab === 'survival' || tab === 'world1') return true;
    if (tab === 'world2') return isWorld2Unlocked();
    if (tab === 'world3') return isWorld3Unlocked();
    return false;
  }

  private renderEnemies(): void {
    // If current tab was locked, fall back to survival.
    if (!this.isEnemyTabUnlocked(this.enemyTab)) this.enemyTab = 'survival';

    const area = this.getEditingArea();

    // Fixed header: boss count + world tabs (does not scroll).
    const header = this.add.container(GAME_WIDTH / 2, 58);
    this.contentRoot!.add(header);

    const bossCount = createStepperRow(
      this,
      'Boss count (0=endless)',
      area.enemies.bossCount,
      1,
      0,
      99,
      (v) => {
        area.enemies.bossCount = v;
        this.markDirty();
      },
    );
    bossCount.setY(0);
    header.add(bossCount);

    const tabs: Array<{ id: EnemyTab; label: string }> = [
      { id: 'survival', label: 'SURVIVAL' },
      { id: 'world1', label: 'WORLD 1' },
      { id: 'world2', label: 'WORLD 2' },
      { id: 'world3', label: 'WORLD 3' },
      { id: 'world4', label: 'WORLD 4' },
      { id: 'world5', label: 'WORLD 5' },
      { id: 'world6', label: 'WORLD 6' },
      { id: 'world7', label: 'WORLD 7' },
      { id: 'world8', label: 'WORLD 8' },
    ];
    const tabsPerRow = 5;
    const tabGap = 4;
    const available = 360;
    const cols = Math.min(tabsPerRow, tabs.length);
    const tabWidth = Math.floor((available - (cols - 1) * tabGap) / cols);

    tabs.forEach((tab, i) => {
      const unlocked = this.isEnemyTabUnlocked(tab.id);
      const selected = this.enemyTab === tab.id;
      const row = Math.floor(i / tabsPerRow);
      const col = i % tabsPerRow;
      const rowTabs = Math.min(tabsPerRow, tabs.length - row * tabsPerRow);
      const rowWidth = rowTabs * tabWidth + (rowTabs - 1) * tabGap;
      const x = -rowWidth / 2 + tabWidth / 2 + col * (tabWidth + tabGap);
      const y = 34 + row * 28;
      const btn = this.add.text(x, y, tab.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '8px',
        fontStyle: '700',
        color: !unlocked ? '#445566' : selected ? '#0a0e27' : '#00d4ff',
        backgroundColor: !unlocked ? '#151828' : selected ? '#44ff88' : '#1a1f3a',
        padding: { x: 4, y: 5 },
      }).setOrigin(0.5);

      if (unlocked) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerup', () => {
          if (this.scrollMoved) return;
          void initAudio().then(() => playSfx('ui'));
          this.enemyTab = tab.id;
          this.scrollY = 0;
          this.render();
        });
      }
      header.add(btn);
    });

    const scrollTop = 148;
    const panel = this.beginScrollPanel(scrollTop);
    let y = 0;

    const ensureStoryRule = (id: string): { rule: EnemySpawnRule; listIndex: number } => {
      let listIndex = area.enemies.story.findIndex((r) => r.id === id);
      if (listIndex < 0) {
        area.enemies.story.push({
          id,
          enabled: false,
          intervalMs: 8000,
          chance: 1,
          scaleBy: 'none',
          scaleStrength: 0.2,
          maxOnScreen: 2,
        });
        listIndex = area.enemies.story.length - 1;
      }
      return { rule: area.enemies.story[listIndex], listIndex };
    };

    const ensureBossRule = (id: string): { rule: EnemySpawnRule; listIndex: number } => {
      let listIndex = area.enemies.bosses.findIndex((r) => r.id === id);
      if (listIndex < 0) {
        area.enemies.bosses.push({
          id,
          enabled: false,
          intervalMs: 60000,
          chance: 1,
          scaleBy: 'score',
          scaleStrength: 0.2,
          maxOnScreen: 1,
        });
        listIndex = area.enemies.bosses.length - 1;
      }
      return { rule: area.enemies.bosses[listIndex], listIndex };
    };

    const addEnemyRules = (
      title: string,
      list: EnemySpawnRule[],
      rules: Array<{ rule: EnemySpawnRule; label: string; listIndex: number }>,
    ) => {
      if (rules.length === 0) return;
      panel.add(this.add.text(-150, y, title, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '15px',
        fontStyle: '700',
        color: '#ffcc00',
      }).setOrigin(0, 0.5));
      y += 28;

      for (const { rule, label, listIndex } of rules) {
        const block = createSpawnRuleBlock(this, label, rule, (next) => {
          list[listIndex] = { ...list[listIndex], ...next };
          this.markDirty();
        });
        block.setY(y);
        panel.add(block);
        y += ((block as Phaser.GameObjects.Container & { blockHeight?: number }).blockHeight ?? 160) + 8;

        const maxRow = createStepperRow(this, 'Max on screen', rule.maxOnScreen, 1, 1, 12, (v) => {
          list[listIndex].maxOnScreen = v;
          this.markDirty();
        });
        maxRow.setY(y);
        panel.add(maxRow);
        y += 40;
      }
      y += 12;
    };

    if (this.enemyTab === 'survival') {
      const survivalIds = new Set(getVisibleSurvivalEnemyIds().map(String));
      addEnemyRules(
        'Survival enemies',
        area.enemies.survival,
        area.enemies.survival
          .map((rule, listIndex) => ({ rule, listIndex, label: rule.id }))
          .filter((r) => survivalIds.has(r.rule.id)),
      );
    } else {
      const worldId = this.enemyTab;
      const storyOpts = getVisibleStoryEnemyOptions().filter((o) => o.worldId === worldId);
      addEnemyRules(
        'Story enemies',
        area.enemies.story,
        storyOpts.map((opt) => {
          const { rule, listIndex } = ensureStoryRule(opt.id);
          return { rule, label: opt.name, listIndex };
        }),
      );

      const bossOpts = getVisibleBossOptions().filter((o) => o.worldId === worldId);
      addEnemyRules(
        'Bosses',
        area.enemies.bosses,
        bossOpts.map((opt) => {
          const { rule, listIndex } = ensureBossRule(opt.id);
          return { rule, label: opt.name, listIndex };
        }),
      );
    }

    if (y === 0) {
      panel.add(this.add.text(0, 20, 'No enemies in this tab yet.', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '13px',
        color: '#556677',
      }).setOrigin(0.5));
      y = 60;
    }

    this.finalizeScroll(y, scrollTop);
    this.addBackToMenu();
  }

  private renderBackground(): void {
    const area = this.getEditingArea();
    const bg = area.background;
    const panel = this.beginStaticPanel();
    let y = 0;

    const colorRow = (label: string, key: 'skyTop' | 'skyBottom' | 'starColor' | 'obstructionColor') => {
      const row = createRgbColorRow(this, label, bg[key], (v) => {
        bg[key] = v;
        this.markDirty();
      });
      row.container.setY(y);
      panel.add(row.container);
      y += row.blockHeight + 10;
    };

    colorRow('Sky top', 'skyTop');
    colorRow('Sky bottom', 'skyBottom');
    colorRow('Star color', 'starColor');

    const stars = createToggleRow(this, 'Background stars', bg.starsEnabled, (v) => {
      bg.starsEnabled = v;
      this.markDirty();
      this.render();
    });
    stars.setY(y);
    panel.add(stars);
    y += 36;

    if (!bg.starsEnabled) {
      const obst = createToggleRow(this, 'Obstruction', bg.obstructionEnabled, (v) => {
        bg.obstructionEnabled = v;
        this.markDirty();
        this.render();
      });
      obst.setY(y);
      panel.add(obst);
      y += 36;

      if (bg.obstructionEnabled) {
        colorRow('Obstruction color', 'obstructionColor');
      }
    }

    const presets = [
      { label: 'Earth', top: 0x0a1a3a, bottom: 0x1a3a6a, star: 0xaaccff },
      { label: 'Void', top: 0x050508, bottom: 0x101018, star: 0x8899bb },
      { label: 'Nebula', top: 0x1a0830, bottom: 0x401060, star: 0xffaaff },
    ];
    panel.add(this.add.text(-150, y, 'Presets', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#8899bb',
    }).setOrigin(0, 0.5));
    y += 28;
    presets.forEach((p, i) => {
      const t = this.add.text(-150 + i * 100, y, p.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        color: '#00d4ff',
        backgroundColor: '#1a1f3a',
        padding: { x: 8, y: 4 },
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      t.on('pointerup', () => {
        bg.skyTop = p.top;
        bg.skyBottom = p.bottom;
        bg.starColor = p.star;
        this.markDirty();
        this.render();
      });
      panel.add(t);
    });

    this.addBackToMenu();
  }

  private renderMisc(): void {
    const area = this.getEditingArea();
    const panel = this.beginStaticPanel();
    let y = 0;

    panel.add(this.add.text(-150, y, 'Finish panels', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      fontStyle: '700',
      color: '#ffcc00',
    }).setOrigin(0, 0.5));
    y += 28;

    area.misc.finishPanels.forEach((fp, i) => {
      const row = createStepperRow(this, `Finish #${i + 1} score`, fp.scoreThreshold, 500, 0, 999999, (v) => {
        fp.scoreThreshold = v;
        this.markDirty();
      });
      row.setY(y);
      panel.add(row);
      y += 34;

      const del = this.add.text(120, y - 34, 'DEL', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        color: '#ff4466',
        backgroundColor: '#1a1f3a',
        padding: { x: 6, y: 4 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      del.on('pointerup', () => {
        area.misc.finishPanels.splice(i, 1);
        this.markDirty();
        this.render();
      });
      panel.add(del);
    });

    const addFinish = this.add.text(-150, y, '+ Add finish panel', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#44ff88',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    addFinish.on('pointerup', () => {
      if (area.misc.finishPanels.length >= 4) {
        showToast(this, 'Max 4 finish panels', '#ff4466');
        return;
      }
      area.misc.finishPanels.push({
        id: `finish-${Date.now()}`,
        scoreThreshold: 5000,
      });
      this.markDirty();
      this.render();
    });
    panel.add(addFinish);
    y += 40;

    panel.add(this.add.text(-150, y, 'Warp holes', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      fontStyle: '700',
      color: '#ffcc00',
    }).setOrigin(0, 0.5));
    y += 28;

    // Only main level manages sub-areas list; sub-area edit can still set warps to siblings.
    if (!this.subAreaId) {
      this.draft.subAreas.forEach((sub, i) => {
        const label = this.add.text(-150, y, `Sub ${i + 1}: ${sub.name}`, {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '13px',
          color: '#ccddee',
        }).setOrigin(0, 0.5);
        panel.add(label);

        const editBtn = this.add.text(40, y, 'EDIT', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          color: '#00d4ff',
          backgroundColor: '#1a1f3a',
          padding: { x: 6, y: 4 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        editBtn.on('pointerup', () => {
          const saved = saveCustomLevel(this.slotIndex, this.draft);
          if (saved) this.draft = saved;
          this.dirty = false;
          this.cameras.main.fadeOut(200, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EditorEditScene', {
              slotIndex: this.slotIndex,
              subAreaId: sub.id,
            });
          });
        });
        panel.add(editBtn);

        const delBtn = this.add.text(100, y, 'DEL', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          color: '#ff4466',
          backgroundColor: '#1a1f3a',
          padding: { x: 6, y: 4 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        delBtn.on('pointerup', () => {
          this.draft.subAreas.splice(i, 1);
          this.draft.misc.warpHoles = this.draft.misc.warpHoles.filter((w) => w.subAreaId !== sub.id);
          this.markDirty();
          this.render();
        });
        panel.add(delBtn);
        y += 30;
      });

      const addSub = this.add.text(-150, y, '+ Add sub-area', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '13px',
        color: '#44ff88',
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      addSub.on('pointerup', () => {
        if (this.draft.subAreas.length >= 8) {
          showToast(this, 'Max 8 sub-areas', '#ff4466');
          return;
        }
        const id = `sub-${Date.now()}`;
        const name = promptText('Sub-area name:', `Sub-Area ${this.draft.subAreas.length + 1}`);
        if (name === null) return;
        this.draft.subAreas.push(createDefaultSubArea(id, name.trim() || `Sub-Area ${this.draft.subAreas.length + 1}`));
        this.markDirty();
        this.render();
      });
      panel.add(addSub);
      y += 36;
    }

    area.misc.warpHoles.forEach((wh, i) => {
      const row = createStepperRow(this, `Warp #${i + 1} score`, wh.scoreThreshold, 500, 0, 999999, (v) => {
        wh.scoreThreshold = v;
        this.markDirty();
      });
      row.setY(y);
      panel.add(row);
      y += 34;

      const targetLabel = this.add.text(-150, y, `→ ${wh.subAreaId}`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        color: '#8899bb',
      }).setOrigin(0, 0.5);
      panel.add(targetLabel);

      const del = this.add.text(120, y - 34, 'DEL', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        color: '#ff4466',
        backgroundColor: '#1a1f3a',
        padding: { x: 6, y: 4 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      del.on('pointerup', () => {
        area.misc.warpHoles.splice(i, 1);
        this.markDirty();
        this.render();
      });
      panel.add(del);
      y += 28;
    });

    const addWarp = this.add.text(-150, y, '+ Add warp hole', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#44ff88',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    addWarp.on('pointerup', () => {
      if (this.draft.subAreas.length === 0) {
        showToast(this, 'Create a sub-area first', '#ff4466');
        return;
      }
      if (area.misc.warpHoles.length >= 8) {
        showToast(this, 'Max 8 warp holes', '#ff4466');
        return;
      }
      const names = this.draft.subAreas.map((s, i) => `${i + 1}:${s.name}`).join(', ');
      const pick = promptText(`Target sub-area index (1-${this.draft.subAreas.length})\n${names}`, '1');
      if (pick === null) return;
      const idx = Math.max(1, Math.min(this.draft.subAreas.length, parseInt(pick, 10) || 1)) - 1;
      const target = this.draft.subAreas[idx];
      if (!target || target.id === this.subAreaId) {
        showToast(this, 'Invalid target', '#ff4466');
        return;
      }
      area.misc.warpHoles.push({
        id: `warp-${Date.now()}`,
        scoreThreshold: 5000,
        subAreaId: target.id,
      });
      this.markDirty();
      this.render();
    });
    panel.add(addWarp);

    this.addBackToMenu();
  }

  private renderSave(): void {
    const panel = this.beginStaticPanel();

    panel.add(this.add.text(0, 0, 'Level name', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#8899bb',
    }).setOrigin(0.5));

    const nameField = createDomTextInput(this, {
      value: this.draft.name,
      width: 240,
      maxLength: 32,
      placeholder: 'Custom Level',
      onChange: (value) => {
        const next = value.trim().slice(0, 32);
        if (next.length > 0) {
          this.draft.name = next;
          this.markDirty();
        }
      },
    });
    // Center the DOM input under the label.
    nameField.container.setY(36);
    nameField.dom.setX(0);
    panel.add(nameField.container);

    panel.add(this.add.text(0, 72, 'Type above to rename', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#556677',
    }).setOrigin(0.5));

    const { container: saveBtn } = createMenuButton(this, {
      label: 'SAVE LEVEL',
      y: GAME_HEIGHT / 2 + 40,
      color: 0x44ff88,
      onClick: () => {
        const typed = nameField.getValue().trim().slice(0, 32);
        if (typed.length > 0) this.draft.name = typed;
        const saved = saveCustomLevel(this.slotIndex, this.draft);
        if (saved) {
          this.draft = saved;
          this.dirty = false;
          showToast(this, 'Saved!', '#44ff88');
          this.cameras.main.fadeOut(250, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.subAreaId) {
              this.scene.start('EditorEditScene', { slotIndex: this.slotIndex });
            } else {
              this.scene.start('EditorHubScene', { selectedSlot: this.slotIndex });
            }
          });
        } else {
          showToast(this, 'Save failed', '#ff4466');
        }
      },
    });
    saveBtn.setX(GAME_WIDTH / 2);
    this.contentRoot!.add(saveBtn);

    this.addBackToMenu();
  }

  private onBack(): void {
    const go = () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.subAreaId) {
          this.scene.start('EditorEditScene', { slotIndex: this.slotIndex });
        } else {
          this.scene.start('EditorHubScene', { selectedSlot: this.slotIndex });
        }
      });
    };

    if (!this.dirty) {
      go();
      return;
    }

    confirmYesNo(this, 'Discard unsaved changes?', () => {
      go();
    });
  }
}
