import type { Timestamp } from 'firebase/firestore';

// Shape data types
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'text' | 'circle' | 'triangle' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  // Circle-specific fields
  radius?: number;
  // Text-specific fields
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  // Path-specific fields
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  // Grouping and layering fields
  groupId: string | null;
  zIndex: number;
  createdBy: string;
  createdAt: Timestamp | null;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Group data types
export interface GroupData {
  id: string;
  name: string;
  shapeIds: string[];
  createdBy: string;
  createdAt: Timestamp | null;
}

// Comment data types
export interface CommentReply {
  userId: string;
  username: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface CommentData {
  id: string;
  shapeId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Timestamp | null;
  resolved: boolean;
  replies: CommentReply[];
  replyReadStatus: Record<string, Timestamp>;
  lastReplyAt: Timestamp | null;
}

export type ShapeCreateInput = Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt' | 'lockedBy' | 'lockedAt' | 'groupId' | 'zIndex'> & {
  groupId?: string | null;
  zIndex?: number;
};

export type ShapeUpdateInput = Partial<Pick<ShapeData, 'x' | 'y' | 'width' | 'height' | 'color' | 'rotation' | 'points'>>;

// Path-specific interfaces
export interface Path {
  id: string;
  type: 'path';
  points: { x: number; y: number }[];
  strokeWidth: number;
  color: string;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  zIndex: number;
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
}

export interface CreatePathInput {
  points: { x: number; y: number }[];
  strokeWidth: number;
  color: string;
}

// Canvas metadata types
export interface CanvasMetadata {
  id: string;
  name: string;
  ownerId: string;
  collaboratorIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  shapeCount: number;
}

export interface CanvasDocument {
  id: string;
  name: string;
  ownerId: string;
  collaboratorIds: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastAccessedAt: Timestamp | null;
  shapeCount: number;
}

export interface CanvasCardProps {
  canvas: CanvasMetadata;
  onClick: (canvasId: string) => void;
  isLoading?: boolean;
}

// Canvas sharing types
export interface CollaboratorInfo {
  userId: string;
  email: string;
  displayName: string | null;
  isOwner: boolean;
  isOnline?: boolean; // SHOULD-HAVE: from presence data
}

