import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import { useShapeResize } from '../../hooks/useShapeResize';
import CursorLayer from '../Collaboration/CursorLayer';
import TextInput from './TextInput';
import CanvasShape from './CanvasShape';
import CanvasPreview from './CanvasPreview';
import CanvasTooltips from './CanvasTooltips';
import { getShapeLockStatus, getCursorStyle } from './canvasHelpers';
import { selectionService } from '../../services/selectionService';
import toast from 'react-hot-toast';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  MIN_SHAPE_SIZE,
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
    updateTextFontSize,
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    userSelections,
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

  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);

  // Multi-shape move state
  const [multiDragInitialPositions, setMultiDragInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Resize handle hover state
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  
  // Rotation handle hover state
  const [hoveredRotationHandle, setHoveredRotationHandle] = useState<string | null>(null);
  
  // Text input state
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textInputClosedTimeRef = useRef<number>(0);
  
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
    updateTextFontSize,
  });

  // Track when text input is closed for cooldown
  useEffect(() => {
    if (!textInputVisible) {
      textInputClosedTimeRef.current = Date.now();
    }
  }, [textInputVisible, editingTextId]);

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

  // Keyboard shortcuts for delete, duplicate, and clear selection
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Debug: Log all keydown events to diagnose issues
      if (e.key === 'Delete' || e.key === 'Backspace') {
        console.log('🔑 DELETE KEY PRESSED', {
          selectedShapes: selectedShapes.length,
          selectedShapeId,
          textInputVisible,
          editingTextId,
          isMarqueeActive,
        });
      }
      
      // Don't trigger shortcuts when typing in text input
      if (textInputVisible || editingTextId) {
        console.log('⏭️ Skipping keyboard shortcut - text input active');
        return;
      }
      
      // Don't trigger shortcuts during marquee selection
      if (isMarqueeActive) {
        console.log('⏭️ Skipping keyboard shortcut - marquee active');
        return;
      }
      
      // Escape key - clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          setSelectedShapes([]);
        }
        if (selectedShapeId) {
          await handleDeselectShape();
        }
        return;
      }

      // Don't trigger delete/duplicate if no user
      if (!user) return;

      // Delete key - batch delete or single delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        // Check if we have multiple shapes selected
        if (selectedShapes.length > 0) {
          console.log('🗑️ BATCH DELETE - Deleting', selectedShapes.length, 'shapes');
          console.log('   Shape IDs:', selectedShapes);
          
          try {
            // Delete all selected shapes in parallel
            const deletePromises = selectedShapes.map(shapeId => deleteShape(shapeId));
            await Promise.all(deletePromises);
            
            console.log('✅ BATCH DELETE SUCCESS - All', selectedShapes.length, 'shapes deleted');
            
            // Clear selection after delete
            setSelectedShapes([]);
            
            toast.success(`${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''} deleted`, {
              duration: 1500,
              position: 'top-center',
            });
          } catch (error) {
            console.error('❌ BATCH DELETE ERROR - Failed to delete shapes:', error);
            toast.error('Failed to delete shapes', {
              duration: 2000,
              position: 'top-center',
            });
          }
          return;
        }
        
        // Single shape deletion (fallback for old behavior)
        if (selectedShapeId) {
          try {
            await deleteShape(selectedShapeId);
            setSelectedShapeId(null);
            toast.success('Shape deleted', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to delete shape:', error);
            toast.error('Failed to delete shape', {
              duration: 2000,
              position: 'top-center',
            });
          }
        } else {
          console.log('⚠️ DELETE KEY PRESSED - No shapes selected');
        }
        return;
      }

      // Ctrl+D or Cmd+D - duplicate selected shapes (batch or single)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        
        // Check if we have multiple shapes selected (batch duplicate)
        if (selectedShapes.length > 0) {
          console.log('📋 BATCH DUPLICATE - Duplicating', selectedShapes.length, 'shapes');
          console.log('   Shape IDs:', selectedShapes);
          
          try {
            // Duplicate all selected shapes in parallel
            const duplicatePromises = selectedShapes.map(shapeId => duplicateShape(shapeId, user.uid));
            const newShapeIds = await Promise.all(duplicatePromises);
            
            console.log('✅ BATCH DUPLICATE SUCCESS - All', selectedShapes.length, 'shapes duplicated');
            console.log('   New shape IDs:', newShapeIds);
            
            // Clear original selection and select only the duplicates
            setSelectedShapes(newShapeIds);
            
            toast.success(`${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''} duplicated`, {
              duration: 1500,
              position: 'top-center',
            });
          } catch (error) {
            console.error('❌ BATCH DUPLICATE ERROR - Failed to duplicate shapes:', error);
            toast.error('Failed to duplicate shapes', {
              duration: 2000,
              position: 'top-center',
            });
          }
          return;
        }
        
        // Single shape duplication (fallback)
        if (selectedShapeId) {
          try {
            // Unlock the current shape first
            await unlockShape(selectedShapeId);
            
            // Duplicate the shape and get the new shape ID
            const newShapeId = await duplicateShape(selectedShapeId, user.uid);
            
            // Select and lock the new shape immediately
            setSelectedShapeId(newShapeId);
            await lockShape(newShapeId, user.uid);
            
            toast.success('Shape duplicated', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to duplicate shape:', error);
            toast.error('Failed to duplicate shape', {
              duration: 2000,
              position: 'top-center',
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId, selectedShapes, user, textInputVisible, editingTextId, isMarqueeActive, deleteShape, duplicateShape]);

  // Helper: Deselect shape and unlock
  const handleDeselectShape = async () => {
    if (selectedShapeId) {
      try {
        await unlockShape(selectedShapeId);
      } catch (error) {
        console.error('Failed to unlock shape:', error);
      }
      
      setSelectedShapeId(null);
    }
  };

  // Helper: Handle shape mousedown (optimistic selection + background lock)
  const handleShapeMouseDown = async (shapeId: string, event?: MouseEvent | React.MouseEvent) => {
    if (!user) return;

    // Check if shape is selected by another user (selection locking)
    const selectionLockStatus = selectionService.isShapeLockedByOthers(shapeId, user.uid, userSelections);
    
    if (selectionLockStatus.locked) {
      // Shape is selected by another user - prevent interaction
      toast.error(`Shape selected by ${selectionLockStatus.username}`, {
        duration: 2000,
        position: 'top-center',
      });
      console.log('🔒 Shape selected by another user, preventing interaction:', {
        shapeId,
        lockedBy: selectionLockStatus.username,
      });
      return;
    }

    // Check if Shift key is held for multi-select
    const isShiftHeld = event?.shiftKey || false;

    if (isShiftHeld) {
      // Multi-select mode: add/remove from selection
      let newSelection = [...selectedShapes];
      
      // If there's a currently selected shape (selectedShapeId), add it to multi-selection first
      if (selectedShapeId && !newSelection.includes(selectedShapeId)) {
        console.log('🔵 Adding currently selected shape to multi-selection:', selectedShapeId);
        newSelection.push(selectedShapeId);
        // Unlock and clear single selection
        try {
          await unlockShape(selectedShapeId);
        } catch (error) {
          console.error('❌ Failed to unlock shape during multi-select:', error);
        }
        setSelectedShapeId(null);
      }
      
      // Toggle the clicked shape
      if (newSelection.includes(shapeId)) {
        // Remove from selection
        console.log('🔵 Removing shape from multi-selection:', shapeId);
        newSelection = newSelection.filter(id => id !== shapeId);
      } else {
        // Add to selection
        console.log('🔵 Adding shape to multi-selection:', shapeId);
        newSelection.push(shapeId);
      }
      
      setSelectedShapes(newSelection);
      
      // Log final selection state
      if (newSelection.length > 1) {
        console.log('✅ MULTI-SELECT ACTIVE - Selected shapes:', newSelection);
        console.log(`   📊 Total: ${newSelection.length} shapes selected`);
      } else if (newSelection.length === 1) {
        console.log('🔵 Single shape in multi-selection:', newSelection[0]);
      } else {
        console.log('⚪ Multi-selection cleared');
      }
      
      return;
    }

    // Single select mode (no Shift)
    // If clicking on already selected shape, do nothing
    if (selectedShapeId === shapeId) {
      return;
    }

    // If clicking on a shape that's part of a multi-selection, keep the multi-selection
    // (This allows dragging multi-selected shapes)
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1) {
      console.log('🔵 Clicked on multi-selected shape, keeping multi-selection for drag');
      return;
    }

    // Clear multi-selection when single-selecting a different shape
    if (selectedShapes.length > 0) {
      console.log('🔵 Clearing multi-selection for single select');
      setSelectedShapes([]);
    }

    // Deselect current shape first (AWAIT to prevent race conditions)
    if (selectedShapeId) {
      await handleDeselectShape();
    }

    // OPTIMISTIC: Set as selected immediately (makes shape draggable right away)
    setSelectedShapeId(shapeId);
    
    // Attempt to lock in background
    const result = await lockShape(shapeId, user.uid);
    
    if (!result.success) {
      // Lock failed - another user has it
      // Revert optimistic selection
      setSelectedShapeId(null);
      
      const username = result.lockedByUsername || 'another user';
      toast.error(`Shape locked by ${username}`, {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  // Helper: Handle text double-click for editing
  const handleTextDoubleClick = async (shapeId: string) => {
    if (!user) return;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.type !== 'text') return;
    
    // Check if text is locked by another user
    if (shape.lockedBy && shape.lockedBy !== user.uid) {
      const lockStatus = getShapeLockStatus(shape, user, selectedShapeId);
      if (lockStatus === 'locked-by-other') {
        toast.error('Text is locked by another user', {
          duration: 2000,
          position: 'top-center',
        });
        return;
      }
    }
    
    // Lock the shape if not already locked
    if (selectedShapeId !== shapeId) {
      // Deselect current shape first
      if (selectedShapeId) {
        await handleDeselectShape();
      }
      
      // Select and lock the text
      setSelectedShapeId(shapeId);
      const result = await lockShape(shapeId, user.uid);
      
      if (!result.success) {
        setSelectedShapeId(null);
        const username = result.lockedByUsername || 'another user';
        toast.error(`Text locked by ${username}`, {
          duration: 2000,
          position: 'top-center',
        });
        return;
      }
    }
    
    // Enter edit mode
    setEditingTextId(shapeId);
    setTextInputPosition({ x: shape.x, y: shape.y });
    setTextInputVisible(true);
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
      const textId = await createText(
        text,
        textInputPosition.x,
        textInputPosition.y,
        selectedColor,
        user.uid
      );
      setTextInputVisible(false);
      
      // Select and lock the newly created text so user can see resize handles
      setSelectedShapeId(textId);
      await lockShape(textId, user.uid);
      
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
      
      // Unlock the shape after editing
      await unlockShape(editingTextId);
      setSelectedShapeId(null);
      
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
  const handleTextEditCancel = async () => {
    if (editingTextId) {
      // Unlock the shape when canceling edit
      await unlockShape(editingTextId);
      setSelectedShapeId(null);
    }
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

      // Handle select tool - start marquee selection or clear selection
      if (activeTool === 'select') {
        // Check if Shift is held
        const isShiftHeld = e.evt.shiftKey;
        
        // If not holding Shift, clear existing selection
        if (!isShiftHeld) {
          setSelectedShapes([]);
          if (selectedShapeId) {
            handleDeselectShape();
          }
        }
        
        // Start marquee selection
        setIsMarqueeActive(true);
        setMarqueeStart({ x, y });
        setMarqueeEnd({ x, y });
        return;
      }

      // Deselect any selected shape when clicking on background
      if (selectedShapeId) {
        handleDeselectShape();
      }
      
      // Clear multi-selection when clicking on background
      if (selectedShapes.length > 0) {
        setSelectedShapes([]);
      }

      // Only start drawing if a shape tool is selected
      if (activeTool === 'pan') return;

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

    // Handle marquee selection
    if (isMarqueeActive && marqueeStart) {
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      let currentX = (pointerPosition.x - stage.x()) / stage.scaleX();
      let currentY = (pointerPosition.y - stage.y()) / stage.scaleY();

      // Clamp to canvas bounds
      currentX = Math.max(0, Math.min(CANVAS_WIDTH, currentX));
      currentY = Math.max(0, Math.min(CANVAS_HEIGHT, currentY));

      setMarqueeEnd({ x: currentX, y: currentY });
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

    // Handle marquee selection end
    if (isMarqueeActive && marqueeStart && marqueeEnd) {
      const isShiftHeld = window.event && (window.event as MouseEvent).shiftKey;
      
      // Calculate normalized marquee bounds (handle negative drags)
      const marqueeX = Math.min(marqueeStart.x, marqueeEnd.x);
      const marqueeY = Math.min(marqueeStart.y, marqueeEnd.y);
      const marqueeWidth = Math.abs(marqueeEnd.x - marqueeStart.x);
      const marqueeHeight = Math.abs(marqueeEnd.y - marqueeStart.y);
      
      // Find all shapes intersecting with marquee
      const intersectedShapes = shapes.filter(shape => {
        // Calculate shape bounds based on type
        let shapeLeft: number, shapeTop: number, shapeRight: number, shapeBottom: number;
        
        if (shape.type === 'circle' && shape.radius !== undefined) {
          // Circle: use center +/- radius
          shapeLeft = shape.x - shape.radius;
          shapeTop = shape.y - shape.radius;
          shapeRight = shape.x + shape.radius;
          shapeBottom = shape.y + shape.radius;
        } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
          // Rectangle/Triangle/Text: use top-left corner + dimensions
          shapeLeft = shape.x;
          shapeTop = shape.y;
          shapeRight = shape.x + shape.width;
          shapeBottom = shape.y + shape.height;
        } else {
          return false; // Unknown shape type
        }
        
        // Check bounding box intersection
        const isIntersecting = !(
          marqueeX + marqueeWidth < shapeLeft ||
          marqueeX > shapeRight ||
          marqueeY + marqueeHeight < shapeTop ||
          marqueeY > shapeBottom
        );
        
        return isIntersecting;
      });
      
      // Update selection based on Shift key
      const intersectedIds = intersectedShapes.map(s => s.id);
      
      if (intersectedIds.length === 0) {
        console.log('⚪ Marquee selection: No shapes intersected');
      } else {
        console.log('🔵 Marquee selection intersected shapes:', intersectedIds);
      }
      
      if (isShiftHeld) {
        // Add to existing selection (merge)
        const mergedSelection = [...new Set([...selectedShapes, ...intersectedIds])];
        setSelectedShapes(mergedSelection);
        console.log('✅ MARQUEE + SHIFT - Merged selection:', mergedSelection);
        console.log(`   📊 Total: ${mergedSelection.length} shapes selected`);
      } else {
        // Replace selection
        setSelectedShapes(intersectedIds);
        if (intersectedIds.length > 1) {
          console.log('✅ MULTI-SELECT (Marquee) - Selected shapes:', intersectedIds);
          console.log(`   📊 Total: ${intersectedIds.length} shapes selected`);
        }
      }
      
      // Clear marquee state
      setIsMarqueeActive(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
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
  const handleShapeDragStart = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    
    // If this shape is part of a multi-selection, store initial positions of all selected shapes
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1) {
      console.log('🟢 MULTI-DRAG START - Dragging', selectedShapes.length, 'shapes together');
      console.log('   Dragged shape ID:', shapeId);
      console.log('   All selected shapes:', selectedShapes);
      
      const initialPositions = new Map<string, { x: number; y: number }>();
      
      for (const id of selectedShapes) {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          initialPositions.set(id, { x: shape.x, y: shape.y });
        } else {
          console.error('❌ ERROR: Shape not found in multi-drag:', id);
        }
      }
      
      if (initialPositions.size !== selectedShapes.length) {
        console.error('❌ ERROR: Could not grab all selected shapes!');
        console.error('   Expected:', selectedShapes.length, 'Got:', initialPositions.size);
      } else {
        console.log('✅ All', initialPositions.size, 'shapes grabbed successfully');
      }
      
      setMultiDragInitialPositions(initialPositions);
    }
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true; // Prevent stage from also receiving drag events
    
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
      
      // Handle multi-shape move during drag
      if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && multiDragInitialPositions.size > 0) {
        handleMultiShapeDragMove(shapeId, centerX, centerY);
      }
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
    
    // Handle multi-shape move during drag
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && multiDragInitialPositions.size > 0) {
      handleMultiShapeDragMove(shapeId, centerX, centerY);
    }
  };

  // Helper function to move all other selected shapes during drag
  const handleMultiShapeDragMove = (draggedShapeId: string, draggedCenterX: number, draggedCenterY: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const initialPos = multiDragInitialPositions.get(draggedShapeId);
    if (!initialPos) return;

    const draggedShape = shapes.find(s => s.id === draggedShapeId);
    if (!draggedShape) return;

    // Calculate current top-left position of dragged shape
    let draggedX: number, draggedY: number;
    if (draggedShape.type === 'circle') {
      draggedX = draggedCenterX;
      draggedY = draggedCenterY;
    } else if (draggedShape.type === 'text') {
      const textContent = draggedShape.text || '';
      const textFontSize = draggedShape.fontSize || 16;
      const estimatedWidth = textContent.length * textFontSize * 0.6;
      const estimatedHeight = textFontSize * 1.2;
      const padding = 4;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      draggedX = draggedCenterX - width / 2;
      draggedY = draggedCenterY - height / 2;
    } else {
      draggedX = draggedCenterX - draggedShape.width / 2;
      draggedY = draggedCenterY - draggedShape.height / 2;
    }

    // Calculate delta
    const deltaX = draggedX - initialPos.x;
    const deltaY = draggedY - initialPos.y;

    // Get the layer
    const layers = stage.getLayers();
    if (layers.length === 0) return;
    const layer = layers[0];

    // Move all other selected shapes
    selectedShapes.forEach((id) => {
      if (id === draggedShapeId) return; // Skip the shape being dragged

      const targetInitialPos = multiDragInitialPositions.get(id);
      const targetShape = shapes.find(s => s.id === id);
      if (!targetInitialPos || !targetShape) return;

      // Calculate new position
      const newX = targetInitialPos.x + deltaX;
      const newY = targetInitialPos.y + deltaY;

      // Find the Konva node for this shape
      const targetNode = layer.findOne(`#${id}`);
      if (!targetNode) return;

      // Calculate center position based on shape type
      let newCenterX: number, newCenterY: number;
      if (targetShape.type === 'circle') {
        newCenterX = newX;
        newCenterY = newY;
      } else if (targetShape.type === 'text') {
        const textContent = targetShape.text || '';
        const textFontSize = targetShape.fontSize || 16;
        const estimatedWidth = textContent.length * textFontSize * 0.6;
        const estimatedHeight = textFontSize * 1.2;
        const padding = 4;
        const width = estimatedWidth + padding * 2;
        const height = estimatedHeight + padding * 2;
        newCenterX = newX + width / 2;
        newCenterY = newY + height / 2;
      } else {
        newCenterX = newX + targetShape.width / 2;
        newCenterY = newY + targetShape.height / 2;
      }

      // Update the Konva node position
      targetNode.x(newCenterX);
      targetNode.y(newCenterY);
    });

    // Redraw the layer
    layer.batchDraw();
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

    // Handle multi-shape movement
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && multiDragInitialPositions.size > 0) {
      const initialPos = multiDragInitialPositions.get(shapeId);
      if (!initialPos) {
        console.error('❌ ERROR: Initial position not found for dragged shape:', shapeId);
        return;
      }
      
      // Calculate drag delta
      const deltaX = newX - initialPos.x;
      const deltaY = newY - initialPos.y;
      
      console.log('🟢 MULTI-DRAG END - Moving', selectedShapes.length, 'shapes');
      console.log('   Delta: dx=' + deltaX.toFixed(2) + ', dy=' + deltaY.toFixed(2));
      
      // Update all selected shapes with the same delta
      const updatePromises = selectedShapes.map(async (id) => {
        const targetShape = shapes.find(s => s.id === id);
        const targetInitialPos = multiDragInitialPositions.get(id);
        
        if (!targetShape) {
          console.error('❌ ERROR: Target shape not found:', id);
          return;
        }
        
        if (!targetInitialPos) {
          console.error('❌ ERROR: Initial position not found for shape:', id);
          return;
        }
        
        const targetNewX = targetInitialPos.x + deltaX;
        const targetNewY = targetInitialPos.y + deltaY;
        
        // Clamp to canvas bounds based on shape type
        let clampedX = targetNewX;
        let clampedY = targetNewY;
        
        if (targetShape.type === 'circle' && targetShape.radius !== undefined) {
          clampedX = Math.max(targetShape.radius, Math.min(CANVAS_WIDTH - targetShape.radius, targetNewX));
          clampedY = Math.max(targetShape.radius, Math.min(CANVAS_HEIGHT - targetShape.radius, targetNewY));
        } else if (targetShape.type === 'rectangle' || targetShape.type === 'triangle') {
          clampedX = Math.max(0, Math.min(CANVAS_WIDTH - targetShape.width, targetNewX));
          clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - targetShape.height, targetNewY));
        } else if (targetShape.type === 'text') {
          const textContent = targetShape.text || '';
          const textFontSize = targetShape.fontSize || 16;
          const estimatedWidth = textContent.length * textFontSize * 0.6;
          const estimatedHeight = textFontSize * 1.2;
          const padding = 4;
          const width = estimatedWidth + padding * 2;
          const height = estimatedHeight + padding * 2;
          
          clampedX = Math.max(0, Math.min(CANVAS_WIDTH - width, targetNewX));
          clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - height, targetNewY));
        }
        
        // Update shape position in Firestore
        try {
          await updateShape(id, { x: clampedX, y: clampedY });
        } catch (error) {
          console.error(`❌ Failed to update shape position for ${id}:`, error);
        }
      });
      
      // Wait for all updates to complete
      try {
        await Promise.all(updatePromises);
        console.log('✅ All', selectedShapes.length, 'shapes updated in Firestore');
      } catch (error) {
        console.error('❌ ERROR: Failed to update some shapes:', error);
      }
      
      // Clear multi-drag state
      setMultiDragInitialPositions(new Map());
    } else {
      // Single shape movement
      try {
        await updateShape(shapeId, { x: newX, y: newY });
      } catch (error) {
        console.error('❌ Failed to update shape position:', error);
      }
    }

    // Unlock the shape after drag (if it's the single-selected shape)
    if (selectedShapeId === shapeId) {
      await unlockShape(shapeId);
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
      handleResizeEnd();
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

  return (
    <div 
      ref={containerRef}
      style={{
        ...styles.canvasContainer,
        cursor: getCursorStyle(isDrawing, isPanning, activeTool),
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
            const lockStatus = getShapeLockStatus(shape, user, selectedShapeId);
            const isLockedByMe = lockStatus === 'locked-by-me';
            const isSelected = selectedShapeId === shape.id;
            const isMultiSelected = selectedShapes.includes(shape.id);
            
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
                editingTextId={editingTextId}
                onShapeMouseDown={handleShapeMouseDown}
                onTextDoubleClick={handleTextDoubleClick}
                onResizeStart={handleResizeStart}
                onRotationStart={handleRotationStart}
                onDragStart={handleShapeDragStart}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                setHoveredHandle={setHoveredHandle}
                setHoveredRotationHandle={setHoveredRotationHandle}
              />
            );
          })}

          {/* Shape drawing previews */}
          <CanvasPreview
            previewRect={previewRect}
            previewCircle={previewCircle}
            previewTriangle={previewTriangle}
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
          if (shape && shape.type === 'text') {
            return (
              <TextInput
                initialText={shape.text}
                x={textInputPosition.x}
                y={textInputPosition.y}
                width={shape.width}
                height={shape.height}
                fontSize={shape.fontSize || 16}
                color={shape.color}
                rotation={shape.rotation || 0}
                onSave={handleTextEditSave}
                onCancel={handleTextEditCancel}
                stageScale={stageScale}
                stagePosition={stagePosition}
              />
            );
          }
        }
        
        // Creating new text
        return (
          <TextInput
            initialText="Text"
            x={textInputPosition.x}
            y={textInputPosition.y}
            fontSize={16}
            color={selectedColor}
            rotation={0}
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

