import toast from 'react-hot-toast';
import type Konva from 'konva';
import type { ShapeData } from '../services/canvasService';
import { selectionService } from '../services/selectionService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { calculateTextDimensions } from '../utils/textEditingHelpers';

interface UseShapeInteractionProps {
  user: { uid: string; displayName?: string | null; email?: string | null } | null;
  shapes: ShapeData[];
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
  selectedShapes: string[];
  setSelectedShapes: (ids: string[]) => void;
  lastClickedShapeId: string | null;
  setLastClickedShapeId: (id: string | null) => void;
  userSelections: Record<string, { userId: string; username?: string; selectedShapes: string[]; updatedAt: any }>;
  lockShape: (shapeId: string, userId: string) => Promise<{ success: boolean; lockedByUsername?: string }>;
  unlockShape: (shapeId: string) => Promise<void>;
  updateShape: (shapeId: string, updates: Partial<ShapeData>) => Promise<void>;
}

export function useShapeInteraction(props: UseShapeInteractionProps) {
  const {
    user,
    shapes,
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    setLastClickedShapeId,
    userSelections,
    lockShape,
    unlockShape,
    updateShape,
  } = props;

  // Helper: Deselect shape and unlock
  const handleDeselectShape = async () => {
    if (selectedShapeId) {
      // Check if the shape still exists before trying to unlock it
      const shapeStillExists = shapes.find(s => s.id === selectedShapeId);
      if (shapeStillExists) {
        try {
          await unlockShape(selectedShapeId);
        } catch (error) {
          console.error('Failed to unlock shape:', error);
        }
      } else {
        console.log('⚠️ Shape no longer exists, skipping unlock:', selectedShapeId);
      }
      
      setSelectedShapeId(null);
    }
  };

  // Handle shape mousedown (optimistic selection + background lock)
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

    // IMPORTANT: Check if clicking on a shape that's already part of a multi-selection FIRST
    if (selectedShapes.includes(shapeId) && selectedShapes.length > 1 && !event?.shiftKey) {
      console.log('🔵 Clicked on multi-selected shape, keeping multi-selection for drag');
      // Track which shape was actually clicked
      setLastClickedShapeId(shapeId);
      return;
    }

    // Check if shape belongs to a group
    const clickedShape = shapes.find(s => s.id === shapeId);
    const groupId = clickedShape?.groupId;
    
    // If shape is part of a group, select entire group
    if (groupId && !event?.shiftKey) {
      const groupShapes = shapes.filter(s => s.groupId === groupId).map(s => s.id);
      console.log('🔵 GROUP SELECT - Selecting entire group:', {
        groupId,
        shapeCount: groupShapes.length,
        shapeIds: groupShapes,
        lastClickedShapeId: shapeId,
      });
      
      // Clear single selection if any
      if (selectedShapeId) {
        await handleDeselectShape();
      }
      
      // Track which shape was actually clicked
      setLastClickedShapeId(shapeId);
      
      // Select all shapes in group
      setSelectedShapes(groupShapes);
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
      
      // Track the last clicked shape
      setLastClickedShapeId(shapeId);
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

    // Clear multi-selection when single-selecting a different shape
    if (selectedShapes.length > 0) {
      console.log('🔵 Clearing multi-selection for single select');
      setSelectedShapes([]);
    }

    // Deselect current shape first (AWAIT to prevent race conditions)
    if (selectedShapeId) {
      await handleDeselectShape();
    }

    // OPTIMISTIC: Set as selected immediately
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

  // Shape drag handlers
  const handleShapeDragStart = (e: Konva.KonvaEventObject<DragEvent>, _shapeId: string) => {
    e.cancelBubble = true;
  };

  const handleShapeDragMove = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    e.cancelBubble = true;
    
    // Find the shape to get its dimensions
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const node = e.target;
    let centerX = node.x();
    let centerY = node.y();
    
    // Get dimensions
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

  const handleShapeDragEnd = async (e: Konva.KonvaEventObject<DragEvent>, shapeId: string): Promise<{ x: number; y: number }> => {
    e.cancelBubble = true;
    
    // Find the shape to get its dimensions
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return { x: 0, y: 0 };
    
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
      // For rectangles/triangles, convert center to top-left
      newX = centerX - shape.width / 2;
      newY = centerY - shape.height / 2;
      newX = Math.max(0, Math.min(CANVAS_WIDTH - shape.width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - shape.height, newY));
      const finalCenterX = newX + shape.width / 2;
      const finalCenterY = newY + shape.height / 2;
      node.x(finalCenterX);
      node.y(finalCenterY);
    } else if (shape.type === 'text') {
      // For text, calculate dimensions dynamically
      const textContent = shape.text || '';
      const textFontSize = shape.fontSize || 16;
      const fontWeight = shape.fontWeight || 'normal';
      
      const textDimensions = calculateTextDimensions(textContent, textFontSize, fontWeight);
      const padding = 4;
      const width = textDimensions.width + padding * 2;
      const height = textDimensions.height + padding * 2;
      
      newX = centerX - width / 2;
      newY = centerY - height / 2;
      newX = Math.max(0, Math.min(CANVAS_WIDTH - width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - height, newY));
      const finalCenterX = newX + width / 2;
      const finalCenterY = newY + height / 2;
      node.x(finalCenterX);
      node.y(finalCenterY);
    } else {
      return { x: 0, y: 0 };
    }

    return { x: newX, y: newY };
  };

  const finalizeSingleShapeDrag = async (shapeId: string, position: { x: number; y: number }) => {
    try {
      await updateShape(shapeId, position);
    } catch (error) {
      console.error('❌ Failed to update shape position:', error);
    }

    // Unlock the shape after drag
    if (selectedShapeId === shapeId) {
      await unlockShape(shapeId);
      setSelectedShapeId(null);
    }
  };

  return {
    handleDeselectShape,
    handleShapeMouseDown,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
    finalizeSingleShapeDrag,
  };
}

