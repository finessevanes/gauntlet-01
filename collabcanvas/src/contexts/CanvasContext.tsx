import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { ShapeData, ShapeCreateInput, CommentData } from '../services/canvasService';
import { selectionService } from '../services/selectionService';
import type { UserSelection } from '../services/selectionService';
import { useAuth } from '../hooks/useAuth';
import type { Unsubscribe } from 'firebase/firestore';

export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'bomb';

export interface TextFormattingDefaults {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
}

interface CanvasContextType {
  // Canvas selection (NEW - PR #12)
  currentCanvasId: string | null;
  setCurrentCanvasId: (id: string | null) => void;
  
  // Color selection
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // Text formatting defaults (for text tool)
  textFormattingDefaults: TextFormattingDefaults;
  setTextFormattingDefaults: (defaults: TextFormattingDefaults) => void;
  
  // Tool selection
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Shape selection
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;
  selectedShapes: string[];
  setSelectedShapes: (shapes: string[]) => void;
  lastClickedShapeId: string | null;
  setLastClickedShapeId: (id: string | null) => void;
  
  // Clipboard
  clipboard: ShapeData[] | null;
  setClipboard: (shapes: ShapeData[] | null) => void;
  
  // Other users' selections (for locking visibility)
  userSelections: Record<string, UserSelection>;
  setUserSelections: (selections: Record<string, UserSelection>) => void;
  
  // Drawing mode (deprecated - kept for backward compatibility)
  isDrawMode: boolean;
  setIsDrawMode: (isDrawMode: boolean) => void;
  
  // Bomb mode (deprecated - kept for backward compatibility)
  isBombMode: boolean;
  setIsBombMode: (isBombMode: boolean) => void;
  
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
  createText: (textData: { x: number; y: number; color: string; createdBy: string }) => Promise<string>;
  updateShape: (shapeId: string, updates: Partial<ShapeData>) => Promise<void>;
  batchUpdateShapes: (updates: Array<{ shapeId: string; updates: Partial<ShapeData> }>) => Promise<void>;
  resizeShape: (shapeId: string, width: number, height: number) => Promise<void>;
  resizeCircle: (shapeId: string, radius: number) => Promise<void>;
  rotateShape: (shapeId: string, rotation: number) => Promise<void>;
  lockShape: (shapeId: string, userId: string) => Promise<{ success: boolean; lockedByUsername?: string }>;
  unlockShape: (shapeId: string) => Promise<void>;
  deleteShape: (shapeId: string) => Promise<void>;
  duplicateShape: (shapeId: string, userId: string) => Promise<string>;
  deleteAllShapes: () => Promise<void>;
  
  // Grouping operations
  groupShapes: (shapeIds: string[], userId: string, name?: string) => Promise<string>;
  ungroupShapes: (groupId: string) => Promise<void>;
  
  // Z-Index operations
  bringToFront: (shapeId: string) => Promise<void>;
  sendToBack: (shapeId: string) => Promise<void>;
  bringForward: (shapeId: string) => Promise<void>;
  sendBackward: (shapeId: string) => Promise<void>;
  batchBringToFront: (shapeIds: string[]) => Promise<void>;
  batchSendToBack: (shapeIds: string[]) => Promise<void>;
  batchBringForward: (shapeIds: string[]) => Promise<void>;
  batchSendBackward: (shapeIds: string[]) => Promise<void>;
  
