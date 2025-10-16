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
import { MIN_SHAPE_WIDTH, MIN_SHAPE_HEIGHT, MIN_CIRCLE_RADIUS, MIN_TRIANGLE_WIDTH, MIN_TRIANGLE_HEIGHT } from '../utils/constants';

// Shape data types - Discriminated union for different shape types
interface BaseShapeData {
  id: string;
  color: string;
  rotation?: number;
  createdBy: string;
  createdAt: Timestamp | null;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface RectangleShapeData extends BaseShapeData {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShapeData extends BaseShapeData {
  type: 'circle';
  x: number; // Center X
  y: number; // Center Y
  radius: number;
}

export interface TriangleShapeData extends BaseShapeData {
  type: 'triangle';
  x: number; // Top vertex X
  y: number; // Top vertex Y
  width: number; // Base width
  height: number; // Height from top to base
}

export type ShapeData = RectangleShapeData | CircleShapeData | TriangleShapeData;

export type RectangleCreateInput = Omit<RectangleShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'>;
export type CircleCreateInput = Omit<CircleShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'>;
export type TriangleCreateInput = Omit<TriangleShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt'>;

export type ShapeCreateInput = RectangleCreateInput | CircleCreateInput | TriangleCreateInput;

export type ShapeUpdateInput = Partial<Pick<RectangleShapeData, 'x' | 'y' | 'width' | 'height' | 'color' | 'rotation'>> | 
                                Partial<Pick<CircleShapeData, 'x' | 'y' | 'radius' | 'color' | 'rotation'>> |
                                Partial<Pick<TriangleShapeData, 'x' | 'y' | 'width' | 'height' | 'color' | 'rotation'>>;

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
        rotation: shapeInput.rotation ?? 0,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

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
          console.log(`🔒 Shape locked by another user (${lockAge}ms ago)`);
          
          // Get the username of who has it locked
          const usersRef = collection(firestore, 'users');
          const userDocRef = doc(usersRef, shapeData.lockedBy);
          const userSnap = await getDoc(userDocRef);
          const lockedByUsername = userSnap.exists() ? userSnap.data().username : 'another user';
          
          return { success: false, lockedByUsername };
        } else {
          console.log(`⏰ Lock expired (${lockAge}ms), acquiring lock`);
        }
      }

      // Lock is either expired, doesn't exist, or is our own lock - acquire/refresh it
      await updateDoc(shapeRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

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
    } catch (error) {
      console.error('❌ Error unlocking shape:', error);
      throw error;
    }
  }

  /**
   * Resize a shape with validation
   */
  async resizeShape(shapeId: string, width: number, height: number): Promise<void> {
    try {
      // Validate minimum dimensions
      if (width < MIN_SHAPE_WIDTH || height < MIN_SHAPE_HEIGHT) {
        throw new Error(`Minimum size is ${MIN_SHAPE_WIDTH}×${MIN_SHAPE_HEIGHT} pixels`);
      }
      
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        width: width,
        height: height,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ SUCCESS TASK [1.1]: Shape resized to ${width}×${height}`);
    } catch (error) {
      console.error('❌ Error resizing shape:', error);
      throw error;
    }
  }

  /**
   * Rotate a shape with normalized rotation angle
   */
  async rotateShape(shapeId: string, rotation: number): Promise<void> {
    try {
      // Normalize rotation to 0-360 range
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        rotation: normalizedRotation,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ SUCCESS TASK [2.2]: Shape rotated to ${normalizedRotation}°`);
    } catch (error) {
      console.error('❌ Error rotating shape:', error);
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
      
      console.log(`💣 Bomb: Deleted ${snapshot.docs.length} shape(s)`);
    } catch (error) {
      console.error('❌ Error deleting all shapes:', error);
      throw error;
    }
  }

  /**
   * Delete a single shape
   */
  async deleteShape(shapeId: string): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await deleteDoc(shapeRef);
      console.log(`🗑️ Shape ${shapeId} deleted`);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }

  /**
   * Duplicate a shape with offset positioning
   */
  async duplicateShape(shapeId: string, userId: string): Promise<string> {
    try {
      // Fetch the original shape
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      const shapeDoc = await getDoc(shapeRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }
      
      const original = shapeDoc.data() as ShapeData;
      
      // Calculate new position with boundary wrapping
      const OFFSET = 20;
      const BOUNDARY = 4980;
      const WRAP_TO = 50;
      
      const newX = original.x + OFFSET > BOUNDARY ? WRAP_TO : original.x + OFFSET;
      const newY = original.y + OFFSET > BOUNDARY ? WRAP_TO : original.y + OFFSET;
      
      // Create new shape reference with auto-generated ID
      const duplicateRef = doc(collection(firestore, this.shapesCollectionPath));
      
      // Create duplicate with updated fields
      const duplicateData = {
        ...original,
        id: duplicateRef.id,
        x: newX,
        y: newY,
        createdBy: userId,
        createdAt: serverTimestamp(),
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(duplicateRef, duplicateData);
      
      console.log(`📋 Shape duplicated: ${shapeId} → ${duplicateRef.id}`);
      return duplicateRef.id;
    } catch (error) {
      console.error('❌ Error duplicating shape:', error);
      throw error;
    }
  }

  /**
   * Create a new circle shape
   */
  async createCircle(circleData: { x: number; y: number; radius: number; color: string; createdBy: string }): Promise<string> {
    try {
      // Validate minimum radius
      if (circleData.radius < MIN_CIRCLE_RADIUS) {
        throw new Error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`);
      }

      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the shape
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      const shapeData: Omit<CircleShapeData, 'id'> = {
        type: 'circle',
        x: circleData.x,
        y: circleData.y,
        radius: circleData.radius,
        color: circleData.color,
        rotation: 0,
        createdBy: circleData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log(`⭕ Circle created: ${shapeId} (radius: ${circleData.radius})`);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating circle:', error);
      throw error;
    }
  }

  /**
   * Resize a circle by updating its radius
   */
  async resizeCircle(shapeId: string, radius: number): Promise<void> {
    try {
      // Validate minimum radius
      if (radius < MIN_CIRCLE_RADIUS) {
        throw new Error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`);
      }
      
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        radius: radius,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Circle resized to radius ${radius}`);
    } catch (error) {
      console.error('❌ Error resizing circle:', error);
      throw error;
    }
  }

  /**
   * Create a new triangle shape
   */
  async createTriangle(triangleData: { x: number; y: number; width: number; height: number; color: string; createdBy: string }): Promise<string> {
    try {
      // Validate minimum dimensions
      if (triangleData.width < MIN_TRIANGLE_WIDTH || triangleData.height < MIN_TRIANGLE_HEIGHT) {
        throw new Error(`Minimum triangle size is ${MIN_TRIANGLE_WIDTH}×${MIN_TRIANGLE_HEIGHT} pixels`);
      }

      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the shape
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      const shapeData: Omit<TriangleShapeData, 'id'> = {
        type: 'triangle',
        x: triangleData.x,
        y: triangleData.y,
        width: triangleData.width,
        height: triangleData.height,
        color: triangleData.color,
        rotation: 0,
        createdBy: triangleData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log(`△ Triangle created: ${shapeId} (${triangleData.width}×${triangleData.height})`);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating triangle:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;

