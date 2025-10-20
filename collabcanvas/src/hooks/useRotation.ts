import { useState } from 'react';
import toast from 'react-hot-toast';
import type Konva from 'konva';
import type { ShapeData } from '../services/canvasService';

interface UseRotationProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapes: ShapeData[];
  selectedShapeId: string | null;
  rotateShape: (shapeId: string, rotation: number) => Promise<void>;
}

export function useRotation(props: UseRotationProps) {
  const { stageRef, shapes, selectedShapeId, rotateShape } = props;

  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{
    angle: number;
    rotation: number;
  } | null>(null);
  const [previewRotation, setPreviewRotation] = useState<number | null>(null);
  const [hoveredRotationHandle, setHoveredRotationHandle] = useState<string | null>(null);

  const handleRotationStart = (e: Konva.KonvaEventObject<MouseEvent>, shape: ShapeData) => {
    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Calculate shape center in canvas coordinates
    let centerX: number;
    let centerY: number;
    
    if (shape.type === 'circle') {
      centerX = shape.x;
      centerY = shape.y;
    } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text' || shape.type === 'path') {
      centerX = shape.x + shape.width / 2;
      centerY = shape.y + shape.height / 2;
    } else {
      return;
    }

    // Calculate initial angle from center to mouse position
    const initialAngle = Math.atan2(canvasY - centerY, canvasX - centerX);

    // Store initial state for rotation calculation
    setIsRotating(true);
    setRotationStart({
      angle: initialAngle,
      rotation: shape.rotation || 0,
    });
    setPreviewRotation(shape.rotation || 0);
  };

  const handleRotationMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isRotating || !rotationStart || !selectedShapeId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Get current shape
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) return;

    // Calculate shape center
    let centerX: number;
    let centerY: number;
    
    if (shape.type === 'circle') {
      centerX = shape.x;
      centerY = shape.y;
    } else if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'text' || shape.type === 'path') {
      centerX = shape.x + shape.width / 2;
      centerY = shape.y + shape.height / 2;
    } else {
      return;
    }

    // Calculate current angle from center to mouse position
    const currentAngle = Math.atan2(canvasY - centerY, canvasX - centerX);

    // Calculate angle delta in radians, then convert to degrees
    const angleDelta = currentAngle - rotationStart.angle;
    const deltaInDegrees = angleDelta * (180 / Math.PI);

    // Calculate new rotation
    const newRotation = rotationStart.rotation + deltaInDegrees;

    // Update preview
    setPreviewRotation(newRotation);
  };

  const handleRotationEnd = async () => {
    if (!isRotating || previewRotation === null || !selectedShapeId) {
      setIsRotating(false);
      setRotationStart(null);
      setPreviewRotation(null);
      return;
    }

    try {
      await rotateShape(selectedShapeId, previewRotation);
    } catch (error) {
      console.error('❌ Failed to rotate shape:', error);
      toast.error('Failed to rotate shape');
    } finally {
      setIsRotating(false);
      setRotationStart(null);
      setPreviewRotation(null);
    }
  };

  const cancelRotation = () => {
    setIsRotating(false);
    setRotationStart(null);
    setPreviewRotation(null);
  };

  return {
    isRotating,
    previewRotation,
    hoveredRotationHandle,
    setHoveredRotationHandle,
    handleRotationStart,
    handleRotationMove,
    handleRotationEnd,
    cancelRotation,
  };
}

