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
    updateTextFormatting,
    updateTextFontSize 
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

  return (
    <div style={styles.appShell}>
      <PaintTitleBar />
      <ToolPalette 
        selectedShape={selectedShape}
        onToggleBold={handleToggleBold}
        onToggleItalic={handleToggleItalic}
        onToggleUnderline={handleToggleUnderline}
        onChangeFontSize={handleChangeFontSize}
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

