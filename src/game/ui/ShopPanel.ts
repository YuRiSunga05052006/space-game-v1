import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { formatCoinsLabel, getCoins } from '../coins';
import {
  equipSkin,
  getEquippedSkinId,
  getShipTextureKey,
  isSkinOwned,
  PLAYER_SKINS,
  purchaseSkin,
  type PlayerSkinDefinition,
} from '../playerSkins';
import {
  equipShape,
  getEquippedShapeId,
  isShapeOwned,
  PLAYER_SHAPES,
  purchaseShape,
  type PlayerShapeDefinition,
  type RocketShapeId,
} from '../playerShapes';
import {
  getDeathBombChargePrice,
  getInventoryCount,
  getPowerUpCardAction,
  getPowerUpActionPrice,
  getPowerUpLevel,
  getUpgradePrice,
  isDeathBombUnlocked,
  POWER_UPS,
  purchaseDeathBombCharge,
  purchaseInventoryItem,
  purchasePowerUp,
  type PowerUpDefinition,
  type PowerUpCardAction,
} from '../playerPowerUps';
import { MAX_POWER_UP_LEVEL } from '../powerUpEffects';
import { createMenuButton } from './MenuButtons';
import { playSfx } from '../audioManager';
import {
  getRainbowCyclePhase,
  getRocketSkinPalette,
  makeRainbowPalette,
  sampleRainbowColor,
} from '../rocketAppearances';
import {
  drawLaunchStackPreview,
  drawShapeAssembled,
  type StackPreviewIteration,
} from '../rocketShapes';

const POWERUPS_SCROLL_TOP = 150;
const POWERUPS_SCROLL_HEIGHT = 500;
const SKINS_SUBTAB_Y = 294;
const SKINS_SCROLL_TOP = 318;
const SKINS_SCROLL_HEIGHT = GAME_HEIGHT - SKINS_SCROLL_TOP - 100;
const HERO_CENTER_Y = 200;
const HERO_SCALE = 0.72;
const STACK_ITER_MS = 1400;
const CARD_HEIGHT = 108;
const CARD_GAP = 10;
const DEATH_BOMB_CARD_EXTRA = 14;
const TAB_Y = 108;
const TAB_WIDTH = 120;
const TAB_GAP = 12;
const SUBTAB_WIDTH = 148;
const SUBTAB_GAP = 10;

type ShopTab = 'skins' | 'powerUps';
type SkinsSubTab = 'shipSkins' | 'shipShapes';

export interface ShopPanelOptions {
  onBack: () => void;
}

export interface ShopPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

type SkinCardAction = 'buy' | 'equip' | 'equipped' | 'locked';

function getSkinAction(skin: PlayerSkinDefinition): SkinCardAction {
  const equippedId = getEquippedSkinId();
  if (equippedId === skin.id) return 'equipped';
  if (isSkinOwned(skin.id)) return 'equip';
  return 'buy';
}

function getShapeAction(shape: PlayerShapeDefinition): SkinCardAction {
  const equippedId = getEquippedShapeId();
  if (equippedId === shape.id) return 'equipped';
  if (isShapeOwned(shape.id)) return 'equip';
  return 'buy';
}

function getCatalogActionLabel(price: number, action: SkinCardAction): string {
  switch (action) {
    case 'equipped':
      return 'EQUIPPED';
    case 'equip':
      return 'EQUIP';
    case 'buy':
      return price === 0 ? 'FREE' : `BUY ${price}`;
    default:
      return 'LOCKED';
  }
}

function getSkinActionLabel(skin: PlayerSkinDefinition, action: SkinCardAction): string {
  return getCatalogActionLabel(skin.price, action);
}

function getShapeActionLabel(shape: PlayerShapeDefinition, action: SkinCardAction): string {
  return getCatalogActionLabel(shape.price, action);
}

function getPowerUpActionLabel(def: PowerUpDefinition, action: PowerUpCardAction): string {
  const price = getPowerUpActionPrice(def);
  switch (action) {
    case 'max':
      return 'MAX LEVEL';
    case 'buy':
      return price === null ? 'LOCKED' : `BUY ${price}`;
    case 'upgrade': {
      const level = getPowerUpLevel(def.id as 'shield' | 'invisibility' | 'fuelTank' | 'deathBomb');
      return price === null ? 'LOCKED' : `UP Lv ${level + 1}`;
    }
    case 'buyInventory':
      return price === null ? 'LOCKED' : `BUY +1 (${price})`;
    default:
      return 'LOCKED';
  }
}

