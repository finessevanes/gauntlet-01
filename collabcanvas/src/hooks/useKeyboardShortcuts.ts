import { useEffect } from 'react';
import toast from 'react-hot-toast';
import type { ShapeData } from '../services/canvasService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

interface UseKeyboardShortcutsProps {
  user: { uid: string; displayName?: string | null; email?: string | null } | null;
  selectedShapeId: string | null;
  selectedShapes: string[];
  shapes: ShapeData[];
  clipboard: ShapeData[] | null;
  lastClickedShapeId: string | null;
  isMarqueeActive: boolean;
  openCommentPanelShapeId: string | null;
  editingTextId: string | null;
  isAlignmentToolbarMinimized: boolean;
  setSelectedShapeId: (id: string | null) => void;
  setSelectedShapes: (ids: string[]) => void;
  setClipboard: (shapes: ShapeData[]) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  unlockShape: (shapeId: string) => Promise<void>;
  deleteShape: (shapeId: string) => Promise<void>;
  duplicateShape: (shapeId: string, userId: string) => Promise<string>;
  groupShapes: (shapeIds: string[], userId: string) => Promise<string>;
  ungroupShapes: (groupId: string) => Promise<void>;
  batchUpdateShapes: (updates: Array<{ shapeId: string; updates: Partial<ShapeData> }>) => Promise<void>;
  updateShape: (shapeId: string, updates: Partial<ShapeData>) => Promise<void>;
  createShape: (data: Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt' | 'groupId' | 'zIndex'> & { groupId?: string | null; zIndex?: number }) => Promise<string>;
  createCircle: (circleData: { x: number; y: number; radius: number; color: string; createdBy: string }) => Promise<string>;
  createTriangle: (triangleData: { x: number; y: number; width: number; height: number; color: string; createdBy: string }) => Promise<string>;
  createText: (textData: { x: number; y: number; color: string; createdBy: string }) => Promise<string>;
  lockShape: (shapeId: string, userId: string) => Promise<{ success: boolean; lockedByUsername?: string }>;
  batchBringToFront: (shapeIds: string[]) => Promise<void>;
  batchSendToBack: (shapeIds: string[]) => Promise<void>;
  batchBringForward: (shapeIds: string[]) => Promise<void>;
  batchSendBackward: (shapeIds: string[]) => Promise<void>;
  bringToFront: (shapeId: string) => Promise<void>;
  sendToBack: (shapeId: string) => Promise<void>;
  bringForward: (shapeId: string) => Promise<void>;
  sendBackward: (shapeId: string) => Promise<void>;
}

export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps) {
  const {
    user,
    selectedShapeId,
    selectedShapes,
    shapes,
    clipboard,
    lastClickedShapeId,
    isMarqueeActive,
    openCommentPanelShapeId,
    editingTextId,
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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Space key handling for panning
      if (e.key === ' ') {
        // Don't intercept space if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return; // Let the input handle the space
        }
        e.preventDefault(); // Prevent page scrolling
        setIsSpacePressed(true);
        return; // Don't process other shortcuts when space is pressed
      }

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
          console.log('✅ Copied shapes to clipboard:', shapesToCopy);
        } else if (selectedShapeId) {
          const shapeToCopy = shapes.find(s => s.id === selectedShapeId);
          if (shapeToCopy) {
            setClipboard([shapeToCopy]);
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
            } else if (shape.type === 'text') {
              // Handle text shapes with proper undefined filtering
              const textShapeData: any = {
                type: 'text',
                x: newX,
                y: newY,
                width: shape.width,
                height: shape.height,
                color: shape.color,
                rotation: shape.rotation || 0,
                text: shape.text,
                fontSize: shape.fontSize,
                createdBy: user.uid,
              };
              
              // Only add font properties if they are defined
              if (shape.fontWeight !== undefined) {
                textShapeData.fontWeight = shape.fontWeight;
              }
              if (shape.fontStyle !== undefined) {
                textShapeData.fontStyle = shape.fontStyle;
              }
              if (shape.textDecoration !== undefined) {
                textShapeData.textDecoration = shape.textDecoration;
              }
              
              return await createText(textShapeData);
            }
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
        // Don't intercept arrow keys if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
          return;
        }
        
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
          } catch (error) {
            console.error('Failed to bring forward:', error);
          }
        } else if (selectedShapeId) {
          try {
            await bringForward(selectedShapeId);
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
          } catch (error) {
            console.error('Failed to send backward:', error);
          }
        } else if (selectedShapeId) {
          try {
            await sendBackward(selectedShapeId);
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
          } catch (error) {
            console.error('Failed to bring to front:', error);
          }
        } else if (selectedShapeId) {
          try {
            await bringToFront(selectedShapeId);
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
          } catch (error) {
            console.error('Failed to send to back:', error);
          }
        } else if (selectedShapeId) {
          try {
            await sendToBack(selectedShapeId);
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
        return;
      }

      // Cmd/Ctrl + 0 - Reset zoom to 100%
      if (cmdKey && e.key === '0') {
        e.preventDefault();
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
        return;
      }

      // Delete key - batch delete or single delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete shapes if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return; // Let the input handle the key
        }
        
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
  }, [
    selectedShapeId, 
    selectedShapes, 
    user, 
    isMarqueeActive,
    openCommentPanelShapeId,
    editingTextId,
    shapes,
    clipboard,
    lastClickedShapeId
  ]);
}

