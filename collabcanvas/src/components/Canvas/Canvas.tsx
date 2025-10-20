import { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import { usePresence } from '../../hooks/usePresence';
import { useShapeResize } from '../../hooks/useShapeResize';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDrawing } from '../../hooks/useDrawing';
import { useRotation } from '../../hooks/useRotation';
import { useMarqueeSelection } from '../../hooks/useMarqueeSelection';
import { useShapeInteraction } from '../../hooks/useShapeInteraction';
import { useCommentPanel } from '../../hooks/useCommentPanel';
import { useMultiShapeDrag } from '../../hooks/useMultiShapeDrag';
import { usePerformanceMeasure } from '../../hooks/usePerformanceMonitor';
import { requirementsMonitor } from '../../utils/performanceRequirements';
import CursorLayer from '../Collaboration/CursorLayer';
import CanvasShape from './CanvasShape';
import CanvasPreview from './CanvasPreview';
import CanvasTooltips from './CanvasTooltips';
import AlignmentToolbar from './AlignmentToolbar';
import { CommentPanel } from './CommentPanel';
import TextEditorOverlay from './TextEditorOverlay';
import { getShapeLockStatus, getCursorStyle } from './canvasHelpers';
import { selectionService } from '../../services/selectionService';
import { calculateTextDimensions } from '../../utils/textEditingHelpers';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
} from '../../utils/constants';
import type Konva from 'konva';
import type { ShapeData } from '../../services/canvasService';

