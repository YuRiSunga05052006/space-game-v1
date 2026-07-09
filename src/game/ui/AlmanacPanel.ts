import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getVisibleAlmanacEntries, getVisibleAlmanacSections, type AlmanacEntry } from '../almanac';
import { createMenuButton } from './MenuButtons';

const SCROLL_TOP = 118;
const SCROLL_HEIGHT = 530;
const SECTION_HEADER_HEIGHT = 34;
const ENTRY_HEIGHT = 92;
const ENTRY_GAP = 8;

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

function buildContentHeight(): number {
  let height = 0;
  for (const section of getVisibleAlmanacSections()) {
    height += SECTION_HEADER_HEIGHT;
    height += getVisibleAlmanacEntries().filter((e) => e.category === section.category).length * ENTRY_HEIGHT;
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

  let y = 0;
  for (const section of getVisibleAlmanacSections()) {
    const header = scene.add.text(GAME_WIDTH / 2, y + 16, section.label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      fontStyle: '700',
      color: '#8899bb',
    }).setOrigin(0.5, 0.5);
    content.add(header);
    y += SECTION_HEADER_HEIGHT;

    const entries = getVisibleAlmanacEntries().filter((entry) => entry.category === section.category);
    for (const entry of entries) {
      content.add(createEntryCard(scene, entry, y));
      y += ENTRY_HEIGHT;
    }
  }

  const contentHeight = buildContentHeight();
  const maxScroll = Math.max(0, contentHeight - SCROLL_HEIGHT);
  let scrollY = 0;
  let dragging = false;
  let dragStartY = 0;
  let scrollStartY = 0;

  const applyScroll = () => {
    content.setY(SCROLL_TOP - scrollY);
  };

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
