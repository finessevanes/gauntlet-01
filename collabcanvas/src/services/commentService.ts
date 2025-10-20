import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  query,
  arrayUnion,
  Timestamp as FirestoreTimestamp
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { CommentData, CommentReply } from './types/canvasTypes';

class CommentService {
  /**
   * Get comments collection path for a specific canvas
   */
  private getCommentsPath(canvasId: string): string {
    return `canvases/${canvasId}/comments`;
  }

  async addComment(canvasId: string, shapeId: string, text: string, userId: string, username: string): Promise<string> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentId = doc(collection(firestore, commentsPath)).id;
      
      const commentData: Omit<CommentData, 'id'> = {
        shapeId,
        userId,
        username,
        text,
        createdAt: serverTimestamp() as Timestamp,
        resolved: false,
        replies: [],
        replyReadStatus: {},
        lastReplyAt: null,
      };

      const commentRef = doc(firestore, commentsPath, commentId);
      await setDoc(commentRef, commentData);

      return commentId;
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      throw error;
    }
  }

  async addReply(canvasId: string, commentId: string, userId: string, username: string, text: string): Promise<void> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentRef = doc(firestore, commentsPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const newReply: CommentReply = {
        userId,
        username,
        text,
        createdAt: FirestoreTimestamp.now(),
      };

      await updateDoc(commentRef, {
        replies: arrayUnion(newReply),
        lastReplyAt: FirestoreTimestamp.now(),
      });
    } catch (error) {
      console.error('❌ Error adding reply:', error);
      throw error;
    }
  }

  async markRepliesAsRead(canvasId: string, commentId: string, userId: string): Promise<void> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentRef = doc(firestore, commentsPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        return;
      }

      await updateDoc(commentRef, {
        [`replyReadStatus.${userId}`]: FirestoreTimestamp.now(),
      });
    } catch (error) {
      console.error('❌ Error marking replies as read:', error);
    }
  }

  async resolveComment(canvasId: string, commentId: string): Promise<void> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentRef = doc(firestore, commentsPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      await updateDoc(commentRef, {
        resolved: true,
      });
    } catch (error) {
      console.error('❌ Error resolving comment:', error);
      throw error;
    }
  }

  async deleteComment(canvasId: string, commentId: string, userId: string): Promise<void> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentRef = doc(firestore, commentsPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      if (comment.userId !== userId) {
        throw new Error('Only the comment author can delete this comment');
      }

      await deleteDoc(commentRef);
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }

  async deleteReply(canvasId: string, commentId: string, replyIndex: number, userId: string): Promise<void> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentRef = doc(firestore, commentsPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      if (!comment.replies || replyIndex < 0 || replyIndex >= comment.replies.length) {
        throw new Error('Reply not found');
      }

      const reply = comment.replies[replyIndex];
      
      if (reply.userId !== userId) {
        throw new Error('Only the reply author can delete this reply');
      }

      const updatedReplies = comment.replies.filter((_, index) => index !== replyIndex);

      await updateDoc(commentRef, {
        replies: updatedReplies,
      });
    } catch (error) {
      console.error('❌ Error deleting reply:', error);
      throw error;
    }
  }

  subscribeToComments(canvasId: string, callback: (comments: CommentData[]) => void): Unsubscribe {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentsRef = collection(firestore, commentsPath);
      const q = query(commentsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const comments: CommentData[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
              id: doc.id,
              ...data,
              replyReadStatus: data.replyReadStatus || {},
              lastReplyAt: data.lastReplyAt || null,
            } as CommentData);
          });

          callback(comments);
        },
        (error) => {
          console.error('❌ Error in comments subscription:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to comments:', error);
      return () => {};
    }
  }

  async getCommentsByShapeId(canvasId: string, shapeId: string): Promise<CommentData[]> {
    try {
      const commentsPath = this.getCommentsPath(canvasId);
      const commentsRef = collection(firestore, commentsPath);
      const snapshot = await getDocs(commentsRef);

      const comments: CommentData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const comment = {
          id: doc.id,
          ...data,
          replyReadStatus: data.replyReadStatus || {},
          lastReplyAt: data.lastReplyAt || null,
        } as CommentData;
        
        if (comment.shapeId === shapeId) {
          comments.push(comment);
        }
      });

      return comments;
    } catch (error) {
      console.error('❌ Error fetching comments for shape:', error);
      return [];
    }
  }
}

export const commentService = new CommentService();
export default CommentService;
