import { useState } from 'react';
import { canvasListService } from '../services/canvasListService';
import { useError } from '../contexts/ErrorContext';

/**
 * Custom hook for canvas rename with optimistic UI and error handling
 */
export function useCanvasRename() {
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticName, setOptimisticName] = useState<string | null>(null);
  const { showError } = useError();

  const renameCanvas = async (canvasId: string, newName: string): Promise<boolean> => {
    // Validate name locally first
    const validation = canvasListService.validateCanvasName(newName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid canvas name');
      showError(validation.error || 'Invalid canvas name');
      return false;
    }

    // Optimistic UI update
    setOptimisticName(newName);
    setRenaming(true);
    setError(null);

    try {
      await canvasListService.renameCanvas(canvasId, newName);
      setOptimisticName(null);
      return true;
    } catch (err) {
      // Revert optimistic UI
      setOptimisticName(null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename canvas';
      setError(errorMessage);
      showError(`Failed to rename canvas: ${errorMessage}`);
      return false;
    } finally {
      setRenaming(false);
    }
  };

  return { renameCanvas, renaming, error, optimisticName };
}


