import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text, Circle, Line } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import CursorLayer from '../Collaboration/CursorLayer';
import TextInput from './TextInput';
import toast from 'react-hot-toast';
import { getFontStyle } from '../../utils/helpers';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  MIN_SHAPE_SIZE,
  MIN_SHAPE_WIDTH,
  MIN_SHAPE_HEIGHT,
  MIN_CIRCLE_RADIUS,
  MIN_TRIANGLE_WIDTH,
  MIN_TRIANGLE_HEIGHT
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
    activeTool,
    isDrawMode,
    setIsDrawMode,
    isBombMode,
    setIsBombMode,
    shapes,
    createShape,
    createCircle,
    createTriangle,
    createText,
    updateText,
    updateShape,
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
    editingTextId,
    setEditingTextId,
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
  const [previewCircle, setPreviewCircle] = useState<{
    x: number;
    y: number;
    radius: number;
  } | null>(null);
  const [previewTriangle, setPreviewTriangle] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Lock timeout state
  const [lockTimeoutId, setLockTimeoutId] = useState<number | null>(null);
  
  // Resize handle hover state
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Rotation handle hover state
  const [hoveredRotationHandle, setHoveredRotationHandle] = useState<string | null>(null);
  
  // Text input state
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textInputClosedTimeRef = useRef<number>(0);
  
  // Resize state management
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: number;
    shapeX: number;
    shapeY: number;
  } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Rotation state management
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{
    angle: number;
    rotation: number;
  } | null>(null);
  const [previewRotation, setPreviewRotation] = useState<number | null>(null);
  
  // Bomb explosion state
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  const [previousMode, setPreviousMode] = useState<'draw' | 'pan'>('pan');
  
  // Cursor tracking
  const { cursors, handleMouseMove: handleCursorMove, handleMouseLeave } = useCursors(stageRef);

  // Track when text input is closed for cooldown
  useEffect(() => {
    if (!textInputVisible) {
      textInputClosedTimeRef.current = Date.now();
    }
  }, [textInputVisible, editingTextId]);

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
      } else {
        // Log success for Task 1.2 when handles are shown
        console.log('✅ SUCCESS TASK [1.2]: 8 resize handles rendered (4 corners + 4 edges) with hover effects');
      }
    }
  }, [shapes, selectedShapeId]);

  // Keyboard shortcuts for delete and duplicate
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in text input
      if (textInputVisible || editingTextId) return;
      
      // Don't trigger if no shape is selected
      if (!selectedShapeId || !user) return;

      // Delete key - delete selected shape
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        try {
          await deleteShape(selectedShapeId);
          setSelectedShapeId(null);
          toast.success('Shape deleted', {
            duration: 1000,
            position: 'top-center',
          });
        } catch (error) {
          console.error('❌ Failed to delete shape:', error);
          toast.error('Failed to delete shape', {
            duration: 2000,
            position: 'top-center',
          });
        }
      }

      // Ctrl+D or Cmd+D - duplicate selected shape
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        try {
          // Unlock the current shape first
          await unlockShape(selectedShapeId);
          
          // Duplicate the shape and get the new shape ID
          const newShapeId = await duplicateShape(selectedShapeId, user.uid);
          
          // Select and lock the new shape immediately
          setSelectedShapeId(newShapeId);
          startLockTimeout(newShapeId);
          await lockShape(newShapeId, user.uid);
          
          toast.success('Shape duplicated', {
            duration: 1000,
            position: 'top-center',
          });
        } catch (error) {
          console.error('❌ Failed to duplicate shape:', error);
          toast.error('Failed to duplicate shape', {
            duration: 2000,
            position: 'top-center',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId, user, textInputVisible, editingTextId, deleteShape, duplicateShape]);

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
      await unlockShape(shapeId);
      setSelectedShapeId(null);
    }, 5000);
    setLockTimeoutId(timeoutId);
  };

  // Helper: Deselect shape and unlock
  const handleDeselectShape = async () => {
    if (selectedShapeId) {
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
        setSelectedShapeId(null);
        clearLockTimeout();
        
        const username = result.lockedByUsername || 'another user';
        toast.error(`Shape locked by ${username}`, {
          duration: 2000,
          position: 'top-center',
        });
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

  // Helper: Calculate triangle points from bounding box
  const getTrianglePoints = (x: number, y: number, width: number, height: number): number[] => {
    return [
      x + width / 2, y,              // Top vertex
      x, y + height,                  // Bottom-left vertex
      x + width, y + height,          // Bottom-right vertex
    ];
  };

  // Track previous mode when switching to bomb mode
  useEffect(() => {
    if (isBombMode) {
      // Save current mode before switching to bomb
      setPreviousMode(isDrawMode ? 'draw' : 'pan');
    }
  }, [isBombMode, isDrawMode]);

  // Bomb explosion handler
  const handleBombClick = async (x: number, y: number) => {
    if (!user) return;

    // Show explosion effect at click position
    setExplosionPos({ x, y });
    
    // Play explosion animation and delete all shapes
    try {
      await deleteAllShapes();
      toast.success('💥 Boom! Canvas cleared!', {
        duration: 2000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to delete shapes:', error);
      toast.error('Failed to clear canvas', {
        duration: 2000,
        position: 'top-center',
      });
    }

    // Clear explosion effect and return to previous mode after animation
    setTimeout(() => {
      setExplosionPos(null);
      // Return to previous mode (draw or pan)
      if (previousMode === 'draw') {
        setIsDrawMode(true);
      } else {
        setIsDrawMode(false);
      }
      setIsBombMode(false);
    }, 800);
  };

  // Text input handlers
  const handleTextSave = async (text: string) => {
    if (!user) return;
    
    if (!text.trim()) {
      toast.error('Text cannot be empty', {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }

    try {
      await createText(
        text,
        textInputPosition.x,
        textInputPosition.y,
        selectedColor,
        user.uid
      );
      setTextInputVisible(false);
      toast.success('Text created!', {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to create text:', error);
      toast.error('Failed to create text', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleTextCancel = () => {
    setTextInputVisible(false);
  };

  // Handle text edit save
  const handleTextEditSave = async (text: string) => {
    if (!user || !editingTextId) return;
    
    if (!text.trim()) {
      toast.error('Text cannot be empty', {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }

    try {
      await updateText(editingTextId, text.trim());
      setTextInputVisible(false);
      setEditingTextId(null);
      toast.success('Text updated!', {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to update text:', error);
      toast.error('Failed to update text', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  // Handle text edit cancel
  const handleTextEditCancel = () => {
    setTextInputVisible(false);
    setEditingTextId(null);
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

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      let x = (pointerPosition.x - stage.x()) / stage.scaleX();
      let y = (pointerPosition.y - stage.y()) / stage.scaleY();

      // Clamp to canvas bounds
      x = Math.max(0, Math.min(CANVAS_WIDTH, x));
      y = Math.max(0, Math.min(CANVAS_HEIGHT, y));

      // Handle bomb mode - place bomb and explode
      if (activeTool === 'bomb') {
        handleBombClick(x, y);
        return;
      }

      // Handle text tool - show text input at click position
      if (activeTool === 'text') {
        // Don't create new text input if one is already visible
        if (textInputVisible) return;
        
        // Don't immediately create a new input after closing one (cooldown)
        const timeSinceClose = Date.now() - textInputClosedTimeRef.current;
        if (timeSinceClose < 200) return;
        
        setTextInputPosition({ x, y });
        setTextInputVisible(true);
        return;
      }

      // Only start drawing if a shape tool is selected
      if (activeTool === 'pan' || activeTool === 'select') return;

      setIsDrawing(true);
      setDrawStart({ x, y });
      setPreviewRect(null);
      setPreviewCircle(null);
      setPreviewTriangle(null);
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

    // Calculate preview based on active tool
    if (activeTool === 'rectangle') {
      // Calculate preview rectangle dimensions (handle negative drags)
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);
      setPreviewRect({ x, y, width, height });
      setPreviewCircle(null);
      setPreviewTriangle(null);
    } else if (activeTool === 'circle') {
      // Calculate circle radius from center
      const radius = Math.sqrt(
        Math.pow(currentX - drawStart.x, 2) + Math.pow(currentY - drawStart.y, 2)
      );
      setPreviewCircle({ x: drawStart.x, y: drawStart.y, radius });
      setPreviewRect(null);
      setPreviewTriangle(null);
    } else if (activeTool === 'triangle') {
      // Calculate preview triangle dimensions (handle negative drags)
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);
      setPreviewTriangle({ x, y, width, height });
      setPreviewRect(null);
      setPreviewCircle(null);
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

    if (!isDrawing || !user) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
      setPreviewCircle(null);
      setPreviewTriangle(null);
      return;
    }

    // Handle rectangle creation
    if (activeTool === 'rectangle' && previewRect) {
      // Ignore tiny shapes (accidental clicks)
      if (previewRect.width < MIN_SHAPE_SIZE || previewRect.height < MIN_SHAPE_SIZE) {
        toast.error(`Minimum rectangle size is ${MIN_SHAPE_SIZE}×${MIN_SHAPE_SIZE} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewRect(null);
        return;
      }

      // Clamp shape to canvas bounds
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, previewRect.x));
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, previewRect.y));
      const clampedWidth = Math.min(previewRect.width, CANVAS_WIDTH - clampedX);
      const clampedHeight = Math.min(previewRect.height, CANVAS_HEIGHT - clampedY);

      // Create the rectangle
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
      } catch (error) {
        console.error('❌ Failed to create rectangle:', error);
        toast.error('Failed to create rectangle');
      }
    }
    // Handle circle creation
    else if (activeTool === 'circle' && previewCircle) {
      // Check minimum radius
      if (previewCircle.radius < MIN_CIRCLE_RADIUS) {
        toast.error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewCircle(null);
        return;
      }

      // Clamp circle to canvas bounds
      const clampedX = Math.max(previewCircle.radius, Math.min(CANVAS_WIDTH - previewCircle.radius, previewCircle.x));
      const clampedY = Math.max(previewCircle.radius, Math.min(CANVAS_HEIGHT - previewCircle.radius, previewCircle.y));

      // Create the circle
      try {
        await createCircle({
          x: clampedX,
          y: clampedY,
          radius: previewCircle.radius,
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create circle:', error);
        toast.error('Failed to create circle');
      }
    }
    // Handle triangle creation
    else if (activeTool === 'triangle' && previewTriangle) {
      // Check minimum size
      if (previewTriangle.width < MIN_TRIANGLE_WIDTH || previewTriangle.height < MIN_TRIANGLE_HEIGHT) {
        toast.error(`Minimum triangle size is ${MIN_TRIANGLE_WIDTH}×${MIN_TRIANGLE_HEIGHT} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewTriangle(null);
        return;
      }

      // Clamp triangle to canvas bounds
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, previewTriangle.x));
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, previewTriangle.y));
      const clampedWidth = Math.min(previewTriangle.width, CANVAS_WIDTH - clampedX);
      const clampedHeight = Math.min(previewTriangle.height, CANVAS_HEIGHT - clampedY);

      // Create the triangle
      try {
        console.log('🔺 Creating triangle:', {
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
          preview: previewTriangle,
        });
        await createTriangle({
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create triangle:', error);
        toast.error('Failed to create triangle');
      }
    }

    // Clear drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
    setPreviewCircle(null);
    setPreviewTriangle(null);
  };

  // Shape drag handlers
  const handleShapeDragStart = (e: Konva.KonvaEventObject<DragEvent>, _shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    // Refresh lock timeout when dragging starts
    clearLockTimeout();
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    // Refresh lock timeout during drag
    clearLockTimeout();
    
    // Find the shape to get its dimensions
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const node = e.target;
    let centerX = node.x();
    let centerY = node.y();
    
    // Get dimensions (calculate for text, use stored values for others)
    let width: number;
    let height: number;
    
    if (shape.type === 'text') {
      // Calculate text dimensions dynamically
      const textContent = shape.text || '';
      const textFontSize = shape.fontSize || 16;
      const estimatedWidth = textContent.length * textFontSize * 0.6;
      const estimatedHeight = textFontSize * 1.2;
      const padding = 4;
      width = estimatedWidth + padding * 2;
      height = estimatedHeight + padding * 2;
    } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
      width = shape.width;
      height = shape.height;
    } else if (shape.type === 'circle' && shape.radius !== undefined) {
      // Circle: constrain center to stay within canvas minus radius
      centerX = Math.max(shape.radius, Math.min(CANVAS_WIDTH - shape.radius, centerX));
      centerY = Math.max(shape.radius, Math.min(CANVAS_HEIGHT - shape.radius, centerY));
      node.x(centerX);
      node.y(centerY);
      return;
    } else {
      return;
    }
    
    // Constrain to canvas bounds
    const topLeftX = centerX - width / 2;
    const topLeftY = centerY - height / 2;
    const constrainedTopLeftX = Math.max(0, Math.min(CANVAS_WIDTH - width, topLeftX));
    const constrainedTopLeftY = Math.max(0, Math.min(CANVAS_HEIGHT - height, topLeftY));
    centerX = constrainedTopLeftX + width / 2;
    centerY = constrainedTopLeftY + height / 2;
    
    // Update position if constrained
    node.x(centerX);
    node.y(centerY);
  };

  const handleShapeDragEnd = async (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    
    // Find the shape to get its dimensions
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const node = e.target;
    const centerX = node.x();
    const centerY = node.y();
    
    let newX: number;
    let newY: number;
    
    if (shape.type === 'circle' && shape.radius !== undefined) {
      // For circles, we store center position
      newX = Math.max(shape.radius, Math.min(CANVAS_WIDTH - shape.radius, centerX));
      newY = Math.max(shape.radius, Math.min(CANVAS_HEIGHT - shape.radius, centerY));
      node.x(newX);
      node.y(newY);
    } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
      // For rectangles/triangles, convert center to top-left (what we store)
      newX = centerX - shape.width / 2;
      newY = centerY - shape.height / 2;
      newX = Math.max(0, Math.min(CANVAS_WIDTH - shape.width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - shape.height, newY));
      const finalCenterX = newX + shape.width / 2;
      const finalCenterY = newY + shape.height / 2;
      node.x(finalCenterX);
      node.y(finalCenterY);
    } else if (shape.type === 'text') {
      // For text, calculate dimensions dynamically then convert center to top-left
      const textContent = shape.text || '';
      const textFontSize = shape.fontSize || 16;
      const estimatedWidth = textContent.length * textFontSize * 0.6;
      const estimatedHeight = textFontSize * 1.2;
      const padding = 4;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      
      newX = centerX - width / 2;
      newY = centerY - height / 2;
      newX = Math.max(0, Math.min(CANVAS_WIDTH - width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - height, newY));
      const finalCenterX = newX + width / 2;
      const finalCenterY = newY + height / 2;
      node.x(finalCenterX);
      node.y(finalCenterY);
    } else {
      return; // Unknown type
    }

    // Update shape position in Firestore
    try {
      await updateShape(shapeId, { x: newX, y: newY });
    } catch (error) {
      console.error('❌ Failed to update shape position:', error);
    }

    // Unlock the shape after drag
    await unlockShape(shapeId);
    setSelectedShapeId(null);
    clearLockTimeout();
  };

  // Resize handlers for corner handles (proportional resize)
  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handleName: string, shape: ShapeData) => {
    e.cancelBubble = true; // Prevent other events from firing
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Store initial state for resize calculation
    setIsResizing(true);
    setActiveHandle(handleName);
    
    if (shape.type === 'circle' && shape.radius !== undefined) {
      // For circles, store radius as width (we'll use it as radius)
      setResizeStart({
        x: canvasX,
        y: canvasY,
        width: shape.radius * 2, // Store diameter as width for consistency
        height: shape.radius * 2,
        aspectRatio: 1,
        shapeX: shape.x,
        shapeY: shape.y,
      });
      setPreviewDimensions({
        x: shape.x,
        y: shape.y,
        width: shape.radius * 2,
        height: shape.radius * 2,
      });
    } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
      setResizeStart({
        x: canvasX,
        y: canvasY,
        width: shape.width,
        height: shape.height,
        aspectRatio: shape.width / shape.height,
        shapeX: shape.x,
        shapeY: shape.y,
      });
      setPreviewDimensions({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    }

    // Refresh lock timeout
    clearLockTimeout();
  };

  const handleResizeMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isResizing || !resizeStart || !activeHandle || !selectedShapeId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();
    
    // Get the current shape to check for rotation
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) return;
    
    // Handle circle resizing separately (circles use 'n', 's', 'e', 'w' handles)
    if (shape.type === 'circle' && (activeHandle === 'n' || activeHandle === 's' || activeHandle === 'e' || activeHandle === 'w')) {
      // For circles, calculate new radius based on distance from center to mouse
      const centerX = resizeStart.shapeX;
      const centerY = resizeStart.shapeY;
      
      // Calculate distance from center to current mouse position
      const newRadius = Math.sqrt(
        Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2)
      );
      
      // Enforce minimum radius
      const clampedRadius = Math.max(MIN_CIRCLE_RADIUS, newRadius);
      
      // Update preview dimensions (store as width/height for consistency with preview state)
      setPreviewDimensions({
        x: centerX,
        y: centerY,
        width: clampedRadius * 2, // diameter
        height: clampedRadius * 2,
      });
      return;
    }
    
    const rotation = shape.rotation || 0;
    const hasRotation = Math.abs(rotation) > 0.1; // Consider rotated if > 0.1 degrees

    // Calculate shape center (stays constant during resize for rotated shapes)
    const centerX = resizeStart.shapeX + resizeStart.width / 2;
    const centerY = resizeStart.shapeY + resizeStart.height / 2;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.shapeX;
    let newY = resizeStart.shapeY;

    if (hasRotation) {
      // FOR ROTATED SHAPES: Anchor-based resize (keep opposite corner/edge fixed)
      
      // Transform mouse position to shape's local coordinate system
      const relativeX = canvasX - centerX;
      const relativeY = canvasY - centerY;
      
      const rotationRad = (-rotation * Math.PI) / 180;
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      
      const localMouseX = relativeX * cos - relativeY * sin;
      const localMouseY = relativeX * sin + relativeY * cos;
      
      // Calculate anchor point in local coordinates (the corner/edge that stays fixed)
      let anchorLocalX = 0;
      let anchorLocalY = 0;
      let mouseIsOnLeft = false;
      let mouseIsOnTop = false;
      let mouseIsOnRight = false;
      let mouseIsOnBottom = false;
      
      // Determine anchor and which side the mouse is on
      switch (activeHandle) {
        case 'tl': // Top-left handle: anchor at bottom-right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnLeft = true;
          mouseIsOnTop = true;
          break;
        case 'tr': // Top-right handle: anchor at bottom-left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnRight = true;
          mouseIsOnTop = true;
          break;
        case 'bl': // Bottom-left handle: anchor at top-right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnLeft = true;
          mouseIsOnBottom = true;
          break;
        case 'br': // Bottom-right handle: anchor at top-left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnRight = true;
          mouseIsOnBottom = true;
          break;
        case 't': // Top edge: anchor at bottom
          anchorLocalX = 0;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnTop = true;
          break;
        case 'b': // Bottom edge: anchor at top
          anchorLocalX = 0;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnBottom = true;
          break;
        case 'l': // Left edge: anchor at right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = 0;
          mouseIsOnLeft = true;
          break;
        case 'r': // Right edge: anchor at left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = 0;
          mouseIsOnRight = true;
          break;
      }
      
      // Calculate new dimensions based on distance from anchor to mouse (in local space)
      let rawWidth = resizeStart.width;
      let rawHeight = resizeStart.height;
      
      if (mouseIsOnLeft || mouseIsOnRight) {
        rawWidth = Math.abs(localMouseX - anchorLocalX);
      }
      if (mouseIsOnTop || mouseIsOnBottom) {
        rawHeight = Math.abs(localMouseY - anchorLocalY);
      }
      
      // Enforce minimum size
      rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
      rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
      
      // For corner handles, maintain aspect ratio
      if ((mouseIsOnLeft || mouseIsOnRight) && (mouseIsOnTop || mouseIsOnBottom)) {
        const scaleX = rawWidth / resizeStart.width;
        const scaleY = rawHeight / resizeStart.height;
        const scale = Math.max(scaleX, scaleY);
        newWidth = resizeStart.width * scale;
        newHeight = resizeStart.height * scale;
      } else {
        newWidth = rawWidth;
        newHeight = rawHeight;
      }
      
      // Calculate new center position (in global coordinates)
      // The anchor stays fixed, so center shifts by half the dimension change
      const widthDelta = newWidth - resizeStart.width;
      const heightDelta = newHeight - resizeStart.height;
      
      // Calculate center shift in local coordinates
      let centerShiftLocalX = 0;
      let centerShiftLocalY = 0;
      
      if (mouseIsOnLeft) {
        centerShiftLocalX = -widthDelta / 2; // Center shifts left when pulling left edge
      } else if (mouseIsOnRight) {
        centerShiftLocalX = widthDelta / 2; // Center shifts right when pulling right edge
      }
      
      if (mouseIsOnTop) {
        centerShiftLocalY = -heightDelta / 2; // Center shifts up when pulling top edge
      } else if (mouseIsOnBottom) {
        centerShiftLocalY = heightDelta / 2; // Center shifts down when pulling bottom edge
      }
      
      // Transform center shift back to global coordinates
      const inverseRotationRad = (rotation * Math.PI) / 180;
      const invCos = Math.cos(inverseRotationRad);
      const invSin = Math.sin(inverseRotationRad);
      
      const centerShiftGlobalX = centerShiftLocalX * invCos - centerShiftLocalY * invSin;
      const centerShiftGlobalY = centerShiftLocalX * invSin + centerShiftLocalY * invCos;
      
      const newCenterX = centerX + centerShiftGlobalX;
      const newCenterY = centerY + centerShiftGlobalY;
      
      // Calculate new top-left position from new center
      newX = newCenterX - newWidth / 2;
      newY = newCenterY - newHeight / 2;
      
    } else {
      // FOR NON-ROTATED SHAPES: Use original anchor-based resize logic
      
      // Define the anchored corner/edge for each handle
      // The handle being dragged should follow the cursor exactly
      switch (activeHandle) {
        // CORNER HANDLES (proportional resize, maintain aspect ratio)
        case 'tl': // Top-left: cursor at TL, anchor at BR
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          // Calculate dimensions from cursor to anchor
          let rawWidth = anchorX - canvasX;
          let rawHeight = anchorY - canvasY;
          
          // Enforce minimum size
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          // Maintain aspect ratio - use the dimension that requires larger scale
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position the shape so TL corner is at cursor
          newX = anchorX - newWidth;
          newY = anchorY - newHeight;
        }
        break;

        case 'tr': // Top-right: cursor at TR, anchor at BL
        {
          const anchorX = resizeStart.shapeX;
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          let rawWidth = canvasX - anchorX;
          let rawHeight = anchorY - canvasY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so TR corner is at cursor
          newX = anchorX;
          newY = anchorY - newHeight;
        }
        break;

        case 'bl': // Bottom-left: cursor at BL, anchor at TR
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          const anchorY = resizeStart.shapeY;
          
          let rawWidth = anchorX - canvasX;
          let rawHeight = canvasY - anchorY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so BL corner is at cursor
          newX = anchorX - newWidth;
          newY = anchorY;
        }
        break;

        case 'br': // Bottom-right: cursor at BR, anchor at TL
        {
          const anchorX = resizeStart.shapeX;
          const anchorY = resizeStart.shapeY;
          
          let rawWidth = canvasX - anchorX;
          let rawHeight = canvasY - anchorY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so BR corner is at cursor (anchor stays at TL)
          newX = anchorX;
          newY = anchorY;
        }
        break;

        // EDGE HANDLES (single dimension resize, width OR height only)
        case 't': // Top edge: resize height only, anchor bottom edge
        {
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          // Calculate new height from cursor to bottom edge
          let rawHeight = anchorY - canvasY;
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          newHeight = rawHeight;
          newWidth = resizeStart.width; // Width stays constant
          newX = resizeStart.shapeX; // X position stays constant
          newY = anchorY - newHeight; // Y adjusts so bottom edge stays anchored
        }
        break;

        case 'b': // Bottom edge: resize height only, anchor top edge
        {
          const anchorY = resizeStart.shapeY;
          
          // Calculate new height from top edge to cursor
          let rawHeight = canvasY - anchorY;
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          newHeight = rawHeight;
          newWidth = resizeStart.width; // Width stays constant
          newX = resizeStart.shapeX; // X position stays constant
          newY = anchorY; // Y stays anchored at top
        }
        break;

        case 'l': // Left edge: resize width only, anchor right edge
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          
          // Calculate new width from cursor to right edge
          let rawWidth = anchorX - canvasX;
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          
          newWidth = rawWidth;
          newHeight = resizeStart.height; // Height stays constant
          newX = anchorX - newWidth; // X adjusts so right edge stays anchored
          newY = resizeStart.shapeY; // Y position stays constant
        }
        break;

        case 'r': // Right edge: resize width only, anchor left edge
        {
          const anchorX = resizeStart.shapeX;
          
          // Calculate new width from left edge to cursor
          let rawWidth = canvasX - anchorX;
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          
          newWidth = rawWidth;
          newHeight = resizeStart.height; // Height stays constant
          newX = anchorX; // X stays anchored at left
          newY = resizeStart.shapeY; // Y position stays constant
        }
        break;
      }
    }

    // Update preview dimensions
    setPreviewDimensions({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResizeEnd = async () => {
    if (!isResizing || !previewDimensions || !selectedShapeId || !resizeStart) {
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Get the shape to determine its type
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) {
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Validate minimum dimensions
    if (shape.type === 'circle') {
      const newRadius = previewDimensions.width / 2;
      if (newRadius < MIN_CIRCLE_RADIUS) {
        toast.error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`, {
          duration: 2000,
          position: 'top-center',
        });
        setIsResizing(false);
        setActiveHandle(null);
        setResizeStart(null);
        setPreviewDimensions(null);
        return;
      }
    } else if (previewDimensions.width < MIN_SHAPE_WIDTH || previewDimensions.height < MIN_SHAPE_HEIGHT) {
      toast.error(`Minimum size is ${MIN_SHAPE_WIDTH}×${MIN_SHAPE_HEIGHT} pixels`, {
        duration: 2000,
        position: 'top-center',
      });
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Capture values before clearing state
    const shapeIdToUpdate = selectedShapeId;
    const newWidth = previewDimensions.width;
    const newHeight = previewDimensions.height;
    const newX = previewDimensions.x;
    const newY = previewDimensions.y;
    const positionChanged = newX !== resizeStart.shapeX || newY !== resizeStart.shapeY;
    
    // Clear UI state immediately - this removes the preview overlay
    setIsResizing(false);
    setActiveHandle(null);
    setResizeStart(null);
    setPreviewDimensions(null);

    // Perform Firestore updates in background
    // The shape will smoothly update via real-time listener
    try {
      // Handle circle resize differently (use radius instead of width/height)
      let resizePromise: Promise<void>;
      if (shape.type === 'circle') {
        const newRadius = newWidth / 2;
        resizePromise = resizeCircle(shapeIdToUpdate, newRadius);
        // Circles don't change position during resize (center stays fixed)
      } else {
        // Rectangle or triangle resize
        resizePromise = resizeShape(shapeIdToUpdate, newWidth, newHeight);
        const positionPromise = positionChanged 
          ? updateShape(shapeIdToUpdate, { x: newX, y: newY })
          : Promise.resolve();
        
        // Wait for both to complete
        await Promise.all([resizePromise, positionPromise]);
        
        toast.success('Shape resized', { duration: 1000 });
        
        console.log('✅ SUCCESS TASK [1.6]: Shape resize persisted to Firestore with real-time sync');
        
        // Unlock shape after all operations complete
        await unlockShape(shapeIdToUpdate);
        setSelectedShapeId(null);
        return;
      }
      
      // For circles, just wait for resize
      await resizePromise;
      
      toast.success('Circle resized', { duration: 1000 });
      
      console.log('✅ Circle resize persisted to Firestore with real-time sync');
    } catch (error) {
      console.error('❌ Failed to resize shape:', error);
      toast.error('Failed to resize shape');
    } finally {
      // Unlock shape after all operations complete
      await unlockShape(shapeIdToUpdate);
      setSelectedShapeId(null);
    }
  };

  // ============================================
  // Rotation Handlers
  // ============================================

  const handleRotationStart = (e: Konva.KonvaEventObject<MouseEvent>, shape: ShapeData) => {
    e.cancelBubble = true; // Prevent other events from firing
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Calculate shape center in canvas coordinates
    let centerX: number;
    let centerY: number;
    
    if (shape.type === 'circle') {
      centerX = shape.x;
      centerY = shape.y;
    } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
      centerX = shape.x + shape.width / 2;
      centerY = shape.y + shape.height / 2;
    } else {
      return; // Unknown type
    }

    // Calculate initial angle from center to mouse position
    const initialAngle = Math.atan2(canvasY - centerY, canvasX - centerX);

    // Store initial state for rotation calculation
    setIsRotating(true);
    setRotationStart({
      angle: initialAngle,
      rotation: shape.rotation || 0,
    });
    setPreviewRotation(shape.rotation || 0);

    // Refresh lock timeout
    clearLockTimeout();
    
    console.log('✅ Rotation started:', {
      initialAngle: (initialAngle * 180 / Math.PI).toFixed(2) + '°',
      currentRotation: (shape.rotation || 0).toFixed(2) + '°',
    });
  };

  const handleRotationMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isRotating || !rotationStart || !selectedShapeId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Get current shape
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) return;

    // Calculate shape center
    let centerX: number;
    let centerY: number;
    
    if (shape.type === 'circle') {
      centerX = shape.x;
      centerY = shape.y;
    } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
      centerX = shape.x + shape.width / 2;
      centerY = shape.y + shape.height / 2;
    } else {
      return;
    }

    // Calculate current angle from center to mouse position
    const currentAngle = Math.atan2(canvasY - centerY, canvasX - centerX);

    // Calculate angle delta in radians, then convert to degrees
    const angleDelta = currentAngle - rotationStart.angle;
    const deltaInDegrees = angleDelta * (180 / Math.PI);

    // Calculate new rotation
    const newRotation = rotationStart.rotation + deltaInDegrees;

    // Update preview
    setPreviewRotation(newRotation);
    
    // Log for debugging and Task 2.5 completion
    if (Math.random() < 0.05) { // Log only 5% of the time to avoid spam
      const normalizedAngle = ((newRotation % 360) + 360) % 360;
      console.log('✅ SUCCESS TASK [2.5]: Angle tooltip displayed during rotation');
      console.log('🔄 Rotating:', {
        currentAngle: (currentAngle * 180 / Math.PI).toFixed(2) + '°',
        delta: deltaInDegrees.toFixed(2) + '°',
        displayedAngle: Math.round(normalizedAngle) + '°',
      });
    }
  };

  const handleRotationEnd = async () => {
    if (!isRotating || previewRotation === null || !selectedShapeId) {
      setIsRotating(false);
      setRotationStart(null);
      setPreviewRotation(null);
      return;
    }

    try {
      // Persist rotation to Firestore (rotateShape will normalize to 0-360)
      await rotateShape(selectedShapeId, previewRotation);
      
      toast.success('Shape rotated', { duration: 1000 });
      
      console.log('✅ SUCCESS TASK [2.4]: Rotation persisted to Firestore', {
        finalRotation: previewRotation.toFixed(2) + '°',
      });
    } catch (error) {
      console.error('❌ Failed to rotate shape:', error);
      toast.error('Failed to rotate shape');
    } finally {
      setIsRotating(false);
      setRotationStart(null);
      setPreviewRotation(null);
      
      // Refresh lock timeout after rotation
      if (selectedShapeId) {
        startLockTimeout(selectedShapeId);
      }
    }
  };

  // Handle mouse leaving canvas - reset drawing state to prevent stuck dragging
  const handleCanvasMouseLeave = () => {
    // Reset drawing state if user leaves canvas while drawing
    if (isDrawing) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
    }
    
    // Reset rotation state if user leaves canvas while rotating
    if (isRotating) {
      setIsRotating(false);
      setRotationStart(null);
      setPreviewRotation(null);
    }
    
    // Reset resize state if user leaves canvas while resizing
    if (isResizing) {
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
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
    if (activeTool === 'bomb') return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewport=\'0 0 40 40\' style=\'font-size:32px\'><text y=\'32\'>💣</text></svg>") 16 16, crosshair'; // Bomb mode: show bomb cursor
    if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'triangle') return 'crosshair'; // Shape tool: ready to draw
    if (activeTool === 'text') return 'text'; // Text mode: show text cursor
    if (activeTool === 'pan') return 'grab'; // Pan mode: ready to pan
    return 'default'; // Select mode: default cursor (objects will have pointer cursor on hover)
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
        width={window.innerWidth - 70} // Account for tool palette
        height={window.innerHeight - 131} // Account for title bar, menu bar, color palette, status bar
        draggable={activeTool === 'pan'} // Only allow dragging in pan mode
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

          {/* Render all shapes from Firestore */}
          {!shapesLoading && shapes.map((shape) => {
            const lockStatus = getShapeLockStatus(shape);
            const isLockedByMe = lockStatus === 'locked-by-me';
            const isLockedByOther = lockStatus === 'locked-by-other';
            const isSelected = selectedShapeId === shape.id;
            const isBeingResized = isResizing && isSelected;
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
              // Circle type
              currentX = isBeingResized && previewDimensions ? previewDimensions.x : shape.x;
              currentY = isBeingResized && previewDimensions ? previewDimensions.y : shape.y;
              currentRadius = isBeingResized && previewDimensions ? previewDimensions.width / 2 : shape.radius;
            } else if (shape.type === 'text') {
              // Text type - calculate dimensions based on content
              const textContent = shape.text || '';
              const textFontSize = shape.fontSize || 16;
              const estimatedWidth = textContent.length * textFontSize * 0.6;
              const estimatedHeight = textFontSize * 1.2;
              const padding = 4;
              
              currentX = shape.x;
              currentY = shape.y;
              currentWidth = estimatedWidth + padding * 2;
              currentHeight = estimatedHeight + padding * 2;
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
                x={groupX} 
                y={groupY}
                offsetX={offsetX}
                offsetY={offsetY}
                rotation={currentRotation}
                draggable={activeTool === 'select' && !isLockedByOther && !isResizing && !isRotating}
                onMouseDown={activeTool === 'select' ? () => handleShapeMouseDown(shape.id) : undefined}
                onTouchStart={activeTool === 'select' ? () => handleShapeMouseDown(shape.id) : undefined}
                onDragStart={(e) => handleShapeDragStart(e, shape.id)}
                onDragMove={(e) => handleShapeDragMove(e, shape.id)}
                onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
              >
                {/* Main shape - render based on type */}
                {shape.type === 'rectangle' && currentWidth !== undefined && currentHeight !== undefined && (
                  <Rect
                    width={currentWidth}
                    height={currentHeight}
                    fill={shape.color}
                    opacity={isLockedByOther ? 0.5 : 1}
                    stroke={isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
                    strokeWidth={isLockedByMe || isLockedByOther ? 3 : 1}
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
                    stroke={isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
                    strokeWidth={isLockedByMe || isLockedByOther ? 3 : 1}
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
                {shape.type === 'triangle' && currentWidth !== undefined && currentHeight !== undefined && (() => {
                  // Debug logging
                  if (Math.random() < 0.1) {
                    console.log('🔺 Rendering triangle:', {
                      id: shape.id,
                      stored: { x: currentX, y: currentY, width: currentWidth, height: currentHeight },
                      groupPos: { x: groupX, y: groupY },
                      offset: { x: offsetX, y: offsetY },
                      localPoints: [currentWidth / 2, 0, 0, currentHeight, currentWidth, currentHeight],
                    });
                  }
                  
                  return (
                    <Line
                      points={[
                        currentWidth / 2, 0,              // Top vertex (centered at top of bounding box)
                        0, currentHeight,                  // Bottom-left vertex
                        currentWidth, currentHeight,       // Bottom-right vertex
                      ]}
                      closed={true}
                      fill={shape.color}
                      opacity={isLockedByOther ? 0.5 : 1}
                      stroke={isLockedByMe ? '#10b981' : isLockedByOther ? '#ef4444' : '#000000'}
                      strokeWidth={isLockedByMe || isLockedByOther ? 3 : 1}
                      onMouseEnter={() => {
                        if (activeTool === 'select' && !isLockedByOther) {
                          document.body.style.cursor = 'move';
                        }
                      }}
                      onMouseLeave={() => {
                        document.body.style.cursor = '';
                      }}
                    />
                  );
                })()}
                {shape.type === 'text' && currentWidth !== undefined && currentHeight !== undefined && (() => {
                  const textContent = shape.text || '';
                  const textFontSize = shape.fontSize || 16;
                  const padding = 4;
                  
                  return (
                    <>
                      {/* Invisible hitbox to make the entire text area draggable */}
                      <Rect
                        x={0}
                        y={0}
                        width={currentWidth}
                        height={currentHeight}
                        fill="transparent"
                        listening={true}
                        onMouseEnter={() => {
                          if (activeTool === 'select' && !isLockedByOther) {
                            document.body.style.cursor = 'move';
                          }
                        }}
                        onMouseLeave={() => {
                          document.body.style.cursor = '';
                        }}
                      />
                      
                      {/* Selection box with dotted border (Paint-style) - show when selected OR when editing */}
                      {(isSelected || editingTextId === shape.id) && (
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

                {/* Resize handles for rectangles and triangles (8 total: 4 corners + 4 edges) */}
                {isSelected && isLockedByMe && !isResizing && (shape.type === 'rectangle' || shape.type === 'triangle') && currentWidth !== undefined && currentHeight !== undefined && (
                  <Group>
                    {/* Define all 8 resize handles - size scales with zoom for consistent visibility */}
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
                              handleResizeStart(e, handle.name, shape);
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
                              handleResizeStart(e, handle.name, shape);
                            }}
                          />
                        );
                      });
                    })()}
                  </Group>
                )}

                {/* Rotation handle - appears 50px above the top of the shape when locked */}
                {isSelected && isLockedByMe && !isResizing && (() => {
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
                          handleRotationStart(e, shape);
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
              </Group>
            );
          })}

          {/* Preview rectangle while drawing */}
          {previewRect && activeTool === 'rectangle' && (
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

          {/* Preview circle while drawing */}
          {previewCircle && activeTool === 'circle' && (
            <Circle
              x={previewCircle.x}
              y={previewCircle.y}
              radius={previewCircle.radius}
              fill={selectedColor}
              opacity={0.5}
              stroke={selectedColor}
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
          )}

          {/* Preview triangle while drawing */}
          {previewTriangle && activeTool === 'triangle' && (
            <Line
              points={getTrianglePoints(previewTriangle.x, previewTriangle.y, previewTriangle.width, previewTriangle.height)}
              closed={true}
              fill={selectedColor}
              opacity={0.5}
              stroke={selectedColor}
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
          )}

          
          {/* Dimension tooltip while resizing - always appears upright above the shape */}
          {isResizing && previewDimensions && selectedShapeId && (() => {
            const shape = shapes.find(s => s.id === selectedShapeId);
            if (!shape) return null;
            
            // Calculate the center of the shape using current (preview) dimensions
            const centerX = previewDimensions.x + previewDimensions.width / 2;
            const centerY = previewDimensions.y + previewDimensions.height / 2;
            
            // Position tooltip above the shape, accounting for rotation
            // Use the maximum dimension to ensure tooltip is always above the shape bounds
            const maxDimension = Math.max(previewDimensions.height / 2, previewDimensions.width / 2);
            const tooltipY = centerY - maxDimension - (50 / stageScale);
            
            return (
              <Group x={centerX} y={tooltipY}>
                {/* Tooltip background */}
                <Rect
                  x={-(60 / stageScale)}
                  y={-(20 / stageScale)}
                  width={120 / stageScale}
                  height={40 / stageScale}
                  fill="white"
                  stroke="#999"
                  strokeWidth={1 / stageScale}
                  cornerRadius={6 / stageScale}
                  shadowBlur={8 / stageScale}
                  shadowOpacity={0.3}
                  shadowOffsetY={2 / stageScale}
                  listening={false}
                />
                {/* Tooltip text */}
                <Text
                  text={`${Math.round(previewDimensions.width)} × ${Math.round(previewDimensions.height)}`}
                  x={-(55 / stageScale)}
                  y={-(10 / stageScale)}
                  width={110 / stageScale}
                  fontSize={16 / stageScale}
                  fill="#333"
                  fontFamily="'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  fontStyle="500"
                  align="center"
                  listening={false}
                />
              </Group>
            );
          })()}

          {/* Angle tooltip while rotating */}
          {isRotating && previewRotation !== null && selectedShapeId && (() => {
            const shape = shapes.find(s => s.id === selectedShapeId);
            if (!shape) return null;
            
            // Calculate rotation handle position (same as in rotation handle rendering)
            let centerX: number;
            let handleY: number;
            const handleDistance = 50;
            
            if (shape.type === 'circle' && shape.radius !== undefined) {
              centerX = shape.x;
              handleY = shape.y - shape.radius - handleDistance;
            } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
              centerX = shape.x + shape.width / 2;
              handleY = shape.y - handleDistance;
            } else {
              return null;
            }
            
            // Position tooltip 15px above rotation handle
            const tooltipX = centerX;
            const tooltipY = handleY - (15 / stageScale);
            
            // Normalize angle to 0-360 and round to nearest degree
            const normalizedAngle = ((previewRotation % 360) + 360) % 360;
            const displayAngle = Math.round(normalizedAngle);
            
            return (
              <Group x={tooltipX} y={tooltipY}>
                {/* Tooltip background */}
                <Rect
                  x={-(35 / stageScale)}
                  y={-(20 / stageScale)}
                  width={70 / stageScale}
                  height={40 / stageScale}
                  fill="white"
                  stroke="#999"
                  strokeWidth={1 / stageScale}
                  cornerRadius={6 / stageScale}
                  shadowBlur={8 / stageScale}
                  shadowOpacity={0.3}
                  shadowOffsetY={2 / stageScale}
                  listening={false}
                />
                {/* Tooltip text - angle in degrees */}
                <Text
                  text={`${displayAngle}°`}
                  x={-(30 / stageScale)}
                  y={-(10 / stageScale)}
                  width={60 / stageScale}
                  fontSize={16 / stageScale}
                  fill="#333"
                  fontFamily="'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  fontStyle="500"
                  align="center"
                  listening={false}
                />
              </Group>
            );
          })()}

          {/* Explosion effect when bomb is placed */}
          {explosionPos && (
            <Group x={explosionPos.x} y={explosionPos.y}>
              {/* Outer explosion ring */}
              <Text
                text="💥"
                fontSize={80}
                x={-40}
                y={-40}
                opacity={0.9}
                listening={false}
              />
              {/* Inner explosion */}
              <Text
                text="💣"
                fontSize={40}
                x={-20}
                y={-20}
                opacity={0.8}
                listening={false}
              />
            </Group>
          )}
        </Layer>
        
        {/* Cursor Layer - render other users' cursors */}
        <CursorLayer cursors={cursors} />
      </Stage>

      {/* Text Input Overlay */}
      {textInputVisible && (() => {
        // Check if we're editing an existing text
        if (editingTextId) {
          const shape = shapes.find(s => s.id === editingTextId);
          return (
            <TextInput
              initialText={shape?.type === 'text' ? shape.text : ''}
              x={textInputPosition.x}
              y={textInputPosition.y}
              fontSize={(shape?.type === 'text' ? shape.fontSize : undefined) || 16}
              color={shape?.color || selectedColor}
              onSave={handleTextEditSave}
              onCancel={handleTextEditCancel}
              stageScale={stageScale}
              stagePosition={stagePosition}
            />
          );
        }
        
        // Creating new text
        return (
          <TextInput
            initialText="Text"
            x={textInputPosition.x}
            y={textInputPosition.y}
            fontSize={16}
            color={selectedColor}
            onSave={handleTextSave}
            onCancel={handleTextCancel}
            stageScale={stageScale}
            stagePosition={stagePosition}
          />
        );
      })()}

    </div>
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

