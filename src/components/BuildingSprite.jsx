// @ts-expect-error Vite asset import
import houseImage from '../../Image Assets/buildings/cleaned/house-clean.png';
// @ts-expect-error Vite asset import
import clockTowerImage from '../../Image Assets/buildings/cleaned/clocktower-clean.png';
// @ts-expect-error Vite asset import
import harborImage from '../../Image Assets/buildings/cleaned/harbor-clean.png';
// @ts-expect-error Vite asset import
import shopImage from '../../Image Assets/buildings/cleaned/Shop-clean.png';
// @ts-expect-error Vite asset import
import windmillImage from '../../Image Assets/buildings/cleaned/Windmill-clean.png';
// @ts-expect-error Vite asset import
import hotelImage from '../../Image Assets/buildings/cleaned/Hotel-clean.png';
// @ts-expect-error Vite asset import
import bankImage from '../../Image Assets/buildings/cleaned/Bank-clean.png';
// @ts-expect-error Vite asset import
import townHallImage from '../../Image Assets/buildings/cleaned/Town_hall-clean.png';

function LevelDots({ level = 1, scale = 1, y = 38 }) {
  return Array.from({ length: level }, (_, index) => (
    <circle key={`dot-${index}`} cx={(14 + index * 6) * scale} cy={y * scale} r={1.5 * scale} fill="#ffd700" />
  ));
}

function renderShape(part, scale, key) {
  if (!part) return null;
  if (Array.isArray(part)) return part.map((item, index) => renderShape(item, scale, `${key}-${index}`));
  if (part.shape === 'rect') {
    return <rect key={key} x={part.x * scale} y={part.y * scale} width={part.w * scale} height={part.h * scale} fill={part.fill} rx={part.rx ? part.rx * scale : 0} />;
  }
  if (part.shape === 'circle') {
    return <circle key={key} cx={part.cx * scale} cy={part.cy * scale} r={part.r * scale} fill={part.fill} />;
  }
  if (part.type === 'triangle' || part.type === 'flat') {
    const points = part.points.map(point => `${point[0] * scale},${point[1] * scale}`).join(' ');
    return <polygon key={key} points={points} fill={part.fill} />;
  }
  if (part.type === 'cross') {
    const cx = part.cx * scale;
    const cy = part.cy * scale;
    const r = part.r * scale;
    const width = 2 * scale;
    return (
      <g key={key} fill={part.fill}>
        <rect x={cx - width / 2} y={cy - r} width={width} height={r * 2} />
        <rect x={cx - r} y={cy - width / 2} width={r * 2} height={width} />
      </g>
    );
  }
  return null;
}

const buildingImageMap = {
  small_house: {
    src: houseImage,
    aspectRatio: 1869 / 1491,
    uiScale: 0.98,
    mapScale: 0.98,
    mapOffsetX: 0,
    mapOffsetY: 0,
  },
  clock_tower: {
    src: clockTowerImage,
    aspectRatio: 1642 / 1506,
    uiScale: 0.95,
    mapScale: 1.72,
    mapOffsetX: 16.5,
    mapOffsetY: -2.4,
  },
  harbor: {
    src: harborImage,
    aspectRatio: 2071 / 1443,
    uiScale: 0.98,
    mapScale: 1.77,
    mapOffsetX: 12.5,
    mapOffsetY: 0.4,
  },
  shop: {
    src: shopImage,
    aspectRatio: 1169 / 1128,
    uiScale: 0.88,
    mapScale: 1.04,
    mapOffsetX: 0,
    mapOffsetY: -0.4,
  },
  windmill: {
    src: windmillImage,
    aspectRatio: 933 / 1130,
    uiScale: 0.9,
    mapScale: 1.2,
    mapOffsetX: 1.2,
    mapOffsetY: -2.8,
  },
  hotel: {
    src: hotelImage,
    aspectRatio: 1209 / 1124,
    uiScale: 0.93,
    mapScale: 1.12,
    mapOffsetX: 0,
    mapOffsetY: -0.6,
  },
  bank: {
    src: bankImage,
    aspectRatio: 1196 / 1141,
    uiScale: 0.93,
    mapScale: 1.1,
    mapOffsetX: 0,
    mapOffsetY: -0.2,
  },
  town_hall: {
    src: townHallImage,
    aspectRatio: 1156 / 1171,
    uiScale: 0.93,
    mapScale: 1.08,
    mapOffsetX: 0,
    mapOffsetY: -0.8,
  },
};

