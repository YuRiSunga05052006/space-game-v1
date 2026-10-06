import type { World4ComingSoonMeta } from './levels';
import { WORLD4_COMING_SOON, WORLD4_LEVELS } from './levels';

export type MapNodeStyle = 'planet' | 'moon' | 'asteroid' | 'star' | 'comet';

export type BossTier = 'normal' | 'mid' | 'finale';

export interface MapNodeLayout {
  level: number;
  x: number;
  y: number;
  orbitIndex: number;
  nodeStyle: MapNodeStyle;
  isOuterNode?: boolean;
  bossTier?: BossTier;
  comingSoon?: boolean;
  location?: string;
}

/** Dim anchor for the gateway chart. */
export const SUN_POSITION = { x: 0.04, y: 0.42 };

export const WORLD4_ORBITS: { rx: number; ry: number }[] = [];

interface NodeDef {
  level: number;
  x: number;
  y: number;
  nodeStyle: MapNodeStyle;
  bossTier?: BossTier;
  comingSoon?: boolean;
  location?: string;
}

const PLAYABLE: NodeDef[] = [
  { level: 39, x: 0.08, y: 0.30, nodeStyle: 'star' },
  { level: 40, x: 0.16, y: 0.42, nodeStyle: 'star' },
  { level: 41, x: 0.24, y: 0.28, nodeStyle: 'star' },
  { level: 42, x: 0.32, y: 0.40, nodeStyle: 'star' },
  { level: 43, x: 0.40, y: 0.26, nodeStyle: 'star' },
  { level: 44, x: 0.48, y: 0.38, nodeStyle: 'star', bossTier: 'mid' },
  { level: 45, x: 0.56, y: 0.24, nodeStyle: 'star' },
  { level: 46, x: 0.64, y: 0.36, nodeStyle: 'star' },
  { level: 47, x: 0.72, y: 0.24, nodeStyle: 'star' },
  { level: 48, x: 0.80, y: 0.36, nodeStyle: 'star' },
  { level: 49, x: 0.88, y: 0.26, nodeStyle: 'star' },
  { level: 50, x: 0.95, y: 0.40, nodeStyle: 'star', bossTier: 'mid' },
];

const COMING_SOON_POS: { x: number; y: number }[] = [
  { x: 0.08, y: 0.62 },
  { x: 0.16, y: 0.74 },
  { x: 0.24, y: 0.64 },
  { x: 0.32, y: 0.76 },
  { x: 0.40, y: 0.66 },
  { x: 0.48, y: 0.78 },
  { x: 0.56, y: 0.64 },
  { x: 0.64, y: 0.76 },
  { x: 0.72, y: 0.62 },
  { x: 0.80, y: 0.74 },
  { x: 0.88, y: 0.64 },
  { x: 0.95, y: 0.78 },
];

const COMING_SOON: NodeDef[] = WORLD4_COMING_SOON.map((entry, index) => ({
  level: entry.level,
  x: COMING_SOON_POS[index].x,
  y: COMING_SOON_POS[index].y,
  nodeStyle: 'star' as const,
  bossTier: entry.bossTier,
  comingSoon: true,
  location: entry.location,
}));

const NODE_DEFS: NodeDef[] = [...PLAYABLE, ...COMING_SOON];

export const WORLD4_ROUTE_WAYPOINTS: Record<number, { x: number; y: number }[]> = {
  44: [{ x: 0.44, y: 0.32 }],
  50: [{ x: 0.92, y: 0.32 }],
};

export function getWorld4RouteWaypoints(fromLevel: number, toLevel: number): { x: number; y: number }[] {
  if (toLevel === 44 && fromLevel === 43) return WORLD4_ROUTE_WAYPOINTS[44] ?? [];
  if (toLevel === 50 && fromLevel === 49) return WORLD4_ROUTE_WAYPOINTS[50] ?? [];
  return [];
}

function buildMapNodes(): MapNodeLayout[] {
  return NODE_DEFS.map((def) => ({
    level: def.level,
    x: def.x,
    y: def.y,
    orbitIndex: 0,
    nodeStyle: def.nodeStyle,
    isOuterNode: true,
    bossTier: def.bossTier,
    comingSoon: def.comingSoon,
    location: def.location,
  }));
}

export const WORLD4_MAP_NODES: MapNodeLayout[] = buildMapNodes();

const NODE_BY_LEVEL = new Map(WORLD4_MAP_NODES.map((node) => [node.level, node]));

export function getWorld4MapNode(level: number): MapNodeLayout {
  return NODE_BY_LEVEL.get(level) ?? WORLD4_MAP_NODES[0];
}

/** Campaign route stops at Level 50. Coming-soon nodes are not linked. */
export function getWorld4MapRouteLevels(): number[] {
  return WORLD4_LEVELS.map((level) => level.level);
}

export function getWorld4ComingSoonNodes(): MapNodeLayout[] {
  return WORLD4_MAP_NODES.filter((node) => node.comingSoon);
}

export function isWorld4ComingSoonNode(level: number): boolean {
  return NODE_BY_LEVEL.get(level)?.comingSoon === true;
}

export type { World4ComingSoonMeta };
