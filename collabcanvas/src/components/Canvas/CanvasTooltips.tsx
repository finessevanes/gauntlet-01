import { Group, Rect, Text } from 'react-konva';
import type { ShapeData } from '../../services/canvasService';

interface CanvasTooltipsProps {
  isResizing: boolean;
  isRotating: boolean;
  previewDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  previewRotation: number | null;
  selectedShapeId: string | null;
  shapes: ShapeData[];
  stageScale: number;
}

export default function CanvasTooltips({
  isResizing,
  isRotating,
  previewDimensions,
  previewRotation,
  selectedShapeId,
  shapes,
  stageScale,
}: CanvasTooltipsProps) {
  return (
    <>
      {/* Dimension tooltip while resizing - always appears upright above the shape */}
      {isResizing && previewDimensions && selectedShapeId && (() => {
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) return null;
        
        // Calculate the center of the shape using current (preview) dimensions
        const centerX = previewDimensions.x + previewDimensions.width / 2;
        const centerY = previewDimensions.y + previewDimensions.height / 2;
        
        // Position tooltip above the shape, accounting for rotation
        // Use the maximum dimension to ensure tooltip is always above the shape bounds
        const maxDimension = Math.max(previewDimensions.height / 2, previewDimensions.width / 2);
        const tooltipY = centerY - maxDimension - (50 / stageScale);
        
        return (
          <Group x={centerX} y={tooltipY}>
            {/* Tooltip background */}
            <Rect
              x={-(60 / stageScale)}
              y={-(20 / stageScale)}
              width={120 / stageScale}
              height={40 / stageScale}
              fill="white"
              stroke="#999"
              strokeWidth={1 / stageScale}
              cornerRadius={6 / stageScale}
              shadowBlur={8 / stageScale}
              shadowOpacity={0.3}
              shadowOffsetY={2 / stageScale}
              listening={false}
            />
            {/* Tooltip text */}
            <Text
              text={`${Math.round(previewDimensions.width)} × ${Math.round(previewDimensions.height)}`}
              x={-(55 / stageScale)}
              y={-(10 / stageScale)}
              width={110 / stageScale}
              fontSize={16 / stageScale}
              fill="#333"
              fontFamily="'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              fontStyle="500"
              align="center"
              listening={false}
            />
          </Group>
        );
      })()}

      {/* Angle tooltip while rotating */}
      {isRotating && previewRotation !== null && selectedShapeId && (() => {
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) return null;
        
        // Calculate rotation handle position (same as in rotation handle rendering)
        let centerX: number;
        let handleY: number;
        const handleDistance = 50;
        
        if (shape.type === 'circle' && shape.radius !== undefined) {
          centerX = shape.x;
          handleY = shape.y - shape.radius - handleDistance;
        } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
          centerX = shape.x + shape.width / 2;
          handleY = shape.y - handleDistance;
        } else {
          return null;
        }
        
        // Position tooltip 15px above rotation handle
        const tooltipX = centerX;
        const tooltipY = handleY - (15 / stageScale);
        
        // Normalize angle to 0-360 and round to nearest degree
        const normalizedAngle = ((previewRotation % 360) + 360) % 360;
        const displayAngle = Math.round(normalizedAngle);
        
        return (
          <Group x={tooltipX} y={tooltipY}>
            {/* Tooltip background */}
            <Rect
              x={-(35 / stageScale)}
              y={-(20 / stageScale)}
              width={70 / stageScale}
              height={40 / stageScale}
              fill="white"
              stroke="#999"
              strokeWidth={1 / stageScale}
              cornerRadius={6 / stageScale}
              shadowBlur={8 / stageScale}
              shadowOpacity={0.3}
              shadowOffsetY={2 / stageScale}
              listening={false}
            />
            {/* Tooltip text - angle in degrees */}
            <Text
              text={`${displayAngle}°`}
              x={-(30 / stageScale)}
              y={-(10 / stageScale)}
              width={60 / stageScale}
              fontSize={16 / stageScale}
              fill="#333"
              fontFamily="'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              fontStyle="500"
              align="center"
              listening={false}
            />
          </Group>
        );
      })()}
    </>
  );
}

