import React from 'react';
import type { CanvasMetadata } from '../../services/types/canvasTypes';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import './CanvasGallery.css';

interface CanvasCardProps {
  canvas: CanvasMetadata;
  onClick: (canvasId: string) => void;
  isLoading?: boolean;
}

/**
 * Canvas card component showing metadata for a single canvas
 */
export function CanvasCard({ canvas, onClick, isLoading = false }: CanvasCardProps) {
  const collaboratorText = canvas.collaboratorIds.length === 1
    ? 'Just you'
    : `${canvas.collaboratorIds.length} collaborators`;

  const shapeText = canvas.shapeCount === 1
    ? '1 shape'
    : `${canvas.shapeCount} shapes`;

  const handleClick = () => {
    if (!isLoading) {
      onClick(canvas.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onClick(canvas.id);
    }
  };

  return (
    <div
      className={`canvas-card ${isLoading ? 'canvas-card-loading' : ''}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Canvas ${canvas.name}, last edited ${formatRelativeTime(canvas.lastAccessedAt)}, ${collaboratorText}, ${shapeText}`}
    >
      {isLoading && <div className="canvas-card-overlay">Loading...</div>}
      
      <div className="canvas-card-header">
        <h3 className="canvas-card-title">🎨 {canvas.name}</h3>
      </div>

      <div className="canvas-card-metadata">
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

