import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';
import type { CreatePathInput } from '../../../src/services/types/canvasTypes';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  firestore: {},
}));

// Mock shapeService
vi.mock('../../../src/services/shapeService', () => ({
  shapeService: {
    createPath: vi.fn(),
    updatePath: vi.fn(),
    subscribeToPaths: vi.fn(),
  },
}));

describe('CanvasService - Path Operations', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPath', () => {
    it('should delegate to shapeService.createPath', async () => {
      const mockPathId = 'test-path-id';
      const { shapeService } = await import('../../../src/services/shapeService');
      
      vi.mocked(shapeService.createPath).mockResolvedValue(mockPathId);

      const result = await canvasService.createPath(mockCanvasId, mockPathInput, mockUserId);

      expect(result).toBe(mockPathId);
      expect(shapeService.createPath).toHaveBeenCalledWith(
        mockCanvasId,
        mockPathInput,
        mockUserId
      );
    });
  });

  describe('updatePath', () => {
    it('should delegate to shapeService.updatePath', async () => {
      const pathId = 'test-path-id';
      const updates = { color: '#ff0000' };
      const { shapeService } = await import('../../../src/services/shapeService');
      
      vi.mocked(shapeService.updatePath).mockResolvedValue(undefined);

      await canvasService.updatePath(mockCanvasId, pathId, updates);

      expect(shapeService.updatePath).toHaveBeenCalledWith(
        mockCanvasId,
        pathId,
        updates
      );
    });
  });

  describe('subscribeToPaths', () => {
    it('should delegate to shapeService.subscribeToPaths', async () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      const { shapeService } = await import('../../../src/services/shapeService');
      
      vi.mocked(shapeService.subscribeToPaths).mockReturnValue(mockUnsubscribe);

      const result = canvasService.subscribeToPaths(mockCanvasId, mockCallback);

      expect(result).toBe(mockUnsubscribe);
      expect(shapeService.subscribeToPaths).toHaveBeenCalledWith(
        mockCanvasId,
        mockCallback
      );
    });
  });
});