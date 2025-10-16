import { useState, useEffect, useRef } from 'react';
import { presenceService, type PresenceMap } from '../services/presenceService';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user, userProfile } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});
  const isActiveRef = useRef(true); // Track if user is actively viewing the page

  // Subscribe to presence updates
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = presenceService.subscribeToPresence((updatedPresence) => {
      setPresence(updatedPresence);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Set up presence and disconnect handler when user logs in
  // AND track page visibility/focus to show online only when actively viewing
  useEffect(() => {
    if (!user || !userProfile) {
      return;
    }

    let hasSetupDisconnect = false;

    // Function to mark user as online
    const markOnline = async () => {
      try {
        console.log('✅ [Presence] User is now active - marking online');
        await presenceService.setOnline(
          user.uid,
          userProfile.username,
          userProfile.cursorColor
        );

        // Setup disconnect handler (only once)
        if (!hasSetupDisconnect) {
          await presenceService.setupDisconnectHandler(user.uid);
          hasSetupDisconnect = true;
        }
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark online:', error);
      }
    };

    // Function to mark user as offline
    const markOffline = async () => {
      try {
        console.log('👋 [Presence] User is now inactive - marking offline');
        await presenceService.setOffline(user.uid);
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark offline:', error);
      }
    };

    // Check if user is currently active (page visible AND window focused)
    const checkIsActive = () => {
      const isVisible = document.visibilityState === 'visible';
      const isFocused = document.hasFocus();
      return isVisible && isFocused;
    };

    // Update presence based on active state
    const updatePresence = async () => {
      const isActive = checkIsActive();
      
      if (isActive !== isActiveRef.current) {
        isActiveRef.current = isActive;
        
        if (isActive) {
          await markOnline();
        } else {
          await markOffline();
        }
      }
    };

    // Event handlers for visibility and focus changes
    const handleVisibilityChange = () => {
      updatePresence();
    };

    const handleFocus = () => {
      updatePresence();
    };

    const handleBlur = () => {
      updatePresence();
    };

    // Set initial presence state
    updatePresence();

    // Listen for visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount or logout
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (user) {
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

