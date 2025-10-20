import { useState, useEffect, useCallback } from 'react';
import { canvasListService } from '../services/canvasListService';
import { clipboardService } from '../services/clipboardService';
import type { CollaboratorInfo } from '../services/types/canvasTypes';

/**
 * Custom hook for canvas sharing functionality
 * Encapsulates link generation, clipboard operations, and collaborator management
 */
export function useShareCanvas(canvasId: string) {
  const [shareableLink, setShareableLink] = useState<string>('');
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Generate shareable link on mount
  useEffect(() => {
    const link = canvasListService.generateShareableLink(canvasId);
    setShareableLink(link);
  }, [canvasId]);

  // Fetch collaborators on mount
  const refreshCollaborators = useCallback(async () => {
    setLoadingCollaborators(true);
    try {
      const collabs = await canvasListService.getCollaborators(canvasId);
      setCollaborators(collabs);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setCollaborators([]);
    } finally {
      setLoadingCollaborators(false);
    }
  }, [canvasId]);

  useEffect(() => {
    refreshCollaborators();
  }, [refreshCollaborators]);

  // Copy link to clipboard
  const copyLinkToClipboard = useCallback(async (): Promise<boolean> => {
    const success = await clipboardService.copyToClipboard(shareableLink);
    return success;
  }, [shareableLink]);

  return {
    shareableLink,
    copyLinkToClipboard,
    collaborators,
    loadingCollaborators,
    refreshCollaborators,
  };
}

