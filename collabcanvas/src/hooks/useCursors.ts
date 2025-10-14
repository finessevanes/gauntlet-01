import { useState, useEffect, useCallback, useRef } from 'react';
import { throttle } from 'lodash';
import { cursorService, type CursorsMap } from '../services/cursorService';
import { useAuth } from './useAuth';
import { CURSOR_UPDATE_INTERVAL } from '../utils/constants';

export function useCursors(stageRef: React.RefObject<any>) {
  const { user, userProfile } = useAuth();
  const [cursors, setCursors] = useState<CursorsMap>({});
  const throttledUpdateRef = useRef<ReturnType<typeof throttle> | null>(null);

  // Subscribe to all cursors
  useEffect(() => {
    if (!user) return;

    const unsubscribe = cursorService.subscribeToCursors((updatedCursors) => {
      setCursors(updatedCursors);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Create throttled update function
  useEffect(() => {
    if (!user || !userProfile) return;

    throttledUpdateRef.current = throttle(
      (x: number, y: number) => {
        cursorService.updateCursorPosition(
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
  }, [user, userProfile]);

  // Handle mouse move on canvas
  const handleMouseMove = useCallback(
    (e: any) => {
      if (!user || !userProfile || !stageRef.current || !throttledUpdateRef.current) {
        return;
      }

      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();

      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const canvasPos = transform.point(pointerPosition);

      // Update cursor position via throttled function
      throttledUpdateRef.current(canvasPos.x, canvasPos.y);
    },
    [user, userProfile, stageRef]
  );

  // Handle mouse leave - remove cursor
  const handleMouseLeave = useCallback(() => {
    if (!user) return;
    
    cursorService.removeCursor(user.uid);
  }, [user]);

  // Cleanup cursor on unmount
  useEffect(() => {
    return () => {
      if (user) {
        cursorService.removeCursor(user.uid);
      }
    };
  }, [user]);

  // Filter out own cursor
  const otherUsersCursors = Object.entries(cursors).reduce((acc, [userId, cursor]) => {
    if (userId !== user?.uid) {
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

