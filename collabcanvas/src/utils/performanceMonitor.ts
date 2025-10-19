/**
 * Performance monitoring utilities for Canvas rendering
 * Uses the Performance API to track rendering times and identify bottlenecks
 */

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private logToConsole = false;

  constructor(logToConsole = false) {
    this.logToConsole = logToConsole;
  }

  /**
   * Start a performance measurement
   */
  start(name: string) {
    performance.mark(`${name}-start`);
  }

  /**
   * End a performance measurement and record the duration
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(endMark);
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0] as PerformanceEntry;
      
      const metric: PerformanceMetrics = {
        name,
        duration: measure.duration,
        timestamp: Date.now(),
        metadata,
      };

      // Store metric
      this.metrics.push(metric);
      
      // Keep only the last N metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }

      // Log to console if enabled
      if (this.logToConsole) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`, metadata);
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);

      return measure.duration;
    } catch (error) {
      console.error(`Failed to measure performance for "${name}":`, error);
      return 0;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name);
    const result = fn();
    this.end(name, metadata);
    return result;
  }

  /**
   * Measure an async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all stored metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific measurement name
   */
  getMetricsForName(name: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for a specific measurement
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsForName(name);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get performance statistics for a measurement
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const metrics = this.getMetricsForName(name);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    
    return {
      count: metrics.length,
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      latest: durations[durations.length - 1],
    };
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Enable/disable console logging
   */
  setLogging(enabled: boolean) {
    this.logToConsole = enabled;
  }

  /**
   * Export metrics as CSV string
   */
  exportMetricsAsCSV(): string {
    const headers = ['Name', 'Duration (ms)', 'Timestamp', 'Metadata'];
    const rows = this.metrics.map(m => [
      m.name,
      m.duration.toFixed(2),
      new Date(m.timestamp).toISOString(),
      m.metadata ? JSON.stringify(m.metadata) : '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Log a performance summary to console
   */
  logSummary() {
    // Performance summary logging disabled
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor(
  // Disable console logging by default to reduce noise
  false
);

// Export for custom instances
export { PerformanceMonitor };

/**
 * Helper function to emit performance events for real-time UI updates
 */
export function emitPerformanceEvent(operation: string, duration?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('performance-operation', {
        detail: { operation, duration },
      })
    );
  }
}

