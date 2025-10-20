import { useState, useEffect, useRef } from 'react';
import './CanvasGallery.css';

interface CreateCanvasModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  isCreating: boolean;
}

/**
 * Modal for creating a new canvas with custom name
 */
export function CreateCanvasModal({ onConfirm, onCancel, isCreating }: CreateCanvasModalProps) {
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select the input when modal opens
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleConfirm = () => {
    const trimmed = canvasName.trim();

    // Validation
    if (trimmed.length === 0) {
      setError('Canvas name cannot be empty');
      return;
    }

    if (trimmed.length > 100) {
      setError('Canvas name too long (max 100 characters)');
      return;
    }

    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleConfirm();
    } else if (e.key === 'Escape' && !isCreating) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content create-canvas-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Title Bar - Windows 95 Style */}
        <div className="modal-title-bar">
          <span className="modal-title">Create New Canvas</span>
          <button 
            className="modal-close-button" 
            onClick={onCancel}
            disabled={isCreating}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <label htmlFor="canvas-name-input" className="modal-label">
            Canvas Name:
          </label>
          
          <input
            ref={inputRef}
            id="canvas-name-input"
            type="text"
            value={canvasName}
            onChange={(e) => {
              setCanvasName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isCreating}
            className={`modal-input ${error ? 'modal-input-error' : ''}`}
            maxLength={100}
          />

          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-character-count">
            {canvasName.length}/100 characters
          </div>

          <div className="modal-hint">
            Examples: "Marketing Deck", "Wireframe - Homepage"
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="modal-button modal-button-secondary"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            className="modal-button modal-button-primary"
            onClick={handleConfirm}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="spinner-small"></span>
                <span>Creating...</span>
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