export default function Canvas() {
  const { user } = useAuth();
  const { onlineCount } = usePresence();
  const { start: perfStart, end: perfEnd } = usePerformanceMeasure();
  const { 
    stageScale, 
    setStageScale, 
    stagePosition, 
    setStagePosition,
    selectedColor,
    activeTool,
    setActiveTool,
    isDrawMode,
    setIsDrawMode,
    isBombMode,
    setIsBombMode,
    shapes,
    createShape,
    createCircle,
    createTriangle,
    createText,
    createPath,
    updateShape,
    batchUpdateShapes,
    resizeShape,
    resizeCircle,
    rotateShape,
    lockShape,
    unlockShape,
    deleteShape,
    duplicateShape,
    deleteAllShapes,
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    lastClickedShapeId,
    setLastClickedShapeId,
    userSelections,
    shapesLoading,
    clipboard,
    setClipboard,
    groupShapes,
    ungroupShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    batchBringToFront,
    batchSendToBack,
    batchBringForward,
    batchSendBackward,
    isAlignmentToolbarMinimized,
    setIsAlignmentToolbarMinimized,
    comments,
    addComment,
    addReply,
    resolveComment,
    deleteComment,
    deleteReply,
    markRepliesAsRead,
    editingTextId,
    enterEdit,
    saveText,
  } = useCanvasContext();
  
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);

  // Resize handle hover state
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Text editing state - track current text content for dynamic border
  const [editingTextContent, setEditingTextContent] = useState<string>('');
  const [editingTextDimensions, setEditingTextDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Track performance requirements (object count, user count, FPS)
  useEffect(() => {
    // Get current FPS from window (if available from PerformancePanel)
    // For now, we'll estimate based on requestAnimationFrame
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;
    
    const measureFPS = (currentTime: number) => {
      frames++;
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) {
        fps = Math.round((frames * 1000) / elapsed);
        
        // Track scale metrics with actual online user count
        // Ensure at least 1 user (yourself) is counted
        const userCount = Math.max(1, onlineCount);
        
        requirementsMonitor.trackScale(shapes.length, userCount, fps);
        
        frames = 0;
        lastTime = currentTime;
      }
      
      return requestAnimationFrame(measureFPS);
    };
    
    const animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, [shapes.length, onlineCount]);
  
  // Handle text content changes during editing
  const handleEditingTextChange = (text: string) => {
    setEditingTextContent(text);
  };
  
  // Handle dimension changes from HTML input
  const handleEditingDimensionsChange = (dimensions: { width: number; height: number }) => {
    setEditingTextDimensions(dimensions);
  };
  
  // Reset editing text content when entering edit mode
  const handleEnterEdit = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && shape.type === 'text') {
      setEditingTextContent(shape.text || '');
      setEditingTextDimensions(null); // Reset dimensions
    }
    enterEdit(shapeId);
  };
  
  // Handle saving text and reset editing content
  const handleSaveText = async (text: string) => {
    if (!editingTextId) return;
    try {
      await saveText(editingTextId, text);
      setEditingTextContent(''); // Reset editing content after saving
      setEditingTextDimensions(null); // Reset dimensions after saving
    } catch (error) {
      console.error('Error saving text:', error);
      throw error;
    }
  };
  
  // Bomb explosion state
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  
  // Space key panning state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Bomb explosion handler
  const handleBombClick = async (x: number, y: number) => {
    if (!user) return;

    // Show explosion effect at click position
    setExplosionPos({ x, y });
    
    // Play explosion animation and delete all shapes
    try {
      await deleteAllShapes();
    } catch (error) {
      console.error('❌ Failed to delete shapes:', error);
    }

    // Clear explosion effect and return to select mode after animation
    setTimeout(() => {
      setExplosionPos(null);
      // Automatically switch back to select tool after bomb is used
      setActiveTool('select');
      setIsDrawMode(false);
      setIsBombMode(false);
    }, 800);
  };
  
  // Cursor tracking
  const { cursors, handleMouseMove: handleCursorMove, handleMouseLeave } = useCursors(stageRef);

  // Marquee selection hook
  const {
    isMarqueeActive,
    marqueeStart,
    marqueeEnd,
    setIsMarqueeActive,
    setMarqueeStart,
    setMarqueeEnd,
    updateMarquee,
    finishMarquee,
    cancelMarquee,
  } = useMarqueeSelection({
    shapes,
    selectedShapes,
    setSelectedShapes,
  });

  // Shape interaction hook (selection, dragging)
  const {
    handleDeselectShape,
    handleShapeMouseDown,
    handleShapeDragStart: handleShapeDragStartBase,
    handleShapeDragMove: handleShapeDragMoveBase,
    handleShapeDragEnd: handleShapeDragEndBase,
    finalizeSingleShapeDrag,
  } = useShapeInteraction({
    user,
    shapes,
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    lastClickedShapeId,
    setLastClickedShapeId,
    userSelections,
    lockShape,
    unlockShape,
    updateShape,
  });

  // Multi-shape drag hook
  const {
    multiDragInitialPositions,
    handleMultiDragStart,
    handleMultiDragMove,
    handleMultiDragEnd,
  } = useMultiShapeDrag({
    stageRef,
    shapes,
    selectedShapes,
    batchUpdateShapes,
  });

  // Drawing hook
  const {
    isDrawing,
    isPencilDrawing,
    previewRect,
    previewCircle,
    previewTriangle,
    previewPath,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  } = useDrawing({
    activeTool,
    selectedColor,
    user,
    createShape,
    createCircle,
    createTriangle,
    createText,
    createPath,
    enterEdit: handleEnterEdit,
    handleBombClick,
    handleDeselectShape,
    setSelectedShapes,
    selectedShapeId,
    setMarqueeStart,
    setMarqueeEnd,
    setIsMarqueeActive,
  });

  // Rotation hook
  const {
    isRotating,
    previewRotation,
    hoveredRotationHandle,
    setHoveredRotationHandle,
    handleRotationStart,
    handleRotationMove,
    handleRotationEnd,
    cancelRotation,
  } = useRotation({
    stageRef,
    shapes,
    selectedShapeId,
    rotateShape,
  });

  // Comment panel hook
  const {
    openCommentPanelShapeId,
    setOpenCommentPanelShapeId,
    handleCommentIndicatorClick,
    handleCommentPanelClose,
    handleAddComment,
    handleAddReply,
    handleResolveComment,
    handleDeleteComment,
    handleDeleteReply,
  } = useCommentPanel({
    user,
    addComment,
    addReply,
    resolveComment,
    deleteComment,
    deleteReply,
    markRepliesAsRead,
    comments,
  });

  // Resize logic hook
  const {
    isResizing,
    previewDimensions,
    previewFontSize,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useShapeResize({
    stageRef: stageRef as React.RefObject<Konva.Stage | null>,
    shapes,
    selectedShapeId,
    setSelectedShapeId,
    resizeShape,
    resizeCircle,
    updateShape,
    unlockShape,
  });

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    user,
    selectedShapeId,
    selectedShapes,
    shapes,
    clipboard,
    lastClickedShapeId,
    isMarqueeActive,
    openCommentPanelShapeId,
    editingTextId,
    isAlignmentToolbarMinimized,
    setSelectedShapeId,
    setSelectedShapes,
    setClipboard,
    setStageScale,
    setStagePosition,
    setIsSpacePressed,
    unlockShape,
    deleteShape,
    duplicateShape,
    groupShapes,
    ungroupShapes,
    batchUpdateShapes,
    updateShape,
    createShape,
    createCircle,
    createTriangle,
    createText,
    lockShape,
    batchBringToFront,
    batchSendToBack,
    batchBringForward,
    batchSendBackward,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  });

  // Deselect and unlock when selected shape is deleted/changed externally
  useEffect(() => {
    if (selectedShapeId) {
      const shapeStillExists = shapes.find(s => s.id === selectedShapeId);
      if (!shapeStillExists) {
        handleDeselectShape();
      }
    }
  }, [shapes, selectedShapeId]);

  // Clean up stale locks on mount (from previous sessions or crashes)
  useEffect(() => {
    if (!user) return;
    
    const cleanupStaleLocks = async () => {
      for (const shape of shapes) {
        // Check if shape is locked by current user but not selected
        if (shape.lockedBy === user.uid && shape.lockedAt) {
          const lockAge = Date.now() - shape.lockedAt.toMillis();
          // If lock is older than 10 seconds, it's definitely stale
          if (lockAge > 10000) {
            try {
              await unlockShape(shape.id);
            } catch (error) {
              console.error('Failed to cleanup stale lock:', error);
            }
          }
        }
      }
    };
    
    // Run cleanup after shapes are loaded
    if (!shapesLoading && shapes.length > 0) {
      cleanupStaleLocks();
    }
  }, [user, shapes, shapesLoading]);

  // Log text size when a text box is selected
  useEffect(() => {
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape && selectedShape.type === 'text') {
        const fontSize = selectedShape.fontSize || 16;
        console.log(`📝 Text size: ${fontSize}px`);
      }
    }
  }, [selectedShapeId, shapes]);

  // Reset alignment toolbar minimized state when selection changes to less than 2 shapes
  useEffect(() => {
    if (selectedShapes.length < 2 && isAlignmentToolbarMinimized) {
      setIsAlignmentToolbarMinimized(false);
    }
  }, [selectedShapes.length, isAlignmentToolbarMinimized, setIsAlignmentToolbarMinimized]);

  // Listen for custom event to open comment panel
  useEffect(() => {
    const handleOpenCommentPanel = (e: Event) => {
      const customEvent = e as CustomEvent<{ shapeId: string }>;
      if (customEvent.detail?.shapeId) {
        setOpenCommentPanelShapeId(customEvent.detail.shapeId);
      }
    };

    window.addEventListener('openCommentPanel', handleOpenCommentPanel);
    return () => window.removeEventListener('openCommentPanel', handleOpenCommentPanel);
  }, []);

  // Simplified mouse down handler - delegates to hooks
  const handleMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;


    // Check if we clicked on the background
    const clickedOnBackground = 
      e.target === stage || 
      e.target.getType() === 'Layer' ||
      e.target.name() === 'background' ||
      e.target.name() === 'grid';

    if (clickedOnBackground) {
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      let x = (pointerPosition.x - stage.x()) / stage.scaleX();
      let y = (pointerPosition.y - stage.y()) / stage.scaleY();

      // Clamp to canvas bounds
      x = Math.max(0, Math.min(CANVAS_WIDTH, x));
      y = Math.max(0, Math.min(CANVAS_HEIGHT, y));

      // Delegate to drawing hook (handles all drawing tools)
      startDrawing(x, y, e.evt.shiftKey);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Update cursor tracking
    handleCursorMove(e);

    // Handle rotation if in progress
    if (isRotating) {
      handleRotationMove(e);
      return;
    }

    // Handle resize if in progress
    if (isResizing) {
      handleResizeMove(e);
      return;
    }

    // Handle marquee selection
    if (isMarqueeActive) {
      updateMarquee(e);
      return;
    }

    // Handle drawing preview (including pencil drawing)
    if (isDrawing || isPencilDrawing) {
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      let currentX = (pointerPosition.x - stage.x()) / stage.scaleX();
      let currentY = (pointerPosition.y - stage.y()) / stage.scaleY();

      // Clamp current position to canvas bounds
      currentX = Math.max(0, Math.min(CANVAS_WIDTH, currentX));
      currentY = Math.max(0, Math.min(CANVAS_HEIGHT, currentY));

      updateDrawing(currentX, currentY);
    }
  };

  const handleMouseUp = async () => {
    
    // Handle rotation end if in progress
    if (isRotating) {
      await handleRotationEnd();
      return;
    }

    // Handle resize end if in progress
    if (isResizing) {
      await handleResizeEnd();
      return;
    }

    // Handle marquee selection end
    if (isMarqueeActive) {
      finishMarquee();
      return;
    }

    // Handle drawing end (including pencil drawing)
    if (isDrawing || isPencilDrawing) {
      await finishDrawing();
    }
  };

  // Shape drag handlers - delegates to hooks
  const handleShapeDragStart = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    handleShapeDragStartBase(e, shapeId);
    handleMultiDragStart(shapeId);
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    handleShapeDragMoveBase(e, shapeId);
    
    // Handle multi-shape move
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && multiDragInitialPositions.size > 0) {
      const node = e.target;
      handleMultiDragMove(shapeId, node.x(), node.y());
    }
  };

  const handleShapeDragEnd = async (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    const position = await handleShapeDragEndBase(e, shapeId);
    
    // Handle multi-shape or single shape drag completion
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && multiDragInitialPositions.size > 0) {
      await handleMultiDragEnd(shapeId, position.x, position.y);
    } else {
      await finalizeSingleShapeDrag(shapeId, position);
    }
  };

  // Handle mouse leaving canvas - reset drawing state to prevent stuck dragging
  const handleCanvasMouseLeave = () => {
    // Reset drawing state
    if (isDrawing) {
      cancelDrawing();
    }
    
    // Reset rotation state
    if (isRotating) {
      cancelRotation();
    }
    
    // Reset resize state
    if (isResizing) {
      handleResizeEnd();
    }
    
    // Reset marquee state
    if (isMarqueeActive) {
      cancelMarquee();
    }
    
    // Reset panning state
    setIsPanning(false);
    
    // Still call cursor tracking cleanup
    handleMouseLeave();
  };


  // Handle wheel zoom (cursor-centered)
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and factor
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp scale to min/max zoom
    const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    // Calculate new position to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePosition(newPos);
  };

  // Handle drag start to show panning cursor
  const handleDragStart = () => {
    setIsPanning(true);
  };

  // Handle drag end to update position
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
    setIsPanning(false);
  };

  // Calculate screen position for a shape (considering stage transforms)
  // Used for positioning the CommentPanel overlay
  const getShapeScreenPosition = (shape: ShapeData) => {
    let shapeX = shape.x;
    let shapeY = shape.y;
    let shapeWidth = shape.width;
    let shapeHeight = shape.height;

    // For circles, adjust to get bounding box
    if (shape.type === 'circle' && shape.radius) {
      shapeX = shape.x - shape.radius;
      shapeY = shape.y - shape.radius;
      shapeWidth = shape.radius * 2;
      shapeHeight = shape.radius * 2;
    } else if (shape.type === 'text') {
      // For text shapes, use dynamic dimension calculation to match CanvasShape.tsx
      const textContent = shape.text || '';
      const textFontSize = shape.fontSize || 16;
      const fontWeight = shape.fontWeight || 'normal';
      
      // Use the same text dimension calculation as CanvasShape.tsx
      const textDimensions = calculateTextDimensions(textContent, textFontSize, fontWeight);
      const padding = 4;
      
      shapeX = shape.x;
      shapeY = shape.y;
      shapeWidth = textDimensions.width + padding * 2;
      shapeHeight = textDimensions.height + padding * 2;
    }

    // Apply stage transforms
    const screenX = shapeX * stageScale + stagePosition.x;
    const screenY = shapeY * stageScale + stagePosition.y;
    const screenWidth = shapeWidth * stageScale;
    const screenHeight = shapeHeight * stageScale;

    return { screenX, screenY, screenWidth, screenHeight };
  };

  // ============================================
  // Performance Optimizations with useMemo
  // ============================================

  // 1. Memoize sorted shapes (avoid re-sorting on every render)
  const sortedShapes = useMemo(() => {
    perfStart('shapes-sort');
    const sorted = shapes.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const duration = perfEnd('shapes-sort', { shapeCount: shapes.length });
    
    // Emit event for live monitoring
    window.dispatchEvent(
      new CustomEvent('performance-operation', {
        detail: { operation: 'shapes-sort', duration },
      })
    );
    
    return sorted;
  }, [shapes, perfStart, perfEnd]);

  // 2. Memoize comment data for each shape (expensive filtering/calculations)
  const shapeCommentsMap = useMemo(() => {
    perfStart('comments-map-build');
    const map = new Map<string, { count: number; hasUnreadReplies: boolean }>();
    
    shapes.forEach(shape => {
      const shapeComments = comments.filter(c => c.shapeId === shape.id && !c.resolved);
      const commentCount = shapeComments.length;
      
      // Check if there are unread replies for the current user
      const hasUnreadReplies = user ? shapeComments.some(comment => {
        // Only check comments where the current user is the author
        if (comment.userId !== user.uid) {
          return false;
        }
        
        // Check if there are replies and if they haven't been read
        if (!comment.replies || comment.replies.length === 0) {
          return false;
        }
        
        // Check if there are any replies from OTHER users
        const hasRepliesFromOthers = comment.replies.some(reply => reply.userId !== user.uid);
        if (!hasRepliesFromOthers) {
          return false;
        }
        
        // Check timestamps
        if (comment.lastReplyAt) {
          const lastReadTimestamp = comment.replyReadStatus?.[user.uid];
          
          if (!lastReadTimestamp) {
            return true;
          }
          
          const lastReadMs = lastReadTimestamp.toMillis ? lastReadTimestamp.toMillis() : lastReadTimestamp.seconds * 1000;
          const lastReplyMs = comment.lastReplyAt.toMillis ? comment.lastReplyAt.toMillis() : comment.lastReplyAt.seconds * 1000;
          
          return lastReplyMs > lastReadMs;
        }
        
        return false;
      }) : false;
      
      map.set(shape.id, { count: commentCount, hasUnreadReplies });
    });
    
    const duration = perfEnd('comments-map-build', { shapeCount: shapes.length, commentCount: comments.length });
    
    // Emit event for live monitoring
    window.dispatchEvent(
      new CustomEvent('performance-operation', {
        detail: { operation: 'comments-map-build', duration },
      })
    );
    
    return map;
  }, [shapes, comments, user, perfStart, perfEnd]);

  // 3. Memoize cursor style (avoid recalculating on every render)
  const cursorStyle = useMemo(() => {
    return getCursorStyle(isDrawing, isPanning, activeTool, isSpacePressed);
  }, [isDrawing, isPanning, activeTool, isSpacePressed]);

  // 4. Memoize selected shapes set for O(1) lookup
  const selectedShapesSet = useMemo(() => {
    return new Set(selectedShapes);
  }, [selectedShapes]);

  return (
    <>
    <div 
      ref={containerRef}
      style={{
        ...styles.canvasContainer,
        cursor: cursorStyle,
      }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth - 70} // Account for tool palette
        height={window.innerHeight - 131} // Account for title bar, menu bar, color palette, status bar
        draggable={activeTool === 'pan' || isSpacePressed} // Allow dragging in pan mode OR when Space is pressed
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
      >
        <Layer>
          {/* Background rectangle to show canvas bounds */}
          <Rect
            name="background"
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
            stroke="#000000"
            strokeWidth={1}
          />

          {/* Render all shapes from Firestore (sorted by zIndex) */}
          {!shapesLoading && (() => {
            perfStart('shapes-render');
            const shapesComponents = sortedShapes.map((shape) => {
            const lockStatus = getShapeLockStatus(shape, user, selectedShapeId);
            const isLockedByMe = lockStatus === 'locked-by-me';
            const isSelected = selectedShapeId === shape.id;
            const isMultiSelected = selectedShapesSet.has(shape.id);
            
            // Check if shape is selected by another user (selection locking)
            const selectionLockStatus = user 
              ? selectionService.isShapeLockedByOthers(shape.id, user.uid, userSelections)
              : { locked: false };
            
            const isSelectedByOther = selectionLockStatus.locked;
            
            // Log when a shape is selected by another user (only log occasionally to avoid spam)
            if (isSelectedByOther && Math.random() < 0.1) {
              console.log('🔒 Shape selected by another user:', {
                shapeId: shape.id,
                lockedBy: selectionLockStatus.username,
                userSelections,
              });
            }
            
            // A shape is locked by others if it's either:
            // 1. Locked via the old locking mechanism (lockedBy field)
            // 2. Selected by another user (new selection locking)
            const isLockedByOther = lockStatus === 'locked-by-other' || isSelectedByOther;

            // Get comment info from memoized map (O(1) lookup)
            const commentData = shapeCommentsMap.get(shape.id) || { count: 0, hasUnreadReplies: false };
            const commentCount = commentData.count;
            const hasUnreadReplies = commentData.hasUnreadReplies;

            return (
              <CanvasShape
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                isMultiSelected={isMultiSelected}
                isLockedByMe={isLockedByMe}
                isLockedByOther={isLockedByOther}
                isResizing={isResizing}
                isRotating={isRotating}
                activeTool={activeTool}
                previewDimensions={previewDimensions}
                previewFontSize={previewFontSize}
                previewRotation={previewRotation}
                hoveredHandle={hoveredHandle}
                hoveredRotationHandle={hoveredRotationHandle}
                stageScale={stageScale}
                commentCount={commentCount}
                hasUnreadReplies={hasUnreadReplies}
                onShapeMouseDown={handleShapeMouseDown}
                onResizeStart={handleResizeStart}
                onRotationStart={handleRotationStart}
                onDragStart={handleShapeDragStart}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                setHoveredHandle={setHoveredHandle}
                setHoveredRotationHandle={setHoveredRotationHandle}
                onCommentIndicatorClick={handleCommentIndicatorClick}
                onTextDoubleClick={handleEnterEdit}
                editingTextId={editingTextId}
                editingTextContent={editingTextContent}
                editingTextDimensions={editingTextDimensions}
              />
            );
          });
            const duration = perfEnd('shapes-render', { shapeCount: sortedShapes.length });
            
            // Emit event for live monitoring
            window.dispatchEvent(
              new CustomEvent('performance-operation', {
                detail: { operation: 'shapes-render', duration },
              })
            );
            
            return shapesComponents;
          })()}

          {/* Shape drawing previews */}
          <CanvasPreview
            previewRect={previewRect}
            previewCircle={previewCircle}
            previewTriangle={previewTriangle}
            previewPath={previewPath}
            activeTool={activeTool}
            selectedColor={selectedColor}
          />

          {/* Marquee selection rectangle */}
          {isMarqueeActive && marqueeStart && marqueeEnd && (
            <Rect
              x={Math.min(marqueeStart.x, marqueeEnd.x)}
              y={Math.min(marqueeStart.y, marqueeEnd.y)}
              width={Math.abs(marqueeEnd.x - marqueeStart.x)}
              height={Math.abs(marqueeEnd.y - marqueeStart.y)}
              stroke="blue"
              strokeWidth={2}
              dash={[10, 5]}
              fill="blue"
              opacity={0.2}
              listening={false}
            />
          )}

          {/* Tooltips for resizing and rotating */}
          <CanvasTooltips
            isResizing={isResizing}
            isRotating={isRotating}
            previewDimensions={previewDimensions}
            previewRotation={previewRotation}
            selectedShapeId={selectedShapeId}
            shapes={shapes}
            stageScale={stageScale}
          />

          {/* Explosion effect when bomb is placed */}
          {explosionPos && (
            <Group x={explosionPos.x} y={explosionPos.y}>
              <Text
                text="💥"
                fontSize={100}
                x={-50}
                y={-50}
                opacity={0.95}
                listening={false}
              />
            </Group>
          )}
        </Layer>
        
        {/* Cursor Layer - render other users' cursors */}
        <CursorLayer cursors={cursors} />
      </Stage>

      {/* Comment Panel */}
      {openCommentPanelShapeId && (() => {
        const shape = shapes.find(s => s.id === openCommentPanelShapeId);
        if (!shape) return null;

        const { screenX, screenY } = getShapeScreenPosition(shape);

        return (
          <CommentPanel
            shapeId={openCommentPanelShapeId}
            comments={comments}
            onClose={handleCommentPanelClose}
            position={{ x: screenX, y: screenY }}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onResolve={handleResolveComment}
            onDelete={handleDeleteComment}
            onDeleteReply={handleDeleteReply}
          />
        );
      })()}

      {/* Text Editor Overlay - for in-place text editing */}
      {editingTextId && (() => {
        const shape = shapes.find(s => s.id === editingTextId);
        if (!shape || shape.type !== 'text') return null;

        // Calculate position for the overlay
        const { screenX, screenY } = getShapeScreenPosition(shape);
        
        return (
          <TextEditorOverlay
            shapeId={editingTextId}
            initialText={shape.text || ''}
            position={{ x: screenX, y: screenY }}
            fontSize={shape.fontSize || 16}
            color={shape.color}
            onSave={handleSaveText}
            onTextChange={handleEditingTextChange}
            onDimensionsChange={handleEditingDimensionsChange}
          />
        );
      })()}

    </div>

    {/* Alignment Toolbar - shown when 2+ shapes selected and not minimized - OUTSIDE overflow:hidden container */}
    {selectedShapes.length >= 2 && !isAlignmentToolbarMinimized && (
      <AlignmentToolbar 
        selectedShapes={selectedShapes}
        onMinimize={() => setIsAlignmentToolbarMinimized(true)}
      />
    )}
    </>
  );
}

const styles = {
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
    // Checkerboard pattern for transparency (Paint-style)
    backgroundImage: 'linear-gradient(45deg, #c0c0c0 25%, transparent 25%), linear-gradient(-45deg, #c0c0c0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #c0c0c0 75%), linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#e0e0e0',
    position: 'relative' as const,
  },
};

