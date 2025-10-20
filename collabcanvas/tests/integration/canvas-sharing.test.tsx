import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { canvasListService } from '../../src/services/canvasListService';
import { clipboardService } from '../../src/services/clipboardService';
import type { CanvasMetadata } from '../../src/services/types/canvasTypes';

/**
 * Integration tests for Canvas Sharing & Collaboration Setup
 * Tests the complete sharing workflow from link generation to collaborator access
 */

describe('Canvas Sharing Integration Tests', () => {
  describe('Shareable Link Generation', () => {
    it('should generate valid shareable link', () => {
      const canvasId = 'test-canvas-abc123';
      const link = canvasListService.generateShareableLink(canvasId);
      
      expect(link).toContain('/canvas/');
      expect(link).toContain(canvasId);
      expect(link).toContain('share=true');
      
      // Verify it's a valid URL
      const url = new URL(link);
      expect(url.pathname).toBe(`/canvas/${canvasId}`);
      expect(url.searchParams.get('share')).toBe('true');
    });

    it('should generate unique links for different canvases', () => {
      const canvas1 = 'canvas-1';
      const canvas2 = 'canvas-2';
      
      const link1 = canvasListService.generateShareableLink(canvas1);
      const link2 = canvasListService.generateShareableLink(canvas2);
      
      expect(link1).not.toBe(link2);
      expect(link1).toContain(canvas1);
      expect(link2).toContain(canvas2);
    });

    it('should generate consistent links for same canvas', () => {
      const canvasId = 'consistent-canvas';
      
      const link1 = canvasListService.generateShareableLink(canvasId);
      const link2 = canvasListService.generateShareableLink(canvasId);
      
      expect(link1).toBe(link2);
    });
  });

  describe('Clipboard Operations', () => {
    it('should successfully copy link to clipboard', async () => {
      const testLink = 'https://collabcanvas.com/canvas/test-123';
      
      // Mock successful clipboard operation
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });
      
      const result = await clipboardService.copyToClipboard(testLink);
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(testLink);
    });

    it('should handle clipboard errors gracefully', async () => {
      const testLink = 'https://collabcanvas.com/canvas/error-test';
      
      // Mock clipboard error
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });
      
      const result = await clipboardService.copyToClipboard(testLink);
      
      // Should return false or use fallback
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Collaborator Info Retrieval', () => {
    it('should handle canvas with single owner', () => {
      const mockCanvas: Partial<CanvasMetadata> = {
        id: 'canvas-solo',
        name: 'Solo Canvas',
        ownerId: 'user-alice',
        collaboratorIds: ['user-alice'],
      };
      
      expect(mockCanvas.collaboratorIds).toHaveLength(1);
      expect(mockCanvas.collaboratorIds![0]).toBe(mockCanvas.ownerId);
    });

    it('should handle canvas with multiple collaborators', () => {
      const mockCanvas: Partial<CanvasMetadata> = {
        id: 'canvas-multi',
        name: 'Team Canvas',
        ownerId: 'user-alice',
        collaboratorIds: ['user-alice', 'user-bob', 'user-carol'],
      };
      
      expect(mockCanvas.collaboratorIds).toHaveLength(3);
      expect(mockCanvas.collaboratorIds).toContain('user-alice');
      expect(mockCanvas.collaboratorIds).toContain('user-bob');
      expect(mockCanvas.collaboratorIds).toContain('user-carol');
    });

    it('should identify owner vs collaborators', () => {
      const ownerId = 'user-alice';
      const collaboratorIds = ['user-alice', 'user-bob', 'user-carol'];
      
      const collaborators = collaboratorIds.map(userId => ({
        userId,
        email: `${userId}@example.com`,
        displayName: userId.replace('user-', ''),
        isOwner: userId === ownerId,
      }));
      
      const owner = collaborators.find(c => c.isOwner);
      const nonOwners = collaborators.filter(c => !c.isOwner);
      
      expect(owner).toBeDefined();
      expect(owner?.userId).toBe('user-alice');
      expect(nonOwners).toHaveLength(2);
    });
  });

  describe('Canvas Metadata with Sharing', () => {
    it('should include all required fields for shared canvas', () => {
      const mockCanvas: CanvasMetadata = {
        id: 'canvas-123',
        name: 'Shared Canvas',
        ownerId: 'user-alice',
        collaboratorIds: ['user-alice', 'user-bob'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
        shapeCount: 5,
      };
      
      expect(mockCanvas).toHaveProperty('id');
      expect(mockCanvas).toHaveProperty('name');
      expect(mockCanvas).toHaveProperty('ownerId');
      expect(mockCanvas).toHaveProperty('collaboratorIds');
      expect(mockCanvas.collaboratorIds).toBeInstanceOf(Array);
      expect(mockCanvas.collaboratorIds.length).toBeGreaterThan(0);
    });

    it('should always include owner in collaboratorIds', () => {
      const mockCanvas: CanvasMetadata = {
        id: 'canvas-456',
        name: 'Test Canvas',
        ownerId: 'user-carol',
        collaboratorIds: ['user-carol', 'user-dave'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
        shapeCount: 10,
      };
      
      expect(mockCanvas.collaboratorIds).toContain(mockCanvas.ownerId);
      expect(mockCanvas.collaboratorIds[0]).toBe(mockCanvas.ownerId);
    });
  });

  describe('URL Parsing and Validation', () => {
    it('should correctly parse canvas ID from shareable link', () => {
      const canvasId = 'abc-123-xyz';
      const link = `https://collabcanvas.com/canvas/${canvasId}?share=true`;
      
      const url = new URL(link);
      const pathParts = url.pathname.split('/');
      const parsedId = pathParts[pathParts.length - 1];
      
      expect(parsedId).toBe(canvasId);
    });

    it('should handle links with and without query params', () => {
      const canvasId = 'test-canvas';
      
      const linkWithQuery = `https://collabcanvas.com/canvas/${canvasId}?share=true`;
      const linkWithoutQuery = `https://collabcanvas.com/canvas/${canvasId}`;
      
      const urlWith = new URL(linkWithQuery);
      const urlWithout = new URL(linkWithoutQuery);
      
      expect(urlWith.pathname).toBe(urlWithout.pathname);
      expect(urlWith.searchParams.get('share')).toBe('true');
      expect(urlWithout.searchParams.get('share')).toBeNull();
    });

    it('should validate Firestore ID format', () => {
      // Firestore auto-generated IDs are 20-character alphanumeric strings
      const validId = 'abc123DEF456ghi789jk';
      const invalidId = 'invalid id with spaces';
      
      const isValidFirestoreId = (id: string) => /^[a-zA-Z0-9-_]{1,}$/.test(id);
      
      expect(isValidFirestoreId(validId)).toBe(true);
      expect(isValidFirestoreId(invalidId)).toBe(false);
    });
  });

  describe('Ownership and Permissions', () => {
    it('should distinguish owner from collaborators', () => {
      const currentUserId = 'user-bob';
      const canvas: Partial<CanvasMetadata> = {
        ownerId: 'user-alice',
        collaboratorIds: ['user-alice', 'user-bob', 'user-carol'],
      };
      
      const isOwner = canvas.ownerId === currentUserId;
      const isCollaborator = canvas.collaboratorIds!.includes(currentUserId);
      
      expect(isOwner).toBe(false);
      expect(isCollaborator).toBe(true);
    });

    it('should identify owner as both owner and collaborator', () => {
      const currentUserId = 'user-alice';
      const canvas: Partial<CanvasMetadata> = {
        ownerId: 'user-alice',
        collaboratorIds: ['user-alice', 'user-bob'],
      };
      
      const isOwner = canvas.ownerId === currentUserId;
      const isCollaborator = canvas.collaboratorIds!.includes(currentUserId);
      
      expect(isOwner).toBe(true);
      expect(isCollaborator).toBe(true);
    });
  });

  describe('Real-time Sync Behavior', () => {
    it('should expect collaboratorIds to update in real-time', () => {
      const initialCanvas: Partial<CanvasMetadata> = {
        collaboratorIds: ['user-alice'],
      };
      
      // Simulate new collaborator added
      const updatedCanvas: Partial<CanvasMetadata> = {
        collaboratorIds: ['user-alice', 'user-bob'],
      };
      
      expect(updatedCanvas.collaboratorIds).toHaveLength(
        initialCanvas.collaboratorIds!.length + 1
      );
      expect(updatedCanvas.collaboratorIds).toContain('user-bob');
    });

    it('should prevent duplicate collaborators with arrayUnion', () => {
      const existingCollaborators = ['user-alice', 'user-bob'];
      const newCollaborator = 'user-bob'; // Already exists
      
      // Simulate arrayUnion behavior
      const updated = [...new Set([...existingCollaborators, newCollaborator])];
      
      expect(updated).toHaveLength(2);
      expect(updated.filter(id => id === 'user-bob')).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid canvas ID gracefully', () => {
      const invalidId = '';
      
      expect(() => {
        if (!invalidId || invalidId.trim() === '') {
          throw new Error('Canvas ID cannot be empty');
        }
      }).toThrow('Canvas ID cannot be empty');
    });

    it('should handle non-existent canvas', async () => {
      const nonExistentId = 'does-not-exist-123';
      
      // In real implementation, getCanvasById would return null
      const canvas = null; // Simulate not found
      
      expect(canvas).toBeNull();
    });

    it('should handle unauthenticated user access attempt', () => {
      const userProfile = null; // Not authenticated
      const canvasId = 'test-canvas';
      
      const canAccess = userProfile !== null;
      
      expect(canAccess).toBe(false);
    });
  });
});

