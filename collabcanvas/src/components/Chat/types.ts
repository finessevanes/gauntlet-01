/**
 * Type definitions for the Clippy-style chat UI components
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
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

