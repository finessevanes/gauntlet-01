import { useState, useEffect } from 'react';
import { useCanvasList } from '../../hooks/useCanvasList';
import { useCanvasCreation } from '../../hooks/useCanvasCreation';
import { useCanvasRename } from '../../hooks/useCanvasRename';
import { useAuth } from '../../hooks/useAuth';
import { CanvasCard } from './CanvasCard';
import { CanvasEmptyState } from './CanvasEmptyState';
import { CreateCanvasButton } from './CreateCanvasButton';
import { CreateCanvasModal } from './CreateCanvasModal';
import './CanvasGallery.css';

interface CanvasGalleryProps {
  onCanvasSelect: (canvasId: string) => void;
}

/**
 * Canvas Gallery - displays all canvases user has access to
 */
export function CanvasGallery({ onCanvasSelect }: CanvasGalleryProps) {
  const { canvases, loading, error } = useCanvasList();
  const { createCanvas, creating } = useCanvasCreation();
  const { renameCanvas } = useCanvasRename();
  const { user } = useAuth();
  const [loadingCanvasId, setLoadingCanvasId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);

  // Auto-open modal for new users with no canvases
  useEffect(() => {
    if (!loading && canvases.length === 0 && !hasAutoOpenedModal) {
      setShowCreateModal(true);
      setHasAutoOpenedModal(true);
    }
  }, [loading, canvases.length, hasAutoOpenedModal]);

  const handleCanvasClick = (canvasId: string) => {
    setLoadingCanvasId(canvasId);
    onCanvasSelect(canvasId);
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCreateCanvasConfirm = async (name: string) => {
    if (!user) {
      return;
    }

    const canvasId = await createCanvas(user.uid, name);
    if (canvasId) {
      setShowCreateModal(false);
      onCanvasSelect(canvasId);
    }
  };

  const handleCreateCanvasCancel = () => {
    setShowCreateModal(false);
  };

  const handleRenameCanvas = async (canvasId: string, newName: string) => {
    await renameCanvas(canvasId, newName);
  };

  if (loading) {
    return (
      <div className="canvas-gallery-container">
        <div className="canvas-gallery-header">
          <h1>Your Canvases</h1>
        </div>
        <div className="canvas-gallery-loading">
          <div className="spinner"></div>
          <p>Loading your canvases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="canvas-gallery-container">
        <div className="canvas-gallery-header">
          <h1>Your Canvases</h1>
        </div>
        <div className="canvas-gallery-error">
          <p>⚠️ Error loading canvases: {error}</p>
        </div>
      </div>
    );
  }

  if (canvases.length === 0) {
    return (
      <div className="canvas-gallery-container">
        <div className="canvas-gallery-header">
          <h1>Your Canvases</h1>
        </div>
        <CreateCanvasButton onClick={handleOpenCreateModal} loading={creating} />
        <CanvasEmptyState />
        
        {showCreateModal && (
          <CreateCanvasModal
            onConfirm={handleCreateCanvasConfirm}
            onCancel={handleCreateCanvasCancel}
            isCreating={creating}
          />
        )}
      </div>
    );
  }

  return (
    <div className="canvas-gallery-container">
      <div className="canvas-gallery-header">
        <h1>Your Canvases</h1>
        <p className="canvas-gallery-subtitle">
          {canvases.length} {canvases.length === 1 ? 'canvas' : 'canvases'} available
        </p>
      </div>

      <CreateCanvasButton onClick={handleOpenCreateModal} loading={creating} />

      <div className="canvas-gallery-grid" role="list">
        {canvases.map((canvas) => (
          <div key={canvas.id} role="listitem">
            <CanvasCard
              canvas={canvas}
              onClick={handleCanvasClick}
              isLoading={loadingCanvasId === canvas.id}
              onRename={handleRenameCanvas}
            />
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateCanvasModal
          onConfirm={handleCreateCanvasConfirm}
          onCancel={handleCreateCanvasCancel}
          isCreating={creating}
        />
      )}
    </div>
  );
}

