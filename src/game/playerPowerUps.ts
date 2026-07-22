import { canAfford, spendCoins } from './coins';
import { MAX_POWER_UP_LEVEL } from './powerUpEffects';

const LEVELS_KEY = 'star-blaster-powerup-levels';
const INVENTORY_KEY = 'star-blaster-powerup-inventory';

export type UpgradablePowerUpId = 'shield' | 'invisibility' | 'fuelTank' | 'deathBomb';
export type InventoryPowerUpId = 'engine' | 'hyperdrive' | 'deathBomb';
export type PowerUpId = UpgradablePowerUpId | InventoryPowerUpId;

export interface PowerUpDefinition {
  id: PowerUpId;
  name: string;
  textureKey: string;
  description: string;
  modeTag: string;
  kind: 'upgradable' | 'inventory' | 'hybrid';
  buyPrices?: number[];
  inventoryPrice?: number;
}

export const POWER_UPS: PowerUpDefinition[] = [
  {
    id: 'shield',
    name: 'Shield',
    textureKey: 'shield-pickup',
    description: 'Absorbs one hit or lasts until the timer runs out. Scatters in levels after purchase.',
    modeTag: 'Story + Survival',
    kind: 'upgradable',
    buyPrices: [150, 75, 100, 125, 150],
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    textureKey: 'invisibility-pickup',
    description: 'Full immunity and ghost movement through obstacles and enemies. Scatters in levels after purchase.',
    modeTag: 'Story + Survival',
    kind: 'upgradable',
    buyPrices: [175, 85, 110, 135, 160],
  },
  {
    id: 'fuelTank',
    name: 'Fuel Tank',
    textureKey: 'fuel-tank-pickup',
    description: 'Invincible ram boost that destroys hazards in your path for bonus score. Scatters in Survival runs.',
    modeTag: 'Survival only',
    kind: 'upgradable',
    buyPrices: [200, 100, 125, 150, 175],
  },
  {
    id: 'engine',
    name: 'Engine',
    textureKey: 'engine-powerup',
    description: 'Single-use invincible boost up to 5000 points. Trigger manually in Survival for a few seconds.',
    modeTag: 'Survival only',
    kind: 'inventory',
    inventoryPrice: 250,
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive Engine',
    textureKey: 'hyperdrive-powerup',
    description: 'Single-use invincible boost up to 10000 points. Trigger manually in Survival for a few seconds.',
    modeTag: 'Survival only',
    kind: 'inventory',
    inventoryPrice: 450,
  },
  {
    id: 'deathBomb',
    name: 'Death Bomb',
    textureKey: 'death-bomb-powerup',
    description: 'Arm before a fatal hit. Your explosion damages or destroys nearby enemies and obstacles.',
    modeTag: 'Story + Survival',
    kind: 'hybrid',
    buyPrices: [220, 110, 135, 160, 185],
    inventoryPrice: 300,
  },
];

type LevelState = Record<UpgradablePowerUpId, number>;
type InventoryState = Record<InventoryPowerUpId, number>;

function defaultLevels(): LevelState {
  return { shield: 0, invisibility: 0, fuelTank: 0, deathBomb: 0 };
}

function defaultInventory(): InventoryState {
  return { engine: 0, hyperdrive: 0, deathBomb: 0 };
}

function readLevels(): LevelState {
  try {
    const raw = localStorage.getItem(LEVELS_KEY);
    if (!raw) return defaultLevels();
    const parsed = JSON.parse(raw) as Partial<LevelState>;
    return {
      shield: clampLevel(parsed.shield),
      invisibility: clampLevel(parsed.invisibility),
      fuelTank: clampLevel(parsed.fuelTank),
      deathBomb: clampLevel(parsed.deathBomb),
    };
  } catch {
    return defaultLevels();
  }
}

function writeLevels(levels: LevelState): void {
  try {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
  } catch {
    // ignore storage errors
  }
}

