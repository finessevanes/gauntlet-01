import React, { useState } from 'react';
import { useCanvasList } from '../../hooks/useCanvasList';
import { CanvasCard } from './CanvasCard';
import { CanvasEmptyState } from './CanvasEmptyState';
import './CanvasGallery.css';

interface CanvasGalleryProps {
  onCanvasSelect: (canvasId: string) => void;
}

/**
 * Canvas Gallery - displays all canvases user has access to
 */
export function CanvasGallery({ onCanvasSelect }: CanvasGalleryProps) {
  const { canvases, loading, error } = useCanvasList();
  const [loadingCanvasId, setLoadingCanvasId] = useState<string | null>(null);

  const handleCanvasClick = (canvasId: string) => {
    setLoadingCanvasId(canvasId);
    onCanvasSelect(canvasId);
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
        <CanvasEmptyState />
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

      <div className="canvas-gallery-grid" role="list">
        {canvases.map((canvas) => (
          <div key={canvas.id} role="listitem">
            <CanvasCard
              canvas={canvas}
              onClick={handleCanvasClick}
              isLoading={loadingCanvasId === canvas.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

