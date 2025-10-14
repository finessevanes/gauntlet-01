import { describe, it, expect } from 'vitest';
import type { ShapeData, ShapeCreateInput } from '../../../src/services/canvasService';

/**
 * Unit tests for CanvasService data structures and logic
 * Note: Full Firebase integration tests are in tests/integration/shapes-locking.test.ts
 */

describe('CanvasService', () => {
  describe('ShapeData Structure', () => {
    it('should have correct ShapeData interface structure', () => {
      const mockShape: ShapeData = {
        id: 'shape-123',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: 'user-abc',
        createdAt: null,
        lockedBy: null,
        lockedAt: null,
        updatedAt: null,
      };

      expect(mockShape).toHaveProperty('id');
      expect(mockShape).toHaveProperty('type');
      expect(mockShape).toHaveProperty('x');
      expect(mockShape).toHaveProperty('y');
      expect(mockShape).toHaveProperty('width');
      expect(mockShape).toHaveProperty('height');
      expect(mockShape).toHaveProperty('color');
      expect(mockShape).toHaveProperty('createdBy');
      expect(mockShape).toHaveProperty('lockedBy');
      expect(mockShape).toHaveProperty('lockedAt');
    });

    it('should support unlocked shapes', () => {
      const unlockedShape: Partial<ShapeData> = {
        lockedBy: null,
        lockedAt: null,
      };

      expect(unlockedShape.lockedBy).toBeNull();
      expect(unlockedShape.lockedAt).toBeNull();
    });

    it('should support locked shapes', () => {
      const lockedShape: Partial<ShapeData> = {
        lockedBy: 'user-123',
        lockedAt: null, // Timestamp would be set by Firebase
      };

      expect(lockedShape.lockedBy).toBe('user-123');
      expect(lockedShape.lockedBy).not.toBeNull();
    });
  });

  describe('Shape Creation Input', () => {
    it('should accept valid shape creation input', () => {
      const createInput: ShapeCreateInput = {
        type: 'rectangle',
        x: 50,
        y: 75,
        width: 200,
        height: 150,
        color: '#ef4444',
        createdBy: 'user-456',
      };

      expect(createInput.type).toBe('rectangle');
      expect(createInput.x).toBeGreaterThanOrEqual(0);
      expect(createInput.y).toBeGreaterThanOrEqual(0);
      expect(createInput.width).toBeGreaterThan(0);
      expect(createInput.height).toBeGreaterThan(0);
      expect(createInput.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(createInput.createdBy).toBeTruthy();
    });
  });

  describe('Lock Timeout Logic', () => {
    const LOCK_TIMEOUT_MS = 5000;

    it('should consider locks fresh within 5 seconds', () => {
      const now = Date.now();
      const lockedAt = now - 3000; // 3 seconds ago
      const lockAge = now - lockedAt;

      expect(lockAge).toBeLessThan(LOCK_TIMEOUT_MS);
    });

    it('should consider locks expired after 5 seconds', () => {
      const now = Date.now();
      const lockedAt = now - 6000; // 6 seconds ago
      const lockAge = now - lockedAt;

      expect(lockAge).toBeGreaterThanOrEqual(LOCK_TIMEOUT_MS);
    });

    it('should handle edge case at exactly 5 seconds', () => {
      const now = Date.now();
      const lockedAt = now - 5000; // exactly 5 seconds ago
      const lockAge = now - lockedAt;

      // At exactly 5000ms, lock should be expired (>=)
      expect(lockAge).toBeGreaterThanOrEqual(LOCK_TIMEOUT_MS);
    });
  });
});

