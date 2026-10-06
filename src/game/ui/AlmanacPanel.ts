import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  ALMANAC_PAGES,
  getVisibleEntriesForPage,
  getVisibleSectionsForPage,
  isAlmanacPageUnlocked,
  type AlmanacEntry,
  type AlmanacPage,
} from '../almanac';
import { createMenuButton } from './MenuButtons';
import { playSfx } from '../audioManager';

const SCROLL_TOP = 172;
const SCROLL_HEIGHT = 476;
const SECTION_HEADER_HEIGHT = 28;
const SECTION_GAP = 16;
const GRID_COLS = 4;
const CELL = 72;
const CELL_GAP = 10;
const ICON_MAX = 52;
const OVERVIEW_ICON_MAX = 96;
const TAP_SLOP = 10;
const TAB_Y = 108;
const TAB_ROW_HEIGHT = 30;
const TAB_GAP = 4;
const TAB_SIDE_PAD = 10;
const TABS_PER_ROW = 5;
const GRID_WIDTH = GRID_COLS * CELL + (GRID_COLS - 1) * CELL_GAP;
const GRID_LEFT = (GAME_WIDTH - GRID_WIDTH) / 2;

export interface AlmanacPanelOptions {
  onBack: () => void;
}

export interface AlmanacPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

function fitImage(image: Phaser.GameObjects.Image, maxSize: number): void {
  const width = image.width;
  const height = image.height;
  if (width <= 0 || height <= 0) return;
  image.setScale(Math.min(maxSize / width, maxSize / height));
}

function createTile(
  scene: Phaser.Scene,
  entry: AlmanacEntry,
  x: number,
  y: number,
  onSelect: (pointer: Phaser.Input.Pointer) => void,
): Phaser.GameObjects.Container {
  const tile = scene.add.container(x, y);
  const bg = scene.add.graphics();

  const drawBg = (hover: boolean) => {
    bg.clear();
    bg.fillStyle(0x12182a, hover ? 1 : 0.95);
    bg.fillRoundedRect(-CELL / 2, -CELL / 2, CELL, CELL, 8);
    bg.lineStyle(1.5, hover ? 0x00d4ff : 0x223344, hover ? 1 : 0.9);
    bg.strokeRoundedRect(-CELL / 2, -CELL / 2, CELL, CELL, 8);
  };
  drawBg(false);

  const sprite = scene.add.image(0, 0, entry.textureKey);
  fitImage(sprite, ICON_MAX);

  tile.add([bg, sprite]);
  tile.setInteractive(
    new Phaser.Geom.Rectangle(-CELL / 2, -CELL / 2, CELL, CELL),
    Phaser.Geom.Rectangle.Contains,
  );
  tile.input!.cursor = 'pointer';
  tile.on('pointerover', () => drawBg(true));
  tile.on('pointerout', () => drawBg(false));
  tile.on('pointerup', (pointer: Phaser.Input.Pointer) => onSelect(pointer));

  return tile;
}

