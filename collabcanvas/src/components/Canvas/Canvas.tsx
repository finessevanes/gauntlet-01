import { useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import CursorLayer from '../Collaboration/CursorLayer';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  MIN_SHAPE_SIZE
} from '../../utils/constants';
import type Konva from 'konva';

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
  
  // Cursor tracking
  const { cursors, handleMouseMove: handleCursorMove, handleMouseLeave } = useCursors(stageRef);

  // Drawing handlers: Click-and-drag to create rectangles
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow drawing if in draw mode
    if (!isDrawMode) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Only start drawing if clicking on the background (not on a shape)
    // Check if we clicked on the Stage, Layer, or background rect (has name 'background')
    const clickedOnBackground = 
      e.target === stage || 
      e.target.getType() === 'Layer' ||
      e.target.name() === 'background' ||
      e.target.name() === 'grid';

    if (!clickedOnBackground) return;

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
          {!shapesLoading && shapes.map((shape) => (
            <Rect
              key={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.color}
              stroke="#000000"
              strokeWidth={1}
            />
          ))}

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

