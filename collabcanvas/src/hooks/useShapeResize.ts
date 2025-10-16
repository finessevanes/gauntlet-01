import { useState } from 'react';
import type Konva from 'konva';
import type { ShapeData } from '../services/canvasService';
import toast from 'react-hot-toast';
import {
  MIN_SHAPE_WIDTH,
  MIN_SHAPE_HEIGHT,
  MIN_CIRCLE_RADIUS,
} from '../utils/constants';

interface UseShapeResizeParams {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapes: ShapeData[];
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
  resizeShape: (id: string, width: number, height: number) => Promise<void>;
  resizeCircle: (id: string, radius: number) => Promise<void>;
  updateShape: (id: string, updates: Partial<ShapeData>) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  clearLockTimeout: () => void;
}

interface UseShapeResizeReturn {
  isResizing: boolean;
  activeHandle: string | null;
  previewDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  handleResizeStart: (e: Konva.KonvaEventObject<MouseEvent>, handleName: string, shape: ShapeData) => void;
  handleResizeMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleResizeEnd: () => Promise<void>;
}

export function useShapeResize({
  stageRef,
  shapes,
  selectedShapeId,
  setSelectedShapeId,
  resizeShape,
  resizeCircle,
  updateShape,
  unlockShape,
  clearLockTimeout,
}: UseShapeResizeParams): UseShapeResizeReturn {
  // Resize state management
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: number;
    shapeX: number;
    shapeY: number;
  } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, handleName: string, shape: ShapeData) => {
    e.cancelBubble = true; // Prevent other events from firing
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

    // Store initial state for resize calculation
    setIsResizing(true);
    setActiveHandle(handleName);
    
    if (shape.type === 'circle' && shape.radius !== undefined) {
      // For circles, store radius as width (we'll use it as radius)
      setResizeStart({
        x: canvasX,
        y: canvasY,
        width: shape.radius * 2, // Store diameter as width for consistency
        height: shape.radius * 2,
        aspectRatio: 1,
        shapeX: shape.x,
        shapeY: shape.y,
      });
      setPreviewDimensions({
        x: shape.x,
        y: shape.y,
        width: shape.radius * 2,
        height: shape.radius * 2,
      });
    } else if (shape.type === 'rectangle' || shape.type === 'triangle') {
      setResizeStart({
        x: canvasX,
        y: canvasY,
        width: shape.width,
        height: shape.height,
        aspectRatio: shape.width / shape.height,
        shapeX: shape.x,
        shapeY: shape.y,
      });
      setPreviewDimensions({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    }

    // Refresh lock timeout
    clearLockTimeout();
  };

  const handleResizeMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isResizing || !resizeStart || !activeHandle || !selectedShapeId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();
    
    // Get the current shape to check for rotation
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) return;
    
    // Handle circle resizing separately (circles use 'n', 's', 'e', 'w' handles)
    if (shape.type === 'circle' && (activeHandle === 'n' || activeHandle === 's' || activeHandle === 'e' || activeHandle === 'w')) {
      // For circles, calculate new radius based on distance from center to mouse
      const centerX = resizeStart.shapeX;
      const centerY = resizeStart.shapeY;
      
      // Calculate distance from center to current mouse position
      const newRadius = Math.sqrt(
        Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2)
      );
      
      // Enforce minimum radius
      const clampedRadius = Math.max(MIN_CIRCLE_RADIUS, newRadius);
      
      // Update preview dimensions (store as width/height for consistency with preview state)
      setPreviewDimensions({
        x: centerX,
        y: centerY,
        width: clampedRadius * 2, // diameter
        height: clampedRadius * 2,
      });
      return;
    }
    
    const rotation = shape.rotation || 0;
    const hasRotation = Math.abs(rotation) > 0.1; // Consider rotated if > 0.1 degrees

    // Calculate shape center (stays constant during resize for rotated shapes)
    const centerX = resizeStart.shapeX + resizeStart.width / 2;
    const centerY = resizeStart.shapeY + resizeStart.height / 2;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.shapeX;
    let newY = resizeStart.shapeY;

    if (hasRotation) {
      // FOR ROTATED SHAPES: Anchor-based resize (keep opposite corner/edge fixed)
      
      // Transform mouse position to shape's local coordinate system
      const relativeX = canvasX - centerX;
      const relativeY = canvasY - centerY;
      
      const rotationRad = (-rotation * Math.PI) / 180;
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      
      const localMouseX = relativeX * cos - relativeY * sin;
      const localMouseY = relativeX * sin + relativeY * cos;
      
      // Calculate anchor point in local coordinates (the corner/edge that stays fixed)
      let anchorLocalX = 0;
      let anchorLocalY = 0;
      let mouseIsOnLeft = false;
      let mouseIsOnTop = false;
      let mouseIsOnRight = false;
      let mouseIsOnBottom = false;
      
      // Determine anchor and which side the mouse is on
      switch (activeHandle) {
        case 'tl': // Top-left handle: anchor at bottom-right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnLeft = true;
          mouseIsOnTop = true;
          break;
        case 'tr': // Top-right handle: anchor at bottom-left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnRight = true;
          mouseIsOnTop = true;
          break;
        case 'bl': // Bottom-left handle: anchor at top-right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnLeft = true;
          mouseIsOnBottom = true;
          break;
        case 'br': // Bottom-right handle: anchor at top-left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnRight = true;
          mouseIsOnBottom = true;
          break;
        case 't': // Top edge: anchor at bottom
          anchorLocalX = 0;
          anchorLocalY = resizeStart.height / 2;
          mouseIsOnTop = true;
          break;
        case 'b': // Bottom edge: anchor at top
          anchorLocalX = 0;
          anchorLocalY = -resizeStart.height / 2;
          mouseIsOnBottom = true;
          break;
        case 'l': // Left edge: anchor at right
          anchorLocalX = resizeStart.width / 2;
          anchorLocalY = 0;
          mouseIsOnLeft = true;
          break;
        case 'r': // Right edge: anchor at left
          anchorLocalX = -resizeStart.width / 2;
          anchorLocalY = 0;
          mouseIsOnRight = true;
          break;
      }
      
      // Calculate new dimensions based on distance from anchor to mouse (in local space)
      let rawWidth = resizeStart.width;
      let rawHeight = resizeStart.height;
      
      if (mouseIsOnLeft || mouseIsOnRight) {
        rawWidth = Math.abs(localMouseX - anchorLocalX);
      }
      if (mouseIsOnTop || mouseIsOnBottom) {
        rawHeight = Math.abs(localMouseY - anchorLocalY);
      }
      
      // Enforce minimum size
      rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
      rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
      
      // For corner handles, maintain aspect ratio
      if ((mouseIsOnLeft || mouseIsOnRight) && (mouseIsOnTop || mouseIsOnBottom)) {
        const scaleX = rawWidth / resizeStart.width;
        const scaleY = rawHeight / resizeStart.height;
        const scale = Math.max(scaleX, scaleY);
        newWidth = resizeStart.width * scale;
        newHeight = resizeStart.height * scale;
      } else {
        newWidth = rawWidth;
        newHeight = rawHeight;
      }
      
      // Calculate new center position (in global coordinates)
      // The anchor stays fixed, so center shifts by half the dimension change
      const widthDelta = newWidth - resizeStart.width;
      const heightDelta = newHeight - resizeStart.height;
      
      // Calculate center shift in local coordinates
      let centerShiftLocalX = 0;
      let centerShiftLocalY = 0;
      
      if (mouseIsOnLeft) {
        centerShiftLocalX = -widthDelta / 2; // Center shifts left when pulling left edge
      } else if (mouseIsOnRight) {
        centerShiftLocalX = widthDelta / 2; // Center shifts right when pulling right edge
      }
      
      if (mouseIsOnTop) {
        centerShiftLocalY = -heightDelta / 2; // Center shifts up when pulling top edge
      } else if (mouseIsOnBottom) {
        centerShiftLocalY = heightDelta / 2; // Center shifts down when pulling bottom edge
      }
      
      // Transform center shift back to global coordinates
      const inverseRotationRad = (rotation * Math.PI) / 180;
      const invCos = Math.cos(inverseRotationRad);
      const invSin = Math.sin(inverseRotationRad);
      
      const centerShiftGlobalX = centerShiftLocalX * invCos - centerShiftLocalY * invSin;
      const centerShiftGlobalY = centerShiftLocalX * invSin + centerShiftLocalY * invCos;
      
      const newCenterX = centerX + centerShiftGlobalX;
      const newCenterY = centerY + centerShiftGlobalY;
      
      // Calculate new top-left position from new center
      newX = newCenterX - newWidth / 2;
      newY = newCenterY - newHeight / 2;
      
    } else {
      // FOR NON-ROTATED SHAPES: Use original anchor-based resize logic
      
      // Define the anchored corner/edge for each handle
      // The handle being dragged should follow the cursor exactly
      switch (activeHandle) {
        // CORNER HANDLES (proportional resize, maintain aspect ratio)
        case 'tl': // Top-left: cursor at TL, anchor at BR
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          // Calculate dimensions from cursor to anchor
          let rawWidth = anchorX - canvasX;
          let rawHeight = anchorY - canvasY;
          
          // Enforce minimum size
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          // Maintain aspect ratio - use the dimension that requires larger scale
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position the shape so TL corner is at cursor
          newX = anchorX - newWidth;
          newY = anchorY - newHeight;
        }
        break;

        case 'tr': // Top-right: cursor at TR, anchor at BL
        {
          const anchorX = resizeStart.shapeX;
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          let rawWidth = canvasX - anchorX;
          let rawHeight = anchorY - canvasY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so TR corner is at cursor
          newX = anchorX;
          newY = anchorY - newHeight;
        }
        break;

        case 'bl': // Bottom-left: cursor at BL, anchor at TR
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          const anchorY = resizeStart.shapeY;
          
          let rawWidth = anchorX - canvasX;
          let rawHeight = canvasY - anchorY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so BL corner is at cursor
          newX = anchorX - newWidth;
          newY = anchorY;
        }
        break;

        case 'br': // Bottom-right: cursor at BR, anchor at TL
        {
          const anchorX = resizeStart.shapeX;
          const anchorY = resizeStart.shapeY;
          
          let rawWidth = canvasX - anchorX;
          let rawHeight = canvasY - anchorY;
          
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          const scaleX = rawWidth / resizeStart.width;
          const scaleY = rawHeight / resizeStart.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = resizeStart.width * scale;
          newHeight = newWidth / resizeStart.aspectRatio;
          
          // Position so BR corner is at cursor (anchor stays at TL)
          newX = anchorX;
          newY = anchorY;
        }
        break;

        // EDGE HANDLES (single dimension resize, width OR height only)
        case 't': // Top edge: resize height only, anchor bottom edge
        {
          const anchorY = resizeStart.shapeY + resizeStart.height;
          
          // Calculate new height from cursor to bottom edge
          let rawHeight = anchorY - canvasY;
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          newHeight = rawHeight;
          newWidth = resizeStart.width; // Width stays constant
          newX = resizeStart.shapeX; // X position stays constant
          newY = anchorY - newHeight; // Y adjusts so bottom edge stays anchored
        }
        break;

        case 'b': // Bottom edge: resize height only, anchor top edge
        {
          const anchorY = resizeStart.shapeY;
          
          // Calculate new height from top edge to cursor
          let rawHeight = canvasY - anchorY;
          rawHeight = Math.max(MIN_SHAPE_HEIGHT, rawHeight);
          
          newHeight = rawHeight;
          newWidth = resizeStart.width; // Width stays constant
          newX = resizeStart.shapeX; // X position stays constant
          newY = anchorY; // Y stays anchored at top
        }
        break;

        case 'l': // Left edge: resize width only, anchor right edge
        {
          const anchorX = resizeStart.shapeX + resizeStart.width;
          
          // Calculate new width from cursor to right edge
          let rawWidth = anchorX - canvasX;
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          
          newWidth = rawWidth;
          newHeight = resizeStart.height; // Height stays constant
          newX = anchorX - newWidth; // X adjusts so right edge stays anchored
          newY = resizeStart.shapeY; // Y position stays constant
        }
        break;

        case 'r': // Right edge: resize width only, anchor left edge
        {
          const anchorX = resizeStart.shapeX;
          
          // Calculate new width from left edge to cursor
          let rawWidth = canvasX - anchorX;
          rawWidth = Math.max(MIN_SHAPE_WIDTH, rawWidth);
          
          newWidth = rawWidth;
          newHeight = resizeStart.height; // Height stays constant
          newX = anchorX; // X stays anchored at left
          newY = resizeStart.shapeY; // Y position stays constant
        }
        break;
      }
    }

    // Update preview dimensions
    setPreviewDimensions({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResizeEnd = async () => {
    if (!isResizing || !previewDimensions || !selectedShapeId || !resizeStart) {
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Get the shape to determine its type
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) {
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Validate minimum dimensions
    if (shape.type === 'circle') {
      const newRadius = previewDimensions.width / 2;
      if (newRadius < MIN_CIRCLE_RADIUS) {
        toast.error(`Minimum circle radius is ${MIN_CIRCLE_RADIUS} pixels`, {
          duration: 2000,
          position: 'top-center',
        });
        setIsResizing(false);
        setActiveHandle(null);
        setResizeStart(null);
        setPreviewDimensions(null);
        return;
      }
    } else if (previewDimensions.width < MIN_SHAPE_WIDTH || previewDimensions.height < MIN_SHAPE_HEIGHT) {
      toast.error(`Minimum size is ${MIN_SHAPE_WIDTH}×${MIN_SHAPE_HEIGHT} pixels`, {
        duration: 2000,
        position: 'top-center',
      });
      setIsResizing(false);
      setActiveHandle(null);
      setResizeStart(null);
      setPreviewDimensions(null);
      return;
    }

    // Capture values before clearing state
    const shapeIdToUpdate = selectedShapeId;
    const newWidth = previewDimensions.width;
    const newHeight = previewDimensions.height;
    const newX = previewDimensions.x;
    const newY = previewDimensions.y;
    const positionChanged = newX !== resizeStart.shapeX || newY !== resizeStart.shapeY;
    
    // Clear UI state immediately - this removes the preview overlay
    setIsResizing(false);
    setActiveHandle(null);
    setResizeStart(null);
    setPreviewDimensions(null);

    // Perform Firestore updates in background
    // The shape will smoothly update via real-time listener
    try {
      // Handle circle resize differently (use radius instead of width/height)
      let resizePromise: Promise<void>;
      if (shape.type === 'circle') {
        const newRadius = newWidth / 2;
        resizePromise = resizeCircle(shapeIdToUpdate, newRadius);
        // Circles don't change position during resize (center stays fixed)
      } else {
        // Rectangle or triangle resize
        resizePromise = resizeShape(shapeIdToUpdate, newWidth, newHeight);
        const positionPromise = positionChanged 
          ? updateShape(shapeIdToUpdate, { x: newX, y: newY })
          : Promise.resolve();
        
        // Wait for both to complete
        await Promise.all([resizePromise, positionPromise]);
        
        toast.success('Shape resized', { duration: 1000 });
        
        console.log('✅ SUCCESS TASK [1.6]: Shape resize persisted to Firestore with real-time sync');
        
        // Unlock shape after all operations complete
        await unlockShape(shapeIdToUpdate);
        setSelectedShapeId(null);
        return;
      }
      
      // For circles, just wait for resize
      await resizePromise;
      
      toast.success('Circle resized', { duration: 1000 });
      
      console.log('✅ Circle resize persisted to Firestore with real-time sync');
    } catch (error) {
      console.error('❌ Failed to resize shape:', error);
      toast.error('Failed to resize shape');
    } finally {
      // Unlock shape after all operations complete
      await unlockShape(shapeIdToUpdate);
      setSelectedShapeId(null);
    }
  };

  return {
    isResizing,
    activeHandle,
    previewDimensions,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
}

