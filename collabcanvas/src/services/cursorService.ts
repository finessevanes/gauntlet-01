import { database } from '../firebase';
import { ref, set, onValue, off, remove } from 'firebase/database';

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
  private cursorsPath = '/sessions/main/users';

  /**
   * Update the current user's cursor position in RTDB
   */
  async updateCursorPosition(
    userId: string,
    x: number,
    y: number,
    username: string,
    color: string
  ): Promise<void> {
    try {
      const cursorRef = ref(database, `${this.cursorsPath}/${userId}/cursor`);
      
      await set(cursorRef, {
        x,
        y,
        username,
        color,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('❌ [Cursor] Failed to update cursor position:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all users' cursor positions
   * @param callback - Called with updated cursors map whenever data changes
   * @returns Unsubscribe function
   */
  subscribeToCursors(callback: (cursors: CursorsMap) => void): () => void {
    console.log('📡 [Cursor] Subscribing to cursor updates at:', this.cursorsPath);
    const usersRef = ref(database, this.cursorsPath);

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
      console.log('📡 [Cursor] Unsubscribing from cursor updates');
      off(usersRef, 'value', handleValue);
    };
  }

  /**
   * Remove a user's cursor from RTDB
   */
  async removeCursor(userId: string): Promise<void> {
    const cursorRef = ref(database, `${this.cursorsPath}/${userId}/cursor`);
    await remove(cursorRef);
  }
}

export const cursorService = new CursorService();

