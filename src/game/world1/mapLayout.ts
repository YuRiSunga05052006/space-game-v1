export type MapNodeStyle = 'planet' | 'moon' | 'asteroid' | 'star' | 'comet';

export type MapPlanetId = 'mercury' | 'venus' | 'earth' | 'moon' | 'mars';

export interface World1Orbit {
  /** Radius as a fraction of map width from the sun. */
  radius: number;
}

export interface MapNodeLayout {
  level: number;
  x: number;
  y: number;
  orbitIndex: number;
  nodeStyle: MapNodeStyle;
  planetId?: MapPlanetId;
  isBossNode?: boolean;
  isBeltLevel?: boolean;
}

/** Sun anchor in normalized map coordinates. */
export const SUN_POSITION = { x: 0.90, y: 0.50 };

/** Four planetary orbits (inner → outer): Mercury, Venus, Earth, Mars. */
export const WORLD1_ORBITS: World1Orbit[] = [
  { radius: 0.10 },
  { radius: 0.19 },
  { radius: 0.30 },
  { radius: 0.42 },
];

export interface World1AsteroidBelt {
  /** Inner edge (fraction of map width from Sun), just beyond Mars. */
  innerRadius: number;
  /** Outer edge (fraction of map width from Sun), ends past Level 10. */
  outerRadius: number;
}

/** Gap between the 4th orbit and the belt inner edge. */
const BELT_INNER_GAP = 0.025;
/** Padding beyond Level 10 so the finale sits inside the belt. */
const BELT_OUTER_PADDING = 0.04;

export function distanceFromSun(x: number, y: number): number {
  const dx = x - SUN_POSITION.x;
  const dy = (y - SUN_POSITION.y) * MAP_WIDTH_TO_HEIGHT;
  return Math.hypot(dx, dy);
}

function computeAsteroidBelt(nodes: MapNodeLayout[]): World1AsteroidBelt {
  const beltNodes = nodes.filter((node) => node.isBeltLevel);
  const maxBeltDistance = Math.max(...beltNodes.map((node) => distanceFromSun(node.x, node.y)));
  return {
    innerRadius: WORLD1_ORBITS[3].radius + BELT_INNER_GAP,
    outerRadius: maxBeltDistance + BELT_OUTER_PADDING,
  };
}

/** Moon sub-orbit radius around Earth (fraction of map width). */
export const EARTH_MOON_ORBIT_RADIUS = 0.042;

/** Must match SolarSystemMap CONTENT_WIDTH / CONTENT_HEIGHT. */
export const MAP_WIDTH_TO_HEIGHT = 780 / 560;

/** Offset from Earth: ISS sits slightly top-left. */
export const SECRET_ISS_OFFSET = { dx: -0.028, dy: -0.032 * MAP_WIDTH_TO_HEIGHT };

/** Angle on Earth's sub-orbit placing the Moon slightly bottom-right. */
export const MOON_ORBIT_ANGLE = Math.PI / 4;