function getActionColor(action: string, affordable: boolean): number {
  if (action === 'equipped' || action === 'max') return 0x33aa66;
  if (action === 'equip') return 0x00d4ff;
  if ((action === 'buy' || action === 'upgrade' || action === 'buyInventory') && affordable) return 0xffcc00;
  return 0x556677;
}

function createSkinCard(
  scene: Phaser.Scene,
  skin: PlayerSkinDefinition,
  y: number,
  previewShapeId: RocketShapeId,
  selected: boolean,
  onSelect: () => void,
  onAction: () => void,
  rainbowCardPreviews: { gfx: Phaser.GameObjects.Graphics; shapeId: RocketShapeId }[],
): Phaser.GameObjects.Container {
  const card = scene.add.container(0, y);
  const cardH = CARD_HEIGHT - CARD_GAP;
  const action = getSkinAction(skin);
  const affordable = skin.price === 0 || getCoins() >= skin.price;
  const actionColor = getActionColor(action, affordable);
  const isEquipped = action === 'equipped';
  const borderColor = selected ? 0x00d4ff : isEquipped ? 0x33aa66 : 0x223344;
  const borderWidth = selected || isEquipped ? 2 : 1;

  const bg = scene.add.graphics();
  bg.fillStyle(0x12182a, 0.95);
  bg.fillRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  bg.lineStyle(borderWidth, borderColor, selected || isEquipped ? 1 : 0.9);
  bg.strokeRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  card.add(bg);

  const preview = skin.id === 'electricRainbow'
    ? (() => {
      const previewGfx = scene.add.graphics();
      previewGfx.setPosition(52, cardH / 2);
      previewGfx.setScale(1.4);
      rainbowCardPreviews.push({ gfx: previewGfx, shapeId: previewShapeId });
      return previewGfx;
    })()
    : scene.add.image(52, cardH / 2, getShipTextureKey(previewShapeId, skin.id)).setScale(1.4);
  card.add(preview);

  const textX = 92;
  const descY = skin.special ? 40 : 30;

  card.add(scene.add.text(textX, 12, skin.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }));

  if (skin.special) {
    card.add(scene.add.text(textX, 28, 'SPECIAL · Survival bonus', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '8px',
      fontStyle: '700',
      color: '#667788',
    }));
  }

  card.add(scene.add.text(textX, descY, skin.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    color: '#8899aa',
    wordWrap: { width: GAME_WIDTH - textX - 110 },
  }));

  const priceLabel = skin.price === 0 ? 'Included' : `${skin.price} coins`;
  card.add(scene.add.text(textX, cardH - 22, priceLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#ffcc00',
  }));

  const actionLabel = getSkinActionLabel(skin, action);
  const actionBtn = scene.add.container(GAME_WIDTH - 72, cardH / 2);
  const actionBg = scene.add.graphics();
  const drawActionBg = (fillAlpha: number) => {
    actionBg.clear();
    const enabled = action !== 'equipped' && (action !== 'buy' || affordable);
    actionBg.fillStyle(actionColor, enabled ? fillAlpha : 0.12);
    actionBg.fillRoundedRect(-42, -16, 84, 32, 8);
    actionBg.lineStyle(1, actionColor, enabled ? 0.9 : 0.35);
    actionBg.strokeRoundedRect(-42, -16, 84, 32, 8);
  };
  drawActionBg(0.2);

  const actionText = scene.add.text(0, 0, actionLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    fontStyle: '700',
    color: `#${actionColor.toString(16).padStart(6, '0')}`,
  }).setOrigin(0.5);

  actionBtn.add([actionBg, actionText]);

  const canInteract = action !== 'equipped' && (action !== 'buy' || affordable);
  if (canInteract) {
    actionBtn.setInteractive(
      new Phaser.Geom.Rectangle(-42, -16, 84, 32),
      Phaser.Geom.Rectangle.Contains,
    );
    actionBtn.input!.cursor = 'pointer';
    actionBtn.on('pointerover', () => drawActionBg(0.35));
    actionBtn.on('pointerout', () => drawActionBg(0.2));
    actionBtn.on('pointerup', () => {
      playSfx('ui');
      onAction();
    });
  }

  card.add(actionBtn);

  const selectZone = scene.add.zone(16, 0, GAME_WIDTH - 148, cardH).setOrigin(0, 0);
  selectZone.setInteractive({ useHandCursor: true });
  selectZone.on('pointerup', () => {
    playSfx('ui');
    onSelect();
  });
  card.add(selectZone);

  return card;
}

