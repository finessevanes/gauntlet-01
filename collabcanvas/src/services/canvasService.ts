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
  query,
  writeBatch,
  arrayUnion,
  Timestamp as FirestoreTimestamp
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';
import { MIN_SHAPE_WIDTH, MIN_SHAPE_HEIGHT } from '../utils/constants';
import { findOverlappingShapesAbove, findOverlappingShapesBelow } from '../utils/overlapDetection';

// Shape data types
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'text' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  // Circle-specific fields
  radius?: number;
  // Text-specific fields
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  // Grouping and layering fields
  groupId: string | null;
  zIndex: number;
  createdBy: string;
  createdAt: Timestamp | null;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Group data types
export interface GroupData {
  id: string;
  name: string;
  shapeIds: string[];
  createdBy: string;
  createdAt: Timestamp | null;
}

// Comment data types
export interface CommentReply {
  userId: string;
  username: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface CommentData {
  id: string;
  shapeId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Timestamp | null;
  resolved: boolean;
  replies: CommentReply[];
  // Track which users have read the replies (userId => last read timestamp)
  replyReadStatus: Record<string, Timestamp>;
  // Track the last reply timestamp for quick comparison
  lastReplyAt: Timestamp | null;
}

export type ShapeCreateInput = Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt' | 'groupId' | 'zIndex'> & {
  groupId?: string | null;
  zIndex?: number;
};
export type ShapeUpdateInput = Partial<Pick<ShapeData, 'x' | 'y' | 'width' | 'height' | 'color' | 'rotation'>>;

class CanvasService {
  private shapesCollectionPath = 'canvases/main/shapes';
  private groupsCollectionPath = 'canvases/main/groups';
  private commentsCollectionPath = 'canvases/main/comments';
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
      
      // Auto-increment z-index: new shapes appear on top by default
      let zIndex = shapeInput.zIndex;
      if (zIndex === undefined) {
        const shapes = await this.getShapes();
        const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
        zIndex = maxZIndex + 1;
      }
      
      const shapeData: Omit<ShapeData, 'id'> = {
        ...shapeInput,
        rotation: shapeInput.rotation ?? 0,
        groupId: shapeInput.groupId ?? null,
        zIndex,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log(`✅ Shape created with zIndex: ${zIndex}`);
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
   * Update text content of a shape
   * Used specifically for text editing functionality
   */
  async updateShapeText(shapeId: string, text: string): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        text: text,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Text updated:', shapeId);
    } catch (error) {
      console.error('❌ Error updating text:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple shapes in a single atomic operation
   * This ensures all shapes update simultaneously, preventing visual lag for remote users
   */
  async batchUpdateShapes(updates: Array<{ shapeId: string; updates: ShapeUpdateInput }>): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      
      for (const { shapeId, updates: shapeUpdates } of updates) {
        const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
        batch.update(shapeRef, {
          ...shapeUpdates,
          updatedAt: serverTimestamp(),
        });
      }
      
      await batch.commit();
      console.log(`✅ Batch updated ${updates.length} shapes atomically`);
    } catch (error) {
      console.error('❌ Error batch updating shapes:', error);
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
   * Create a new circle shape in Firestore
   */
  async createCircle(circleData: { 
    x: number; 
    y: number; 
    radius: number; 
    color: string; 
    createdBy: string;
  }): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the circle
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      // Auto-increment z-index: new shapes appear on top by default
      const shapes = await this.getShapes();
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      const zIndex = maxZIndex + 1;
      
      const shapeData: Omit<ShapeData, 'id'> = {
        type: 'circle',
        x: circleData.x,
        y: circleData.y,
        width: circleData.radius * 2,
        height: circleData.radius * 2,
        radius: circleData.radius,
        color: circleData.color,
        rotation: 0,
        groupId: null,
        zIndex,
        createdBy: circleData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Circle shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating circle shape:', error);
      throw error;
    }
  }

  /**
   * Create a new triangle shape in Firestore
   */
  async createTriangle(triangleData: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    color: string; 
    createdBy: string;
  }): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the triangle
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      // Auto-increment z-index: new shapes appear on top by default
      const shapes = await this.getShapes();
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      const zIndex = maxZIndex + 1;
      
