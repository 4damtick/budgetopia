// @ts-expect-error Vite asset import
import coconutTreeImage from '../../Image Assets/buildings/cleaned/coco_tree_0-clean.png';
// @ts-expect-error Vite asset import
import treesImage from '../../Image Assets/buildings/cleaned/Trees-clean.png';

const decorImageMap = {
  coconut_trees: {
    src: coconutTreeImage,
    aspectRatio: 1071 / 1462,
    baseScale: 0.49,
    offsetY: -5.2,
  },
  trees: {
    src: treesImage,
    aspectRatio: 952 / 1098,
    baseScale: 0.58,
    offsetY: -4.4,
  },
};

const clusterOffsets = {
  1: [{ x: 0, y: 0, scale: 1 }],
  2: [
    { x: -5.2, y: 1.4, scale: 0.94 },
    { x: 5.2, y: -0.8, scale: 1.02 },
  ],
  3: [
    { x: -6.2, y: 2.2, scale: 0.9 },
    { x: 0.2, y: -1.4, scale: 1.04 },
    { x: 6.4, y: 1.1, scale: 0.94 },
  ],
};

export default function CoastalDecorSprite({ decor, size = 40 }) {
  const type = decor?.type || 'coconut_trees';
  const count = Math.min(3, Math.max(1, Number(decor?.count) || 1));
  const config = decorImageMap[type] || decorImageMap.coconut_trees;
  const placements = clusterOffsets[count] || clusterOffsets[1];
  const scale = size / 40;
  const frameSize = 40 * scale;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${frameSize} ${frameSize}`} className="overflow-visible">
      {placements.map((placement, index) => {
        const targetWidth = frameSize * config.baseScale * placement.scale;
        const targetHeight = targetWidth / config.aspectRatio;
        const x = ((frameSize - targetWidth) / 2) + (placement.x * scale);
        const y = frameSize - targetHeight - (1.6 * scale) + ((config.offsetY + placement.y) * scale);

        return (
          <image
            key={`${type}-${count}-${index}`}
            href={config.src}
            x={x}
            y={y}
            width={targetWidth}
            height={targetHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      })}
    </svg>
  );
}
