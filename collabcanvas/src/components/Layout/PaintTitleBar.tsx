import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import NavbarPresence from '../Collaboration/NavbarPresence';

export default function PaintTitleBar() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  return (
    <div style={styles.titleBarContainer}>
      {/* Title Bar */}
      <div style={styles.titleBar}>
        {/* macOS Window Controls */}
        <div style={styles.windowControls}>
          <div style={{ ...styles.windowButton, backgroundColor: '#ff5f56' }} />
          <div style={{ ...styles.windowButton, backgroundColor: '#ffbd2e' }} />
          <div style={{ ...styles.windowButton, backgroundColor: '#27c93f' }} />
        </div>

        {/* Title */}
        <div style={styles.title}>untitled - Paint</div>

        {/* Right Controls */}
        <div style={styles.rightControls}>
          <NavbarPresence />
          <button 
            onClick={handleLogout}
            style={styles.logoutButton}
            title="Log Out"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div style={styles.menuBar}>
        {['File', 'Edit', 'View', 'Image', 'Options', 'Help'].map((menu) => (
          <div key={menu} style={styles.menuItem} className="paint-menu-item">
            {menu}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  titleBarContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #c0c0c0',
  },
  titleBar: {
    height: '40px',
    background: 'linear-gradient(to bottom, #2c5fa8 0%, #1e4785 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    position: 'relative' as const,
  },
  windowControls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  windowButton: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
  },
  title: {
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#ffffff',
    fontSize: '13px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '400',
    letterSpacing: '0.3px',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoutButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    width: '24px',
    height: '24px',
    borderRadius: '3px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'background-color 0.15s',
  },
  menuBar: {
    display: 'flex',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #c0c0c0',
    padding: '0',
    height: '26px',
  },
  menuItem: {
    padding: '4px 12px',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    cursor: 'pointer',
    userSelect: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    color: '#000000',
    transition: 'background-color 0.1s',
  },
};

