import { useState } from 'react';
import toast from 'react-hot-toast';
import type { CommentData } from '../services/canvasService';

interface UseCommentPanelProps {
  user: { uid: string; displayName?: string | null; email?: string | null } | null;
  addComment: (shapeId: string, text: string, userId: string, username: string) => Promise<string>;
  addReply: (commentId: string, userId: string, username: string, text: string) => Promise<void>;
  resolveComment: (commentId: string, userId: string) => Promise<void>;
  deleteComment: (commentId: string, userId: string) => Promise<void>;
  deleteReply: (commentId: string, replyIndex: number, userId: string) => Promise<void>;
  markRepliesAsRead: (commentId: string, userId: string) => Promise<void>;
  comments: CommentData[];
}

export function useCommentPanel(props: UseCommentPanelProps) {
  const {
    user,
    addComment,
    addReply,
    resolveComment,
    deleteComment,
    deleteReply,
    markRepliesAsRead,
    comments,
  } = props;

  const [openCommentPanelShapeId, setOpenCommentPanelShapeId] = useState<string | null>(null);

  // Helper function to mark all replies as read for a specific shape
  const markRepliesAsReadForShape = async (shapeId: string) => {
    if (!user) return;
    
    const shapeComments = comments.filter(
      c => c.shapeId === shapeId && c.userId === user.uid
    );
    
    for (const comment of shapeComments) {
      try {
        await markRepliesAsRead(comment.id, user.uid);
      } catch (error) {
        console.error('Error marking replies as read:', error);
      }
    }
  };

  const handleCommentIndicatorClick = async (shapeId: string) => {
    setOpenCommentPanelShapeId(shapeId);
  };

  const handleCommentPanelClose = async () => {
    // Mark all comments on this shape as read when closing the panel
    if (user && openCommentPanelShapeId) {
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    }
    
    setOpenCommentPanelShapeId(null);
  };

  const handleAddComment = async (text: string) => {
    if (!user || !openCommentPanelShapeId) return;
    
    try {
      await addComment(
        openCommentPanelShapeId,
        text,
        user.uid,
        user.displayName || user.email || 'Anonymous'
      );
      toast.success('Comment added');
      
      // Mark replies as read after user takes action
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleAddReply = async (commentId: string, text: string) => {
    if (!user || !openCommentPanelShapeId) return;
    
    try {
      await addReply(
        commentId,
        user.uid,
        user.displayName || user.email || 'Anonymous',
        text
      );
      toast.success('Reply added');
      
      // Mark replies as read after user takes action
      await markRepliesAsReadForShape(openCommentPanelShapeId);
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  const handleResolveComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await resolveComment(commentId, user.uid);
      toast.success('Comment resolved');
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await deleteComment(commentId, user.uid);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const handleDeleteReply = async (commentId: string, replyIndex: number) => {
    if (!user) return;
    
    try {
      await deleteReply(commentId, replyIndex, user.uid);
      toast.success('Reply deleted');
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  };

  return {
    openCommentPanelShapeId,
    setOpenCommentPanelShapeId,
    handleCommentIndicatorClick,
    handleCommentPanelClose,
    handleAddComment,
    handleAddReply,
    handleResolveComment,
    handleDeleteComment,
    handleDeleteReply,
  };
}

