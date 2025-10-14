import { useState, useEffect } from 'react';
import { presenceService, type PresenceMap } from '../services/presenceService';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user, userProfile } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});

  // Subscribe to presence updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = presenceService.subscribeToPresence((updatedPresence) => {
      setPresence(updatedPresence);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Set up presence and disconnect handler when user logs in
  useEffect(() => {
    if (!user || !userProfile) return;

    const setupPresence = async () => {
      try {
        // Mark user as online
        await presenceService.setOnline(
          user.uid,
          userProfile.username,
          userProfile.cursorColor
        );

        // Setup disconnect handler for automatic cleanup
        await presenceService.setupDisconnectHandler(user.uid);
      } catch (error) {
        console.error('Failed to setup presence:', error);
      }
    };

    setupPresence();

    // Cleanup on unmount or logout
    return () => {
      if (user) {
        presenceService.setOffline(user.uid).catch((error) => {
          console.error('Failed to set offline:', error);
        });
      }
    };
  }, [user, userProfile]);

  // Get list of online users (including self)
  const onlineUsers = Object.entries(presence)
    .filter(([_, userData]) => userData.online)
    .map(([userId, userData]) => ({
      userId,
      ...userData,
    }));

  // Get total online user count (including self if online)
  const onlineCount = Object.values(presence).filter((p) => p.online).length;

  return {
    presence,
    onlineUsers,
    onlineCount,
  };
}

