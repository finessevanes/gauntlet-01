import { useState, useRef, useEffect } from 'react';
import type { CommentData } from '../../services/canvasService';
import { useAuth } from '../../hooks/useAuth';
import './CommentPanel.css';

interface CommentPanelProps {
  shapeId: string;
  comments: CommentData[];
  onClose: () => void;
  position: { x: number; y: number };
  onAddComment: (text: string) => Promise<void>;
  onAddReply: (commentId: string, text: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onDeleteReply: (commentId: string, replyIndex: number) => Promise<void>;
}

export function CommentPanel({
  shapeId,
  comments,
  onClose,
  position,
  onAddComment,
  onAddReply,
  onResolve,
  onDelete,
  onDeleteReply,
}: CommentPanelProps) {
  const { user } = useAuth();
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panelPosition, setPanelPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Filter comments for this shape
  const shapeComments = comments.filter(c => c.shapeId === shapeId);
  
  // Separate unresolved and resolved comments
  const unresolvedComments = shapeComments.filter(c => !c.resolved);
  const resolvedComments = shapeComments.filter(c => c.resolved);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPanelPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Prevent space bar from triggering canvas panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target instanceof HTMLTextAreaElement) {
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newCommentText.trim());
      setNewCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddReply(commentId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onResolve(commentId);
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (isSubmitting) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onDelete(commentId);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'Failed to delete comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (commentId: string, replyIndex: number) => {
    if (isSubmitting) return;
    
    if (!confirm('Are you sure you want to delete this reply?')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onDeleteReply(commentId, replyIndex);
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      alert(error.message || 'Failed to delete reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="comment-panel-backdrop" onClick={onClose} />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className="comment-panel"
        style={{
          left: `${panelPosition.x + 20}px`,
          top: `${panelPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="comment-panel-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="comment-panel-title">💬 Comments</span>
          <button
            className="comment-panel-close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* New Comment Input */}
        <div className="comment-panel-new">
          <textarea
            className="comment-input"
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            disabled={isSubmitting}
          />
          <button
            className="comment-submit-btn"
            onClick={handleAddComment}
            disabled={!newCommentText.trim() || isSubmitting}
          >
            Add Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="comment-panel-list">
          {unresolvedComments.length === 0 && resolvedComments.length === 0 && (
            <div className="comment-empty">No comments yet. Be the first to comment!</div>
          )}

          {/* Unresolved Comments */}
          {unresolvedComments.map((comment) => (
            <div key={comment.id} className="comment-thread">
              <div className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.username}</span>
                  <span className="comment-time">{formatTimestamp(comment.createdAt)}</span>
                </div>
                <div className="comment-text">{comment.text}</div>
                
                {/* Comment Actions */}
                <div className="comment-actions">
                  <button
                    className="comment-action-btn"
                    onClick={() => setReplyingTo(comment.id)}
                    disabled={isSubmitting}
                  >
                    Reply
                  </button>
                  
                  {user && (user.uid === comment.userId) && (
                    <>
                      <button
                        className="comment-action-btn"
                        onClick={() => handleResolve(comment.id)}
                        disabled={isSubmitting}
                      >
                        ✓ Resolve
                      </button>
                      <button
                        className="comment-action-btn comment-delete-btn"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isSubmitting}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="comment-replies">
                    {comment.replies.map((reply, idx) => {
                      // Check if this reply is new (unread) for the comment author
                      // Don't show NEW badge for user's own replies
                      const isNewReply = user && comment.userId === user.uid && reply.userId !== user.uid && (() => {
                        if (!reply.createdAt) return false;
                        
                        const lastReadTimestamp = comment.replyReadStatus?.[user.uid];
                        if (!lastReadTimestamp) return true; // Never read
                        
                        // Compare timestamps
                        const lastReadMs = lastReadTimestamp.toMillis ? lastReadTimestamp.toMillis() : lastReadTimestamp.seconds * 1000;
                        const replyMs = reply.createdAt.toMillis ? reply.createdAt.toMillis() : reply.createdAt.seconds * 1000;
                        
                        return replyMs > lastReadMs;
                      })();
                      
                      return (
                        <div key={idx} className="comment-reply">
                          <div className="comment-header">
                            <span className="comment-author">{reply.username}</span>
                            <span className="comment-time">{formatTimestamp(reply.createdAt)}</span>
                            {isNewReply && <span className="comment-new-badge">NEW</span>}
                          </div>
                          <div className="comment-text">{reply.text}</div>
                          {/* Delete button for reply author */}
                          {user && (user.uid === reply.userId) && (
                            <div className="comment-actions">
                              <button
                                className="comment-action-btn comment-delete-btn"
                                onClick={() => handleDeleteReply(comment.id, idx)}
                                disabled={isSubmitting}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="comment-reply-input">
                    <textarea
                      className="comment-input"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddReply(comment.id);
                        }
                        if (e.key === 'Escape') {
                          setReplyingTo(null);
                          setReplyText('');
                        }
                      }}
                      autoFocus
                      disabled={isSubmitting}
                    />
                    <div className="comment-reply-actions">
                      <button
                        className="comment-submit-btn"
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        Reply
                      </button>
                      <button
                        className="comment-cancel-btn"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Show Resolved Toggle */}
          {resolvedComments.length > 0 && (
            <div className="comment-resolved-toggle">
              <button
                className="comment-toggle-btn"
                onClick={() => setShowResolved(!showResolved)}
              >
                {showResolved ? '▼' : '▶'} Show resolved ({resolvedComments.length})
              </button>
            </div>
          )}

          {/* Resolved Comments */}
          {showResolved && resolvedComments.map((comment) => (
            <div key={comment.id} className="comment-thread comment-resolved">
              <div className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.username}</span>
                  <span className="comment-time">{formatTimestamp(comment.createdAt)}</span>
                  <span className="comment-resolved-badge">✓ Resolved</span>
                </div>
                <div className="comment-text comment-text-resolved">{comment.text}</div>
                
                {/* Replies in resolved comments */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="comment-replies">
                    {comment.replies.map((reply, idx) => {
                      // Check if this reply is new (unread) for the comment author (even in resolved comments)
                      // Don't show NEW badge for user's own replies
                      const isNewReply = user && comment.userId === user.uid && reply.userId !== user.uid && (() => {
                        if (!reply.createdAt) return false;
                        
                        const lastReadTimestamp = comment.replyReadStatus?.[user.uid];
                        if (!lastReadTimestamp) return true; // Never read
                        
                        // Compare timestamps
                        const lastReadMs = lastReadTimestamp.toMillis ? lastReadTimestamp.toMillis() : lastReadTimestamp.seconds * 1000;
                        const replyMs = reply.createdAt.toMillis ? reply.createdAt.toMillis() : reply.createdAt.seconds * 1000;
                        
                        return replyMs > lastReadMs;
                      })();
                      
                      return (
                        <div key={idx} className="comment-reply">
                          <div className="comment-header">
                            <span className="comment-author">{reply.username}</span>
                            <span className="comment-time">{formatTimestamp(reply.createdAt)}</span>
                            {isNewReply && <span className="comment-new-badge">NEW</span>}
                          </div>
                          <div className="comment-text comment-text-resolved">{reply.text}</div>
                          {/* Delete button for reply author */}
                          {user && (user.uid === reply.userId) && (
                            <div className="comment-actions">
                              <button
                                className="comment-action-btn comment-delete-btn"
                                onClick={() => handleDeleteReply(comment.id, idx)}
                                disabled={isSubmitting}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

