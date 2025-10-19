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
    let isMounted = true;

    // Function to mark user as online (called on first mount)
    const markOnline = async () => {
      if (!isMounted) return;
      
      try {
        // CRITICAL: Setup disconnect handler FIRST, before marking online
        // This ensures we have proper cleanup even if the user's connection drops
        // immediately after logging in
        if (!hasSetupDisconnect && isMounted) {
          await presenceService.setupDisconnectHandler(user.uid);
          hasSetupDisconnect = true;
        }

        // Now mark user as online
        const isVisible = document.visibilityState === 'visible';
        await presenceService.setOnline(
          user.uid,
          userProfile.username,
          userProfile.cursorColor,
          isVisible  // active = true if visible, false if hidden
        );
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark online:', error);
      }
    };

    // Function to mark user as active (tab visible)
    const markActive = async () => {
      if (!isMounted) return;
      
      try {
        await presenceService.setActive(user.uid);
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark active:', error);
      }
    };

    // Function to mark user as away (tab hidden)
    const markAway = async () => {
      if (!isMounted) return;
      
      try {
        await presenceService.setAway(user.uid);
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark away:', error);
      }
    };

    // Check if user is currently viewing the tab
    const checkIsActive = () => {
      return document.visibilityState === 'visible';
    };

    // Update presence based on visibility state
    const updatePresence = async () => {
      const isActive = checkIsActive();
      
      // Only update if state actually changes
      if (isActive !== isActiveRef.current) {
        isActiveRef.current = isActive;
        
        if (isActive) {
          await markActive();
        } else {
          await markAway();
        }
      }
    };

    // Event handler for visibility changes
    const handleVisibilityChange = () => {
      updatePresence();
    };

    // Note: cleanupOldPresence() requires admin permissions to delete other users' data
    // This should be handled by Cloud Functions or backend, not client-side
    // For now, we'll rely on the disconnect handlers to clean up stale presence

    // Mark user as online (with active state based on tab visibility)
    markOnline();
    
    // Set initial active ref state
    isActiveRef.current = checkIsActive();

    // Listen for visibility changes only (not focus)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or logout - mark as offline (not just away)
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only set offline if this is actually a logout/unmount, not just a re-render
      // The AuthContext logout handler will handle setting offline explicitly
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

