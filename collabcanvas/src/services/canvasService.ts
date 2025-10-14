import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  query
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';

// Shape data types
export interface ShapeData {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
  createdAt: Timestamp | null;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type ShapeCreateInput = Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'>;
export type ShapeUpdateInput = Partial<Pick<ShapeData, 'x' | 'y' | 'width' | 'height' | 'color'>>;

class CanvasService {
  private shapesCollectionPath = 'canvases/main/shapes';
  private canvasDocPath = 'canvases/main';

  /**
   * Ensure the parent canvas document exists
   */
  private async ensureCanvasDocExists(): Promise<void> {
    try {
      const canvasRef = doc(firestore, this.canvasDocPath);
      await setDoc(canvasRef, { name: 'main', createdAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('❌ Error ensuring canvas doc exists:', error);
    }
  }

  /**
   * Create a new shape in Firestore
   */
  async createShape(shapeInput: ShapeCreateInput): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the shape
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      const shapeData: Omit<ShapeData, 'id'> = {
        ...shapeInput,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      throw error;
    }
  }

  /**
   * Update an existing shape
   */
  async updateShape(shapeId: string, updates: ShapeUpdateInput): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Shape updated:', shapeId);
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      throw error;
    }
  }

  /**
   * Lock a shape for editing (with 5s timeout check)
   * Returns: { success: boolean, lockedByUsername?: string }
   */
  async lockShape(shapeId: string, userId: string): Promise<{ success: boolean; lockedByUsername?: string }> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      // First, check current lock status
      const shapeSnap = await getDoc(shapeRef);
      if (!shapeSnap.exists()) {
        console.error('❌ Shape not found:', shapeId);
        return { success: false };
      }

      const shapeData = shapeSnap.data() as ShapeData;
      const now = Date.now();
      
      // Check if shape is locked by someone else
      if (shapeData.lockedBy && shapeData.lockedBy !== userId && shapeData.lockedAt) {
        const lockedAtTime = shapeData.lockedAt.toMillis();
        const lockAge = now - lockedAtTime;
        const LOCK_TIMEOUT_MS = 5000; // 5 seconds

        // If lock is still fresh (< 5s), deny the lock
        if (lockAge < LOCK_TIMEOUT_MS) {
          console.log(`🔒 Shape ${shapeId} is locked by ${shapeData.lockedBy} (${lockAge}ms ago)`);
          
          // Get the username of who has it locked
          const usersRef = collection(firestore, 'users');
          const userDocRef = doc(usersRef, shapeData.lockedBy);
          const userSnap = await getDoc(userDocRef);
          const lockedByUsername = userSnap.exists() ? userSnap.data().username : 'another user';
          
          return { success: false, lockedByUsername };
        } else {
          console.log(`⏰ Lock timeout (${lockAge}ms), stealing lock from ${shapeData.lockedBy}`);
        }
      }

      // Lock is either expired, doesn't exist, or is our own lock - acquire/refresh it
      await updateDoc(shapeRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('🔒 Shape locked:', shapeId, 'by:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error locking shape:', error);
      return { success: false };
    }
  }

  /**
   * Unlock a shape
   */
  async unlockShape(shapeId: string): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp(),
      });

      console.log('🔓 Shape unlocked:', shapeId);
    } catch (error) {
      console.error('❌ Error unlocking shape:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time shape updates
   */
  subscribeToShapes(callback: (shapes: ShapeData[]) => void): Unsubscribe {
    try {
      const shapesRef = collection(firestore, this.shapesCollectionPath);
      const q = query(shapesRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const shapes: ShapeData[] = [];
          
          snapshot.forEach((doc) => {
            shapes.push({
              id: doc.id,
              ...doc.data(),
            } as ShapeData);
          });

          console.log(`📊 Received ${shapes.length} shape(s) from Firestore`);
          callback(shapes);
        },
        (error) => {
          console.error('❌ Error in shapes subscription:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to shapes:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Get all shapes (one-time fetch)
   */
  async getShapes(): Promise<ShapeData[]> {
    try {
      const shapesRef = collection(firestore, this.shapesCollectionPath);
      const q = query(shapesRef);
      const snapshot = await getDocs(q);

      const shapes: ShapeData[] = [];
      snapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as ShapeData);
      });

      console.log(`📊 Fetched ${shapes.length} shape(s)`);
      return shapes;
    } catch (error) {
      console.error('❌ Error fetching shapes:', error);
      return [];
    }
  }

  /**
   * Delete all shapes (bomb feature)
   */
  async deleteAllShapes(): Promise<void> {
    try {
      const shapesRef = collection(firestore, this.shapesCollectionPath);
      const snapshot = await getDocs(shapesRef);
      
      // Delete all shapes in batch
      const deletePromises = snapshot.docs.map((docSnapshot) => 
        deleteDoc(docSnapshot.ref)
      );
      
      await Promise.all(deletePromises);
      
      console.log(`💣 Deleted ${snapshot.docs.length} shape(s)`);
    } catch (error) {
      console.error('❌ Error deleting all shapes:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;

