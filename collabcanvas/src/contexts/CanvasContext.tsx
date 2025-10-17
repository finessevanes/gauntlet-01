import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';
import { canvasService } from '../services/canvasService';
import type { ShapeData, ShapeCreateInput, CommentData } from '../services/canvasService';
import { selectionService } from '../services/selectionService';
import type { UserSelection } from '../services/selectionService';
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
  cancelEdit: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
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

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!user) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);

    const unsubscribe: Unsubscribe = canvasService.subscribeToComments((updatedComments) => {
      setComments(updatedComments);
      setCommentsLoading(false);
    });

    // Cleanup subscription on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Subscribe to other users' selections for locking visibility
  useEffect(() => {
    if (!user) {
      setUserSelections({});
      return;
    }

    console.log('🔄 Subscribing to other users\' selections');
    
    const unsubscribe: Unsubscribe = selectionService.subscribeToCanvasSelections(
      user.uid,
      (selections) => {
        setUserSelections(selections);
      }
    );

    // Cleanup subscription on unmount or user change
    return () => {
      console.log('🔄 Unsubscribing from other users\' selections');
      unsubscribe();
    };
  }, [user]);

  // Sync current user's selection to Firestore
  useEffect(() => {
    if (!user) return;

    const syncSelection = async () => {
      try {
        if (selectedShapes.length > 0) {
          console.log('📤 Syncing selection to Firestore:', {
            userId: user.uid,
            username: user.displayName || user.email || 'Anonymous',
            shapeCount: selectedShapes.length,
            shapeIds: selectedShapes,
          });
          
          // Update selection in Firestore
          await selectionService.updateUserSelection(
            user.uid,
            user.displayName || user.email || 'Anonymous',
            selectedShapes
          );
        } else {
          console.log('📤 Clearing selection from Firestore:', user.uid);
          
          // Clear selection from Firestore
          await selectionService.clearUserSelection(user.uid);
        }
      } catch (error) {
        console.error('❌ Failed to sync selection to Firestore:', error);
        console.error('   Error details:', error);
      }
    };

    syncSelection();
  }, [user, selectedShapes]);

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

  const createText = async (textData: { x: number; y: number; color: string; createdBy: string }): Promise<string> => {
    return await canvasService.createText(textData);
  };

  const updateShape = async (shapeId: string, updates: Partial<ShapeData>): Promise<void> => {
    return await canvasService.updateShape(shapeId, updates);
  };

  const batchUpdateShapes = async (updates: Array<{ shapeId: string; updates: Partial<ShapeData> }>): Promise<void> => {
    return await canvasService.batchUpdateShapes(updates);
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

  // Grouping operations
  const groupShapes = async (shapeIds: string[], userId: string, name?: string): Promise<string> => {
    return await canvasService.groupShapes(shapeIds, userId, name);
  };

  const ungroupShapes = async (groupId: string): Promise<void> => {
    return await canvasService.ungroupShapes(groupId);
  };

  // Z-Index operations
  const bringToFront = async (shapeId: string): Promise<void> => {
    return await canvasService.bringToFront(shapeId);
  };

  const sendToBack = async (shapeId: string): Promise<void> => {
    return await canvasService.sendToBack(shapeId);
  };

  const bringForward = async (shapeId: string): Promise<void> => {
    return await canvasService.bringForward(shapeId);
  };

  const sendBackward = async (shapeId: string): Promise<void> => {
    return await canvasService.sendBackward(shapeId);
  };

  // Batch Z-Index operations (for multi-selection)
  const batchBringToFront = async (shapeIds: string[]): Promise<void> => {
    return await canvasService.batchBringToFront(shapeIds);
  };

  const batchSendToBack = async (shapeIds: string[]): Promise<void> => {
    return await canvasService.batchSendToBack(shapeIds);
  };

  const batchBringForward = async (shapeIds: string[]): Promise<void> => {
    return await canvasService.batchBringForward(shapeIds);
  };

  const batchSendBackward = async (shapeIds: string[]): Promise<void> => {
    return await canvasService.batchSendBackward(shapeIds);
  };

  // Alignment operations
  const alignShapes = async (
    shapeIds: string[],
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): Promise<void> => {
    return await canvasService.alignShapes(shapeIds, alignment);
  };

  const distributeShapes = async (
    shapeIds: string[],
    direction: 'horizontal' | 'vertical'
  ): Promise<void> => {
    return await canvasService.distributeShapes(shapeIds, direction);
  };

  // Comment operations
  const addComment = async (shapeId: string, text: string, userId: string, username: string): Promise<string> => {
    return await canvasService.addComment(shapeId, text, userId, username);
  };

  const addReply = async (commentId: string, userId: string, username: string, text: string): Promise<void> => {
    return await canvasService.addReply(commentId, userId, username, text);
  };

  const resolveComment = async (commentId: string, userId: string): Promise<void> => {
    return await canvasService.resolveComment(commentId, userId);
  };

  const deleteComment = async (commentId: string, userId: string): Promise<void> => {
    return await canvasService.deleteComment(commentId, userId);
  };

  const deleteReply = async (commentId: string, replyIndex: number, userId: string): Promise<void> => {
    return await canvasService.deleteReply(commentId, replyIndex, userId);
  };

  const markRepliesAsRead = async (commentId: string, userId: string): Promise<void> => {
    return await canvasService.markRepliesAsRead(commentId, userId);
  };

  // Text editing functions
  const enterEdit = (shapeId: string): void => {
    setEditingTextId(shapeId);
  };

  const saveText = async (shapeId: string, text: string): Promise<void> => {
    try {
      await canvasService.updateShapeText(shapeId, text);
      setEditingTextId(null);
      // Reset cursor to pointer after saving text
      setActiveTool('select');
    } catch (error) {
      console.error('❌ Error saving text:', error);
      throw error;
    }
  };

  const cancelEdit = (): void => {
    setEditingTextId(null);
    // Reset cursor to pointer after cancelling text editing
    setActiveTool('select');
  };

  const value = {
    selectedColor,
    setSelectedColor,
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
    cancelEdit,
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

