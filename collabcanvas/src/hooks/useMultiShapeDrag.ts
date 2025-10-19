import { useState } from 'react';
import type Konva from 'konva';
import type { ShapeData } from '../services/canvasService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { calculateTextDimensions } from '../utils/textEditingHelpers';

interface UseMultiShapeDragProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapes: ShapeData[];
  selectedShapes: string[];
  batchUpdateShapes: (updates: Array<{ shapeId: string; updates: Partial<ShapeData> }>) => Promise<void>;
}

export function useMultiShapeDrag(props: UseMultiShapeDragProps) {
  const { stageRef, shapes, selectedShapes, batchUpdateShapes } = props;

  const [multiDragInitialPositions, setMultiDragInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const handleMultiDragStart = (draggedShapeId: string) => {
    if (!selectedShapes.includes(draggedShapeId) || selectedShapes.length <= 1) {
      return;
    }

    console.log('🟢 MULTI-DRAG START - Dragging', selectedShapes.length, 'shapes together');
    console.log('   Dragged shape ID:', draggedShapeId);
    console.log('   All selected shapes:', selectedShapes);
    
    const initialPositions = new Map<string, { x: number; y: number }>();
    
    for (const id of selectedShapes) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        initialPositions.set(id, { x: shape.x, y: shape.y });
      } else {
        console.error('❌ ERROR: Shape not found in multi-drag:', id);
      }
    }
    
    if (initialPositions.size !== selectedShapes.length) {
      console.error('❌ ERROR: Could not grab all selected shapes!');
      console.error('   Expected:', selectedShapes.length, 'Got:', initialPositions.size);
    } else {
      console.log('✅ All', initialPositions.size, 'shapes grabbed successfully');
    }
    
    setMultiDragInitialPositions(initialPositions);
  };

  const handleMultiDragMove = (draggedShapeId: string, draggedCenterX: number, draggedCenterY: number) => {
    if (multiDragInitialPositions.size === 0) return;

    const stage = stageRef.current;
    if (!stage) return;

    const initialPos = multiDragInitialPositions.get(draggedShapeId);
    if (!initialPos) return;

    const draggedShape = shapes.find(s => s.id === draggedShapeId);
    if (!draggedShape) return;

    // Calculate current top-left position of dragged shape
    let draggedX: number, draggedY: number;
    if (draggedShape.type === 'circle') {
      draggedX = draggedCenterX;
      draggedY = draggedCenterY;
    } else if (draggedShape.type === 'text') {
      const textContent = draggedShape.text || '';
      const textFontSize = draggedShape.fontSize || 16;
      const estimatedWidth = textContent.length * textFontSize * 0.6;
      const estimatedHeight = textFontSize * 1.2;
      const padding = 4;
      const width = estimatedWidth + padding * 2;
      const height = estimatedHeight + padding * 2;
      draggedX = draggedCenterX - width / 2;
      draggedY = draggedCenterY - height / 2;
    } else {
      draggedX = draggedCenterX - draggedShape.width / 2;
      draggedY = draggedCenterY - draggedShape.height / 2;
    }

    // Calculate delta
    const deltaX = draggedX - initialPos.x;
    const deltaY = draggedY - initialPos.y;

    // Get the layer
    const layers = stage.getLayers();
    if (layers.length === 0) return;
    const layer = layers[0];

    // Move all other selected shapes
    selectedShapes.forEach((id) => {
      if (id === draggedShapeId) return; // Skip the shape being dragged

      const targetInitialPos = multiDragInitialPositions.get(id);
      const targetShape = shapes.find(s => s.id === id);
      if (!targetInitialPos || !targetShape) return;

      // Calculate new position
      const newX = targetInitialPos.x + deltaX;
      const newY = targetInitialPos.y + deltaY;

      // Find the Konva node for this shape
      const targetNode = layer.findOne(`#${id}`);
      if (!targetNode) return;

      // Calculate center position based on shape type
      let newCenterX: number, newCenterY: number;
      if (targetShape.type === 'circle') {
        newCenterX = newX;
        newCenterY = newY;
      } else if (targetShape.type === 'text') {
        const textContent = targetShape.text || '';
        const textFontSize = targetShape.fontSize || 16;
        const estimatedWidth = textContent.length * textFontSize * 0.6;
        const estimatedHeight = textFontSize * 1.2;
        const padding = 4;
        const width = estimatedWidth + padding * 2;
        const height = estimatedHeight + padding * 2;
        newCenterX = newX + width / 2;
        newCenterY = newY + height / 2;
      } else {
        newCenterX = newX + targetShape.width / 2;
        newCenterY = newY + targetShape.height / 2;
      }

      // Update the Konva node position
      targetNode.x(newCenterX);
      targetNode.y(newCenterY);
    });

    // Redraw the layer
    layer.batchDraw();
  };

  const handleMultiDragEnd = async (draggedShapeId: string, finalX: number, finalY: number): Promise<boolean> => {
    if (multiDragInitialPositions.size === 0) {
      return false;
    }

    const initialPos = multiDragInitialPositions.get(draggedShapeId);
    if (!initialPos) {
      console.error('❌ ERROR: Initial position not found for dragged shape:', draggedShapeId);
      return false;
    }
    
    // Calculate drag delta
    const deltaX = finalX - initialPos.x;
    const deltaY = finalY - initialPos.y;
    
    console.log('🟢 MULTI-DRAG END - Moving', selectedShapes.length, 'shapes');
    console.log('   Delta: dx=' + deltaX.toFixed(2) + ', dy=' + deltaY.toFixed(2));
    
    // Prepare batch updates for all selected shapes
    const batchUpdates: Array<{ shapeId: string; updates: { x: number; y: number } }> = [];
    
    for (const id of selectedShapes) {
      const targetShape = shapes.find(s => s.id === id);
      const targetInitialPos = multiDragInitialPositions.get(id);
      
      if (!targetShape) {
        console.error('❌ ERROR: Target shape not found:', id);
        continue;
      }
      
      if (!targetInitialPos) {
        console.error('❌ ERROR: Initial position not found for shape:', id);
        continue;
      }
      
      const targetNewX = targetInitialPos.x + deltaX;
      const targetNewY = targetInitialPos.y + deltaY;
      
      // Clamp to canvas bounds based on shape type
      let clampedX = targetNewX;
      let clampedY = targetNewY;
      
      if (targetShape.type === 'circle' && targetShape.radius !== undefined) {
        clampedX = Math.max(targetShape.radius, Math.min(CANVAS_WIDTH - targetShape.radius, targetNewX));
        clampedY = Math.max(targetShape.radius, Math.min(CANVAS_HEIGHT - targetShape.radius, targetNewY));
      } else if (targetShape.type === 'rectangle' || targetShape.type === 'triangle') {
        clampedX = Math.max(0, Math.min(CANVAS_WIDTH - targetShape.width, targetNewX));
        clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - targetShape.height, targetNewY));
      } else if (targetShape.type === 'text') {
        const textContent = targetShape.text || '';
        const textFontSize = targetShape.fontSize || 16;
        const estimatedWidth = textContent.length * textFontSize * 0.6;
        const estimatedHeight = textFontSize * 1.2;
        const padding = 4;
        const width = estimatedWidth + padding * 2;
        const height = estimatedHeight + padding * 2;
        
        clampedX = Math.max(0, Math.min(CANVAS_WIDTH - width, targetNewX));
        clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - height, targetNewY));
      }
      
      // Add to batch updates
      batchUpdates.push({
        shapeId: id,
        updates: { x: clampedX, y: clampedY }
      });
    }
    
    // Send all updates in a single batch operation
    try {
      await batchUpdateShapes(batchUpdates);
      console.log('✅ All', selectedShapes.length, 'shapes updated atomically in Firestore');
    } catch (error) {
      console.error('❌ ERROR: Failed to batch update shapes:', error);
    }
    
    // Clear multi-drag state
    setMultiDragInitialPositions(new Map());
    
    return true;
  };

  const clearMultiDrag = () => {
    setMultiDragInitialPositions(new Map());
  };

  return {
    multiDragInitialPositions,
    handleMultiDragStart,
    handleMultiDragMove,
    handleMultiDragEnd,
    clearMultiDrag,
  };
}