  // Alignment operations
  alignShapes: (shapeIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => Promise<void>;
  distributeShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => Promise<void>;
  
  // Alignment toolbar state
  isAlignmentToolbarMinimized: boolean;
  setIsAlignmentToolbarMinimized: (minimized: boolean) => void;
  
  // Loading state
  shapesLoading: boolean;
  
  // Comment operations
  comments: CommentData[];
  commentsLoading: boolean;
  addComment: (shapeId: string, text: string, userId: string, username: string) => Promise<string>;
  addReply: (commentId: string, userId: string, username: string, text: string) => Promise<void>;
  resolveComment: (commentId: string, userId: string) => Promise<void>;
  deleteComment: (commentId: string, userId: string) => Promise<void>;
  deleteReply: (commentId: string, replyIndex: number, userId: string) => Promise<void>;
  markRepliesAsRead: (commentId: string, userId: string) => Promise<void>;
  
  // Text editing state
  editingTextId: string | null;
  enterEdit: (shapeId: string) => void;
  saveText: (shapeId: string, text: string) => Promise<void>;
  updateTextFormatting: (shapeId: string, formatting: {
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    fontSize?: number;
  }) => Promise<void>;
  cancelEdit: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // NEW: Multi-canvas support (PR #12)
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [textFormattingDefaults, setTextFormattingDefaults] = useState<TextFormattingDefaults>({
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none'
  });
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [lastClickedShapeId, setLastClickedShapeId] = useState<string | null>(null);
  const [userSelections, setUserSelections] = useState<Record<string, UserSelection>>({});
  const [isDrawMode, setIsDrawMode] = useState(false); // Deprecated: kept for backward compatibility
  const [isBombMode, setIsBombMode] = useState(false); // Deprecated: kept for backward compatibility
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [shapesLoading, setShapesLoading] = useState(true);
  const [clipboard, setClipboard] = useState<ShapeData[] | null>(null);
  const [isAlignmentToolbarMinimized, setIsAlignmentToolbarMinimized] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Subscribe to real-time shape updates (canvas-scoped)
  useEffect(() => {
    if (!user || !currentCanvasId) {
      setShapes([]);
      setShapesLoading(false);
      return;
    }

    setShapesLoading(true);

    const unsubscribe: Unsubscribe = canvasService.subscribeToShapes(currentCanvasId, (updatedShapes) => {
      setShapes(updatedShapes);
      setShapesLoading(false);
    });

    // Cleanup subscription on unmount or canvas change
    return () => {
      unsubscribe();
    };
  }, [user, currentCanvasId]);

  // Subscribe to real-time comment updates (canvas-scoped)
  useEffect(() => {
    if (!user || !currentCanvasId) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);

    const unsubscribe: Unsubscribe = canvasService.subscribeToComments(currentCanvasId, (updatedComments) => {
      setComments(updatedComments);
      setCommentsLoading(false);
    });

    // Cleanup subscription on unmount or canvas change
    return () => {
      unsubscribe();
    };
  }, [user, currentCanvasId]);

  // Subscribe to other users' selections for locking visibility
  useEffect(() => {
    if (!user) {
      setUserSelections({});
      return;
    }
    
    const unsubscribe: Unsubscribe = selectionService.subscribeToCanvasSelections(
      user.uid,
      (selections) => {
        setUserSelections(selections);
      }
    );

    // Cleanup subscription on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Sync current user's selection to Firestore
  useEffect(() => {
    if (!user) return;

    const syncSelection = async () => {
      try {
        if (selectedShapes.length > 0) {
          // Update selection in Firestore
          await selectionService.updateUserSelection(
            user.uid,
            user.displayName || user.email || 'Anonymous',
            selectedShapes
          );
        } else {
          // Clear selection from Firestore
          await selectionService.clearUserSelection(user.uid);
        }
      } catch (error) {
        console.error('❌ Failed to sync selection to Firestore:', error);
      }
    };

    syncSelection();
  }, [user, selectedShapes]);

  // Shape operations (now canvas-scoped)
  const createShape = useCallback(async (shapeInput: ShapeCreateInput): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.createShape(currentCanvasId, shapeInput);
  }, [currentCanvasId]);

  const createCircle = useCallback(async (circleData: { x: number; y: number; radius: number; color: string; createdBy: string }): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.createCircle(currentCanvasId, circleData);
  }, [currentCanvasId]);

