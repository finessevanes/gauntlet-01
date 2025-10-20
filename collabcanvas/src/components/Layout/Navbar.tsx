import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { useCanvasRename } from '../../hooks/useCanvasRename';
import { canvasListService } from '../../services/canvasListService';
import type { CanvasMetadata } from '../../services/types/canvasTypes';
import toast from 'react-hot-toast';
import NavbarPresence from '../Collaboration/NavbarPresence';
import ShareButton from '../Canvas/ShareButton';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const { currentCanvasId } = useCanvas();
  const { renameCanvas } = useCanvasRename();
  const [canvasMetadata, setCanvasMetadata] = useState<CanvasMetadata | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Fetch canvas metadata when canvasId changes
  useEffect(() => {
    if (currentCanvasId) {
      canvasListService.getCanvasById(currentCanvasId).then((metadata) => {
        setCanvasMetadata(metadata);
      });
    } else {
      setCanvasMetadata(null);
    }
  }, [currentCanvasId]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const handleRenameSave = async (newName: string) => {
    if (currentCanvasId) {
      await renameCanvas(currentCanvasId, newName);
      // Update local state
      const updatedMetadata = await canvasListService.getCanvasById(currentCanvasId);
      setCanvasMetadata(updatedMetadata);
    }
    setIsEditingName(false);
  };

  const handleRenameCancel = () => {
    setIsEditingName(false);
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <h1 style={styles.logo}>CollabCanvas</h1>
          {canvasMetadata && !isEditingName && (
            <button
              onClick={() => setIsEditingName(true)}
              style={styles.canvasNameButton}
              title="Click to rename canvas"
            >
              <span style={styles.canvasName}>📄 {canvasMetadata.name}</span>
              <span style={styles.editIcon}>✏️</span>
            </button>
          )}
          {canvasMetadata && isEditingName && (
            <div style={styles.renameContainer}>
              <input
                type="text"
                defaultValue={canvasMetadata.name}
                onBlur={(e) => handleRenameSave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSave(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    handleRenameCancel();
                  }
                }}
                autoFocus
                style={styles.renameInput}
                maxLength={100}
              />
            </div>
          )}
          {userProfile && (
            <div style={styles.userBadge}>
              <div
                style={{
                  ...styles.colorDot,
                  backgroundColor: userProfile.cursorColor,
                }}
              />
              <span style={styles.username}>{userProfile.username}</span>
            </div>
          )}
        </div>

        <div style={styles.rightSection}>
          <NavbarPresence />
          {canvasMetadata && userProfile && (
            <ShareButton
              canvasId={currentCanvasId || ''}
              isOwner={canvasMetadata.ownerId === userProfile.uid}
            />
          )}
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    maxWidth: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#3b82f6',
  },
  canvasNameButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  canvasName: {
    fontWeight: '500',
    color: '#374151',
  },
  editIcon: {
    fontSize: '0.75rem',
    opacity: 0.5,
  },
  renameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  renameInput: {
    padding: '0.5rem 0.75rem',
    border: '2px solid #3b82f6',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    outline: 'none',
    minWidth: '200px',
  } as React.CSSProperties,
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
  },
  username: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};

