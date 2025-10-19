import type { ShapeData } from '../../services/canvasService';
import type { User } from 'firebase/auth';
import { calculateTextDimensions } from '../../utils/textEditingHelpers';

/**
 * Get the lock status of a shape for the current user
 */
export function getShapeLockStatus(
  shape: ShapeData,
  user: User | null,
  selectedShapeId: string | null
): 'locked-by-me' | 'locked-by-other' | 'unlocked' {
  if (!user) return 'unlocked';
  
  // IMPORTANT: Only show as "locked-by-me" if it's actually SELECTED
  // This prevents the green outline from appearing independently
  if (shape.lockedBy === user.uid && selectedShapeId === shape.id) {
    return 'locked-by-me';
  } else if (shape.lockedBy && shape.lockedAt && shape.lockedBy !== user.uid) {
    // Check if lock is still valid (< 5s)
    const lockAge = Date.now() - shape.lockedAt.toMillis();
    if (lockAge < 5000) {
      return 'locked-by-other';
    }
  }
  
  return 'unlocked';
}

/**
 * Calculate triangle points from bounding box
 */
export function getTrianglePoints(x: number, y: number, width: number, height: number): number[] {
  return [
    x + width / 2, y,              // Top vertex
    x, y + height,                  // Bottom-left vertex
    x + width, y + height,          // Bottom-right vertex
  ];
}

/**
 * Get cursor style based on current interaction mode
 */
export function getCursorStyle(
  isDrawing: boolean,
  isPanning: boolean,
  activeTool: string,
  isSpacePressed?: boolean
): string {
  if (isDrawing) return 'crosshair'; // Drawing a shape
  if (isPanning) return 'grabbing'; // Actively panning
  if (isSpacePressed && !isPanning) return 'grab'; // Space held but not yet dragging
  if (activeTool === 'bomb') return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewport=\'0 0 40 40\' style=\'font-size:32px\'><text y=\'32\'>💣</text></svg>") 16 16, crosshair'; // Bomb mode: show bomb cursor
  if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'triangle' || activeTool === 'pencil') return 'crosshair'; // Shape tool: ready to draw
  if (activeTool === 'text') return 'text'; // Text mode: show text cursor
  if (activeTool === 'pan') return 'grab'; // Pan mode: ready to pan
  return 'default'; // Select mode: default cursor (objects will have pointer cursor on hover)
}

/**
 * Calculate shape dimensions dynamically (for text and consistent handling)
 */
export function calculateShapeDimensions(shape: ShapeData): {
  width: number;
  height: number;
} {
  if (shape.type === 'text') {
    const textContent = shape.text || '';
    const textFontSize = shape.fontSize || 16;
    const fontWeight = shape.fontWeight || 'normal';
    
    // Use improved text dimension calculation
    const textDimensions = calculateTextDimensions(textContent, textFontSize, fontWeight);
    const padding = 4;
    
    return {
      width: textDimensions.width + padding * 2,
      height: textDimensions.height + padding * 2,
    };
  } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
    return {
      width: shape.width,
      height: shape.height,
    };
  } else if (shape.type === 'circle' && shape.radius !== undefined) {
    return {
      width: shape.radius * 2,
      height: shape.radius * 2,
    };
  }
  
  return { width: 0, height: 0 };
}

