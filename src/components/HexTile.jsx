import { memo } from 'react';
// @ts-expect-error Vite asset import
import grassTexture from '../../Image Assets/grass.png';
// @ts-expect-error Vite asset import
import sandTexture from '../../Image Assets/sand.png';
// @ts-expect-error Vite asset import
import edgeCliffWater from '../../Image Assets/edge_cliff_water.png';

export const TILE_SIZE = 46;
export const TILE_SIDE_WIDTH = 9;
export const TILE_DEPTH = 11;
export const TILE_TOTAL_WIDTH = TILE_SIZE + TILE_SIDE_WIDTH;
export const TILE_TOTAL_HEIGHT = TILE_SIZE + TILE_DEPTH;

const TEXTURE_SIZE = 120;
const SHORE_BAND = 12;
const SHORE_CORNER_SIZE = 15;
const SOUTH_CLIFF_STRIP_HEIGHT = 9;
const SOUTH_CLIFF_IMAGE_WIDTH = TILE_SIZE * 1.7;
const SOUTH_CLIFF_IMAGE_HEIGHT = 18;
const SOUTH_CLIFF_IMAGE_X = -(SOUTH_CLIFF_IMAGE_WIDTH - TILE_SIZE) / 2;
const SOUTH_CLIFF_IMAGE_Y = TILE_SIZE - 1;
const TEXTURE_TRAVEL = TEXTURE_SIZE - TILE_SIZE;

function getTerrainTexture(terrain) {
  return terrain === 'sand' ? sandTexture : grassTexture;
}

function getTextureOffset(q, r) {
  const offsetX = ((q * 31) + (r * 19)) % (TEXTURE_TRAVEL + 1);
  const offsetY = ((q * 17) - (r * 23)) % (TEXTURE_TRAVEL + 1);
  return {
    x: offsetX < 0 ? offsetX + TEXTURE_TRAVEL + 1 : offsetX,
    y: offsetY < 0 ? offsetY + TEXTURE_TRAVEL + 1 : offsetY,
  };
}

function getPalette(terrain) {
  if (terrain === 'sand') {
    return {
      stroke: 'rgba(155, 119, 72, 0.52)',
      topTint: 'rgba(255, 247, 225, 0.2)',
      shoreLight: 'rgba(255, 249, 235, 0.32)',
      shoreWarm: 'rgba(222, 186, 126, 0.24)',
      frontTop: '#c8955d',
      frontBottom: '#875b34',
      sideTop: '#b5844d',
      sideBottom: '#6f4927',
      ridge: 'rgba(255, 244, 218, 0.36)',
      coastGlow: 'rgba(255, 241, 207, 0.36)',
      wetSand: 'rgba(198, 163, 106, 0.2)',
      foam: 'rgba(255, 255, 255, 0.34)',
    };
  }

  return {
    stroke: 'rgba(48, 98, 58, 0.56)',
    topTint: 'rgba(255, 255, 255, 0.08)',
    shoreLight: 'rgba(255, 249, 232, 0.14)',
    shoreWarm: 'rgba(215, 186, 136, 0.22)',
    frontTop: '#7f5a33',
    frontBottom: '#4b311a',
    sideTop: '#6c4a28',
    sideBottom: '#3c2514',
    ridge: 'rgba(174, 226, 144, 0.22)',
    coastGlow: 'rgba(255, 249, 232, 0.16)',
    wetSand: 'rgba(198, 163, 106, 0.12)',
    foam: 'rgba(255, 255, 255, 0.2)',
  };
}