export function createAlmanacPanel(
  scene: Phaser.Scene,
  depth: number,
  options: AlmanacPanelOptions,
): AlmanacPanelResult {
  const root = scene.add.container(0, 0).setDepth(depth);

  root.add(scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.85,
  ));

  root.add(scene.add.text(GAME_WIDTH / 2, 56, 'ALMANAC', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '32px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5));

  root.add(scene.add.text(GAME_WIDTH / 2, 92, 'Tap an image · drag to scroll', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    color: '#556677',
  }).setOrigin(0.5));

  const maskShape = scene.make.graphics({}, false);
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(0, SCROLL_TOP, GAME_WIDTH, SCROLL_HEIGHT);
  const mask = maskShape.createGeometryMask();

  const scrollViewport = scene.add.container(0, 0);
  scrollViewport.setMask(mask);
  root.add(scrollViewport);

  const content = scene.add.container(0, SCROLL_TOP);
  scrollViewport.add(content);

  const tabContainers: Phaser.GameObjects.Container[] = [];
  let currentPage: AlmanacPage = 'shared';
  let scrollY = 0;
  let maxScroll = 0;
  let draggingGrid = false;
  let dragStartY = 0;
  let scrollStartY = 0;
  let downX = 0;
  let downY = 0;
  let overviewOpen = false;
  let suppressBackdropClose = false;
  let overviewLayer: Phaser.GameObjects.Container | undefined;
  let overviewText: Phaser.GameObjects.Container | undefined;
  let overviewTextBaseY = 0;
  let overviewTextScroll = 0;
  let overviewTextMaxScroll = 0;
  let draggingOverview = false;
  let overviewCard = new Phaser.Geom.Rectangle();

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT - 72,
    onClick: () => {
      if (overviewOpen) {
        closeOverview();
        return;
      }
      options.onBack();
    },
  });
  backBtn.setX(GAME_WIDTH / 2);

  const applyScroll = () => {
    content.setY(SCROLL_TOP - scrollY);
  };

  const applyOverviewTextScroll = () => {
    overviewText?.setY(overviewTextBaseY - overviewTextScroll);
  };

  const isTap = (pointer: Phaser.Input.Pointer) => (
    Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y) <= TAP_SLOP
  );

  const isInScrollArea = (pointer: Phaser.Input.Pointer) => (
    pointer.y >= SCROLL_TOP &&
    pointer.y <= SCROLL_TOP + SCROLL_HEIGHT &&
    pointer.x >= 0 &&
    pointer.x <= GAME_WIDTH
  );

  const closeOverview = () => {
    overviewLayer?.destroy();
    overviewLayer = undefined;
    overviewText = undefined;
    overviewOpen = false;
    suppressBackdropClose = false;
    draggingOverview = false;
    overviewTextScroll = 0;
    overviewTextMaxScroll = 0;
  };

  const openOverview = (entry: AlmanacEntry) => {
    closeOverview();
    overviewOpen = true;
    suppressBackdropClose = true;

    const layer = scene.add.container(0, 0);
    overviewLayer = layer;
    root.add(layer);
    root.add(backBtn);

    const backdrop = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.72,
    );
    backdrop.setInteractive();
    backdrop.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (suppressBackdropClose || !isTap(pointer)) return;
      playSfx('ui');
      closeOverview();
    });
    layer.add(backdrop);

    const cardW = GAME_WIDTH - 36;
    const textW = cardW - 36;
    const textStyle = {
      fontFamily: 'Orbitron, sans-serif',
      align: 'center' as const,
      wordWrap: { width: textW },
    };

    const name = scene.add.text(GAME_WIDTH / 2, 0, entry.name, {
      ...textStyle,
      fontSize: '16px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(0.5, 0);

    const subtitle = entry.subtitle
      ? scene.add.text(GAME_WIDTH / 2, 0, entry.subtitle, {
        ...textStyle,
        fontSize: '10px',
        color: '#667788',
      }).setOrigin(0.5, 0)
      : undefined;

    const description = scene.add.text(GAME_WIDTH / 2, 0, entry.description, {
      ...textStyle,
      fontSize: '11px',
      color: '#8899aa',
    }).setOrigin(0.5, 0);

    const stats = scene.add.text(GAME_WIDTH / 2, 0, entry.stats, {
      ...textStyle,
      fontSize: '11px',
      fontStyle: '700',
      color: '#ffcc00',
    }).setOrigin(0.5, 0);

    const padY = 16;
    const spriteSlot = 104;
    const closeBlock = 64;
    const gap = 10;
    let textH = name.height + gap + description.height + gap + stats.height;
    if (subtitle) textH += subtitle.height + 6;
    const maxCardH = GAME_HEIGHT - 96 - 108;
    const naturalH = padY + spriteSlot + textH + closeBlock + padY;
    const cardH = Math.min(naturalH, maxCardH);
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = 96 + (maxCardH - cardH) / 2;
    overviewCard.setTo(cardX, cardY, cardW, cardH);

    const cardBg = scene.add.graphics();
    cardBg.fillStyle(0x12182a, 0.98);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 12);
    cardBg.lineStyle(2, 0x00d4ff, 0.85);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 12);
    layer.add(cardBg);

    const cardBlock = scene.add.zone(GAME_WIDTH / 2, cardY + cardH / 2, cardW, cardH);
    cardBlock.setInteractive();
    layer.add(cardBlock);

    const sprite = scene.add.image(GAME_WIDTH / 2, cardY + padY + spriteSlot / 2, entry.textureKey);
    fitImage(sprite, OVERVIEW_ICON_MAX);
    layer.add(sprite);

    const textTop = cardY + padY + spriteSlot;
    const textVisibleH = cardH - padY - spriteSlot - closeBlock - padY;
    overviewTextMaxScroll = Math.max(0, textH - textVisibleH);
    overviewTextScroll = 0;
    overviewTextBaseY = textTop;

    const textColumn = scene.add.container(0, textTop);
    overviewText = textColumn;
    let cursor = 0;
    name.setY(cursor);
    textColumn.add(name);
    cursor += name.height + (subtitle ? 6 : gap);
    if (subtitle) {
      subtitle.setY(cursor);
      textColumn.add(subtitle);
      cursor += subtitle.height + gap;
    }
    description.setY(cursor);
    textColumn.add(description);
    cursor += description.height + gap;
    stats.setY(cursor);
    textColumn.add(stats);
    layer.add(textColumn);

    if (overviewTextMaxScroll > 0) {
      const textMaskShape = scene.make.graphics({}, false);
      textMaskShape.fillStyle(0xffffff);
      textMaskShape.fillRect(cardX, textTop, cardW, textVisibleH);
      textColumn.setMask(textMaskShape.createGeometryMask());
      layer.once(Phaser.GameObjects.Events.DESTROY, () => textMaskShape.destroy());
    }

    const { container: closeBtn } = createMenuButton(scene, {
      label: 'CLOSE',
      y: cardY + cardH - 40,
      onClick: () => closeOverview(),
    });
    closeBtn.setX(GAME_WIDTH / 2);
    layer.add(closeBtn);
  };

  const rebuildContent = () => {
    content.removeAll(true);
    let y = 4;
    for (const section of getVisibleSectionsForPage(currentPage)) {
      const header = scene.add.text(GAME_WIDTH / 2, y + 12, section.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        fontStyle: '700',
        color: '#8899bb',
      }).setOrigin(0.5, 0.5);
      content.add(header);
      y += SECTION_HEADER_HEIGHT;

      const entries = getVisibleEntriesForPage(currentPage).filter((entry) => entry.category === section.category);
      entries.forEach((entry, index) => {
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        const x = GRID_LEFT + CELL / 2 + col * (CELL + CELL_GAP);
        const tileY = y + CELL / 2 + row * (CELL + CELL_GAP);
        content.add(createTile(scene, entry, x, tileY, (pointer) => {
          if (overviewOpen || !isTap(pointer) || !isInScrollArea(pointer)) return;
          playSfx('ui');
          openOverview(entry);
        }));
      });

      const rows = Math.max(1, Math.ceil(entries.length / GRID_COLS));
      y += rows * CELL + (rows - 1) * CELL_GAP + SECTION_GAP;
    }

    scrollY = 0;
    maxScroll = Math.max(0, y - SCROLL_HEIGHT);
    applyScroll();
  };

  const drawTabs = () => {
    tabContainers.forEach((tab) => tab.destroy());
    tabContainers.length = 0;

    const available = GAME_WIDTH - TAB_SIDE_PAD * 2;
    const cols = Math.min(TABS_PER_ROW, ALMANAC_PAGES.length);
    const tabWidth = Math.floor((available - (cols - 1) * TAB_GAP) / cols);

    ALMANAC_PAGES.forEach((page, index) => {
      const row = Math.floor(index / TABS_PER_ROW);
      const col = index % TABS_PER_ROW;
      const rowPages = Math.min(TABS_PER_ROW, ALMANAC_PAGES.length - row * TABS_PER_ROW);
      const rowWidth = rowPages * tabWidth + (rowPages - 1) * TAB_GAP;
      const tabX = GAME_WIDTH / 2 - rowWidth / 2 + tabWidth / 2 + col * (tabWidth + TAB_GAP);
      const tabY = TAB_Y + row * TAB_ROW_HEIGHT;

      const unlocked = isAlmanacPageUnlocked(page.id);
      const active = page.id === currentPage;
      const tab = scene.add.container(tabX, tabY);
      const bg = scene.add.graphics();
      const color = active ? 0x00d4ff : unlocked ? 0x334455 : 0x222233;
      bg.fillStyle(color, active ? 0.25 : 0.15);
      bg.fillRoundedRect(-tabWidth / 2, -12, tabWidth, 24, 6);
      bg.lineStyle(1, active ? 0x00d4ff : 0x445566, active ? 1 : 0.6);
      bg.strokeRoundedRect(-tabWidth / 2, -12, tabWidth, 24, 6);
      tab.add(bg);

      const label = scene.add.text(0, 0, page.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '7px',
        fontStyle: '700',
        color: unlocked ? (active ? '#00d4ff' : '#8899aa') : '#445566',
      }).setOrigin(0.5);
      tab.add(label);

      if (unlocked) {
        tab.setInteractive(
          new Phaser.Geom.Rectangle(-tabWidth / 2, -12, tabWidth, 24),
          Phaser.Geom.Rectangle.Contains,
        );
        tab.input!.cursor = 'pointer';
        tab.on('pointerup', () => {
          if (overviewOpen || currentPage === page.id) return;
          playSfx('ui');
          currentPage = page.id;
          drawTabs();
          rebuildContent();
        });
      }

      root.add(tab);
      tabContainers.push(tab);
    });
  };

  drawTabs();
  rebuildContent();
  root.add(backBtn);

  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    downX = pointer.x;
    downY = pointer.y;
    if (overviewOpen) {
      suppressBackdropClose = false;
      if (overviewTextMaxScroll > 0 && overviewCard.contains(pointer.x, pointer.y)) {
        draggingOverview = true;
        dragStartY = pointer.y;
        scrollStartY = overviewTextScroll;
      }
      return;
    }
    if (!isInScrollArea(pointer)) return;
    draggingGrid = true;
    dragStartY = pointer.y;
    scrollStartY = scrollY;
  };

  const onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (draggingOverview) {
      overviewTextScroll = Phaser.Math.Clamp(
        scrollStartY + (dragStartY - pointer.y),
        0,
        overviewTextMaxScroll,
      );
      applyOverviewTextScroll();
      return;
    }
    if (!draggingGrid) return;
    scrollY = Phaser.Math.Clamp(scrollStartY + (dragStartY - pointer.y), 0, maxScroll);
    applyScroll();
  };

  const stopDragging = () => {
    draggingGrid = false;
    draggingOverview = false;
  };

  const onWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    if (overviewOpen) {
      if (overviewTextMaxScroll <= 0 || !overviewCard.contains(pointer.x, pointer.y)) return;
      overviewTextScroll = Phaser.Math.Clamp(overviewTextScroll + deltaY * 0.45, 0, overviewTextMaxScroll);
      applyOverviewTextScroll();
      return;
    }
    if (maxScroll <= 0 || !isInScrollArea(pointer)) return;
    scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.45, 0, maxScroll);
    applyScroll();
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', stopDragging);
  scene.input.on('pointerupoutside', stopDragging);
  scene.input.on('wheel', onWheel);

  const destroy = () => {
    closeOverview();
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('pointerup', stopDragging);
    scene.input.off('pointerupoutside', stopDragging);
    scene.input.off('wheel', onWheel);
    maskShape.destroy();
    root.destroy();
  };

  return { root, destroy };
}
