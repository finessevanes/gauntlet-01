import { useCanvasContext } from '../contexts/CanvasContext';

/**
 * Custom hook to access canvas operations and state
 * Wrapper around useCanvasContext for convenience
 */
export function useCanvas() {
  return useCanvasContext();
}

