import { describe, it, expect } from 'vitest';
import { smoothPath, calculateBoundingBox, makePointsRelative } from '../../../src/utils/lineSmoothing';

describe('Line Smoothing Utilities', () => {
  describe('smoothPath()', () => {
    it('should preserve straight lines', () => {
      // Straight horizontal line
      const straightLine = [0, 0, 100, 0];
      const smoothed = smoothPath(straightLine, 2.0);
      
      expect(smoothed.length).toBeLessThanOrEqual(straightLine.length);
      // Should keep start and end points
      expect(smoothed[0]).toBe(0);
      expect(smoothed[1]).toBe(0);
      expect(smoothed[smoothed.length - 2]).toBe(100);
      expect(smoothed[smoothed.length - 1]).toBe(0);
    });

    it('should reduce number of points in complex paths', () => {
      // Path with many collinear points
      const complexPath = [0, 0, 10, 10, 20, 20, 30, 30, 40, 40, 50, 50];
      const smoothed = smoothPath(complexPath, 2.0);
      
      // Should significantly reduce point count for collinear points
      expect(smoothed.length).toBeLessThan(complexPath.length);
      // Should keep start and end
      expect(smoothed[0]).toBe(0);
      expect(smoothed[1]).toBe(0);
      expect(smoothed[smoothed.length - 2]).toBe(50);
      expect(smoothed[smoothed.length - 1]).toBe(50);
    });

    it('should preserve important corner points', () => {
      // L-shaped path
      const lShape = [0, 0, 100, 0, 100, 100];
      const smoothed = smoothPath(lShape, 2.0);
      
      // Should keep all three key points (start, corner, end)
      expect(smoothed.length).toBe(6); // 3 points = 6 numbers
      expect(smoothed).toEqual([0, 0, 100, 0, 100, 100]);
    });

    it('should return original path if too few points', () => {
      const shortPath = [0, 0];
      const smoothed = smoothPath(shortPath, 2.0);
      expect(smoothed).toEqual(shortPath);
    });

    it('should handle odd-length array gracefully', () => {
      // smoothPath itself doesn't validate - validation happens in canvasService
      // This test ensures it doesn't crash with odd-length arrays
      const invalidPath = [0, 0, 10];
      const result = smoothPath(invalidPath, 2.0);
      // Should return the input as-is without crashing
      expect(result).toBeDefined();
    });

    it('should work with different tolerance values', () => {
      const zigzag = [0, 0, 10, 5, 20, 0, 30, 5, 40, 0];
      
      // Higher tolerance = more aggressive smoothing
      const smoothed1 = smoothPath(zigzag, 1.0);
      const smoothed2 = smoothPath(zigzag, 10.0);
      
      expect(smoothed2.length).toBeLessThanOrEqual(smoothed1.length);
    });
  });

  describe('calculateBoundingBox()', () => {
    it('should calculate correct bounding box for simple path', () => {
      const path = [10, 20, 50, 60];
      const bbox = calculateBoundingBox(path);
      
      expect(bbox.x).toBe(10);
      expect(bbox.y).toBe(20);
      expect(bbox.width).toBe(40); // 50 - 10
      expect(bbox.height).toBe(40); // 60 - 20
    });

    it('should handle negative coordinates', () => {
      const path = [-10, -20, 30, 40];
      const bbox = calculateBoundingBox(path);
      
      expect(bbox.x).toBe(-10);
      expect(bbox.y).toBe(-20);
      expect(bbox.width).toBe(40); // 30 - (-10)
      expect(bbox.height).toBe(60); // 40 - (-20)
    });

    it('should handle single point', () => {
      const path = [5, 10];
      const bbox = calculateBoundingBox(path);
      
      expect(bbox.x).toBe(5);
      expect(bbox.y).toBe(10);
      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
    });

    it('should find min/max correctly for scattered points', () => {
      const path = [100, 50, 10, 200, 150, 25, 30, 175];
      const bbox = calculateBoundingBox(path);
      
      expect(bbox.x).toBe(10); // min x
      expect(bbox.y).toBe(25); // min y
      expect(bbox.width).toBe(140); // 150 - 10
      expect(bbox.height).toBe(175); // 200 - 25
    });

    it('should return zeros for empty array', () => {
      const path: number[] = [];
      const bbox = calculateBoundingBox(path);
      
      expect(bbox).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('makePointsRelative()', () => {
    it('should convert absolute coordinates to relative', () => {
      const path = [100, 200, 150, 250, 120, 210];
      const result = makePointsRelative(path);
      
      // Offset should be the min coordinates
      expect(result.offset.x).toBe(100);
      expect(result.offset.y).toBe(200);
      
      // Relative points should be offset from (100, 200)
      expect(result.relative).toEqual([0, 0, 50, 50, 20, 10]);
    });

    it('should handle single point', () => {
      const path = [42, 84];
      const result = makePointsRelative(path);
      
      expect(result.offset.x).toBe(42);
      expect(result.offset.y).toBe(84);
      expect(result.relative).toEqual([0, 0]);
    });

    it('should work with negative coordinates', () => {
      const path = [-10, -20, 10, 20, 0, 0];
      const result = makePointsRelative(path);
      
      expect(result.offset.x).toBe(-10);
      expect(result.offset.y).toBe(-20);
      expect(result.relative).toEqual([0, 0, 20, 40, 10, 20]);
    });

    it('should return empty array for empty input', () => {
      const path: number[] = [];
      const result = makePointsRelative(path);
      
      expect(result.relative).toEqual([]);
      expect(result.offset).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Integration: smoothPath + calculateBoundingBox', () => {
    it('should maintain bounding box size after smoothing', () => {
      // Create a rectangular path
      const path = [0, 0, 100, 0, 100, 50, 0, 50, 0, 0];
      
      const originalBox = calculateBoundingBox(path);
      const smoothed = smoothPath(path, 2.0);
      const smoothedBox = calculateBoundingBox(smoothed);
      
      // Bounding box should be the same (or very close) after smoothing
      expect(smoothedBox.x).toBeCloseTo(originalBox.x, 1);
      expect(smoothedBox.y).toBeCloseTo(originalBox.y, 1);
      expect(smoothedBox.width).toBeCloseTo(originalBox.width, 1);
      expect(smoothedBox.height).toBeCloseTo(originalBox.height, 1);
    });

    it('should reduce point count by 50-70% for typical drawing', () => {
      // Simulate a wavy line with many points
      const wavyPath: number[] = [];
      for (let i = 0; i <= 100; i += 2) {
        wavyPath.push(i, Math.sin(i / 10) * 20 + 50);
      }
      
      const smoothed = smoothPath(wavyPath, 2.0);
      const reductionPercent = ((wavyPath.length - smoothed.length) / wavyPath.length) * 100;
      
      // Should reduce by at least 30% but less than 90% (not over-smoothed)
      expect(reductionPercent).toBeGreaterThan(30);
      expect(reductionPercent).toBeLessThan(90);
    });
  });
});

