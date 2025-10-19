/**
 * Type definitions for the Clippy-style chat UI components
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Input for saving messages to Firestore (before document creation)
 */
export interface ChatMessageInput {
  canvasId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export interface ChatTriggerButtonProps {
  onClick: () => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
}

export interface ClippyAvatarProps {
  size: 'small' | 'large';
}

