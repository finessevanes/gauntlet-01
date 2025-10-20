import { database } from '../firebase';
import { ref, set, onValue, off, remove } from 'firebase/database';
import { requirementsMonitor } from '../utils/performanceRequirements';

export interface Cursor {
  x: number;
  y: number;
  username: string;
  color: string;
  timestamp: number;
}

export interface CursorsMap {
  [userId: string]: Cursor;
}

class CursorService {
  /**
   * Get cursors path for a specific canvas
   */
  private getCursorsPath(canvasId: string): string {
    return `/sessions/${canvasId}/users`;
  }

  /**
   * Update the current user's cursor position in RTDB for a specific canvas
   */
  async updateCursorPosition(
    canvasId: string,
    userId: string,
    x: number,
    y: number,
    username: string,
    color: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const cursorsPath = this.getCursorsPath(canvasId);
      const cursorRef = ref(database, `${cursorsPath}/${userId}/cursor`);
      
      await set(cursorRef, {
        x,
        y,
        username,
        color,
        timestamp: Date.now(),
      });
      
      // Track cursor sync latency for performance requirements
      const latency = Date.now() - startTime;
      requirementsMonitor.trackCursorSync(latency);
      
    } catch (error) {
      console.error('❌ [Cursor] Failed to update cursor position:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all users' cursor positions for a specific canvas
   * @param canvasId - Canvas ID to subscribe to
   * @param callback - Called with updated cursors map whenever data changes
   * @returns Unsubscribe function
   */
  subscribeToCursors(canvasId: string, callback: (cursors: CursorsMap) => void): () => void {
    const cursorsPath = this.getCursorsPath(canvasId);
    const usersRef = ref(database, cursorsPath);

    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      
      if (!data) {
        callback({});
        return;
      }

      // Transform data to cursors map
      const cursors: CursorsMap = {};
      Object.keys(data).forEach((userId) => {
        if (data[userId].cursor) {
          cursors[userId] = data[userId].cursor;
        }
      });

      callback(cursors);
    };

    const handleError = (error: any) => {
      console.error('❌ [Cursor] Error subscribing to cursors:', error);
      console.error('❌ [Cursor] Error code:', error.code);
      console.error('❌ [Cursor] Error message:', error.message);
    };

    onValue(usersRef, handleValue, handleError);

    // Return unsubscribe function
    return () => {
      off(usersRef, 'value', handleValue);
    };
  }

  /**
   * Remove a user's cursor from RTDB for a specific canvas
   */
  async removeCursor(canvasId: string, userId: string): Promise<void> {
    const cursorsPath = this.getCursorsPath(canvasId);
    const cursorRef = ref(database, `${cursorsPath}/${userId}/cursor`);
    await remove(cursorRef);
    console.log(`✅ Cursor removed for user ${userId} on canvas ${canvasId}`);
  }
}

export const cursorService = new CursorService();
