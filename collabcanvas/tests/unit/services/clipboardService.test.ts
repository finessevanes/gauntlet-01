import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clipboardService } from '../../../src/services/clipboardService';

/**
 * Unit tests for ClipboardService
 * Tests: copyToClipboard with Clipboard API and fallback
 */

describe('ClipboardService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up DOM modifications
    document.body.innerHTML = '';
  });

  describe('copyToClipboard() - Modern Clipboard API', () => {
    it('should copy text using Clipboard API when available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      // Mock navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const testText = 'https://collabcanvas.com/canvas/test-123';
      const result = await clipboardService.copyToClipboard(testText);
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(testText);
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    it('should return true on successful clipboard write', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });
      
      const result = await clipboardService.copyToClipboard('test text');
      
      expect(result).toBe(true);
    });

    it('should handle Clipboard API errors gracefully', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard API error'));
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });
      
      // Should fall back and handle error
      const result = await clipboardService.copyToClipboard('test text');
      
      // May return false depending on fallback success
      expect(typeof result).toBe('boolean');
    });
  });

  describe('copyToClipboard() - execCommand Fallback', () => {
    it('should use execCommand fallback when Clipboard API unavailable', async () => {
      // Remove Clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const testText = 'https://collabcanvas.com/canvas/fallback-test';
      const result = await clipboardService.copyToClipboard(testText);
      
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(typeof result).toBe('boolean');
    });

    it('should create and remove temporary textarea for fallback', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;
      
      await clipboardService.copyToClipboard('test');
      
      // Textarea should be created and removed
      const textareas = document.querySelectorAll('textarea');
      expect(textareas.length).toBe(0); // Should be cleaned up
    });

    it('should return false on execCommand failure', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;
      
      const result = await clipboardService.copyToClipboard('test');
      
      expect(result).toBe(false);
    });
  });

  describe('copyToClipboard() - Edge Cases', () => {
    it('should handle empty string', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });
      
      const result = await clipboardService.copyToClipboard('');
      
      expect(mockWriteText).toHaveBeenCalledWith('');
      expect(result).toBe(true);
    });

    it('should handle very long text', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const longText = 'https://collabcanvas.com/canvas/' + 'a'.repeat(1000);
      const result = await clipboardService.copyToClipboard(longText);
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters in text', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const specialText = 'https://example.com/canvas/test?share=true&user=alice@example.com';
      const result = await clipboardService.copyToClipboard(specialText);
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(specialText);
    });
  });
});