const buildingPaths = {
  small_house: {},
  shop: {
    body: { shape: 'rect', x: 12, y: 16, w: 16, h: 16, fill: '#f9a825' },
    roof: { type: 'flat', points: [[8, 16], [32, 16], [28, 10], [12, 10]], fill: '#e65100' },
    sign: { shape: 'rect', x: 15, y: 22, w: 10, h: 4, fill: '#fff' },
    windows: [{ shape: 'rect', x: 13, y: 18, w: 5, h: 5, fill: '#87CEEB' }, { shape: 'rect', x: 22, y: 18, w: 5, h: 5, fill: '#87CEEB' }],
  },
  windmill: {
    base: { shape: 'rect', x: 16, y: 20, w: 8, h: 14, fill: '#d7ccc8' },
    top: { type: 'triangle', points: [[16, 20], [24, 20], [20, 10]], fill: '#8d6e63' },
    blades: { type: 'cross', cx: 20, cy: 12, r: 8, fill: '#bdbdbd' },
  },
  clock_tower: {
    body: { shape: 'rect', x: 14, y: 16, w: 12, h: 18, fill: '#bcaaa4' },
    top: { shape: 'rect', x: 16, y: 10, w: 8, h: 8, fill: '#8d6e63' },
    spire: { type: 'triangle', points: [[16, 10], [24, 10], [20, 2]], fill: '#ffd54f' },
    clock: { shape: 'circle', cx: 20, cy: 14, r: 3, fill: '#fff' },
    windows: [{ shape: 'rect', x: 17, y: 20, w: 6, h: 6, fill: '#87CEEB' }],
  },
  harbor: {},
  hotel: {
    body: { shape: 'rect', x: 8, y: 16, w: 24, h: 18, fill: '#90a4ae' },
    roof: { type: 'flat', points: [[6, 16], [34, 16], [32, 12], [8, 12]], fill: '#546e7a' },
    door: { shape: 'rect', x: 17, y: 26, w: 6, h: 8, fill: '#4e342e' },
    windows: [
      { shape: 'rect', x: 10, y: 18, w: 4, h: 4, fill: '#fff9c4' },
      { shape: 'rect', x: 16, y: 18, w: 4, h: 4, fill: '#fff9c4' },
      { shape: 'rect', x: 22, y: 18, w: 4, h: 4, fill: '#fff9c4' },
      { shape: 'rect', x: 10, y: 24, w: 4, h: 4, fill: '#fff9c4' },
      { shape: 'rect', x: 22, y: 24, w: 4, h: 4, fill: '#fff9c4' },
    ],
  },
  bank: {
    body: { shape: 'rect', x: 10, y: 16, w: 20, h: 18, fill: '#e0e0e0' },
    columns: [{ shape: 'rect', x: 11, y: 16, w: 3, h: 18, fill: '#bdbdbd' }, { shape: 'rect', x: 26, y: 16, w: 3, h: 18, fill: '#bdbdbd' }],
    roof: { type: 'triangle', points: [[8, 16], [32, 16], [20, 8]], fill: '#616161' },
    door: { shape: 'rect', x: 17, y: 26, w: 6, h: 8, fill: '#3e2723' },
    windows: [{ shape: 'rect', x: 13, y: 18, w: 4, h: 5, fill: '#bbdefb' }, { shape: 'rect', x: 23, y: 18, w: 4, h: 5, fill: '#bbdefb' }],
  },
};

function renderImageBuilding(config, scale, isMapTile, level, size) {
  const frameSize = 40 * scale;
  const targetWidth = frameSize * (isMapTile ? config.mapScale : config.uiScale);
  const targetHeight = targetWidth / config.aspectRatio;
  const offsetX = isMapTile ? (config.mapOffsetX || 0) * scale : 0;
  const offsetY = isMapTile ? (config.mapOffsetY || 0) * scale : 0;
  const x = ((frameSize - targetWidth) / 2) + offsetX;
  const y = isMapTile
    ? frameSize - targetHeight - (2.2 * scale) + offsetY
    : (frameSize - targetHeight) / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${frameSize} ${frameSize}`} className="overflow-visible">
      <image href={config.src} x={x} y={y} width={targetWidth} height={targetHeight} preserveAspectRatio="xMidYMid meet" />
      {!isMapTile && <LevelDots level={level} scale={scale} y={37} />}
    </svg>
  );
}

export default function BuildingSprite({ type, level = 1, size = 40, variant = 'ui' }) {
  const scale = size / 40;
  const isMap = variant === 'map' || variant === 'map-topdown' || variant === 'map-tile';
  const isMapTile = variant === 'map-tile';
  const imageBuilding = buildingImageMap[type];

  if (imageBuilding) {
    return renderImageBuilding(imageBuilding, scale, isMapTile, level, size);
  }

  const parts = buildingPaths[type] || buildingPaths.small_house;
  const bodyScaleX = isMapTile ? 0.82 : isMap ? 0.92 : 1;
  const bodyScaleY = isMapTile ? 0.82 : isMap ? 0.9 : 1;
  const translateX = isMapTile ? 3.6 * scale : isMap ? 2.5 * scale : 0;
  const translateY = isMapTile ? 3.6 * scale : isMap ? 1.5 * scale : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${40 * scale} ${40 * scale}`} className="overflow-visible">
      <g transform={`translate(${translateX} ${translateY}) scale(${bodyScaleX} ${bodyScaleY})`}>
        {Object.entries(parts).map(([key, part]) => (
          key === 'windows' || key === 'battlements_l' || key === 'battlements_r' ? null : renderShape(part, scale, key)
        ))}
        {Object.entries(parts).filter(([key]) => key === 'windows' || key === 'battlements_l' || key === 'battlements_r').map(([key, part]) => renderShape(part, scale, key))}
      </g>
      {!isMapTile && <LevelDots level={level} scale={scale} y={isMap ? 34 : 38} />}
    </svg>
  );
}
