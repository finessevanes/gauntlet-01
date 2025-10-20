import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useError } from '../../contexts/ErrorContext';
import NavbarPresence from '../Collaboration/NavbarPresence';
import { canvasListService } from '../../services/canvasListService';
import type { CanvasMetadata } from '../../services/types/canvasTypes';

interface PaintTitleBarProps {
  onNavigateToGallery?: () => void;
}

export default function PaintTitleBar({ onNavigateToGallery }: PaintTitleBarProps = {}) {
  const { logout } = useAuth();
  const { currentCanvasId } = useCanvasContext();
  const { showError } = useError();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [canvasMetadata, setCanvasMetadata] = useState<CanvasMetadata | null>(null);

  // Fetch canvas metadata when currentCanvasId changes
  useEffect(() => {
    const fetchCanvasMetadata = async () => {
      if (!currentCanvasId) {
        setCanvasMetadata(null);
        return;
      }
      
      try {
        const metadata = await canvasListService.getCanvasById(currentCanvasId);
        setCanvasMetadata(metadata);
      } catch (error) {
        console.error('Failed to fetch canvas metadata:', error);
        setCanvasMetadata(null);
      }
    };

    fetchCanvasMetadata();
  }, [currentCanvasId]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      showError(error.message || 'Failed to logout');
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
        {/* Title - Centered */}
        <div style={styles.title}>
          {canvasMetadata ? `${canvasMetadata.name} - Paint` : 'untitled - Paint'}
        </div>

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
          
          {/* Window Controls - Windows Style */}
          <div style={styles.windowControls}>
            <button style={styles.windowButton} title="Minimize">─</button>
            <button style={styles.windowButton} title="Maximize">□</button>
            <button style={styles.windowButton} title="Close">✕</button>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div style={styles.menuBar}>
        {/* Back to Gallery button (only show when on a canvas) */}
        {currentCanvasId && onNavigateToGallery && (
          <button
            onClick={onNavigateToGallery}
            style={styles.galleryButton}
            title="Back to Gallery"
          >
            ← Gallery
          </button>
        )}
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
            <div style={styles.modalWindowControls}>
              <button 
                style={styles.modalWindowButton}
                title="Minimize"
              >─</button>
              <button 
                style={styles.modalWindowButton}
                title="Maximize"
              >□</button>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                style={styles.modalWindowButton}
                className="modal-close-button"
                title="Close"
              >✕</button>
            </div>
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
                  <span style={styles.shortcutName}>Paste</span>
                  <span style={styles.shortcutKey}>⌘V</span>
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
    justifyContent: 'center',
    padding: '0 10px',
    position: 'relative' as const,
  },
  windowControls: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
    marginLeft: '8px',
  },
  windowButton: {
    width: '16px',
    height: '14px',
    backgroundColor: '#c0c0c0',
    border: '1px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0',
    padding: 0,
  },
  title: {
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
    position: 'absolute' as const,
    right: '10px',
  },
  logoutButton: {
    background: '#c0c0c0',
    border: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    color: '#000000',
    width: '24px',
    height: '24px',
    borderRadius: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
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
  galleryButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    cursor: 'pointer',
    border: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    background: '#c0c0c0',
    color: '#000000',
    fontWeight: 600,
    borderRadius: '0',
    marginLeft: '4px',
    marginRight: '8px',
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
    animation: 'fadeIn 0.15s ease-out',
  },
  modal: {
    backgroundColor: '#f0f0f0',
    border: '3px solid #0078d7',
    borderRadius: '0',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 1px 1px 0 rgba(255, 255, 255, 0.3)',
    maxWidth: '750px',
    width: '90%',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideIn 0.2s ease-out',
  },
  modalTitleBar: {
    background: 'linear-gradient(to bottom, #2c5fa8 0%, #1e4785 100%)',
    padding: '6px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #003d7a',
  },
  modalWindowControls: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  modalWindowButton: {
    width: '16px',
    height: '14px',
    backgroundColor: '#c0c0c0',
    border: '1px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '0.3px',
  },
  modalContent: {
    padding: '20px',
    overflowY: 'auto' as const,
    backgroundColor: '#ffffff',
    border: '1px solid #dfdfdf',
    borderTop: 'none',
  },
  shortcutsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '18px',
    marginBottom: '16px',
  },
  shortcutSection: {
    backgroundColor: '#f8f9fa',
    padding: '14px',
    borderRadius: '0',
    border: '2px solid #d0d0d0',
    boxShadow: 'inset 1px 1px 0 rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#1e4785',
    marginBottom: '10px',
    marginTop: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderBottom: '2px solid #2c5fa8',
    paddingBottom: '5px',
    letterSpacing: '0.3px',
  },
  shortcutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 10px',
    marginBottom: '5px',
    backgroundColor: '#ffffff',
    borderRadius: '0',
    border: '1px solid #d0d0d0',
    boxShadow: 'inset 1px 1px 0 rgba(0, 0, 0, 0.05)',
  },
  shortcutName: {
    fontSize: '12px',
    color: '#2d2d2d',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '500' as const,
  },
  shortcutKey: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#1e4785',
    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    backgroundColor: '#f4f4f4',
    padding: '4px 10px',
    borderRadius: '0',
    border: '1px solid #a8a8a8',
    boxShadow: '0 2px 0 #a8a8a8, inset 1px 1px 0 rgba(255, 255, 255, 0.8)',
    letterSpacing: '0.5px',
  },
  modalFooter: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '2px solid #d0d0d0',
    backgroundColor: '#f8f9fa',
    padding: '12px 16px',
    margin: '-20px -20px 0 -20px',
  },
  footerText: {
    fontSize: '11px',
    color: '#555555',
    margin: 0,
    textAlign: 'center' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '500' as const,
  },
};

