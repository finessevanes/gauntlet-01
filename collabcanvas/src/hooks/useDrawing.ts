import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_SHAPE_SIZE,
  MIN_CIRCLE_RADIUS,
  MIN_TRIANGLE_WIDTH,
  MIN_TRIANGLE_HEIGHT
} from '../utils/constants';

interface UseDrawingProps {
  activeTool: 'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'pencil' | 'pan' | 'bomb';
  selectedColor: string;
  user: { uid: string } | null;
  createShape: (data: any) => Promise<string>;
  createCircle: (data: { x: number; y: number; radius: number; color: string; createdBy: string }) => Promise<string>;
  createTriangle: (data: any) => Promise<string>;
  createText: (data: any) => Promise<string>;
  createPath: (data: { points: { x: number; y: number }[]; strokeWidth: number; color: string; createdBy: string }) => Promise<string>;
  enterEdit: (shapeId: string) => void;
  handleBombClick: (x: number, y: number) => void;
  handleDeselectShape: () => Promise<void>;
  setSelectedShapes: (ids: string[]) => void;
  selectedShapeId: string | null;
  setMarqueeStart: (pos: { x: number; y: number } | null) => void;
  setMarqueeEnd: (pos: { x: number; y: number } | null) => void;
  setIsMarqueeActive: (active: boolean) => void;
}

