import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
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

  /**
   * Create a new shape in Firestore
   */
  async createShape(shapeInput: ShapeCreateInput): Promise<string> {
    try {
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
   * Lock a shape for editing
   */
  async lockShape(shapeId: string, userId: string): Promise<boolean> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      // For MVP: simple last-write-wins (no transaction)
      // Post-MVP: upgrade to Firestore transaction
      await updateDoc(shapeRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('🔒 Shape locked:', shapeId, 'by:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error locking shape:', error);
      return false;
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
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;

