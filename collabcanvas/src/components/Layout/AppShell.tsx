import type { ReactNode } from 'react';
import PaintTitleBar from './PaintTitleBar';
import ToolPalette from '../Canvas/ToolPalette';
import ColorPalette from '../Canvas/ColorPalette';
import StatusBar from './StatusBar';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { useCanvasContext } from '../../contexts/CanvasContext';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { stageScale } = useCanvasContext();

  return (
    <div style={styles.appShell}>
      <PaintTitleBar />
      <ToolPalette />
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

