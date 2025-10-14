import type { ReactNode } from 'react';
import Navbar from './Navbar';
import ColorToolbar from '../Canvas/ColorToolbar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={styles.appShell}>
      <Navbar />
      <div style={styles.mainArea}>
        <ColorToolbar />
        <div style={styles.canvasArea}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  appShell: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    marginTop: '64px', // Navbar height
    overflow: 'hidden',
  },
  canvasArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
  },
};

