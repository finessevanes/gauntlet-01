import { useState } from 'react';
import { canvasListService } from '../services/canvasListService';
import toast from 'react-hot-toast';

/**
 * Custom hook for canvas rename with optimistic UI and error handling
 */
export function useCanvasRename() {
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticName, setOptimisticName] = useState<string | null>(null);

  const renameCanvas = async (canvasId: string, newName: string): Promise<boolean> => {
    // Validate name locally first
    const validation = canvasListService.validateCanvasName(newName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid canvas name');
      toast.error(validation.error || 'Invalid canvas name');
      return false;
    }

    // Optimistic UI update
    setOptimisticName(newName);
    setRenaming(true);
    setError(null);

    try {
      await canvasListService.renameCanvas(canvasId, newName);
      toast.success(`Canvas renamed to "${newName}"`);
      setOptimisticName(null);
      return true;
    } catch (err) {
      // Revert optimistic UI
      setOptimisticName(null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename canvas';
      setError(errorMessage);
      toast.error(`Failed to rename canvas: ${errorMessage}`);
      return false;
    } finally {
      setRenaming(false);
    }
  };

  return { renameCanvas, renaming, error, optimisticName };
}


