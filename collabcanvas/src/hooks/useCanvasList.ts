import { useState, useEffect } from 'react';
import { canvasListService } from '../services/canvasListService';
import type { CanvasMetadata } from '../services/types/canvasTypes';
import { useAuth } from './useAuth';

interface UseCanvasListResult {
  canvases: CanvasMetadata[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing canvas list state
 * Subscribes to real-time updates of canvases the user has access to
 */
export function useCanvasList(): UseCanvasListResult {
  const { user } = useAuth();
  const [canvases, setCanvases] = useState<CanvasMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCanvases([]);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to canvas list updates
    const unsubscribe = canvasListService.subscribeToUserCanvases(
      user.uid,
      (updatedCanvases) => {
        setCanvases(updatedCanvases);
        setLoading(false);
        setError(null);
      }
    );

    // Cleanup subscription on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user]);

  return { canvases, loading, error };
}

