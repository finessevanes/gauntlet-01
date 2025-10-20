import { useEffect, useRef } from 'react';
import { requirementsMonitor } from '../utils/performanceRequirements';

/**
 * Hook to track performance requirements in real-time
 * - Network sync times (object and cursor)
 * - Scale metrics (object count, user count, FPS)
 */
export function useRequirementsTracking(
  objectCount: number,
  userCount: number,
  fps: number
) {
  const lastScaleUpdate = useRef(0);

  // Track scale metrics every 2 seconds
  useEffect(() => {
    const now = Date.now();
    if (now - lastScaleUpdate.current < 2000) return;

    requirementsMonitor.trackScale(objectCount, userCount, fps);
    lastScaleUpdate.current = now;
  }, [objectCount, userCount, fps]);
}

/**
 * Helper to track object sync latency
 * Call this when shapes are updated via Firebase
 */
export function trackObjectSync(startTime: number) {
  const latency = Date.now() - startTime;
  requirementsMonitor.trackObjectSync(latency);
}

/**
 * Helper to track cursor sync latency
 * Call this when cursor positions are updated via Firebase
 */
export function trackCursorSync(startTime: number) {
  const latency = Date.now() - startTime;
  requirementsMonitor.trackCursorSync(latency);
}

/**
 * Wrapper for Firebase operations to track sync latency
 */
export function withSyncTracking<T>(
  operation: () => Promise<T>,
  type: 'object' | 'cursor'
): Promise<T> {
  const startTime = Date.now();
  
  return operation().then(result => {
    const latency = Date.now() - startTime;
    
    if (type === 'object') {
      requirementsMonitor.trackObjectSync(latency);
    } else {
      requirementsMonitor.trackCursorSync(latency);
    }
    
    return result;
  }).catch(error => {
    // Still track latency even on error
    const latency = Date.now() - startTime;
    if (type === 'object') {
      requirementsMonitor.trackObjectSync(latency);
    } else {
      requirementsMonitor.trackCursorSync(latency);
    }
    throw error;
  });
}

