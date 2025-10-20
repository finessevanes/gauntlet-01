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
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';
import { MIN_SHAPE_WIDTH, MIN_SHAPE_HEIGHT } from '../utils/constants';
import { calculateTextDimensions } from '../utils/textEditingHelpers';
import { requirementsMonitor } from '../utils/performanceRequirements';
import type { ShapeData, ShapeCreateInput, ShapeUpdateInput } from './types/canvasTypes';

class ShapeService {
  /**
   * Get shapes collection path for a specific canvas
   */
  private getShapesPath(canvasId: string): string {
    return `canvases/${canvasId}/shapes`;
  }

  async createShape(canvasId: string, shapeInput: ShapeCreateInput): Promise<string> {
    const startTime = Date.now();
    
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeId = doc(collection(firestore, shapesPath)).id;
      
      let zIndex = shapeInput.zIndex;
      if (zIndex === undefined) {
        const shapes = await this.getShapes(canvasId);
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

      const shapeRef = doc(firestore, shapesPath, shapeId);
      await setDoc(shapeRef, shapeData);

      const latency = Date.now() - startTime;
      requirementsMonitor.trackObjectSync(latency);

      console.log(`✅ Shape created with zIndex: ${zIndex} (${latency}ms)`);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      throw error;
    }
  }

  async updateShape(canvasId: string, shapeId: string, updates: ShapeUpdateInput): Promise<void> {
    const startTime = Date.now();
    
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
      await updateDoc(shapeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      const latency = Date.now() - startTime;
      requirementsMonitor.trackObjectSync(latency);
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      throw error;
    }
  }

  async updateShapeText(canvasId: string, shapeId: string, text: string): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async updateTextFormatting(
    canvasId: string,
    shapeId: string, 
    formatting: {
      fontWeight?: 'normal' | 'bold';
      fontStyle?: 'normal' | 'italic';
      textDecoration?: 'none' | 'underline';
      fontSize?: number;
    }
  ): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
      await updateDoc(shapeRef, {
        ...formatting,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Text formatting updated:', shapeId, formatting);
    } catch (error) {
      console.error('❌ Error updating text formatting:', error);
      throw error;
    }
  }

