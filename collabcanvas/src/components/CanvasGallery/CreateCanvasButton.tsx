import './CanvasGallery.css';

interface CreateCanvasButtonProps {
  onClick: () => void;
  loading: boolean;
}

/**
 * Create New Canvas button with loading state
 */
export function CreateCanvasButton({ onClick, loading }: CreateCanvasButtonProps) {
  return (
    <button
      className="create-canvas-button"
      onClick={onClick}
      disabled={loading}
      aria-label="Create new canvas"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="spinner-small"></span>
          <span>Creating...</span>
        </>
      ) : (
        <>
          <span className="create-canvas-icon">+</span>
          <span>Create New Canvas</span>
        </>
      )}
    </button>
  );
}


