import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';
import type { PerformanceMetrics } from '../utils/performanceMonitor';

/**
 * Hook for measuring component render performance
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { measureRender, getStats } = usePerformanceMonitor('MyComponent');
 *   
 *   useEffect(() => {
 *     measureRender({ shapeCount: 100 });
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const markName = useRef(`${componentName}-render`);

  // Mark the start of render
  useEffect(() => {
    renderCount.current += 1;
    performanceMonitor.start(markName.current);

    // Measure at the end of the current render cycle
    return () => {
      performanceMonitor.end(markName.current, {
        component: componentName,
        renderNumber: renderCount.current,
      });
    };
  });

  const measureRender = useCallback((metadata?: Record<string, any>) => {
    performanceMonitor.end(markName.current, {
      component: componentName,
      renderNumber: renderCount.current,
      ...metadata,
    });
  }, [componentName]);

  const getStats = useCallback(() => {
    return performanceMonitor.getStats(markName.current);
  }, []);

  const getMetrics = useCallback(() => {
    return performanceMonitor.getMetricsForName(markName.current);
  }, []);

  return {
    measureRender,
    getStats,
    getMetrics,
    renderCount: renderCount.current,
  };
}

/**
 * Hook for measuring specific operations
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { measure, measureAsync } = usePerformanceMeasure();
 *   
 *   const handleClick = () => {
 *     measure('button-click', () => {
 *       // expensive operation
 *     }, { buttonId: 'save' });
 *   };
 *   
 *   return <button onClick={handleClick}>Save</button>;
 * }
 * ```
 */
export function usePerformanceMeasure() {
  const measure = useCallback(<T,>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T => {
    return performanceMonitor.measure(name, fn, metadata);
  }, []);

  const measureAsync = useCallback(async <T,>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn, metadata);
  }, []);

  const start = useCallback((name: string) => {
    performanceMonitor.start(name);
  }, []);

  const end = useCallback((name: string, metadata?: Record<string, any>) => {
    return performanceMonitor.end(name, metadata);
  }, []);

  return {
    measure,
    measureAsync,
    start,
    end,
  };
}

/**
 * Hook for tracking performance metrics over time
 */
export function usePerformanceMetrics(measurementName?: string) {
  const getMetrics = useCallback((): PerformanceMetrics[] => {
    if (measurementName) {
      return performanceMonitor.getMetricsForName(measurementName);
    }
    return performanceMonitor.getMetrics();
  }, [measurementName]);

  const getStats = useCallback(() => {
    if (!measurementName) return null;
    return performanceMonitor.getStats(measurementName);
  }, [measurementName]);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
  }, []);

  const logSummary = useCallback(() => {
    performanceMonitor.logSummary();
  }, []);

  const exportAsCSV = useCallback(() => {
    return performanceMonitor.exportMetricsAsCSV();
  }, []);

  return {
    getMetrics,
    getStats,
    clearMetrics,
    logSummary,
    exportAsCSV,
  };
}

