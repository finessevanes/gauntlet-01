import { useState, useEffect } from 'react';
import { presenceService, type PresenceMap } from '../services/presenceService';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user, userProfile } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});

  // Subscribe to presence updates
  useEffect(() => {
    if (!user) {
      console.log('⚠️ [usePresence] No user, skipping subscription');
      return;
    }

    console.log('📡 [usePresence] Setting up presence subscription');
    const unsubscribe = presenceService.subscribeToPresence((updatedPresence) => {
      console.log('📥 [usePresence] Received presence update:', updatedPresence);
      setPresence(updatedPresence);
    });

    return () => {
      console.log('📡 [usePresence] Unsubscribing from presence');
      unsubscribe();
    };
  }, [user]);

  // Set up presence and disconnect handler when user logs in
  useEffect(() => {
    if (!user || !userProfile) {
      console.log('⚠️ [usePresence] No user or userProfile, skipping setup');
      return;
    }

    console.log('🔧 [usePresence] Setting up presence for:', {
      userId: user.uid,
      username: userProfile.username,
      color: userProfile.cursorColor,
    });

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
        console.log('✅ [usePresence] Presence setup complete');
      } catch (error) {
        console.error('❌ [usePresence] Failed to setup presence:', error);
      }
    };

    setupPresence();

    // Cleanup on unmount or logout
    return () => {
      if (user) {
        console.log('🔧 [usePresence] Cleaning up presence for:', user.uid);
        presenceService.setOffline(user.uid).catch((error) => {
          console.error('❌ [usePresence] Failed to set offline:', error);
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

