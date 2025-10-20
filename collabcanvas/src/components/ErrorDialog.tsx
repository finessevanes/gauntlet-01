import React from 'react';
import './ErrorDialog.css';

interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ message, onClose }) => {
  return (
    <div className="error-dialog-overlay">
      <div className="error-dialog-window">
        <div className="error-dialog-titlebar">
          <div className="error-dialog-title">
            <span className="error-dialog-icon">✕</span>
            Error
          </div>
          <button className="error-dialog-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="error-dialog-content">
          <div className="error-dialog-icon-large">✕</div>
          <div className="error-dialog-message">{message}</div>
        </div>
        <div className="error-dialog-footer">
          <button className="error-dialog-ok-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

