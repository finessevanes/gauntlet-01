/**
 * Unit Tests: Spray Helpers Utility Functions
 * Tests particle generation and coordinate transformation functions
 */

import { describe, it, expect } from 'vitest';
import {
  generateSprayParticles,
  calculateParticleBoundingBox,
  makeParticlesRelative,
  makeParticlesAbsolute
} from '../../../src/utils/sprayHelpers';

describe('Spray Helpers', () => {
  describe('generateSprayParticles()', () => {
    it('should generate correct number of particles', () => {
      const particles = generateSprayParticles(100, 100, 20, 10, 2);
      
      expect(particles).toHaveLength(10);
    });

    it('should generate particles within radius', () => {
      const centerX = 200;
      const centerY = 200;
      const radius = 30;
      
      const particles = generateSprayParticles(centerX, centerY, radius, 50, 2);
      
      particles.forEach(particle => {
        const distance = Math.sqrt(
          Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2)
        );
        
        expect(distance).toBeLessThanOrEqual(radius);
      });
    });

    it('should set correct particle size', () => {
      const particleSize = 3;
      const particles = generateSprayParticles(100, 100, 20, 10, particleSize);
      
      particles.forEach(particle => {
        expect(particle.size).toBe(particleSize);
      });
    });

    it('should distribute particles randomly (uniform distribution)', () => {
      const particles = generateSprayParticles(0, 0, 50, 1000, 2);
      
      // Check that particles are not all clustered at center
      // by measuring distribution variance
      const avgX = particles.reduce((sum, p) => sum + p.x, 0) / particles.length;
      const avgY = particles.reduce((sum, p) => sum + p.y, 0) / particles.length;
      
      // Average should be close to center (0, 0)
      expect(Math.abs(avgX)).toBeLessThan(5);
      expect(Math.abs(avgY)).toBeLessThan(5);
      
      // Variance should indicate spread (not all at center)
      const varianceX = particles.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / particles.length;
      expect(varianceX).toBeGreaterThan(100); // Should have spread
    });
  });

  describe('calculateParticleBoundingBox()', () => {
    it('should calculate correct bounding box', () => {
      const particles = [
        { x: 100, y: 150, size: 2 },
        { x: 200, y: 200, size: 2 },
        { x: 150, y: 100, size: 2 }
      ];
      
      const bbox = calculateParticleBoundingBox(particles);
      
      expect(bbox.x).toBe(100); // minX
      expect(bbox.y).toBe(100); // minY
      expect(bbox.width).toBe(100); // maxX - minX
      expect(bbox.height).toBe(100); // maxY - minY
    });

    it('should handle single particle', () => {
      const particles = [{ x: 50, y: 75, size: 2 }];
      
      const bbox = calculateParticleBoundingBox(particles);
      
      expect(bbox.x).toBe(50);
      expect(bbox.y).toBe(75);
      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
    });

    it('should return zero bbox for empty array', () => {
      const bbox = calculateParticleBoundingBox([]);
      
      expect(bbox).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('makeParticlesRelative()', () => {
    it('should convert particles to relative coordinates', () => {
      const particles = [
        { x: 150, y: 200, size: 2 },
        { x: 160, y: 210, size: 2 }
      ];
      
      const relative = makeParticlesRelative(particles, 100, 150);
      
      expect(relative[0]).toEqual({ x: 50, y: 50, size: 2 });
      expect(relative[1]).toEqual({ x: 60, y: 60, size: 2 });
    });

    it('should handle negative relative positions', () => {
      const particles = [
        { x: 50, y: 50, size: 2 }
      ];
      
      const relative = makeParticlesRelative(particles, 100, 100);
      
      expect(relative[0]).toEqual({ x: -50, y: -50, size: 2 });
    });
  });

  describe('makeParticlesAbsolute()', () => {
    it('should convert particles to absolute coordinates', () => {
      const particles = [
        { x: 10, y: 20, size: 2 },
        { x: 20, y: 30, size: 2 }
      ];
      
      const absolute = makeParticlesAbsolute(particles, 100, 150);
      
      expect(absolute[0]).toEqual({ x: 110, y: 170, size: 2 });
      expect(absolute[1]).toEqual({ x: 120, y: 180, size: 2 });
    });

    it('should handle negative relative positions', () => {
      const particles = [
        { x: -10, y: -20, size: 2 }
      ];
      
      const absolute = makeParticlesAbsolute(particles, 100, 100);
      
      expect(absolute[0]).toEqual({ x: 90, y: 80, size: 2 });
    });
  });

  describe('Round-trip conversion', () => {
    it('should convert absolute -> relative -> absolute correctly', () => {
      const originalParticles = [
        { x: 150, y: 200, size: 2 },
        { x: 180, y: 220, size: 2 }
      ];
      
      const originX = 100;
      const originY = 150;
      
      // Convert to relative
      const relative = makeParticlesRelative(originalParticles, originX, originY);
      
      // Convert back to absolute
      const backToAbsolute = makeParticlesAbsolute(relative, originX, originY);
      
      expect(backToAbsolute).toEqual(originalParticles);
    });
  });
});