  async batchUpdateShapes(canvasId: string, updates: Array<{ shapeId: string; updates: ShapeUpdateInput }>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const batch = writeBatch(firestore);
      
      for (const { shapeId, updates: shapeUpdates } of updates) {
        const shapeRef = doc(firestore, shapesPath, shapeId);
        batch.update(shapeRef, {
          ...shapeUpdates,
          updatedAt: serverTimestamp(),
        });
      }
      
      await batch.commit();
      
      const latency = Date.now() - startTime;
      requirementsMonitor.trackObjectSync(latency);
      
      console.log(`✅ Batch updated ${updates.length} shapes atomically (${latency}ms)`);
    } catch (error) {
      console.error('❌ Error batch updating shapes:', error);
      throw error;
    }
  }

  async lockShape(canvasId: string, shapeId: string, userId: string): Promise<{ success: boolean; lockedByUsername?: string }> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
      const shapeSnap = await getDoc(shapeRef);
      
      if (!shapeSnap.exists()) {
        console.error('❌ Shape not found:', shapeId);
        return { success: false };
      }

      const shapeData = shapeSnap.data() as ShapeData;
      const now = Date.now();
      
      if (shapeData.lockedBy && shapeData.lockedBy !== userId && shapeData.lockedAt) {
        const lockedAtTime = shapeData.lockedAt.toMillis();
        const lockAge = now - lockedAtTime;
        const LOCK_TIMEOUT_MS = 5000;

        if (lockAge < LOCK_TIMEOUT_MS) {
          console.log(`🔒 Shape locked by another user (${lockAge}ms ago)`);
          
          const usersRef = collection(firestore, 'users');
          const userDocRef = doc(usersRef, shapeData.lockedBy);
          const userSnap = await getDoc(userDocRef);
          const lockedByUsername = userSnap.exists() ? userSnap.data().username : 'another user';
          
          return { success: false, lockedByUsername };
        } else {
          console.log(`⏰ Lock expired (${lockAge}ms), acquiring lock`);
        }
      }

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

  async unlockShape(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async resizeShape(canvasId: string, shapeId: string, width: number, height: number): Promise<void> {
    try {
      if (width < MIN_SHAPE_WIDTH || height < MIN_SHAPE_HEIGHT) {
        throw new Error(`Minimum size is ${MIN_SHAPE_WIDTH}×${MIN_SHAPE_HEIGHT} pixels`);
      }
      
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async rotateShape(canvasId: string, shapeId: string, rotation: number): Promise<void> {
    try {
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async resizeCircle(canvasId: string, shapeId: string, radius: number): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async deleteShape(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
      await deleteDoc(shapeRef);
      console.log('✅ Shape deleted:', shapeId);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }

  async deleteAllShapes(canvasId: string): Promise<void> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapesRef = collection(firestore, shapesPath);
      const snapshot = await getDocs(shapesRef);
      
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

  async duplicateShape(canvasId: string, shapeId: string, userId: string): Promise<string> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
      const shapeSnap = await getDoc(shapeRef);
      
      if (!shapeSnap.exists()) {
        throw new Error('Shape not found');
      }

      const originalShape = shapeSnap.data() as ShapeData;
      
      const OFFSET = 20;
      const newShapeInput: ShapeCreateInput = {
        type: originalShape.type,
        x: originalShape.x + OFFSET,
        y: originalShape.y + OFFSET,
        width: originalShape.width,
        height: originalShape.height,
        color: originalShape.color,
        rotation: originalShape.rotation,
        groupId: null,
        createdBy: userId,
      };

      if (originalShape.type === 'circle' && originalShape.radius) {
        newShapeInput.radius = originalShape.radius;
      }
      
      if (originalShape.type === 'text') {
        newShapeInput.text = originalShape.text;
        if (originalShape.fontSize !== undefined) newShapeInput.fontSize = originalShape.fontSize;
        if (originalShape.fontWeight !== undefined) newShapeInput.fontWeight = originalShape.fontWeight;
        if (originalShape.fontStyle !== undefined) newShapeInput.fontStyle = originalShape.fontStyle;
        if (originalShape.textDecoration !== undefined) newShapeInput.textDecoration = originalShape.textDecoration;
      }

      const newShapeId = await this.createShape(canvasId, newShapeInput);
      console.log('✅ Shape duplicated:', shapeId, '->', newShapeId);
      return newShapeId;
    } catch (error) {
      console.error('❌ Error duplicating shape:', error);
      throw error;
    }
  }

  async createCircle(canvasId: string, circleData: { 
    x: number; 
    y: number; 
    radius: number; 
    color: string; 
    createdBy: string;
  }): Promise<string> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeId = doc(collection(firestore, shapesPath)).id;
      
      const shapes = await this.getShapes(canvasId);
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

      const shapeRef = doc(firestore, shapesPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Circle shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating circle shape:', error);
      throw error;
    }
  }

  async createTriangle(canvasId: string, triangleData: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    color: string; 
    createdBy: string;
  }): Promise<string> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeId = doc(collection(firestore, shapesPath)).id;
      
      const shapes = await this.getShapes(canvasId);
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

      const shapeRef = doc(firestore, shapesPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Triangle shape created:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating triangle shape:', error);
      throw error;
    }
  }

  async createText(canvasId: string, textData: { 
    x: number; 
    y: number; 
    color: string; 
    createdBy: string;
    text?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
  }): Promise<string> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapeId = doc(collection(firestore, shapesPath)).id;
      
      const shapes = await this.getShapes(canvasId);
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
      const zIndex = maxZIndex + 1;
      
      const actualText = textData.text || 'TEXT';
      const actualFontSize = textData.fontSize || 24;
      const actualFontWeight = textData.fontWeight || 'normal';
      const textDimensions = calculateTextDimensions(actualText, actualFontSize, actualFontWeight);
      const padding = 4;
      const calculatedWidth = textDimensions.width + padding * 2;
      const calculatedHeight = textDimensions.height + padding * 2;
      
      const shapeData: Omit<ShapeData, 'id'> = {
        type: 'text',
        x: textData.x,
        y: textData.y,
        width: calculatedWidth,
        height: calculatedHeight,
        text: actualText,
        fontSize: actualFontSize,
        fontWeight: textData.fontWeight || 'normal',
        fontStyle: textData.fontStyle || 'normal',
        textDecoration: textData.textDecoration || 'none',
        color: textData.color,
        rotation: 0,
        groupId: null,
        zIndex,
        createdBy: textData.createdBy,
        createdAt: serverTimestamp() as Timestamp,
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const shapeRef = doc(firestore, shapesPath, shapeId);
      await setDoc(shapeRef, shapeData);

      console.log('✅ Text shape created above and to the right of cursor:', shapeId);
      return shapeId;
    } catch (error) {
      console.error('❌ Error creating text shape:', error);
      throw error;
    }
  }

  subscribeToShapes(canvasId: string, callback: (shapes: ShapeData[]) => void): Unsubscribe {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapesRef = collection(firestore, shapesPath);
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
      return () => {};
    }
  }

  async getShapes(canvasId: string): Promise<ShapeData[]> {
    try {
      const shapesPath = this.getShapesPath(canvasId);
      const shapesRef = collection(firestore, shapesPath);
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
}

export const shapeService = new ShapeService();
export default ShapeService;