function readInventory(): InventoryState {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return defaultInventory();
    const parsed = JSON.parse(raw) as Partial<InventoryState>;
    return {
      engine: Math.max(0, Math.floor(parsed.engine ?? 0)),
      hyperdrive: Math.max(0, Math.floor(parsed.hyperdrive ?? 0)),
      deathBomb: Math.max(0, Math.floor(parsed.deathBomb ?? 0)),
    };
  } catch {
    return defaultInventory();
  }
}

function writeInventory(inventory: InventoryState): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch {
    // ignore storage errors
  }
}

function clampLevel(value: unknown): number {
  const level = typeof value === 'number' ? value : 0;
  return Math.max(0, Math.min(MAX_POWER_UP_LEVEL, Math.floor(level)));
}

export function getPowerUpDefinition(id: PowerUpId): PowerUpDefinition | undefined {
  return POWER_UPS.find((powerUp) => powerUp.id === id);
}

export function getPowerUpLevel(id: UpgradablePowerUpId): number {
  return readLevels()[id];
}

export function isPowerUpOwned(id: UpgradablePowerUpId): boolean {
  return getPowerUpLevel(id) >= 1;
}

export function getInventoryCount(id: InventoryPowerUpId): number {
  return readInventory()[id];
}

export function isDeathBombUnlocked(): boolean {
  return getPowerUpLevel('deathBomb') >= 1;
}

export function purchaseDeathBombCharge(): boolean {
  if (!isDeathBombUnlocked()) return false;
  return purchaseInventoryItem('deathBomb');
}

export function getUpgradePrice(id: UpgradablePowerUpId): number | null {
  const def = getPowerUpDefinition(id);
  if (!def?.buyPrices) return null;
  const level = getPowerUpLevel(id);
  if (level >= MAX_POWER_UP_LEVEL) return null;
  return def.buyPrices[level] ?? null;
}

export function purchasePowerUp(id: UpgradablePowerUpId): boolean {
  const price = getUpgradePrice(id);
  if (price === null) return false;
  if (!canAfford(price)) return false;
  if (!spendCoins(price)) return false;

  const levels = readLevels();
  levels[id] = Math.min(MAX_POWER_UP_LEVEL, levels[id] + 1);
  writeLevels(levels);
  return true;
}

export function upgradePowerUp(id: UpgradablePowerUpId): boolean {
  return purchasePowerUp(id);
}

export function purchaseInventoryItem(id: InventoryPowerUpId): boolean {
  const def = getPowerUpDefinition(id);
  if (!def?.inventoryPrice) return false;
  if (!canAfford(def.inventoryPrice)) return false;
  if (!spendCoins(def.inventoryPrice)) return false;

  const inventory = readInventory();
  inventory[id] += 1;
  writeInventory(inventory);
  return true;
}

export function consumeInventoryItem(id: InventoryPowerUpId): boolean {
  const inventory = readInventory();
  if (inventory[id] <= 0) return false;
  inventory[id] -= 1;
  writeInventory(inventory);
  return true;
}

export type PowerUpCardAction = 'buy' | 'upgrade' | 'max' | 'buyInventory';

export function getPowerUpCardAction(def: PowerUpDefinition): PowerUpCardAction {
  if (def.kind === 'inventory') return 'buyInventory';
  if (def.kind === 'hybrid') {
    const level = getPowerUpLevel('deathBomb');
    if (level >= MAX_POWER_UP_LEVEL) return 'max';
    if (level === 0) return 'buy';
    return 'upgrade';
  }
  const level = getPowerUpLevel(def.id as UpgradablePowerUpId);
  if (level >= MAX_POWER_UP_LEVEL) return 'max';
  if (level === 0) return 'buy';
  return 'upgrade';
}

export function getPowerUpActionPrice(def: PowerUpDefinition): number | null {
  if (def.kind === 'inventory' || def.kind === 'hybrid') {
    if (def.kind === 'hybrid') return getUpgradePrice('deathBomb');
  }
  if (def.kind === 'inventory') return def.inventoryPrice ?? null;
  return getUpgradePrice(def.id as UpgradablePowerUpId);
}

export function getDeathBombChargePrice(): number | null {
  const def = getPowerUpDefinition('deathBomb');
  if (!def?.inventoryPrice || !isDeathBombUnlocked()) return null;
  return def.inventoryPrice;
}
