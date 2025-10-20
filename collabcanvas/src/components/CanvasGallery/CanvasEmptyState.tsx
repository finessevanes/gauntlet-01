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
        Canvases are collaborative drawing spaces where you can create shapes, collaborate with others, and chat with Clippy AI.
      </p>
      <p className="empty-state-description">
        Click the <strong>"Create New Canvas"</strong> button above to get started!
      </p>
    </div>
  );
}

