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
    lockShape
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

