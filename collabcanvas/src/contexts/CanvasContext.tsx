import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { ShapeData, ShapeCreateInput } from '../services/canvasService';
import { useAuth } from '../hooks/useAuth';
import type { Unsubscribe } from 'firebase/firestore';

interface CanvasContextType {
  // Color selection
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Tool selection
  selectedTool: 'rectangle' | 'text' | 'pan' | 'bomb';
  setSelectedTool: (tool: 'rectangle' | 'text' | 'pan' | 'bomb') => void;
  
  // Drawing mode (deprecated - use selectedTool)
  isDrawMode: boolean;
  setIsDrawMode: (isDrawMode: boolean) => void;
  
  // Bomb mode (deprecated - use selectedTool)
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
  
  // Shapes
  shapes: ShapeData[];
  createShape: (shapeInput: ShapeCreateInput) => Promise<string>;
  updateShape: (shapeId: string, updates: Partial<ShapeData>) => Promise<void>;
  resizeShape: (shapeId: string, width: number, height: number) => Promise<void>;
  rotateShape: (shapeId: string, rotation: number) => Promise<void>;
  lockShape: (shapeId: string, userId: string) => Promise<{ success: boolean; lockedByUsername?: string }>;
  unlockShape: (shapeId: string) => Promise<void>;
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
  const [selectedTool, setSelectedTool] = useState<'rectangle' | 'text' | 'pan' | 'bomb'>('pan');
  const [isDrawMode, setIsDrawMode] = useState(false); // Default: Pan mode (deprecated)
  const [isBombMode, setIsBombMode] = useState(false); // Bomb tool mode (deprecated)
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

  const updateShape = async (shapeId: string, updates: Partial<ShapeData>): Promise<void> => {
    return await canvasService.updateShape(shapeId, updates);
  };

  const resizeShape = async (shapeId: string, width: number, height: number): Promise<void> => {
    return await canvasService.resizeShape(shapeId, width, height);
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
    selectedTool,
    setSelectedTool,
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
    updateShape,
    resizeShape,
    rotateShape,
    lockShape,
    unlockShape,
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

