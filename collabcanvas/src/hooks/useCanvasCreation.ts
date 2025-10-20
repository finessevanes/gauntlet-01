import { useState } from 'react';
import { canvasListService } from '../services/canvasListService';
import { useError } from '../contexts/ErrorContext';

/**
 * Custom hook for canvas creation with loading and error states
 */
export function useCanvasCreation() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const createCanvas = async (userId: string, name?: string): Promise<string | null> => {
    setCreating(true);
    setError(null);

    try {
      const canvasId = await canvasListService.createCanvas(userId, name);
      return canvasId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMessage);
      showError(`Failed to create canvas: ${errorMessage}`);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createCanvas, creating, error };
}


