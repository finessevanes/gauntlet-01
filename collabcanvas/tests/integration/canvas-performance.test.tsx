import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceMonitor } from '../../src/utils/performanceMonitor';
import type { ShapeData } from '../../src/services/canvasService';

/**
 * Performance benchmarking tests for Canvas rendering
 * These tests measure rendering performance with different shape counts
 */

describe('Canvas Performance Benchmarks', () => {
  let perfMonitor: PerformanceMonitor;

  beforeEach(() => {
    perfMonitor = new PerformanceMonitor(true); // Enable logging
    perfMonitor.clearMetrics();
  });

  /**
   * Helper to generate mock shapes for testing
   */
  function generateMockShapes(count: number): ShapeData[] {
    const shapes: ShapeData[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = ['rectangle', 'circle', 'triangle', 'text'][i % 4];
      
      const baseShape = {
        id: `shape-${i}`,
        type,
        x: (i * 50) % 1000,
        y: Math.floor(i / 20) * 50,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        zIndex: i,
        createdBy: 'test-user',
        createdAt: { toMillis: () => Date.now() } as any,
        updatedAt: { toMillis: () => Date.now() } as any,
      };

      if (type === 'circle') {
        shapes.push({ ...baseShape, type: 'circle', radius: 25 } as ShapeData);
      } else if (type === 'text') {
        shapes.push({
          ...baseShape,
          type: 'text',
          text: `Text ${i}`,
          fontSize: 16,
          width: 100,
          height: 30,
        } as ShapeData);
      } else {
        shapes.push({
          ...baseShape,
          type: type as 'rectangle' | 'triangle',
          width: 50,
          height: 50,
        } as ShapeData);
      }
    }
    
    return shapes;
  }

  /**
   * Benchmark: Sorting shapes by zIndex
   */
  it('should sort shapes efficiently', () => {
    const shapeCounts = [10, 50, 100, 500, 1000];
    
    shapeCounts.forEach(count => {
      const shapes = generateMockShapes(count);
      
      perfMonitor.start(`sort-${count}-shapes`);
      shapes.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const duration = perfMonitor.end(`sort-${count}-shapes`, { shapeCount: count });
      
      // Sorting should be fast (< 10ms for 1000 shapes)
      if (count <= 1000) {
        expect(duration).toBeLessThan(10);
      }
    });
    
    perfMonitor.logSummary();
  });

  /**
   * Benchmark: Building comment data map
   */
  it('should build comment map efficiently', () => {
    const shapes = generateMockShapes(100);
    const comments = shapes.flatMap((shape, idx) => 
      idx % 3 === 0 ? [{
        id: `comment-${shape.id}`,
        shapeId: shape.id,
        userId: 'test-user',
        text: 'Test comment',
        resolved: false,
        createdAt: { toMillis: () => Date.now() } as any,
      }] : []
    );

    perfMonitor.start('build-comment-map');
    const map = new Map();
    shapes.forEach(shape => {
      const shapeComments = comments.filter(c => c.shapeId === shape.id && !c.resolved);
      map.set(shape.id, { count: shapeComments.length, hasUnreadReplies: false });
    });
    const duration = perfMonitor.end('build-comment-map', { 
      shapeCount: shapes.length, 
      commentCount: comments.length 
    });

    // Should be fast (< 5ms for 100 shapes with 33 comments)
    expect(duration).toBeLessThan(5);
  });

  /**
   * Benchmark: Shape rendering loop (simulation)
   */
  it('should render shapes efficiently', () => {
    const testCases = [
      { count: 10, maxTime: 5 },
      { count: 50, maxTime: 15 },
      { count: 100, maxTime: 25 },
      { count: 500, maxTime: 100 },
    ];

    testCases.forEach(({ count, maxTime }) => {
      const shapes = generateMockShapes(count);
      
      perfMonitor.start(`render-${count}-shapes`);
      // Simulate shape rendering (creating component props)
      shapes.map(shape => ({
        key: shape.id,
        shape,
        isSelected: false,
        isMultiSelected: false,
        isLockedByMe: false,
        isLockedByOther: false,
        // ... other props
      }));
      const duration = perfMonitor.end(`render-${count}-shapes`, { shapeCount: count });

      console.log(`Rendering ${count} shapes took ${duration.toFixed(2)}ms (max: ${maxTime}ms)`);
      
      // Should complete within expected time
      expect(duration).toBeLessThan(maxTime);
    });

    perfMonitor.logSummary();
  });

  /**
   * Benchmark: Computing bounding boxes for shapes
   */
  it('should compute bounding boxes efficiently', () => {
    const shapes = generateMockShapes(100);
    
    perfMonitor.start('compute-bounding-boxes');
    shapes.map(shape => {
      if (shape.type === 'circle' && shape.radius) {
        return {
          x: shape.x - shape.radius,
          y: shape.y - shape.radius,
          width: shape.radius * 2,
          height: shape.radius * 2,
        };
      } else {
        return {
          x: shape.x,
          y: shape.y,
          width: shape.width || 0,
          height: shape.height || 0,
        };
      }
    });
    const duration = perfMonitor.end('compute-bounding-boxes', { shapeCount: shapes.length });

    // Should be very fast (< 2ms for 100 shapes)
    expect(duration).toBeLessThan(2);
  });

  /**
   * Benchmark: Filtering shapes by selection
   */
  it('should filter selected shapes efficiently', () => {
    const shapes = generateMockShapes(1000);
    const selectedIds = new Set(shapes.slice(0, 50).map(s => s.id));
    
    perfMonitor.start('filter-selected-shapes');
    shapes.filter(shape => selectedIds.has(shape.id));
    const duration = perfMonitor.end('filter-selected-shapes', { 
      totalShapes: shapes.length, 
      selectedCount: selectedIds.size 
    });

    // Should be fast (< 5ms for 1000 shapes)
    expect(duration).toBeLessThan(5);
  });

  /**
   * Stress test: Handle large number of shapes
   */
  it('should handle 2000+ shapes without crashing', () => {
    const shapes = generateMockShapes(2000);
    
    perfMonitor.start('stress-test-2000-shapes');
    // Simulate full render pipeline
    const sorted = shapes.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const selectedSet = new Set<string>();
    sorted.map(shape => ({
      key: shape.id,
      shape,
      isSelected: selectedSet.has(shape.id),
    }));
    const duration = perfMonitor.end('stress-test-2000-shapes', { shapeCount: shapes.length });

    console.log(`Stress test (2000 shapes): ${duration.toFixed(2)}ms`);
    
    // Should complete in reasonable time (< 200ms)
    expect(duration).toBeLessThan(200);
  });

  /**
   * Performance regression test
   */
  it('should not regress in performance', () => {
    const shapes = generateMockShapes(100);
    const iterations = 10;
    
    // Run multiple iterations
    for (let i = 0; i < iterations; i++) {
      perfMonitor.start('regression-test');
      const sorted = shapes.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sorted.map(shape => ({ shape, id: shape.id }));
      perfMonitor.end('regression-test', { iteration: i });
    }
    
    const stats = perfMonitor.getStats('regression-test');
    expect(stats).not.toBeNull();
    
    console.log(`Regression test stats:`, {
      average: stats!.average.toFixed(2),
      min: stats!.min.toFixed(2),
      max: stats!.max.toFixed(2),
    });
    
    // Max should not be more than 5x the average (accounting for first-run warmup)
    expect(stats!.max).toBeLessThan(stats!.average * 5);
  });

  /**
   * Memory efficiency test
   */
  it('should not leak memory with repeated operations', () => {
    const shapes = generateMockShapes(100);
    
    // Perform many operations
    for (let i = 0; i < 100; i++) {
      perfMonitor.start('memory-test');
      const sorted = shapes.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sorted.filter(s => s.type === 'rectangle');
      perfMonitor.end('memory-test');
    }
    
    const metrics = perfMonitor.getMetrics();
    
    // Should maintain max metrics limit (not grow unbounded)
    expect(metrics.length).toBeLessThanOrEqual(100);
  });
});

/**
 * Export performance data for analysis
 */
describe('Performance Data Export', () => {
  it('should export performance data as CSV', () => {
    const perfMonitor = new PerformanceMonitor(false);
    
    perfMonitor.measure('test-operation-1', () => 42);
    perfMonitor.measure('test-operation-2', () => 'hello');
    
    const csv = perfMonitor.exportMetricsAsCSV();
    
    expect(csv).toContain('Name,Duration (ms),Timestamp,Metadata');
    expect(csv).toContain('test-operation-1');
    expect(csv).toContain('test-operation-2');
    
    // Can be saved to file for analysis
    console.log('CSV Export Sample:\n', csv.split('\n').slice(0, 3).join('\n'));
  });
});

