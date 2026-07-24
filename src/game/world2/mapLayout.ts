export type MapNodeStyle = 'planet' | 'moon' | 'asteroid' | 'star' | 'comet';

export type MapPlanetId = 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'titan';

export interface World2Orbit {
  /** Radius as a fraction of map width from the sun (circular orbit). */
  radius: number;
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

/** Must match SolarSystemMap CONTENT_WIDTH / CONTENT_HEIGHT. */
export const MAP_WIDTH_TO_HEIGHT = 780 / 560;

/** Four gas-giant orbits (Jupiter → Neptune), inner decorative rings removed. */
export const WORLD2_ORBITS: World2Orbit[] = [
  { radius: 0.11 },
  { radius: 0.17 },
  { radius: 0.23 },
  { radius: 0.29 },
];

const JUPITER_ORBIT = 0;
const SATURN_ORBIT = 1;
const URANUS_ORBIT = 2;
const NEPTUNE_ORBIT = 3;

/** Distinct angles so orbit strokes and planets do not stack on one radial line. */
const JUPITER_ANGLE = -Math.PI / 2;
const SATURN_ANGLE = -1.32;
const URANUS_ANGLE = -1.72;
const NEPTUNE_ANGLE = -2.18;

export function positionOnOrbit(orbitIndex: number, angle: number): { x: number; y: number } {
  const orbit = WORLD2_ORBITS[orbitIndex];
  return {
    x: SUN_POSITION.x + orbit.radius * Math.cos(angle),
    y: SUN_POSITION.y + orbit.radius * MAP_WIDTH_TO_HEIGHT * Math.sin(angle),
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
  { level: 11, orbitIndex: JUPITER_ORBIT, angle: JUPITER_ANGLE, nodeStyle: 'planet', planetId: 'jupiter' },
  { level: 12, orbitIndex: SATURN_ORBIT, angle: SATURN_ANGLE, nodeStyle: 'planet', planetId: 'saturn' },
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
