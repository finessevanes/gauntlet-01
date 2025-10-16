import { useState } from 'react';
import type { ShapeData } from '../../services/canvasService';
import { ALLOWED_FONT_SIZES } from '../../utils/helpers';

interface TextControlsProps {
  selectedShape: ShapeData | null;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onChangeFontSize: (size: number) => void;
  disabled?: boolean;
}

export default function TextControls({
  selectedShape,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onChangeFontSize,
  disabled = false,
}: TextControlsProps) {
  const [isChanging, setIsChanging] = useState(false);

  if (!selectedShape || selectedShape.type !== 'text') {
    return null;
  }

  const isBold = selectedShape.fontWeight === 'bold';
  const isItalic = selectedShape.fontStyle === 'italic';
  const isUnderline = selectedShape.textDecoration === 'underline';
  const currentFontSize = selectedShape.fontSize || 16;

  const handleFormatClick = async (callback: () => void) => {
    if (disabled || isChanging) return;
    setIsChanging(true);
    try {
      await callback();
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  const handleFontSizeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled || isChanging) return;
    const size = parseInt(e.target.value, 10);
    setIsChanging(true);
    try {
      await onChangeFontSize(size);
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <label style={styles.label}>Text Formatting</label>
        
        <div style={styles.buttonGroup}>
          {/* Bold Button */}
          <button
            onClick={() => handleFormatClick(onToggleBold)}
            disabled={disabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isBold ? styles.activeButton : {}),
              ...(disabled ? styles.disabledButton : {}),
            }}
            title="Bold"
          >
            <span style={{ fontWeight: 'bold' }}>B</span>
          </button>

          {/* Italic Button */}
          <button
            onClick={() => handleFormatClick(onToggleItalic)}
            disabled={disabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isItalic ? styles.activeButton : {}),
              ...(disabled ? styles.disabledButton : {}),
            }}
            title="Italic"
          >
            <span style={{ fontStyle: 'italic' }}>I</span>
          </button>

          {/* Underline Button */}
          <button
            onClick={() => handleFormatClick(onToggleUnderline)}
            disabled={disabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isUnderline ? styles.activeButton : {}),
              ...(disabled ? styles.disabledButton : {}),
            }}
            title="Underline"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Font Size</label>
        <select
          value={currentFontSize}
          onChange={handleFontSizeChange}
          disabled={disabled || isChanging}
          style={{
            ...styles.select,
            ...(disabled ? styles.disabledSelect : {}),
          }}
        >
          {ALLOWED_FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#f0f0f0',
    borderTop: '1px solid #c0c0c0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 'bold' as const,
    color: '#333',
    textTransform: 'uppercase' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: '4px',
  },
  formatButton: {
    width: '32px',
    height: '32px',
    backgroundColor: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    padding: 0,
    borderRadius: '3px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    transition: 'none',
  },
  activeButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    boxShadow: 'inset 1px 1px 0 0 #2563eb, inset -1px -1px 0 0 #60a5fa',
  },
  disabledButton: {
    backgroundColor: '#e8e8e8',
    color: '#a0a0a0',
    cursor: 'not-allowed',
  },
  select: {
    padding: '6px 8px',
    fontSize: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #808080',
    borderRadius: '3px',
    cursor: 'pointer',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
  },
  disabledSelect: {
    backgroundColor: '#e8e8e8',
    color: '#a0a0a0',
    cursor: 'not-allowed',
  },
};

