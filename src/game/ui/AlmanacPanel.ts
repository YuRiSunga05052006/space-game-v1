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

const SCROLL_TOP = 148;
const SCROLL_HEIGHT = 500;
const SECTION_HEADER_HEIGHT = 34;
const ENTRY_HEIGHT = 92;
const ENTRY_GAP = 8;
const TAB_Y = 108;
const TAB_WIDTH = 88;
const TAB_GAP = 6;

export interface AlmanacPanelOptions {
  onBack: () => void;
}

export interface AlmanacPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

function createEntryCard(scene: Phaser.Scene, entry: AlmanacEntry, y: number): Phaser.GameObjects.Container {
  const card = scene.add.container(0, y);

  const bg = scene.add.graphics();
  bg.fillStyle(0x12182a, 0.95);
  bg.fillRoundedRect(16, 0, GAME_WIDTH - 32, ENTRY_HEIGHT - ENTRY_GAP, 8);
  bg.lineStyle(1, 0x223344, 0.9);
  bg.strokeRoundedRect(16, 0, GAME_WIDTH - 32, ENTRY_HEIGHT - ENTRY_GAP, 8);
  card.add(bg);

  const sprite = scene.add.image(52, (ENTRY_HEIGHT - ENTRY_GAP) / 2, entry.textureKey);
  sprite.setScale(entry.textureScale ?? 1);
  card.add(sprite);

  const textX = 92;
  card.add(scene.add.text(textX, 10, entry.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }));

  if (entry.subtitle) {
    card.add(scene.add.text(textX, 28, entry.subtitle, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      color: '#667788',
    }));
  }

  const descY = entry.subtitle ? 44 : 30;
  card.add(scene.add.text(textX, descY, entry.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    color: '#8899aa',
    wordWrap: { width: GAME_WIDTH - textX - 24 },
  }));

  card.add(scene.add.text(textX, (ENTRY_HEIGHT - ENTRY_GAP) - 18, entry.stats, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#ffcc00',
  }));

  return card;
}

function buildContentHeight(page: AlmanacPage): number {
  let height = 0;
  for (const section of getVisibleSectionsForPage(page)) {
    height += SECTION_HEADER_HEIGHT;
    height += getVisibleEntriesForPage(page).filter((e) => e.category === section.category).length * ENTRY_HEIGHT;
  }
  return height;
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

  root.add(scene.add.text(GAME_WIDTH / 2, 92, 'Drag to scroll', {
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
  let dragging = false;
  let dragStartY = 0;
  let scrollStartY = 0;

  const applyScroll = () => {
    content.setY(SCROLL_TOP - scrollY);
  };

  const rebuildContent = () => {
    content.removeAll(true);
    let y = 0;
    for (const section of getVisibleSectionsForPage(currentPage)) {
      const header = scene.add.text(GAME_WIDTH / 2, y + 16, section.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        fontStyle: '700',
        color: '#8899bb',
      }).setOrigin(0.5, 0.5);
      content.add(header);
      y += SECTION_HEADER_HEIGHT;

      const entries = getVisibleEntriesForPage(currentPage).filter((entry) => entry.category === section.category);
      for (const entry of entries) {
        content.add(createEntryCard(scene, entry, y));
        y += ENTRY_HEIGHT;
      }
    }
    scrollY = 0;
    maxScroll = Math.max(0, buildContentHeight(currentPage) - SCROLL_HEIGHT);
    applyScroll();
  };

  const drawTabs = () => {
    tabContainers.forEach((tab) => tab.destroy());
    tabContainers.length = 0;

    const totalWidth = ALMANAC_PAGES.length * TAB_WIDTH + (ALMANAC_PAGES.length - 1) * TAB_GAP;
    let tabX = GAME_WIDTH / 2 - totalWidth / 2 + TAB_WIDTH / 2;

    for (const page of ALMANAC_PAGES) {
      const unlocked = isAlmanacPageUnlocked(page.id);
      const active = page.id === currentPage;
      const tab = scene.add.container(tabX, TAB_Y);
      const bg = scene.add.graphics();
      const color = active ? 0x00d4ff : unlocked ? 0x334455 : 0x222233;
      bg.fillStyle(color, active ? 0.25 : 0.15);
      bg.fillRoundedRect(-TAB_WIDTH / 2, -14, TAB_WIDTH, 28, 6);
      bg.lineStyle(1, active ? 0x00d4ff : 0x445566, active ? 1 : 0.6);
      bg.strokeRoundedRect(-TAB_WIDTH / 2, -14, TAB_WIDTH, 28, 6);
      tab.add(bg);

      const label = scene.add.text(0, 0, page.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '8px',
        fontStyle: '700',
        color: unlocked ? (active ? '#00d4ff' : '#8899aa') : '#445566',
      }).setOrigin(0.5);
      tab.add(label);

      if (unlocked) {
        tab.setInteractive(
          new Phaser.Geom.Rectangle(-TAB_WIDTH / 2, -14, TAB_WIDTH, 28),
          Phaser.Geom.Rectangle.Contains,
        );
        tab.input!.cursor = 'pointer';
        tab.on('pointerup', () => {
          if (currentPage !== page.id) {
            currentPage = page.id;
            drawTabs();
            rebuildContent();
          }
        });
      }

      root.add(tab);
      tabContainers.push(tab);
      tabX += TAB_WIDTH + TAB_GAP;
    }
  };

  drawTabs();
  rebuildContent();

  const isInScrollArea = (pointer: Phaser.Input.Pointer) => (
    pointer.y >= SCROLL_TOP &&
    pointer.y <= SCROLL_TOP + SCROLL_HEIGHT &&
    pointer.x >= 0 &&
    pointer.x <= GAME_WIDTH
  );

  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!isInScrollArea(pointer)) return;
    dragging = true;
    dragStartY = pointer.y;
    scrollStartY = scrollY;
  };

  const onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!dragging) return;
    scrollY = Phaser.Math.Clamp(scrollStartY + (dragStartY - pointer.y), 0, maxScroll);
    applyScroll();
  };

  const stopDragging = () => {
    dragging = false;
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', stopDragging);
  scene.input.on('pointerupoutside', stopDragging);

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT - 72,
    onClick: () => options.onBack(),
  });
  backBtn.setX(GAME_WIDTH / 2);
  root.add(backBtn);

  const destroy = () => {
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('pointerup', stopDragging);
    scene.input.off('pointerupoutside', stopDragging);
    maskShape.destroy();
    root.destroy();
  };

  return { root, destroy };
}
