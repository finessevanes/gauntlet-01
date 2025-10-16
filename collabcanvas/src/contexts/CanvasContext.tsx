import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { ShapeData, ShapeCreateInput } from '../services/canvasService';
import { useAuth } from '../hooks/useAuth';
import type { Unsubscribe } from 'firebase/firestore';

export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'bomb';

interface CanvasContextType {
  // Color selection
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Tool selection
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Shape selection
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
  
  // Drawing mode (deprecated - kept for backward compatibility)
  isDrawMode: boolean;
  setIsDrawMode: (isDrawMode: boolean) => void;
  
  // Bomb mode (deprecated - kept for backward compatibility)
  isBombMode: boolean;
  setIsBombMode: (isBombMode: boolean) => void;
  
  // Text editing
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  
  // Stage transform
  stageScale: number;
  setStageScale: (scale: number) => void;
  stagePosition: { x: number; y: number };
  setStagePosition: (position: { x: number; y: number }) => void;
  
  // Shape operations
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
  
  // Text operations
  createText: (text: string, x: number, y: number, color: string, createdBy: string, options?: any) => Promise<string>;
  updateText: (shapeId: string, text: string) => Promise<void>;
  updateTextFontSize: (shapeId: string, fontSize: number) => Promise<void>;
  updateTextFormatting: (shapeId: string, formatting: any) => Promise<void>;
  
  // Loading state
  shapesLoading: boolean;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false); // Deprecated: kept for backward compatibility
  const [isBombMode, setIsBombMode] = useState(false); // Deprecated: kept for backward compatibility
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [shapesLoading, setShapesLoading] = useState(true);

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

  const resizeCircle = async (shapeId: string, radius: number) => {
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

  // Text operations
  const createText = async (
    text: string,
    x: number,
    y: number,
    color: string,
    createdBy: string,
    options?: any
  ): Promise<string> => {
    return await canvasService.createText(text, x, y, color, createdBy, options);
  };

  const updateText = async (shapeId: string, text: string): Promise<void> => {
    return await canvasService.updateText(shapeId, text);
  };

  const updateTextFontSize = async (shapeId: string, fontSize: number): Promise<void> => {
    return await canvasService.updateTextFontSize(shapeId, fontSize);
  };

  const updateTextFormatting = async (shapeId: string, formatting: any): Promise<void> => {
    return await canvasService.updateTextFormatting(shapeId, formatting);
  };

  const value = {
    selectedColor,
    setSelectedColor,
    activeTool,
    setActiveTool,
    selectedShapeId,
    setSelectedShapeId,
    isDrawMode,
    setIsDrawMode,
    isBombMode,
    setIsBombMode,
    editingTextId,
    setEditingTextId,
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
    createText,
    updateText,
    updateTextFontSize,
    updateTextFormatting,
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

