import React, { useState } from 'react';
import type { CanvasMetadata } from '../../services/types/canvasTypes';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { RenameCanvasInline } from './RenameCanvasInline';
import { useAuth } from '../../hooks/useAuth';
import { CopyLinkButton } from './CopyLinkButton';
import './CanvasGallery.css';

interface CanvasCardProps {
  canvas: CanvasMetadata;
  onClick: (canvasId: string) => void;
  isLoading?: boolean;
  onRename?: (canvasId: string, newName: string) => Promise<void>;
}

/**
 * Canvas card component showing metadata for a single canvas
 */
export function CanvasCard({ canvas, onClick, isLoading = false, onRename }: CanvasCardProps) {
  const { userProfile } = useAuth();
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Check if current user is the owner
  const isOwner = userProfile?.uid === canvas.ownerId;
  const isShared = !isOwner; // Canvas is shared with user if they're not the owner
  
  const collaboratorText = canvas.collaboratorIds.length === 1
    ? 'Just you'
    : `${canvas.collaboratorIds.length} collaborators`;

  const shapeText = canvas.shapeCount === 1
    ? '1 shape'
    : `${canvas.shapeCount} shapes`;

  const handleClick = () => {
    if (!isLoading && !isRenaming) {
      onClick(canvas.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !isRenaming) {
      onClick(canvas.id);
    }
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleRenameSave = async (newName: string) => {
    if (onRename) {
      await onRename(canvas.id, newName);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
  };

  return (
    <div
      className={`canvas-card ${isLoading ? 'canvas-card-loading' : ''} ${isShared ? 'canvas-card-shared' : ''}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Canvas ${canvas.name}, last edited ${formatRelativeTime(canvas.lastAccessedAt)}, ${collaboratorText}, ${shapeText}`}
    >
      {isLoading && <div className="canvas-card-overlay">Loading...</div>}
      
      <div className="canvas-card-header">
        {isRenaming ? (
          <div onClick={(e) => e.stopPropagation()}>
            <RenameCanvasInline
              currentName={canvas.name}
              onSave={handleRenameSave}
              onCancel={handleRenameCancel}
            />
          </div>
        ) : (
          <>
            <h3 className="canvas-card-title">
              {isShared ? '👥' : '🎨'} {canvas.name}
            </h3>
            <div className="canvas-card-header-buttons">
              {onRename && isOwner && (
                <button
                  className="canvas-card-rename-button"
                  onClick={handleRenameClick}
                  aria-label={`Rename canvas ${canvas.name}`}
                  title="Rename canvas"
                >
                  ✏️
                </button>
              )}
              {isOwner && (
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyLinkButton canvasId={canvas.id} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="canvas-card-metadata">
        {isShared && (
          <div className="canvas-card-meta-item" style={{ 
            fontWeight: 'bold',
            borderBottom: '1px solid #808080',
            paddingBottom: '6px',
            marginBottom: '6px',
          }}>
            <span style={{ fontSize: '11px' }}>👥 Shared Canvas</span>
          </div>
        )}
        
        <div className="canvas-card-meta-item">
          <span className="canvas-card-meta-label">Last edited:</span>
          <span className="canvas-card-meta-value">
            {formatRelativeTime(canvas.lastAccessedAt)}
          </span>
        </div>

        <div className="canvas-card-meta-item">
          <span className="canvas-card-meta-label">👥</span>
          <span className="canvas-card-meta-value">{collaboratorText}</span>
        </div>

        <div className="canvas-card-meta-item">
          <span className="canvas-card-meta-label">🔷</span>
          <span className="canvas-card-meta-value">{shapeText}</span>
        </div>
      </div>

      <div className="canvas-card-footer">
        <span className="canvas-card-action">Click to open →</span>
      </div>
    </div>
  );
}

