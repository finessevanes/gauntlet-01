import { useState, useEffect, useCallback } from 'react';
import { useShareCanvas } from '../../hooks/useShareCanvas';
import CollaboratorsList from './CollaboratorsList';
import toast from 'react-hot-toast';
import './ShareModal.css';

export interface ShareModalProps {
  canvasId: string;
  canvasName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ShareModal - Modal for canvas sharing (90s/00s Windows style)
 * Displays shareable link, copy button, warning, and collaborators list
 */
export default function ShareModal({ canvasId, canvasName, isOpen, onClose }: ShareModalProps) {
  const {
    shareableLink,
    copyLinkToClipboard,
    collaborators,
    loadingCollaborators,
    refreshCollaborators,
  } = useShareCanvas(canvasId);

  const [copyButtonText, setCopyButtonText] = useState('Copy Link');
  const [isCopyButtonGreen, setIsCopyButtonGreen] = useState(false);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    const success = await copyLinkToClipboard();
    
    if (success) {
      setCopyButtonText('✓ Copied!');
      setIsCopyButtonGreen(true);
      toast.success('Link copied to clipboard!');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setCopyButtonText('Copy Link');
        setIsCopyButtonGreen(false);
      }, 2000);
    } else {
      toast.error('Failed to copy link. Please copy manually.');
    }
  }, [copyLinkToClipboard]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-select link text on click
  const handleLinkClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="share-modal-backdrop"
        onClick={onClose}
        style={styles.backdrop}
      />
      
      {/* Modal */}
      <div 
        className="share-modal"
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Title Bar */}
        <div style={styles.titleBar}>
          <span id="share-modal-title" style={styles.title}>
            Share Canvas
          </span>
          <button
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div style={styles.content}>
          {/* Shareable Link Section */}
          <div style={styles.section}>
            <label style={styles.label}>Share Link</label>
            <div style={styles.linkContainer}>
              <input
                type="text"
                value={shareableLink}
                readOnly
                onClick={handleLinkClick}
                style={styles.linkInput}
                aria-label="Shareable link"
              />
              <button
                onClick={handleCopyLink}
                style={{
                  ...styles.copyButton,
                  backgroundColor: isCopyButtonGreen ? '#90ee90' : '#c0c0c0',
                }}
                onMouseEnter={(e) => {
                  if (!isCopyButtonGreen) {
                    e.currentTarget.style.backgroundColor = '#d0d0d0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCopyButtonGreen) {
                    e.currentTarget.style.backgroundColor = '#c0c0c0';
                  }
                }}
              >
                {copyButtonText}
              </button>
            </div>
          </div>

          {/* Warning Notice */}
          <div style={styles.warning}>
            <span style={styles.warningIcon}>⚠️</span>
            <div style={styles.warningText}>
              <strong>WARNING:</strong> Only share this link with people you trust. 
              Anyone with the link can edit your canvas.
            </div>
          </div>

          {/* Separator */}
          <div style={styles.separator} />

          {/* Collaborators Section */}
          <div style={styles.section}>
            <label style={styles.label}>
              People with access ({collaborators.length})
            </label>
            <CollaboratorsList
              canvasId={canvasId}
              collaborators={collaborators}
              loading={loadingCollaborators}
            />
          </div>

          {/* Close Button */}
          <div style={styles.footer}>
            <button
              onClick={onClose}
              style={styles.closeFooterButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d0d0d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#c0c0c0';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  modal: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    backgroundColor: '#c0c0c0',
    border: '2px outset #c0c0c0',
    boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 2001,
    fontFamily: "'MS Sans Serif', 'Segoe UI', sans-serif",
  },
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.3rem 0.5rem',
    backgroundColor: '#000080',
    color: 'white',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
  },
  closeButton: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c0c0c0',
    border: '1px outset #c0c0c0',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    padding: 0,
  },
  content: {
    padding: '1rem',
    backgroundColor: '#c0c0c0',
    maxHeight: 'calc(80vh - 40px)',
    overflowY: 'auto' as const,
  },
  section: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.5rem',
    color: '#000',
  },
  linkContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  linkInput: {
    flex: 1,
    padding: '0.4rem 0.6rem',
    border: '2px inset #808080',
    backgroundColor: '#f0f0f0',
    fontSize: '0.75rem',
    fontFamily: "'Courier New', 'Consolas', monospace",
    color: '#000',
    outline: 'none',
  } as React.CSSProperties,
  copyButton: {
    padding: '0.4rem 1rem',
    backgroundColor: '#c0c0c0',
    border: '2px outset #c0c0c0',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.1s',
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#ffffe0',
    border: '2px solid #000',
    marginBottom: '1rem',
  },
  warningIcon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '0.75rem',
    lineHeight: '1.4',
    color: '#000',
  },
  separator: {
    height: '2px',
    backgroundColor: '#808080',
    margin: '1rem 0',
    border: 'none',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1.5rem',
  },
  closeFooterButton: {
    padding: '0.5rem 2rem',
    backgroundColor: '#c0c0c0',
    border: '2px outset #c0c0c0',
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    minWidth: '100px',
  },
};

