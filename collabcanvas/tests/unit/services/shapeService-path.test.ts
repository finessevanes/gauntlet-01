import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shapeService } from '../../../src/services/shapeService';
import type { CreatePathInput, Path } from '../../../src/services/types/canvasTypes';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  firestore: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  query: vi.fn(),
}));

describe('ShapeService - Path Operations', () => {
  const mockCanvasId = 'test-canvas-id';
  const mockUserId = 'test-user-id';
  const mockPathInput: CreatePathInput = {
    points: [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ],
    strokeWidth: 2,
    color: '#000000',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked functions
    const { collection, doc, setDoc, updateDoc, onSnapshot } = await import('firebase/firestore');
    
    // Setup default mock implementations
    vi.mocked(doc).mockReturnValue({ id: 'mock-shape-id' });
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(onSnapshot).mockReturnValue(() => {});
    
    // Mock getShapes to return empty array by default
    vi.spyOn(shapeService, 'getShapes').mockResolvedValue([]);
  });

  describe('createPath', () => {
    it('should create a path with valid input', async () => {
      const mockPathId = 'test-path-id';
      const { doc, setDoc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({ id: mockPathId });

      const result = await shapeService.createPath(mockCanvasId, mockPathInput, mockUserId);

      expect(result).toBe(mockPathId);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'path',
          points: mockPathInput.points,
          strokeWidth: mockPathInput.strokeWidth,
          color: mockPathInput.color,
          createdBy: mockUserId,
        })
      );
    });

    it('should throw error for path with less than 2 points', async () => {
      const invalidPathInput: CreatePathInput = {
        points: [{ x: 10, y: 10 }], // Only one point
        strokeWidth: 2,
        color: '#000000',
      };

      await expect(
        shapeService.createPath(mockCanvasId, invalidPathInput, mockUserId)
      ).rejects.toThrow('Path must have at least 2 points');
    });

    it('should throw error for invalid stroke width', async () => {
      const invalidPathInput: CreatePathInput = {
        points: mockPathInput.points,
        strokeWidth: -1, // Invalid stroke width
        color: '#000000',
      };

      await expect(
        shapeService.createPath(mockCanvasId, invalidPathInput, mockUserId)
      ).rejects.toThrow('Stroke width must be between 1 and 10');
    });

    it('should calculate bounding box correctly', async () => {
      const mockPathId = 'test-path-id';
      const { doc, setDoc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({ id: mockPathId });

      const result = await shapeService.createPath(mockCanvasId, mockPathInput, mockUserId);

      expect(result).toBe(mockPathId);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          x: 10, // minX
          y: 10, // minY
          width: 20, // maxX - minX
          height: 20, // maxY - minY
        })
      );
    });
  });

  describe('updatePath', () => {
    it('should update path with new points and recalculate bounding box', async () => {
      const pathId = 'test-path-id';
      const newPoints = [
        { x: 5, y: 5 },
        { x: 15, y: 15 },
        { x: 25, y: 25 },
      ];
      const updates: Partial<Path> = { points: newPoints };
      const { updateDoc } = await import('firebase/firestore');

      await shapeService.updatePath(mockCanvasId, pathId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          points: newPoints,
          x: 5, // new minX
          y: 5, // new minY
          width: 20, // new maxX - minX
          height: 20, // new maxY - minY
        })
      );
    });

    it('should update path without recalculating bounding box for non-point updates', async () => {
      const pathId = 'test-path-id';
      const updates: Partial<Path> = { color: '#ff0000' };
      const { updateDoc } = await import('firebase/firestore');

      await shapeService.updatePath(mockCanvasId, pathId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          color: '#ff0000',
        })
      );
    });
  });

  describe('subscribeToPaths', () => {
    it('should subscribe to paths and filter by type', async () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      const { onSnapshot, query } = await import('firebase/firestore');
      
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);
      vi.mocked(query).mockReturnValue({});
      
      // Mock the callback to be called with mixed shapes
      const mockShapes = [
        { id: 'path-1', type: 'path', points: [{ x: 0, y: 0 }] },
        { id: 'rect-1', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
        { id: 'path-2', type: 'path', points: [{ x: 1, y: 1 }] },
      ];
      
      vi.mocked(onSnapshot).mockImplementation((query, callback) => {
        const mockSnapshot = {
          docs: mockShapes.map(shape => ({ data: () => shape })),
          forEach: vi.fn((fn) => {
            mockShapes.forEach(shape => fn({ data: () => shape }));
          })
        };
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const result = shapeService.subscribeToPaths(mockCanvasId, mockCallback);

      expect(result).toBe(mockUnsubscribe);
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'path-1', type: 'path', points: [{ x: 0, y: 0 }] },
        { id: 'path-2', type: 'path', points: [{ x: 1, y: 1 }] },
      ]);
    });
  });
});