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
}

/** Dim anchor representing distant Sol — left edge of the stellar chart. */
export const SUN_POSITION = { x: 0.04, y: 0.55 };

/** No decorative orbit rings — stellar chart uses free-positioned nodes only. */
export const WORLD3_ORBITS: { rx: number; ry: number }[] = [];

interface NodeDef {
  level: number;
  x: number;
  y: number;
  nodeStyle: MapNodeStyle;
  bossTier?: BossTier;
}

/** Stellar neighborhood chart — three acts left-to-right. */
const NODE_DEFS: NodeDef[] = [
  { level: 21, x: 0.10, y: 0.72, nodeStyle: 'star' },
  { level: 22, x: 0.16, y: 0.62, nodeStyle: 'star' },
  { level: 23, x: 0.22, y: 0.74, nodeStyle: 'star' },
  { level: 24, x: 0.28, y: 0.66, nodeStyle: 'star' },
  { level: 25, x: 0.34, y: 0.76, nodeStyle: 'star' },
  { level: 26, x: 0.40, y: 0.58, nodeStyle: 'star', bossTier: 'mid' },
  { level: 27, x: 0.46, y: 0.68, nodeStyle: 'star' },
  { level: 28, x: 0.52, y: 0.56, nodeStyle: 'star' },
  { level: 29, x: 0.56, y: 0.70, nodeStyle: 'star' },
  { level: 30, x: 0.60, y: 0.48, nodeStyle: 'star' },
  { level: 31, x: 0.64, y: 0.62, nodeStyle: 'star' },
  { level: 32, x: 0.68, y: 0.44, nodeStyle: 'star', bossTier: 'mid' },
  { level: 33, x: 0.72, y: 0.56, nodeStyle: 'star' },
  { level: 34, x: 0.76, y: 0.38, nodeStyle: 'comet' },
  { level: 35, x: 0.80, y: 0.50, nodeStyle: 'star' },
  { level: 36, x: 0.84, y: 0.36, nodeStyle: 'star' },
  { level: 37, x: 0.88, y: 0.46, nodeStyle: 'star' },
  { level: 38, x: 0.94, y: 0.32, nodeStyle: 'star', bossTier: 'finale' },
];

export const WORLD3_ROUTE_WAYPOINTS: Record<number, { x: number; y: number }[]> = {
  26: [{ x: 0.38, y: 0.68 }],
  32: [{ x: 0.66, y: 0.54 }],
  34: [{ x: 0.74, y: 0.48 }],
};

export function getWorld3RouteWaypoints(fromLevel: number, toLevel: number): { x: number; y: number }[] {
  if (toLevel === 26 && fromLevel === 25) return WORLD3_ROUTE_WAYPOINTS[26] ?? [];
  if (toLevel === 32 && fromLevel === 31) return WORLD3_ROUTE_WAYPOINTS[32] ?? [];
  if (toLevel === 34 && fromLevel === 33) return WORLD3_ROUTE_WAYPOINTS[34] ?? [];
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
  }));
}

export const WORLD3_MAP_NODES: MapNodeLayout[] = buildMapNodes();

export function getWorld3MapNode(level: number): MapNodeLayout {
  const index = level - 21;
  return WORLD3_MAP_NODES[index] ?? WORLD3_MAP_NODES[0];
}

export function getWorld3MapRouteLevels(): number[] {
  return WORLD3_MAP_NODES.map((node) => node.level);
}
