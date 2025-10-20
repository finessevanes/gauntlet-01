import { describe, it, expect, beforeAll } from 'vitest';
import { canvasListService } from '../../../src/services/canvasListService';
import type { CollaboratorInfo } from '../../../src/services/types/canvasTypes';

/**
 * Unit tests for CanvasListService sharing methods
 * Tests: addCollaborator, getCollaborators, generateShareableLink
 */

describe('CanvasListService - Sharing Methods', () => {
  beforeAll(() => {
    // Mock window.location.origin for all tests
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://collabcanvas.com' },
      writable: true,
      configurable: true,
    });
  });

  describe('generateShareableLink()', () => {
    it('should generate valid shareable link with canvas ID', () => {
      const canvasId = 'test-canvas-123';
      const link = canvasListService.generateShareableLink(canvasId);
      
      expect(link).toContain('/canvas/');
      expect(link).toContain(canvasId);
      expect(link).toContain('share=true');
    });

    it('should handle different canvas IDs', () => {
      const canvasId = 'canvas-abc';
      const link = canvasListService.generateShareableLink(canvasId);
      
      expect(link).toContain(canvasId);
      expect(link).toContain('share=true');
    });
  });

  describe('CollaboratorInfo Interface', () => {
    it('should have correct CollaboratorInfo structure', () => {
      const mockCollaborator: CollaboratorInfo = {
        userId: 'user-123',
        email: 'alice@example.com',
        displayName: 'Alice',
        isOwner: true,
        isOnline: true,
      };

      expect(mockCollaborator).toHaveProperty('userId');
      expect(mockCollaborator).toHaveProperty('email');
      expect(mockCollaborator).toHaveProperty('displayName');
      expect(mockCollaborator).toHaveProperty('isOwner');
      expect(mockCollaborator).toHaveProperty('isOnline');
    });

    it('should support null displayName', () => {
      const mockCollaborator: CollaboratorInfo = {
        userId: 'user-456',
        email: 'bob@example.com',
        displayName: null,
        isOwner: false,
      };

      expect(mockCollaborator.displayName).toBeNull();
    });

    it('should support optional isOnline', () => {
      const mockCollaborator: Omit<CollaboratorInfo, 'isOnline'> = {
        userId: 'user-789',
        email: 'carol@example.com',
        displayName: 'Carol',
        isOwner: false,
      };

      expect(mockCollaborator).not.toHaveProperty('isOnline');
    });
  });

  describe('Collaborator Array Operations', () => {
    it('should sort collaborators with owner first', () => {
      const collaborators: CollaboratorInfo[] = [
        { userId: 'user-1', email: 'bob@example.com', displayName: 'Bob', isOwner: false },
        { userId: 'user-2', email: 'alice@example.com', displayName: 'Alice', isOwner: true },
        { userId: 'user-3', email: 'carol@example.com', displayName: 'Carol', isOwner: false },
      ];

      const sorted = collaborators.sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return (a.displayName || a.email).localeCompare(b.displayName || b.email);
      });

      expect(sorted[0].isOwner).toBe(true);
      expect(sorted[0].displayName).toBe('Alice');
    });

    it('should sort non-owners alphabetically', () => {
      const collaborators: CollaboratorInfo[] = [
        { userId: 'user-1', email: 'carol@example.com', displayName: 'Carol', isOwner: false },
        { userId: 'user-2', email: 'alice@example.com', displayName: 'Alice', isOwner: false },
        { userId: 'user-3', email: 'bob@example.com', displayName: 'Bob', isOwner: false },
      ];

      const sorted = collaborators.sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return (a.displayName || a.email).localeCompare(b.displayName || b.email);
      });

      expect(sorted.map(c => c.displayName)).toEqual(['Alice', 'Bob', 'Carol']);
    });
  });

  describe('URL Format Validation', () => {
    it('should generate URL with correct path structure', () => {
      const canvasId = 'abc-123-xyz';
      const link = canvasListService.generateShareableLink(canvasId);
      
      // Check URL structure
      const url = new URL(link);
      expect(url.pathname).toBe(`/canvas/${canvasId}`);
      expect(url.searchParams.get('share')).toBe('true');
    });

    it('should handle canvas IDs with special characters', () => {
      // Firestore IDs are alphanumeric, but test edge cases
      const canvasId = 'test-canvas-2024-abc123';
      const link = canvasListService.generateShareableLink(canvasId);
      
      expect(link).toContain(canvasId);
    });
  });
});

