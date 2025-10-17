import { Group, Rect, Circle, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { ShapeData } from '../../services/canvasService';
import { getFontStyle } from '../../utils/helpers';

interface CanvasShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isMultiSelected: boolean;
  isLockedByMe: boolean;
  isLockedByOther: boolean;
  isResizing: boolean;
  isRotating: boolean;
  activeTool: string;
  previewDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  previewFontSize: number | null;
  previewRotation: number | null;
  hoveredHandle: string | null;
  hoveredRotationHandle: string | null;
  stageScale: number;
  editingTextId: string | null;
  commentCount: number;
  hasUnreadReplies: boolean;
  onShapeMouseDown: (id: string, event?: MouseEvent | React.MouseEvent) => void;
  onTextDoubleClick: (id: string) => void;
  onResizeStart: (e: Konva.KonvaEventObject<MouseEvent>, handle: string, shape: ShapeData) => void;
  onRotationStart: (e: Konva.KonvaEventObject<MouseEvent>, shape: ShapeData) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => void;
  setHoveredHandle: (id: string | null) => void;
  setHoveredRotationHandle: (id: string | null) => void;
  onCommentIndicatorClick: (shapeId: string) => void;
}

export default function CanvasShape({
  shape,
  isSelected,
  isMultiSelected,
  isLockedByMe,
  isLockedByOther,
  isResizing,
  isRotating,
  activeTool,
  previewDimensions,
  previewFontSize,
  previewRotation,
  hoveredHandle,
  hoveredRotationHandle,
  stageScale,
  editingTextId,
  commentCount,
  hasUnreadReplies,
  onShapeMouseDown,
  onTextDoubleClick,
  onResizeStart,
  onRotationStart,
  onDragStart,
  onDragMove,
  onDragEnd,
  setHoveredHandle,
  setHoveredRotationHandle,
  onCommentIndicatorClick,
}: CanvasShapeProps) {
  // Shape is being resized if isResizing is true OR if preview dimensions exist (during transition)
  // For text, we don't use preview dimensions (dimensions are always calculated from fontSize)
  const isBeingResized = shape.type !== 'text' && ((isResizing && isSelected) || (previewDimensions !== null && isSelected));
  const isBeingRotated = isRotating && isSelected;
  
  // Use preview rotation if currently rotating this shape, otherwise use stored rotation
  const currentRotation = isBeingRotated && previewRotation !== null 
    ? previewRotation 
    : (shape.rotation || 0);
  
  // Calculate current dimensions/position based on shape type
  let currentX: number = shape.x;
  let currentY: number = shape.y;
  let currentWidth: number | undefined;
  let currentHeight: number | undefined;
  let currentRadius: number | undefined;
  
  if (shape.type === 'rectangle' || shape.type === 'triangle') {
    currentX = isBeingResized && previewDimensions ? previewDimensions.x : shape.x;
    currentY = isBeingResized && previewDimensions ? previewDimensions.y : shape.y;
    currentWidth = isBeingResized && previewDimensions ? previewDimensions.width : shape.width;
    currentHeight = isBeingResized && previewDimensions ? previewDimensions.height : shape.height;
  } else if (shape.type === 'circle') {
    currentX = isBeingResized && previewDimensions ? previewDimensions.x : shape.x;
    currentY = isBeingResized && previewDimensions ? previewDimensions.y : shape.y;
    currentRadius = isBeingResized && previewDimensions ? previewDimensions.width / 2 : shape.radius;
  } else if (shape.type === 'text') {
    // ALWAYS calculate text dimensions dynamically from fontSize and content
    // Use previewFontSize during resize AND during transition (until Firestore updates)
    const textContent = shape.text || '';
    const textFontSize = (isSelected && previewFontSize) ? previewFontSize : (shape.fontSize || 16);
    const estimatedWidth = textContent.length * textFontSize * 0.6;
    const estimatedHeight = textFontSize * 1.2;
    const padding = 4;
    
    currentX = shape.x;
    currentY = shape.y;
    currentWidth = estimatedWidth + padding * 2;
    currentHeight = estimatedHeight + padding * 2;
    
    // If resizing or transitioning, use preview position if available
    if (isSelected && previewDimensions) {
      currentX = previewDimensions.x;
      currentY = previewDimensions.y;
    }
  }

  // Calculate Group position and offset based on shape type
  let groupX: number, groupY: number, offsetX: number, offsetY: number;
  if (shape.type === 'circle') {
    groupX = currentX;
    groupY = currentY;
    offsetX = 0;
    offsetY = 0;
  } else if (currentWidth !== undefined && currentHeight !== undefined) {
    groupX = currentX + currentWidth / 2;
    groupY = currentY + currentHeight / 2;
    offsetX = currentWidth / 2;
    offsetY = currentHeight / 2;
  } else {
    groupX = currentX;
    groupY = currentY;
    offsetX = 0;
    offsetY = 0;
  }

  return (
    <Group 
      key={shape.id}
      id={shape.id}
      name="shape"
      x={groupX} 
      y={groupY}
      offsetX={offsetX}
      offsetY={offsetY}
      rotation={currentRotation}
      draggable={activeTool === 'select' && !isLockedByOther && !isResizing && !isRotating && (isSelected || isMultiSelected)}
      onMouseDown={activeTool === 'select' ? (e) => onShapeMouseDown(shape.id, e.evt) : undefined}
      onTouchStart={activeTool === 'select' ? () => onShapeMouseDown(shape.id) : undefined}
      onDragStart={(e) => onDragStart(e, shape.id)}
      onDragMove={(e) => onDragMove(e, shape.id)}
      onDragEnd={(e) => onDragEnd(e, shape.id)}
    >
      {/* Main shape - render based on type */}
      {shape.type === 'rectangle' && currentWidth !== undefined && currentHeight !== undefined && (
        <Rect
          width={currentWidth}
          height={currentHeight}
          fill={shape.color}
          opacity={isLockedByOther ? 0.5 : 1}
          stroke={isMultiSelected ? '#60a5fa' : isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
          strokeWidth={isMultiSelected ? 4 : isLockedByMe || isLockedByOther ? 3 : 1}
          shadowColor={isMultiSelected ? '#60a5fa' : undefined}
          shadowBlur={isMultiSelected ? 10 : 0}
          shadowOpacity={isMultiSelected ? 0.6 : 0}
          onMouseEnter={() => {
            if (activeTool === 'select' && !isLockedByOther) {
              document.body.style.cursor = 'move';
            }
          }}
          onMouseLeave={() => {
            document.body.style.cursor = '';
          }}
        />
      )}
      {shape.type === 'circle' && currentRadius !== undefined && (
        <Circle
          x={0}
          y={0}
          radius={currentRadius}
          fill={shape.color}
          opacity={isLockedByOther ? 0.5 : 1}
          stroke={isMultiSelected ? '#60a5fa' : isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
          strokeWidth={isMultiSelected ? 4 : isLockedByMe || isLockedByOther ? 3 : 1}
          shadowColor={isMultiSelected ? '#60a5fa' : undefined}
          shadowBlur={isMultiSelected ? 10 : 0}
          shadowOpacity={isMultiSelected ? 0.6 : 0}
          onMouseEnter={() => {
            if (activeTool === 'select' && !isLockedByOther) {
              document.body.style.cursor = 'move';
            }
          }}
          onMouseLeave={() => {
            document.body.style.cursor = '';
          }}
        />
      )}
      {shape.type === 'triangle' && currentWidth !== undefined && currentHeight !== undefined && (
        <Line
          points={[
            currentWidth / 2, 0,              // Top vertex (centered at top of bounding box)
            0, currentHeight,                  // Bottom-left vertex
            currentWidth, currentHeight,       // Bottom-right vertex
          ]}
          closed={true}
          fill={shape.color}
          opacity={isLockedByOther ? 0.5 : 1}
          stroke={isMultiSelected ? '#60a5fa' : isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
          strokeWidth={isMultiSelected ? 4 : isLockedByMe || isLockedByOther ? 3 : 1}
          shadowColor={isMultiSelected ? '#60a5fa' : undefined}
          shadowBlur={isMultiSelected ? 10 : 0}
          shadowOpacity={isMultiSelected ? 0.6 : 0}
          onMouseEnter={() => {
            if (activeTool === 'select' && !isLockedByOther) {
              document.body.style.cursor = 'move';
            }
          }}
          onMouseLeave={() => {
            document.body.style.cursor = '';
          }}
        />
      )}
      {shape.type === 'text' && currentWidth !== undefined && currentHeight !== undefined && (() => {
        const textContent = shape.text || '';
        // Use previewFontSize during resize AND during transition (until Firestore updates)
        const textFontSize = (isSelected && previewFontSize) ? previewFontSize : (shape.fontSize || 16);
        const padding = 4;
        
        return (
          <>
            {/* Invisible hitbox to make the entire text area draggable - disabled when editing */}
            <Rect
              x={0}
              y={0}
              width={currentWidth}
              height={currentHeight}
              fill="transparent"
              listening={editingTextId !== shape.id}
              onMouseEnter={() => {
                if (activeTool === 'select' && !isLockedByOther) {
                  document.body.style.cursor = 'move';
                }
              }}
              onMouseLeave={() => {
                document.body.style.cursor = '';
              }}
              onDblClick={(e) => {
                e.cancelBubble = true;
                if (activeTool === 'select' || activeTool === 'pan') {
                  onTextDoubleClick(shape.id);
                }
              }}
            />
            
            {/* Selection box with dotted border (Paint-style) - show when selected but NOT when editing */}
            {isSelected && editingTextId !== shape.id && (
              <Rect
                x={0}
                y={0}
                width={currentWidth}
                height={currentHeight}
                stroke={isLockedByMe ? '#000000' : '#ff0000'}
                strokeWidth={1}
                dash={[4, 4]}
                fill="transparent"
                listening={false}
              />
            )}
            
            {/* Blue border for multi-selected text */}
            {isMultiSelected && editingTextId !== shape.id && (
              <Rect
                x={0}
                y={0}
                width={currentWidth}
                height={currentHeight}
                stroke="#60a5fa"
                strokeWidth={4}
                shadowColor="#60a5fa"
                shadowBlur={10}
                shadowOpacity={0.6}
                fill="transparent"
                listening={false}
              />
            )}
            
            {/* The actual text - hide when editing to avoid showing duplicate */}
            {editingTextId !== shape.id && (
              <Text
                x={padding}
                y={padding}
                text={textContent}
                fontSize={textFontSize}
                fill={shape.color}
                fontStyle={getFontStyle(shape)}
                fontWeight={shape.fontWeight || 'normal'}
                textDecoration={shape.textDecoration || 'none'}
                align="left"
                verticalAlign="top"
                opacity={isLockedByOther ? 0.5 : 1}
                listening={false}
              />
            )}
          </>
        );
      })()}

      {/* Lock icon for shapes locked by others */}
      {isLockedByOther && currentWidth !== undefined && currentHeight !== undefined && (
        <Group x={currentWidth / 2 - 15} y={currentHeight / 2 - 15}>
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
      {/* Lock icon for circles locked by others */}
      {isLockedByOther && shape.type === 'circle' && (
        <Group x={-15} y={-15}>
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

      {/* Resize handles for rectangles, triangles, and text (8 total: 4 corners + 4 edges) */}
      {isSelected && isLockedByMe && !isResizing && !isRotating && (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') && currentWidth !== undefined && currentHeight !== undefined && (
        <Group>
          {(() => {
            // Scale handles inversely with zoom so they appear constant size on screen
            const baseSize = 16; // Base size in pixels
            const hoverSize = 20; // Hover size in pixels
            const scaledBaseSize = baseSize / stageScale;
            const scaledHoverSize = hoverSize / stageScale;
            const halfBase = scaledBaseSize / 2;
            
            return [
              { x: -halfBase, y: -halfBase, cursor: 'nwse-resize', type: 'corner', name: 'tl' },
              { x: currentWidth / 2 - halfBase, y: -halfBase, cursor: 'ns-resize', type: 'edge', name: 't' },
              { x: currentWidth - halfBase, y: -halfBase, cursor: 'nesw-resize', type: 'corner', name: 'tr' },
              { x: -halfBase, y: currentHeight / 2 - halfBase, cursor: 'ew-resize', type: 'edge', name: 'l' },
              { x: currentWidth - halfBase, y: currentHeight / 2 - halfBase, cursor: 'ew-resize', type: 'edge', name: 'r' },
              { x: -halfBase, y: currentHeight - halfBase, cursor: 'nesw-resize', type: 'corner', name: 'bl' },
              { x: currentWidth / 2 - halfBase, y: currentHeight - halfBase, cursor: 'ns-resize', type: 'edge', name: 'b' },
              { x: currentWidth - halfBase, y: currentHeight - halfBase, cursor: 'nwse-resize', type: 'corner', name: 'br' },
            ].map((handle) => {
              const handleKey = `${shape.id}-${handle.name}`;
              const isHovered = hoveredHandle === handleKey;
              const handleSize = isHovered ? scaledHoverSize : scaledBaseSize;
              const offset = isHovered ? (scaledHoverSize - scaledBaseSize) / 2 : 0;
              
              return (
                <Rect
                  key={handleKey}
                  x={handle.x - offset}
                  y={handle.y - offset}
                  width={handleSize}
                  height={handleSize}
                  fill={isHovered ? '#3b82f6' : '#ffffff'}
                  stroke="#999999"
                  strokeWidth={1 / stageScale}
                  onMouseEnter={() => setHoveredHandle(handleKey)}
                  onMouseLeave={() => setHoveredHandle(null)}
                  onMouseDown={(e) => {
                    // All handles functional: corners (proportional) and edges (single dimension)
                    onResizeStart(e, handle.name, shape);
                  }}
                />
              );
            });
          })()}
        </Group>
      )}

      {/* Resize handles for circles (4 total: N, S, E, W) - all adjust radius */}
      {isSelected && isLockedByMe && !isResizing && shape.type === 'circle' && currentRadius !== undefined && (
        <Group>
          {(() => {
            // Scale handles inversely with zoom so they appear constant size on screen
            const baseSize = 16;
            const hoverSize = 20;
            const scaledBaseSize = baseSize / stageScale;
            const scaledHoverSize = hoverSize / stageScale;
            const halfBase = scaledBaseSize / 2;
            
            return [
              { x: -halfBase, y: -currentRadius - halfBase, cursor: 'ns-resize', name: 'n' },
              { x: -halfBase, y: currentRadius - halfBase, cursor: 'ns-resize', name: 's' },
              { x: -currentRadius - halfBase, y: -halfBase, cursor: 'ew-resize', name: 'w' },
              { x: currentRadius - halfBase, y: -halfBase, cursor: 'ew-resize', name: 'e' },
            ].map((handle) => {
              const handleKey = `${shape.id}-${handle.name}`;
              const isHovered = hoveredHandle === handleKey;
              const handleSize = isHovered ? scaledHoverSize : scaledBaseSize;
              const offset = isHovered ? (scaledHoverSize - scaledBaseSize) / 2 : 0;
              
              return (
                <Rect
                  key={handleKey}
                  x={handle.x - offset}
                  y={handle.y - offset}
                  width={handleSize}
                  height={handleSize}
                  fill={isHovered ? '#3b82f6' : '#ffffff'}
                  stroke="#999999"
                  strokeWidth={1 / stageScale}
                  onMouseEnter={() => setHoveredHandle(handleKey)}
                  onMouseLeave={() => setHoveredHandle(null)}
                  onMouseDown={(e) => {
                    // All circle handles adjust radius proportionally
                    onResizeStart(e, handle.name, shape);
                  }}
                />
              );
            });
          })()}
        </Group>
      )}

      {/* Rotation handle - appears 50px above the top of the shape when locked */}
      {isSelected && isLockedByMe && !isResizing && !isRotating && (() => {
        // Calculate shape center and rotation handle position based on type
        let centerX: number;
        let centerY: number;
        let handleY: number;
        const handleDistance = 50;
        
        if (shape.type === 'circle' && currentRadius !== undefined) {
          centerX = 0;
          centerY = 0;
          handleY = -currentRadius - handleDistance;
        } else if ((shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') && currentWidth !== undefined && currentHeight !== undefined) {
          centerX = currentWidth / 2;
          centerY = currentHeight / 2;
          handleY = -handleDistance;
        } else {
          return null;
        }
        
        const handleX = centerX;
        
        // Scale handle size inversely with zoom
        const handleSize = 12 / stageScale; // 12px diameter
        const handleRadius = handleSize / 2;
        
        const rotationHandleKey = `${shape.id}-rotation`;
        const isHovered = hoveredRotationHandle === rotationHandleKey;
        
        return (
          <Group>
            {/* Connecting line from handle to shape center (dashed gray line) */}
            <Line
              points={[handleX, handleY + handleRadius, centerX, centerY]}
              stroke="#999999"
              strokeWidth={1 / stageScale}
              dash={[4 / stageScale, 4 / stageScale]}
              opacity={0.7}
              listening={false}
            />
            
            {/* Rotation handle circle */}
            <Circle
              x={handleX}
              y={handleY}
              radius={handleRadius}
              fill={isHovered ? '#3b82f6' : '#ffffff'}
              stroke="#999999"
              strokeWidth={2 / stageScale}
              onMouseEnter={() => setHoveredRotationHandle(rotationHandleKey)}
              onMouseLeave={() => setHoveredRotationHandle(null)}
              onMouseDown={(e) => {
                onRotationStart(e, shape);
              }}
            />
            
            {/* Rotation icon (↻) inside the circle */}
            <Text
              x={handleX - handleRadius}
              y={handleY - handleRadius}
              width={handleSize}
              height={handleSize}
              text="↻"
              fontSize={handleSize * 0.8}
              fill={isHovered ? '#ffffff' : '#666666'}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </Group>
        );
      })()}

      {/* Comment indicator badge - positioned to the right of the shape */}
      {commentCount > 0 && (() => {
        // Calculate badge position based on shape type
        let badgeX: number;
        let badgeY: number;
        const scale = 1 / stageScale; // Scale inversely with zoom
        
        // Larger sizing to match visual prominence of original HTML badge
        const horizontalPadding = 8 * scale;
        const verticalPadding = 4 * scale;
        const gap = 4 * scale; // gap between icon and count
        const iconSize = 18 * scale;
        const fontSize = 14 * scale;
        const notificationSize = 10 * scale;
        const borderWidth = 2 * scale;
        
        // Calculate badge dimensions based on content
        const countText = commentCount.toString();
        const countWidth = countText.length * fontSize * 0.6; // Better char width estimate
        const badgeWidth = horizontalPadding * 2 + iconSize + gap + countWidth;
        const badgeHeight = verticalPadding * 2 + Math.max(iconSize, fontSize);
        
        if (shape.type === 'circle' && currentRadius !== undefined) {
          // Position touching the top-right of the circle
          badgeX = currentRadius;
          badgeY = -currentRadius;
        } else if (currentWidth !== undefined && currentHeight !== undefined) {
          // Position touching the top-right of the rectangle/triangle/text
          badgeX = currentWidth;
          badgeY = 0;
        } else {
          return null;
        }
        
        return (
          <Group
            x={badgeX}
            y={badgeY}
            onMouseDown={(e) => {
              e.cancelBubble = true;
              onCommentIndicatorClick(shape.id);
            }}
          >
            {/* Gray background (Windows 95 style) */}
            <Rect
              x={0}
              y={0}
              width={badgeWidth}
              height={badgeHeight}
              fill="#c0c0c0"
              cornerRadius={3 * scale}
              shadowColor="#000000"
              shadowBlur={0}
              shadowOffset={{ x: 1 * scale, y: 1 * scale }}
              shadowOpacity={0.2}
            />
            
            {/* Top-left highlight (beveled border - light) */}
            <Line
              points={[
                3 * scale, badgeHeight,
                3 * scale, 3 * scale,
                badgeWidth - 3 * scale, 3 * scale
              ]}
              stroke="#ffffff"
              strokeWidth={borderWidth}
              listening={false}
              lineCap="square"
              lineJoin="miter"
            />
            
            {/* Bottom-right shadow (beveled border - dark) */}
            <Line
              points={[
                badgeWidth, 3 * scale,
                badgeWidth, badgeHeight,
                3 * scale, badgeHeight
              ]}
              stroke="#808080"
              strokeWidth={borderWidth}
              listening={false}
              lineCap="square"
              lineJoin="miter"
            />
            
            {/* Comment icon emoji */}
            <Text
              x={horizontalPadding}
              y={verticalPadding}
              text="💬"
              fontSize={iconSize}
              listening={false}
            />
            
            {/* Comment count in navy blue */}
            <Text
              x={horizontalPadding + iconSize + gap}
              y={verticalPadding + (iconSize - fontSize) / 2}
              text={countText}
              fontSize={fontSize}
              fontStyle="bold"
              fill="#000080"
              fontFamily="Arial, sans-serif"
              listening={false}
            />
            
            {/* Unread replies notification badge (red dot) */}
            {hasUnreadReplies && (
              <Circle
                x={badgeWidth - 4 * scale}
                y={4 * scale}
                radius={notificationSize / 2}
                fill="#ff0000"
                stroke="#ffffff"
                strokeWidth={1 * scale}
                listening={false}
              />
            )}
          </Group>
        );
      })()}
    </Group>
  );
}