function createShapeCard(
  scene: Phaser.Scene,
  shape: PlayerShapeDefinition,
  y: number,
  previewSkinId: string,
  selected: boolean,
  onSelect: () => void,
  onAction: () => void,
  rainbowCardPreviews: { gfx: Phaser.GameObjects.Graphics; shapeId: RocketShapeId }[],
): Phaser.GameObjects.Container {
  const card = scene.add.container(0, y);
  const cardH = CARD_HEIGHT - CARD_GAP;
  const action = getShapeAction(shape);
  const affordable = shape.price === 0 || getCoins() >= shape.price;
  const actionColor = getActionColor(action, affordable);
  const isEquipped = action === 'equipped';
  const borderColor = selected ? 0x00d4ff : isEquipped ? 0x33aa66 : 0x223344;
  const borderWidth = selected || isEquipped ? 2 : 1;

  const bg = scene.add.graphics();
  bg.fillStyle(0x12182a, 0.95);
  bg.fillRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  bg.lineStyle(borderWidth, borderColor, selected || isEquipped ? 1 : 0.9);
  bg.strokeRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  card.add(bg);

  const preview = previewSkinId === 'electricRainbow'
    ? (() => {
      const previewGfx = scene.add.graphics();
      previewGfx.setPosition(52, cardH / 2);
      previewGfx.setScale(1.4);
      rainbowCardPreviews.push({ gfx: previewGfx, shapeId: shape.id });
      return previewGfx;
    })()
    : scene.add.image(52, cardH / 2, getShipTextureKey(shape.id, previewSkinId)).setScale(1.4);
  card.add(preview);

  const textX = 92;
  card.add(scene.add.text(textX, 12, shape.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }));

  card.add(scene.add.text(textX, 30, shape.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    color: '#8899aa',
    wordWrap: { width: GAME_WIDTH - textX - 110 },
  }));

  const priceLabel = shape.price === 0 ? 'Included' : `${shape.price} coins`;
  card.add(scene.add.text(textX, cardH - 22, priceLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#ffcc00',
  }));

  const actionLabel = getShapeActionLabel(shape, action);
  const actionBtn = scene.add.container(GAME_WIDTH - 72, cardH / 2);
  const actionBg = scene.add.graphics();
  const drawActionBg = (fillAlpha: number) => {
    actionBg.clear();
    const enabled = action !== 'equipped' && (action !== 'buy' || affordable);
    actionBg.fillStyle(actionColor, enabled ? fillAlpha : 0.12);
    actionBg.fillRoundedRect(-42, -16, 84, 32, 8);
    actionBg.lineStyle(1, actionColor, enabled ? 0.9 : 0.35);
    actionBg.strokeRoundedRect(-42, -16, 84, 32, 8);
  };
  drawActionBg(0.2);

  const actionText = scene.add.text(0, 0, actionLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    fontStyle: '700',
    color: `#${actionColor.toString(16).padStart(6, '0')}`,
  }).setOrigin(0.5);

  actionBtn.add([actionBg, actionText]);

  const canInteract = action !== 'equipped' && (action !== 'buy' || affordable);
  if (canInteract) {
    actionBtn.setInteractive(
      new Phaser.Geom.Rectangle(-42, -16, 84, 32),
      Phaser.Geom.Rectangle.Contains,
    );
    actionBtn.input!.cursor = 'pointer';
    actionBtn.on('pointerover', () => drawActionBg(0.35));
    actionBtn.on('pointerout', () => drawActionBg(0.2));
    actionBtn.on('pointerup', () => {
      playSfx('ui');
      onAction();
    });
  }

  card.add(actionBtn);

  const selectZone = scene.add.zone(16, 0, GAME_WIDTH - 148, cardH).setOrigin(0, 0);
  selectZone.setInteractive({ useHandCursor: true });
  selectZone.on('pointerup', () => {
    playSfx('ui');
    onSelect();
  });
  card.add(selectZone);

  return card;
}

