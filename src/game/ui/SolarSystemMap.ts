import Phaser from 'phaser';
import { isLevelUnlocked } from '../storyProgress';
import { getLevelMeta, getBackgroundTheme, getMapLayout } from '../levelResolver';
import { isSecretIssUnlocked } from '../worldProgress';
import type { MapNodeStyle, MapPlanetId, MapNodeLayout as World1MapNodeLayout } from '../world1/mapLayout';
import { SECRET_ISS_MAP_POSITION } from '../world1/mapLayout';

const FINALE_STAR_COLOR = 0xffdd66;
const PLANET_RADII: Record<MapPlanetId, number> = {
  mercury: 7,
  venus: 10,
  earth: 12,
  moon: 6,
  mars: 9,
};

function drawWorld1Background(g: Phaser.GameObjects.Graphics): void {
  const pad = 500;
  const left = -CONTENT_WIDTH / 2 - pad;
  const top = -CONTENT_HEIGHT / 2 - pad;
  const w = CONTENT_WIDTH + pad * 2;
  const h = CONTENT_HEIGHT + pad * 2;

  g.fillStyle(0x000000, 1);
  g.fillRect(left, top, w, h);

  g.fillStyle(0xffffff, 0.1);
  for (let i = 0; i < 200; i++) {
    const x = Phaser.Math.Between(left, left + w);
    const y = Phaser.Math.Between(top, top + h);
    g.fillCircle(x, y, Phaser.Math.FloatBetween(0.3, 0.8));
  }
}

function drawMiniIss(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x9a9aaa, 1);
  g.fillRect(-14, -1, 28, 2);
  g.fillStyle(0xd8d8e8, 1);
  g.fillRect(-12, -5, 7, 10);
  g.fillRect(-3, -6, 6, 12);
  g.fillRect(5, -4, 9, 8);
  g.fillStyle(0xd4a843, 0.9);
  g.fillRect(-20, -3, 3, 6);
  g.fillRect(-24, -3, 3, 6);
  g.fillRect(17, -3, 3, 6);
  g.fillRect(21, -3, 3, 6);
  g.fillStyle(0xa8c8e8, 0.75);
  g.fillCircle(-1, -8, 3);
}

function drawAsteroidBeltDonut(
  g: Phaser.GameObjects.Graphics,
  sunPos: { x: number; y: number },
  innerRadius: number,
  outerRadius: number,
): void {
  const innerPx = innerRadius * CONTENT_WIDTH;
  const outerPx = outerRadius * CONTENT_WIDTH;

  g.fillStyle(0x1c1c22, 0.72);
  g.beginPath();
  g.arc(sunPos.x, sunPos.y, outerPx, 0, Math.PI * 2, false);
  g.arc(sunPos.x, sunPos.y, innerPx, 0, Math.PI * 2, true);
  g.closePath();
  g.fillPath();

  g.lineStyle(1, 0x2a2a32, 0.55);
  g.strokeCircle(sunPos.x, sunPos.y, innerPx);
  g.lineStyle(1, 0x2a2a32, 0.45);
  g.strokeCircle(sunPos.x, sunPos.y, outerPx);
}

function drawBackgroundAsteroids(
  g: Phaser.GameObjects.Graphics,
  asteroids: { x: number; y: number; size: number }[],
): void {
  for (const ast of asteroids) {
    const pos = mapToContent(ast.x, ast.y);
    g.fillStyle(0x444444, 0.35);
    g.fillCircle(pos.x, pos.y, ast.size);
    g.fillStyle(0x555555, 0.2);
    g.fillCircle(pos.x + ast.size * 0.4, pos.y - ast.size * 0.3, ast.size * 0.5);
  }
}

