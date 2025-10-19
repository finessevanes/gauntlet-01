import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';
import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../src/firebase';

describe('CanvasService - Path Methods', () => {
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clear any existing shapes before each test
    const shapesSnapshot = await getDocs(collection(firestore, 'canvases/main/shapes'));
    await Promise.all(shapesSnapshot.docs.map(doc => deleteDoc(doc.ref)));
  });

  afterEach(async () => {
    // Cleanup after each test
    const shapesSnapshot = await getDocs(collection(firestore, 'canvases/main/shapes'));
    await Promise.all(shapesSnapshot.docs.map(doc => deleteDoc(doc.ref)));
  });

  describe('createPath()', () => {
    it('should create a path with valid data', async () => {
      // ARRANGE
      const pathData = {
        points: [10, 20, 30, 40, 50, 60, 70, 80], // Simple zigzag
        color: '#ff0000',
        strokeWidth: 3,
        createdBy: testUserId,
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      expect(pathId).toBeDefined();
      expect(typeof pathId).toBe('string');

      // Verify in Firestore
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      expect(data).toBeDefined();
      expect(data?.type).toBe('path');
      expect(data?.points).toBeDefined();
      expect(Array.isArray(data?.points)).toBe(true);
      expect(data?.points.length).toBeGreaterThan(0);
      expect(data?.strokeWidth).toBe(3);
      expect(data?.color).toBe('#ff0000');
      expect(data?.createdBy).toBe(testUserId);
      expect(data?.createdAt).toBeDefined();
      expect(data?.x).toBeDefined();
      expect(data?.y).toBeDefined();
      expect(data?.width).toBeDefined();
      expect(data?.height).toBeDefined();
    });

    it('should apply line smoothing to reduce points', async () => {
      // ARRANGE - Create a path with many collinear points
      const manyPoints: number[] = [];
      for (let i = 0; i <= 100; i++) {
        manyPoints.push(i, i); // Diagonal line with 101 points
      }

      const pathData = {
        points: manyPoints,
        color: '#00ff00',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      // Line smoothing should have reduced the point count significantly
      expect(data?.points.length).toBeLessThan(manyPoints.length);
      expect(data?.points.length).toBeGreaterThanOrEqual(4); // At least start and end points
    });

    it('should convert absolute coordinates to relative', async () => {
      // ARRANGE - Path starting at (100, 200)
      const pathData = {
        points: [100, 200, 150, 250, 200, 200], // Triangle
        color: '#0000ff',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      // Shape position should be the min coordinates
      expect(data?.x).toBe(100);
      expect(data?.y).toBe(200);

      // Points should be relative to (100, 200)
      expect(data?.points[0]).toBe(0); // First x is relative
      expect(data?.points[1]).toBe(0); // First y is relative
    });

    it('should calculate correct bounding box', async () => {
      // ARRANGE
      const pathData = {
        points: [10, 20, 100, 50, 50, 150], // Various points
        color: '#ff00ff',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      expect(data?.x).toBe(10); // min x
      expect(data?.y).toBe(20); // min y
      expect(data?.width).toBe(90); // 100 - 10
      expect(data?.height).toBe(130); // 150 - 20
    });

    it('should use default stroke width when not provided', async () => {
      // ARRANGE
      const pathData = {
        points: [0, 0, 10, 10],
        color: '#ffffff',
        createdBy: testUserId,
        // strokeWidth not provided
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      expect(data?.strokeWidth).toBe(2); // DEFAULT_STROKE_WIDTH
    });

    it('should auto-increment z-index', async () => {
      // ARRANGE - Create two paths
      const pathData1 = {
        points: [0, 0, 10, 10],
        color: '#000000',
        strokeWidth: 2,
        createdBy: testUserId,
      };
      const pathData2 = {
        points: [20, 20, 30, 30],
        color: '#111111',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const pathId1 = await canvasService.createPath(pathData1);
      const pathId2 = await canvasService.createPath(pathData2);

      // ASSERT
      const snapshot1 = await getDoc(doc(firestore, `canvases/main/shapes/${pathId1}`));
      const snapshot2 = await getDoc(doc(firestore, `canvases/main/shapes/${pathId2}`));
      const data1 = snapshot1.data();
      const data2 = snapshot2.data();

      expect(data2?.zIndex).toBeGreaterThan(data1?.zIndex || 0);
    });

    it('should reject path with too few points', async () => {
      // ARRANGE - Only 1 point (2 numbers)
      const pathData = {
        points: [10, 20],
        color: '#ff0000',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT & ASSERT
      await expect(canvasService.createPath(pathData)).rejects.toThrow('Path must have at least 2 points');
    });

    it('should reject path with odd-length points array', async () => {
      // ARRANGE - Odd number of values
      const pathData = {
        points: [10, 20, 30],
        color: '#ff0000',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT & ASSERT
      await expect(canvasService.createPath(pathData)).rejects.toThrow('Points array must have even length');
    });

    it('should preserve color correctly', async () => {
      // ARRANGE - Test with specific color
      const testColor = '#ab12cd';
      const pathData = {
        points: [0, 0, 50, 50],
        color: testColor,
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const pathId = await canvasService.createPath(pathData);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      expect(data?.color).toBe(testColor);
    });
  });

  describe('updatePath()', () => {
    it('should update path points', async () => {
      // ARRANGE - Create a path first
      const initialPathData = {
        points: [0, 0, 10, 10, 20, 20],
        color: '#ff0000',
        strokeWidth: 2,
        createdBy: testUserId,
      };
      const pathId = await canvasService.createPath(initialPathData);

      // ACT - Update with new points
      const newPoints = [0, 0, 30, 30, 60, 60];
      await canvasService.updatePath(pathId, newPoints);

      // ASSERT
      const snapshot = await getDoc(doc(firestore, `canvases/main/shapes/${pathId}`));
      const data = snapshot.data();

      expect(data?.points).toBeDefined();
      // Points should be smoothed and relative
      expect(data?.updatedAt).toBeDefined();
    });

    it('should reject update with invalid points', async () => {
      // ARRANGE
      const pathData = {
        points: [0, 0, 10, 10],
        color: '#ff0000',
        strokeWidth: 2,
        createdBy: testUserId,
      };
      const pathId = await canvasService.createPath(pathData);

      // ACT & ASSERT - Try to update with too few points
      await expect(canvasService.updatePath(pathId, [10, 20])).rejects.toThrow();
    });
  });

  describe('Path Performance', () => {
    it('should create path in reasonable time', async () => {
      // ARRANGE - Create a moderately complex path
      const complexPath: number[] = [];
      for (let i = 0; i < 200; i++) {
        complexPath.push(i, Math.sin(i / 10) * 50 + 100);
      }

      const pathData = {
        points: complexPath,
        color: '#00ff00',
        strokeWidth: 2,
        createdBy: testUserId,
      };

      // ACT
      const startTime = Date.now();
      const pathId = await canvasService.createPath(pathData);
      const duration = Date.now() - startTime;

      // ASSERT
      expect(pathId).toBeDefined();
      expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    });
  });
});