function createPowerUpCard(
  scene: Phaser.Scene,
  def: PowerUpDefinition,
  y: number,
  onAction: () => void,
): Phaser.GameObjects.Container {
  const card = scene.add.container(0, y);
  const cardH = CARD_HEIGHT - CARD_GAP;
  const action = getPowerUpCardAction(def);
  const price = getPowerUpActionPrice(def) ?? 0;
  const affordable = action === 'max' || getCoins() >= price;
  const actionColor = getActionColor(action, affordable);
  const isMax = action === 'max';

  const bg = scene.add.graphics();
  bg.fillStyle(0x12182a, 0.95);
  bg.fillRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  bg.lineStyle(isMax ? 2 : 1, isMax ? 0x33aa66 : 0x223344, isMax ? 1 : 0.9);
  bg.strokeRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  card.add(bg);

  const preview = scene.add.image(52, cardH / 2, def.textureKey);
  preview.setDisplaySize(36, 36);
  card.add(preview);

  const textX = 92;
  card.add(scene.add.text(textX, 8, def.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }));

  card.add(scene.add.text(textX, 24, def.modeTag, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '8px',
    fontStyle: '700',
    color: '#667788',
  }));

  card.add(scene.add.text(textX, 36, def.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    color: '#8899aa',
    wordWrap: { width: GAME_WIDTH - textX - 110 },
  }));

  let statusLabel = '';
  if (def.kind === 'upgradable') {
    const level = getPowerUpLevel(def.id as 'shield' | 'invisibility' | 'fuelTank');
    statusLabel = level === 0
      ? 'Not owned'
      : level >= MAX_POWER_UP_LEVEL
        ? `Level ${level} · Max`
        : `Level ${level} · Next ${price} coins`;
  } else {
    const count = getInventoryCount(def.id as 'engine' | 'hyperdrive');
    statusLabel = count === 0 ? 'No charges owned' : `${count} charge${count === 1 ? '' : 's'} owned`;
  }

  card.add(scene.add.text(textX, cardH - 22, statusLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#ffcc00',
  }));

  const actionLabel = getPowerUpActionLabel(def, action);
  const actionBtn = scene.add.container(GAME_WIDTH - 72, cardH / 2);
  const actionBg = scene.add.graphics();
  const drawActionBg = (fillAlpha: number) => {
    actionBg.clear();
    const enabled = action !== 'max' && affordable;
    actionBg.fillStyle(actionColor, enabled ? fillAlpha : 0.12);
    actionBg.fillRoundedRect(-42, -16, 84, 32, 8);
    actionBg.lineStyle(1, actionColor, enabled ? 0.9 : 0.35);
    actionBg.strokeRoundedRect(-42, -16, 84, 32, 8);
  };
  drawActionBg(0.2);

  const actionText = scene.add.text(0, 0, actionLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: action === 'buyInventory' ? '8px' : '10px',
    fontStyle: '700',
    color: `#${actionColor.toString(16).padStart(6, '0')}`,
  }).setOrigin(0.5);

  actionBtn.add([actionBg, actionText]);

  const canInteract = action !== 'max' && affordable;
  if (canInteract) {
    actionBtn.setInteractive(
      new Phaser.Geom.Rectangle(-42, -16, 84, 32),
      Phaser.Geom.Rectangle.Contains,
    );
    actionBtn.input!.cursor = 'pointer';
    actionBtn.on('pointerover', () => drawActionBg(0.35));
    actionBtn.on('pointerout', () => drawActionBg(0.2));
    actionBtn.on('pointerup', () => {
      playSfx('ui');
      onAction();
    });
  }

  card.add(actionBtn);
  return card;
}

