import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import CursorLayer from '../Collaboration/CursorLayer';
import toast from 'react-hot-toast';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  MIN_SHAPE_SIZE
} from '../../utils/constants';
import type Konva from 'konva';
import type { ShapeData } from '../../services/canvasService';

export default function Canvas() {
  const { user } = useAuth();
  const { 
    stageScale, 
    setStageScale, 
    stagePosition, 
    setStagePosition,
    selectedColor,
    isDrawMode,
    shapes,
    createShape,
    updateShape,
    lockShape,
    unlockShape,
    shapesLoading
  } = useCanvasContext();
  
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [previewRect, setPreviewRect] = useState<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number 
  } | null>(null);

  // Selection and locking state
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [lockTimeoutId, setLockTimeoutId] = useState<number | null>(null);
  
  // Cursor tracking
  const { cursors, handleMouseMove: handleCursorMove, handleMouseLeave } = useCursors(stageRef);

  // Auto-timeout unlock after 5s of inactivity
  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (lockTimeoutId) {
        clearTimeout(lockTimeoutId);
      }
    };
  }, [lockTimeoutId]);

  // Deselect and unlock when selected shape is deleted/changed externally
  useEffect(() => {
    if (selectedShapeId) {
      const shapeStillExists = shapes.find(s => s.id === selectedShapeId);
      if (!shapeStillExists) {
        handleDeselectShape();
      }
    }
  }, [shapes, selectedShapeId]);

  // Helper: Clear any existing lock timeout
  const clearLockTimeout = () => {
    if (lockTimeoutId) {
      clearTimeout(lockTimeoutId);
      setLockTimeoutId(null);
    }
  };

  // Helper: Start auto-unlock timeout (5s)
  const startLockTimeout = (shapeId: string) => {
    clearLockTimeout();
    const timeoutId = setTimeout(async () => {
      console.log('⏰ Auto-unlocking shape due to 5s timeout:', shapeId);
      await unlockShape(shapeId);
      setSelectedShapeId(null);
    }, 5000);
    setLockTimeoutId(timeoutId);
  };

  // Helper: Deselect shape and unlock
  const handleDeselectShape = async () => {
    if (selectedShapeId) {
      console.log('🔓 Deselecting and unlocking shape:', selectedShapeId);
      await unlockShape(selectedShapeId);
      setSelectedShapeId(null);
      clearLockTimeout();
    }
  };

  // Helper: Handle shape mousedown (optimistic selection + background lock)
  const handleShapeMouseDown = (shapeId: string) => {
    if (!user) return;

    // If clicking on already selected shape, refresh timeout
    if (selectedShapeId === shapeId) {
      clearLockTimeout();
      startLockTimeout(shapeId);
      return;
    }

    // Deselect current shape first
    if (selectedShapeId) {
      handleDeselectShape();
    }

    // OPTIMISTIC: Set as selected immediately (makes shape draggable right away)
    setSelectedShapeId(shapeId);
    startLockTimeout(shapeId);
    
    // Attempt to lock in background (non-blocking)
    // This is just for multi-user conflict detection, not required for drag to work
    lockShape(shapeId, user.uid).then(result => {
      if (!result.success) {
        // Lock failed - another user has it
        // Revert optimistic selection
        console.log('🔒 Lock failed, reverting selection');
        setSelectedShapeId(null);
        clearLockTimeout();
        
        const username = result.lockedByUsername || 'another user';
        toast.error(`Shape locked by ${username}`, {
          duration: 2000,
          position: 'top-center',
        });
      } else {
        console.log('✅ Successfully locked shape:', shapeId);
      }
    });
  };

  // Helper: Get lock status for a shape
  const getShapeLockStatus = (shape: ShapeData): 'locked-by-me' | 'locked-by-other' | 'unlocked' => {
    if (!user) return 'unlocked';
    
    if (shape.lockedBy === user.uid) {
      return 'locked-by-me';
    } else if (shape.lockedBy && shape.lockedAt) {
      // Check if lock is still valid (< 5s)
      const lockAge = Date.now() - shape.lockedAt.toMillis();
      if (lockAge < 5000) {
        return 'locked-by-other';
      }
    }
    
    return 'unlocked';
  };

  // Drawing handlers: Click-and-drag to create rectangles
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Check if we clicked on the background
    const clickedOnBackground = 
      e.target === stage || 
      e.target.getType() === 'Layer' ||
      e.target.name() === 'background' ||
      e.target.name() === 'grid';

    if (clickedOnBackground) {
      // Deselect any selected shape when clicking on background
      if (selectedShapeId) {
        handleDeselectShape();
      }

      // Only start drawing if in draw mode
      if (!isDrawMode) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      let x = (pointerPosition.x - stage.x()) / stage.scaleX();
      let y = (pointerPosition.y - stage.y()) / stage.scaleY();

      // Clamp starting position to canvas bounds
      x = Math.max(0, Math.min(CANVAS_WIDTH, x));
      y = Math.max(0, Math.min(CANVAS_HEIGHT, y));

      setIsDrawing(true);
      setDrawStart({ x, y });
      setPreviewRect(null);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Update cursor tracking
    handleCursorMove(e);

    // Handle drawing preview
    if (!isDrawing || !drawStart) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    let currentX = (pointerPosition.x - stage.x()) / stage.scaleX();
    let currentY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Clamp current position to canvas bounds
    currentX = Math.max(0, Math.min(CANVAS_WIDTH, currentX));
    currentY = Math.max(0, Math.min(CANVAS_HEIGHT, currentY));

    // Calculate preview rectangle dimensions (handle negative drags)
    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setPreviewRect({ x, y, width, height });
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !previewRect || !user) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
      return;
    }

    // Ignore tiny shapes (accidental clicks)
    if (previewRect.width < MIN_SHAPE_SIZE || previewRect.height < MIN_SHAPE_SIZE) {
      console.log('Shape too small, ignoring');
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
      return;
    }

    // Clamp shape to canvas bounds (ensure it doesn't extend outside)
    const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, previewRect.x));
    const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, previewRect.y));
    const clampedWidth = Math.min(previewRect.width, CANVAS_WIDTH - clampedX);
    const clampedHeight = Math.min(previewRect.height, CANVAS_HEIGHT - clampedY);

    // Double-check minimum size after clamping
    if (clampedWidth < MIN_SHAPE_SIZE || clampedHeight < MIN_SHAPE_SIZE) {
      console.log('Shape too small after clamping, ignoring');
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
      return;
    }

    // Create the shape via CanvasService
    try {
      await createShape({
        type: 'rectangle',
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
        color: selectedColor,
        createdBy: user.uid,
      });

      console.log('✅ Shape created successfully');
    } catch (error) {
      console.error('❌ Failed to create shape:', error);
    }

    // Clear drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
  };

  // Shape drag handlers
  const handleShapeDragStart = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    console.log('🎯 Shape drag started:', shapeId);
    // Refresh lock timeout when dragging starts
    clearLockTimeout();
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    // Refresh lock timeout during drag
    clearLockTimeout();
    
    // Optional: Could add real-time position updates here for smoother sync
    // But for MVP, we'll just update on drag end
  };

  const handleShapeDragEnd = async (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    console.log('🎯 Shape drag ended:', shapeId, 'New position:', newX, newY);

    // Update shape position in Firestore
    try {
      await updateShape(shapeId, { x: newX, y: newY });
      console.log('✅ Shape position updated in Firestore');
    } catch (error) {
      console.error('❌ Failed to update shape position:', error);
    }

    // Unlock the shape after drag
    await unlockShape(shapeId);
    setSelectedShapeId(null);
    clearLockTimeout();
  };

  // Handle mouse leaving canvas - reset drawing state to prevent stuck dragging
  const handleCanvasMouseLeave = () => {
    // Reset drawing state if user leaves canvas while drawing
    if (isDrawing) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
    }
    
    // Reset panning state
    setIsPanning(false);
    
    // Still call cursor tracking cleanup
    handleMouseLeave();
  };

  // Get cursor style based on current interaction mode
  const getCursorStyle = () => {
    if (isDrawing) return 'crosshair'; // Drawing a shape
    if (isPanning) return 'grabbing'; // Actively panning
    if (isDrawMode) return 'crosshair'; // Draw mode: ready to draw
    return 'grab'; // Pan mode: ready to pan
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

  return (
    <div 
      ref={containerRef}
      style={{
        ...styles.canvasContainer,
        cursor: getCursorStyle(),
      }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 130} // Account for navbar and toolbar
        draggable={!isDrawMode} // Only allow dragging in pan mode
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
            stroke="#e5e7eb"
            strokeWidth={2}
          />
          
          {/* Grid lines for visual reference */}
          {Array.from({ length: 11 }).map((_, i) => (
            <Rect
              key={`v-line-${i}`}
              name="grid"
              x={(CANVAS_WIDTH / 10) * i}
              y={0}
              width={1}
              height={CANVAS_HEIGHT}
              fill="#f3f4f6"
            />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <Rect
              key={`h-line-${i}`}
              name="grid"
              x={0}
              y={(CANVAS_HEIGHT / 10) * i}
              width={CANVAS_WIDTH}
              height={1}
              fill="#f3f4f6"
            />
          ))}

          {/* Render all shapes from Firestore */}
          {!shapesLoading && shapes.map((shape) => {
            const lockStatus = getShapeLockStatus(shape);
            const isLockedByMe = lockStatus === 'locked-by-me';
            const isLockedByOther = lockStatus === 'locked-by-other';
            const isSelected = selectedShapeId === shape.id;

            return (
              <Group 
                key={shape.id} 
                x={shape.x} 
                y={shape.y}
                draggable={!isLockedByOther}
                onMouseDown={() => handleShapeMouseDown(shape.id)}
                onTouchStart={() => handleShapeMouseDown(shape.id)}
                onDragStart={(e) => handleShapeDragStart(e, shape.id)}
                onDragMove={(e) => handleShapeDragMove(e)}
                onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
              >
                {/* Main shape */}
                <Rect
                  width={shape.width}
                  height={shape.height}
                  fill={shape.color}
                  opacity={isLockedByOther ? 0.5 : 1}
                  stroke={isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
                  strokeWidth={isLockedByMe || isLockedByOther ? 3 : 1}
                />

                {/* Lock icon for shapes locked by others */}
                {isLockedByOther && (
                  <Group x={shape.width / 2 - 15} y={shape.height / 2 - 15}>
                    {/* Lock icon background */}
                    <Rect
                      width={30}
                      height={30}
                      fill="rgba(239, 68, 68, 0.9)"
                      cornerRadius={4}
                    />
                    {/* Lock icon text (🔒) */}
                    <Text
                      text="🔒"
                      fontSize={20}
                      x={5}
                      y={3}
                      listening={false}
                    />
                  </Group>
                )}

                {/* Selected indicator for locked-by-me shapes */}
                {isSelected && isLockedByMe && (
                  <Group>
                    {/* Corner resize handles (visual only for MVP) */}
                    {[
                      { x: -4, y: -4 },
                      { x: shape.width - 4, y: -4 },
                      { x: -4, y: shape.height - 4 },
                      { x: shape.width - 4, y: shape.height - 4 },
                    ].map((pos, i) => (
                      <Rect
                        key={i}
                        x={pos.x}
                        y={pos.y}
                        width={8}
                        height={8}
                        fill="#10b981"
                        listening={false}
                      />
                    ))}
                  </Group>
                )}
              </Group>
            );
          })}

          {/* Preview rectangle while drawing */}
          {previewRect && (
            <Rect
              x={previewRect.x}
              y={previewRect.y}
              width={previewRect.width}
              height={previewRect.height}
              fill={selectedColor}
              opacity={0.5}
              stroke={selectedColor}
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
          )}
        </Layer>
        
        {/* Cursor Layer - render other users' cursors */}
        <CursorLayer cursors={cursors} />
      </Stage>
      
      {/* Canvas info overlay */}
      <div style={styles.canvasInfo}>
        <div style={styles.infoText}>
          Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
        </div>
        <div style={styles.infoText}>
          Zoom: {(stageScale * 100).toFixed(0)}%
        </div>
        <div style={styles.infoText}>
          Position: ({Math.round(stagePosition.x)}, {Math.round(stagePosition.y)})
        </div>
      </div>
    </div>
  );
}

const styles = {
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    position: 'relative' as const,
  },
  canvasInfo: {
    position: 'absolute' as const,
    bottom: '1rem',
    left: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  infoText: {
    fontFamily: 'monospace',
  },
};

