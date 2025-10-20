import { describe, it, expect } from 'vitest';
import { 
  generateCreativeDrawing, 
  getSupportedDrawings, 
  isSupportedDrawing 
} from '../../../src/utils/creativeDrawing';

describe('creativeDrawing utility', () => {
  describe('generateCreativeDrawing', () => {
    it('should generate dog drawing with correct points', () => {
      const points = generateCreativeDrawing('dog', 100, 100, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(10); // Dog drawing should have many points
      expect(points[0]).toHaveProperty('x');
      expect(points[0]).toHaveProperty('y');
    });

    it('should generate cat drawing with correct points', () => {
      const points = generateCreativeDrawing('cat', 200, 200, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(10);
      expect(points[0].x).toBeGreaterThanOrEqual(200);
      expect(points[0].y).toBeGreaterThanOrEqual(200);
    });

    it('should generate smiley face drawing', () => {
      const points = generateCreativeDrawing('face', 300, 300, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(20); // Face has circle + eyes + smile
    });

    it('should generate house drawing', () => {
      const points = generateCreativeDrawing('house', 400, 400, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(5);
    });

    it('should generate tree drawing', () => {
      const points = generateCreativeDrawing('tree', 500, 500, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(5);
    });

    it('should generate sun drawing', () => {
      const points = generateCreativeDrawing('sun', 600, 600, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(20); // Sun has circle + rays
    });

    it('should generate star drawing', () => {
      const points = generateCreativeDrawing('star', 700, 700, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(8); // 5-pointed star
    });

    it('should generate flower drawing', () => {
      const points = generateCreativeDrawing('flower', 800, 800, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(20); // Flower has petals
    });

    it('should generate heart drawing', () => {
      const points = generateCreativeDrawing('heart', 900, 900, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(15);
    });

    it('should generate car drawing', () => {
      const points = generateCreativeDrawing('car', 1000, 1000, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(10);
    });

    it('should handle case-insensitive object names', () => {
      const pointsLower = generateCreativeDrawing('dog', 100, 100, 100);
      const pointsUpper = generateCreativeDrawing('DOG', 100, 100, 100);
      const pointsMixed = generateCreativeDrawing('DoG', 100, 100, 100);
      
      expect(pointsLower.length).toBe(pointsUpper.length);
      expect(pointsUpper.length).toBe(pointsMixed.length);
    });

    it('should handle partial matches (e.g., "puppy" matches "dog")', () => {
      const points = generateCreativeDrawing('puppy', 100, 100, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(10);
    });

    it('should handle "smiley" as "face"', () => {
      const points = generateCreativeDrawing('smiley', 100, 100, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(20);
    });

    it('should default to stick figure for unknown objects', () => {
      const points = generateCreativeDrawing('unknown object', 100, 100, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(5); // Stick figure has head, body, arms, legs
    });

    it('should scale drawing based on size parameter', () => {
      const pointsSmall = generateCreativeDrawing('dog', 0, 0, 50);
      const pointsLarge = generateCreativeDrawing('dog', 0, 0, 200);
      
      // Large drawing should have points further from origin
      const maxXSmall = Math.max(...pointsSmall.map(p => p.x));
      const maxXLarge = Math.max(...pointsLarge.map(p => p.x));
      
      expect(maxXLarge).toBeGreaterThan(maxXSmall);
    });

    it('should position drawing at specified x, y coordinates', () => {
      const x = 1000;
      const y = 2000;
      const points = generateCreativeDrawing('dog', x, y, 100);
      
      // All points should be at or after the starting position
      const minX = Math.min(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      
      expect(minX).toBeGreaterThanOrEqual(x);
      expect(minY).toBeGreaterThanOrEqual(y);
    });

    it('should generate valid point objects with x and y', () => {
      const points = generateCreativeDrawing('dog', 100, 100, 100);
      
      points.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(isFinite(point.x)).toBe(true);
        expect(isFinite(point.y)).toBe(true);
      });
    });
  });

  describe('getSupportedDrawings', () => {
    it('should return array of supported drawing names', () => {
      const supported = getSupportedDrawings();
      
      expect(Array.isArray(supported)).toBe(true);
      expect(supported.length).toBeGreaterThan(0);
      expect(supported).toContain('dog');
      expect(supported).toContain('cat');
      expect(supported).toContain('face');
      expect(supported).toContain('house');
      expect(supported).toContain('tree');
      expect(supported).toContain('sun');
      expect(supported).toContain('star');
      expect(supported).toContain('flower');
      expect(supported).toContain('heart');
      expect(supported).toContain('car');
    });

    it('should return at least 10 supported drawings', () => {
      const supported = getSupportedDrawings();
      
      expect(supported.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('isSupportedDrawing', () => {
    it('should return true for supported drawings', () => {
      expect(isSupportedDrawing('dog')).toBe(true);
      expect(isSupportedDrawing('cat')).toBe(true);
      expect(isSupportedDrawing('face')).toBe(true);
      expect(isSupportedDrawing('smiley')).toBe(true);
      expect(isSupportedDrawing('house')).toBe(true);
      expect(isSupportedDrawing('tree')).toBe(true);
      expect(isSupportedDrawing('sun')).toBe(true);
      expect(isSupportedDrawing('star')).toBe(true);
      expect(isSupportedDrawing('flower')).toBe(true);
      expect(isSupportedDrawing('heart')).toBe(true);
      expect(isSupportedDrawing('car')).toBe(true);
    });

    it('should return false for unsupported drawings', () => {
      expect(isSupportedDrawing('dragon')).toBe(false);
      expect(isSupportedDrawing('spaceship')).toBe(false);
      expect(isSupportedDrawing('unknown')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isSupportedDrawing('DOG')).toBe(true);
      expect(isSupportedDrawing('Dog')).toBe(true);
      expect(isSupportedDrawing('dOg')).toBe(true);
    });

    it('should handle partial matches', () => {
      expect(isSupportedDrawing('puppy')).toBe(true); // Contains "dog"
      expect(isSupportedDrawing('kitty')).toBe(true); // Contains "cat"
      expect(isSupportedDrawing('smiley face')).toBe(true); // Contains "face"
    });

    it('should trim whitespace', () => {
      expect(isSupportedDrawing('  dog  ')).toBe(true);
      expect(isSupportedDrawing('  cat  ')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle size of 0', () => {
      const points = generateCreativeDrawing('dog', 100, 100, 0);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(0);
      // With size 0, all points should be at or very close to start position
      const maxX = Math.max(...points.map(p => p.x));
      const maxY = Math.max(...points.map(p => p.y));
      expect(maxX).toBeLessThan(110); // Allow small offset
      expect(maxY).toBeLessThan(110);
    });

    it('should handle very large size', () => {
      const points = generateCreativeDrawing('dog', 0, 0, 1000);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(0);
      // With large size, points should span a large area
      const maxX = Math.max(...points.map(p => p.x));
      const maxY = Math.max(...points.map(p => p.y));
      expect(maxX).toBeGreaterThan(500);
      expect(maxY).toBeGreaterThan(500);
    });

    it('should handle negative coordinates', () => {
      const points = generateCreativeDrawing('dog', -100, -100, 100);
      
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(0);
      // Points should be offset by negative coordinates
      const minX = Math.min(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      expect(minX).toBeLessThan(0);
      expect(minY).toBeLessThan(0);
    });

    it('should handle empty string object name', () => {
      const points = generateCreativeDrawing('', 100, 100, 100);
      
      // Should default to stick figure
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(5);
    });
  });
});

