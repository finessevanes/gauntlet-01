import { useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM 
} from '../../utils/constants';
import type Konva from 'konva';

export default function Canvas() {
  const { 
    stageScale, 
    setStageScale, 
    stagePosition, 
    setStagePosition 
  } = useCanvasContext();
  
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle drag end to update position
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <div 
      ref={containerRef}
      style={styles.canvasContainer}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 130} // Account for navbar and toolbar
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
      >
        <Layer>
          {/* Background rectangle to show canvas bounds */}
          <Rect
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
              x={0}
              y={(CANVAS_HEIGHT / 10) * i}
              width={CANVAS_WIDTH}
              height={1}
              fill="#f3f4f6"
            />
          ))}
        </Layer>
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

