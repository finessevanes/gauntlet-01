import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { ShapeData, ShapeCreateInput } from '../services/canvasService';
import { useAuth } from '../hooks/useAuth';
import type { Unsubscribe } from 'firebase/firestore';

export type ToolType = 'pan' | 'rectangle' | 'circle' | 'triangle' | 'bomb';

interface CanvasContextType {
  // Color selection
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Tool selection
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Drawing mode (deprecated, kept for backward compatibility)
  isDrawMode: boolean;
  setIsDrawMode: (isDrawMode: boolean) => void;
  
  // Bomb mode (deprecated, kept for backward compatibility)
  isBombMode: boolean;
  setIsBombMode: (isBombMode: boolean) => void;
  
  // Stage transform
  stageScale: number;
  setStageScale: (scale: number) => void;
  stagePosition: { x: number; y: number };
  setStagePosition: (position: { x: number; y: number }) => void;
  
  // Shapes
  shapes: ShapeData[];
  createShape: (shapeInput: ShapeCreateInput) => Promise<string>;
  createCircle: (circleData: { x: number; y: number; radius: number; color: string; createdBy: string }) => Promise<string>;
  createTriangle: (triangleData: { x: number; y: number; width: number; height: number; color: string; createdBy: string }) => Promise<string>;
  updateShape: (shapeId: string, updates: Partial<ShapeData>) => Promise<void>;
  resizeShape: (shapeId: string, width: number, height: number) => Promise<void>;
  resizeCircle: (shapeId: string, radius: number) => Promise<void>;
  rotateShape: (shapeId: string, rotation: number) => Promise<void>;
  lockShape: (shapeId: string, userId: string) => Promise<{ success: boolean; lockedByUsername?: string }>;
  unlockShape: (shapeId: string) => Promise<void>;
  deleteShape: (shapeId: string) => Promise<void>;
  duplicateShape: (shapeId: string, userId: string) => Promise<string>;
  deleteAllShapes: () => Promise<void>;
  
  // Selection state
  selectedShapeId: string | null;
  setSelectedShapeId: (shapeId: string | null) => void;
  
  // Loading state
  shapesLoading: boolean;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [activeTool, setActiveTool] = useState<ToolType>('pan'); // Default: Pan mode
  const [isDrawMode, setIsDrawMode] = useState(false); // Deprecated: kept for backward compatibility
  const [isBombMode, setIsBombMode] = useState(false); // Deprecated: kept for backward compatibility
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [shapesLoading, setShapesLoading] = useState(true);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Subscribe to real-time shape updates
  useEffect(() => {
    if (!user) {
      setShapes([]);
      setShapesLoading(false);
      return;
    }

    setShapesLoading(true);

    const unsubscribe: Unsubscribe = canvasService.subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setShapesLoading(false);
    });

    // Cleanup subscription on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Shape operations
  const createShape = async (shapeInput: ShapeCreateInput): Promise<string> => {
    return await canvasService.createShape(shapeInput);
  };

  const createCircle = async (circleData: { x: number; y: number; radius: number; color: string; createdBy: string }): Promise<string> => {
    return await canvasService.createCircle(circleData);
  };

  const createTriangle = async (triangleData: { x: number; y: number; width: number; height: number; color: string; createdBy: string }): Promise<string> => {
    return await canvasService.createTriangle(triangleData);
  };

  const updateShape = async (shapeId: string, updates: Partial<ShapeData>): Promise<void> => {
    return await canvasService.updateShape(shapeId, updates);
  };

  const resizeShape = async (shapeId: string, width: number, height: number): Promise<void> => {
    return await canvasService.resizeShape(shapeId, width, height);
  };

  const resizeCircle = async (shapeId: string, radius: number): Promise<void> => {
    return await canvasService.resizeCircle(shapeId, radius);
  };

  const rotateShape = async (shapeId: string, rotation: number): Promise<void> => {
    return await canvasService.rotateShape(shapeId, rotation);
  };

  const lockShape = async (shapeId: string, userId: string): Promise<{ success: boolean; lockedByUsername?: string }> => {
    return await canvasService.lockShape(shapeId, userId);
  };

  const unlockShape = async (shapeId: string): Promise<void> => {
    return await canvasService.unlockShape(shapeId);
  };

  const deleteShape = async (shapeId: string): Promise<void> => {
    return await canvasService.deleteShape(shapeId);
  };

  const duplicateShape = async (shapeId: string, userId: string): Promise<string> => {
    return await canvasService.duplicateShape(shapeId, userId);
  };

  const deleteAllShapes = async (): Promise<void> => {
    return await canvasService.deleteAllShapes();
  };

  const value = {
    selectedColor,
    setSelectedColor,
    activeTool,
    setActiveTool,
    isDrawMode,
    setIsDrawMode,
    isBombMode,
    setIsBombMode,
    stageScale,
    setStageScale,
    stagePosition,
    setStagePosition,
    shapes,
    createShape,
    createCircle,
    createTriangle,
    updateShape,
    resizeShape,
    resizeCircle,
    rotateShape,
    lockShape,
    unlockShape,
    deleteShape,
    duplicateShape,
    deleteAllShapes,
    selectedShapeId,
    setSelectedShapeId,
    shapesLoading,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

