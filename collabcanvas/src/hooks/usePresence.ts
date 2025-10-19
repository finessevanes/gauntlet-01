import { useState, useEffect, useRef } from 'react';
import { presenceService, type PresenceMap } from '../services/presenceService';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user, userProfile } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});
  const isActiveRef = useRef(true); // Track if user is actively viewing the page

  // Debug: Log when hook initializes
  useEffect(() => {
    console.log('🔌 [usePresence] Hook initialized with:', {
      userId: user?.uid,
      username: userProfile?.username,
      hasUser: !!user,
      hasUserProfile: !!userProfile,
    });
  }, [user, userProfile]);

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

    // Function to mark user as online (called on first mount)
    const markOnline = async () => {
      try {
        const isVisible = document.visibilityState === 'visible';
        console.log('✅ [Presence] Marking user online', {
          userId: user.uid,
          username: userProfile.username,
          active: isVisible,
          visibilityState: document.visibilityState
        });
        
        await presenceService.setOnline(
          user.uid,
          userProfile.username,
          userProfile.cursorColor,
          isVisible  // active = true if visible, false if hidden
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

    // Function to mark user as active (tab visible)
    const markActive = async () => {
      try {
        console.log('🟢 [Presence] Tab visible - marking active', {
          userId: user.uid,
          username: userProfile.username,
        });
        await presenceService.setActive(user.uid);
      } catch (error) {
        console.error('❌ [usePresence] Failed to mark active:', error);
      }
    };

    // Function to mark user as away (tab hidden)
    const markAway = async () => {
      try {
        console.log('🔵 [Presence] Tab hidden - marking away', {
          userId: user.uid,
          username: userProfile.username,
        });
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

    // Clean up old ghost users before marking self as online
    presenceService.cleanupOldPresence().catch(error => {
      console.error('❌ [usePresence] Failed to cleanup old presence:', error);
    });

    // Mark user as online (with active state based on tab visibility)
    markOnline();
    
    // Set initial active ref state
    isActiveRef.current = checkIsActive();

    // Listen for visibility changes only (not focus)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or logout - mark as offline (not just away)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (user) {
        console.log('🔴 [Presence] Component unmounting - marking offline');
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

  // Debug: Log presence details when count changes
  useEffect(() => {
    const allUsers = Object.entries(presence);
    const activeUsers = allUsers
      .filter(([_, userData]) => userData.online && userData.active)
      .map(([_, userData]) => userData.username);
    const awayUsers = allUsers
      .filter(([_, userData]) => userData.online && !userData.active)
      .map(([_, userData]) => userData.username);
    const offlineUsers = allUsers
      .filter(([_, userData]) => !userData.online)
      .map(([_, userData]) => userData.username);

    console.log('👥 [Presence Debug] Total users in presence map:', allUsers.length);
    console.log('🟢 [Presence Debug] Active users:', activeUsers.length, activeUsers);
    console.log('🔵 [Presence Debug] Away users:', awayUsers.length, awayUsers);
    console.log('🔴 [Presence Debug] Offline users:', offlineUsers.length, offlineUsers);
    console.log('📊 [Presence Debug] Total online (active+away):', onlineCount);
    
    // Show full presence object for debugging
    console.log('🔍 [Presence Debug] Full presence map:', JSON.stringify(presence, null, 2));
  }, [presence, onlineCount]);

  return {
    presence,
    onlineUsers,
    onlineCount,
  };
}

