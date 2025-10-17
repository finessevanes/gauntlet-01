import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import NavbarPresence from '../Collaboration/NavbarPresence';

export default function PaintTitleBar() {
  const { logout } = useAuth();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const handleMenuClick = (menu: string) => {
    if (menu === 'Help') {
      setShowShortcutsModal(true);
    }
  };

  return (
    <>
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
          <div 
            key={menu} 
            style={styles.menuItem} 
            className="paint-menu-item"
            onClick={() => handleMenuClick(menu)}
          >
            {menu}
          </div>
        ))}
      </div>
    </div>

    {/* Keyboard Shortcuts Modal */}
    {showShortcutsModal && (
      <div style={styles.modalOverlay} onClick={() => setShowShortcutsModal(false)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Modal Title Bar */}
          <div style={styles.modalTitleBar}>
            <span style={styles.modalTitle}>Keyboard Shortcuts</span>
            <button 
              onClick={() => setShowShortcutsModal(false)}
              style={styles.closeButton}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div style={styles.modalContent}>
            <div style={styles.shortcutsGrid}>
              {/* Selection & Canvas */}
              <div style={styles.shortcutSection}>
                <h3 style={styles.sectionTitle}>Selection & Canvas</h3>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Select All</span>
                  <span style={styles.shortcutKey}>⌘A</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Clear Selection</span>
                  <span style={styles.shortcutKey}>Esc</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Reset Zoom</span>
                  <span style={styles.shortcutKey}>⌘0</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Pan Canvas</span>
                  <span style={styles.shortcutKey}>Space + Drag</span>
                </div>
              </div>

              {/* Shape Operations */}
              <div style={styles.shortcutSection}>
                <h3 style={styles.sectionTitle}>Shape Operations</h3>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Delete</span>
                  <span style={styles.shortcutKey}>Del</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Duplicate</span>
                  <span style={styles.shortcutKey}>⌘D</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Copy</span>
                  <span style={styles.shortcutKey}>⌘C</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Group Shapes</span>
                  <span style={styles.shortcutKey}>⌘G</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Ungroup Shapes</span>
                  <span style={styles.shortcutKey}>⌘⇧G</span>
                </div>
              </div>

              {/* Movement */}
              <div style={styles.shortcutSection}>
                <h3 style={styles.sectionTitle}>Movement</h3>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Nudge Shape</span>
                  <span style={styles.shortcutKey}>Arrow Keys</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Fine Nudge (1px)</span>
                  <span style={styles.shortcutKey}>⇧ + Arrow Keys</span>
                </div>
              </div>

              {/* Layer Order */}
              <div style={styles.shortcutSection}>
                <h3 style={styles.sectionTitle}>Layer Order (Z-Index)</h3>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Bring to Front</span>
                  <span style={styles.shortcutKey}>⌘⇧]</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Send to Back</span>
                  <span style={styles.shortcutKey}>⌘⇧[</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Bring Forward</span>
                  <span style={styles.shortcutKey}>⌘]</span>
                </div>
                <div style={styles.shortcutRow}>
                  <span style={styles.shortcutName}>Send Backward</span>
                  <span style={styles.shortcutKey}>⌘[</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div style={styles.modalFooter}>
              <p style={styles.footerText}>
                💡 Tip: Most shortcuts work with both single and multiple selected shapes
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
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
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    backgroundColor: '#f0f0f0',
    border: '2px solid #0078d7',
    borderRadius: '4px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  modalTitleBar: {
    background: 'linear-gradient(to bottom, #0078d7 0%, #0066c0 100%)',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '3px',
    transition: 'background-color 0.15s',
  },
  modalContent: {
    padding: '20px',
    overflowY: 'auto' as const,
    backgroundColor: '#ffffff',
  },
  shortcutsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '16px',
  },
  shortcutSection: {
    backgroundColor: '#f8f8f8',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#0078d7',
    marginBottom: '12px',
    marginTop: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderBottom: '2px solid #0078d7',
    paddingBottom: '6px',
  },
  shortcutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    marginBottom: '4px',
    backgroundColor: '#ffffff',
    borderRadius: '3px',
    border: '1px solid #e8e8e8',
  },
  shortcutName: {
    fontSize: '12px',
    color: '#333333',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  shortcutKey: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#0078d7',
    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #d0d0d0',
    boxShadow: '0 2px 0 #d0d0d0',
  },
  modalFooter: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  footerText: {
    fontSize: '11px',
    color: '#666666',
    margin: 0,
    textAlign: 'center' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
};

