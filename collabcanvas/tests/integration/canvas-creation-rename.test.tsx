import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { canvasListService } from '../../src/services/canvasListService';
import type { CanvasMetadata } from '../../src/services/types/canvasTypes';

describe('Canvas Creation and Rename Integration Tests', () => {
  let testUserId: string;
  let createdCanvasIds: string[] = [];

  beforeEach(() => {
    testUserId = `test-user-${Date.now()}`;
    createdCanvasIds = [];
  });

  afterEach(async () => {
    // Cleanup: Delete all created test canvases
    // Note: This would require implementing a deleteCanvas method in production
    createdCanvasIds = [];
  });

  describe('Canvas Creation', () => {
    it('should create canvas with default name', async () => {
      const canvasId = await canvasListService.createCanvas(testUserId);
      createdCanvasIds.push(canvasId);

      expect(canvasId).toBeTruthy();
      expect(typeof canvasId).toBe('string');

      // Verify canvas was created
      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas).toBeTruthy();
      expect(canvas?.name).toBe('Untitled Canvas');
      expect(canvas?.ownerId).toBe(testUserId);
      expect(canvas?.collaboratorIds).toContain(testUserId);
      expect(canvas?.shapeCount).toBe(0);
    });

    it('should create canvas with custom name', async () => {
      const customName = 'My Test Project';
      const canvasId = await canvasListService.createCanvas(testUserId, customName);
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe(customName);
    });

    it('should create canvas with special characters in name', async () => {
      const specialName = 'Project 🎨 #1 [Draft]';
      const canvasId = await canvasListService.createCanvas(testUserId, specialName);
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe(specialName);
    });

    it('should create canvas with Unicode name', async () => {
      const unicodeName = '项目 🚀';
      const canvasId = await canvasListService.createCanvas(testUserId, unicodeName);
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe(unicodeName);
    });

    it('should trim whitespace from canvas name', async () => {
      const nameWithSpaces = '  Test Canvas  ';
      const canvasId = await canvasListService.createCanvas(testUserId, nameWithSpaces);
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe('Test Canvas');
    });

    it('should reject empty canvas name', async () => {
      await expect(async () => {
        await canvasListService.createCanvas(testUserId, '');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should reject whitespace-only canvas name', async () => {
      await expect(async () => {
        await canvasListService.createCanvas(testUserId, '   ');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should reject too long canvas name', async () => {
      const longName = 'a'.repeat(101);
      await expect(async () => {
        await canvasListService.createCanvas(testUserId, longName);
      }).rejects.toThrow('Canvas name too long (max 100 characters)');
    });

    it('should accept 100-character canvas name', async () => {
      const maxName = 'a'.repeat(100);
      const canvasId = await canvasListService.createCanvas(testUserId, maxName);
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe(maxName);
    });

    it('should create multiple canvases with unique IDs', async () => {
      const canvas1Id = await canvasListService.createCanvas(testUserId, 'Canvas 1');
      const canvas2Id = await canvasListService.createCanvas(testUserId, 'Canvas 2');
      const canvas3Id = await canvasListService.createCanvas(testUserId, 'Canvas 3');

      createdCanvasIds.push(canvas1Id, canvas2Id, canvas3Id);

      expect(canvas1Id).not.toBe(canvas2Id);
      expect(canvas2Id).not.toBe(canvas3Id);
      expect(canvas1Id).not.toBe(canvas3Id);
    });

    it('should allow duplicate canvas names', async () => {
      const duplicateName = 'Duplicate Name';
      const canvas1Id = await canvasListService.createCanvas(testUserId, duplicateName);
      const canvas2Id = await canvasListService.createCanvas(testUserId, duplicateName);

      createdCanvasIds.push(canvas1Id, canvas2Id);

      const canvas1 = await canvasListService.getCanvasById(canvas1Id);
      const canvas2 = await canvasListService.getCanvasById(canvas2Id);

      expect(canvas1?.name).toBe(duplicateName);
      expect(canvas2?.name).toBe(duplicateName);
    });

    it('should set correct metadata on created canvas', async () => {
      const canvasId = await canvasListService.createCanvas(testUserId, 'Metadata Test');
      createdCanvasIds.push(canvasId);

      const canvas = await canvasListService.getCanvasById(canvasId);

      expect(canvas?.id).toBe(canvasId);
      expect(canvas?.ownerId).toBe(testUserId);
      expect(canvas?.collaboratorIds).toEqual([testUserId]);
      expect(canvas?.shapeCount).toBe(0);
      expect(canvas?.createdAt).toBeInstanceOf(Date);
      expect(canvas?.updatedAt).toBeInstanceOf(Date);
      expect(canvas?.lastAccessedAt).toBeInstanceOf(Date);
    });
  });

  describe('Canvas Rename', () => {
    let testCanvasId: string;

    beforeEach(async () => {
      // Create a test canvas before each rename test
      testCanvasId = await canvasListService.createCanvas(testUserId, 'Original Name');
      createdCanvasIds.push(testCanvasId);
    });

    it('should rename canvas successfully', async () => {
      const newName = 'Updated Name';
      await canvasListService.renameCanvas(testCanvasId, newName);

      const canvas = await canvasListService.getCanvasById(testCanvasId);
      expect(canvas?.name).toBe(newName);
    });

    it('should trim whitespace when renaming', async () => {
      const nameWithSpaces = '  New Name  ';
      await canvasListService.renameCanvas(testCanvasId, nameWithSpaces);

      const canvas = await canvasListService.getCanvasById(testCanvasId);
      expect(canvas?.name).toBe('New Name');
    });

    it('should reject empty name when renaming', async () => {
      await expect(async () => {
        await canvasListService.renameCanvas(testCanvasId, '');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should reject whitespace-only name when renaming', async () => {
      await expect(async () => {
        await canvasListService.renameCanvas(testCanvasId, '   ');
      }).rejects.toThrow('Canvas name cannot be empty');
    });

    it('should reject too long name when renaming', async () => {
      const longName = 'a'.repeat(101);
      await expect(async () => {
        await canvasListService.renameCanvas(testCanvasId, longName);
      }).rejects.toThrow('Canvas name too long (max 100 characters)');
    });

    it('should accept 100-character name when renaming', async () => {
      const maxName = 'b'.repeat(100);
      await canvasListService.renameCanvas(testCanvasId, maxName);

      const canvas = await canvasListService.getCanvasById(testCanvasId);
      expect(canvas?.name).toBe(maxName);
    });

    it('should update updatedAt timestamp when renaming', async () => {
      const canvasBefore = await canvasListService.getCanvasById(testCanvasId);
      const updatedAtBefore = canvasBefore?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await canvasListService.renameCanvas(testCanvasId, 'New Name After Wait');

      const canvasAfter = await canvasListService.getCanvasById(testCanvasId);
      const updatedAtAfter = canvasAfter?.updatedAt;

      expect(updatedAtAfter).not.toEqual(updatedAtBefore);
      if (updatedAtBefore && updatedAtAfter) {
        expect(updatedAtAfter.getTime()).toBeGreaterThan(updatedAtBefore.getTime());
      }
    });

    it('should allow renaming to name with special characters', async () => {
      const specialName = 'Updated 🎨 #2 [Final]';
      await canvasListService.renameCanvas(testCanvasId, specialName);

      const canvas = await canvasListService.getCanvasById(testCanvasId);
      expect(canvas?.name).toBe(specialName);
    });

    it('should allow renaming to Unicode name', async () => {
      const unicodeName = '更新的项目 ✨';
      await canvasListService.renameCanvas(testCanvasId, unicodeName);

      const canvas = await canvasListService.getCanvasById(testCanvasId);
      expect(canvas?.name).toBe(unicodeName);
    });

    it('should allow duplicate names across different canvases', async () => {
      const canvas2Id = await canvasListService.createCanvas(testUserId, 'Canvas 2');
      createdCanvasIds.push(canvas2Id);

      const duplicateName = 'Shared Name';
      await canvasListService.renameCanvas(testCanvasId, duplicateName);
      await canvasListService.renameCanvas(canvas2Id, duplicateName);

      const canvas1 = await canvasListService.getCanvasById(testCanvasId);
      const canvas2 = await canvasListService.getCanvasById(canvas2Id);

      expect(canvas1?.name).toBe(duplicateName);
      expect(canvas2?.name).toBe(duplicateName);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should create, rename, and retrieve canvas', async () => {
      // Create
      const canvasId = await canvasListService.createCanvas(testUserId, 'Initial Name');
      createdCanvasIds.push(canvasId);

      let canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe('Initial Name');

      // Rename
      await canvasListService.renameCanvas(canvasId, 'Updated Name');
      canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe('Updated Name');

      // Rename again
      await canvasListService.renameCanvas(canvasId, 'Final Name');
      canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe('Final Name');
    });

    it('should handle rapid consecutive renames', async () => {
      const canvasId = await canvasListService.createCanvas(testUserId, 'Name 0');
      createdCanvasIds.push(canvasId);

      // Perform multiple rapid renames
      await canvasListService.renameCanvas(canvasId, 'Name 1');
      await canvasListService.renameCanvas(canvasId, 'Name 2');
      await canvasListService.renameCanvas(canvasId, 'Name 3');

      const canvas = await canvasListService.getCanvasById(canvasId);
      expect(canvas?.name).toBe('Name 3');
    });
  });
});


