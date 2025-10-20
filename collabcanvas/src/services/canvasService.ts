import type { Unsubscribe } from 'firebase/firestore';
import { shapeService } from './shapeService';
import { zIndexService } from './zIndexService';
import { groupService } from './groupService';
import { alignmentService } from './alignmentService';
import { commentService } from './commentService';
import type { Path, CreatePathInput } from './types/canvasTypes';

// Re-export types
export type {
  ShapeData,
  GroupData,
  CommentData,
  CommentReply,
  ShapeCreateInput,
  ShapeUpdateInput,
  Path,
  CreatePathInput,
} from './types/canvasTypes';

/**
 * Main Canvas Service - Facade pattern that delegates to specialized services
 * This provides a unified interface for all canvas operations
 */
class CanvasService {
  // ============================================
  // Shape Operations (delegates to shapeService)
  // ============================================

  async createShape(canvasId: string, shapeInput: Parameters<typeof shapeService.createShape>[1]) {
    return shapeService.createShape(canvasId, shapeInput);
  }

  async updateShape(canvasId: string, shapeId: string, updates: Parameters<typeof shapeService.updateShape>[2]) {
    return shapeService.updateShape(canvasId, shapeId, updates);
  }

  async updateShapeText(canvasId: string, shapeId: string, text: string) {
    return shapeService.updateShapeText(canvasId, shapeId, text);
  }

  async updateTextFormatting(canvasId: string, shapeId: string, formatting: Parameters<typeof shapeService.updateTextFormatting>[2]) {
    return shapeService.updateTextFormatting(canvasId, shapeId, formatting);
  }

  async batchUpdateShapes(canvasId: string, updates: Parameters<typeof shapeService.batchUpdateShapes>[1]) {
    return shapeService.batchUpdateShapes(canvasId, updates);
  }

  async lockShape(canvasId: string, shapeId: string, userId: string) {
    return shapeService.lockShape(canvasId, shapeId, userId);
  }

  async unlockShape(canvasId: string, shapeId: string) {
    return shapeService.unlockShape(canvasId, shapeId);
  }

  async resizeShape(canvasId: string, shapeId: string, width: number, height: number) {
    return shapeService.resizeShape(canvasId, shapeId, width, height);
  }

  async rotateShape(canvasId: string, shapeId: string, rotation: number) {
    return shapeService.rotateShape(canvasId, shapeId, rotation);
  }

  async resizeCircle(canvasId: string, shapeId: string, radius: number) {
    return shapeService.resizeCircle(canvasId, shapeId, radius);
  }

  async deleteShape(canvasId: string, shapeId: string) {
    return shapeService.deleteShape(canvasId, shapeId);
  }

  async deleteAllShapes(canvasId: string) {
    return shapeService.deleteAllShapes(canvasId);
  }

  async duplicateShape(canvasId: string, shapeId: string, userId: string) {
    return shapeService.duplicateShape(canvasId, shapeId, userId);
  }

  async createCircle(canvasId: string, circleData: Parameters<typeof shapeService.createCircle>[1]) {
    return shapeService.createCircle(canvasId, circleData);
  }

  async createTriangle(canvasId: string, triangleData: Parameters<typeof shapeService.createTriangle>[1]) {
    return shapeService.createTriangle(canvasId, triangleData);
  }

  async createText(canvasId: string, textData: Parameters<typeof shapeService.createText>[1]) {
    return shapeService.createText(canvasId, textData);
  }

  subscribeToShapes(canvasId: string, callback: Parameters<typeof shapeService.subscribeToShapes>[1]): Unsubscribe {
    return shapeService.subscribeToShapes(canvasId, callback);
  }

  async getShapes(canvasId: string) {
    return shapeService.getShapes(canvasId);
  }

  // ============================================
  // Path Operations (delegates to shapeService)
  // ============================================

  async createPath(canvasId: string, pathInput: CreatePathInput, userId: string) {
    return shapeService.createPath(canvasId, pathInput, userId);
  }

