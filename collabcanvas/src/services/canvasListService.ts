import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import type { Unsubscribe, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { CanvasMetadata, CanvasDocument, CollaboratorInfo } from './types/canvasTypes';

/**
 * Canvas List Service
 * Handles querying and managing the canvases collection
 */
class CanvasListService {
  private canvasesCollectionPath = 'canvases';

  /**
   * Convert Firestore canvas document to CanvasMetadata
   */
  private convertToMetadata(doc: any): CanvasMetadata {
    const data = doc.data() as CanvasDocument;
    return {
      id: doc.id,
      name: data.name,
      ownerId: data.ownerId,
      collaboratorIds: data.collaboratorIds,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
      lastAccessedAt: data.lastAccessedAt ? (data.lastAccessedAt as Timestamp).toDate() : new Date(),
      shapeCount: data.shapeCount || 0,
    };
  }

  /**
   * Get all canvases user has access to (owned or shared)
   * @param userId - Authenticated user ID
   * @returns Promise resolving to array of canvas metadata
   */
  async getCanvasesForUser(userId: string): Promise<CanvasMetadata[]> {
    try {
      const canvasesRef = collection(firestore, this.canvasesCollectionPath);
      const q = query(
        canvasesRef,
        where('collaboratorIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const canvases: CanvasMetadata[] = [];

      snapshot.forEach((doc) => {
        canvases.push(this.convertToMetadata(doc));
      });

      return canvases;
    } catch (error) {
      console.error('❌ Error fetching canvases:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Subscribe to real-time updates of user's canvases
   * @param userId - Authenticated user ID
   * @param callback - Called when canvas list changes
   * @returns Unsubscribe function
   */
  subscribeToUserCanvases(
    userId: string,
    callback: (canvases: CanvasMetadata[]) => void
  ): Unsubscribe {
    try {
      const canvasesRef = collection(firestore, this.canvasesCollectionPath);
      const q = query(
        canvasesRef,
        where('collaboratorIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const canvases: CanvasMetadata[] = [];
          snapshot.forEach((doc) => {
            canvases.push(this.convertToMetadata(doc));
          });
          callback(canvases);
        },
        (error) => {
          console.error('❌ Error in canvas subscription:', error);
          callback([]); // Return empty array on error
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to canvases:', error);
      return () => {}; // Return no-op unsubscribe function
    }
  }

  /**
   * Get metadata for a specific canvas
   * @param canvasId - Canvas document ID
   * @returns Promise resolving to canvas metadata or null if not found
   */
  async getCanvasById(canvasId: string): Promise<CanvasMetadata | null> {
    try {
      const canvasRef = doc(firestore, this.canvasesCollectionPath, canvasId);
      const canvasDoc = await getDoc(canvasRef);

      if (!canvasDoc.exists()) {
        return null;
      }

      return this.convertToMetadata(canvasDoc);
    } catch (error) {
      console.error('❌ Error fetching canvas:', error);
      return null; // Return null on error or access denied
    }
  }

  /**
   * Update lastAccessedAt timestamp when user opens canvas
   * @param canvasId - Canvas document ID
   * @returns Promise resolving when update complete
   */
  async updateCanvasAccess(canvasId: string): Promise<void> {
    try {
      const canvasRef = doc(firestore, this.canvasesCollectionPath, canvasId);
      await updateDoc(canvasRef, {
        lastAccessedAt: serverTimestamp(),
      });
    } catch (error) {
      // Fail silently - non-critical operation
    }
  }

  /**
   * Update canvas metadata (name, updatedAt, shapeCount)
   * @param canvasId - Canvas document ID
   * @param updates - Partial canvas data to update
   * @returns Promise resolving when update complete
   */
  async updateCanvasMetadata(
    canvasId: string,
    updates: Partial<Omit<CanvasDocument, 'id'>>
  ): Promise<void> {
    try {
      const canvasRef = doc(firestore, this.canvasesCollectionPath, canvasId);
      
      // Always include updatedAt when updating metadata
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(canvasRef, updateData);
    } catch (error) {
      console.error('❌ Error updating canvas metadata:', error);
      throw error;
    }
  }

  /**
   * Validate canvas name
   * @param name - Canvas name to validate
   * @returns Validation result with error message if invalid
   */
  validateCanvasName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Canvas name cannot be empty' };
    }

    if (trimmed.length > 100) {
      return { valid: false, error: 'Canvas name too long (max 100 characters)' };
    }

    return { valid: true };
  }

  /**
   * Create a new blank canvas
   * @param userId - Authenticated user ID (owner)
   * @param name - Optional canvas name (defaults to "Untitled Canvas")
   * @returns Promise resolving to new canvas ID
   */
  async createCanvas(userId: string, name?: string): Promise<string> {
    try {
      // Validate and sanitize name
      const canvasName = name?.trim() || 'Untitled Canvas';
      const validation = this.validateCanvasName(canvasName);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create new canvas document
      const canvasRef = doc(collection(firestore, this.canvasesCollectionPath));
      const canvasId = canvasRef.id;

      const canvasData: CanvasDocument = {
        id: canvasId,
        name: canvasName,
        ownerId: userId,
        collaboratorIds: [userId],
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        lastAccessedAt: serverTimestamp() as any,
        shapeCount: 0,
      };

      await setDoc(canvasRef, canvasData);

      return canvasId;
    } catch (error) {
      console.error('❌ Error creating canvas:', error);
      throw error;
    }
  }

  /**
   * Rename an existing canvas
   * @param canvasId - Canvas document ID
   * @param newName - New canvas name (1-100 characters, trimmed)
   * @returns Promise resolving when rename complete
   * @throws Error if canvas not found or user lacks permission
   */
  async renameCanvas(canvasId: string, newName: string): Promise<void> {
    try {
      // Validate and sanitize name
      const trimmedName = newName.trim();
      const validation = this.validateCanvasName(trimmedName);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Update canvas name using existing updateCanvasMetadata
      await this.updateCanvasMetadata(canvasId, {
        name: trimmedName,
      });
    } catch (error) {
      console.error('❌ Error renaming canvas:', error);
      throw error;
    }
  }

  /**
   * Add user to canvas collaborators via shareable link
   * Uses arrayUnion to prevent duplicates (idempotent)
   * @param canvasId - Canvas to add user to
   * @param userId - User to add as collaborator
   * @returns Promise resolving to updated canvas metadata
   * @throws Error if canvas doesn't exist or Firestore write fails
   */
  async addCollaborator(canvasId: string, userId: string): Promise<CanvasMetadata> {
    try {
      const canvasRef = doc(firestore, this.canvasesCollectionPath, canvasId);
      
      // Use arrayUnion to prevent duplicates (atomic operation)
      await updateDoc(canvasRef, {
        collaboratorIds: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ Added collaborator ${userId} to canvas ${canvasId}`);
      
      // Return updated canvas metadata
      const updatedCanvas = await this.getCanvasById(canvasId);
      if (!updatedCanvas) {
        throw new Error('Canvas not found after collaborator addition');
      }
      
      return updatedCanvas;
    } catch (error) {
      console.error('❌ Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Get collaborator info for a canvas
   * Fetches user details for all collaborators
   * @param canvasId - Canvas to fetch collaborators for
   * @returns Promise resolving to array of collaborator info (owner first)
   */
  async getCollaborators(canvasId: string): Promise<CollaboratorInfo[]> {
    try {
      // 1. Get canvas document
      const canvas = await this.getCanvasById(canvasId);
      if (!canvas) {
        console.warn(`⚠️ Canvas not found: ${canvasId}`);
        return [];
      }
      
      // 2. Fetch user documents for all collaborators
      const collaboratorPromises = canvas.collaboratorIds.map(async (userId) => {
        try {
          const userRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          return {
            userId,
            email: userData?.email || 'Unknown',
            displayName: userData?.displayName || null,
            isOwner: userId === canvas.ownerId,
          };
        } catch (error) {
          console.warn(`⚠️ Could not fetch user ${userId}:`, error);
          return {
            userId,
            email: 'Unknown',
            displayName: null,
            isOwner: userId === canvas.ownerId,
          };
        }
      });
      
      // 3. Resolve all promises
      const collaborators = await Promise.all(collaboratorPromises);
      
      // 4. Sort: owner first, then alphabetically
      return collaborators.sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return (a.displayName || a.email).localeCompare(b.displayName || b.email);
      });
    } catch (error) {
      console.error('❌ Error fetching collaborators:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Generate shareable link for canvas
   * @param canvasId - Canvas ID to generate link for
   * @returns Shareable URL string
   */
  generateShareableLink(canvasId: string): string {
    const baseUrl = window.location.origin; // e.g., https://app.collabcanvas.com
    return `${baseUrl}/canvas/${canvasId}?share=true`;
  }
}

export const canvasListService = new CanvasListService();

