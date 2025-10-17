import { useState, useEffect } from 'react';
import './ShapeCommentIndicator.css';

interface ShapeCommentIndicatorProps {
  shapeId: string;
  commentCount: number;
  onClick: () => void;
}

export function ShapeCommentIndicator({ shapeId, commentCount, onClick }: ShapeCommentIndicatorProps) {
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
      title={`${commentCount} unresolved comment${commentCount > 1 ? 's' : ''}`}
    >
      <span className="comment-icon">💬</span>
      <span className="comment-count">{commentCount}</span>
    </div>
  );
}

