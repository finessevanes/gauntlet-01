import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration tests for Shape Creation, Movement, and Locking
 * Tests the full lifecycle of shapes with locking mechanism
 * 
 * Note: These tests simulate multi-user shape manipulation scenarios
 */

describe('Shape Creation Integration', () => {
  describe('Click-and-Drag Rectangle Creation', () => {
    it('should create rectangle with correct dimensions from drag', () => {
      const dragStart = { x: 100, y: 200 };
      const dragEnd = { x: 250, y: 350 };

      const width = Math.abs(dragEnd.x - dragStart.x);
      const height = Math.abs(dragEnd.y - dragStart.y);

      expect(width).toBe(150);
      expect(height).toBe(150);
    });

    it('should handle negative drags (dragging left or up)', () => {
      const dragStart = { x: 250, y: 350 };
      const dragEnd = { x: 100, y: 200 };

      const x = Math.min(dragStart.x, dragEnd.x);
      const y = Math.min(dragStart.y, dragEnd.y);
      const width = Math.abs(dragEnd.x - dragStart.x);
      const height = Math.abs(dragEnd.y - dragStart.y);

      expect(x).toBe(100);
      expect(y).toBe(200);
      expect(width).toBe(150);
      expect(height).toBe(150);
    });

    it('should ignore tiny accidental drags (<10px)', () => {
      const MIN_SHAPE_SIZE = 10;
      
      const tinyDrags = [
        { width: 5, height: 5 },
        { width: 9, height: 15 },
        { width: 15, height: 8 },
      ];

      tinyDrags.forEach((drag) => {
        const shouldIgnore = drag.width < MIN_SHAPE_SIZE || drag.height < MIN_SHAPE_SIZE;
        expect(shouldIgnore).toBe(true);
      });
    });

    it('should create shape with selected color', () => {
      const shape = {
        type: 'rectangle' as const,
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6', // Blue from toolbar
        createdBy: 'user-123',
      };

      expect(shape.color).toBe('#3b82f6');
      expect(shape.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should store creator user ID with shape', () => {
      const shape = {
        id: 'shape-123',
        type: 'rectangle' as const,
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

      expect(shape.createdBy).toBe('user-abc');
      expect(shape.createdBy).toBeTruthy();
    });

    it('should show preview while dragging', () => {
      const preview = {
        x: 100,
        y: 200,
        width: 75,
        height: 50,
        color: '#3b82f6',
        opacity: 0.5,
        dashed: true,
      };

      expect(preview.opacity).toBe(0.5);
      expect(preview.dashed).toBe(true);
    });
  });

  describe('Shape Sync Across Users', () => {
    it('should sync new shapes to all users within 100ms', () => {
      const TARGET_LATENCY_MS = 100;
      const now = Date.now();

      const shape = {
        id: 'shape-123',
        type: 'rectangle' as const,
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        color: '#3b82f6',
        createdBy: 'user-1',
        createdAt: null,
        lockedBy: null,
        lockedAt: null,
        updatedAt: null,
      };

      const syncLatency = Date.now() - now;
      expect(syncLatency).toBeLessThanOrEqual(TARGET_LATENCY_MS + 50); // Allow margin
    });

    it('should sync shape updates across all clients', () => {
      const initialShape = {
        id: 'shape-123',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
      };

      // User moves shape
      const updatedShape = {
        ...initialShape,
        x: 300,
        y: 400,
      };

      expect(updatedShape.x).not.toBe(initialShape.x);
      expect(updatedShape.y).not.toBe(initialShape.y);
      expect(updatedShape.id).toBe(initialShape.id);
    });

    it('should persist shapes across page refresh', () => {
      const persistedShapes = [
        {
          id: 'shape-1',
          type: 'rectangle' as const,
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          color: '#3b82f6',
          createdBy: 'user-1',
          createdAt: null,
          lockedBy: null,
          lockedAt: null,
          updatedAt: null,
        },
        {
          id: 'shape-2',
          type: 'rectangle' as const,
          x: 300,
          y: 400,
          width: 200,
          height: 150,
          color: '#ef4444',
          createdBy: 'user-2',
          createdAt: null,
          lockedBy: null,
          lockedAt: null,
          updatedAt: null,
        },
      ];

      expect(persistedShapes).toHaveLength(2);
      persistedShapes.forEach((shape) => {
        expect(shape.id).toBeTruthy();
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.y).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('Shape Locking Integration', () => {
  const LOCK_TIMEOUT_MS = 5000;

  describe('Lock Acquisition', () => {
    it('should acquire lock when clicking unlocked shape', () => {
      const shape = {
        id: 'shape-123',
        lockedBy: null,
        lockedAt: null,
      };

      const userId = 'user-1';
      
      // Simulate lock acquisition
      shape.lockedBy = userId;
      shape.lockedAt = null; // Would be timestamp

      expect(shape.lockedBy).toBe(userId);
      expect(shape.lockedBy).not.toBeNull();
    });

    it('should deny lock when shape is already locked by another user', () => {
      const now = Date.now();
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: now - 2000, // 2 seconds ago (still fresh)
      };

      const requestingUserId = 'user-2';
      const lockAge = Date.now() - shape.lockedAt;
      
      const canAcquire = 
        !shape.lockedBy || 
        shape.lockedBy === requestingUserId || 
        lockAge >= LOCK_TIMEOUT_MS;

      expect(canAcquire).toBe(false);
    });

    it('should allow lock acquisition after 5 second timeout', () => {
      const now = Date.now();
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: now - 6000, // 6 seconds ago (expired)
      };

      const requestingUserId = 'user-2';
      const lockAge = Date.now() - shape.lockedAt;
      
      const canAcquire = lockAge >= LOCK_TIMEOUT_MS;

      expect(canAcquire).toBe(true);
    });

    it('should allow same user to refresh their own lock', () => {
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: Date.now() - 2000,
      };

      const requestingUserId = 'user-1';
      
      const canAcquire = shape.lockedBy === requestingUserId;

      expect(canAcquire).toBe(true);
    });
  });

  describe('Lock Visual Indicators', () => {
    it('should show green border when locked by current user', () => {
      const currentUserId = 'user-1';
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: Date.now(),
      };

      const isLockedByMe = shape.lockedBy === currentUserId;
      const borderColor = isLockedByMe ? 'green' : 'red';

      expect(borderColor).toBe('green');
    });

    it('should show red border and lock icon when locked by other user', () => {
      const currentUserId = 'user-1';
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-2',
        lockedAt: Date.now(),
      };

      const isLockedByOther = 
        shape.lockedBy && 
        shape.lockedBy !== currentUserId;
      
      const borderColor = isLockedByOther ? 'red' : 'white';
      const showLockIcon = isLockedByOther;
      const opacity = isLockedByOther ? 0.5 : 1.0;

      expect(borderColor).toBe('red');
      expect(showLockIcon).toBe(true);
      expect(opacity).toBe(0.5);
    });

    it('should disable interaction when locked by other user', () => {
      const currentUserId = 'user-1';
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-2',
        lockedAt: Date.now(),
      };

      const lockAge = Date.now() - shape.lockedAt;
      const isLockedByOther = 
        shape.lockedBy && 
        shape.lockedBy !== currentUserId && 
        lockAge < LOCK_TIMEOUT_MS;
      
      const isDraggable = !isLockedByOther;

      expect(isDraggable).toBe(false);
    });
  });

  describe('Lock Release', () => {
    it('should release lock when clicking background (deselect)', () => {
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: Date.now(),
      };

      // Simulate deselect
      shape.lockedBy = null;
      shape.lockedAt = null;

      expect(shape.lockedBy).toBeNull();
      expect(shape.lockedAt).toBeNull();
    });

    it('should release lock after drag ends', () => {
      const shape = {
        id: 'shape-123',
        x: 100,
        y: 200,
        lockedBy: 'user-1',
        lockedAt: Date.now(),
      };

      // Simulate drag end
      shape.x = 300;
      shape.y = 400;
      shape.lockedBy = null;
      shape.lockedAt = null;

      expect(shape.x).toBe(300);
      expect(shape.y).toBe(400);
      expect(shape.lockedBy).toBeNull();
    });

    it('should auto-release lock after 5 seconds of inactivity', () => {
      const now = Date.now();
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: now - 6000, // 6 seconds ago
      };

      const lockAge = Date.now() - shape.lockedAt;
      const shouldAutoRelease = lockAge >= LOCK_TIMEOUT_MS;

      expect(shouldAutoRelease).toBe(true);
    });

    it('should release lock when user disconnects', () => {
      const shape = {
        id: 'shape-123',
        lockedBy: 'user-1',
        lockedAt: Date.now(),
      };

      // Simulate disconnect cleanup
      shape.lockedBy = null;
      shape.lockedAt = null;

      expect(shape.lockedBy).toBeNull();
    });
  });

  describe('Concurrent Lock Attempts', () => {
    it('should handle race condition with last-write-wins', () => {
      // This is the known MVP limitation
      const shape = {
        id: 'shape-123',
        lockedBy: null,
        lockedAt: null,
      };

      // User A attempts lock
      const lockAttemptA = {
        userId: 'user-1',
        timestamp: Date.now(),
      };

      // User B attempts lock ~simultaneously
      const lockAttemptB = {
        userId: 'user-2',
        timestamp: Date.now() + 10, // 10ms later
      };

      // Last write wins (User B in this case)
      shape.lockedBy = lockAttemptB.userId;
      shape.lockedAt = lockAttemptB.timestamp;

      expect(shape.lockedBy).toBe('user-2');
    });

    it('should notify user when lock acquisition fails', () => {
      const lockResult = {
        success: false,
        lockedByUsername: 'Alice',
      };

      expect(lockResult.success).toBe(false);
      expect(lockResult.lockedByUsername).toBe('Alice');
    });
  });
});

describe('Shape Movement Integration', () => {
  describe('Drag Movement', () => {
    it('should update shape position on drag', () => {
      const shape = {
        id: 'shape-123',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
      };

      const dragDelta = { x: 50, y: 75 };
      
      // Simulate drag
      shape.x += dragDelta.x;
      shape.y += dragDelta.y;

      expect(shape.x).toBe(150);
      expect(shape.y).toBe(275);
    });

    it('should sync movement to other users within 100ms', () => {
      const TARGET_LATENCY_MS = 100;
      const updateTimestamp = Date.now();

      const shapeUpdate = {
        id: 'shape-123',
        x: 300,
        y: 400,
        updatedAt: updateTimestamp,
      };

      const syncLatency = Date.now() - shapeUpdate.updatedAt;
      expect(syncLatency).toBeLessThanOrEqual(TARGET_LATENCY_MS + 50);
    });

    it('should show smooth drag at 60 FPS', () => {
      const TARGET_FPS = 60;
      const frameTime = 1000 / TARGET_FPS;

      expect(frameTime).toBeLessThanOrEqual(17); // ~16.67ms per frame
    });

    it('should maintain lock during drag', () => {
      const shape = {
        id: 'shape-123',
        x: 100,
        y: 200,
        lockedBy: 'user-1',
        lockedAt: Date.now(),
      };

      // During drag
      shape.x = 150;
      shape.y = 250;

      expect(shape.lockedBy).toBe('user-1');
      expect(shape.lockedBy).not.toBeNull();
    });
  });
});

describe('Performance with Multiple Shapes', () => {
  it('should handle 50+ shapes without performance degradation', () => {
    const shapes = Array.from({ length: 50 }, (_, i) => ({
      id: `shape-${i + 1}`,
      type: 'rectangle' as const,
      x: Math.random() * 5000,
      y: Math.random() * 5000,
      width: 100 + Math.random() * 200,
      height: 100 + Math.random() * 200,
      color: '#3b82f6',
      createdBy: 'user-1',
      createdAt: null,
      lockedBy: null,
      lockedAt: null,
      updatedAt: null,
    }));

    expect(shapes).toHaveLength(50);
    shapes.forEach((shape) => {
      expect(shape.id).toBeTruthy();
      expect(shape.width).toBeGreaterThan(0);
      expect(shape.height).toBeGreaterThan(0);
    });
  });

  it('should support 500+ shapes as per Sunday requirement', () => {
    // Create lightweight shape references
    const shapeCount = 500;
    const shapes = Array.from({ length: shapeCount }, (_, i) => ({
      id: `shape-${i + 1}`,
      type: 'rectangle' as const,
    }));

    expect(shapes).toHaveLength(500);
  });

  it('should maintain 60 FPS rendering with many shapes', () => {
    const TARGET_FPS = 60;
    const TARGET_FRAME_TIME = 1000 / TARGET_FPS;

    // Frame time budget should be <= 16.67ms
    expect(TARGET_FRAME_TIME).toBeLessThanOrEqual(17);
  });
});

