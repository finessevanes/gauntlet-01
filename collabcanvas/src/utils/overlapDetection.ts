/**
 * Overlap Detection Utilities
 * 
 * Provides functions to detect if two shapes overlap/intersect.
 * Used for smart z-index management - only reorder overlapping shapes.
 */

import type { ShapeData } from '../services/canvasService';

/**
 * Point interface for geometric calculations
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Main function to check if two shapes overlap
 */
export function shapesOverlap(shape1: ShapeData, shape2: ShapeData): boolean {
  // Handle circles specially
  if (shape1.type === 'circle' && shape2.type === 'circle') {
    return circlesOverlap(shape1, shape2);
  }
  
  if (shape1.type === 'circle') {
    return circleOverlapsRect(shape1, shape2);
  }
  
  if (shape2.type === 'circle') {
    return circleOverlapsRect(shape2, shape1);
  }
  
  // For rectangles, triangles, and text (all treated as rectangles)
  // Use Oriented Bounding Box (OBB) overlap detection
  return rectanglesOverlap(shape1, shape2);
}

/**
 * Check if two circles overlap
 */
function circlesOverlap(circle1: ShapeData, circle2: ShapeData): boolean {
  const radius1 = circle1.radius || circle1.width / 2;
  const radius2 = circle2.radius || circle2.width / 2;
  
  // Circle centers
  const cx1 = circle1.x + radius1;
  const cy1 = circle1.y + radius1;
  const cx2 = circle2.x + radius2;
  const cy2 = circle2.y + radius2;
  
  // Distance between centers
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Circles overlap if distance < sum of radii
  return distance < (radius1 + radius2);
}

/**
 * Check if a circle overlaps with a rectangle (including rotated rectangles)
 */
function circleOverlapsRect(circle: ShapeData, rect: ShapeData): boolean {
  const radius = circle.radius || circle.width / 2;
  const circleCenterX = circle.x + radius;
  const circleCenterY = circle.y + radius;
  
  // Get rectangle center
  const rectCenterX = rect.x + rect.width / 2;
  const rectCenterY = rect.y + rect.height / 2;
  
  // If rectangle is not rotated, use simpler AABB check
  if (!rect.rotation || rect.rotation === 0) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circleCenterX, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circleCenterY, rect.y + rect.height));
    
    // Check distance
    const dx = circleCenterX - closestX;
    const dy = circleCenterY - closestY;
    const distanceSquared = dx * dx + dy * dy;
    
    return distanceSquared < (radius * radius);
  }
  
  // For rotated rectangles, rotate circle center into rectangle's local space
  const rotation = (rect.rotation || 0) * Math.PI / 180;
  
  // Translate circle center to rect's local space
  const dx = circleCenterX - rectCenterX;
  const dy = circleCenterY - rectCenterY;
  
  // Rotate point around origin
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  // Now check against axis-aligned rect
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  
  const closestX = Math.max(-halfWidth, Math.min(localX, halfWidth));
  const closestY = Math.max(-halfHeight, Math.min(localY, halfHeight));
  
  const distX = localX - closestX;
  const distY = localY - closestY;
  const distanceSquared = distX * distX + distY * distY;
  
  return distanceSquared < (radius * radius);
}

/**
 * Check if two rectangles overlap (handles rotation using SAT - Separating Axis Theorem)
 */
function rectanglesOverlap(rect1: ShapeData, rect2: ShapeData): boolean {
  // If neither rectangle is rotated, use simple AABB check (faster)
  if ((!rect1.rotation || rect1.rotation === 0) && (!rect2.rotation || rect2.rotation === 0)) {
    return aabbOverlap(rect1, rect2);
  }
  
  // Use Separating Axis Theorem (SAT) for rotated rectangles
  return satOverlap(rect1, rect2);
}

/**
 * Axis-Aligned Bounding Box (AABB) overlap check
 */
function aabbOverlap(rect1: ShapeData, rect2: ShapeData): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Get the four corners of a rectangle (accounting for rotation)
 */
function getRectangleCorners(rect: ShapeData): Point[] {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const rotation = (rect.rotation || 0) * Math.PI / 180;
  
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  
  // Local corners (before rotation)
  const localCorners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
  
  // Rotate and translate to world space
  return localCorners.map(corner => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
}

/**
 * Get axes for SAT (perpendicular to edges)
 */
function getAxes(corners: Point[]): Point[] {
  const axes: Point[] = [];
  
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    
    // Edge vector
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    
    // Perpendicular (normal)
    const normal = { x: -edge.y, y: edge.x };
    
    // Normalize
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    axes.push({ x: normal.x / length, y: normal.y / length });
  }
  
  return axes;
}

/**
 * Project a polygon onto an axis
 */
function projectPolygon(axis: Point, corners: Point[]): { min: number; max: number } {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;
  
  for (let i = 1; i < corners.length; i++) {
    const projection = corners[i].x * axis.x + corners[i].y * axis.y;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  
  return { min, max };
}

/**
 * Separating Axis Theorem (SAT) overlap detection for rotated rectangles
 */
function satOverlap(rect1: ShapeData, rect2: ShapeData): boolean {
  const corners1 = getRectangleCorners(rect1);
  const corners2 = getRectangleCorners(rect2);
  
  // Get all axes to test (edges of both rectangles)
  const axes = [...getAxes(corners1), ...getAxes(corners2)];
  
  // Test each axis
  for (const axis of axes) {
    const projection1 = projectPolygon(axis, corners1);
    const projection2 = projectPolygon(axis, corners2);
    
    // Check if projections overlap
    if (projection1.max < projection2.min || projection2.max < projection1.min) {
      // Found a separating axis - rectangles don't overlap
      return false;
    }
  }
  
  // No separating axis found - rectangles overlap
  return true;
}

/**
 * Find all shapes that overlap with a given shape
 */
export function findOverlappingShapes(targetShape: ShapeData, allShapes: ShapeData[]): ShapeData[] {
  return allShapes.filter(shape => {
    // Don't compare with itself
    if (shape.id === targetShape.id) return false;
    
    return shapesOverlap(targetShape, shape);
  });
}

/**
 * Find overlapping shapes with higher z-index (above the target)
 */
export function findOverlappingShapesAbove(targetShape: ShapeData, allShapes: ShapeData[]): ShapeData[] {
  const overlapping = findOverlappingShapes(targetShape, allShapes);
  return overlapping
    .filter(shape => (shape.zIndex || 0) > (targetShape.zIndex || 0))
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}

/**
 * Find overlapping shapes with lower z-index (below the target)
 */
export function findOverlappingShapesBelow(targetShape: ShapeData, allShapes: ShapeData[]): ShapeData[] {
  const overlapping = findOverlappingShapes(targetShape, allShapes);
  return overlapping
    .filter(shape => (shape.zIndex || 0) < (targetShape.zIndex || 0))
    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
}

