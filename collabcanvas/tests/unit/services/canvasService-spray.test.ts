/**
 * Unit Tests: Spray Service Methods (canvasService)
 * Tests the createSpray() and updateSpray() service methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';

describe('CanvasService - Spray Methods', () => {
  describe('createSpray()', () => {
    it('should create spray with valid data', async () => {
      const particles = [
        { x: 100, y: 100, size: 2 },
        { x: 105, y: 102, size: 2 },
        { x: 98, y: 103, size: 2 }
      ];

      const sprayId = await canvasService.createSpray({
        particles,
        color: '#ff0000',
        sprayRadius: 20,
        particleSize: 2,
        createdBy: 'test-user'
      });

      expect(sprayId).toBeTruthy();
      expect(typeof sprayId).toBe('string');
    });

    it('should reject empty particles array', async () => {
      await expect(
        canvasService.createSpray({
          particles: [],
          color: '#ff0000',
          sprayRadius: 20,
          particleSize: 2,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Spray must have at least 1 particle');
    });

    it('should reject invalid spray radius (too small)', async () => {
      await expect(
        canvasService.createSpray({
          particles: [{ x: 0, y: 0, size: 2 }],
          color: '#ff0000',
          sprayRadius: 5,
          particleSize: 2,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Spray radius must be between 10 and 50 pixels');
    });

    it('should reject invalid spray radius (too large)', async () => {
      await expect(
        canvasService.createSpray({
          particles: [{ x: 0, y: 0, size: 2 }],
          color: '#ff0000',
          sprayRadius: 60,
          particleSize: 2,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Spray radius must be between 10 and 50 pixels');
    });

    it('should reject invalid particle size', async () => {
      await expect(
        canvasService.createSpray({
          particles: [{ x: 0, y: 0, size: 2 }],
          color: '#ff0000',
          sprayRadius: 20,
          particleSize: 5,
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Particle size must be between 1 and 3 pixels');
    });

    it('should calculate bounding box correctly', async () => {
      const particles = [
        { x: 100, y: 100, size: 2 },
        { x: 200, y: 150, size: 2 },
        { x: 150, y: 200, size: 2 }
      ];

      const sprayId = await canvasService.createSpray({
        particles,
        color: '#ff0000',
        sprayRadius: 20,
        particleSize: 2,
        createdBy: 'test-user'
      });

      // Get the created spray from Firestore
      const shapes = await canvasService.getShapes();
      const spray = shapes.find(s => s.id === sprayId);

      expect(spray).toBeDefined();
      expect(spray!.x).toBe(100); // minX
      expect(spray!.y).toBe(100); // minY
      expect(spray!.width).toBe(100); // maxX - minX
      expect(spray!.height).toBe(100); // maxY - minY
    });

    it('should store particles as relative coordinates', async () => {
      const particles = [
        { x: 100, y: 100, size: 2 },
        { x: 110, y: 105, size: 2 }
      ];

      const sprayId = await canvasService.createSpray({
        particles,
        color: '#ff0000',
        sprayRadius: 20,
        particleSize: 2,
        createdBy: 'test-user'
      });

      const shapes = await canvasService.getShapes();
      const spray = shapes.find(s => s.id === sprayId);

      expect(spray!.particles).toBeDefined();
      expect(spray!.particles![0]).toEqual({ x: 0, y: 0, size: 2 }); // Relative to (100, 100)
      expect(spray!.particles![1]).toEqual({ x: 10, y: 5, size: 2 }); // Relative to (100, 100)
    });
  });

  describe('updateSpray()', () => {
    it('should update spray particles', async () => {
      // Create initial spray
      const initialParticles = [{ x: 0, y: 0, size: 2 }];
      
      const sprayId = await canvasService.createSpray({
        particles: initialParticles,
        color: '#ff0000',
        sprayRadius: 20,
        particleSize: 2,
        createdBy: 'test-user'
      });

      // Update with new particles
      const newParticles = [
        { x: 50, y: 50, size: 2 },
        { x: 60, y: 60, size: 2 }
      ];

      await canvasService.updateSpray(sprayId, newParticles);

      const shapes = await canvasService.getShapes();
      const spray = shapes.find(s => s.id === sprayId);

      expect(spray!.particles!.length).toBe(2);
    });

    it('should reject update with empty particles', async () => {
      const sprayId = 'test-spray-id';

      await expect(
        canvasService.updateSpray(sprayId, [])
      ).rejects.toThrow('Spray must have at least 1 particle');
    });
  });
});

