import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../../src/utils/performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(false); // Disable console logging for tests
    monitor.clearMetrics();
  });

  describe('Basic Measurements', () => {
    it('should measure synchronous operations', () => {
      monitor.start('test-operation');
      
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      
      const duration = monitor.end('test-operation');
      
      expect(duration).toBeGreaterThan(0);
      expect(monitor.getMetrics()).toHaveLength(1);
    });

    it('should measure with metadata', () => {
      monitor.start('test-with-metadata');
      monitor.end('test-with-metadata', { itemCount: 100, type: 'shapes' });
      
      const metrics = monitor.getMetrics();
      expect(metrics[0].metadata).toEqual({ itemCount: 100, type: 'shapes' });
    });

    it('should measure using convenience method', () => {
      const result = monitor.measure('test-measure', () => {
        return 42;
      });
      
      expect(result).toBe(42);
      expect(monitor.getMetrics()).toHaveLength(1);
    });

    it('should measure async operations', async () => {
      const result = await monitor.measureAsync('test-async', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });
      
      expect(result).toBe('done');
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should handle errors in async measurements', async () => {
      await expect(
        monitor.measureAsync('test-error', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate average duration', () => {
      // Add multiple measurements
      for (let i = 0; i < 5; i++) {
        monitor.start('repeated-test');
        monitor.end('repeated-test');
      }
      
      const avg = monitor.getAverageDuration('repeated-test');
      expect(avg).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent measurements', () => {
      const avg = monitor.getAverageDuration('non-existent');
      expect(avg).toBe(0);
    });

    it('should calculate comprehensive stats', () => {
      // Add measurements with known durations (simulate with marks at specific times)
      for (let i = 0; i < 3; i++) {
        monitor.start('stats-test');
        // Small delay to ensure different durations
        let sum = 0;
        for (let j = 0; j < 1000 * (i + 1); j++) {
          sum += j;
        }
        monitor.end('stats-test');
      }
      
      const stats = monitor.getStats('stats-test');
      
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(3);
      expect(stats!.average).toBeGreaterThan(0);
      expect(stats!.min).toBeLessThanOrEqual(stats!.average);
      expect(stats!.max).toBeGreaterThanOrEqual(stats!.average);
      expect(stats!.latest).toBeGreaterThan(0);
    });

    it('should return null for stats of non-existent measurements', () => {
      const stats = monitor.getStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('Metrics Management', () => {
    it('should limit stored metrics', () => {
      const smallMonitor = new PerformanceMonitor(false);
      
      // Add more than maxMetrics (default 100)
      for (let i = 0; i < 150; i++) {
        smallMonitor.start('test');
        smallMonitor.end('test');
      }
      
      expect(smallMonitor.getMetrics().length).toBeLessThanOrEqual(100);
    });

    it('should clear all metrics', () => {
      monitor.start('test1');
      monitor.end('test1');
      monitor.start('test2');
      monitor.end('test2');
      
      expect(monitor.getMetrics().length).toBe(2);
      
      monitor.clearMetrics();
      expect(monitor.getMetrics().length).toBe(0);
    });

    it('should filter metrics by name', () => {
      monitor.start('test-a');
      monitor.end('test-a');
      monitor.start('test-b');
      monitor.end('test-b');
      monitor.start('test-a');
      monitor.end('test-a');
      
      const metricsA = monitor.getMetricsForName('test-a');
      const metricsB = monitor.getMetricsForName('test-b');
      
      expect(metricsA).toHaveLength(2);
      expect(metricsB).toHaveLength(1);
    });
  });

  describe('Export Functionality', () => {
    it('should export metrics as CSV', () => {
      monitor.start('test1');
      monitor.end('test1', { type: 'render' });
      monitor.start('test2');
      monitor.end('test2', { type: 'compute' });
      
      const csv = monitor.exportMetricsAsCSV();
      
      expect(csv).toContain('Name,Duration (ms),Timestamp,Metadata');
      expect(csv).toContain('test1');
      expect(csv).toContain('test2');
      expect(csv).toContain('render');
      expect(csv).toContain('compute');
    });
  });

  describe('Logging', () => {
    it('should enable and disable logging', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      monitor.setLogging(true);
      monitor.start('test');
      monitor.end('test');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockClear();
      monitor.setLogging(false);
      monitor.start('test2');
      monitor.end('test2');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log summary', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      monitor.start('test1');
      monitor.end('test1');
      monitor.start('test2');
      monitor.end('test2');
      
      monitor.logSummary();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Performance Summary'));
      
      consoleSpy.mockRestore();
    });
  });
});

