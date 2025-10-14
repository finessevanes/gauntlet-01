import { ReactNode } from 'react';
import Navbar from './Navbar';
import ColorToolbar from '../Canvas/ColorToolbar';
import PresenceList from '../Collaboration/PresenceList';

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
          <aside style={styles.sidebar}>
            <PresenceList />
          </aside>
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
  sidebar: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 10,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  },
};

