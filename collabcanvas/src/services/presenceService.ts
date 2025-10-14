import { database } from '../firebase';
import { ref, set, onValue, off, onDisconnect, serverTimestamp } from 'firebase/database';

export interface PresenceUser {
  online: boolean;
  lastSeen: number;
  username: string;
  color: string;
}

export interface PresenceMap {
  [userId: string]: PresenceUser;
}

class PresenceService {
  private presencePath = '/sessions/main/users';

  /**
   * Mark a user as online
   */
  async setOnline(userId: string, username: string, color: string): Promise<void> {
    const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
    
    await set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      username,
      color,
    });
  }

  /**
   * Mark a user as offline
   */
  async setOffline(userId: string): Promise<void> {
    const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
    
    await set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
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

      callback(presence);
    };

    onValue(usersRef, handleValue);

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
    const presenceRef = ref(database, `${this.presencePath}/${userId}/presence`);
    const cursorRef = ref(database, `${this.presencePath}/${userId}/cursor`);

    // Set up disconnect handlers
    await onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      username: '',
      color: '',
    });

    // Also clean up cursor on disconnect
    await onDisconnect(cursorRef).remove();
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
}

export const presenceService = new PresenceService();

