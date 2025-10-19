/**
 * Line Smoothing Utility
 * 
 * Implements the Ramer-Douglas-Peucker algorithm to reduce the number of points
 * in a path while preserving its visual shape. This is essential for:
 * - Reducing Firestore document size
 * - Improving rendering performance
 * - Maintaining smooth appearance
 * 
 * Typical reduction: 50-70% of points removed without visible quality loss
 */

/**
 * Calculate perpendicular distance from a point to a line segment
 * @param point - The point [x, y]
 * @param lineStart - Start of line segment [x, y]
 * @param lineEnd - End of line segment [x, y]
 * @returns Perpendicular distance
 */
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // If line segment is a point, return distance to that point
  if (dx === 0 && dy === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate perpendicular distance using cross product formula
  const numerator = Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx ** 2 + dy ** 2);

  return numerator / denominator;
}

/**
 * Ramer-Douglas-Peucker algorithm for line simplification
 * Recursively finds points that deviate most from the simplified line
 * 
 * @param points - Array of [x, y] coordinate pairs
 * @param tolerance - Maximum distance for a point to be considered "close enough" to the line (default: 2.0)
 * @returns Simplified array of [x, y] coordinate pairs
 */
function simplifyPath(points: [number, number][], tolerance: number = 2.0): [number, number][] {
  if (points.length <= 2) {
    return points;
  }

  // Find the point with the maximum distance from the line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const lineStart = points[0];
  const lineEnd = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], lineStart, lineEnd);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If the max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Split at the point of maximum distance
    const leftSegment = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const rightSegment = simplifyPath(points.slice(maxIndex), tolerance);

    // Combine results, removing duplicate point at the split
    return [...leftSegment.slice(0, -1), ...rightSegment];
  } else {
    // All points are close enough, just keep start and end
    return [lineStart, lineEnd];
  }
}

/**
 * Convert flat array format to coordinate pairs
 * @param flatPoints - Flat array [x1, y1, x2, y2, ...]
 * @returns Array of [x, y] pairs
 */
function toCoordinatePairs(flatPoints: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < flatPoints.length; i += 2) {
    pairs.push([flatPoints[i], flatPoints[i + 1]]);
  }
  return pairs;
}

/**
 * Convert coordinate pairs back to flat array
 * @param pairs - Array of [x, y] pairs
 * @returns Flat array [x1, y1, x2, y2, ...]
 */
function toFlatArray(pairs: [number, number][]): number[] {
  const flat: number[] = [];
  for (const [x, y] of pairs) {
    flat.push(x, y);
  }
  return flat;
}

/**
 * Smooth a path by reducing the number of points while preserving shape
 * Uses Ramer-Douglas-Peucker algorithm
 * 
 * @param points - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param tolerance - Maximum deviation tolerance in pixels (default: 2.0)
 * @returns Smoothed flat array of coordinates
 * 
 * @example
 * const rawPoints = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
 * const smoothed = smoothPath(rawPoints, 1.0);
 * // Result: [0, 0, 5, 5] (straight line simplified to endpoints)
 */
export function smoothPath(points: number[], tolerance: number = 2.0): number[] {
  // Need at least 2 points (4 numbers) to form a line
  if (points.length < 4) {
    return points;
  }

  // Validate input
  if (points.length % 2 !== 0) {
    throw new Error('Points array must have even length (pairs of x,y coordinates)');
  }

  // Convert to coordinate pairs for algorithm
  const pairs = toCoordinatePairs(points);

  // Apply simplification
  const simplified = simplifyPath(pairs, tolerance);

  // Convert back to flat array
  return toFlatArray(simplified);
}

/**
 * Calculate bounding box from a flat points array
 * Used to determine x, y, width, height for path shapes
 * 
 * @param points - Flat array [x1, y1, x2, y2, ...]
 * @returns Bounding box {x, y, width, height}
 */
export function calculateBoundingBox(points: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length < 2) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert absolute coordinates to relative (offset from bounding box origin)
 * This makes the path position-independent and allows easy moving
 * 
 * @param points - Flat array of absolute coordinates
 * @returns Object with { relative: number[], offset: {x, y} }
 */
export function makePointsRelative(points: number[]): {
  relative: number[];
  offset: { x: number; y: number };
} {
  if (points.length < 2) {
    return { relative: points, offset: { x: 0, y: 0 } };
  }

  const bbox = calculateBoundingBox(points);
  const relative: number[] = [];

  for (let i = 0; i < points.length; i += 2) {
    relative.push(points[i] - bbox.x);
    relative.push(points[i + 1] - bbox.y);
  }

  return {
    relative,
    offset: { x: bbox.x, y: bbox.y },
  };
}

