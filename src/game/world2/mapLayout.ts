export type MapNodeStyle = 'planet' | 'moon' | 'asteroid' | 'star' | 'comet';

export type MapPlanetId = 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'titan';

export interface World2Orbit {
  /** Semi-axis as a fraction of map width from the sun. */
  rx: number;
  /** Semi-axis as a fraction of map height from the sun. */
  ry: number;
}

export interface MapNodeLayout {
  level: number;
  x: number;
  y: number;
  orbitIndex: number;
  nodeStyle: MapNodeStyle;
  planetId?: MapPlanetId;
  isOuterNode?: boolean;
}

/** Sun anchor — bottom-right of the map. */
export const SUN_POSITION = { x: 0.88, y: 0.78 };

/** Inner decorative rings + four gas-giant orbits (Jupiter → Neptune). */
export const WORLD2_ORBITS: World2Orbit[] = [
  { rx: 0.042, ry: 0.036 },
  { rx: 0.072, ry: 0.060 },
  { rx: 0.100, ry: 0.084 },
  { rx: 0.128, ry: 0.100 },
  { rx: 0.188, ry: 0.180 },
  { rx: 0.238, ry: 0.228 },
  { rx: 0.298, ry: 0.285 },
];

const JUPITER_ORBIT = 3;
const SATURN_ORBIT = 4;
const URANUS_ORBIT = 5;
const NEPTUNE_ORBIT = 6;

/** Jupiter & Saturn stacked vertically above the sun (12 o'clock). */
const INNER_GIANT_ANGLE = -Math.PI / 2;
const URANUS_ANGLE = -1.15;
const NEPTUNE_ANGLE = -1.95;

export function positionOnOrbit(orbitIndex: number, angle: number): { x: number; y: number } {
  const orbit = WORLD2_ORBITS[orbitIndex];
  return {
    x: SUN_POSITION.x + orbit.rx * Math.cos(angle),
    y: SUN_POSITION.y + orbit.ry * Math.sin(angle),
  };
}

interface NodeDef {
  level: number;
  orbitIndex?: number;
  angle?: number;
  x?: number;
  y?: number;
  nodeStyle: MapNodeStyle;
  planetId?: MapPlanetId;
  isOuterNode?: boolean;
}

const NODE_DEFS: NodeDef[] = [
  { level: 11, orbitIndex: JUPITER_ORBIT, angle: INNER_GIANT_ANGLE, nodeStyle: 'planet', planetId: 'jupiter' },
  { level: 12, orbitIndex: SATURN_ORBIT, angle: INNER_GIANT_ANGLE, nodeStyle: 'planet', planetId: 'saturn' },
  { level: 13, x: 0.92, y: 0.56, nodeStyle: 'moon', planetId: 'titan' },
  { level: 14, orbitIndex: URANUS_ORBIT, angle: URANUS_ANGLE, nodeStyle: 'planet', planetId: 'uranus' },
  { level: 15, orbitIndex: NEPTUNE_ORBIT, angle: NEPTUNE_ANGLE, nodeStyle: 'planet', planetId: 'neptune' },
  { level: 16, x: 0.50, y: 0.40, nodeStyle: 'asteroid', isOuterNode: true },
  { level: 17, x: 0.36, y: 0.56, nodeStyle: 'moon', isOuterNode: true },
  { level: 18, x: 0.20, y: 0.34, nodeStyle: 'asteroid', isOuterNode: true },
  { level: 19, x: 0.08, y: 0.44, nodeStyle: 'comet', isOuterNode: true },
  { level: 20, x: 0.02, y: 0.52, nodeStyle: 'star', isOuterNode: true },
];

/**
 * Elbow points for route segments that aren't a straight line in the reference art.
 * Key = destination level; waypoints are visited in order after the source node.
 */
export const WORLD2_ROUTE_WAYPOINTS: Record<number, { x: number; y: number }[]> = {
  16: [{ x: 0.62, y: 0.62 }],
};

export function getWorld2RouteWaypoints(fromLevel: number, toLevel: number): { x: number; y: number }[] {
  if (toLevel === 16 && fromLevel === 15) {
    return WORLD2_ROUTE_WAYPOINTS[16] ?? [];
  }
  return [];
}

function resolveNodePosition(def: NodeDef): { x: number; y: number } {
  if (def.x !== undefined && def.y !== undefined) {
    return { x: def.x, y: def.y };
  }
  return positionOnOrbit(def.orbitIndex ?? NEPTUNE_ORBIT, def.angle ?? 0);
}

function buildMapNodes(): MapNodeLayout[] {
  return NODE_DEFS.map((def) => {
    const pos = resolveNodePosition(def);
    return {
      level: def.level,
      x: pos.x,
      y: pos.y,
      orbitIndex: def.orbitIndex ?? NEPTUNE_ORBIT,
      nodeStyle: def.nodeStyle,
      planetId: def.planetId,
      isOuterNode: def.isOuterNode,
    };
  });
}

export const WORLD2_MAP_NODES: MapNodeLayout[] = buildMapNodes();

export function getWorld2MapNode(level: number): MapNodeLayout {
  const index = level - 11;
  return WORLD2_MAP_NODES[index] ?? WORLD2_MAP_NODES[0];
}

export function getWorld2MapRouteLevels(): number[] {
  return WORLD2_MAP_NODES.map((node) => node.level);
}
