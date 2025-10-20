import { useState, useEffect, useCallback } from 'react';
import { useShareCanvas } from '../../hooks/useShareCanvas';
import CollaboratorsList from './CollaboratorsList';
import toast from 'react-hot-toast';
import '../CanvasGallery/CanvasGallery.css';

export interface ShareModalProps {
  canvasId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ShareModal - Modal for canvas sharing (90s/00s Windows style)
 * Displays shareable link, copy button, warning, and collaborators list
 */
export default function ShareModal({ canvasId, isOpen, onClose }: ShareModalProps) {
  const {
    shareableLink,
    copyLinkToClipboard,
    collaborators,
    loadingCollaborators,
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Modal Title Bar - Windows 95 Style */}
        <div className="modal-title-bar">
          <span id="share-modal-title" className="modal-title">
            🔗 Share Canvas
          </span>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Shareable Link Section */}
          <label htmlFor="share-link-input" className="modal-label">
            Share Link:
          </label>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              id="share-link-input"
              type="text"
              value={shareableLink}
              readOnly
              onClick={handleLinkClick}
              className="modal-input"
              aria-label="Shareable link"
              style={{ 
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontSize: '11px',
              }}
            />
            <button
              onClick={handleCopyLink}
              className="modal-button"
              style={{
                backgroundColor: isCopyButtonGreen ? '#90ee90' : undefined,
                minWidth: '90px',
              }}
            >
              {copyButtonText}
            </button>
          </div>

          {/* Warning Notice */}
          <div style={{
            backgroundColor: '#ffffe0',
            border: '2px solid #000',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <strong>WARNING:</strong> Only share this link with people you trust. 
              Anyone with the link can edit your canvas.
            </div>
          </div>

          {/* Collaborators Section */}
          <label className="modal-label">
            👥 People with access ({collaborators.length})
          </label>
          
          <CollaboratorsList
            canvasId={canvasId}
            collaborators={collaborators}
            loading={loadingCollaborators}
          />
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="modal-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

