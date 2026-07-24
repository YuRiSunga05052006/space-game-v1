import { canAfford, spendCoins } from './coins';
import type { RocketSkinAppearanceId } from './rocketAppearances';

const OWNED_SKINS_KEY = 'star-blaster-owned-skins';
const EQUIPPED_SKIN_KEY = 'star-blaster-equipped-skin';
const DEFAULT_SKIN_ID = 'classic';

export interface PlayerSkinDefinition {
  id: string;
  name: string;
  textureKey: string;
  appearanceId: RocketSkinAppearanceId;
  price: number;
  description: string;
  special?: true;
}

export const PLAYER_SKINS: PlayerSkinDefinition[] = [
  {
    id: 'classic',
    name: 'Classic Blaster',
    textureKey: 'rocket-classic',
    appearanceId: 'classic',
    price: 0,
    description: 'The original starfighter paint scheme.',
  },
  {
    id: 'crimson',
    name: 'Crimson Striker',
    textureKey: 'rocket-crimson',
    appearanceId: 'crimson',
    price: 100,
    description: 'Aggressive red hull with golden exhaust flares.',
  },
  {
    id: 'emerald',
    name: 'Emerald Voyager',
    textureKey: 'rocket-emerald',
    appearanceId: 'emerald',
    price: 120,
    description: 'Deep green plating built for long-range patrols.',
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    textureKey: 'rocket-solar',
    appearanceId: 'solar',
    price: 150,
    description: 'Radiant gold accents that burn bright in combat.',
  },
  {
    id: 'violet',
    name: 'Violet Phantom',
    textureKey: 'rocket-violet',
    appearanceId: 'violet',
    price: 180,
    description: 'Purple stealth coating favored by belt raiders.',
  },
  {
    id: 'arctic',
    name: 'Arctic Comet',
    textureKey: 'rocket-arctic',
    appearanceId: 'arctic',
    price: 200,
    description: 'Frosted white and ice-blue fins for cold sectors.',
  },
  {
    id: 'neon',
    name: 'Neon Pulse',
    textureKey: 'rocket-neon',
    appearanceId: 'neon',
    price: 250,
    description: 'Hot pink and cyan glow for maximum visibility.',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Fighter',
    textureKey: 'rocket-obsidian',
    appearanceId: 'obsidian',
    price: 220,
    description: 'Jet-black hull with a white outline and green thruster burn.',
  },
  {
    id: 'amber',
    name: 'Amber Vanguard',
    textureKey: 'rocket-amber',
    appearanceId: 'amber',
    price: 280,
    description: 'Neon orange hull with vivid purple exhaust trails.',
  },
  {
    id: 'sapphire',
    name: 'Apollo Sapphire',
    textureKey: 'rocket-sapphire',
    appearanceId: 'sapphire',
    price: 300,
    description: 'Royal blue plating with sky-blue flames tipped in gold.',
  },
  {
    id: 'electricRainbow',
    name: 'Electric Neon Rainbow',
    textureKey: 'rocket-electric-rainbow',
    appearanceId: 'electricRainbow',
    price: 500,
    special: true,
    description: 'Rainbow neon hull and prismatic exhaust. Special: +75% gold asteroid/comet spawns in Survival.',
  },
];

function getSkinById(id: string): PlayerSkinDefinition | undefined {
  return PLAYER_SKINS.find((skin) => skin.id === id);
}

function readOwnedSkinIds(): string[] {
  try {
    const raw = localStorage.getItem(OWNED_SKINS_KEY);
    if (!raw) return [DEFAULT_SKIN_ID];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [DEFAULT_SKIN_ID];
    const ids = parsed.filter((id): id is string => typeof id === 'string');
    return ids.includes(DEFAULT_SKIN_ID) ? ids : [DEFAULT_SKIN_ID, ...ids];
  } catch {
    return [DEFAULT_SKIN_ID];
  }
}

function writeOwnedSkinIds(ids: string[]): void {
  try {
    const unique = Array.from(new Set([DEFAULT_SKIN_ID, ...ids]));
    localStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(unique));
  } catch {
    // ignore storage errors
  }
}

export function getOwnedSkinIds(): string[] {
  return readOwnedSkinIds();
}

export function isSkinOwned(id: string): boolean {
  const skin = getSkinById(id);
  if (!skin) return false;
  if (skin.price === 0) return true;
  return readOwnedSkinIds().includes(id);
}

export function getEquippedSkinId(): string {
  try {
    const raw = localStorage.getItem(EQUIPPED_SKIN_KEY);
    if (!raw) return DEFAULT_SKIN_ID;
    return getSkinById(raw) ? raw : DEFAULT_SKIN_ID;
  } catch {
    return DEFAULT_SKIN_ID;
  }
}

export function equipSkin(id: string): boolean {
  if (!isSkinOwned(id)) return false;
  try {
    localStorage.setItem(EQUIPPED_SKIN_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function purchaseSkin(id: string): boolean {
  const skin = getSkinById(id);
  if (!skin || isSkinOwned(id)) return false;
  if (skin.price === 0) {
    writeOwnedSkinIds([...readOwnedSkinIds(), id]);
    return true;
  }
  if (!canAfford(skin.price)) return false;
  if (!spendCoins(skin.price)) return false;

  writeOwnedSkinIds([...readOwnedSkinIds(), id]);
  return true;
}

export function getEquippedSkinTextureKey(): string {
  const equipped = getEquippedSkinId();
  return getSkinById(equipped)?.textureKey ?? 'rocket-classic';
}

export function hasSurvivalGoldSpawnBonus(): boolean {
  return getEquippedSkinId() === 'electricRainbow';
}
