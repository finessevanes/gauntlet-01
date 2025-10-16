import { useState } from 'react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { ALLOWED_FONT_SIZES } from '../../utils/helpers';
import type { ShapeData } from '../../services/canvasService';

interface Tool {
  id: string;
  icon: string;
  name: string;
  active: boolean;
}

interface ToolPaletteProps {
  selectedShape: ShapeData | null;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onChangeFontSize?: (size: number) => void;
  textFormattingDisabled?: boolean;
}

export default function ToolPalette({ 
  selectedShape,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onChangeFontSize,
  textFormattingDisabled = false
}: ToolPaletteProps) {
  const { 
    selectedTool, 
    setSelectedTool,
    setIsDrawMode, 
    setIsBombMode, 
    selectedColor 
  } = useCanvasContext();
  
  const [isChanging, setIsChanging] = useState(false);

  const tools: Tool[] = [
    { id: 'pan', icon: '✋', name: 'Pan / Move Canvas', active: selectedTool === 'pan' },
    { id: 'rectangle', icon: '⬜', name: 'Rectangle / Draw', active: selectedTool === 'rectangle' },
    { id: 'text', icon: 'T', name: 'Text Tool', active: selectedTool === 'text' },
    { id: 'bomb', icon: '💣', name: 'Bomb / Clear Canvas', active: selectedTool === 'bomb' },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === 'rectangle') {
      setSelectedTool('rectangle');
      setIsDrawMode(true);
      setIsBombMode(false);
    } else if (toolId === 'pan') {
      setSelectedTool('pan');
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'text') {
      setSelectedTool('text');
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'bomb') {
      setSelectedTool('bomb');
      setIsDrawMode(false);
      setIsBombMode(true);
    }
  };

  const handleFormatClick = async (callback?: () => void) => {
    if (!callback || textFormattingDisabled || isChanging) return;
    setIsChanging(true);
    try {
      await callback();
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  const handleFontSizeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChangeFontSize || textFormattingDisabled || isChanging) return;
    const size = parseInt(e.target.value, 10);
    setIsChanging(true);
    try {
      await onChangeFontSize(size);
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  // Check if we should show text formatting controls
  const showTextControls = selectedShape?.type === 'text';
  const isBold = selectedShape?.fontWeight === 'bold';
  const isItalic = selectedShape?.fontStyle === 'italic';
  const isUnderline = selectedShape?.textDecoration === 'underline';
  const currentFontSize = selectedShape?.fontSize || 16;

  return (
    <div style={styles.palette}>
      <div style={styles.toolGrid}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            style={{
              ...styles.toolButton,
              ...(tool.active ? styles.activeTool : {}),
              ...(tool.id === 'text' ? styles.textIcon : {}),
            }}
            title={tool.name}
            aria-label={tool.name}
          >
            {tool.id === 'rectangle' ? (
              <div style={styles.rectangleIcon} />
            ) : (
              tool.icon
            )}
          </button>
        ))}
      </div>
      
      {/* Current Colors Display */}
      <div style={styles.colorDisplay}>
        <div style={styles.colorSquares}>
          {/* Primary and secondary color overlapping squares (Paint style) */}
          <div style={{ position: 'relative', width: '50px', height: '50px' }}>
            <div style={{
              ...styles.primaryColor,
              backgroundColor: selectedColor,
            }} />
            <div style={{
              ...styles.secondaryColor,
              backgroundColor: '#ffffff',
            }} />
          </div>
        </div>
      </div>

      {/* Text Formatting Controls - shown when a text shape is selected */}
      {showTextControls && (
        <div style={styles.textFormattingSection}>
          {/* Bold, Italic, Underline buttons */}
          <div style={styles.formatButtonGroup}>
            <button
              onClick={() => handleFormatClick(onToggleBold)}
              disabled={textFormattingDisabled || isChanging}
              style={{
                ...styles.formatButton,
                ...(isBold ? styles.activeFormatButton : {}),
                ...(textFormattingDisabled ? styles.disabledButton : {}),
              }}
              title="Bold"
            >
              <span style={{ 
                fontWeight: 'bold',
                color: isBold ? '#ffffff' : (textFormattingDisabled ? '#a0a0a0' : '#000000')
              }}>
                B
              </span>
            </button>

            <button
              onClick={() => handleFormatClick(onToggleItalic)}
              disabled={textFormattingDisabled || isChanging}
              style={{
                ...styles.formatButton,
                ...(isItalic ? styles.activeFormatButton : {}),
                ...(textFormattingDisabled ? styles.disabledButton : {}),
              }}
              title="Italic"
            >
              <span style={{ 
                fontStyle: 'italic',
                color: isItalic ? '#ffffff' : (textFormattingDisabled ? '#a0a0a0' : '#000000')
              }}>
                I
              </span>
            </button>

            <button
              onClick={() => handleFormatClick(onToggleUnderline)}
              disabled={textFormattingDisabled || isChanging}
              style={{
                ...styles.formatButton,
                ...(isUnderline ? styles.activeFormatButton : {}),
                ...(textFormattingDisabled ? styles.disabledButton : {}),
              }}
              title="Underline"
            >
              <span style={{ 
                textDecoration: 'underline',
                color: isUnderline ? '#ffffff' : (textFormattingDisabled ? '#a0a0a0' : '#000000')
              }}>
                U
              </span>
            </button>
          </div>

          {/* Font Size Dropdown */}
          <div style={styles.fontSizeSection}>
            <label style={styles.fontSizeLabel}>Size</label>
            <select
              value={currentFontSize}
              onChange={handleFontSizeChange}
              disabled={textFormattingDisabled || isChanging}
              style={{
                ...styles.fontSizeSelect,
                ...(textFormattingDisabled ? styles.disabledSelect : {}),
              }}
              title="Font Size"
            >
              {ALLOWED_FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  palette: {
    position: 'fixed' as const,
    left: 0,
    top: '67px', // Below title bar + menu bar
    width: '70px',
    backgroundColor: '#f0f0f0',
    borderRight: '1px solid #c0c0c0',
    borderBottom: '1px solid #c0c0c0',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 900,
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  toolGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  toolButton: {
    width: '54px',
    height: '54px',
    backgroundColor: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    padding: 0,
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    borderRadius: '3px',
    fontWeight: 'bold' as const,
  },
  rectangleIcon: {
    width: '32px',
    height: '24px',
    backgroundColor: 'transparent',
    border: '2px dashed #000000',
    boxSizing: 'border-box' as const,
  },
  textIcon: {
    fontFamily: 'serif',
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  activeTool: {
    backgroundColor: '#c0c0c0',
    boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff',
  },
  colorDisplay: {
    marginTop: '8px',
    padding: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)',
  },
  colorSquares: {
    display: 'flex',
    justifyContent: 'center',
  },
  primaryColor: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '34px',
    height: '34px',
    border: '2px solid #000000',
    boxShadow: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.2)',
  },
  secondaryColor: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: '34px',
    height: '34px',
    border: '2px solid #000000',
    boxShadow: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.2)',
  },
  textFormattingSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #a0a0a0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  formatButtonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  formatButton: {
    width: '54px',
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
  activeFormatButton: {
    backgroundColor: '#0066cc',
    boxShadow: 'inset 2px 2px 3px rgba(0,0,0,0.3), inset -1px -1px 0 rgba(255,255,255,0.2)',
    border: '1px solid #004499',
  },
  disabledButton: {
    backgroundColor: '#e8e8e8',
    color: '#a0a0a0',
    cursor: 'not-allowed',
  },
  fontSizeSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  fontSizeLabel: {
    fontSize: '9px',
    fontWeight: 'bold' as const,
    color: '#555',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  fontSizeSelect: {
    width: '54px',
    padding: '5px 4px',
    fontSize: '11px',
    fontWeight: 'bold' as const,
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