const HexTile = memo(function HexTile({
  x,
  y,
  q,
  r,
  terrain = 'grass',
  onTileClick,
  occupied = false,
  isGloomy = false,
  showSouthFace = false,
  exposedNorth = false,
  exposedSouth = false,
  exposedEast = false,
  exposedWest = false,
}) {
  const texture = getTerrainTexture(terrain);
  const palette = getPalette(terrain);
  const topClipId = `tile-top-clip-${q}-${r}`;
  const southCliffClipId = `tile-south-cliff-${q}-${r}`;
  const frontGradientId = `tile-front-${q}-${r}`;
  const sideGradientId = `tile-side-${q}-${r}`;
  const northFadeId = `tile-north-${q}-${r}`;
  const westFadeId = `tile-west-${q}-${r}`;
  const southFadeId = `tile-south-${q}-${r}`;
  const eastFadeId = `tile-east-${q}-${r}`;
  const northFoamId = `tile-north-foam-${q}-${r}`;
  const westFoamId = `tile-west-foam-${q}-${r}`;
  const southFoamId = `tile-south-foam-${q}-${r}`;
  const eastFoamId = `tile-east-foam-${q}-${r}`;
  const northwestCornerId = `tile-nw-${q}-${r}`;
  const northeastCornerId = `tile-ne-${q}-${r}`;
  const southwestCornerId = `tile-sw-${q}-${r}`;
  const southeastCornerId = `tile-se-${q}-${r}`;
  const textureOffset = getTextureOffset(q, r);
  const isCoastTile = terrain === 'sand' && (exposedNorth || exposedSouth || exposedEast || exposedWest);
  const showFrontFace = showSouthFace && terrain !== 'grass' && !isCoastTile;
  const showSideFace = false;
  const showDropShadow = showFrontFace || showSideFace;
  const showSouthWaterCliff = showSouthFace;

  return (
    <button
      type="button"
      className="absolute cursor-pointer border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-[1.015]"
      style={{
        left: x,
        top: y,
        width: TILE_TOTAL_WIDTH,
        height: TILE_TOTAL_HEIGHT,
      }}
      onClick={() => onTileClick(q, r, occupied)}
      aria-label={`Tile ${q}, ${r}`}
    >
      <svg
        width={TILE_TOTAL_WIDTH}
        height={TILE_TOTAL_HEIGHT}
        viewBox={`0 0 ${TILE_TOTAL_WIDTH} ${TILE_TOTAL_HEIGHT}`}
        className="overflow-visible drop-shadow-[0_10px_18px_rgba(15,23,42,0.24)]"
      >
        <defs>
          <clipPath id={topClipId}>
            <rect x="0" y="0" width={TILE_SIZE} height={TILE_SIZE} />
          </clipPath>
          <clipPath id={southCliffClipId}>
            <rect x="0" y={TILE_SIZE - 1} width={TILE_SIZE} height={SOUTH_CLIFF_STRIP_HEIGHT} />
          </clipPath>
          <linearGradient id={frontGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.ridge} stopOpacity="0.6" />
            <stop offset="14%" stopColor={palette.frontTop} />
            <stop offset="100%" stopColor={palette.frontBottom} />
          </linearGradient>
          <linearGradient id={sideGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.ridge} stopOpacity="0.48" />
            <stop offset="18%" stopColor={palette.sideTop} />
            <stop offset="100%" stopColor={palette.sideBottom} />
          </linearGradient>
          <linearGradient id={northFadeId} x1="0" y1="0" x2="0" y2="1">
            {isCoastTile ? (
              <>
                <stop offset="0%" stopColor={palette.foam} />
                <stop offset="24%" stopColor={palette.coastGlow} />
                <stop offset="54%" stopColor={palette.shoreWarm} />
                <stop offset="100%" stopColor="transparent" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={palette.shoreLight} />
                <stop offset="100%" stopColor="transparent" />
              </>
            )}
          </linearGradient>
          <linearGradient id={westFadeId} x1="0" y1="0" x2="1" y2="0">
            {isCoastTile ? (
              <>
                <stop offset="0%" stopColor={palette.foam} />
                <stop offset="22%" stopColor={palette.coastGlow} />
                <stop offset="50%" stopColor={palette.shoreWarm} />
                <stop offset="100%" stopColor="transparent" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={palette.shoreLight} />
                <stop offset="100%" stopColor="transparent" />
              </>
            )}
          </linearGradient>
          <linearGradient id={southFadeId} x1="0" y1="0" x2="0" y2="1">
            {isCoastTile ? (
              <>
                <stop offset="0%" stopColor="transparent" />
                <stop offset="38%" stopColor={palette.shoreWarm} />
                <stop offset="100%" stopColor={palette.wetSand} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor={palette.shoreWarm} />
              </>
            )}
          </linearGradient>
          <linearGradient id={eastFadeId} x1="0" y1="0" x2="1" y2="0">
            {isCoastTile ? (
              <>
                <stop offset="0%" stopColor="transparent" />
                <stop offset="38%" stopColor={palette.shoreWarm} />
                <stop offset="100%" stopColor={palette.wetSand} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor={palette.shoreWarm} />
              </>
            )}
          </linearGradient>
          <linearGradient id={northFoamId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.foam} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id={westFoamId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={palette.foam} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id={southFoamId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={palette.foam} />
          </linearGradient>
          <linearGradient id={eastFoamId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={palette.foam} />
          </linearGradient>
          <radialGradient id={northwestCornerId} cx="0" cy="0" r="1">
            <stop offset="0%" stopColor={palette.foam} stopOpacity="0.4" />
            <stop offset="38%" stopColor={palette.coastGlow} stopOpacity="0.34" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={northeastCornerId} cx="1" cy="0" r="1">
            <stop offset="0%" stopColor={palette.foam} stopOpacity="0.38" />
            <stop offset="38%" stopColor={palette.coastGlow} stopOpacity="0.32" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={southwestCornerId} cx="0" cy="1" r="1">
            <stop offset="0%" stopColor={palette.shoreWarm} stopOpacity="0.26" />
            <stop offset="54%" stopColor={palette.wetSand} stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={southeastCornerId} cx="1" cy="1" r="1">
            <stop offset="0%" stopColor={palette.shoreWarm} stopOpacity="0.26" />
            <stop offset="54%" stopColor={palette.wetSand} stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {showDropShadow && (
          <ellipse
            cx={TILE_SIZE * 0.55}
            cy={TILE_TOTAL_HEIGHT - 2}
            rx={TILE_SIZE * 0.42}
            ry="6"
            fill="rgba(8, 20, 36, 0.25)"
          />
        )}

        {showFrontFace && (
          <polygon
            points={`0,${TILE_SIZE} ${TILE_SIZE},${TILE_SIZE} ${TILE_SIZE + TILE_SIDE_WIDTH},${TILE_TOTAL_HEIGHT} 0,${TILE_TOTAL_HEIGHT}`}
            fill={`url(#${frontGradientId})`}
            stroke="rgba(60, 38, 20, 0.34)"
            strokeWidth="1"
          />
        )}

        {showSideFace && (
          <polygon
            points={`${TILE_SIZE},0 ${TILE_TOTAL_WIDTH},${TILE_SIDE_WIDTH * 0.82} ${TILE_TOTAL_WIDTH},${TILE_TOTAL_HEIGHT} ${TILE_SIZE},${TILE_SIZE}`}
            fill={`url(#${sideGradientId})`}
            stroke="rgba(60, 38, 20, 0.34)"
            strokeWidth="1"
          />
        )}

        <g clipPath={`url(#${topClipId})`}>
          <image
            href={texture}
            x={-textureOffset.x}
            y={-textureOffset.y}
            width={TEXTURE_SIZE}
            height={TEXTURE_SIZE}
            preserveAspectRatio="xMidYMid slice"
          />
          <rect x="0" y="0" width={TILE_SIZE} height={TILE_SIZE} fill={palette.topTint} />

          {exposedNorth && <rect x="0" y="0" width={TILE_SIZE} height={SHORE_BAND} fill={`url(#${northFadeId})`} />}
          {exposedWest && <rect x="0" y="0" width={SHORE_BAND} height={TILE_SIZE} fill={`url(#${westFadeId})`} />}
          {exposedSouth && <rect x="0" y={TILE_SIZE - SHORE_BAND} width={TILE_SIZE} height={SHORE_BAND} fill={`url(#${southFadeId})`} />}
          {exposedEast && <rect x={TILE_SIZE - SHORE_BAND} y="0" width={SHORE_BAND} height={TILE_SIZE} fill={`url(#${eastFadeId})`} />}

          {isCoastTile && exposedNorth && exposedWest && <rect x="0" y="0" width={SHORE_CORNER_SIZE} height={SHORE_CORNER_SIZE} fill={`url(#${northwestCornerId})`} />}
          {isCoastTile && exposedNorth && exposedEast && <rect x={TILE_SIZE - SHORE_CORNER_SIZE} y="0" width={SHORE_CORNER_SIZE} height={SHORE_CORNER_SIZE} fill={`url(#${northeastCornerId})`} />}
          {isCoastTile && exposedSouth && exposedWest && <rect x="0" y={TILE_SIZE - SHORE_CORNER_SIZE} width={SHORE_CORNER_SIZE} height={SHORE_CORNER_SIZE} fill={`url(#${southwestCornerId})`} />}
          {isCoastTile && exposedSouth && exposedEast && <rect x={TILE_SIZE - SHORE_CORNER_SIZE} y={TILE_SIZE - SHORE_CORNER_SIZE} width={SHORE_CORNER_SIZE} height={SHORE_CORNER_SIZE} fill={`url(#${southeastCornerId})`} />}

          {isCoastTile && exposedNorth && <rect x="0" y="0" width={TILE_SIZE} height="3" fill={`url(#${northFoamId})`} />}
          {isCoastTile && exposedWest && <rect x="0" y="0" width="3" height={TILE_SIZE} fill={`url(#${westFoamId})`} />}
          {isCoastTile && exposedSouth && <rect x="0" y={TILE_SIZE - 3} width={TILE_SIZE} height="3" fill={`url(#${southFoamId})`} />}
          {isCoastTile && exposedEast && <rect x={TILE_SIZE - 3} y="0" width="3" height={TILE_SIZE} fill={`url(#${eastFoamId})`} />}
        </g>

        {showSouthWaterCliff && (
          <g clipPath={`url(#${southCliffClipId})`}>
            <image
              href={edgeCliffWater}
              x={SOUTH_CLIFF_IMAGE_X}
              y={SOUTH_CLIFF_IMAGE_Y}
              width={SOUTH_CLIFF_IMAGE_WIDTH}
              height={SOUTH_CLIFF_IMAGE_HEIGHT}
              preserveAspectRatio="xMidYMin slice"
              opacity="0.98"
            />
          </g>
        )}

        <rect x="0" y="0" width={TILE_SIZE} height={TILE_SIZE} fill="none" stroke={palette.stroke} strokeWidth="0.9" />

        {isGloomy && (
          <>
            <rect x="0" y="0" width={TILE_SIZE} height={TILE_SIZE} fill="rgba(71, 85, 105, 0.18)" />
            {showFrontFace && <polygon points={`0,${TILE_SIZE} ${TILE_SIZE},${TILE_SIZE} ${TILE_SIZE + TILE_SIDE_WIDTH},${TILE_TOTAL_HEIGHT} 0,${TILE_TOTAL_HEIGHT}`} fill="rgba(30, 41, 59, 0.16)" />}
            {showSideFace && <polygon points={`${TILE_SIZE},0 ${TILE_TOTAL_WIDTH},${TILE_SIDE_WIDTH * 0.82} ${TILE_TOTAL_WIDTH},${TILE_TOTAL_HEIGHT} ${TILE_SIZE},${TILE_SIZE}`} fill="rgba(15, 23, 42, 0.18)" />}
          </>
        )}
      </svg>
    </button>
  );
});

export default HexTile;
