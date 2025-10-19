import { useState } from 'react';
import type Konva from 'konva';
import type { ShapeData } from '../services/canvasService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

interface UseMarqueeSelectionProps {
  shapes: ShapeData[];
  selectedShapes: string[];
  setSelectedShapes: (ids: string[]) => void;
}

export function useMarqueeSelection(props: UseMarqueeSelectionProps) {
  const { shapes, selectedShapes, setSelectedShapes } = props;

  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  const updateMarquee = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isMarqueeActive || !marqueeStart) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    let currentX = (pointerPosition.x - stage.x()) / stage.scaleX();
    let currentY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Clamp to canvas bounds
    currentX = Math.max(0, Math.min(CANVAS_WIDTH, currentX));
    currentY = Math.max(0, Math.min(CANVAS_HEIGHT, currentY));

    setMarqueeEnd({ x: currentX, y: currentY });
  };

  const finishMarquee = () => {
    if (!isMarqueeActive || !marqueeStart || !marqueeEnd) {
      setIsMarqueeActive(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }

    const isShiftHeld = window.event && (window.event as MouseEvent).shiftKey;
    
    // Calculate normalized marquee bounds (handle negative drags)
    const marqueeX = Math.min(marqueeStart.x, marqueeEnd.x);
    const marqueeY = Math.min(marqueeStart.y, marqueeEnd.y);
    const marqueeWidth = Math.abs(marqueeEnd.x - marqueeStart.x);
    const marqueeHeight = Math.abs(marqueeEnd.y - marqueeStart.y);
    
    // Find all shapes intersecting with marquee
    const intersectedShapes = shapes.filter(shape => {
      // Calculate shape bounds based on type
      let shapeLeft: number, shapeTop: number, shapeRight: number, shapeBottom: number;
      
      if (shape.type === 'circle' && shape.radius !== undefined) {
        // Circle: use center +/- radius
        shapeLeft = shape.x - shape.radius;
        shapeTop = shape.y - shape.radius;
        shapeRight = shape.x + shape.radius;
        shapeBottom = shape.y + shape.radius;
      } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text') {
        // Rectangle/Triangle/Text: use top-left corner + dimensions
        shapeLeft = shape.x;
        shapeTop = shape.y;
        shapeRight = shape.x + shape.width;
        shapeBottom = shape.y + shape.height;
      } else {
        return false; // Unknown shape type
      }
      
      // Check bounding box intersection
      const isIntersecting = !(
        marqueeX + marqueeWidth < shapeLeft ||
        marqueeX > shapeRight ||
        marqueeY + marqueeHeight < shapeTop ||
        marqueeY > shapeBottom
      );
      
      return isIntersecting;
    });
    
    // Update selection based on Shift key
    const intersectedIds = intersectedShapes.map(s => s.id);
    
    if (intersectedIds.length === 0) {
      console.log('⚪ Marquee selection: No shapes intersected');
    } else {
      console.log('🔵 Marquee selection intersected shapes:', intersectedIds);
    }
    
    if (isShiftHeld) {
      // Add to existing selection (merge)
      const mergedSelection = [...new Set([...selectedShapes, ...intersectedIds])];
      setSelectedShapes(mergedSelection);
      console.log('✅ MARQUEE + SHIFT - Merged selection:', mergedSelection);
      console.log(`   📊 Total: ${mergedSelection.length} shapes selected`);
    } else {
      // Replace selection
      setSelectedShapes(intersectedIds);
      if (intersectedIds.length > 1) {
        console.log('✅ MULTI-SELECT (Marquee) - Selected shapes:', intersectedIds);
        console.log(`   📊 Total: ${intersectedIds.length} shapes selected`);
      }
    }
    
    // Clear marquee state
    setIsMarqueeActive(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
  };

  const cancelMarquee = () => {
    setIsMarqueeActive(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
  };

  return {
    isMarqueeActive,
    marqueeStart,
    marqueeEnd,
    setIsMarqueeActive,
    setMarqueeStart,
    setMarqueeEnd,
    updateMarquee,
    finishMarquee,
    cancelMarquee,
  };
}

