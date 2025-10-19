import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { ShapeData } from './types/canvasTypes';

class AlignmentService {
  /**
   * Get shapes collection path for a specific canvas
   */
  private getShapesPath(canvasId: string): string {
    return `canvases/${canvasId}/shapes`;
  }

  async alignShapes(
    canvasId: string,
    shapeIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<void> {
    try {
      if (shapeIds.length < 2) {
        throw new Error('At least 2 shapes are required for alignment');
      }

      const shapesPath = this.getShapesPath(canvasId);
      const shapeDocs = await Promise.all(
        shapeIds.map(id => getDoc(doc(firestore, shapesPath, id)))
      );

      const shapes = shapeDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ShapeData));

      if (shapes.length < 2) {
        throw new Error('Not enough valid shapes found for alignment');
      }

      const getShapeBounds = (shape: ShapeData) => {
        if (shape.type === 'circle' && shape.radius) {
          return {
            left: shape.x - shape.radius,
            right: shape.x + shape.radius,
            top: shape.y - shape.radius,
            bottom: shape.y + shape.radius,
            centerX: shape.x,
            centerY: shape.y,
          };
        } else {
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

      let targetValue: number;

      switch (alignment) {
        case 'left':
          targetValue = Math.min(...shapes.map(s => getShapeBounds(s).left));
          break;
        case 'center':
          const avgCenterX = shapes.reduce((sum, s) => sum + getShapeBounds(s).centerX, 0) / shapes.length;
          targetValue = avgCenterX;
          break;
        case 'right':
          targetValue = Math.max(...shapes.map(s => getShapeBounds(s).right));
          break;
        case 'top':
          targetValue = Math.min(...shapes.map(s => getShapeBounds(s).top));
          break;
        case 'middle':
          const avgCenterY = shapes.reduce((sum, s) => sum + getShapeBounds(s).centerY, 0) / shapes.length;
          targetValue = avgCenterY;
          break;
        case 'bottom':
          targetValue = Math.max(...shapes.map(s => getShapeBounds(s).bottom));
          break;
        default:
          throw new Error(`Invalid alignment type: ${alignment}`);
      }

      const batch = writeBatch(firestore);

      shapes.forEach(shape => {
        const shapeRef = doc(firestore, shapesPath, shape.id);
        const updates: any = { updatedAt: serverTimestamp() };
        const isCircle = shape.type === 'circle' && shape.radius;

        if (alignment === 'left') {
          updates.x = isCircle ? targetValue + shape.radius! : targetValue;
        } else if (alignment === 'center') {
          updates.x = isCircle ? targetValue : targetValue - shape.width / 2;
        } else if (alignment === 'right') {
          updates.x = isCircle ? targetValue - shape.radius! : targetValue - shape.width;
        } else if (alignment === 'top') {
          updates.y = isCircle ? targetValue + shape.radius! : targetValue;
        } else if (alignment === 'middle') {
          updates.y = isCircle ? targetValue : targetValue - shape.height / 2;
        } else if (alignment === 'bottom') {
          updates.y = isCircle ? targetValue - shape.radius! : targetValue - shape.height;
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

  async distributeShapes(
    canvasId: string,
    shapeIds: string[],
    direction: 'horizontal' | 'vertical'
  ): Promise<void> {
    try {
      if (shapeIds.length < 3) {
        throw new Error('At least 3 shapes are required for distribution');
      }

      const shapesPath = this.getShapesPath(canvasId);
      const shapeDocs = await Promise.all(
        shapeIds.map(id => getDoc(doc(firestore, shapesPath, id)))
      );

      const shapes = shapeDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ShapeData));

      if (shapes.length < 3) {
        throw new Error('Not enough valid shapes found for distribution');
      }

      const getShapeCenter = (shape: ShapeData) => {
        if (shape.type === 'circle' && shape.radius) {
          return {
            centerX: shape.x,
            centerY: shape.y,
          };
        } else {
          return {
            centerX: shape.x + shape.width / 2,
            centerY: shape.y + shape.height / 2,
          };
        }
      };

      const batch = writeBatch(firestore);

      if (direction === 'horizontal') {
        shapes.sort((a, b) => getShapeCenter(a).centerX - getShapeCenter(b).centerX);

        const leftmostCenter = getShapeCenter(shapes[0]).centerX;
        const rightmostCenter = getShapeCenter(shapes[shapes.length - 1]).centerX;
        const totalDistance = rightmostCenter - leftmostCenter;
        const centerSpacing = totalDistance / (shapes.length - 1);

        shapes.forEach((shape, index) => {
          if (index === 0 || index === shapes.length - 1) {
            return;
          }

          const targetCenterX = leftmostCenter + (index * centerSpacing);

          let newX: number;
          if (shape.type === 'circle' && shape.radius) {
            newX = targetCenterX;
          } else {
            newX = targetCenterX - shape.width / 2;
          }

          const shapeRef = doc(firestore, shapesPath, shape.id);
          batch.update(shapeRef, {
            x: newX,
            updatedAt: serverTimestamp(),
          });
        });
      } else {
        shapes.sort((a, b) => getShapeCenter(a).centerY - getShapeCenter(b).centerY);

        const topmostCenter = getShapeCenter(shapes[0]).centerY;
        const bottommostCenter = getShapeCenter(shapes[shapes.length - 1]).centerY;
        const totalDistance = bottommostCenter - topmostCenter;
        const centerSpacing = totalDistance / (shapes.length - 1);

        shapes.forEach((shape, index) => {
          if (index === 0 || index === shapes.length - 1) {
            return;
          }

          const targetCenterY = topmostCenter + (index * centerSpacing);

          let newY: number;
          if (shape.type === 'circle' && shape.radius) {
            newY = targetCenterY;
          } else {
            newY = targetCenterY - shape.height / 2;
          }

          const shapeRef = doc(firestore, shapesPath, shape.id);
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
}

export const alignmentService = new AlignmentService();
export default AlignmentService;
