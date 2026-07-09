export type MapNodeStyle = 'planet' | 'moon' | 'asteroid' | 'star' | 'comet';

export interface MapNodeLayout {
  level: number;
  x: number;
  y: number;
  orbitIndex: number;
  nodeStyle: MapNodeStyle;
}

export const SUN_POSITION = { x: 0.08, y: 0.48 };

export const WORLD2_ORBITS = [
  { rx: 0.12, ry: 0.1 },
  { rx: 0.22, ry: 0.18 },
  { rx: 0.34, ry: 0.28 },
  { rx: 0.46, ry: 0.36 },
  { rx: 0.58, ry: 0.44 },
];

export const WORLD2_MAP_NODES: MapNodeLayout[] = [
  { level: 11, x: 0.42, y: 0.42, orbitIndex: 0, nodeStyle: 'planet' },
  { level: 12, x: 0.48, y: 0.52, orbitIndex: 1, nodeStyle: 'planet' },
  { level: 13, x: 0.54, y: 0.38, orbitIndex: 1, nodeStyle: 'moon' },
  { level: 14, x: 0.58, y: 0.55, orbitIndex: 2, nodeStyle: 'planet' },
  { level: 15, x: 0.64, y: 0.44, orbitIndex: 2, nodeStyle: 'planet' },
  { level: 16, x: 0.7, y: 0.5, orbitIndex: 3, nodeStyle: 'asteroid' },
  { level: 17, x: 0.76, y: 0.4, orbitIndex: 3, nodeStyle: 'moon' },
  { level: 18, x: 0.82, y: 0.52, orbitIndex: 4, nodeStyle: 'asteroid' },
  { level: 19, x: 0.88, y: 0.42, orbitIndex: 4, nodeStyle: 'comet' },
  { level: 20, x: 0.94, y: 0.48, orbitIndex: 4, nodeStyle: 'star' },
];

export function getWorld2MapNode(level: number): MapNodeLayout {
  const index = level - 11;
  return WORLD2_MAP_NODES[index] ?? WORLD2_MAP_NODES[0];
}

export function getWorld2MapRouteLevels(): number[] {
  return WORLD2_MAP_NODES.map((node) => node.level);
}
