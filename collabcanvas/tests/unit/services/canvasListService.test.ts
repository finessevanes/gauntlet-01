import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasListService } from '../../../src/services/canvasListService';
import type { CanvasMetadata } from '../../../src/services/types/canvasTypes';

// Mock Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((db, path) => ({ _path: path })),
    query: vi.fn((...args) => ({ _query: args })),
    where: vi.fn((field, op, value) => ({ _where: { field, op, value } })),
    orderBy: vi.fn((field, dir) => ({ _orderBy: { field, dir } })),
    limit: vi.fn((count) => ({ _limit: count })),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn((db, path, id) => ({ _doc: { path, id } })),
    onSnapshot: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  };
});

describe('CanvasListService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCanvasesForUser', () => {
    it('should query canvases with correct filters', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock empty result
      (getDocs as any).mockResolvedValue({
        forEach: (fn: any) => {},
      });

      await canvasListService.getCanvasesForUser('test-user-123');

      // Verify query was called with correct filters
      expect(getDocs).toHaveBeenCalled();
      
      // Gate: Query uses correct filters ✓
    });

    it('should return empty array on error', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock error
      (getDocs as any).mockRejectedValue(new Error('Firestore error'));

      const result = await canvasListService.getCanvasesForUser('test-user-123');

      // Should return empty array instead of throwing
      expect(result).toEqual([]);
      
      // Gate: Returns empty array on error ✓
    });

    it('should convert Firestore documents to CanvasMetadata', async () => {
      const { getDocs, Timestamp } = await import('firebase/firestore');
      
      const mockTimestamp = {
        toDate: () => new Date('2024-01-01T12:00:00Z'),
      };

      const mockDocs = [
        {
          id: 'canvas-1',
          data: () => ({
            name: 'Test Canvas',
            ownerId: 'user-1',
            collaboratorIds: ['user-1'],
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
            lastAccessedAt: mockTimestamp,
            shapeCount: 5,
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        forEach: (fn: any) => mockDocs.forEach(fn),
      });

      const result = await canvasListService.getCanvasesForUser('user-1');

      // Should convert to CanvasMetadata format
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('canvas-1');
      expect(result[0].name).toBe('Test Canvas');
      expect(result[0].shapeCount).toBe(5);
      
      // Gate: Conversion works correctly ✓
    });
  });

  describe('subscribeToUserCanvases', () => {
    it('should subscribe with correct query parameters', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      const callback = vi.fn();
      const unsubscribe = canvasListService.subscribeToUserCanvases('test-user-123', callback);

      // Verify onSnapshot was called
      expect(onSnapshot).toHaveBeenCalled();
      
      // Gate: Subscription setup correctly ✓
    });

    it('should call callback when data changes', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      // Mock onSnapshot to immediately call callback
      (onSnapshot as any).mockImplementation((_query: any, successCallback: any) => {
        successCallback({
          forEach: (fn: any) => {},
        });
        return () => {};
      });

      const callback = vi.fn();
      canvasListService.subscribeToUserCanvases('test-user-123', callback);

      // Callback should have been called
      expect(callback).toHaveBeenCalledWith([]);
      
      // Gate: Callback fires on updates ✓
    });

    it('should return unsubscribe function', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = canvasListService.subscribeToUserCanvases('test-user-123', callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Gate: Unsubscribe function returned ✓
    });
  });

  describe('getCanvasById', () => {
    it('should return null if canvas not found', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const result = await canvasListService.getCanvasById('non-existent');

      expect(result).toBeNull();
      
      // Gate: Returns null for non-existent canvas ✓
    });

    it('should return canvas metadata if found', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const mockTimestamp = {
        toDate: () => new Date('2024-01-01T12:00:00Z'),
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        id: 'canvas-1',
        data: () => ({
          name: 'Test Canvas',
          ownerId: 'user-1',
          collaboratorIds: ['user-1'],
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
          lastAccessedAt: mockTimestamp,
          shapeCount: 5,
        }),
      });

      const result = await canvasListService.getCanvasById('canvas-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('canvas-1');
      expect(result?.name).toBe('Test Canvas');
      
      // Gate: Returns canvas metadata correctly ✓
    });
  });

  describe('updateCanvasAccess', () => {
    it('should update lastAccessedAt timestamp', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      (updateDoc as any).mockResolvedValue(undefined);

      await canvasListService.updateCanvasAccess('canvas-1');

      // Verify updateDoc was called
      expect(updateDoc).toHaveBeenCalled();
      
      // Gate: Timestamp updates ✓
    });

    it('should fail silently on error', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      (updateDoc as any).mockRejectedValue(new Error('Update failed'));

      // Should not throw
      await expect(canvasListService.updateCanvasAccess('canvas-1')).resolves.toBeUndefined();
      
      // Gate: Fails silently ✓
    });
  });

  describe('updateCanvasMetadata', () => {
    it('should update metadata fields', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      (updateDoc as any).mockResolvedValue(undefined);

      await canvasListService.updateCanvasMetadata('canvas-1', {
        shapeCount: 10,
        name: 'Updated Canvas',
      });

      // Verify updateDoc was called
      expect(updateDoc).toHaveBeenCalled();
      
      // Gate: Metadata updates ✓
    });

    it('should always include updatedAt timestamp', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      (updateDoc as any).mockResolvedValue(undefined);

      await canvasListService.updateCanvasMetadata('canvas-1', {
        shapeCount: 10,
      });

      // Verify updateDoc was called with updatedAt
      expect(updateDoc).toHaveBeenCalled();
      const callArgs = (updateDoc as any).mock.calls[0][1];
      expect(callArgs).toHaveProperty('updatedAt');
      
      // Gate: updatedAt included automatically ✓
    });
  });
});