function createDeathBombCard(
  scene: Phaser.Scene,
  y: number,
  onRebuild: () => void,
): Phaser.GameObjects.Container {
  const def = POWER_UPS.find((p) => p.id === 'deathBomb')!;
  const card = scene.add.container(0, y);
  const cardH = CARD_HEIGHT - CARD_GAP + DEATH_BOMB_CARD_EXTRA;
  const level = getPowerUpLevel('deathBomb');
  const charges = getInventoryCount('deathBomb');
  const upgradeAction = getPowerUpCardAction(def);
  const upgradePrice = getUpgradePrice('deathBomb');
  const chargePrice = getDeathBombChargePrice();
  const unlocked = isDeathBombUnlocked();

  const bg = scene.add.graphics();
  bg.fillStyle(0x12182a, 0.95);
  bg.fillRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  bg.lineStyle(1, 0x223344, 0.9);
  bg.strokeRoundedRect(16, 0, GAME_WIDTH - 32, cardH, 8);
  card.add(bg);

  const preview = scene.add.image(52, cardH / 2, def.textureKey);
  preview.setDisplaySize(36, 36);
  card.add(preview);

  const textX = 92;
  card.add(scene.add.text(textX, 8, def.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }));

  card.add(scene.add.text(textX, 24, def.modeTag, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '8px',
    fontStyle: '700',
    color: '#667788',
  }));

  const descWrapWidth = GAME_WIDTH - textX - 32;
  card.add(scene.add.text(textX, 36, def.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    color: '#8899aa',
    wordWrap: { width: descWrapWidth },
    lineSpacing: 2,
  }));

  const statusLabel = level === 0
    ? 'Not unlocked'
    : `Level ${level} · ${charges} charge${charges === 1 ? '' : 's'}`;
  card.add(scene.add.text(textX, cardH - 38, statusLabel, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#ffcc00',
  }));

  const actionBtnW = 72;
  const actionBtnHalfW = actionBtnW / 2;
  const actionBtnH = 32;
  const actionBtnHalfH = actionBtnH / 2;
  const actionRowY = cardH - 20;
  const actionRight = GAME_WIDTH - 32;

  const addActionButton = (
    centerX: number,
    label: string,
    enabled: boolean,
    onClick: () => void,
  ) => {
    const actionColor = enabled ? 0xffcc00 : 0x556677;
    const actionBtn = scene.add.container(centerX, actionRowY);
    const actionBg = scene.add.graphics();
    const drawActionBg = (fillAlpha: number) => {
      actionBg.clear();
      actionBg.fillStyle(actionColor, enabled ? fillAlpha : 0.12);
      actionBg.fillRoundedRect(-actionBtnHalfW, -actionBtnHalfH, actionBtnW, actionBtnH, 8);
      actionBg.lineStyle(1, actionColor, enabled ? 0.9 : 0.35);
      actionBg.strokeRoundedRect(-actionBtnHalfW, -actionBtnHalfH, actionBtnW, actionBtnH, 8);
    };
    drawActionBg(0.2);

    const actionText = scene.add.text(0, 0, label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '8px',
      fontStyle: '700',
      color: `#${actionColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    actionBtn.add([actionBg, actionText]);
    if (enabled) {
      actionBtn.setInteractive(
        new Phaser.Geom.Rectangle(-actionBtnHalfW, -actionBtnHalfH, actionBtnW, actionBtnH),
        Phaser.Geom.Rectangle.Contains,
      );
      actionBtn.input!.cursor = 'pointer';
      actionBtn.on('pointerover', () => drawActionBg(0.35));
      actionBtn.on('pointerout', () => drawActionBg(0.2));
      actionBtn.on('pointerup', () => {
        playSfx('ui');
        onClick();
      });
    }
    card.add(actionBtn);
  };

  const upgradeLabel = upgradeAction === 'max'
    ? 'MAX'
    : upgradeAction === 'buy'
      ? `UNLOCK ${upgradePrice ?? ''}`
      : `UP ${upgradePrice ?? ''}`;

  const canUpgrade = upgradeAction !== 'max' && upgradePrice !== null && getCoins() >= upgradePrice;
  const chargeCenterX = actionRight - actionBtnHalfW;
  const upgradeCenterX = chargeCenterX - actionBtnW - 8;

  addActionButton(upgradeCenterX, upgradeLabel.trim(), canUpgrade, () => {
    if (!purchasePowerUp('deathBomb')) return;
    onRebuild();
  });

  const chargeLabel = chargePrice !== null ? `+1 (${chargePrice})` : '+1';
  const canBuyCharge = unlocked && chargePrice !== null && getCoins() >= chargePrice;
  addActionButton(chargeCenterX, chargeLabel, canBuyCharge, () => {
    if (!purchaseDeathBombCharge()) return;
    onRebuild();
  });

  return card;
}

export function createShopPanel(
  scene: Phaser.Scene,
  depth: number,
  options: ShopPanelOptions,
): ShopPanelResult {
  const root = scene.add.container(0, 0).setDepth(depth);

  root.add(scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.85,
  ));

  root.add(scene.add.text(GAME_WIDTH / 2, 48, 'SHOP', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '32px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5));

  const coinsText = scene.add.text(GAME_WIDTH / 2, 78, formatCoinsLabel(), {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '14px',
    fontStyle: '700',
    color: '#ffcc00',
  }).setOrigin(0.5);
  root.add(coinsText);

  const tabContainers: Phaser.GameObjects.Container[] = [];
  const subTabContainers: Phaser.GameObjects.Container[] = [];
  let currentTab: ShopTab = 'skins';
  let currentSkinsSubTab: SkinsSubTab = 'shipSkins';

  let previewSkinId = getEquippedSkinId();
  let previewShapeId: RocketShapeId = getEquippedShapeId();
  let stackIteration: StackPreviewIteration = 1;
  let stackIterTimer = 0;

  const heroContainer = scene.add.container(GAME_WIDTH / 2, HERO_CENTER_Y);
  root.add(heroContainer);
  const heroBg = scene.add.graphics();
  heroBg.fillStyle(0x0c1220, 0.9);
  heroBg.fillRoundedRect(-GAME_WIDTH / 2 + 16, -78, GAME_WIDTH - 32, 156, 10);
  heroBg.lineStyle(1, 0x223344, 0.9);
  heroBg.strokeRoundedRect(-GAME_WIDTH / 2 + 16, -78, GAME_WIDTH - 32, 156, 10);
  heroContainer.add(heroBg);
  const heroGfx = scene.add.graphics();
  heroGfx.setScale(HERO_SCALE);
  heroContainer.add(heroGfx);
  const heroLabel = scene.add.text(0, 68, 'STACK PREVIEW', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: '#667788',
  }).setOrigin(0.5);
  heroContainer.add(heroLabel);

  const redrawHero = (): void => {
    heroGfx.clear();
    const skin = PLAYER_SKINS.find((s) => s.id === previewSkinId) ?? PLAYER_SKINS[0];
    const phase = getRainbowCyclePhase(scene.time.now);
    const palette = skin.appearanceId === 'electricRainbow'
      ? makeRainbowPalette(sampleRainbowColor(phase), sampleRainbowColor(phase))
      : getRocketSkinPalette(skin.appearanceId);

    drawLaunchStackPreview(heroGfx, 0, -8, {
      iteration: stackIteration,
      shapeId: previewShapeId,
      palette,
      includeCannon: true,
    });
    heroLabel.setText(`STACK PREVIEW · ${stackIteration}/3`);
  };

  let scrollTop = SKINS_SCROLL_TOP;
  let scrollHeight = SKINS_SCROLL_HEIGHT;

  const maskShape = scene.make.graphics({}, false);
  const applyScrollMask = () => {
    maskShape.clear();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, scrollTop, GAME_WIDTH, scrollHeight);
  };
  applyScrollMask();
  const mask = maskShape.createGeometryMask();

  const scrollViewport = scene.add.container(0, 0);
  scrollViewport.setMask(mask);
  root.add(scrollViewport);

  const content = scene.add.container(0, scrollTop);
  scrollViewport.add(content);

  let scrollY = 0;
  let dragging = false;
  let dragStartY = 0;
  let scrollStartY = 0;
  let maxScroll = 0;
  const rainbowCardPreviews: { gfx: Phaser.GameObjects.Graphics; shapeId: RocketShapeId }[] = [];

  const updateRainbowCardPreviews = (): void => {
    if (rainbowCardPreviews.length === 0) return;
    const phase = getRainbowCyclePhase(scene.time.now);
    const bodyColor = sampleRainbowColor(phase);
    const engineColor = sampleRainbowColor(phase);
    const palette = makeRainbowPalette(bodyColor, engineColor);
    for (const entry of rainbowCardPreviews) {
      if (!entry.gfx.active) continue;
      entry.gfx.clear();
      drawShapeAssembled(entry.shapeId, entry.gfx, palette, -20, -32);
    }
  };

  const setHeroVisible = (visible: boolean) => {
    heroContainer.setVisible(visible);
  };

  const onShopUpdate = (_time: number, delta: number): void => {
    if (currentTab === 'skins') {
      stackIterTimer += delta;
      if (stackIterTimer >= STACK_ITER_MS) {
        stackIterTimer = 0;
        stackIteration = (stackIteration >= 3 ? 1 : stackIteration + 1) as StackPreviewIteration;
      }
      redrawHero();
    }
    updateRainbowCardPreviews();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onShopUpdate);

  const applyScroll = () => {
    content.setY(scrollTop - scrollY);
  };

  const rebuildContent = (options?: { resetScroll?: boolean }) => {
    const previousScrollY = scrollY;
    content.removeAll(true);
    rainbowCardPreviews.length = 0;
    coinsText.setText(formatCoinsLabel());

    if (currentTab === 'skins') {
      scrollTop = SKINS_SCROLL_TOP;
      scrollHeight = SKINS_SCROLL_HEIGHT;
      setHeroVisible(true);
      applyScrollMask();
      redrawHero();

      let y = 0;
      if (currentSkinsSubTab === 'shipSkins') {
        for (const skin of PLAYER_SKINS) {
          const handleAction = () => {
            const action = getSkinAction(skin);
            if (action === 'buy') {
              if (!purchaseSkin(skin.id)) return;
              equipSkin(skin.id);
            } else if (action === 'equip') {
              if (!equipSkin(skin.id)) return;
            } else {
              return;
            }
            previewSkinId = skin.id;
            rebuildContent();
          };
          content.add(createSkinCard(
            scene,
            skin,
            y,
            previewShapeId,
            previewSkinId === skin.id,
            () => {
              previewSkinId = skin.id;
              stackIteration = 1;
              stackIterTimer = 0;
              rebuildContent();
            },
            handleAction,
            rainbowCardPreviews,
          ));
          y += CARD_HEIGHT;
        }
      } else {
        for (const shape of PLAYER_SHAPES) {
          const handleAction = () => {
            const action = getShapeAction(shape);
            if (action === 'buy') {
              if (!purchaseShape(shape.id)) return;
              equipShape(shape.id);
            } else if (action === 'equip') {
              if (!equipShape(shape.id)) return;
            } else {
              return;
            }
            previewShapeId = shape.id;
            rebuildContent();
          };
          content.add(createShapeCard(
            scene,
            shape,
            y,
            previewSkinId,
            previewShapeId === shape.id,
            () => {
              previewShapeId = shape.id;
              stackIteration = 1;
              stackIterTimer = 0;
              rebuildContent();
            },
            handleAction,
            rainbowCardPreviews,
          ));
          y += CARD_HEIGHT;
        }
      }

      maxScroll = Math.max(0, y - scrollHeight);
    } else {
      scrollTop = POWERUPS_SCROLL_TOP;
      scrollHeight = POWERUPS_SCROLL_HEIGHT;
      setHeroVisible(false);
      applyScrollMask();

      let y = 0;
      for (const def of POWER_UPS) {
        if (def.id === 'deathBomb') {
          content.add(createDeathBombCard(scene, y, rebuildContent));
          y += CARD_HEIGHT + DEATH_BOMB_CARD_EXTRA;
          continue;
        }
        const handleAction = () => {
          const action = getPowerUpCardAction(def);
          let ok = false;
          if (action === 'buy' || action === 'upgrade') {
            ok = purchasePowerUp(def.id as 'shield' | 'invisibility' | 'fuelTank');
          } else if (action === 'buyInventory') {
            ok = purchaseInventoryItem(def.id as 'engine' | 'hyperdrive');
          }
          if (!ok) return;
          rebuildContent();
        };
        content.add(createPowerUpCard(scene, def, y, handleAction));
        y += CARD_HEIGHT;
      }
      maxScroll = Math.max(0, y - scrollHeight);
    }

    scrollY = options?.resetScroll ? 0 : Phaser.Math.Clamp(previousScrollY, 0, maxScroll);
    applyScroll();
    updateRainbowCardPreviews();
  };

  const drawSkinsSubTabs = () => {
    subTabContainers.forEach((tab) => tab.destroy());
    subTabContainers.length = 0;

    if (currentTab !== 'skins') return;

    const subTabs: { id: SkinsSubTab; label: string }[] = [
      { id: 'shipSkins', label: 'SHIP SKINS' },
      { id: 'shipShapes', label: 'SHIP SHAPES' },
    ];

    const totalWidth = subTabs.length * SUBTAB_WIDTH + (subTabs.length - 1) * SUBTAB_GAP;
    let tabX = GAME_WIDTH / 2 - totalWidth / 2 + SUBTAB_WIDTH / 2;

    for (const tabDef of subTabs) {
      const active = tabDef.id === currentSkinsSubTab;
      const tab = scene.add.container(tabX, SKINS_SUBTAB_Y);
      const bg = scene.add.graphics();
      bg.fillStyle(0x12182a, active ? 0.95 : 0.7);
      bg.fillRoundedRect(-SUBTAB_WIDTH / 2, -16, SUBTAB_WIDTH, 32, 8);
      bg.lineStyle(1.5, active ? 0x00d4ff : 0x334455, active ? 1 : 0.7);
      bg.strokeRoundedRect(-SUBTAB_WIDTH / 2, -16, SUBTAB_WIDTH, 32, 8);
      tab.add(bg);

      tab.add(scene.add.text(0, 0, tabDef.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: active ? '#00d4ff' : '#8899aa',
      }).setOrigin(0.5));

      tab.setInteractive(
        new Phaser.Geom.Rectangle(-SUBTAB_WIDTH / 2, -16, SUBTAB_WIDTH, 32),
        Phaser.Geom.Rectangle.Contains,
      );
      tab.input!.cursor = 'pointer';
      tab.on('pointerup', () => {
        if (currentSkinsSubTab !== tabDef.id) {
          playSfx('ui');
          currentSkinsSubTab = tabDef.id;
          drawSkinsSubTabs();
          rebuildContent({ resetScroll: true });
        }
      });

      root.add(tab);
      subTabContainers.push(tab);
      tabX += SUBTAB_WIDTH + SUBTAB_GAP;
    }
  };

  const drawTabs = () => {
    tabContainers.forEach((tab) => tab.destroy());
    tabContainers.length = 0;

    const tabs: { id: ShopTab; icon: string; label: string }[] = [
      { id: 'skins', icon: 'shop-skins-tab-icon', label: 'SKINS' },
      { id: 'powerUps', icon: 'shop-powerups-tab-icon', label: 'POWER UPS' },
    ];

    const totalWidth = tabs.length * TAB_WIDTH + (tabs.length - 1) * TAB_GAP;
    let tabX = GAME_WIDTH / 2 - totalWidth / 2 + TAB_WIDTH / 2;

    for (const tabDef of tabs) {
      const active = tabDef.id === currentTab;
      const tab = scene.add.container(tabX, TAB_Y);
      const bg = scene.add.graphics();
      bg.fillStyle(0x12182a, active ? 0.95 : 0.75);
      bg.fillRoundedRect(-TAB_WIDTH / 2, -22, TAB_WIDTH, 44, 10);
      bg.lineStyle(2, active ? 0x00d4ff : 0x334455, active ? 1 : 0.7);
      bg.strokeRoundedRect(-TAB_WIDTH / 2, -22, TAB_WIDTH, 44, 10);
      tab.add(bg);

      const icon = scene.add.image(-28, 0, tabDef.icon);
      icon.setDisplaySize(24, 24);
      tab.add(icon);

      const label = scene.add.text(12, 0, tabDef.label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: tabDef.id === 'powerUps' ? '9px' : '11px',
        fontStyle: '700',
        color: active ? '#00d4ff' : '#8899aa',
      }).setOrigin(0, 0.5);
      tab.add(label);

      tab.setInteractive(
        new Phaser.Geom.Rectangle(-TAB_WIDTH / 2, -22, TAB_WIDTH, 44),
        Phaser.Geom.Rectangle.Contains,
      );
      tab.input!.cursor = 'pointer';
      tab.on('pointerup', () => {
        if (currentTab !== tabDef.id) {
          playSfx('ui');
          currentTab = tabDef.id;
          drawTabs();
          drawSkinsSubTabs();
          rebuildContent({ resetScroll: true });
        }
      });

      root.add(tab);
      tabContainers.push(tab);
      tabX += TAB_WIDTH + TAB_GAP;
    }

    drawSkinsSubTabs();
  };

  drawTabs();
  rebuildContent();

  const isInScrollArea = (pointer: Phaser.Input.Pointer) => (
    pointer.y >= scrollTop &&
    pointer.y <= scrollTop + scrollHeight &&
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

  const onWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    if (maxScroll <= 0 || !isInScrollArea(pointer)) return;
    scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.45, 0, maxScroll);
    applyScroll();
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', stopDragging);
  scene.input.on('pointerupoutside', stopDragging);
  scene.input.on('wheel', onWheel);

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT - 72,
    onClick: () => options.onBack(),
  });
  backBtn.setX(GAME_WIDTH / 2);
  root.add(backBtn);

  const destroy = () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onShopUpdate);
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
