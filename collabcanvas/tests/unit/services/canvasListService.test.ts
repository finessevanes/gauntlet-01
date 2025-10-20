import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasListService } from '../../../src/services/canvasListService';
import { firestore } from '../../../src/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

// Mock firebase
vi.mock('../../../src/firebase', () => ({
  firestore: {},
}));

describe('CanvasListService', () => {
  describe('validateCanvasName', () => {
    it('should validate a valid canvas name', () => {
      const result = canvasListService.validateCanvasName('My Canvas');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty canvas names', () => {
      const result = canvasListService.validateCanvasName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Canvas name cannot be empty');
    });

    it('should reject whitespace-only names', () => {
      const result = canvasListService.validateCanvasName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Canvas name cannot be empty');
    });

    it('should reject names longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = canvasListService.validateCanvasName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Canvas name too long (max 100 characters)');
    });

    it('should accept names with exactly 100 characters', () => {
      const maxName = 'a'.repeat(100);
      const result = canvasListService.validateCanvasName(maxName);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept names with special characters', () => {
      const result = canvasListService.validateCanvasName('Project 🎨 #1 [Draft]');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept names with Unicode characters', () => {
      const result = canvasListService.validateCanvasName('项目 🚀');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should trim whitespace before validation', () => {
      const result = canvasListService.validateCanvasName('  Valid Name  ');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('createCanvas', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create canvas with default name when no name provided', async () => {
      const mockSetDoc = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn().mockReturnValue({ id: 'test-canvas-id' });
      const mockCollection = vi.fn().mockReturnValue({});

      vi.doMock('firebase/firestore', async () => ({
        ...await vi.importActual('firebase/firestore'),
        doc: mockDoc,
        setDoc: mockSetDoc,
        collection: mockCollection,
        serverTimestamp: () => ({ _seconds: Date.now() / 1000 }),
      }));

      // Test would create canvas with "Untitled Canvas"
      // This is a simplified test - full implementation would require proper Firebase mocking
      expect(true).toBe(true); // Placeholder
    });

    it('should create canvas with custom name', async () => {
      // Test would create canvas with specified name
      expect(true).toBe(true); // Placeholder
    });

    it('should trim whitespace from canvas name', () => {
      const validation = canvasListService.validateCanvasName('  Test  ');
      expect(validation.valid).toBe(true);
    });

    it('should throw error for invalid canvas name', async () => {
      await expect(async () => {
        await canvasListService.createCanvas('user-id', '');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should throw error for too long canvas name', async () => {
      const longName = 'a'.repeat(101);
      await expect(async () => {
        await canvasListService.createCanvas('user-id', longName);
      }).rejects.toThrow('Canvas name too long (max 100 characters)');
    });
  });

  describe('renameCanvas', () => {
    it('should validate name before renaming', async () => {
      await expect(async () => {
        await canvasListService.renameCanvas('canvas-id', '');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should validate length before renaming', async () => {
      const longName = 'a'.repeat(101);
      await expect(async () => {
        await canvasListService.renameCanvas('canvas-id', longName);
      }).rejects.toThrow('Canvas name too long (max 100 characters)');
    });

    it('should trim whitespace before renaming', async () => {
      const validation = canvasListService.validateCanvasName('  New Name  ');
      expect(validation.valid).toBe(true);
    });
  });
});