  const createTriangle = useCallback(async (triangleData: { x: number; y: number; width: number; height: number; color: string; createdBy: string }): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.createTriangle(currentCanvasId, triangleData);
  }, [currentCanvasId]);

  const createText = useCallback(async (textData: { x: number; y: number; color: string; createdBy: string }): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.createText(currentCanvasId, {
      ...textData,
      fontSize: textFormattingDefaults.fontSize,
      fontWeight: textFormattingDefaults.fontWeight,
      fontStyle: textFormattingDefaults.fontStyle,
      textDecoration: textFormattingDefaults.textDecoration,
    });
  }, [currentCanvasId, textFormattingDefaults]);

  const updateShape = useCallback(async (shapeId: string, updates: Partial<ShapeData>): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.updateShape(currentCanvasId, shapeId, updates);
  }, [currentCanvasId]);

  const batchUpdateShapes = useCallback(async (updates: Array<{ shapeId: string; updates: Partial<ShapeData> }>): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.batchUpdateShapes(currentCanvasId, updates);
  }, [currentCanvasId]);

  const resizeShape = useCallback(async (shapeId: string, width: number, height: number): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.resizeShape(currentCanvasId, shapeId, width, height);
  }, [currentCanvasId]);

  const resizeCircle = useCallback(async (shapeId: string, radius: number) => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.resizeCircle(currentCanvasId, shapeId, radius);
  }, [currentCanvasId]);

  const rotateShape = useCallback(async (shapeId: string, rotation: number): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.rotateShape(currentCanvasId, shapeId, rotation);
  }, [currentCanvasId]);

  const lockShape = useCallback(async (shapeId: string, userId: string): Promise<{ success: boolean; lockedByUsername?: string }> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.lockShape(currentCanvasId, shapeId, userId);
  }, [currentCanvasId]);

  const unlockShape = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.unlockShape(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  const deleteShape = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.deleteShape(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  const duplicateShape = useCallback(async (shapeId: string, userId: string): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.duplicateShape(currentCanvasId, shapeId, userId);
  }, [currentCanvasId]);

  const deleteAllShapes = useCallback(async (): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.deleteAllShapes(currentCanvasId);
  }, [currentCanvasId]);

  // Grouping operations
  const groupShapes = useCallback(async (shapeIds: string[], userId: string, name?: string): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.groupShapes(currentCanvasId, shapeIds, userId, name);
  }, [currentCanvasId]);

  const ungroupShapes = useCallback(async (groupId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.ungroupShapes(currentCanvasId, groupId);
  }, [currentCanvasId]);

  // Z-Index operations
  const bringToFront = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.bringToFront(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  const sendToBack = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.sendToBack(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  const bringForward = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.bringForward(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  const sendBackward = useCallback(async (shapeId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.sendBackward(currentCanvasId, shapeId);
  }, [currentCanvasId]);

  // Batch Z-Index operations (for multi-selection)
  const batchBringToFront = useCallback(async (shapeIds: string[]): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.batchBringToFront(currentCanvasId, shapeIds);
  }, [currentCanvasId]);

  const batchSendToBack = useCallback(async (shapeIds: string[]): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.batchSendToBack(currentCanvasId, shapeIds);
  }, [currentCanvasId]);

  const batchBringForward = useCallback(async (shapeIds: string[]): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.batchBringForward(currentCanvasId, shapeIds);
  }, [currentCanvasId]);

  const batchSendBackward = useCallback(async (shapeIds: string[]): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.batchSendBackward(currentCanvasId, shapeIds);
  }, [currentCanvasId]);

  // Alignment operations
  const alignShapes = useCallback(async (
    shapeIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.alignShapes(currentCanvasId, shapeIds, alignment);
  }, [currentCanvasId]);

  const distributeShapes = useCallback(async (
    shapeIds: string[],
    direction: 'horizontal' | 'vertical'
  ): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.distributeShapes(currentCanvasId, shapeIds, direction);
  }, [currentCanvasId]);

  // Comment operations
  const addComment = useCallback(async (shapeId: string, text: string, userId: string, username: string): Promise<string> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.addComment(currentCanvasId, shapeId, text, userId, username);
  }, [currentCanvasId]);

  const addReply = useCallback(async (commentId: string, userId: string, username: string, text: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.addReply(currentCanvasId, commentId, userId, username, text);
  }, [currentCanvasId]);

  const resolveComment = useCallback(async (commentId: string, userId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.resolveComment(currentCanvasId, commentId, userId);
  }, [currentCanvasId]);

  const deleteComment = useCallback(async (commentId: string, userId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.deleteComment(currentCanvasId, commentId, userId);
  }, [currentCanvasId]);

  const deleteReply = useCallback(async (commentId: string, replyIndex: number, userId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.deleteReply(currentCanvasId, commentId, replyIndex, userId);
  }, [currentCanvasId]);

  const markRepliesAsRead = useCallback(async (commentId: string, userId: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    return await canvasService.markRepliesAsRead(currentCanvasId, commentId, userId);
  }, [currentCanvasId]);

  // Text editing functions
  const enterEdit = useCallback((shapeId: string): void => {
    setEditingTextId(shapeId);
  }, []);

  const saveText = useCallback(async (shapeId: string, text: string): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    try {
      await canvasService.updateShapeText(currentCanvasId, shapeId, text);
      setEditingTextId(null);
      // Reset cursor to pointer after saving text
      setActiveTool('select');
    } catch (error) {
      console.error('❌ Error saving text:', error);
      throw error;
    }
  }, [currentCanvasId]);

  const updateTextFormatting = useCallback(async (shapeId: string, formatting: {
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    fontSize?: number;
  }): Promise<void> => {
    if (!currentCanvasId) throw new Error('No canvas selected');
    try {
      await canvasService.updateTextFormatting(currentCanvasId, shapeId, formatting);
    } catch (error) {
      console.error('❌ Error updating text formatting:', error);
      throw error;
    }
  }, [currentCanvasId]);

  const cancelEdit = useCallback((): void => {
    setEditingTextId(null);
    // Reset cursor to pointer after cancelling text editing
    setActiveTool('select');
  }, []);

  const value = useMemo(() => ({
    currentCanvasId,
    setCurrentCanvasId,
    selectedColor,
    setSelectedColor,
    textFormattingDefaults,
    setTextFormattingDefaults,
    activeTool,
    setActiveTool,
    selectedShapeId,
    setSelectedShapeId,
    selectedShapes,
    setSelectedShapes,
    lastClickedShapeId,
    setLastClickedShapeId,
    userSelections,
    setUserSelections,
    isDrawMode,
    setIsDrawMode,
    isBombMode,
    setIsBombMode,
    stageScale,
    setStageScale,
    stagePosition,
    setStagePosition,
    clipboard,
    setClipboard,
    shapes,
    createShape,
    createCircle,
    createTriangle,
    createText,
    updateShape,
    batchUpdateShapes,
    resizeShape,
    resizeCircle,
    rotateShape,
    lockShape,
    unlockShape,
    deleteShape,
    duplicateShape,
    deleteAllShapes,
    groupShapes,
    ungroupShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    batchBringToFront,
    batchSendToBack,
    batchBringForward,
    batchSendBackward,
    alignShapes,
    distributeShapes,
    isAlignmentToolbarMinimized,
    setIsAlignmentToolbarMinimized,
    shapesLoading,
    comments,
    commentsLoading,
    addComment,
    addReply,
    resolveComment,
    deleteComment,
    deleteReply,
    markRepliesAsRead,
    editingTextId,
    enterEdit,
    saveText,
    updateTextFormatting,
    cancelEdit,
  }), [
    currentCanvasId,
    selectedColor,
    textFormattingDefaults,
    activeTool,
    selectedShapeId,
    selectedShapes,
    lastClickedShapeId,
    userSelections,
    isDrawMode,
    isBombMode,
    stageScale,
    stagePosition,
    clipboard,
    shapes,
    createShape,
    createCircle,
    createTriangle,
    createText,
    updateShape,
    batchUpdateShapes,
    resizeShape,
    resizeCircle,
    rotateShape,
    lockShape,
    unlockShape,
    deleteShape,
    duplicateShape,
    deleteAllShapes,
    groupShapes,
    ungroupShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    batchBringToFront,
    batchSendToBack,
    batchBringForward,
    batchSendBackward,
    alignShapes,
    distributeShapes,
    isAlignmentToolbarMinimized,
    shapesLoading,
    comments,
    commentsLoading,
    addComment,
    addReply,
    resolveComment,
    deleteComment,
    deleteReply,
    markRepliesAsRead,
    editingTextId,
    enterEdit,
    saveText,
    updateTextFormatting,
    cancelEdit,
  ]);

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