      const shapeData: Omit<ShapeData, 'id'> = {
        type: 'triangle',
        x: triangleData.x,
        y: triangleData.y,
        width: triangleData.width,
        height: triangleData.height,
        color: triangleData.color,
        rotation: 0,
        groupId: null,
        zIndex,
        createdBy: triangleData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Triangle shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating triangle shape:', error);
      throw error;
    }
  }

  /**
   * Create a new text shape in Firestore
   */
  async createText(textData: { 
    x: number; 
    y: number; 
    color: string; 
    createdBy: string;
  }): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the text shape
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      // Auto-increment z-index: new shapes appear on top by default
      const shapes = await this.getShapes();
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      const zIndex = maxZIndex + 1;
      
      // Default dimensions for text box
      const defaultWidth = 100;
      const defaultHeight = 30;
      
      // Position text so it appears just above the cursor
      // This feels more natural than having cursor in the middle of text
      const offsetX = textData.x; // Align with cursor horizontally
      const offsetY = textData.y - defaultHeight + 10; // Position above cursor (text bottom near cursor top)
      
      const shapeData: Omit<ShapeData, 'id'> = {
        type: 'text',
        x: offsetX,
        y: offsetY,
        width: defaultWidth,
        height: defaultHeight,
        text: 'TEXT', // Hardcoded placeholder text
        fontSize: 24, // Fixed font size
        color: textData.color,
        rotation: 0, // Fixed rotation
        groupId: null,
        zIndex,
        createdBy: textData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Text shape created above and to the right of cursor:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating text shape:', error);
      throw error;
    }
  }

  /**
   * Resize a circle by updating its radius
   */
  async resizeCircle(shapeId: string, radius: number): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        radius: radius,
        width: radius * 2,
        height: radius * 2,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Circle resized to radius ${radius}`);
    } catch (error) {
      console.error('❌ Error resizing circle:', error);
      throw error;
    }
  }

  /**
   * Delete a specific shape
   */
  async deleteShape(shapeId: string): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await deleteDoc(shapeRef);
      console.log('✅ Shape deleted:', shapeId);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }

  /**
   * Duplicate a shape
   */
  async duplicateShape(shapeId: string, userId: string): Promise<string> {
    try {
      // Get the original shape
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      const shapeSnap = await getDoc(shapeRef);
      
      if (!shapeSnap.exists()) {
        throw new Error('Shape not found');
      }

      const originalShape = shapeSnap.data() as ShapeData;
      
      // Create a new shape with slightly offset position
      const OFFSET = 20;
      const newShapeInput: ShapeCreateInput = {
        type: originalShape.type,
        x: originalShape.x + OFFSET,
        y: originalShape.y + OFFSET,
        width: originalShape.width,
        height: originalShape.height,
        color: originalShape.color,
        rotation: originalShape.rotation,
        groupId: null, // Don't copy group membership
        // zIndex will auto-increment in createShape, putting duplicate on top
        createdBy: userId,
      };

      // Copy type-specific properties
      if (originalShape.type === 'circle' && originalShape.radius) {
        newShapeInput.radius = originalShape.radius;
      }
      
      if (originalShape.type === 'text') {
        newShapeInput.text = originalShape.text;
        newShapeInput.fontSize = originalShape.fontSize;
        newShapeInput.fontWeight = originalShape.fontWeight;
        newShapeInput.fontStyle = originalShape.fontStyle;
        newShapeInput.textDecoration = originalShape.textDecoration;
      }

      const newShapeId = await this.createShape(newShapeInput);
      console.log('✅ Shape duplicated:', shapeId, '->', newShapeId);
      return newShapeId;
    } catch (error) {
      console.error('❌ Error duplicating shape:', error);
      throw error;
    }
  }

  // ============================================
  // Grouping Methods
  // ============================================

  /**
   * Group multiple shapes together
   */
  async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string> {
    try {
      if (shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required to create a group');
      }

      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Get all shapes to find max z-index and get current shapes data
      const shapes = await this.getShapes();
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      
      // Get the shapes being grouped and sort by their current z-index to preserve relative order
      const shapesToGroup = shapes.filter(s => shapeIds.includes(s.id));
      shapesToGroup.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      console.log('🔵 GROUPING - Original z-indices:', shapesToGroup.map(s => ({ id: s.id, zIndex: s.zIndex })));
      
      // Generate a unique ID for the group
      const groupId = doc(collection(firestore, this.groupsCollectionPath)).id;
      
      const groupData: Omit<GroupData, 'id'> = {
        name: name || `Group ${groupId.slice(0, 6)}`,
        shapeIds,
        createdBy: userId,
        createdAt: serverTimestamp() as Timestamp,
      };

      // Create group document
      const groupRef = doc(firestore, this.groupsCollectionPath, groupId);
      await setDoc(groupRef, groupData);

      // Update all shapes with groupId AND assign consecutive z-indices
      // This ensures grouped shapes are always together on the same layer
      const batch = writeBatch(firestore);
      
      shapesToGroup.forEach((shape, index) => {
        const newZIndex = maxZIndex + 1 + index;
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        batch.update(shapeRef, {
          groupId,
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      
      console.log(`✅ Group created: ${groupId} with ${shapeIds.length} shapes`);
      console.log('🔵 GROUPING - New z-indices:', shapesToGroup.map((s, i) => ({ id: s.id, newZIndex: maxZIndex + 1 + i })));
      return groupId;
    } catch (error) {
      console.error('❌ Error creating group:', error);
      throw error;
    }
  }

  /**
   * Ungroup shapes (dissolve group)
   */
  async ungroupShapes(groupId: string): Promise<void> {
    try {
      // Get group document
      const groupRef = doc(firestore, this.groupsCollectionPath, groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupSnap.data() as GroupData;
      
      // Clear groupId from all shapes via batch write
      const batch = writeBatch(firestore);
      
      for (const shapeId of groupData.shapeIds) {
        const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
        batch.update(shapeRef, {
          groupId: null,
          updatedAt: serverTimestamp(),
        });
      }
      
      // Delete group document
      batch.delete(groupRef);
      
      await batch.commit();
      
      console.log(`✅ Group ungrouped: ${groupId} (${groupData.shapeIds.length} shapes)`);
    } catch (error) {
      console.error('❌ Error ungrouping shapes:', error);
      throw error;
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<GroupData | null> {
    try {
      const groupRef = doc(firestore, this.groupsCollectionPath, groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        return null;
      }

      return {
        id: groupSnap.id,
        ...groupSnap.data(),
      } as GroupData;
    } catch (error) {
      console.error('❌ Error fetching group:', error);
      return null;
    }
  }

  // ============================================
  // Z-Index Methods
  // ============================================

  /**
   * Bring shape to front (set zIndex to max+1)
   */
  async bringToFront(shapeId: string): Promise<void> {
    try {
      // Get all shapes to find max zIndex
      const shapes = await this.getShapes();
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        zIndex: maxZIndex + 1,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Shape brought to front: ${shapeId} (zIndex: ${maxZIndex + 1})`);
    } catch (error) {
      console.error('❌ Error bringing shape to front:', error);
      throw error;
    }
  }

  /**
   * Bring multiple shapes to front atomically (batch operation)
   * Preserves relative z-index ordering of the shapes
   */
  async batchBringToFront(shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      // Get all shapes to find max zIndex
      const shapes = await this.getShapes();
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      
      // Get the shapes being moved and sort by their current zIndex to preserve relative ordering
      const shapesToMove = shapes.filter(s => shapeIds.includes(s.id));
      shapesToMove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      const batch = writeBatch(firestore);
      
      // Assign incrementing z-indices starting from max+1, preserving original order
      shapesToMove.forEach((shape, index) => {
        const newZIndex = maxZIndex + 1 + index;
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      
      console.log(`✅ Batch brought ${shapeIds.length} shapes to front atomically (preserving relative order)`);
    } catch (error) {
      console.error('❌ Error batch bringing shapes to front:', error);
      throw error;
    }
  }

  /**
   * Send shape to back (set zIndex to min-1)
   */
  async sendToBack(shapeId: string): Promise<void> {
    try {
      // Get all shapes to find min zIndex
      const shapes = await this.getShapes();
      const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, {
        zIndex: minZIndex - 1,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Shape sent to back: ${shapeId} (zIndex: ${minZIndex - 1})`);
    } catch (error) {
      console.error('❌ Error sending shape to back:', error);
      throw error;
    }
  }

  /**
   * Send multiple shapes to back atomically (batch operation)
   * Preserves relative z-index ordering of the shapes
   */
  async batchSendToBack(shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      // Get all shapes to find min zIndex
      const shapes = await this.getShapes();
      const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
      
      // Get the shapes being moved and sort by their current zIndex to preserve relative ordering
      const shapesToMove = shapes.filter(s => shapeIds.includes(s.id));
      shapesToMove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      const batch = writeBatch(firestore);
      
      // Assign decrementing z-indices starting from min-1, preserving original order
      shapesToMove.forEach((shape, index) => {
        const newZIndex = minZIndex - shapesToMove.length + index;
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      
      console.log(`✅ Batch sent ${shapeIds.length} shapes to back atomically (preserving relative order)`);
    } catch (error) {
      console.error('❌ Error batch sending shapes to back:', error);
      throw error;
    }
  }

  /**
   * Bring shape forward (swap with overlapping shape immediately above)
   * Only considers shapes that actually overlap with the target shape
   */
  async bringForward(shapeId: string): Promise<void> {
    try {
      const shapes = await this.getShapes();
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      
      // Find overlapping shapes above (sorted by z-index ascending)
      const overlappingShapesAbove = findOverlappingShapesAbove(currentShape, shapes);
      
      if (overlappingShapesAbove.length === 0) {
        // No overlapping shapes above - check if there are any shapes above at all
        const anyShapesAbove = shapes.filter(s => (s.zIndex || 0) > currentZIndex);
        
        if (anyShapesAbove.length === 0) {
          console.log(`ℹ️ Shape ${shapeId} is already at the top`);
        } else {
          console.log(`ℹ️ No overlapping shapes above ${shapeId} - no visual change would occur`);
        }
        return;
      }

      // Get the overlapping shape immediately above (lowest z-index among overlapping shapes above)
      const shapeAbove = overlappingShapesAbove[0];
      const shapeAboveZIndex = shapeAbove.zIndex || 0;

      // Swap z-indices atomically
      const batch = writeBatch(firestore);
      
      const currentShapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      batch.update(currentShapeRef, {
        zIndex: shapeAboveZIndex,
        updatedAt: serverTimestamp(),
      });
      
      const shapeAboveRef = doc(firestore, this.shapesCollectionPath, shapeAbove.id);
      batch.update(shapeAboveRef, {
        zIndex: currentZIndex,
        updatedAt: serverTimestamp(),
      });
      
      await batch.commit();
      
      console.log(`✅ Shape brought forward: ${shapeId} (${currentZIndex} → ${shapeAboveZIndex}), swapped with overlapping shape ${shapeAbove.id}`);
    } catch (error) {
      console.error('❌ Error bringing shape forward:', error);
      throw error;
    }
  }

  /**
   * Bring multiple shapes forward atomically (batch operation)
   * All shapes move together by the same z-index amount to stay together
   */
  async batchBringForward(shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await this.getShapes();
      const batch = writeBatch(firestore);
      
      // Get all selected shapes and sort them by current z-index
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      if (selectedShapes.length === 0) return;
      
      // Get the z-index range of selected shapes
      const selectedZIndices = selectedShapes.map(s => s.zIndex || 0);
      const minSelectedZIndex = Math.min(...selectedZIndices);
      const maxSelectedZIndex = Math.max(...selectedZIndices);
      
      console.log('🔍 BATCH BRING FORWARD DEBUG:', {
        shapeIds,
        selectedCount: selectedShapes.length,
        zIndexRange: `${minSelectedZIndex} to ${maxSelectedZIndex}`,
        selectedShapes: selectedShapes.map(s => ({ id: s.id, zIndex: s.zIndex, groupId: s.groupId }))
      });
      
      // Find all shapes that overlap with ANY of the selected shapes
      const overlappingShapesAbove = shapes.filter(shape => {
        // Skip if it's one of our selected shapes
        if (shapeIds.includes(shape.id)) return false;
        
        // Skip if it's below or at the same level as any selected shape
        const shapeZIndex = shape.zIndex || 0;
        if (shapeZIndex <= maxSelectedZIndex) return false;
        
        // Check if this shape overlaps with any of our selected shapes
        return selectedShapes.some(selectedShape => {
          return this.shapesOverlap(selectedShape, shape);
        });
      });
      
      console.log('🔍 Found overlapping shapes above:', overlappingShapesAbove.map(s => ({ id: s.id, zIndex: s.zIndex })));
      
      if (overlappingShapesAbove.length === 0) {
        console.log(`ℹ️ No overlapping shapes above to swap forward`);
        return;
      }
      
      // Find the shape with the lowest z-index among overlapping shapes above
      overlappingShapesAbove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const targetShape = overlappingShapesAbove[0];
      const targetZIndex = targetShape.zIndex || 0;
      
      // Calculate the z-index shift needed to move above the target
      const zIndexShift = targetZIndex - minSelectedZIndex + 1;
      
      console.log('🔍 Swapping with target:', {
        targetId: targetShape.id,
        targetZIndex,
        zIndexShift,
        newPositions: selectedShapes.map(s => ({ id: s.id, old: s.zIndex, new: (s.zIndex || 0) + zIndexShift }))
      });
      
      // Update all selected shapes by shifting their z-index by the same amount
      for (const shape of selectedShapes) {
        const currentZIndex = shape.zIndex || 0;
        const newZIndex = currentZIndex + zIndexShift;
        
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      }
      
      // Shift down the target shape to make room
      const targetShapeRef = doc(firestore, this.shapesCollectionPath, targetShape.id);
      batch.update(targetShapeRef, {
        zIndex: minSelectedZIndex,
        updatedAt: serverTimestamp(),
      });
      
      await batch.commit();
      console.log(`✅ Batch brought ${shapeIds.length} shapes forward together (shift: +${zIndexShift})`);
    } catch (error) {
      console.error('❌ Error batch bringing shapes forward:', error);
      throw error;
    }
  }
  
  /**
   * Helper to check if two shapes overlap in 2D space
   */
  private shapesOverlap(shape1: ShapeData, shape2: ShapeData): boolean {
    // Get bounds for shape1
    let left1: number, right1: number, top1: number, bottom1: number;
    if (shape1.type === 'circle' && shape1.radius) {
      left1 = shape1.x - shape1.radius;
      right1 = shape1.x + shape1.radius;
      top1 = shape1.y - shape1.radius;
      bottom1 = shape1.y + shape1.radius;
    } else {
      left1 = shape1.x;
      right1 = shape1.x + shape1.width;
      top1 = shape1.y;
      bottom1 = shape1.y + shape1.height;
    }
    
    // Get bounds for shape2
    let left2: number, right2: number, top2: number, bottom2: number;
    if (shape2.type === 'circle' && shape2.radius) {
      left2 = shape2.x - shape2.radius;
      right2 = shape2.x + shape2.radius;
      top2 = shape2.y - shape2.radius;
      bottom2 = shape2.y + shape2.radius;
    } else {
      left2 = shape2.x;
      right2 = shape2.x + shape2.width;
      top2 = shape2.y;
      bottom2 = shape2.y + shape2.height;
    }
    
    // Check if rectangles overlap
    return !(
      right1 < left2 ||
      left1 > right2 ||
      bottom1 < top2 ||
      top1 > bottom2
    );
  }

  /**
   * Send shape backward (swap with overlapping shape immediately below)
   * Only considers shapes that actually overlap with the target shape
   */
  async sendBackward(shapeId: string): Promise<void> {
    try {
      const shapes = await this.getShapes();
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      
      // Find overlapping shapes below (sorted by z-index descending)
      const overlappingShapesBelow = findOverlappingShapesBelow(currentShape, shapes);
      
      if (overlappingShapesBelow.length === 0) {
        // No overlapping shapes below - check if there are any shapes below at all
        const anyShapesBelow = shapes.filter(s => (s.zIndex || 0) < currentZIndex);
        
        if (anyShapesBelow.length === 0) {
          console.log(`ℹ️ Shape ${shapeId} is already at the bottom`);
        } else {
          console.log(`ℹ️ No overlapping shapes below ${shapeId} - no visual change would occur`);
        }
        return;
      }

      // Get the overlapping shape immediately below (highest z-index among overlapping shapes below)
      const shapeBelow = overlappingShapesBelow[0];
      const shapeBelowZIndex = shapeBelow.zIndex || 0;

      // Swap z-indices atomically
      const batch = writeBatch(firestore);
      
      const currentShapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      batch.update(currentShapeRef, {
        zIndex: shapeBelowZIndex,
        updatedAt: serverTimestamp(),
      });
      
      const shapeBelowRef = doc(firestore, this.shapesCollectionPath, shapeBelow.id);
      batch.update(shapeBelowRef, {
        zIndex: currentZIndex,
        updatedAt: serverTimestamp(),
      });
      
      await batch.commit();
      
      console.log(`✅ Shape sent backward: ${shapeId} (${currentZIndex} → ${shapeBelowZIndex}), swapped with overlapping shape ${shapeBelow.id}`);
    } catch (error) {
      console.error('❌ Error sending shape backward:', error);
      throw error;
    }
  }

  /**
   * Send multiple shapes backward atomically (batch operation)
   * All shapes move together by the same z-index amount to stay together
   */
  async batchSendBackward(shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await this.getShapes();
      const batch = writeBatch(firestore);
      
      // Get all selected shapes and sort them by current z-index
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      if (selectedShapes.length === 0) return;
      
      // Get the z-index range of selected shapes
      const selectedZIndices = selectedShapes.map(s => s.zIndex || 0);
      const minSelectedZIndex = Math.min(...selectedZIndices);
      const maxSelectedZIndex = Math.max(...selectedZIndices);
      
      console.log('🔍 BATCH SEND BACKWARD DEBUG:', {
        shapeIds,
        selectedCount: selectedShapes.length,
        zIndexRange: `${minSelectedZIndex} to ${maxSelectedZIndex}`,
        selectedShapes: selectedShapes.map(s => ({ id: s.id, zIndex: s.zIndex, groupId: s.groupId }))
      });
      
      // Find all shapes that overlap with ANY of the selected shapes
      const overlappingShapesBelow = shapes.filter(shape => {
        // Skip if it's one of our selected shapes
        if (shapeIds.includes(shape.id)) return false;
        
        // Skip if it's above or at the same level as any selected shape
        const shapeZIndex = shape.zIndex || 0;
        if (shapeZIndex >= minSelectedZIndex) return false;
        
        // Check if this shape overlaps with any of our selected shapes
        return selectedShapes.some(selectedShape => {
          return this.shapesOverlap(selectedShape, shape);
        });
      });
      
      console.log('🔍 Found overlapping shapes below:', overlappingShapesBelow.map(s => ({ id: s.id, zIndex: s.zIndex })));
      
      if (overlappingShapesBelow.length === 0) {
        console.log(`ℹ️ No overlapping shapes below to swap backward`);
        return;
      }
      
      // Find the shape with the highest z-index among overlapping shapes below
      overlappingShapesBelow.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      const targetShape = overlappingShapesBelow[0];
      const targetZIndex = targetShape.zIndex || 0;
      
      // Calculate the z-index shift needed to move below the target
      const zIndexShift = targetZIndex - maxSelectedZIndex - 1;
      
      console.log('🔍 Swapping with target:', {
        targetId: targetShape.id,
        targetZIndex,
        zIndexShift,
        newPositions: selectedShapes.map(s => ({ id: s.id, old: s.zIndex, new: (s.zIndex || 0) + zIndexShift }))
      });
      
      // Update all selected shapes by shifting their z-index by the same amount
      for (const shape of selectedShapes) {
        const currentZIndex = shape.zIndex || 0;
        const newZIndex = currentZIndex + zIndexShift;
        
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      }
      
      // Shift up the target shape to make room
      const targetShapeRef = doc(firestore, this.shapesCollectionPath, targetShape.id);
      batch.update(targetShapeRef, {
        zIndex: maxSelectedZIndex,
        updatedAt: serverTimestamp(),
      });
      
      await batch.commit();
      console.log(`✅ Batch sent ${shapeIds.length} shapes backward together (shift: ${zIndexShift})`);
    } catch (error) {
      console.error('❌ Error batch sending shapes backward:', error);
      throw error;
    }
  }

  // ============================================
  // Alignment Methods
  // ============================================

  /**
   * Align multiple shapes along a common edge or center
   */
  async alignShapes(
    shapeIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<void> {
    try {
      if (shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required for alignment');
      }

      // Fetch all shapes
      const shapeDocs = await Promise.all(
        shapeIds.map(id => getDoc(doc(firestore, this.shapesCollectionPath, id)))
      );

      const shapes = shapeDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ShapeData));

      if (shapes.length < 2) {
        throw new Error('Not enough valid shapes found for alignment');
      }

      // Helper function to get shape bounds considering circle center positioning
      const getShapeBounds = (shape: ShapeData) => {
        if (shape.type === 'circle' && shape.radius) {
          // For circles: x,y is center, so bounds are center ± radius
          return {
            left: shape.x - shape.radius,
            right: shape.x + shape.radius,
            top: shape.y - shape.radius,
            bottom: shape.y + shape.radius,
            centerX: shape.x,
            centerY: shape.y,
          };
        } else {
          // For rectangles/triangles/text: x,y is top-left corner
          return {
            left: shape.x,
            right: shape.x + shape.width,
            top: shape.y,
            bottom: shape.y + shape.height,
            centerX: shape.x + shape.width / 2,
            centerY: shape.y + shape.height / 2,
          };
        }
      };

      console.log('🎯 Aligning shapes:', {
        alignment,
        shapeCount: shapes.length,
        shapes: shapes.map(s => {
          const bounds = getShapeBounds(s);
          return {
            id: s.id.slice(0, 6),
            type: s.type,
            x: s.x,
            y: s.y,
            radius: s.radius,
            bounds,
          };
        })
      });

      // Calculate target position based on alignment type
      let targetValue: number;

      switch (alignment) {
        case 'left':
          // Align all shapes to the leftmost edge
          targetValue = Math.min(...shapes.map(s => getShapeBounds(s).left));
          break;

        case 'center':
          // Align all shapes to the average center x position
          const avgCenterX = shapes.reduce((sum, s) => sum + getShapeBounds(s).centerX, 0) / shapes.length;
          targetValue = avgCenterX;
          break;

        case 'right':
          // Align all shapes to the rightmost edge
          targetValue = Math.max(...shapes.map(s => getShapeBounds(s).right));
          break;

        case 'top':
          // Align all shapes to the topmost edge
          targetValue = Math.min(...shapes.map(s => getShapeBounds(s).top));
          break;

        case 'middle':
          // Align all shapes to the average center y position
          const avgCenterY = shapes.reduce((sum, s) => sum + getShapeBounds(s).centerY, 0) / shapes.length;
          targetValue = avgCenterY;
          break;

        case 'bottom':
          // Align all shapes to the bottommost edge
          targetValue = Math.max(...shapes.map(s => getShapeBounds(s).bottom));
          console.log('🎯 Bottom alignment - target bottom edge:', targetValue);
          break;

        default:
          throw new Error(`Invalid alignment type: ${alignment}`);
      }

      // Update all shapes using batch write
      const batch = writeBatch(firestore);

      shapes.forEach(shape => {
        const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
        const updates: any = { updatedAt: serverTimestamp() };
        const isCircle = shape.type === 'circle' && shape.radius;

        // Calculate new position based on alignment type
        if (alignment === 'left') {
          // Align left edges
          if (isCircle) {
            updates.x = targetValue + shape.radius!; // x is center, so x = leftEdge + radius
          } else {
            updates.x = targetValue; // x is already left edge
          }
        } else if (alignment === 'center') {
          // Align horizontal centers
          if (isCircle) {
            updates.x = targetValue; // x is already center
          } else {
            updates.x = targetValue - shape.width / 2; // x = centerX - width/2
          }
        } else if (alignment === 'right') {
          // Align right edges
          if (isCircle) {
            updates.x = targetValue - shape.radius!; // x is center, so x = rightEdge - radius
          } else {
            updates.x = targetValue - shape.width; // x = rightEdge - width
          }
        } else if (alignment === 'top') {
          // Align top edges
          if (isCircle) {
            updates.y = targetValue + shape.radius!; // y is center, so y = topEdge + radius
          } else {
            updates.y = targetValue; // y is already top edge
          }
        } else if (alignment === 'middle') {
          // Align vertical centers
          if (isCircle) {
            updates.y = targetValue; // y is already center
          } else {
            updates.y = targetValue - shape.height / 2; // y = centerY - height/2
          }
        } else if (alignment === 'bottom') {
          // Align bottom edges
          if (isCircle) {
            updates.y = targetValue - shape.radius!; // y is center, so y = bottomEdge - radius
            console.log(`  Circle ${shape.id.slice(0, 6)}: y ${shape.y} → ${updates.y} (bottom: ${shape.y + shape.radius!} → ${updates.y + shape.radius!})`);
          } else {
            updates.y = targetValue - shape.height; // y = bottomEdge - height
            console.log(`  Shape ${shape.id.slice(0, 6)}: y ${shape.y} → ${updates.y} (bottom: ${shape.y + shape.height} → ${updates.y + shape.height})`);
          }
        }

        batch.update(shapeRef, updates);
      });

      await batch.commit();
      console.log(`✅ Aligned ${shapes.length} shapes: ${alignment}`);
    } catch (error) {
      console.error('❌ Error aligning shapes:', error);
      throw error;
    }
  }

  /**
   * Distribute shapes evenly along horizontal or vertical axis
   * Uses center-based distribution for visually even spacing
   */
  async distributeShapes(
    shapeIds: string[],
    direction: 'horizontal' | 'vertical'
  ): Promise<void> {
    try {
      if (shapeIds.length < 3) {
        throw new Error('At least 3 shapes are required for distribution');
      }

      // Fetch all shapes
      const shapeDocs = await Promise.all(
        shapeIds.map(id => getDoc(doc(firestore, this.shapesCollectionPath, id)))
      );

      const shapes = shapeDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ShapeData));

      if (shapes.length < 3) {
        throw new Error('Not enough valid shapes found for distribution');
      }

      // Helper function to get shape center considering circle positioning
      const getShapeCenter = (shape: ShapeData) => {
        if (shape.type === 'circle' && shape.radius) {
          // For circles: x,y is already the center
          return {
            centerX: shape.x,
            centerY: shape.y,
          };
        } else {
          // For rectangles/triangles/text: x,y is top-left corner
          return {
            centerX: shape.x + shape.width / 2,
            centerY: shape.y + shape.height / 2,
          };
        }
      };

      const batch = writeBatch(firestore);

      if (direction === 'horizontal') {
        // Sort shapes by center x position (left to right)
        shapes.sort((a, b) => getShapeCenter(a).centerX - getShapeCenter(b).centerX);

        console.log('🎯 Horizontal distribution (center-based):', {
          shapeCount: shapes.length,
          shapes: shapes.map(s => {
            const center = getShapeCenter(s);
            return {
              id: s.id.slice(0, 6),
              type: s.type,
              x: s.x,
              width: s.width,
              centerX: center.centerX,
            };
          })
        });

        // Get leftmost and rightmost center positions
        const leftmostCenter = getShapeCenter(shapes[0]).centerX;
        const rightmostCenter = getShapeCenter(shapes[shapes.length - 1]).centerX;
        
        // Calculate even spacing between centers
        const totalDistance = rightmostCenter - leftmostCenter;
        const centerSpacing = totalDistance / (shapes.length - 1);

        console.log('📏 Distribution calculation:', {
          leftmostCenter,
          rightmostCenter,
          totalDistance,
          centerSpacing,
        });

        // Position each shape so their centers are evenly spaced
        shapes.forEach((shape, index) => {
          if (index === 0 || index === shapes.length - 1) {
            // Keep first and last shapes in place
            return;
          }

          // Calculate the target center X position
          const targetCenterX = leftmostCenter + (index * centerSpacing);

          // Calculate the new x position based on shape type
          let newX: number;
          if (shape.type === 'circle' && shape.radius) {
            // For circles: x is already the center
            newX = targetCenterX;
          } else {
            // For rectangles/triangles/text: x is top-left, so x = centerX - width/2
            newX = targetCenterX - shape.width / 2;
          }

          console.log(`  Shape ${index} (${shape.id.slice(0, 6)}): centerX ${getShapeCenter(shape).centerX} → ${targetCenterX}, x ${shape.x} → ${newX}`);

          const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
          batch.update(shapeRef, {
            x: newX,
            updatedAt: serverTimestamp(),
          });
        });
      } else {
        // Sort shapes by center y position (top to bottom)
        shapes.sort((a, b) => getShapeCenter(a).centerY - getShapeCenter(b).centerY);

        console.log('🎯 Vertical distribution (center-based):', {
          shapeCount: shapes.length,
          shapes: shapes.map(s => {
            const center = getShapeCenter(s);
            return {
              id: s.id.slice(0, 6),
              type: s.type,
              y: s.y,
              height: s.height,
              centerY: center.centerY,
            };
          })
        });

        // Get topmost and bottommost center positions
        const topmostCenter = getShapeCenter(shapes[0]).centerY;
        const bottommostCenter = getShapeCenter(shapes[shapes.length - 1]).centerY;
        
        // Calculate even spacing between centers
        const totalDistance = bottommostCenter - topmostCenter;
        const centerSpacing = totalDistance / (shapes.length - 1);

        console.log('📏 Distribution calculation:', {
          topmostCenter,
          bottommostCenter,
          totalDistance,
          centerSpacing,
        });

        // Position each shape so their centers are evenly spaced
        shapes.forEach((shape, index) => {
          if (index === 0 || index === shapes.length - 1) {
            // Keep first and last shapes in place
            return;
          }

          // Calculate the target center Y position
          const targetCenterY = topmostCenter + (index * centerSpacing);

          // Calculate the new y position based on shape type
          let newY: number;
          if (shape.type === 'circle' && shape.radius) {
            // For circles: y is already the center
            newY = targetCenterY;
          } else {
            // For rectangles/triangles/text: y is top edge, so y = centerY - height/2
            newY = targetCenterY - shape.height / 2;
          }

          console.log(`  Shape ${index} (${shape.id.slice(0, 6)}): centerY ${getShapeCenter(shape).centerY} → ${targetCenterY}, y ${shape.y} → ${newY}`);

          const shapeRef = doc(firestore, this.shapesCollectionPath, shape.id);
          batch.update(shapeRef, {
            y: newY,
            updatedAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();
      console.log(`✅ Distributed ${shapes.length} shapes (center-based): ${direction}`);
    } catch (error) {
      console.error('❌ Error distributing shapes:', error);
      throw error;
    }
  }

  // ============================================
  // Comment Methods
  // ============================================

  /**
   * Add a new comment to a shape
   */
  async addComment(shapeId: string, text: string, userId: string, username: string): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the comment
      const commentId = doc(collection(firestore, this.commentsCollectionPath)).id;
      
      const commentData: Omit<CommentData, 'id'> = {
        shapeId,
        userId,
        username,
        text,
        createdAt: serverTimestamp() as Timestamp,
        resolved: false,
        replies: [],
        replyReadStatus: {},
        lastReplyAt: null,
      };

      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      await setDoc(commentRef, commentData);

      console.log(`✅ Comment created: ${commentId} on shape ${shapeId}`);
      return commentId;
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Add a reply to an existing comment
   */
  async addReply(commentId: string, userId: string, username: string, text: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      // Use Firestore Timestamp.now() instead of serverTimestamp() for array elements
      // serverTimestamp() is a sentinel that doesn't work well with arrayUnion
      const newReply: CommentReply = {
        userId,
        username,
        text,
        createdAt: FirestoreTimestamp.now(),
      };

      // Use arrayUnion to properly append to the replies array
      // Also update lastReplyAt to track when the last reply was added
      await updateDoc(commentRef, {
        replies: arrayUnion(newReply),
        lastReplyAt: FirestoreTimestamp.now(),
      });

      console.log(`✅ Reply added to comment: ${commentId}`);
    } catch (error) {
      console.error('❌ Error adding reply:', error);
      throw error;
    }
  }

  /**
   * Mark replies as read for a specific user
   */
  async markRepliesAsRead(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        console.warn('⚠️ Comment not found:', commentId);
        return;
      }

      // Update the replyReadStatus to mark this timestamp as read for this user
      await updateDoc(commentRef, {
        [`replyReadStatus.${userId}`]: FirestoreTimestamp.now(),
      });

      console.log(`✅ Replies marked as read for user ${userId} on comment ${commentId}`);
    } catch (error) {
      console.error('❌ Error marking replies as read:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Mark a comment as resolved (Author or Project Owner only)
   */
  async resolveComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      // For MVP, allow any authenticated user to resolve
      // TODO: Add project owner check in future
      if (comment.userId !== userId) {
        // For now, we'll allow anyone to resolve (simplified MVP)
        // In production, check if userId is project owner
        console.log('⚠️ User is not comment author, but allowing resolution for MVP');
      }

      await updateDoc(commentRef, {
        resolved: true,
      });

      console.log(`✅ Comment resolved: ${commentId}`);
    } catch (error) {
      console.error('❌ Error resolving comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (Author only)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      // Only allow the comment author to delete
      if (comment.userId !== userId) {
        throw new Error('Only the comment author can delete this comment');
      }

      await deleteDoc(commentRef);
      console.log(`✅ Comment deleted: ${commentId}`);
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Delete a reply from a comment (Reply author only)
   */
  async deleteReply(commentId: string, replyIndex: number, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      // Check if reply index is valid
      if (!comment.replies || replyIndex < 0 || replyIndex >= comment.replies.length) {
        throw new Error('Reply not found');
      }

      const reply = comment.replies[replyIndex];
      
      // Only allow the reply author to delete their reply
      if (reply.userId !== userId) {
        throw new Error('Only the reply author can delete this reply');
      }

      // Create new replies array without the deleted reply
      const updatedReplies = comment.replies.filter((_, index) => index !== replyIndex);

      // Update the comment with the new replies array
      await updateDoc(commentRef, {
        replies: updatedReplies,
      });

      console.log(`✅ Reply deleted from comment: ${commentId}`);
    } catch (error) {
      console.error('❌ Error deleting reply:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time comment updates
   */
  subscribeToComments(callback: (comments: CommentData[]) => void): Unsubscribe {
    try {
      const commentsRef = collection(firestore, this.commentsCollectionPath);
      const q = query(commentsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const comments: CommentData[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure new fields exist with default values for backward compatibility
            comments.push({
              id: doc.id,
              ...data,
              replyReadStatus: data.replyReadStatus || {},
              lastReplyAt: data.lastReplyAt || null,
            } as CommentData);
          });

          callback(comments);
        },
        (error) => {
          console.error('❌ Error in comments subscription:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to comments:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Get comments for a specific shape (one-time fetch)
   */
  async getCommentsByShapeId(shapeId: string): Promise<CommentData[]> {
    try {
      const commentsRef = collection(firestore, this.commentsCollectionPath);
      const snapshot = await getDocs(commentsRef);

      const comments: CommentData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const comment = {
          id: doc.id,
          ...data,
          replyReadStatus: data.replyReadStatus || {},
          lastReplyAt: data.lastReplyAt || null,
        } as CommentData;
        
        if (comment.shapeId === shapeId) {
          comments.push(comment);
        }
      });

      return comments;
    } catch (error) {
      console.error('❌ Error fetching comments for shape:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;