  async updatePath(canvasId: string, pathId: string, updates: Partial<Path>) {
    return shapeService.updatePath(canvasId, pathId, updates);
  }

  subscribeToPaths(canvasId: string, callback: (paths: Path[]) => void): Unsubscribe {
    return shapeService.subscribeToPaths(canvasId, callback);
  }

  // ============================================
  // Z-Index Operations (delegates to zIndexService)
  // ============================================

  async bringToFront(canvasId: string, shapeId: string) {
    return zIndexService.bringToFront(canvasId, shapeId);
  }

  async batchBringToFront(canvasId: string, shapeIds: string[]) {
    return zIndexService.batchBringToFront(canvasId, shapeIds);
  }

  async sendToBack(canvasId: string, shapeId: string) {
    return zIndexService.sendToBack(canvasId, shapeId);
  }

  async batchSendToBack(canvasId: string, shapeIds: string[]) {
    return zIndexService.batchSendToBack(canvasId, shapeIds);
  }

  async bringForward(canvasId: string, shapeId: string) {
    return zIndexService.bringForward(canvasId, shapeId);
  }

  async batchBringForward(canvasId: string, shapeIds: string[]) {
    return zIndexService.batchBringForward(canvasId, shapeIds);
  }

  async sendBackward(canvasId: string, shapeId: string) {
    return zIndexService.sendBackward(canvasId, shapeId);
  }

  async batchSendBackward(canvasId: string, shapeIds: string[]) {
    return zIndexService.batchSendBackward(canvasId, shapeIds);
  }

  // ============================================
  // Group Operations (delegates to groupService)
  // ============================================

  async groupShapes(canvasId: string, shapeIds: string[], userId: string, name?: string) {
    return groupService.groupShapes(canvasId, shapeIds, userId, name);
  }

  async ungroupShapes(canvasId: string, groupId: string) {
    return groupService.ungroupShapes(canvasId, groupId);
  }

  async getGroup(canvasId: string, groupId: string) {
    return groupService.getGroup(canvasId, groupId);
  }

  // ============================================
  // Alignment Operations (delegates to alignmentService)
  // ============================================

  async alignShapes(canvasId: string, shapeIds: string[], alignment: Parameters<typeof alignmentService.alignShapes>[2]) {
    return alignmentService.alignShapes(canvasId, shapeIds, alignment);
  }

  async distributeShapes(canvasId: string, shapeIds: string[], direction: Parameters<typeof alignmentService.distributeShapes>[2]) {
    return alignmentService.distributeShapes(canvasId, shapeIds, direction);
  }

  // ============================================
  // Comment Operations (delegates to commentService)
  // ============================================

  async addComment(canvasId: string, shapeId: string, text: string, userId: string, username: string) {
    return commentService.addComment(canvasId, shapeId, text, userId, username);
  }

  async addReply(canvasId: string, commentId: string, userId: string, username: string, text: string) {
    return commentService.addReply(canvasId, commentId, userId, username, text);
  }

  async markRepliesAsRead(canvasId: string, commentId: string, userId: string) {
    return commentService.markRepliesAsRead(canvasId, commentId, userId);
  }

  async resolveComment(canvasId: string, commentId: string, userId: string) {
    return commentService.resolveComment(canvasId, commentId, userId);
  }

  async deleteComment(canvasId: string, commentId: string, userId: string) {
    return commentService.deleteComment(canvasId, commentId, userId);
  }

  async deleteReply(canvasId: string, commentId: string, replyIndex: number, userId: string) {
    return commentService.deleteReply(canvasId, commentId, replyIndex, userId);
  }

  subscribeToComments(canvasId: string, callback: Parameters<typeof commentService.subscribeToComments>[1]): Unsubscribe {
    return commentService.subscribeToComments(canvasId, callback);
  }

  async getCommentsByShapeId(canvasId: string, shapeId: string) {
    return commentService.getCommentsByShapeId(canvasId, shapeId);
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;
