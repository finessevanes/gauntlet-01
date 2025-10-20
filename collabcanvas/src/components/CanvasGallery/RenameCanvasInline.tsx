import React, { useState, useEffect, useRef } from 'react';
import './CanvasGallery.css';

interface RenameCanvasInlineProps {
  currentName: string;
  onSave: (newName: string) => Promise<void>;
  onCancel: () => void;
  autoFocus?: boolean;
}

/**
 * Inline canvas name editor with validation
 */
export function RenameCanvasInline({
  currentName,
  onSave,
  onCancel,
  autoFocus = true,
}: RenameCanvasInlineProps) {
  const [editingName, setEditingName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleSave = async () => {
    const trimmed = editingName.trim();

    // Validation
    if (trimmed.length === 0) {
      setError('Canvas name cannot be empty');
      return;
    }

    if (trimmed.length > 100) {
      setError('Canvas name too long (max 100 characters)');
      return;
    }

    // Save
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename canvas');
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Auto-save on blur (clicking outside)
    if (!saving && !error) {
      handleSave();
    }
  };

  return (
    <div className="rename-canvas-inline">
      <input
        ref={inputRef}
        type="text"
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={saving}
        className={`rename-canvas-input ${error ? 'rename-canvas-input-error' : ''}`}
        aria-label="Canvas name"
        aria-describedby={error ? 'rename-error' : undefined}
        maxLength={100}
      />
      
      {error && (
        <div id="rename-error" className="rename-canvas-error" role="alert">
          {error}
        </div>
      )}
      
      <div className="rename-canvas-counter">
        {editingName.length}/100 characters
      </div>
    </div>
  );
}


