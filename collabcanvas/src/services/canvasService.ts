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
  writeBatch
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';
import { MIN_SHAPE_WIDTH, MIN_SHAPE_HEIGHT } from '../utils/constants';

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

export type ShapeCreateInput = Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt' | 'groupId' | 'zIndex'> & {
  groupId?: string | null;
  zIndex?: number;
};
export type ShapeUpdateInput = Partial<Pick<ShapeData, 'x' | 'y' | 'width' | 'height' | 'color' | 'rotation'>>;

class CanvasService {
  private shapesCollectionPath = 'canvases/main/shapes';
  private groupsCollectionPath = 'canvases/main/groups';
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
   * Create a new text shape in Firestore
   */
  async createText(
    text: string,
    x: number,
    y: number,
    color: string,
    createdBy: string,
    options?: {
      fontSize?: number;
      fontWeight?: 'normal' | 'bold';
      fontStyle?: 'normal' | 'italic';
      textDecoration?: 'none' | 'underline';
    }
  ): Promise<string> {
    try {
      // Ensure parent document exists
      await this.ensureCanvasDocExists();
      
      // Generate a unique ID for the text shape
      const shapeId = doc(collection(firestore, this.shapesCollectionPath)).id;
      
      // Calculate initial text dimensions
      const fontSize = options?.fontSize || 16;
      const padding = 4;
      const estimatedWidth = text.length * fontSize * 0.6;
      const estimatedHeight = fontSize * 1.2;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      
      // Auto-increment z-index: new shapes appear on top by default
      const shapes = await this.getShapes();
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      const zIndex = maxZIndex + 1;
      
      const textData: Omit<ShapeData, 'id'> = {
        type: 'text',
        text,
        x,
        y,
        width, // Calculate initial width based on text content
        height, // Calculate initial height based on font size
        color,
        fontSize,
        fontWeight: options?.fontWeight || 'normal',
        fontStyle: options?.fontStyle || 'normal',
        textDecoration: options?.textDecoration || 'none',
        rotation: 0,
        groupId: null,
        zIndex,
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await setDoc(shapeRef, textData);

      console.log('✅ Text shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating text shape:', error);
      throw error;
    }
  }

  /**
   * Update text content of a text shape
   */
  async updateText(shapeId: string, text: string): Promise<void> {
    try {
      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      // Get current shape to retrieve fontSize
      const shapeSnap = await getDoc(shapeRef);
      if (!shapeSnap.exists()) {
        throw new Error('Shape not found');
      }
      
      const currentShape = shapeSnap.data() as ShapeData;
      const fontSize = currentShape.fontSize || 16;
      
      // Recalculate dimensions based on new text
      const padding = 4;
      const estimatedWidth = text.length * fontSize * 0.6;
      const estimatedHeight = fontSize * 1.2;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      
      await updateDoc(shapeRef, {
        text,
        width,
        height,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Text content updated:', shapeId);
    } catch (error) {
      console.error('❌ Error updating text content:', error);
      throw error;
    }
  }

  /**
   * Update font size of a text shape
   */
  async updateTextFontSize(shapeId: string, fontSize: number): Promise<void> {
    try {
      // Validate font size range (allow any size from 8px to 200px)
      // This allows both dropdown selections and dynamic resize scaling
      const MIN_FONT_SIZE = 8;
      const MAX_FONT_SIZE = 200;
      
      if (fontSize < MIN_FONT_SIZE || fontSize > MAX_FONT_SIZE) {
        throw new Error(`Font size must be between ${MIN_FONT_SIZE}px and ${MAX_FONT_SIZE}px`);
      }

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      
      // Get current shape to retrieve text content
      const shapeSnap = await getDoc(shapeRef);
      if (!shapeSnap.exists()) {
        throw new Error('Shape not found');
      }
      
      const currentShape = shapeSnap.data() as ShapeData;
      const textContent = currentShape.text || '';
      
      // Recalculate dimensions based on new font size
      const padding = 4;
      const estimatedWidth = textContent.length * fontSize * 0.6;
      const estimatedHeight = fontSize * 1.2;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      
      await updateDoc(shapeRef, {
        fontSize,
        width,
        height,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Font size updated:', shapeId, fontSize);
    } catch (error) {
      console.error('❌ Error updating font size:', error);
      throw error;
    }
  }

  /**
   * Update text formatting (bold, italic, underline)
   */
  async updateTextFormatting(
    shapeId: string,
    formatting: {
      fontWeight?: 'normal' | 'bold';
      fontStyle?: 'normal' | 'italic';
      textDecoration?: 'none' | 'underline';
    }
  ): Promise<void> {
    try {
      const updates: any = {
        updatedAt: serverTimestamp(),
      };

      if (formatting.fontWeight !== undefined) {
        updates.fontWeight = formatting.fontWeight;
      }
      if (formatting.fontStyle !== undefined) {
        updates.fontStyle = formatting.fontStyle;
      }
      if (formatting.textDecoration !== undefined) {
        updates.textDecoration = formatting.textDecoration;
      }

      const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
      await updateDoc(shapeRef, updates);
      console.log('✅ Text formatting updated:', shapeId, formatting);
    } catch (error) {
      console.error('❌ Error updating text formatting:', error);
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

      // Update all shapes with groupId via batch write
      const batch = writeBatch(firestore);
      
      for (const shapeId of shapeIds) {
        const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
        batch.update(shapeRef, {
          groupId,
          updatedAt: serverTimestamp(),
        });
      }
      
      await batch.commit();
      
      console.log(`✅ Group created: ${groupId} with ${shapeIds.length} shapes`);
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
   * Bring shape forward (swap with shape immediately above)
   */
  async bringForward(shapeId: string): Promise<void> {
    try {
      const shapes = await this.getShapes();
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      
      // Find all shapes with higher z-index, sorted ascending
      const shapesAbove = shapes
        .filter(s => (s.zIndex || 0) > currentZIndex)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      if (shapesAbove.length === 0) {
        // Already at the top, nothing to do
        console.log(`ℹ️ Shape ${shapeId} is already at the top`);
        return;
      }

      // Get the shape immediately above (lowest z-index among shapes above)
      const shapeAbove = shapesAbove[0];
      const shapeAboveZIndex = shapeAbove.zIndex || 0;

      // Swap z-indices
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
      
      console.log(`✅ Shape brought forward: ${shapeId} (${currentZIndex} → ${shapeAboveZIndex}), swapped with ${shapeAbove.id}`);
    } catch (error) {
      console.error('❌ Error bringing shape forward:', error);
      throw error;
    }
  }

  /**
   * Send shape backward (swap with shape immediately below)
   */
  async sendBackward(shapeId: string): Promise<void> {
    try {
      const shapes = await this.getShapes();
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      
      // Find all shapes with lower z-index, sorted descending
      const shapesBelow = shapes
        .filter(s => (s.zIndex || 0) < currentZIndex)
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      
      if (shapesBelow.length === 0) {
        // Already at the bottom, nothing to do
        console.log(`ℹ️ Shape ${shapeId} is already at the bottom`);
        return;
      }

      // Get the shape immediately below (highest z-index among shapes below)
      const shapeBelow = shapesBelow[0];
      const shapeBelowZIndex = shapeBelow.zIndex || 0;

      // Swap z-indices
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
      
      console.log(`✅ Shape sent backward: ${shapeId} (${currentZIndex} → ${shapeBelowZIndex}), swapped with ${shapeBelow.id}`);
    } catch (error) {
      console.error('❌ Error sending shape backward:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;