export function positionOnOrbit(orbitRadius: number, angle: number): { x: number; y: number } {
  return {
    x: SUN_POSITION.x + orbitRadius * Math.cos(angle),
    y: SUN_POSITION.y + orbitRadius * MAP_WIDTH_TO_HEIGHT * Math.sin(angle),
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
  isBossNode?: boolean;
  earthMoonOffset?: boolean;
  isBeltLevel?: boolean;
}

/** Earth on the 3rd orbit — ~7 o'clock. */
const EARTH_ORBIT_ANGLE = 2.05;
/** Mars on the 4th orbit — ~11 o'clock, top-left. */
const MARS_ORBIT_ANGLE = -2.35;
/** Mercury on the 1st orbit — ~2 o'clock. */
const MERCURY_ORBIT_ANGLE = -Math.PI / 6;
/** Venus on the 2nd orbit — ~10 o'clock. */
const VENUS_ORBIT_ANGLE = (7 * Math.PI) / 6;

const NODE_DEFS: NodeDef[] = [
  { level: 1, orbitIndex: 2, angle: EARTH_ORBIT_ANGLE, nodeStyle: 'planet', planetId: 'earth' },
  { level: 2, earthMoonOffset: true, nodeStyle: 'moon', planetId: 'moon' },
  { level: 3, orbitIndex: 1, angle: VENUS_ORBIT_ANGLE, nodeStyle: 'planet', planetId: 'venus' },
  { level: 4, orbitIndex: 0, angle: MERCURY_ORBIT_ANGLE, nodeStyle: 'planet', planetId: 'mercury' },
  { level: 5, orbitIndex: 3, angle: MARS_ORBIT_ANGLE, nodeStyle: 'planet', planetId: 'mars', isBossNode: true },
  { level: 6, x: 0.26, y: 0.50, nodeStyle: 'asteroid', isBeltLevel: true },
  { level: 7, x: 0.18, y: 0.36, nodeStyle: 'asteroid', isBeltLevel: true },
  { level: 8, x: 0.12, y: 0.52, nodeStyle: 'asteroid', isBeltLevel: true },
  { level: 9, x: 0.10, y: 0.38, nodeStyle: 'asteroid', isBeltLevel: true },
  { level: 10, x: 0.06, y: 0.20, nodeStyle: 'star', isBeltLevel: true },
];

function resolveNodePosition(def: NodeDef, earthPos?: { x: number; y: number }): { x: number; y: number } {
  if (def.earthMoonOffset && earthPos) {
    return {
      x: earthPos.x + EARTH_MOON_ORBIT_RADIUS * Math.cos(MOON_ORBIT_ANGLE),
      y: earthPos.y + EARTH_MOON_ORBIT_RADIUS * MAP_WIDTH_TO_HEIGHT * Math.sin(MOON_ORBIT_ANGLE),
    };
  }
  if (def.x !== undefined && def.y !== undefined) {
    return { x: def.x, y: def.y };
  }
  const orbitRadius = WORLD1_ORBITS[def.orbitIndex ?? 0].radius;
  return positionOnOrbit(orbitRadius, def.angle ?? 0);
}

function buildMapNodes(): MapNodeLayout[] {
  const earthDef = NODE_DEFS.find((d) => d.level === 1)!;
  const earthPos = resolveNodePosition(earthDef);

  return NODE_DEFS.map((def) => {
    const pos = resolveNodePosition(def, earthPos);
    return {
      level: def.level,
      x: pos.x,
      y: pos.y,
      orbitIndex: def.orbitIndex ?? 3,
      nodeStyle: def.nodeStyle,
      planetId: def.planetId,
      isBossNode: def.isBossNode,
      isBeltLevel: def.isBeltLevel,
    };
  });
}

export const WORLD1_MAP_NODES: MapNodeLayout[] = buildMapNodes();

export const WORLD1_ASTEROID_BELT: World1AsteroidBelt = computeAsteroidBelt(WORLD1_MAP_NODES);

/** Scattered background asteroids in the belt / outer region. */
export const WORLD1_BACKGROUND_ASTEROIDS: { x: number; y: number; size: number }[] = [
  { x: 0.14, y: 0.58, size: 3 },
  { x: 0.08, y: 0.45, size: 4 },
  { x: 0.20, y: 0.58, size: 2 },
  { x: 0.22, y: 0.28, size: 3 },
  { x: 0.04, y: 0.62, size: 2 },
  { x: 0.16, y: 0.68, size: 3 },
  { x: 0.28, y: 0.18, size: 2 },
  { x: 0.30, y: 0.58, size: 4 },
  { x: 0.34, y: 0.42, size: 2 },
  { x: 0.18, y: 0.72, size: 3 },
  { x: 0.06, y: 0.78, size: 2 },
  { x: 0.32, y: 0.12, size: 3 },
  { x: 0.38, y: 0.58, size: 2 },
  { x: 0.36, y: 0.30, size: 3 },
  { x: 0.24, y: 0.44, size: 2 },
  { x: 0.14, y: 0.14, size: 2 },
  { x: 0.08, y: 0.28, size: 3 },
];

/** Secret Level 1 (ISS) — slightly top-left of Earth. */
export const SECRET_ISS_MAP_POSITION = (() => {
  const earth = WORLD1_MAP_NODES[0];
  return {
    x: earth.x + SECRET_ISS_OFFSET.dx,
    y: earth.y + SECRET_ISS_OFFSET.dy,
  };
})();

export function getWorld1MapNode(level: number): MapNodeLayout {
  return WORLD1_MAP_NODES[level - 1] ?? WORLD1_MAP_NODES[0];
}

export function getWorld1MapRouteLevels(): number[] {
  return WORLD1_MAP_NODES.map((node) => node.level);
}

export function getEarthPosition(): { x: number; y: number } {
  const earth = WORLD1_MAP_NODES[0];
  return { x: earth.x, y: earth.y };
}
