import { useState, useEffect } from 'react';
import type { CommentData } from '../../services/canvasService';
import './ShapeCommentIndicator.css';

interface ShapeCommentIndicatorProps {
  shapeId: string;
  commentCount: number;
  onClick: () => void;
  comments: CommentData[];
  currentUserId: string;
}

export function ShapeCommentIndicator({ shapeId, commentCount, onClick, comments, currentUserId }: ShapeCommentIndicatorProps) {
  const [isNewComment, setIsNewComment] = useState(false);
  const [prevCount, setPrevCount] = useState(commentCount);

  // Detect when comment count increases to trigger animation
  useEffect(() => {
    if (commentCount > prevCount && prevCount > 0) {
      setIsNewComment(true);
      
      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setIsNewComment(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    setPrevCount(commentCount);
  }, [commentCount, prevCount]);

  // Check if there are unread replies for the current user
  const hasUnreadReplies = comments.some(comment => {
    // Only check comments that belong to this shape and where the current user is the author
    if (comment.shapeId !== shapeId || comment.userId !== currentUserId) {
      return false;
    }
    
    // Check if there are replies and if they haven't been read
    if (!comment.replies || comment.replies.length === 0) {
      return false;
    }
    
    // Check if there are any replies from OTHER users (not from the comment author themselves)
    const hasRepliesFromOthers = comment.replies.some(reply => reply.userId !== currentUserId);
    if (!hasRepliesFromOthers) {
      return false; // Only own replies, don't show notification
    }
    
    // If there's a lastReplyAt timestamp
    if (comment.lastReplyAt) {
      const lastReadTimestamp = comment.replyReadStatus?.[currentUserId];
      
      // If user has never read replies, or last read was before last reply
      if (!lastReadTimestamp) {
        return true;
      }
      
      // Compare timestamps - convert to milliseconds for comparison
      const lastReadMs = lastReadTimestamp.toMillis ? lastReadTimestamp.toMillis() : lastReadTimestamp.seconds * 1000;
      const lastReplyMs = comment.lastReplyAt.toMillis ? comment.lastReplyAt.toMillis() : comment.lastReplyAt.seconds * 1000;
      
      return lastReplyMs > lastReadMs;
    }
    
    return false;
  });

  if (commentCount === 0) {
    return null;
  }

  return (
    <div
      className={`comment-indicator ${isNewComment ? 'pulse' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${commentCount} unresolved comment${commentCount > 1 ? 's' : ''}${hasUnreadReplies ? ' (new replies)' : ''}`}
    >
      <span className="comment-icon">💬</span>
      <span className="comment-count">{commentCount}</span>
      {hasUnreadReplies && <span className="comment-notification-badge" />}
    </div>
  );
}