function drawPlanetNode(
  g: Phaser.GameObjects.Graphics,
  planetId: MapPlanetId,
  worldId: string,
  alpha: number,
  radius: number,
): void {
  const theme = getBackgroundTheme(worldId, planetId === 'moon' ? 'moon' : planetId);

  switch (planetId) {
    case 'mercury': {
      g.fillStyle(theme.planetColor, alpha);
      g.fillCircle(0, 0, radius);
      g.fillStyle(0x554433, alpha * 0.6);
      g.fillCircle(-3, -2, radius * 0.25);
      g.fillCircle(4, 3, radius * 0.2);
      g.fillCircle(1, -4, radius * 0.15);
      break;
    }
    case 'venus': {
      g.fillStyle(theme.planetColor, alpha);
      g.fillCircle(0, 0, radius);
      g.fillStyle(0xffdd99, alpha * 0.25);
      g.fillCircle(-radius * 0.2, -radius * 0.25, radius * 0.35);
      break;
    }
    case 'earth': {
      g.fillStyle(theme.planetColor, alpha);
      g.fillCircle(0, 0, radius);
      g.fillStyle(0x33aa66, alpha * 0.85);
      g.fillEllipse(-2, 2, radius * 0.7, radius * 0.5);
      g.fillStyle(0xffffff, alpha * 0.12);
      g.fillCircle(-radius * 0.25, -radius * 0.3, radius * 0.25);
      break;
    }
    case 'moon': {
      g.fillStyle(theme.planetColor, alpha * 0.9);
      g.fillCircle(0, 0, radius);
      g.fillStyle(0xaaaaaa, alpha * 0.4);
      g.fillCircle(-1, -1, radius * 0.35);
      break;
    }
    case 'mars': {
      g.fillStyle(theme.planetColor, alpha);
      g.fillCircle(0, 0, radius);
      g.fillStyle(0xff8866, alpha * 0.3);
      g.fillCircle(-radius * 0.2, -radius * 0.15, radius * 0.3);
      break;
    }
  }
}

function drawEarthMoonOrbit(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
): void {
  const center = mapToContent(cx, cy);
  const orbitR = radius * CONTENT_WIDTH;
  g.lineStyle(1, 0x445566, 0.4);
  g.strokeCircle(center.x, center.y, orbitR);
}

export interface SolarSystemMapConfig {
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  worldId: string;
  initialLevel: number;
  initialSecretId?: string;
  onSelectLevel: (level: number, secretId?: string) => void;
}

export interface SolarSystemMapHandle {
  container: Phaser.GameObjects.Container;
  setSelectedLevel: (level: number, secretId?: string) => void;
  destroy: () => void;
}

const CONTENT_WIDTH = 780;
const CONTENT_HEIGHT = 560;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.2;

function mapToContent(nx: number, ny: number): { x: number; y: number } {
  return {
    x: -CONTENT_WIDTH / 2 + nx * CONTENT_WIDTH,
    y: -CONTENT_HEIGHT / 2 + ny * CONTENT_HEIGHT,
  };
}

function drawNodeShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  style: MapNodeStyle,
  color: number,
  alpha: number,
  radius: number,
): void {
  g.fillStyle(color, alpha);
  switch (style) {
    case 'star':
      g.fillCircle(x, y, radius + 2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.fillTriangle(
          x + Math.cos(a) * (radius + 6),
          y + Math.sin(a) * (radius + 6),
          x + Math.cos(a + 0.25) * radius * 0.4,
          y + Math.sin(a + 0.25) * radius * 0.4,
          x + Math.cos(a - 0.25) * radius * 0.4,
          y + Math.sin(a - 0.25) * radius * 0.4,
        );
      }
      break;
    case 'comet':
      g.fillCircle(x + 4, y, radius * 0.8);
      g.fillStyle(color, alpha * 0.4);
      g.fillTriangle(x - radius, y, x + 2, y - radius * 0.5, x + 2, y + radius * 0.5);
      break;
    case 'asteroid':
      g.fillStyle(0x666677, alpha);
      g.fillCircle(x - 2, y + 1, radius * 0.9);
      g.fillCircle(x + 3, y - 2, radius * 0.7);
      g.fillStyle(0x888899, alpha * 0.6);
      g.fillCircle(x + 1, y + 2, radius * 0.5);
      break;
    case 'moon':
      g.fillCircle(x, y, radius * 0.75);
      break;
    case 'planet':
    default:
      g.fillCircle(x, y, radius);
      g.fillStyle(0xffffff, alpha * 0.15);
      g.fillCircle(x - radius * 0.25, y - radius * 0.25, radius * 0.35);
      break;
  }
}

function getWorld1NodeRadius(nodeStyle: MapNodeStyle, planetId?: MapPlanetId): number {
  if (planetId) return PLANET_RADII[planetId];
  if (nodeStyle === 'star') return 10;
  if (nodeStyle === 'asteroid') return 7;
  return 8;
}

