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
import { shapeService } from './shapeService';
import type { CommentData, CommentReply } from './types/canvasTypes';

class CommentService {
  private commentsCollectionPath = 'canvases/main/comments';

  async addComment(shapeId: string, text: string, userId: string, username: string): Promise<string> {
    try {
      await shapeService.ensureCanvasDocExists();
      
      const commentId = doc(collection(firestore, this.commentsCollectionPath)).id;
      
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

      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      await setDoc(commentRef, commentData);

      console.log(`✅ Comment created: ${commentId} on shape ${shapeId}`);
      return commentId;
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      throw error;
    }
  }

  async addReply(commentId: string, userId: string, username: string, text: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
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

      console.log(`✅ Reply added to comment: ${commentId}`);
    } catch (error) {
      console.error('❌ Error adding reply:', error);
      throw error;
    }
  }

  async markRepliesAsRead(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        console.warn('⚠️ Comment not found:', commentId);
        return;
      }

      await updateDoc(commentRef, {
        [`replyReadStatus.${userId}`]: FirestoreTimestamp.now(),
      });

      console.log(`✅ Replies marked as read for user ${userId} on comment ${commentId}`);
    } catch (error) {
      console.error('❌ Error marking replies as read:', error);
    }
  }

  async resolveComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      if (comment.userId !== userId) {
        console.log('⚠️ User is not comment author, but allowing resolution for MVP');
      }

      await updateDoc(commentRef, {
        resolved: true,
      });

      console.log(`✅ Comment resolved: ${commentId}`);
    } catch (error) {
      console.error('❌ Error resolving comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentSnap.data() as CommentData;
      
      if (comment.userId !== userId) {
        throw new Error('Only the comment author can delete this comment');
      }

      await deleteDoc(commentRef);
      console.log(`✅ Comment deleted: ${commentId}`);
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }

  async deleteReply(commentId: string, replyIndex: number, userId: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.commentsCollectionPath, commentId);
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

      console.log(`✅ Reply deleted from comment: ${commentId}`);
    } catch (error) {
      console.error('❌ Error deleting reply:', error);
      throw error;
    }
  }

  subscribeToComments(callback: (comments: CommentData[]) => void): Unsubscribe {
    try {
      const commentsRef = collection(firestore, this.commentsCollectionPath);
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

  async getCommentsByShapeId(shapeId: string): Promise<CommentData[]> {
    try {
      const commentsRef = collection(firestore, this.commentsCollectionPath);
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

