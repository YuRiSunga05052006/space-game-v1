import { canAfford, spendCoins } from './coins';

const OWNED_SHAPES_KEY = 'star-blaster-owned-shapes';
const EQUIPPED_SHAPE_KEY = 'star-blaster-equipped-shape';
export const DEFAULT_SHAPE_ID = 'starBlaster';

export type RocketShapeId =
  | 'starBlaster'
  | 'mercuryFirst'
  | 'geminiTwin'
  | 'lokCraftblast'
  | 'apolloCommander'
  | 'falconDragon'
  | 'spaceShuttle'
  | 'orionOrionis';

export interface PlayerShapeDefinition {
  id: RocketShapeId;
  name: string;
  price: number;
  description: string;
}

export const PLAYER_SHAPES: PlayerShapeDefinition[] = [
  {
    id: 'starBlaster',
    name: 'Star Blaster',
    price: 0,
    description: 'The original modular starfighter hull.',
  },
  {
    id: 'mercuryFirst',
    name: 'Mercury First',
    price: 150,
    description: 'Capsule-nosed pioneer hull mixed with Star Blaster combat parts.',
  },
  {
    id: 'geminiTwin',
    name: 'Gemini the Twin',
    price: 200,
    description: 'A Mercury cousin with twin-hatch cabin cues and Star Blaster thrusters.',
  },
  {
    id: 'lokCraftblast',
    name: 'LOK Craftblast',
    price: 250,
    description: 'Soyuz/LOK-inspired orbital craft from the international Star Blaster project.',
  },
  {
    id: 'apolloCommander',
    name: 'Apollo Commander',
    price: 300,
    description: 'LM and CSM fused into a super-ship for the joint U.S.–Russia project.',
  },
  {
    id: 'falconDragon',
    name: 'Falcon Dragon',
    price: 350,
    description: 'Freighter-saucer swagger meets Crew Dragon nose, with a Star Blaster twist.',
  },
  {
    id: 'spaceShuttle',
    name: 'Space Shuttle',
    price: 400,
    description: 'Orbiter lines with X-wing and Y-wing motifs on a Star Blaster frame.',
  },
  {
    id: 'orionOrionis',
    name: 'Orion Orionis',
    price: 400,
    description: 'Nuclear Orion pulse plate meets MPCV capsule on a Star Blaster chassis.',
  },
];

function getShapeById(id: string): PlayerShapeDefinition | undefined {
  return PLAYER_SHAPES.find((shape) => shape.id === id);
}

function readOwnedShapeIds(): string[] {
  try {
    const raw = localStorage.getItem(OWNED_SHAPES_KEY);
    if (!raw) return [DEFAULT_SHAPE_ID];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [DEFAULT_SHAPE_ID];
    const ids = parsed.filter((id): id is string => typeof id === 'string');
    return ids.includes(DEFAULT_SHAPE_ID) ? ids : [DEFAULT_SHAPE_ID, ...ids];
  } catch {
    return [DEFAULT_SHAPE_ID];
  }
}

function writeOwnedShapeIds(ids: string[]): void {
  try {
    const unique = Array.from(new Set([DEFAULT_SHAPE_ID, ...ids]));
    localStorage.setItem(OWNED_SHAPES_KEY, JSON.stringify(unique));
  } catch {
    // ignore storage errors
  }
}

export function getOwnedShapeIds(): string[] {
  return readOwnedShapeIds();
}

export function isShapeOwned(id: string): boolean {
  const shape = getShapeById(id);
  if (!shape) return false;
  if (shape.price === 0) return true;
  return readOwnedShapeIds().includes(id);
}

export function getEquippedShapeId(): RocketShapeId {
  try {
    const raw = localStorage.getItem(EQUIPPED_SHAPE_KEY);
    if (!raw) return DEFAULT_SHAPE_ID;
    return getShapeById(raw) ? (raw as RocketShapeId) : DEFAULT_SHAPE_ID;
  } catch {
    return DEFAULT_SHAPE_ID;
  }
}

export function equipShape(id: string): boolean {
  if (!isShapeOwned(id)) return false;
  try {
    localStorage.setItem(EQUIPPED_SHAPE_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function purchaseShape(id: string): boolean {
  const shape = getShapeById(id);
  if (!shape || isShapeOwned(id)) return false;
  if (shape.price === 0) {
    writeOwnedShapeIds([...readOwnedShapeIds(), id]);
    return true;
  }
  if (!canAfford(shape.price)) return false;
  if (!spendCoins(shape.price)) return false;

  writeOwnedShapeIds([...readOwnedShapeIds(), id]);
  return true;
}

export function shipTextureKey(shapeId: string, skinId: string): string {
  return `rocket-${shapeId}-${skinId}`;
}
