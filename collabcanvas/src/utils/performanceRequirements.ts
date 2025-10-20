/**
 * Performance Requirements Tracker
 * Tracks the 3 key performance requirements:
 * 1. 60 FPS during all interactions
 * 2. Sync times (objects <100ms, cursors <50ms)
 * 3. Scale (500+ objects, 5+ concurrent users)
 */

export interface PerformanceRequirement {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: 'met' | 'warning' | 'failing';
  description: string;
}

export interface SyncMetric {
  type: 'object' | 'cursor';
  latency: number;
  timestamp: number;
}

export interface ScaleMetric {
  objectCount: number;
  userCount: number;
  fps: number;
  timestamp: number;
}

class RequirementsMonitor {
  private syncMetrics: SyncMetric[] = [];
  private scaleMetrics: ScaleMetric[] = [];
  private maxSyncHistory = 50;
  private maxScaleHistory = 100;

  /**
   * Track object sync latency
   */
  trackObjectSync(latencyMs: number) {
    this.syncMetrics.push({
      type: 'object',
      latency: latencyMs,
      timestamp: Date.now(),
    });

    // Keep only recent history
    if (this.syncMetrics.length > this.maxSyncHistory) {
      this.syncMetrics = this.syncMetrics.slice(-this.maxSyncHistory);
    }

    // Emit event for real-time UI updates
    this.emitSyncEvent('object', latencyMs);
  }

  /**
   * Track cursor sync latency
   */
  trackCursorSync(latencyMs: number) {
    this.syncMetrics.push({
      type: 'cursor',
      latency: latencyMs,
      timestamp: Date.now(),
    });

    if (this.syncMetrics.length > this.maxSyncHistory) {
      this.syncMetrics = this.syncMetrics.slice(-this.maxSyncHistory);
    }

    this.emitSyncEvent('cursor', latencyMs);
  }

  /**
   * Track scale metrics (object count, user count, fps)
   */
  trackScale(objectCount: number, userCount: number, fps: number) {
    this.scaleMetrics.push({
      objectCount,
      userCount,
      fps,
      timestamp: Date.now(),
    });

    if (this.scaleMetrics.length > this.maxScaleHistory) {
      this.scaleMetrics = this.scaleMetrics.slice(-this.maxScaleHistory);
    }

    this.emitScaleEvent(objectCount, userCount, fps);
  }

  /**
   * Get average object sync latency
   */
  getObjectSyncAverage(): number {
    const objectSyncs = this.syncMetrics.filter(m => m.type === 'object');
    if (objectSyncs.length === 0) return 0;
    return objectSyncs.reduce((sum, m) => sum + m.latency, 0) / objectSyncs.length;
  }

  /**
   * Get average cursor sync latency
   */
  getCursorSyncAverage(): number {
    const cursorSyncs = this.syncMetrics.filter(m => m.type === 'cursor');
    if (cursorSyncs.length === 0) return 0;
    return cursorSyncs.reduce((sum, m) => sum + m.latency, 0) / cursorSyncs.length;
  }

  /**
   * Get latest scale data
   */
  getLatestScale(): ScaleMetric | null {
    if (this.scaleMetrics.length === 0) return null;
    return this.scaleMetrics[this.scaleMetrics.length - 1];
  }

  /**
   * Get all requirements status
   */
  getRequirementsStatus(currentFPS: number): PerformanceRequirement[] {
    const objectSync = this.getObjectSyncAverage();
    const cursorSync = this.getCursorSyncAverage();
    const scale = this.getLatestScale();

    return [
      {
        name: 'Frame Rate',
        current: currentFPS,
        target: 60,
        unit: 'FPS',
        status: currentFPS >= 55 ? 'met' : currentFPS >= 30 ? 'warning' : 'failing',
        description: 'Maintain 60 FPS during all interactions',
      },
      {
        name: 'Object Sync',
        current: objectSync,
        target: 100,
        unit: 'ms',
        status: objectSync === 0 ? 'met' : objectSync < 100 ? 'met' : objectSync < 150 ? 'warning' : 'failing',
        description: 'Sync object changes in <100ms',
      },
      {
        name: 'Cursor Sync',
        current: cursorSync,
        target: 50,
        unit: 'ms',
        status: cursorSync === 0 ? 'met' : cursorSync < 50 ? 'met' : cursorSync < 75 ? 'warning' : 'failing',
        description: 'Sync cursor positions in <50ms',
      },
      {
        name: 'Object Capacity',
        current: scale?.objectCount || 0,
        target: 500,
        unit: 'objects',
        status: !scale ? 'met' : scale.objectCount < 500 ? 'met' : scale.objectCount < 750 ? 'warning' : 'failing',
        description: 'Support 500+ objects without FPS drops',
      },
      {
        name: 'User Capacity',
        current: scale?.userCount || 0,
        target: 5,
        unit: 'users',
        status: !scale ? 'met' : scale.userCount <= 5 ? 'met' : scale.userCount <= 8 ? 'warning' : 'failing',
        description: 'Support 5+ concurrent users',
      },
    ];
  }

  /**
   * Get sync metrics
   */
  getSyncMetrics(): SyncMetric[] {
    return [...this.syncMetrics];
  }

  /**
   * Get scale metrics
   */
  getScaleMetrics(): ScaleMetric[] {
    return [...this.scaleMetrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.syncMetrics = [];
    this.scaleMetrics = [];
  }

  private emitSyncEvent(type: 'object' | 'cursor', latency: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('performance-sync', {
          detail: { type, latency, timestamp: Date.now() },
        })
      );
    }
  }

  private emitScaleEvent(objectCount: number, userCount: number, fps: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('performance-scale', {
          detail: { objectCount, userCount, fps, timestamp: Date.now() },
        })
      );
    }
  }
}

// Singleton instance
export const requirementsMonitor = new RequirementsMonitor();