export function createSolarSystemMap(
  scene: Phaser.Scene,
  config: SolarSystemMapConfig,
): SolarSystemMapHandle {
  const {
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
    worldId,
    initialLevel,
    initialSecretId,
    onSelectLevel,
  } = config;

  const layout = getMapLayout(worldId);

  let selectedLevel = initialLevel;
  let selectedSecretId = initialSecretId;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStart = { x: 0, y: 0, panX: 0, panY: 0 };
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  const root = scene.add.container(viewportX, viewportY).setDepth(10);

  const frame = scene.add.graphics();
  frame.fillStyle(0x000000, 1);
  frame.fillRoundedRect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight, 12);
  frame.lineStyle(1, 0x223344, 0.8);
  frame.strokeRoundedRect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight, 12);
  root.add(frame);

  const maskShape = scene.make.graphics({}, false);
  maskShape.fillStyle(0xffffff);
  maskShape.fillRoundedRect(
    viewportX - viewportWidth / 2,
    viewportY - viewportHeight / 2,
    viewportWidth,
    viewportHeight,
    12,
  );
  const mask = maskShape.createGeometryMask();
  root.setMask(mask);

  const content = scene.add.container(0, 0);
  root.add(content);

  if (worldId === 'world1') {
    const bg = scene.add.graphics();
    drawWorld1Background(bg);
    content.add(bg);
  }

  const sunPos = mapToContent(layout.sunPosition.x, layout.sunPosition.y);

  if (worldId === 'world1' && layout.asteroidBelt) {
    const beltGfx = scene.add.graphics();
    drawAsteroidBeltDonut(
      beltGfx,
      sunPos,
      layout.asteroidBelt.innerRadius,
      layout.asteroidBelt.outerRadius,
    );
    content.add(beltGfx);
  }

  const selectionRing = scene.add.graphics();
  content.add(selectionRing);

  const orbits = scene.add.graphics();
  for (const orbit of layout.orbits) {
    const orbitColor = worldId === 'world1' ? 0xffffff : 0x334455;
    const orbitAlpha = worldId === 'world1' ? 0.55 : 0.35;
    orbits.lineStyle(1, orbitColor, orbitAlpha);
    if ('radius' in orbit) {
      orbits.strokeCircle(sunPos.x, sunPos.y, orbit.radius * CONTENT_WIDTH);
    } else {
      orbits.strokeEllipse(
        sunPos.x,
        sunPos.y,
        orbit.rx * CONTENT_WIDTH * 2,
        orbit.ry * CONTENT_HEIGHT * 2,
      );
    }
  }
  content.add(orbits);

  if (layout.earthPosition && layout.earthMoonOrbitRadius) {
    const moonOrbitGfx = scene.add.graphics();
    drawEarthMoonOrbit(
      moonOrbitGfx,
      layout.earthPosition.x,
      layout.earthPosition.y,
      layout.earthMoonOrbitRadius,
    );
    content.add(moonOrbitGfx);
  }

  if (layout.backgroundAsteroids) {
    const asteroidGfx = scene.add.graphics();
    drawBackgroundAsteroids(asteroidGfx, layout.backgroundAsteroids);
    content.add(asteroidGfx);
  }

  const sun = scene.add.graphics();
  const sunOuter = worldId === 'world1' ? 40 : 32;
  const sunCore = worldId === 'world1' ? 22 : 18;
  sun.fillStyle(0xffaa22, 0.25);
  sun.fillCircle(sunPos.x, sunPos.y, sunOuter);
  sun.fillStyle(0xffcc44, 0.95);
  sun.fillCircle(sunPos.x, sunPos.y, sunCore);
  sun.lineStyle(1, 0xffdd66, 0.6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    sun.lineBetween(
      sunPos.x + Math.cos(a) * (sunCore + 4),
      sunPos.y + Math.sin(a) * (sunCore + 4),
      sunPos.x + Math.cos(a) * sunOuter,
      sunPos.y + Math.sin(a) * sunOuter,
    );
  }
  content.add(sun);

  const route = scene.add.graphics();
  const routeLevels = layout.getRouteLevels();
  route.lineStyle(2, 0x00d4ff, 0.45);
  for (let i = 0; i < routeLevels.length - 1; i++) {
    const from = mapToContent(layout.getMapNode(routeLevels[i]).x, layout.getMapNode(routeLevels[i]).y);
    const to = mapToContent(layout.getMapNode(routeLevels[i + 1]).x, layout.getMapNode(routeLevels[i + 1]).y);
    const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(6, Math.floor(dist / 10));
    for (let s = 0; s < steps; s += 2) {
      const t0 = s / steps;
      const t1 = Math.min((s + 1) / steps, 1);
      route.lineBetween(
        from.x + (to.x - from.x) * t0,
        from.y + (to.y - from.y) * t0,
        from.x + (to.x - from.x) * t1,
        from.y + (to.y - from.y) * t1,
      );
    }
  }
  content.add(route);

  const clampPan = (): void => {
    const halfW = (CONTENT_WIDTH * scale) / 2;
    const halfH = (CONTENT_HEIGHT * scale) / 2;
    const viewHalfW = viewportWidth / 2;
    const viewHalfH = viewportHeight / 2;
    const maxPanX = Math.max(0, halfW - viewHalfW * 0.4);
    const maxPanY = Math.max(0, halfH - viewHalfH * 0.4);
    panX = Phaser.Math.Clamp(panX, -maxPanX, maxPanX);
    panY = Phaser.Math.Clamp(panY, -maxPanY, maxPanY);
  };

  const applyTransform = (): void => {
    clampPan();
    content.setScale(scale);
    content.setPosition(panX, panY);
    redrawSelection();
  };

  const focusOnPosition = (nx: number, ny: number): void => {
    const pos = mapToContent(nx, ny);
    panX = -pos.x * scale;
    panY = -pos.y * scale;
    applyTransform();
  };

  const focusOnLevel = (level: number, secretId?: string): void => {
    if (secretId === 'iss') {
      focusOnPosition(SECRET_ISS_MAP_POSITION.x, SECRET_ISS_MAP_POSITION.y);
      return;
    }
    const node = layout.getMapNode(level);
    focusOnPosition(node.x, node.y);
  };

  const redrawSelection = (): void => {
    selectionRing.clear();
    let pos: { x: number; y: number };
    let themeId: string;
    let ringRadius = 20;

    if (selectedSecretId === 'iss') {
      pos = mapToContent(SECRET_ISS_MAP_POSITION.x, SECRET_ISS_MAP_POSITION.y);
      themeId = 'iss';
    } else {
      const node = layout.getMapNode(selectedLevel);
      pos = mapToContent(node.x, node.y);
      themeId = getLevelMeta(worldId, selectedLevel).themeId;
      if (worldId === 'world1') {
        const w1Node = node as World1MapNodeLayout;
        ringRadius = getWorld1NodeRadius(w1Node.nodeStyle, w1Node.planetId) + 8;
        if (selectedLevel === 5) ringRadius = 32;
      }
    }

    const theme = getBackgroundTheme(worldId, themeId);
    selectionRing.lineStyle(3, theme.accentColor, 0.95);
    selectionRing.strokeCircle(pos.x, pos.y, ringRadius);
  };

  const buildNode = (level: number): void => {
    const nodeLayout = layout.getMapNode(level);
    const meta = getLevelMeta(worldId, level);
    const theme = getBackgroundTheme(worldId, meta.themeId);
    const unlocked = isLevelUnlocked(level);
    const pos = mapToContent(nodeLayout.x, nodeLayout.y);
    const nodeContainer = scene.add.container(pos.x, pos.y);

    const nodeGfx = scene.add.graphics();
    const alpha = unlocked ? 0.95 : 0.35;

    const isBossNode = worldId === 'world1' && level === 5;
    const isFinaleStar = nodeLayout.nodeStyle === 'star';
    const w1Node = worldId === 'world1' ? (nodeLayout as World1MapNodeLayout) : undefined;
    const nodeRadius = worldId === 'world1' && w1Node
      ? getWorld1NodeRadius(w1Node.nodeStyle, w1Node.planetId)
      : (isFinaleStar ? 10 : nodeLayout.nodeStyle === 'moon' ? 6 : 8);

    if (isBossNode) {
      nodeGfx.fillStyle(0xff2244, 0.25);
      nodeGfx.fillCircle(0, 0, 28);
      nodeGfx.lineStyle(2, 0xff2244, 0.7);
      nodeGfx.strokeCircle(0, 0, 28);
    }

    if (worldId === 'world1' && w1Node) {
      if (w1Node.planetId) {
        drawPlanetNode(nodeGfx, w1Node.planetId, worldId, alpha, nodeRadius);
      } else if (isFinaleStar) {
        drawNodeShape(nodeGfx, 0, 0, 'star', FINALE_STAR_COLOR, alpha, nodeRadius);
      } else {
        drawNodeShape(nodeGfx, 0, 0, 'asteroid', theme.planetColor, alpha, nodeRadius);
      }
    } else {
      drawNodeShape(
        nodeGfx,
        0,
        0,
        nodeLayout.nodeStyle,
        theme.planetColor,
        alpha,
        nodeRadius,
      );
    }

    nodeContainer.add(nodeGfx);

    const labelOffset = nodeRadius + 6;
    const label = scene.add.text(0, labelOffset, `${level}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '10px',
      fontStyle: '700',
      color: unlocked ? '#ffffff' : '#556677',
    }).setOrigin(0.5);
    nodeContainer.add(label);

    const hitSize = Math.max(36, (nodeRadius + 10) * 2);
    nodeContainer.setInteractive(
      new Phaser.Geom.Rectangle(-hitSize / 2, -hitSize / 2, hitSize, hitSize),
      Phaser.Geom.Rectangle.Contains,
    );
    if (unlocked) {
      nodeContainer.input!.cursor = 'pointer';
    }

    nodeContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      isPanning = false;
    });
    nodeContainer.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      selectedLevel = level;
      selectedSecretId = undefined;
      redrawSelection();
      onSelectLevel(level);
    });

    content.add(nodeContainer);
  };

  layout.nodes.forEach((node) => buildNode(node.level));

  if (worldId === 'world1' && isSecretIssUnlocked()) {
    const secretPos = mapToContent(SECRET_ISS_MAP_POSITION.x, SECRET_ISS_MAP_POSITION.y);
    const secretContainer = scene.add.container(secretPos.x, secretPos.y);

    const secretGfx = scene.add.graphics();
    drawMiniIss(secretGfx);
    secretContainer.add(secretGfx);

    const secretLabel = scene.add.text(0, 16, 'ISS', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(0.5);
    secretContainer.add(secretLabel);

    secretContainer.setInteractive(
      new Phaser.Geom.Rectangle(-18, -18, 36, 36),
      Phaser.Geom.Rectangle.Contains,
    );
    secretContainer.input!.cursor = 'pointer';

    secretContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      isPanning = false;
    });
    secretContainer.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      selectedSecretId = 'iss';
      selectedLevel = 1;
      redrawSelection();
      onSelectLevel(1, 'iss');
    });

    content.add(secretContainer);
  }

  const panZone = scene.add.rectangle(0, 0, viewportWidth, viewportHeight, 0x000000, 0);
  panZone.setInteractive({ draggable: false });
  root.addAt(panZone, 0);

  panZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonDown()) {
      isPanning = true;
      panStart = { x: pointer.x, y: pointer.y, panX, panY };
    }
  });

  const onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (scene.input.pointer2.isDown && pinchStartDistance > 0) {
      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        scene.input.pointer2.x,
        scene.input.pointer2.y,
      );
      scale = Phaser.Math.Clamp(pinchStartScale * (distance / pinchStartDistance), MIN_ZOOM, MAX_ZOOM);
      applyTransform();
      return;
    }

    if (!isPanning || !pointer.isDown) return;
    panX = panStart.panX + (pointer.x - panStart.x);
    panY = panStart.panY + (pointer.y - panStart.y);
    applyTransform();
  };

  const onPointerUp = (): void => {
    isPanning = false;
    pinchStartDistance = 0;
  };

  const onWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    const bounds = root.getBounds();
    const pointer = scene.input.activePointer;
    if (!bounds.contains(pointer.x, pointer.y)) return;

    const prevScale = scale;
    scale = Phaser.Math.Clamp(scale - deltaY * 0.0015, MIN_ZOOM, MAX_ZOOM);
    const ratio = scale / prevScale;
    panX *= ratio;
    panY *= ratio;
    applyTransform();
  };

  const onPinchStart = (pointer: Phaser.Input.Pointer): void => {
    if (!scene.input.pointer2.isDown) return;
    const bounds = root.getBounds();
    if (!bounds.contains(pointer.x, pointer.y)) return;
    pinchStartDistance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      scene.input.pointer2.x,
      scene.input.pointer2.y,
    );
    pinchStartScale = scale;
  };

  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', onPointerUp);
  scene.input.on('wheel', onWheel);
  scene.input.on('pointerdown', onPinchStart);

  selectedLevel = initialLevel;
  selectedSecretId = initialSecretId;
  scale = 1;
  focusOnLevel(initialLevel, initialSecretId);
  redrawSelection();

  const hint = scene.add.text(0, viewportHeight / 2 - 18, 'Drag to pan  ·  Scroll/pinch to zoom', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '8px',
    color: '#445566',
  }).setOrigin(0.5);
  root.add(hint);

  const destroy = (): void => {
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('pointerup', onPointerUp);
    scene.input.off('wheel', onWheel);
    scene.input.off('pointerdown', onPinchStart);
    maskShape.destroy();
    root.destroy();
  };

  scene.events.once('shutdown', destroy);
  scene.events.once('destroy', destroy);

  return {
    container: root,
    setSelectedLevel: (level: number, secretId?: string) => {
      selectedLevel = level;
      selectedSecretId = secretId;
      focusOnLevel(level, secretId);
      redrawSelection();
      onSelectLevel(level, secretId);
    },
    destroy,
  };
}
