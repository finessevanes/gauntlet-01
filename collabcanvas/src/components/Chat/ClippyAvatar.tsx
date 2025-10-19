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
      {/* SVG Clippy Icon - Classic Microsoft Office assistant style */}
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clippy assistant"
      >
        {/* Paperclip body - outer loop */}
        <path
          d="M 45 8 C 54 8, 58 12, 58 20 L 58 42 C 58 52, 52 58, 44 58 C 36 58, 30 52, 30 42 L 30 18"
          stroke="#1E40AF"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Paperclip body - inner loop */}
        <path
          d="M 30 18 C 30 12, 34 8, 40 8 C 46 8, 50 12, 50 18 L 50 40 C 50 45, 47 48, 43 48 C 39 48, 36 45, 36 40"
          stroke="#3B82F6"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Highlight/shine on outer loop */}
        <path
          d="M 48 12 C 52 12, 54 14, 54 18 L 54 38"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Highlight/shine on inner loop */}
        <path
          d="M 34 14 C 36 12, 38 11, 40 11 C 43 11, 45 13, 45 16 L 45 35"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Left eye (larger, more expressive) */}
        <circle cx="50" cy="24" r="7" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="51" cy="24" r="4" fill="black" />
        <circle cx="52.5" cy="22" r="1.5" fill="white" opacity="0.9" />
        {/* Right eye */}
        <circle cx="40" cy="28" r="6" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="41" cy="28" r="3.5" fill="black" />
        <circle cx="42.5" cy="26.5" r="1.2" fill="white" opacity="0.9" />
        {/* Eyebrows for expression */}
        <path
          d="M 47 18 Q 50 16, 53 18"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 37 22 Q 40 20, 43 22"
          stroke="black"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small smile/mouth curve */}
        <path
          d="M 42 34 Q 44 36, 46 34"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export default ClippyAvatar;