export function useDrawing(props: UseDrawingProps) {
  const {
    activeTool,
    selectedColor,
    user,
    createShape,
    createCircle,
    createTriangle,
    createText,
    createPath,
    enterEdit,
    handleBombClick,
    handleDeselectShape,
    setSelectedShapes,
    selectedShapeId,
    setMarqueeStart,
    setMarqueeEnd,
    setIsMarqueeActive,
  } = props;

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [previewRect, setPreviewRect] = useState<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number 
  } | null>(null);
  const [previewCircle, setPreviewCircle] = useState<{
    x: number;
    y: number;
    radius: number;
  } | null>(null);
  const [previewTriangle, setPreviewTriangle] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isPencilDrawing, setIsPencilDrawing] = useState(false);
  const [pencilPoints, setPencilPoints] = useState<{ x: number; y: number }[]>([]);
  const [previewPath, setPreviewPath] = useState<{ x: number; y: number }[]>([]);

  const startDrawing = (x: number, y: number, isShiftHeld: boolean) => {
    // Handle bomb mode
    if (activeTool === 'bomb') {
      handleBombClick(x, y);
      return;
    }

    // Handle text tool
    if (activeTool === 'text' && user) {
      createText({
        x,
        y,
        color: selectedColor,
        createdBy: user.uid,
      }).then((newTextId) => {
        enterEdit(newTextId);
      }).catch((error) => {
        console.error('❌ Failed to create text:', error);
        toast.error('Failed to create text');
      });
      return;
    }

    // Handle pencil tool
    if (activeTool === 'pencil' && user) {
      setIsPencilDrawing(true);
      setPencilPoints([{ x, y }]);
      setPreviewPath([{ x, y }]);
      return;
    }

    // Handle select tool - start marquee selection
    if (activeTool === 'select') {
      // If not holding Shift, clear existing selection
      if (!isShiftHeld) {
        setSelectedShapes([]);
        if (selectedShapeId) {
          handleDeselectShape();
        }
      }
      
      // Start marquee selection
      setIsMarqueeActive(true);
      setMarqueeStart({ x, y });
      setMarqueeEnd({ x, y });
      return;
    }

    // Deselect when starting to draw
    if (selectedShapeId) {
      handleDeselectShape();
    }
    
    // Clear multi-selection
    setSelectedShapes([]);

    // Only start drawing if a shape tool is selected
    if (activeTool === 'pan') return;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setPreviewRect(null);
    setPreviewCircle(null);
    setPreviewTriangle(null);
  };

  const updateDrawing = (currentX: number, currentY: number) => {
    // Handle pencil drawing
    if (activeTool === 'pencil' && isPencilDrawing) {
      const newPoint = { x: currentX, y: currentY };
      setPencilPoints(prev => [...prev, newPoint]);
      setPreviewPath(prev => [...prev, newPoint]);
      return;
    }

    if (!isDrawing || !drawStart) return;

    // Calculate preview based on active tool
    if (activeTool === 'rectangle') {
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);
      setPreviewRect({ x, y, width, height });
      setPreviewCircle(null);
      setPreviewTriangle(null);
    } else if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(currentX - drawStart.x, 2) + Math.pow(currentY - drawStart.y, 2)
      );
      setPreviewCircle({ x: drawStart.x, y: drawStart.y, radius });
      setPreviewRect(null);
      setPreviewTriangle(null);
    } else if (activeTool === 'triangle') {
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);
      setPreviewTriangle({ x, y, width, height });
      setPreviewRect(null);
      setPreviewCircle(null);
    }
  };

  const finishDrawing = async () => {
    // Handle pencil drawing finish
    if (activeTool === 'pencil' && isPencilDrawing && user) {
      if (pencilPoints.length < 2) {
        // Don't create path with less than 2 points
        setIsPencilDrawing(false);
        setPencilPoints([]);
        setPreviewPath([]);
        return;
      }

      try {
        await createPath({
          points: pencilPoints,
          strokeWidth: 2, // Default stroke width
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create path:', error);
        toast.error('Failed to create path');
      }

      // Clear pencil drawing state
      setIsPencilDrawing(false);
      setPencilPoints([]);
      setPreviewPath([]);
      return;
    }

    if (!isDrawing || !user) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewRect(null);
      setPreviewCircle(null);
      setPreviewTriangle(null);
      return;
    }

    // Handle rectangle creation
    if (activeTool === 'rectangle' && previewRect) {
      if (previewRect.width < MIN_SHAPE_SIZE || previewRect.height < MIN_SHAPE_SIZE) {
        toast.error(`Minimum rectangle size is ${MIN_SHAPE_SIZE}×${MIN_SHAPE_SIZE} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewRect(null);
        return;
      }

      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, previewRect.x));
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, previewRect.y));
      const clampedWidth = Math.min(previewRect.width, CANVAS_WIDTH - clampedX);
      const clampedHeight = Math.min(previewRect.height, CANVAS_HEIGHT - clampedY);

      try {
        await createShape({
          type: 'rectangle',
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create rectangle:', error);
        toast.error('Failed to create rectangle');
      }
    }
    // Handle circle creation
    else if (activeTool === 'circle' && previewCircle) {
      if (previewCircle.radius < MIN_CIRCLE_RADIUS) {
        toast.error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewCircle(null);
        return;
      }

      const clampedX = Math.max(previewCircle.radius, Math.min(CANVAS_WIDTH - previewCircle.radius, previewCircle.x));
      const clampedY = Math.max(previewCircle.radius, Math.min(CANVAS_HEIGHT - previewCircle.radius, previewCircle.y));

      try {
        await createCircle({
          x: clampedX,
          y: clampedY,
          radius: previewCircle.radius,
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create circle:', error);
        toast.error('Failed to create circle');
      }
    }
    // Handle triangle creation
    else if (activeTool === 'triangle' && previewTriangle) {
      if (previewTriangle.width < MIN_TRIANGLE_WIDTH || previewTriangle.height < MIN_TRIANGLE_HEIGHT) {
        toast.error(`Minimum triangle size is ${MIN_TRIANGLE_WIDTH}×${MIN_TRIANGLE_HEIGHT} pixels`);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewTriangle(null);
        return;
      }

      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, previewTriangle.x));
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, previewTriangle.y));
      const clampedWidth = Math.min(previewTriangle.width, CANVAS_WIDTH - clampedX);
      const clampedHeight = Math.min(previewTriangle.height, CANVAS_HEIGHT - clampedY);

      try {
        console.log('🔺 Creating triangle:', {
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
          preview: previewTriangle,
        });
        await createTriangle({
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
          color: selectedColor,
          createdBy: user.uid,
        });
      } catch (error) {
        console.error('❌ Failed to create triangle:', error);
        toast.error('Failed to create triangle');
      }
    }

    // Clear drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
    setPreviewCircle(null);
    setPreviewTriangle(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewRect(null);
    setPreviewCircle(null);
    setPreviewTriangle(null);
    setIsPencilDrawing(false);
    setPencilPoints([]);
    setPreviewPath([]);
  };

  return {
    isDrawing,
    previewRect,
    previewCircle,
    previewTriangle,
    isPencilDrawing,
    pencilPoints,
    previewPath,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  };
}

