import { useState, useEffect, useCallback, useRef } from 'react';
import { throttle } from 'lodash';
import { cursorService, type CursorsMap } from '../services/cursorService';
import { presenceService, type PresenceMap } from '../services/presenceService';
import { useAuth } from './useAuth';
import { useCanvasContext } from '../contexts/CanvasContext';
import { CURSOR_UPDATE_INTERVAL, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export function useCursors(stageRef: React.RefObject<any>) {
  const { user, userProfile } = useAuth();
  const { currentCanvasId } = useCanvasContext();
  const [cursors, setCursors] = useState<CursorsMap>({});
  const [presence, setPresence] = useState<PresenceMap>({});
  const throttledUpdateRef = useRef<ReturnType<typeof throttle> | null>(null);

  // Subscribe to all cursors (canvas-scoped)
  useEffect(() => {
    if (!user || !currentCanvasId) {
      setCursors({});
      return;
    }

    const unsubscribe = cursorService.subscribeToCursors(currentCanvasId, (updatedCursors) => {
      setCursors(updatedCursors);
    });

    return () => {
      unsubscribe();
    };
  }, [user, currentCanvasId]);

  // Subscribe to presence to filter out offline users' cursors (canvas-scoped)
  useEffect(() => {
    if (!user || !currentCanvasId) {
      setPresence({});
      return;
    }

    const unsubscribe = presenceService.subscribeToPresence(currentCanvasId, (updatedPresence) => {
      setPresence(updatedPresence);
    });

    return () => {
      unsubscribe();
    };
  }, [user, currentCanvasId]);

  // Create throttled update function
  useEffect(() => {
    if (!user || !userProfile || !currentCanvasId) return;

    throttledUpdateRef.current = throttle(
      (x: number, y: number) => {
        cursorService.updateCursorPosition(
          currentCanvasId,
          user.uid,
          x,
          y,
          userProfile.username,
          userProfile.cursorColor
        );
      },
      CURSOR_UPDATE_INTERVAL
    );

    return () => {
      if (throttledUpdateRef.current) {
        throttledUpdateRef.current.cancel();
      }
    };
  }, [user, userProfile, currentCanvasId]);

  // Handle mouse move on canvas
  const handleMouseMove = useCallback(
    (_e: any) => {
      if (!user || !userProfile || !currentCanvasId || !stageRef.current || !throttledUpdateRef.current) {
        return;
      }

      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();

      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const canvasPos = transform.point(pointerPosition);

      // Check if cursor is within canvas bounds (5000×5000)
      if (
        canvasPos.x < 0 || 
        canvasPos.x > CANVAS_WIDTH || 
        canvasPos.y < 0 || 
        canvasPos.y > CANVAS_HEIGHT
      ) {
        // Outside canvas bounds - remove cursor
        cursorService.removeCursor(currentCanvasId, user.uid);
        return;
      }

      // Inside canvas bounds - update cursor position via throttled function
      throttledUpdateRef.current(canvasPos.x, canvasPos.y);
    },
    [user, userProfile, currentCanvasId, stageRef]
  );

  // Handle mouse leave - remove cursor
  const handleMouseLeave = useCallback(() => {
    if (!user || !currentCanvasId) return;
    
    cursorService.removeCursor(currentCanvasId, user.uid);
  }, [user, currentCanvasId]);

  // Cleanup cursor on unmount or canvas change
  useEffect(() => {
    return () => {
      if (user && currentCanvasId) {
        cursorService.removeCursor(currentCanvasId, user.uid);
      }
    };
  }, [user, currentCanvasId]);

  // Filter out own cursor AND cursors from offline users
  const otherUsersCursors = Object.entries(cursors).reduce((acc, [userId, cursor]) => {
    // Don't show own cursor
    if (userId === user?.uid) {
      return acc;
    }
    
    // Only show cursor if user is online
    const userPresence = presence[userId];
    if (userPresence && userPresence.online) {
      acc[userId] = cursor;
    }
    
    return acc;
  }, {} as CursorsMap);

  return {
    cursors: otherUsersCursors,
    handleMouseMove,
    handleMouseLeave,
  };
}
