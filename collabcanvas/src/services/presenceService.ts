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
  private presencePath = '/sessions/main/users';
  private lastOnlineUsers: string[] = [];

  /**
   * Mark a user as online and active (tab visible)
   */
  async setOnline(userId: string, username: string, color: string, active: boolean = true): Promise<void> {
    try {
      const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
      
      console.log('📝 [Presence] Setting user online:', {
        userId,
        username,
        color,
        active,
        path: `${this.presencePath}/${userId}/presence`
      });
      
      await set(presenceRef, {
        online: true,
        active,
        lastSeen: serverTimestamp(),
        lastActive: active ? serverTimestamp() : Date.now(),
        username,
        color,
      });
      
      console.log(`✅ [Presence] Successfully set user online (${active ? 'active' : 'away'}):`, username);
    } catch (error) {
      console.error('❌ [Presence] Failed to set user online:', error);
      throw error;
    }
  }

  /**
   * Mark a user as active (tab visible)
   */
  async setActive(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
      const snapshot = await get(presenceRef);
      
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(presenceRef, {
          ...currentData,
          active: true,
          lastActive: serverTimestamp(),
        });
        console.log('🟢 [Presence] User is now active (tab visible)');
      }
    } catch (error) {
      console.error('❌ [Presence] Failed to set user active:', error);
    }
  }

  /**
   * Mark a user as away (tab hidden)
   */
  async setAway(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
      const snapshot = await get(presenceRef);
      
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(presenceRef, {
          ...currentData,
          active: false,
          lastSeen: serverTimestamp(),
        });
        console.log('🔵 [Presence] User is now away (tab hidden)');
      }
    } catch (error) {
      console.error('❌ [Presence] Failed to set user away:', error);
    }
  }

  /**
   * Mark a user as offline
   */
  async setOffline(userId: string): Promise<void> {
    const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
    
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
   * Subscribe to all users' presence status
   * @param callback - Called with updated presence map whenever data changes
   * @returns Unsubscribe function
   */
  subscribeToPresence(callback: (presence: PresenceMap) => void): () => void {
    const usersRef = ref(database, this.presencePath);

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

      // Log online users only when the list changes
      const onlineUsers = Object.entries(presence)
        .filter(([_, user]) => user.online)
        .map(([_, user]) => user.username)
        .sort();
      
      const hasChanged = 
        onlineUsers.length !== this.lastOnlineUsers.length ||
        onlineUsers.some((username, i) => username !== this.lastOnlineUsers[i]);
      
      if (hasChanged) {
        console.log('👥 Online users:', onlineUsers.length > 0 ? onlineUsers.join(', ') : 'none');
        this.lastOnlineUsers = onlineUsers;
      }

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
  async setupDisconnectHandler(userId: string): Promise<void> {
    try {
      const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
      const cursorRef = ref(database, `${this.presencePath}/${userId}/cursor`);

      // Set up disconnect handlers
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
   * Cancel disconnect handlers (call on manual logout)
   */
  async cancelDisconnectHandler(userId: string): Promise<void> {
    const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
    const cursorRef = ref(database, `${this.presencePath}/${userId}/cursor`);

    await onDisconnect(presenceRef).cancel();
    await onDisconnect(cursorRef).cancel();
  }

  /**
   * Clean up old offline presence records
   * Removes users who have been offline for more than a specified time
   */
  async cleanupOldPresence(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const usersRef = ref(database, this.presencePath);
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
        const userRef = ref(database, `${this.presencePath}/${userId}`);
        return remove(userRef);
      });

      await Promise.all(removePromises);
      
      if (toRemove.length > 0) {
        console.log(`🧹 [Presence] Cleaned up ${toRemove.length} stale presence records`);
      }
    } catch (error) {
      console.error('❌ [Presence] Failed to cleanup old presence:', error);
    }
  }
}

export const presenceService = new PresenceService();

