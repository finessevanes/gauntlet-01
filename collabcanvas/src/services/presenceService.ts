import { database } from '../firebase';
import { ref, set, onValue, off, onDisconnect, serverTimestamp, remove, get } from 'firebase/database';

export interface PresenceUser {
  online: boolean;      // Signed in to the session
  active: boolean;      // Currently viewing (tab visible)
  lastSeen: number;     // Last time they were online
  lastActive: number;   // Last time they were active (tab visible)
  username: string;
  color: string;
}

export type PresenceStatus = 'active' | 'away' | 'offline';

export function getPresenceStatus(user: PresenceUser | undefined): PresenceStatus {
  if (!user || !user.online) return 'offline';  // 🔴 Red
  if (user.active) return 'active';              // 🟢 Green
  return 'away';                                 // 🔵 Blue
}

export interface PresenceMap {
  [userId: string]: PresenceUser;
}

class PresenceService {
  /**
   * Get presence path for a specific canvas
   */
  private getPresencePath(canvasId: string): string {
    return `/sessions/${canvasId}/users`;
  }

  /**
   * Mark a user as online and active (tab visible)
   */
  async setOnline(canvasId: string, userId: string, username: string, color: string, active: boolean = true): Promise<void> {
    try {
      const presencePath = this.getPresencePath(canvasId);
      const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
      
      await set(presenceRef, {
        online: true,
        active,
        lastSeen: serverTimestamp(),
        lastActive: active ? serverTimestamp() : Date.now(),
        username,
        color,
      });
    } catch (error) {
      console.error('❌ [Presence] Failed to set user online:', error);
      throw error;
    }
  }

  /**
   * Mark a user as active (tab visible)
   */
  async setActive(canvasId: string, userId: string): Promise<void> {
    try {
      const presencePath = this.getPresencePath(canvasId);
      const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
      const snapshot = await get(presenceRef);
      
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(presenceRef, {
          ...currentData,
          active: true,
          lastActive: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ [Presence] Failed to set user active:', error);
    }
  }

  /**
   * Mark a user as away (tab hidden)
   */
  async setAway(canvasId: string, userId: string): Promise<void> {
    try {
      const presencePath = this.getPresencePath(canvasId);
      const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
      const snapshot = await get(presenceRef);
      
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(presenceRef, {
          ...currentData,
          active: false,
          lastSeen: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ [Presence] Failed to set user away:', error);
    }
  }

  /**
   * Mark a user as offline
   */
  async setOffline(canvasId: string, userId: string): Promise<void> {
    const presencePath = this.getPresencePath(canvasId);
    const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
    
    await set(presenceRef, {
      online: false,
      active: false,
      lastSeen: serverTimestamp(),
      lastActive: Date.now(),
      username: '', // Will be overwritten by disconnect handler if set up
      color: '',
    });
  }

  /**
   * Subscribe to all users' presence status for a specific canvas
   * @param canvasId - Canvas ID to subscribe to
   * @param callback - Called with updated presence map whenever data changes
   * @returns Unsubscribe function
   */
  subscribeToPresence(canvasId: string, callback: (presence: PresenceMap) => void): () => void {
    const presencePath = this.getPresencePath(canvasId);
    const usersRef = ref(database, presencePath);

    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      
      if (!data) {
        callback({});
        return;
      }

      // Transform data to presence map
      const presence: PresenceMap = {};
      Object.keys(data).forEach((userId) => {
        if (data[userId].presence) {
          presence[userId] = data[userId].presence;
        }
      });

      callback(presence);
    };

    const handleError = (error: any) => {
      console.error('❌ [Presence] Error subscribing to presence:', error);
      console.error('❌ [Presence] Error code:', error.code);
      console.error('❌ [Presence] Error message:', error.message);
    };

    onValue(usersRef, handleValue, handleError);

    // Return unsubscribe function
    return () => {
      off(usersRef, 'value', handleValue);
    };
  }

  /**
   * Setup automatic cleanup when user disconnects
   * This uses Firebase RTDB's onDisconnect() feature
   */
  async setupDisconnectHandler(canvasId: string, userId: string): Promise<void> {
    try {
      const presencePath = this.getPresencePath(canvasId);
      const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
      const cursorRef = ref(database, `${presencePath}/${userId}/cursor`);

      // First, cancel any existing disconnect handlers to start fresh
      // This prevents stale handlers from previous sessions
      try {
        await onDisconnect(presenceRef).cancel();
        await onDisconnect(cursorRef).cancel();
      } catch (cancelError) {
        // It's okay if there's nothing to cancel
      }

      // Set up NEW disconnect handlers
      await onDisconnect(presenceRef).set({
        online: false,
        active: false,
        lastSeen: serverTimestamp(),
        lastActive: Date.now(),
        username: '',
        color: '',
      });

      // Also clean up cursor on disconnect
      await onDisconnect(cursorRef).remove();
    } catch (error) {
      console.error('❌ [Presence] Failed to setup disconnect handler:', error);
      throw error;
    }
  }

  /**
   * Cancel disconnect handlers (call on manual logout or canvas switch)
   */
  async cancelDisconnectHandler(canvasId: string, userId: string): Promise<void> {
    const presencePath = this.getPresencePath(canvasId);
    const presenceRef = ref(database, `${presencePath}/${userId}/presence`);
    const cursorRef = ref(database, `${presencePath}/${userId}/cursor`);

    await onDisconnect(presenceRef).cancel();
    await onDisconnect(cursorRef).cancel();
  }

  /**
   * Clean up old offline presence records for a specific canvas
   * Removes users who have been offline for more than a specified time
   */
  async cleanupOldPresence(canvasId: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const presencePath = this.getPresencePath(canvasId);
      const usersRef = ref(database, presencePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.val();
      const now = Date.now();
      const toRemove: string[] = [];

      // Find users who are offline and have been inactive for too long
      Object.entries(data).forEach(([userId, userData]: [string, any]) => {
        if (userData.presence) {
          const { online, lastSeen, username } = userData.presence;
          
          // Remove if:
          // 1. User is offline AND has no username (ghost user)
          // 2. OR user is offline AND hasn't been seen in maxAgeMs
          if (!online) {
            if (!username || username === '') {
              toRemove.push(userId);
            } else if (lastSeen && (now - lastSeen > maxAgeMs)) {
              toRemove.push(userId);
            }
          }
        }
      });

      // Remove stale presence records
      const removePromises = toRemove.map(userId => {
        const userRef = ref(database, `${presencePath}/${userId}`);
        return remove(userRef);
      });

      await Promise.all(removePromises);
    } catch (error) {
      console.error('❌ [Presence] Failed to cleanup old presence:', error);
    }
  }
}

export const presenceService = new PresenceService();
