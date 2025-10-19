import React from 'react';
import './CanvasGallery.css';

/**
 * Empty state shown when user has no canvases
 */
export function CanvasEmptyState() {
  return (
    <div className="canvas-empty-state">
      <div className="empty-state-icon">📋</div>
      <h2 className="empty-state-title">Welcome! You don't have any canvases yet.</h2>
      <p className="empty-state-description">
        Canvases are collaborative drawing spaces where you can create shapes and chat with Clippy.
      </p>
      <button 
        className="empty-state-button" 
        disabled
        title="Canvas creation coming in PR #13"
      >
        Create New Canvas - Coming Soon!
      </button>
      <p className="empty-state-hint">
        Canvas creation will be available in the next update (PR #13)
      </p>
    </div>
  );
}

