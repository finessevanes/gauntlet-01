import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useCursors } from '../../hooks/useCursors';
import { useAuth } from '../../hooks/useAuth';
import { useShapeResize } from '../../hooks/useShapeResize';
import CursorLayer from '../Collaboration/CursorLayer';
import CanvasShape from './CanvasShape';
import CanvasPreview from './CanvasPreview';
import CanvasTooltips from './CanvasTooltips';
import AlignmentToolbar from './AlignmentToolbar';
import { CommentPanel } from './CommentPanel';
import TextEditorOverlay from './TextEditorOverlay';
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
    cancelEdit
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
  
  // Space key panning state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Comment panel state
  const [openCommentPanelShapeId, setOpenCommentPanelShapeId] = useState<string | null>(null);
  
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

  // Space key handler for temporary panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enable panning when Space is pressed
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Disable panning when Space is released
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Keyboard shortcuts for delete, duplicate, and clear selection
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Debug: Log all keydown events to diagnose issues
      if (e.key === 'Delete' || e.key === 'Backspace') {
        console.log('🔑 DELETE KEY PRESSED', {
          selectedShapes: selectedShapes.length,
          selectedShapeId,
          isMarqueeActive,
        });
      }
      
      // Don't trigger shortcuts when comment panel is open
      if (openCommentPanelShapeId) {
        console.log('⏭️ Skipping keyboard shortcut - comment panel active');
        return;
      }
      
      // Don't trigger shortcuts during marquee selection
      if (isMarqueeActive) {
        console.log('⏭️ Skipping keyboard shortcut - marquee active');
        return;
      }
      
      // Don't trigger shortcuts when text editing is active
      if (editingTextId) {
        console.log('⏭️ Skipping keyboard shortcut - text editing active');
        return;
      }
      
      // Platform detection
      const cmdKey = (e.ctrlKey || e.metaKey);
      
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

      // Cmd/Ctrl + G - Group shapes
      if (cmdKey && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedShapes.length >= 2) {
          try {
            const groupId = await groupShapes(selectedShapes, user.uid);
            toast.success(`Grouped ${selectedShapes.length} shapes`, {
              duration: 1500,
              position: 'top-center',
            });
            console.log('✅ Grouped shapes:', groupId);
          } catch (error) {
            console.error('Failed to group shapes:', error);
            toast.error('Failed to group shapes', {
              duration: 2000,
              position: 'top-center',
            });
          }
        }
        return;
      }

      // Cmd/Ctrl + Shift + G - Ungroup shapes
      if (cmdKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          try {
            // Find if any selected shapes have a groupId
            const groupedShapes = shapes.filter(s => selectedShapes.includes(s.id) && s.groupId);
            if (groupedShapes.length > 0) {
              const groupId = groupedShapes[0].groupId;
              if (groupId) {
                await ungroupShapes(groupId);
                
                // After ungrouping, select only the last clicked shape
                if (lastClickedShapeId && selectedShapes.includes(lastClickedShapeId)) {
                  console.log('🔵 Setting selection to last clicked shape after ungroup:', lastClickedShapeId);
                  setSelectedShapes([lastClickedShapeId]);
                } else {
                  // Fallback: clear selection if last clicked shape isn't available
                  setSelectedShapes([]);
                }
                
                toast.success('Ungrouped shapes', {
                  duration: 1500,
                  position: 'top-center',
                });
                console.log('✅ Ungrouped shapes');
              }
            }
          } catch (error) {
            console.error('Failed to ungroup shapes:', error);
            toast.error('Failed to ungroup shapes', {
              duration: 2000,
              position: 'top-center',
            });
          }
        }
        return;
      }

      // Cmd/Ctrl + C - Copy to clipboard
      if (cmdKey && e.key === 'c') {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          const shapesToCopy = shapes.filter(s => selectedShapes.includes(s.id));
          setClipboard(shapesToCopy);
          toast.success(`Copied ${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''}`, {
            duration: 1500,
            position: 'top-center',
          });
          console.log('✅ Copied shapes to clipboard:', shapesToCopy);
        } else if (selectedShapeId) {
          const shapeToCopy = shapes.find(s => s.id === selectedShapeId);
          if (shapeToCopy) {
            setClipboard([shapeToCopy]);
            toast.success('Copied 1 shape', {
              duration: 1500,
              position: 'top-center',
            });
            console.log('✅ Copied shape to clipboard:', shapeToCopy);
          }
        }
        return;
      }

      // Cmd/Ctrl + V - Paste from clipboard
      if (cmdKey && e.key === 'v') {
        e.preventDefault();
        if (!clipboard || clipboard.length === 0) {
          console.log('⚠️ Nothing to paste - clipboard is empty');
          return;
        }

        console.log('📋 PASTE - Pasting', clipboard.length, 'shapes from clipboard');
        
        const PASTE_OFFSET = 20; // Offset pasted shapes by 20px so they don't overlap
        
        try {
          // Create duplicates of all clipboard shapes with offset
          const pastePromises = clipboard.map(async (shape) => {
            // Calculate new position with offset and clamp to canvas
            const newX = Math.min(shape.x + PASTE_OFFSET, CANVAS_WIDTH - (shape.width || 0));
            const newY = Math.min(shape.y + PASTE_OFFSET, CANVAS_HEIGHT - (shape.height || 0));
            
            // Build the shape data for creation
            if (shape.type === 'rectangle') {
              return await createShape({
                type: 'rectangle',
                x: newX,
                y: newY,
                width: shape.width,
                height: shape.height,
                color: shape.color,
                rotation: shape.rotation || 0,
                createdBy: user.uid,
              });
            } else if (shape.type === 'circle') {
              return await createCircle({
                x: newX,
                y: newY,
                radius: shape.radius || 50,
                color: shape.color,
                createdBy: user.uid,
              });
            } else if (shape.type === 'triangle') {
              return await createTriangle({
                x: newX,
                y: newY,
                width: shape.width,
                height: shape.height,
                color: shape.color,
                createdBy: user.uid,
              });
            }
            // Text shapes are not supported in this version
            return null;
          });
          
          const newShapeIds = await Promise.all(pastePromises);
          
          console.log('✅ PASTE SUCCESS - All', clipboard.length, 'shapes pasted');
          console.log('   New shape IDs:', newShapeIds);
          
          // Clear any existing selection and select the newly pasted shapes
          if (selectedShapeId) {
            await handleDeselectShape();
          }
          setSelectedShapes(newShapeIds.filter(Boolean) as string[]);
          
          toast.success(`Pasted ${clipboard.length} shape${clipboard.length > 1 ? 's' : ''}`, {
            duration: 1500,
            position: 'top-center',
          });
        } catch (error) {
          console.error('❌ PASTE ERROR - Failed to paste shapes:', error);
          toast.error('Failed to paste shapes', {
            duration: 2000,
            position: 'top-center',
          });
        }
        return;
      }

      // Arrow keys - Nudge shapes (10px default, 1px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        const NUDGE_AMOUNT = 10;
        const FINE_NUDGE_AMOUNT = 1;
        const nudgeAmount = e.shiftKey ? FINE_NUDGE_AMOUNT : NUDGE_AMOUNT;
        
        let dx = 0;
        let dy = 0;
        
        if (e.key === 'ArrowUp') dy = -nudgeAmount;
        if (e.key === 'ArrowDown') dy = nudgeAmount;
        if (e.key === 'ArrowLeft') dx = -nudgeAmount;
        if (e.key === 'ArrowRight') dx = nudgeAmount;
        
        // Nudge multi-selected shapes
        if (selectedShapes.length > 0) {
          const updates = selectedShapes.map(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (!shape) return null;
            return {
              shapeId,
              updates: { x: shape.x + dx, y: shape.y + dy }
            };
          }).filter(Boolean) as Array<{ shapeId: string; updates: Partial<ShapeData> }>;
          
          try {
            await batchUpdateShapes(updates);
          } catch (error) {
            console.error('Failed to nudge shapes:', error);
          }
        }
        // Nudge single selected shape
        else if (selectedShapeId) {
          const shape = shapes.find(s => s.id === selectedShapeId);
          if (shape) {
            try {
              await updateShape(selectedShapeId, { x: shape.x + dx, y: shape.y + dy });
            } catch (error) {
              console.error('Failed to nudge shape:', error);
            }
          }
        }
        return;
      }

      // Cmd/Ctrl + ] - Bring forward
      if (cmdKey && e.key === ']' && !e.shiftKey) {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          try {
            // Check if any selected shapes are in a group
            const selectedShapeObjects = shapes.filter(s => selectedShapes.includes(s.id));
            const hasGroupedShapes = selectedShapeObjects.some(s => s.groupId);
            
            let shapeIdsToBring = [...selectedShapes];
            
            // If any selected shape is in a group, make sure ALL shapes in that group are included
            if (hasGroupedShapes) {
              const groupIds = new Set(selectedShapeObjects.filter(s => s.groupId).map(s => s.groupId));
              
              // Find all shapes that belong to any of these groups
              const allGroupedShapeIds = shapes
                .filter(s => s.groupId && groupIds.has(s.groupId))
                .map(s => s.id);
              
              // Merge with selected shapes (remove duplicates)
              shapeIdsToBring = [...new Set([...selectedShapes, ...allGroupedShapeIds])];
              
              console.log('⬆️ BRING FORWARD - Including all grouped shapes:', {
                originalSelection: selectedShapes,
                groupIds: Array.from(groupIds),
                finalSelection: shapeIdsToBring,
              });
            }
            
            await batchBringForward(shapeIdsToBring);
            toast.success('Brought forward', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to bring forward:', error);
          }
        } else if (selectedShapeId) {
          try {
            await bringForward(selectedShapeId);
            toast.success('Brought forward', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to bring forward:', error);
          }
        }
        return;
      }

      // Cmd/Ctrl + [ - Send backward
      if (cmdKey && e.key === '[' && !e.shiftKey) {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          try {
            // Check if any selected shapes are in a group
            const selectedShapeObjects = shapes.filter(s => selectedShapes.includes(s.id));
            const hasGroupedShapes = selectedShapeObjects.some(s => s.groupId);
            
            let shapeIdsToSend = [...selectedShapes];
            
            // If any selected shape is in a group, make sure ALL shapes in that group are included
            if (hasGroupedShapes) {
              const groupIds = new Set(selectedShapeObjects.filter(s => s.groupId).map(s => s.groupId));
              
              // Find all shapes that belong to any of these groups
              const allGroupedShapeIds = shapes
                .filter(s => s.groupId && groupIds.has(s.groupId))
                .map(s => s.id);
              
              // Merge with selected shapes (remove duplicates)
              shapeIdsToSend = [...new Set([...selectedShapes, ...allGroupedShapeIds])];
              
              console.log('⬇️ SEND BACKWARD - Including all grouped shapes:', {
                originalSelection: selectedShapes,
                groupIds: Array.from(groupIds),
                finalSelection: shapeIdsToSend,
              });
            }
            
            await batchSendBackward(shapeIdsToSend);
            toast.success('Sent backward', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to send backward:', error);
          }
        } else if (selectedShapeId) {
          try {
            await sendBackward(selectedShapeId);
            toast.success('Sent backward', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to send backward:', error);
          }
        }
        return;
      }

      // Cmd/Ctrl + Shift + ] - Bring to front
      if (cmdKey && e.shiftKey && e.key === '}') { // Shift + ] = }
        e.preventDefault();
        if (selectedShapes.length > 0) {
          try {
            // Check if any selected shapes are in a group
            const selectedShapeObjects = shapes.filter(s => selectedShapes.includes(s.id));
            const hasGroupedShapes = selectedShapeObjects.some(s => s.groupId);
            
            let shapeIdsToBring = [...selectedShapes];
            
            // If any selected shape is in a group, make sure ALL shapes in that group are included
            if (hasGroupedShapes) {
              const groupIds = new Set(selectedShapeObjects.filter(s => s.groupId).map(s => s.groupId));
              
              // Find all shapes that belong to any of these groups
              const allGroupedShapeIds = shapes
                .filter(s => s.groupId && groupIds.has(s.groupId))
                .map(s => s.id);
              
              // Merge with selected shapes (remove duplicates)
              shapeIdsToBring = [...new Set([...selectedShapes, ...allGroupedShapeIds])];
              
              console.log('🔺 BRING TO FRONT - Including all grouped shapes:', {
                originalSelection: selectedShapes,
                groupIds: Array.from(groupIds),
                finalSelection: shapeIdsToBring,
              });
            }
            
            await batchBringToFront(shapeIdsToBring);
            toast.success('Brought to front', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to bring to front:', error);
          }
        } else if (selectedShapeId) {
          try {
            await bringToFront(selectedShapeId);
            toast.success('Brought to front', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to bring to front:', error);
          }
        }
        return;
      }

      // Cmd/Ctrl + Shift + [ - Send to back
      if (cmdKey && e.shiftKey && e.key === '{') { // Shift + [ = {
        e.preventDefault();
        if (selectedShapes.length > 0) {
          try {
            // Check if any selected shapes are in a group
            const selectedShapeObjects = shapes.filter(s => selectedShapes.includes(s.id));
            const hasGroupedShapes = selectedShapeObjects.some(s => s.groupId);
            
            let shapeIdsToSend = [...selectedShapes];
            
            // If any selected shape is in a group, make sure ALL shapes in that group are included
            if (hasGroupedShapes) {
              const groupIds = new Set(selectedShapeObjects.filter(s => s.groupId).map(s => s.groupId));
              
              // Find all shapes that belong to any of these groups
              const allGroupedShapeIds = shapes
                .filter(s => s.groupId && groupIds.has(s.groupId))
                .map(s => s.id);
              
              // Merge with selected shapes (remove duplicates)
              shapeIdsToSend = [...new Set([...selectedShapes, ...allGroupedShapeIds])];
              
              console.log('🔻 SEND TO BACK - Including all grouped shapes:', {
                originalSelection: selectedShapes,
                groupIds: Array.from(groupIds),
                finalSelection: shapeIdsToSend,
              });
            }
            
            await batchSendToBack(shapeIdsToSend);
            toast.success('Sent to back', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to send to back:', error);
          }
        } else if (selectedShapeId) {
          try {
            await sendToBack(selectedShapeId);
            toast.success('Sent to back', {
              duration: 1000,
              position: 'top-center',
            });
          } catch (error) {
            console.error('Failed to send to back:', error);
          }
        }
        return;
      }

      // Cmd/Ctrl + A - Select all shapes
      if (cmdKey && e.key === 'a') {
        e.preventDefault();
        const allShapeIds = shapes.map(s => s.id);
        setSelectedShapes(allShapeIds);
        if (allShapeIds.length > 0) {
          toast.success(`Selected ${allShapeIds.length} shape${allShapeIds.length > 1 ? 's' : ''}`, {
            duration: 1000,
            position: 'top-center',
          });
        }
        return;
      }

      // Cmd/Ctrl + 0 - Reset zoom to 100%
      if (cmdKey && e.key === '0') {
        e.preventDefault();
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
        toast.success('Reset zoom to 100%', {
          duration: 1000,
          position: 'top-center',
        });
        return;
      }

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
      if (cmdKey && e.key === 'd') {
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
  }, [
    selectedShapeId, 
    selectedShapes, 
    user, 
    isMarqueeActive,
    openCommentPanelShapeId,
    editingTextId,
    deleteShape, 
    duplicateShape,
    shapes,
    clipboard,
    setClipboard,
    createShape,
    createCircle,
    createTriangle,
    groupShapes,
    ungroupShapes,
    batchUpdateShapes,
    updateShape,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    batchBringForward,
    batchSendBackward,
    batchBringToFront,
    batchSendToBack,
    setStageScale,
    setStagePosition,
    setSelectedShapes,
    lastClickedShapeId,
    setLastClickedShapeId
  ]);

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

    // IMPORTANT: Check if clicking on a shape that's already part of a multi-selection FIRST
    // This prevents the group selection logic from overwriting a "select all" operation
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

  // Drawing handlers: Click-and-drag to create rectangles
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

      // Handle bomb mode - place bomb and explode
      if (activeTool === 'bomb') {
        handleBombClick(x, y);
        return;
      }

      // Handle text tool - create text at click position
      if (activeTool === 'text' && user) {
        try {
          const newTextId = await createText({
            x,
            y,
            color: selectedColor,
            createdBy: user.uid,
          });
          
          // Auto-enter edit mode for newly created text
          enterEdit(newTextId);
          
          toast.success('Text created', {
            duration: 1000,
            position: 'top-center',
          });
        } catch (error) {
          console.error('❌ Failed to create text:', error);
          toast.error('Failed to create text');
        }
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
      
      // Prepare batch updates for all selected shapes
      const batchUpdates: Array<{ shapeId: string; updates: { x: number; y: number } }> = [];
      
      for (const id of selectedShapes) {
        const targetShape = shapes.find(s => s.id === id);
        const targetInitialPos = multiDragInitialPositions.get(id);
        
        if (!targetShape) {
          console.error('❌ ERROR: Target shape not found:', id);
          continue;
        }
        
        if (!targetInitialPos) {
          console.error('❌ ERROR: Initial position not found for shape:', id);
          continue;
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
        
        // Add to batch updates
        batchUpdates.push({
          shapeId: id,
          updates: { x: clampedX, y: clampedY }
        });
      }
      
      // Send all updates in a single batch operation
      try {
        await batchUpdateShapes(batchUpdates);
        console.log('✅ All', selectedShapes.length, 'shapes updated atomically in Firestore');
      } catch (error) {
        console.error('❌ ERROR: Failed to batch update shapes:', error);
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

  // ============================================
  // Comment Handlers
  // ============================================

  // Helper function to mark all replies as read for a specific shape
  const markRepliesAsReadForShape = async (shapeId: string) => {
    if (!user) return;
    
    const shapeComments = comments.filter(
      c => c.shapeId === shapeId && c.userId === user.uid
    );
    
    for (const comment of shapeComments) {
      try {
        await markRepliesAsRead(comment.id, user.uid);
      } catch (error) {
        console.error('Error marking replies as read:', error);
      }
    }
  };

  const handleCommentIndicatorClick = async (shapeId: string) => {
    setOpenCommentPanelShapeId(shapeId);
  };

  const handleCommentPanelClose = async () => {
    // Mark all comments on this shape as read when closing the panel
    // This is a fallback for when user just views without taking action
    if (user && openCommentPanelShapeId) {
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    }
    
    setOpenCommentPanelShapeId(null);
  };

  const handleAddComment = async (text: string) => {
    if (!user || !openCommentPanelShapeId) return;
    
    try {
      await addComment(
        openCommentPanelShapeId,
        text,
        user.uid,
        user.displayName || user.email || 'Anonymous'
      );
      toast.success('Comment added');
      
      // Mark replies as read after user takes action (engagement indicates they've read)
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleAddReply = async (commentId: string, text: string) => {
    if (!user || !openCommentPanelShapeId) return;
    
    try {
      await addReply(
        commentId,
        user.uid,
        user.displayName || user.email || 'Anonymous',
        text
      );
      toast.success('Reply added');
      
      // Mark replies as read after user takes action (engagement indicates they've read)
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  const handleResolveComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await resolveComment(commentId, user.uid);
      toast.success('Comment resolved');
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await deleteComment(commentId, user.uid);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const handleDeleteReply = async (commentId: string, replyIndex: number) => {
    if (!user) return;
    
    try {
      await deleteReply(commentId, replyIndex, user.uid);
      toast.success('Reply deleted');
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
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
    }

    // Apply stage transforms
    const screenX = shapeX * stageScale + stagePosition.x;
    const screenY = shapeY * stageScale + stagePosition.y;
    const screenWidth = shapeWidth * stageScale;
    const screenHeight = shapeHeight * stageScale;

    return { screenX, screenY, screenWidth, screenHeight };
  };

  return (
    <>
    <div 
      ref={containerRef}
      style={{
        ...styles.canvasContainer,
        cursor: getCursorStyle(isDrawing, isPanning, activeTool, isSpacePressed),
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
          {!shapesLoading && shapes
            .slice()
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((shape) => {
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

            // Calculate comment info for this shape
            const shapeComments = comments.filter(c => c.shapeId === shape.id && !c.resolved);
            const commentCount = shapeComments.length;
            
            // Check if there are unread replies for the current user
            const hasUnreadReplies = user ? shapeComments.some(comment => {
              // Only check comments that belong to this shape and where the current user is the author
              if (comment.shapeId !== shape.id || comment.userId !== user.uid) {
                return false;
              }
              
              // Check if there are replies and if they haven't been read
              if (!comment.replies || comment.replies.length === 0) {
                return false;
              }
              
              // Check if there are any replies from OTHER users (not from the comment author themselves)
              const hasRepliesFromOthers = comment.replies.some(reply => reply.userId !== user.uid);
              if (!hasRepliesFromOthers) {
                return false; // Only own replies, don't show notification
              }
              
              // If there's a lastReplyAt timestamp
              if (comment.lastReplyAt) {
                const lastReadTimestamp = comment.replyReadStatus?.[user.uid];
                
                // If user has never read replies, or last read was before last reply
                if (!lastReadTimestamp) {
                  return true;
                }
                
                // Compare timestamps - convert to milliseconds for comparison
                const lastReadMs = lastReadTimestamp.toMillis ? lastReadTimestamp.toMillis() : lastReadTimestamp.seconds * 1000;
                const lastReplyMs = comment.lastReplyAt.toMillis ? comment.lastReplyAt.toMillis() : comment.lastReplyAt.seconds * 1000;
                
                return lastReplyMs > lastReadMs;
              }
              
              return false;
            }) : false;

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
                onTextDoubleClick={enterEdit}
                editingTextId={editingTextId}
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
            onSave={(text) => saveText(editingTextId, text)}
            onCancel={cancelEdit}
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

