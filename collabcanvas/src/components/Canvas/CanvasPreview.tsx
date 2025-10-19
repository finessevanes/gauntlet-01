import { Rect, Circle, Line } from 'react-konva';
import { getTrianglePoints } from './canvasHelpers';

interface CanvasPreviewProps {
  previewRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  previewCircle: {
    x: number;
    y: number;
    radius: number;
  } | null;
  previewTriangle: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  previewPath?: number[] | null;
  previewSprayParticles?: Array<{x: number, y: number, size: number}> | null;
  activeTool: string;
  selectedColor: string;
}

export default function CanvasPreview({
  previewRect,
  previewCircle,
  previewTriangle,
  previewPath,
  previewSprayParticles,
  activeTool,
  selectedColor,
}: CanvasPreviewProps) {
  return (
    <>
      {/* Preview rectangle while drawing */}
      {previewRect && activeTool === 'rectangle' && (
        <Rect
          x={previewRect.x}
          y={previewRect.y}
          width={previewRect.width}
          height={previewRect.height}
          fill={selectedColor}
          opacity={0.5}
          stroke={selectedColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      )}

      {/* Preview circle while drawing */}
      {previewCircle && activeTool === 'circle' && (
        <Circle
          x={previewCircle.x}
          y={previewCircle.y}
          radius={previewCircle.radius}
          fill={selectedColor}
          opacity={0.5}
          stroke={selectedColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      )}

      {/* Preview triangle while drawing */}
      {previewTriangle && activeTool === 'triangle' && (
        <Line
          points={getTrianglePoints(previewTriangle.x, previewTriangle.y, previewTriangle.width, previewTriangle.height)}
          closed={true}
          fill={selectedColor}
          opacity={0.5}
          stroke={selectedColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      )}

      {/* Preview path while drawing */}
      {previewPath && activeTool === 'pencil' && previewPath.length >= 4 && (
        <Line
          points={previewPath}
          stroke={selectedColor}
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
          opacity={0.7}
          listening={false}
        />
      )}

      {/* Preview spray particles while spraying */}
      {previewSprayParticles && activeTool === 'spray' && previewSprayParticles.length > 0 && (
        <>
          {previewSprayParticles.map((particle, index) => (
            <Circle
              key={`preview-particle-${index}`}
              x={particle.x}
              y={particle.y}
              radius={particle.size}
              fill={selectedColor}
              opacity={0.7}
              listening={false}
            />
          ))}
        </>
      )}
    </>
  );
}

