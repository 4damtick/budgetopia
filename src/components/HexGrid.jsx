import { memo, useCallback, useMemo, useRef, useState } from 'react';
import HexTile, {
  TILE_DEPTH,
  TILE_SIZE,
  TILE_TOTAL_HEIGHT,
  TILE_TOTAL_WIDTH,
} from './HexTile';
import BuildingSprite from './BuildingSprite';
import CoastalDecorSprite from './CoastalDecorSprite';
// @ts-expect-error Vite asset import
import backgroundWater from '../../Image Assets/background_water.png';

const BUILDING_SIZE = TILE_SIZE;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const TAP_DRAG_THRESHOLD = 10;
const CAMERA_EDGE_PAD = 56;
const WATER_ASPECT_RATIO = 2816 / 1536;
const WATER_PAD_X = 72;
const WATER_PAD_Y = 84;

const gridToPixel = (q, r) => ({
  x: q * TILE_SIZE,
  y: r * TILE_SIZE,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function getTouchCenter(touches) {
  if (touches.length === 0) return { x: 0, y: 0 };
  const total = Array.from(touches).reduce((point, touch) => ({
    x: point.x + touch.clientX,
    y: point.y + touch.clientY,
  }), { x: 0, y: 0 });
  return { x: total.x / touches.length, y: total.y / touches.length };
}

function getCameraBounds(scale, viewportRect, contentWidth, contentHeight) {
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const travelX = Math.max(0, (scaledWidth - viewportRect.width) / 2);
  const travelY = Math.max(0, (scaledHeight - viewportRect.height) / 2);
  const slackX = travelX > 0 ? CAMERA_EDGE_PAD : 24;
  const slackY = travelY > 0 ? CAMERA_EDGE_PAD * 0.8 : 18;

  return {
    minX: -travelX - slackX,
    maxX: travelX + slackX,
    minY: -travelY - slackY,
    maxY: travelY + slackY,
  };
}

function SeaBackdrop({ width, height, left, top }) {
  return (
    <div
      className="pointer-events-none absolute overflow-hidden rounded-[2.5rem]"
      style={{
        left,
        top,
        width,
        height,
        background: 'linear-gradient(180deg, rgba(120, 220, 242, 0.2), rgba(43, 170, 225, 0.24) 34%, rgba(17, 107, 196, 0.32) 68%, rgba(16, 52, 110, 0.4))',
      }}
    >
      <div
        className="absolute inset-[-12%] opacity-[0.86]"
        style={{
          backgroundImage: `url(${backgroundWater})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          transform: 'none',
          transformOrigin: 'center',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_76%_30%,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,transparent_72%,rgba(18,66,140,0.16))]" />
    </div>
  );
}

const BuildingLayer = memo(function BuildingLayer({ tile, building, onTileClick }) {
  const footprintSize = BUILDING_SIZE;

  return (
    <button
      type="button"
      className="absolute flex items-center justify-center rounded-full border-0 bg-transparent p-0"
      style={{
        left: tile.x + (TILE_SIZE - footprintSize) / 2,
        top: tile.y + (TILE_SIZE - footprintSize) / 2,
        width: footprintSize,
        height: footprintSize,
      }}
      onClick={() => onTileClick(tile.q, tile.r, true)}
      aria-label={`Building ${building.buildingType} on ${tile.q}, ${tile.r}`}
    >
      <BuildingSprite type={building.buildingType} level={building.level} size={BUILDING_SIZE} variant="map-tile" />
    </button>
  );
});

const CoastalDecorLayer = memo(function CoastalDecorLayer({ tile, decor }) {
  const footprintSize = BUILDING_SIZE;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: tile.x + (TILE_SIZE - footprintSize) / 2,
        top: tile.y + (TILE_SIZE - footprintSize) / 2,
        width: footprintSize,
        height: footprintSize,
      }}
      aria-hidden="true"
    >
      <CoastalDecorSprite decor={decor} size={BUILDING_SIZE} />
    </div>
  );
});

export default function HexGrid({ island, buildings, onHexClick, weather = 'sunny' }) {
  const viewportRef = useRef(null);
  const interactionRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    lastTapMoved: false,
    pinchDistance: 0,
    pinchScale: 1,
  });
  const [{ scale, x, y }, setCamera] = useState({ scale: 1, x: 0, y: 0 });

  const buildingMap = useMemo(() => {
    const map = {};
    buildings.forEach(building => {
      if (building.hexPosition) map[`${building.hexPosition.q},${building.hexPosition.r}`] = building;
    });
    return map;
  }, [buildings]);

  const { adjustedTiles, containerWidth, containerHeight, worldWidth, worldHeight, worldLeft, worldTop } = useMemo(() => {
    const tileLookup = new Set(island.tiles.map(tile => `${tile.q},${tile.r}`));
    const rawTiles = island.tiles.map(tile => {
      const projected = gridToPixel(tile.q, tile.r);
      const hasNorth = tileLookup.has(`${tile.q},${tile.r - 1}`);
      const hasSouth = tileLookup.has(`${tile.q},${tile.r + 1}`);
      const hasEast = tileLookup.has(`${tile.q + 1},${tile.r}`);
      const hasWest = tileLookup.has(`${tile.q - 1},${tile.r}`);

      return {
        ...tile,
        ...projected,
        showSouthFace: !hasSouth,
        showEastFace: !hasEast,
        exposedNorth: !hasNorth,
        exposedSouth: !hasSouth,
        exposedEast: !hasEast,
        exposedWest: !hasWest,
      };
    });

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    rawTiles.forEach(tile => {
      minX = Math.min(minX, tile.x);
      maxX = Math.max(maxX, tile.x + TILE_TOTAL_WIDTH);
      minY = Math.min(minY, tile.y);
      maxY = Math.max(maxY, tile.y + TILE_TOTAL_HEIGHT + 8);
    });

    const padX = TILE_SIZE * 1.9;
    const padY = TILE_SIZE * 1.65;
    const offsetX = -minX + padX;
    const offsetY = -minY + padY;

    const containerWidth = (maxX - minX) + padX * 2;
    const containerHeight = (maxY - minY) + padY * 2;
    const minBackdropWidth = containerWidth + WATER_PAD_X * 2;
    const minBackdropHeight = containerHeight + WATER_PAD_Y * 2;
    let backdropWidth = minBackdropWidth;
    let backdropHeight = backdropWidth / WATER_ASPECT_RATIO;

    if (backdropHeight < minBackdropHeight) {
      backdropHeight = minBackdropHeight;
      backdropWidth = backdropHeight * WATER_ASPECT_RATIO;
    }

    return {
      adjustedTiles: rawTiles.map(tile => ({ ...tile, x: tile.x + offsetX, y: tile.y + offsetY })),
      containerWidth,
      containerHeight,
      worldWidth: backdropWidth,
      worldHeight: backdropHeight,
      worldLeft: (containerWidth - backdropWidth) / 2,
      worldTop: (containerHeight - backdropHeight) / 2,
    };
  }, [island]);

  const renderItems = useMemo(() => {
    const items = [];
    adjustedTiles.forEach(tile => {
      const key = `${tile.q},${tile.r}`;
      const building = buildingMap[key];
      const decor = island.decorMap?.[key];
      const baseSortY = tile.y + TILE_SIZE + (tile.showSouthFace ? TILE_DEPTH : 0);
      items.push({ type: 'tile', key: `tile-${key}`, tile, building, sortY: baseSortY, sortX: tile.x, layer: 0 });
      if (decor) {
        items.push({ type: 'decor', key: `decor-${key}`, tile, decor, sortY: baseSortY, sortX: tile.x, layer: 1 });
      }
      if (building) {
        items.push({ type: 'building', key: `building-${building.id}`, tile, building, sortY: baseSortY, sortX: tile.x, layer: 2 });
      }
    });

    return items.sort((left, right) => (left.sortY - right.sortY) || (left.layer - right.layer) || (left.sortX - right.sortX));
  }, [adjustedTiles, buildingMap, island.decorMap]);

  const applyCamera = (nextScale, nextX, nextY) => {
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    if (!viewportRect) {
      setCamera({ scale: clampedScale, x: nextX, y: nextY });
      return;
    }

    const bounds = getCameraBounds(clampedScale, viewportRect, containerWidth, containerHeight);
    setCamera({
      scale: clampedScale,
      x: clamp(nextX, bounds.minX, bounds.maxX),
      y: clamp(nextY, bounds.minY, bounds.maxY),
    });
  };

  const zoomAtPoint = (clientX, clientY, nextScale) => {
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    if (!viewportRect) {
      applyCamera(nextScale, x, y);
      return;
    }

    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const pointX = clientX - viewportRect.left;
    const pointY = clientY - viewportRect.top;
    const relativeX = (pointX - x) / scale;
    const relativeY = (pointY - y) / scale;
    applyCamera(clampedScale, pointX - relativeX * clampedScale, pointY - relativeY * clampedScale);
  };

  const handlePointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    interactionRef.current.isDragging = true;
    interactionRef.current.lastTapMoved = false;
    interactionRef.current.startX = event.clientX;
    interactionRef.current.startY = event.clientY;
    interactionRef.current.originX = x;
    interactionRef.current.originY = y;
  };

  const handlePointerMove = event => {
    if (!interactionRef.current.isDragging) return;
    const deltaX = event.clientX - interactionRef.current.startX;
    const deltaY = event.clientY - interactionRef.current.startY;
    if (Math.hypot(deltaX, deltaY) > TAP_DRAG_THRESHOLD) interactionRef.current.lastTapMoved = true;
    applyCamera(scale, interactionRef.current.originX + deltaX, interactionRef.current.originY + deltaY);
  };

  const handlePointerUp = () => {
    interactionRef.current.isDragging = false;
  };

  const handleWheel = event => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    zoomAtPoint(event.clientX, event.clientY, scale + delta);
  };

  const handleTouchStart = event => {
    if (event.touches.length === 2) {
      interactionRef.current.pinchDistance = getTouchDistance(event.touches);
      interactionRef.current.pinchScale = scale;
      interactionRef.current.lastTapMoved = true;
      interactionRef.current.isDragging = false;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      interactionRef.current.isDragging = true;
      interactionRef.current.lastTapMoved = false;
      interactionRef.current.startX = touch.clientX;
      interactionRef.current.startY = touch.clientY;
      interactionRef.current.originX = x;
      interactionRef.current.originY = y;
    }
  };

  const handleTouchMove = event => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const center = getTouchCenter(event.touches);
      const nextScale = interactionRef.current.pinchScale * (distance / (interactionRef.current.pinchDistance || distance || 1));
      zoomAtPoint(center.x, center.y, nextScale);
      interactionRef.current.lastTapMoved = true;
      return;
    }

    if (!interactionRef.current.isDragging || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - interactionRef.current.startX;
    const deltaY = touch.clientY - interactionRef.current.startY;
    if (Math.hypot(deltaX, deltaY) > TAP_DRAG_THRESHOLD) interactionRef.current.lastTapMoved = true;
    applyCamera(scale, interactionRef.current.originX + deltaX, interactionRef.current.originY + deltaY);
  };

  const handleTouchEnd = () => {
    interactionRef.current.isDragging = false;
  };

  const handleTileClick = useCallback((q, r, occupied) => {
    if (interactionRef.current.lastTapMoved) {
      interactionRef.current.lastTapMoved = false;
      return;
    }
    onHexClick(q, r, occupied);
  }, [onHexClick]);

  const isGloomy = weather === 'gloomy';

  return (
    <div className="relative h-full w-full px-0 pb-0">
      <div
        ref={viewportRef}
        className={`absolute inset-0 overflow-hidden bg-sky-950/70 shadow-[0_25px_80px_rgba(2,6,23,0.45)] ${isGloomy ? 'grayscale-[0.85] saturate-[0.45] brightness-[0.85]' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_30%_78%,rgba(255,255,255,0.08),transparent_22%)]" />
        {isGloomy && <div className="pointer-events-none absolute inset-0 bg-slate-700/30" />}
        <div
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: containerWidth,
            height: containerHeight,
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
          }}
        >
          <div className="relative h-full w-full">
            <SeaBackdrop width={worldWidth} height={worldHeight} left={worldLeft} top={worldTop} />
            {renderItems.map(item => {
              if (item.type === 'tile') {
                return (
                  <HexTile
                    key={item.key}
                    x={item.tile.x}
                    y={item.tile.y}
                    q={item.tile.q}
                    r={item.tile.r}
                    terrain={item.tile.terrain}
                    onTileClick={handleTileClick}
                    occupied={!!item.building}
                    isGloomy={isGloomy}
                    showSouthFace={item.tile.showSouthFace}
                    exposedNorth={item.tile.exposedNorth}
                    exposedSouth={item.tile.exposedSouth}
                    exposedEast={item.tile.exposedEast}
                    exposedWest={item.tile.exposedWest}
                  />
                );
              }

              if (item.type === 'decor') {
                return <CoastalDecorLayer key={item.key} tile={item.tile} decor={item.decor} />;
              }

              return (
                <BuildingLayer
                  key={item.key}
                  tile={item.tile}
                  building={item.building}
                  onTileClick={handleTileClick}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
