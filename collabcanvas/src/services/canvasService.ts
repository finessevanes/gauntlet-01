import type { Unsubscribe } from 'firebase/firestore';
import { shapeService } from './shapeService';
import { zIndexService } from './zIndexService';
import { groupService } from './groupService';
import { alignmentService } from './alignmentService';
import { commentService } from './commentService';

// Re-export types
export type {
  ShapeData,
  GroupData,
  CommentData,
  CommentReply,
  ShapeCreateInput,
  ShapeUpdateInput,
} from './types/canvasTypes';

/**
 * Main Canvas Service - Facade pattern that delegates to specialized services
 * This provides a unified interface for all canvas operations
 */
class CanvasService {
  // ============================================
  // Shape Operations (delegates to shapeService)
  // ============================================

  async createShape(shapeInput: Parameters<typeof shapeService.createShape>[0]) {
    return shapeService.createShape(shapeInput);
  }

  async updateShape(shapeId: string, updates: Parameters<typeof shapeService.updateShape>[1]) {
    return shapeService.updateShape(shapeId, updates);
  }

  async updateShapeText(shapeId: string, text: string) {
    return shapeService.updateShapeText(shapeId, text);
  }

  async updateTextFormatting(shapeId: string, formatting: Parameters<typeof shapeService.updateTextFormatting>[1]) {
    return shapeService.updateTextFormatting(shapeId, formatting);
  }

  async batchUpdateShapes(updates: Parameters<typeof shapeService.batchUpdateShapes>[0]) {
    return shapeService.batchUpdateShapes(updates);
  }

  async lockShape(shapeId: string, userId: string) {
    return shapeService.lockShape(shapeId, userId);
  }

  async unlockShape(shapeId: string) {
    return shapeService.unlockShape(shapeId);
  }

  async resizeShape(shapeId: string, width: number, height: number) {
    return shapeService.resizeShape(shapeId, width, height);
  }

  async rotateShape(shapeId: string, rotation: number) {
    return shapeService.rotateShape(shapeId, rotation);
  }

  async resizeCircle(shapeId: string, radius: number) {
    return shapeService.resizeCircle(shapeId, radius);
  }

  async deleteShape(shapeId: string) {
    return shapeService.deleteShape(shapeId);
  }

  async deleteAllShapes() {
    return shapeService.deleteAllShapes();
  }

  async duplicateShape(shapeId: string, userId: string) {
    return shapeService.duplicateShape(shapeId, userId);
  }

  async createCircle(circleData: Parameters<typeof shapeService.createCircle>[0]) {
    return shapeService.createCircle(circleData);
  }

  async createTriangle(triangleData: Parameters<typeof shapeService.createTriangle>[0]) {
    return shapeService.createTriangle(triangleData);
  }

  async createText(textData: Parameters<typeof shapeService.createText>[0]) {
    return shapeService.createText(textData);
  }

  subscribeToShapes(callback: Parameters<typeof shapeService.subscribeToShapes>[0]): Unsubscribe {
    return shapeService.subscribeToShapes(callback);
  }

  async getShapes() {
    return shapeService.getShapes();
  }

  // ============================================
  // Z-Index Operations (delegates to zIndexService)
  // ============================================

  async bringToFront(shapeId: string) {
    return zIndexService.bringToFront(shapeId);
  }

  async batchBringToFront(shapeIds: string[]) {
    return zIndexService.batchBringToFront(shapeIds);
  }

  async sendToBack(shapeId: string) {
    return zIndexService.sendToBack(shapeId);
  }

  async batchSendToBack(shapeIds: string[]) {
    return zIndexService.batchSendToBack(shapeIds);
  }

  async bringForward(shapeId: string) {
    return zIndexService.bringForward(shapeId);
  }

  async batchBringForward(shapeIds: string[]) {
    return zIndexService.batchBringForward(shapeIds);
  }

  async sendBackward(shapeId: string) {
    return zIndexService.sendBackward(shapeId);
  }

  async batchSendBackward(shapeIds: string[]) {
    return zIndexService.batchSendBackward(shapeIds);
  }

  // ============================================
  // Group Operations (delegates to groupService)
  // ============================================

  async groupShapes(shapeIds: string[], userId: string, name?: string) {
    return groupService.groupShapes(shapeIds, userId, name);
  }

  async ungroupShapes(groupId: string) {
    return groupService.ungroupShapes(groupId);
  }

  async getGroup(groupId: string) {
    return groupService.getGroup(groupId);
  }

  // ============================================
  // Alignment Operations (delegates to alignmentService)
  // ============================================

  async alignShapes(shapeIds: string[], alignment: Parameters<typeof alignmentService.alignShapes>[1]) {
    return alignmentService.alignShapes(shapeIds, alignment);
  }

  async distributeShapes(shapeIds: string[], direction: Parameters<typeof alignmentService.distributeShapes>[1]) {
    return alignmentService.distributeShapes(shapeIds, direction);
  }

  // ============================================
  // Comment Operations (delegates to commentService)
  // ============================================

  async addComment(shapeId: string, text: string, userId: string, username: string) {
    return commentService.addComment(shapeId, text, userId, username);
  }

  async addReply(commentId: string, userId: string, username: string, text: string) {
    return commentService.addReply(commentId, userId, username, text);
  }

  async markRepliesAsRead(commentId: string, userId: string) {
    return commentService.markRepliesAsRead(commentId, userId);
  }

  async resolveComment(commentId: string, userId: string) {
    return commentService.resolveComment(commentId, userId);
  }

  async deleteComment(commentId: string, userId: string) {
    return commentService.deleteComment(commentId, userId);
  }

  async deleteReply(commentId: string, replyIndex: number, userId: string) {
    return commentService.deleteReply(commentId, replyIndex, userId);
  }

  subscribeToComments(callback: Parameters<typeof commentService.subscribeToComments>[0]): Unsubscribe {
    return commentService.subscribeToComments(callback);
  }

  async getCommentsByShapeId(shapeId: string) {
    return commentService.getCommentsByShapeId(shapeId);
  }
}

// Export a singleton instance
export const canvasService = new CanvasService();
export default CanvasService;
