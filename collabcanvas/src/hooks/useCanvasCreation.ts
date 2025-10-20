import { useState } from 'react';
import { canvasListService } from '../services/canvasListService';
import toast from 'react-hot-toast';

/**
 * Custom hook for canvas creation with loading and error states
 */
export function useCanvasCreation() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCanvas = async (userId: string, name?: string): Promise<string | null> => {
    setCreating(true);
    setError(null);

    try {
      const canvasId = await canvasListService.createCanvas(userId, name);
      // No success toast - user navigates directly to canvas
      return canvasId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMessage);
      toast.error(`Failed to create canvas: ${errorMessage}`);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createCanvas, creating, error };
}


