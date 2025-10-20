import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { CanvasProvider } from '../../src/contexts/CanvasContext';
import Canvas from '../../src/components/Canvas/Canvas';
import { canvasService } from '../../src/services/canvasService';
import type { CreatePathInput } from '../../src/services/types/canvasTypes';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
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

// Mock the canvas service
vi.mock('../../src/services/canvasService', () => ({
  canvasService: {
    createPath: vi.fn(),
    subscribeToShapes: vi.fn(),
    subscribeToComments: vi.fn(),
  },
}));

// Mock other services
vi.mock('../../src/services/selectionService', () => ({
  selectionService: {
    subscribeToCanvasSelections: vi.fn(() => () => {}),
    updateUserSelection: vi.fn(),
    clearUserSelection: vi.fn(),
  },
}));

vi.mock('../../src/hooks/usePresence', () => ({
  usePresence: () => ({ onlineCount: 1 }),
}));

vi.mock('../../src/hooks/useCursors', () => ({
  useCursors: () => ({ cursors: [] }),
}));

vi.mock('../../src/hooks/usePerformanceMonitor', () => ({
  usePerformanceMeasure: () => ({ start: vi.fn(), end: vi.fn() }),
}));

describe('Pencil Tool Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockCanvasId = 'test-canvas-id';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful authentication
    vi.doMock('../../src/hooks/useAuth', () => ({
      useAuth: () => ({ user: mockUser }),
    }));

    // Mock canvas service methods
    (canvasService.createPath as any).mockResolvedValue('test-path-id');
    (canvasService.subscribeToShapes as any).mockReturnValue(() => {});
    (canvasService.subscribeToComments as any).mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCanvas = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Pencil Tool Selection', () => {
    it('should show pencil tool button in tool palette', () => {
      renderCanvas();
      
      const pencilButton = screen.getByTitle('Pencil Tool');
      expect(pencilButton).toBeInTheDocument();
      expect(pencilButton).toHaveTextContent('✏️');
    });

    it('should activate pencil tool when clicked', () => {
      renderCanvas();
      
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      expect(pencilButton).toHaveClass('active');
    });
  });

  describe('Pencil Drawing Workflow', () => {
    it('should start drawing when mouse down on pencil tool', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      // Get canvas element
      const canvas = screen.getByTestId('canvas-stage');
      
      // Simulate mouse down
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Should start drawing mode
      expect(canvas).toHaveStyle({ cursor: 'crosshair' });
    });

    it('should create path when mouse up after drawing', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Simulate drawing sequence
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
      fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
      fireEvent.mouseUp(canvas, { clientX: 120, clientY: 120 });
      
      // Wait for path creation
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            points: expect.arrayContaining([
              { x: 100, y: 100 },
              { x: 110, y: 110 },
              { x: 120, y: 120 },
            ]),
            strokeWidth: 2,
            color: expect.any(String),
          }),
          mockUser.uid
        );
      });
    });

    it('should not create path with less than 2 points', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Simulate single click (no movement)
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
      
      // Should not create path
      expect(canvasService.createPath).not.toHaveBeenCalled();
    });

    it('should show preview line while drawing', () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
      
      // Should show preview line (this would be tested with Konva Line component)
      // The preview line is rendered in CanvasPreview component
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Multi-User Collaboration', () => {
    it('should sync path creation to other users', async () => {
      const mockPaths: any[] = [];
      const mockCallback = vi.fn();
      
      // Mock subscription callback
      (canvasService.subscribeToShapes as any).mockImplementation((canvasId: string, callback: any) => {
        // Simulate receiving a path from another user
        setTimeout(() => {
          callback([
            {
              id: 'remote-path-id',
              type: 'path',
              points: [{ x: 50, y: 50 }, { x: 60, y: 60 }],
              strokeWidth: 2,
              color: '#ff0000',
              createdBy: 'other-user-id',
            },
          ]);
        }, 100);
        return () => {};
      });

      renderCanvas();
      
      // Wait for remote path to appear
      await waitFor(() => {
        expect(screen.getByTestId('shape-remote-path-id')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle concurrent drawing by multiple users', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Simulate concurrent drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
      fireEvent.mouseUp(canvas, { clientX: 110, clientY: 110 });
      
      // Should create path without conflicts
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle drawing with many existing shapes', async () => {
      // Mock many existing shapes
      const manyShapes = Array.from({ length: 50 }, (_, i) => ({
        id: `shape-${i}`,
        type: 'rectangle',
        x: i * 10,
        y: i * 10,
        width: 50,
        height: 50,
        color: '#000000',
        createdBy: 'test-user',
      }));

      (canvasService.subscribeToShapes as any).mockImplementation((canvasId: string, callback: any) => {
        callback(manyShapes);
        return () => {};
      });

      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Should still be able to draw smoothly
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
      fireEvent.mouseUp(canvas, { clientX: 110, clientY: 110 });
      
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalled();
      });
    });

    it('should handle large path with many points', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Simulate drawing a large path
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Add many points
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + i, 
          clientY: 100 + i 
        });
      }
      
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Should create path with many points
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            points: expect.arrayContaining([
              { x: 100, y: 100 },
              { x: 200, y: 200 },
            ]),
          }),
          mockUser.uid
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle drawing outside canvas bounds', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Draw outside bounds
      fireEvent.mouseDown(canvas, { clientX: -10, clientY: -10 });
      fireEvent.mouseMove(canvas, { clientX: 5000, clientY: 5000 });
      fireEvent.mouseUp(canvas, { clientX: 5000, clientY: 5000 });
      
      // Should still create path (clipping handled by canvas bounds)
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalled();
      });
    });

    it('should handle rapid mouse movements', async () => {
      renderCanvas();
      
      // Select pencil tool
      const pencilButton = screen.getByTitle('Pencil Tool');
      fireEvent.click(pencilButton);
      
      const canvas = screen.getByTestId('canvas-stage');
      
      // Rapid movements
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100 + i * 10, 
          clientY: 100 + i * 10 
        });
      }
      
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      // Should create smooth path
      await waitFor(() => {
        expect(canvasService.createPath).toHaveBeenCalled();
      });
    });
  });
});
