import React from 'react';
import type { ClippyAvatarProps } from './types';

/**
 * Clippy Avatar Component
 * Displays the Clippy assistant icon at different sizes
 */
const ClippyAvatar: React.FC<ClippyAvatarProps> = ({ size }) => {
  const dimensions = size === 'small' ? 32 : 64;

  return (
    <div
      className={`clippy-avatar clippy-avatar-${size}`}
      style={{
        width: `${dimensions}px`,
        height: `${dimensions}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* SVG Clippy Icon - Simple paperclip with googly eyes */}
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clippy assistant"
      >
        {/* Paperclip body */}
        <path
          d="M40 10 C50 10, 55 15, 55 25 L55 45 C55 52, 50 57, 43 57 C36 57, 31 52, 31 45 L31 20 C31 15, 33 12, 37 12 C41 12, 43 15, 43 20 L43 42"
          stroke="#4169E1"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M43 42 C43 45, 41 47, 37 47 C33 47, 31 45, 31 42"
          stroke="#4169E1"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left eye */}
        <circle cx="25" cy="20" r="6" fill="white" stroke="black" strokeWidth="1.5" />
        <circle cx="26" cy="20" r="3" fill="black" />
        {/* Right eye */}
        <circle cx="15" cy="25" r="5" fill="white" stroke="black" strokeWidth="1.5" />
        <circle cx="16" cy="25" r="2.5" fill="black" />
      </svg>
    </div>
  );
};

export default ClippyAvatar;

