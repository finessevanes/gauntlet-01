import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp,
  query
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';

// Selection data type
export interface UserSelection {
  userId: string;
  username?: string;
  selectedShapes: string[];
  updatedAt: any;
}

class SelectionService {
  private selectionsCollectionPath = 'canvases/main/selections';

  /**
   * Update or create a user's selection in Firestore
   */
  async updateUserSelection(userId: string, username: string, shapeIds: string[]): Promise<void> {
    try {
      const selectionRef = doc(firestore, this.selectionsCollectionPath, userId);
      
      await setDoc(selectionRef, {
        userId,
        username,
        selectedShapes: shapeIds,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ User selection updated in Firestore:', {
        userId,
        username,
        shapeCount: shapeIds.length,
        shapeIds,
      });
    } catch (error) {
      console.error('❌ Error updating user selection:', error);
      throw error;
    }
  }

  /**
   * Clear a user's selection from Firestore
   */
  async clearUserSelection(userId: string): Promise<void> {
    try {
      const selectionRef = doc(firestore, this.selectionsCollectionPath, userId);
      await deleteDoc(selectionRef);
    } catch (error) {
      console.error('❌ Error clearing user selection:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all user selections for the canvas
   * Excludes the current user from results
   */
  subscribeToCanvasSelections(
    currentUserId: string,
    callback: (selections: Record<string, UserSelection>) => void
  ): Unsubscribe {
    try {
      const selectionsRef = collection(firestore, this.selectionsCollectionPath);
      const q = query(selectionsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const selections: Record<string, UserSelection> = {};
          
          snapshot.forEach((doc) => {
            const data = doc.data() as UserSelection;
            
            // Exclude current user's selection
            if (data.userId !== currentUserId) {
              selections[data.userId] = data;
            }
          });

          callback(selections);
        },
        (error) => {
          console.error('❌ Error in selections subscription:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to selections:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Check if a shape is locked by another user
   */
  isShapeLockedByOthers(
    shapeId: string, 
    currentUserId: string, 
    userSelections: Record<string, UserSelection>
  ): { locked: boolean; lockedBy?: string; username?: string } {
    for (const [userId, selection] of Object.entries(userSelections)) {
      if (userId !== currentUserId && selection.selectedShapes.includes(shapeId)) {
        return {
          locked: true,
          lockedBy: userId,
          username: selection.username || 'another user',
        };
      }
    }
    return { locked: false };
  }
}

// Export a singleton instance
export const selectionService = new SelectionService();
export default SelectionService;

