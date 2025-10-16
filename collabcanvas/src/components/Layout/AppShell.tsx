import type { ReactNode } from 'react';
import PaintTitleBar from './PaintTitleBar';
import ToolPalette from '../Canvas/ToolPalette';
import ColorPalette from '../Canvas/ColorPalette';
import StatusBar from './StatusBar';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const { 
    stageScale, 
    shapes, 
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    updateTextFormatting,
    updateTextFontSize,
    deleteShape,
    duplicateShape,
    unlockShape,
    lockShape,
    groupShapes,
    ungroupShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    batchBringToFront,
    batchSendToBack,
    batchBringForward,
    batchSendBackward
  } = useCanvasContext();

  // Get the currently selected shape
  const selectedShape = selectedShapeId ? shapes.find(s => s.id === selectedShapeId) || null : null;

  // Helper: Get lock status for a shape
  const getShapeLockStatus = (shape: typeof selectedShape): 'locked-by-me' | 'locked-by-other' | 'unlocked' => {
    if (!user || !shape) return 'unlocked';
    
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

  // Check if text formatting is disabled (when shape is not locked by current user)
  const lockStatus = selectedShape ? getShapeLockStatus(selectedShape) : 'unlocked';
  const textFormattingDisabled = lockStatus !== 'locked-by-me';

  // Text formatting handlers
  const handleToggleBold = async () => {
    if (!selectedShapeId || !selectedShape || selectedShape.type !== 'text') return;
    const newWeight = selectedShape.fontWeight === 'bold' ? 'normal' : 'bold';
    try {
      await updateTextFormatting(selectedShapeId, { fontWeight: newWeight });
    } catch (error) {
      console.error('❌ Failed to toggle bold:', error);
      toast.error('Failed to update formatting', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleToggleItalic = async () => {
    if (!selectedShapeId || !selectedShape || selectedShape.type !== 'text') return;
    const newStyle = selectedShape.fontStyle === 'italic' ? 'normal' : 'italic';
    try {
      await updateTextFormatting(selectedShapeId, { fontStyle: newStyle });
    } catch (error) {
      console.error('❌ Failed to toggle italic:', error);
      toast.error('Failed to update formatting', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleToggleUnderline = async () => {
    if (!selectedShapeId || !selectedShape || selectedShape.type !== 'text') return;
    const newDecoration = selectedShape.textDecoration === 'underline' ? 'none' : 'underline';
    try {
      await updateTextFormatting(selectedShapeId, { textDecoration: newDecoration });
    } catch (error) {
      console.error('❌ Failed to toggle underline:', error);
      toast.error('Failed to update formatting', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleChangeFontSize = async (fontSize: number) => {
    if (!selectedShapeId || !selectedShape || selectedShape.type !== 'text') return;
    try {
      await updateTextFontSize(selectedShapeId, fontSize);
    } catch (error) {
      console.error('❌ Failed to change font size:', error);
      toast.error('Failed to update font size', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  // Shape action handlers
  const handleDelete = async () => {
    if (!user) return;
    
    // Check if we have multiple shapes selected (batch delete)
    if (selectedShapes.length > 0) {
      console.log('🗑️ BATCH DELETE (Button) - Deleting', selectedShapes.length, 'shapes');
      try {
        // Delete all selected shapes in parallel
        const deletePromises = selectedShapes.map(shapeId => deleteShape(shapeId));
        await Promise.all(deletePromises);
        
        console.log('✅ BATCH DELETE SUCCESS (Button) - All', selectedShapes.length, 'shapes deleted');
        
        // Clear selection after delete
        setSelectedShapes([]);
        
        toast.success(`${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''} deleted`, {
          duration: 1500,
          position: 'top-center',
        });
      } catch (error) {
        console.error('❌ BATCH DELETE ERROR (Button):', error);
        toast.error('Failed to delete shapes', {
          duration: 2000,
          position: 'top-center',
        });
      }
      return;
    }
    
    // Single shape deletion (fallback)
    if (selectedShapeId) {
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
  };

  const handleDuplicate = async () => {
    if (!user) return;
    
    // Check if we have multiple shapes selected (batch duplicate)
    if (selectedShapes.length > 0) {
      console.log('📋 BATCH DUPLICATE (Button) - Duplicating', selectedShapes.length, 'shapes');
      try {
        // Duplicate all selected shapes in parallel
        const duplicatePromises = selectedShapes.map(shapeId => duplicateShape(shapeId, user.uid));
        const newShapeIds = await Promise.all(duplicatePromises);
        
        console.log('✅ BATCH DUPLICATE SUCCESS (Button) - All', selectedShapes.length, 'shapes duplicated');
        
        // Clear original selection and select only the duplicates
        setSelectedShapes(newShapeIds);
        
        toast.success(`${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''} duplicated`, {
          duration: 1500,
          position: 'top-center',
        });
      } catch (error) {
        console.error('❌ BATCH DUPLICATE ERROR (Button):', error);
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
        console.error('❌ Failed to duplicate shape:', error);
        toast.error('Failed to duplicate shape', {
          duration: 2000,
          position: 'top-center',
        });
      }
    }
  };

  // Grouping handlers
  const handleGroup = async () => {
    if (!user || selectedShapes.length < 2) return;
    
    try {
      const groupId = await groupShapes(selectedShapes, user.uid);
      console.log('✅ Group created:', groupId);
      toast.success(`${selectedShapes.length} shapes grouped`, {
        duration: 1500,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to group shapes:', error);
      toast.error('Failed to group shapes', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleUngroup = async () => {
    if (!user || selectedShapes.length === 0) return;
    
    // Find groupId from selected shapes
    const groupId = shapes.find(s => selectedShapes.includes(s.id))?.groupId;
    if (!groupId) {
      toast.error('No group to ungroup', {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }
    
    try {
      await ungroupShapes(groupId);
      console.log('✅ Group ungrouped:', groupId);
      toast.success('Shapes ungrouped', {
        duration: 1500,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to ungroup shapes:', error);
      toast.error('Failed to ungroup shapes', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  // Z-Index handlers
  const handleBringToFront = async () => {
    // Handle both single and multi-selection
    const targetIds = selectedShapes.length > 0 ? selectedShapes : (selectedShapeId ? [selectedShapeId] : []);
    if (targetIds.length === 0) return;
    
    try {
      // Use batch operation for multiple shapes (atomic update)
      if (targetIds.length > 1) {
        await batchBringToFront(targetIds);
      } else {
        await bringToFront(targetIds[0]);
      }
      
      const message = targetIds.length > 1 
        ? `${targetIds.length} shapes brought to front`
        : 'Brought to front';
      
      toast.success(message, {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to bring to front:', error);
      toast.error('Failed to bring to front', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleSendToBack = async () => {
    // Handle both single and multi-selection
    const targetIds = selectedShapes.length > 0 ? selectedShapes : (selectedShapeId ? [selectedShapeId] : []);
    if (targetIds.length === 0) return;
    
    try {
      // Use batch operation for multiple shapes (atomic update)
      if (targetIds.length > 1) {
        await batchSendToBack(targetIds);
      } else {
        await sendToBack(targetIds[0]);
      }
      
      const message = targetIds.length > 1 
        ? `${targetIds.length} shapes sent to back`
        : 'Sent to back';
      
      toast.success(message, {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to send to back:', error);
      toast.error('Failed to send to back', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleBringForward = async () => {
    // Handle both single and multi-selection
    const targetIds = selectedShapes.length > 0 ? selectedShapes : (selectedShapeId ? [selectedShapeId] : []);
    if (targetIds.length === 0) return;
    
    try {
      // Use batch operation for multiple shapes (atomic update)
      if (targetIds.length > 1) {
        await batchBringForward(targetIds);
      } else {
        await bringForward(targetIds[0]);
      }
      
      const message = targetIds.length > 1 
        ? `${targetIds.length} shapes brought forward`
        : 'Brought forward';
      
      toast.success(message, {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to bring forward:', error);
      toast.error('Failed to bring forward', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  const handleSendBackward = async () => {
    // Handle both single and multi-selection
    const targetIds = selectedShapes.length > 0 ? selectedShapes : (selectedShapeId ? [selectedShapeId] : []);
    if (targetIds.length === 0) return;
    
    try {
      // Use batch operation for multiple shapes (atomic update)
      if (targetIds.length > 1) {
        await batchSendBackward(targetIds);
      } else {
        await sendBackward(targetIds[0]);
      }
      
      const message = targetIds.length > 1 
        ? `${targetIds.length} shapes sent backward`
        : 'Sent backward';
      
      toast.success(message, {
        duration: 1000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('❌ Failed to send backward:', error);
      toast.error('Failed to send backward', {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

  return (
    <div style={styles.appShell}>
      <PaintTitleBar />
      <ToolPalette 
        selectedShape={selectedShape}
        selectedShapes={selectedShapes}
        onToggleBold={handleToggleBold}
        onToggleItalic={handleToggleItalic}
        onToggleUnderline={handleToggleUnderline}
        onChangeFontSize={handleChangeFontSize}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        textFormattingDisabled={textFormattingDisabled}
      />
      <div style={styles.mainArea}>
        <div style={styles.canvasArea}>
          {children}
        </div>
      </div>
      <ColorPalette />
      <StatusBar 
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        zoom={stageScale}
        selectedShapes={selectedShapes}
        shapes={shapes}
      />
    </div>
  );
}

const styles = {
  appShell: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    marginTop: '67px', // Title bar + menu bar height
    marginLeft: '70px', // Tool palette width
    marginBottom: '64px', // Color palette + status bar height
    overflow: 'hidden',
  },
  canvasArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
  },
};

