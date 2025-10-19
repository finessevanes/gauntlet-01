import { doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase';
import { findOverlappingShapesAbove, findOverlappingShapesBelow } from '../utils/overlapDetection';
import { shapeService } from './shapeService';
import type { ShapeData } from './types/canvasTypes';

class ZIndexService {
  /**
   * Get shapes collection path for a specific canvas
   */
  private getShapesPath(canvasId: string): string {
    return `canvases/${canvasId}/shapes`;
  }

  async bringToFront(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapes = await shapeService.getShapes(canvasId);
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async batchBringToFront(canvasId: string, shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await shapeService.getShapes(canvasId);
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapesToMove = shapes.filter(s => shapeIds.includes(s.id));
      shapesToMove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      shapesToMove.forEach((shape, index) => {
        const newZIndex = maxZIndex + 1 + index;
        const shapeRef = doc(firestore, shapesPath, shape.id);
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

  async sendToBack(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapes = await shapeService.getShapes(canvasId);
      const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapesPath = this.getShapesPath(canvasId);
      const shapeRef = doc(firestore, shapesPath, shapeId);
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

  async batchSendToBack(canvasId: string, shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await shapeService.getShapes(canvasId);
      const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
      
      const shapesToMove = shapes.filter(s => shapeIds.includes(s.id));
      shapesToMove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      shapesToMove.forEach((shape, index) => {
        const newZIndex = minZIndex - shapesToMove.length + index;
        const shapeRef = doc(firestore, shapesPath, shape.id);
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

  async bringForward(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapes = await shapeService.getShapes(canvasId);
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      const overlappingShapesAbove = findOverlappingShapesAbove(currentShape, shapes);
      
      if (overlappingShapesAbove.length === 0) {
        const anyShapesAbove = shapes.filter(s => (s.zIndex || 0) > currentZIndex);
        
        if (anyShapesAbove.length === 0) {
          console.log(`ℹ️ Shape ${shapeId} is already at the top`);
        } else {
          console.log(`ℹ️ No overlapping shapes above ${shapeId} - no visual change would occur`);
        }
        return;
      }

      const shapeAbove = overlappingShapesAbove[0];
      const shapeAboveZIndex = shapeAbove.zIndex || 0;

      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      const currentShapeRef = doc(firestore, shapesPath, shapeId);
      batch.update(currentShapeRef, {
        zIndex: shapeAboveZIndex,
        updatedAt: serverTimestamp(),
      });
      
      const shapeAboveRef = doc(firestore, shapesPath, shapeAbove.id);
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

  async batchBringForward(canvasId: string, shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await shapeService.getShapes(canvasId);
      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      if (selectedShapes.length === 0) return;
      
      const selectedZIndices = selectedShapes.map(s => s.zIndex || 0);
      const minSelectedZIndex = Math.min(...selectedZIndices);
      const maxSelectedZIndex = Math.max(...selectedZIndices);
      
      const overlappingShapesAbove = shapes.filter(shape => {
        if (shapeIds.includes(shape.id)) return false;
        const shapeZIndex = shape.zIndex || 0;
        if (shapeZIndex <= maxSelectedZIndex) return false;
        
        return selectedShapes.some(selectedShape => {
          return this.shapesOverlap(selectedShape, shape);
        });
      });
      
      if (overlappingShapesAbove.length === 0) {
        console.log(`ℹ️ No overlapping shapes above to swap forward`);
        return;
      }
      
      overlappingShapesAbove.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const targetShape = overlappingShapesAbove[0];
      const targetZIndex = targetShape.zIndex || 0;
      
      const zIndexShift = targetZIndex - minSelectedZIndex + 1;
      
      for (const shape of selectedShapes) {
        const currentZIndex = shape.zIndex || 0;
        const newZIndex = currentZIndex + zIndexShift;
        
        const shapeRef = doc(firestore, shapesPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      }
      
      const targetShapeRef = doc(firestore, shapesPath, targetShape.id);
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

  async sendBackward(canvasId: string, shapeId: string): Promise<void> {
    try {
      const shapes = await shapeService.getShapes(canvasId);
      const currentShape = shapes.find(s => s.id === shapeId);
      
      if (!currentShape) {
        throw new Error('Shape not found');
      }

      const currentZIndex = currentShape.zIndex || 0;
      const overlappingShapesBelow = findOverlappingShapesBelow(currentShape, shapes);
      
      if (overlappingShapesBelow.length === 0) {
        const anyShapesBelow = shapes.filter(s => (s.zIndex || 0) < currentZIndex);
        
        if (anyShapesBelow.length === 0) {
          console.log(`ℹ️ Shape ${shapeId} is already at the bottom`);
        } else {
          console.log(`ℹ️ No overlapping shapes below ${shapeId} - no visual change would occur`);
        }
        return;
      }

      const shapeBelow = overlappingShapesBelow[0];
      const shapeBelowZIndex = shapeBelow.zIndex || 0;

      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      const currentShapeRef = doc(firestore, shapesPath, shapeId);
      batch.update(currentShapeRef, {
        zIndex: shapeBelowZIndex,
        updatedAt: serverTimestamp(),
      });
      
      const shapeBelowRef = doc(firestore, shapesPath, shapeBelow.id);
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

  async batchSendBackward(canvasId: string, shapeIds: string[]): Promise<void> {
    try {
      if (shapeIds.length === 0) return;
      
      const shapes = await shapeService.getShapes(canvasId);
      const batch = writeBatch(firestore);
      const shapesPath = this.getShapesPath(canvasId);
      
      const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
      if (selectedShapes.length === 0) return;
      
      const selectedZIndices = selectedShapes.map(s => s.zIndex || 0);
      const minSelectedZIndex = Math.min(...selectedZIndices);
      const maxSelectedZIndex = Math.max(...selectedZIndices);
      
      const overlappingShapesBelow = shapes.filter(shape => {
        if (shapeIds.includes(shape.id)) return false;
        const shapeZIndex = shape.zIndex || 0;
        if (shapeZIndex >= minSelectedZIndex) return false;
        
        return selectedShapes.some(selectedShape => {
          return this.shapesOverlap(selectedShape, shape);
        });
      });
      
      if (overlappingShapesBelow.length === 0) {
        console.log(`ℹ️ No overlapping shapes below to swap backward`);
        return;
      }
      
      overlappingShapesBelow.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      const targetShape = overlappingShapesBelow[0];
      const targetZIndex = targetShape.zIndex || 0;
      
      const zIndexShift = targetZIndex - maxSelectedZIndex - 1;
      
      for (const shape of selectedShapes) {
        const currentZIndex = shape.zIndex || 0;
        const newZIndex = currentZIndex + zIndexShift;
        
        const shapeRef = doc(firestore, shapesPath, shape.id);
        batch.update(shapeRef, {
          zIndex: newZIndex,
          updatedAt: serverTimestamp(),
        });
      }
      
      const targetShapeRef = doc(firestore, shapesPath, targetShape.id);
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

  private shapesOverlap(shape1: ShapeData, shape2: ShapeData): boolean {
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
    
    return !(
      right1 < left2 ||
      left1 > right2 ||
      bottom1 < top2 ||
      top1 > bottom2
    );
  }
}

export const zIndexService = new ZIndexService();
export default ZIndexService;
