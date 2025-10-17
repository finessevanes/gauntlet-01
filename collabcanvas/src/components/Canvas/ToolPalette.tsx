import { useState } from 'react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import type { ShapeData } from '../../services/canvasService';

// Text formatting constants (for legacy text shapes)
const ALLOWED_FONT_SIZES = [12, 14, 16, 18, 20, 24, 32, 48];

interface Tool {
  id: string;
  icon: string;
  name: string;
  active: boolean;
}

interface ToolPaletteProps {
  selectedShape: ShapeData | null;
  selectedShapes?: string[];
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onChangeFontSize?: (size: number) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onAddComment?: () => void;
  textFormattingDisabled?: boolean;
}

export default function ToolPalette({ 
  selectedShape,
  selectedShapes = [],
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onChangeFontSize,
  onDelete,
  onDuplicate,
  onGroup,
  onUngroup,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onAddComment,
  textFormattingDisabled = false
}: ToolPaletteProps) {
  const { 
    activeTool, 
    setActiveTool,
    setIsDrawMode, 
    setIsBombMode, 
    selectedColor,
    shapes,
    isAlignmentToolbarMinimized,
    setIsAlignmentToolbarMinimized
  } = useCanvasContext();
  
  const [isChanging, setIsChanging] = useState(false);

  const tools: Tool[] = [
    { id: 'select', icon: '➤', name: 'Select / Move Objects', active: activeTool === 'select' },
    { id: 'pan', icon: '✋', name: 'Pan / Move Canvas', active: activeTool === 'pan' },
    { id: 'rectangle', icon: '⬜', name: 'Rectangle', active: activeTool === 'rectangle' },
    { id: 'circle', icon: '⭕', name: 'Circle', active: activeTool === 'circle' },
    { id: 'triangle', icon: '△', name: 'Triangle', active: activeTool === 'triangle' },
    { id: 'text', icon: 'T', name: 'Text Tool', active: activeTool === 'text' },
    { id: 'bomb', icon: '💣', name: 'Bomb / Clear Canvas', active: activeTool === 'bomb' },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === 'select') {
      setActiveTool('select');
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'rectangle') {
      setActiveTool('rectangle');
      setIsDrawMode(true);
      setIsBombMode(false);
    } else if (toolId === 'circle') {
      setActiveTool('circle');
      setIsDrawMode(true);
      setIsBombMode(false);
    } else if (toolId === 'triangle') {
      setActiveTool('triangle');
      setIsDrawMode(true);
      setIsBombMode(false);
    } else if (toolId === 'pan') {
      setActiveTool('pan');
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'text') {
      setActiveTool('text');
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'bomb') {
      setActiveTool('bomb');
      setIsDrawMode(false);
      setIsBombMode(true);
    }
  };

  const handleFormatClick = async (callback?: () => void) => {
    if (!callback || textControlsDisabled || isChanging) return;
    setIsChanging(true);
    try {
      await callback();
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  const handleFontSizeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChangeFontSize || textControlsDisabled || isChanging) return;
    const size = parseInt(e.target.value, 10);
    
    // Validate: must be a number between 1 and 500
    if (isNaN(size) || size < 1 || size > 500) {
      return;
    }
    
    setIsChanging(true);
    try {
      await onChangeFontSize(size);
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  const handleFontSizeSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChangeFontSize || textControlsDisabled || isChanging) return;
    const value = e.target.value;
    
    // If "custom" is selected, do nothing (keep current value)
    if (value === 'custom') {
      return;
    }
    
    const size = parseInt(value, 10);
    
    if (isNaN(size)) return;
    
    setIsChanging(true);
    try {
      await onChangeFontSize(size);
    } finally {
      setTimeout(() => setIsChanging(false), 100);
    }
  };

  // Check if a text shape is selected to enable text formatting controls
  const isTextSelected = selectedShape?.type === 'text';
  const isBold = selectedShape?.fontWeight === 'bold';
  const isItalic = selectedShape?.fontStyle === 'italic';
  const isUnderline = selectedShape?.textDecoration === 'underline';
  
  // Get current font size, ensuring it's a valid number
  let currentFontSize = 16; // default
  if (isTextSelected && selectedShape?.fontSize !== undefined) {
    currentFontSize = selectedShape.fontSize;
  }
  
  // Debug: Log the selected shape data
  if (isTextSelected) {
    console.log('📊 ToolPalette - Selected shape:', {
      id: selectedShape?.id,
      type: selectedShape?.type,
      fontSize: selectedShape?.fontSize,
      currentFontSize,
      text: selectedShape?.text,
      fullShape: selectedShape
    });
  }
  
  // Disable text controls when no text is selected OR when already disabled
  const textControlsDisabled = !isTextSelected || textFormattingDisabled;

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
            ) : tool.id === 'circle' ? (
              <div style={styles.circleIcon} />
            ) : tool.id === 'triangle' ? (
              <div style={styles.triangleIcon} />
            ) : (
              tool.icon
            )}
          </button>
        ))}
        
        {/* Alignment Tools Icon - shown when toolbar is minimized and 2+ shapes selected */}
        {isAlignmentToolbarMinimized && selectedShapes.length >= 2 && (
          <button
            onClick={() => setIsAlignmentToolbarMinimized(false)}
            style={{
              ...styles.toolButton,
              backgroundColor: '#d0d0d0',
            }}
            title="Show Alignment Tools"
            aria-label="Show Alignment Tools"
          >
            ⚏
          </button>
        )}
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

      {/* Shape Actions Section - Delete and Duplicate */}
      <div style={styles.shapeActionsSection}>
        <button
          onClick={onDuplicate}
          disabled={(!selectedShape && selectedShapes.length === 0) || isChanging}
          style={{
            ...styles.actionButton,
            ...(!selectedShape && selectedShapes.length === 0 ? styles.disabledButton : {}),
          }}
          title={
            selectedShapes.length > 1 
              ? `Duplicate ${selectedShapes.length} shapes (⌘D / Ctrl+D)` 
              : selectedShape 
              ? "Duplicate (⌘D / Ctrl+D)" 
              : "Duplicate (select a shape first)"
          }
        >
          <span style={{ 
            fontSize: '20px',
            color: (!selectedShape && selectedShapes.length === 0) ? '#a0a0a0' : '#000000'
          }}>
            📋
          </span>
        </button>

        <button
          onClick={onDelete}
          disabled={(!selectedShape && selectedShapes.length === 0) || isChanging}
          style={{
            ...styles.actionButton,
            ...(!selectedShape && selectedShapes.length === 0 ? styles.disabledButton : {}),
          }}
          title={
            selectedShapes.length > 1 
              ? `Delete ${selectedShapes.length} shapes (Del)` 
              : selectedShape 
              ? "Delete (Del)" 
              : "Delete (select a shape first)"
          }
        >
          <span style={{ 
            fontSize: '20px',
            color: (!selectedShape && selectedShapes.length === 0) ? '#a0a0a0' : '#000000'
          }}>
            🗑️
          </span>
        </button>
      </div>

      {/* Add Comment Button - shown when single shape is selected */}
      {selectedShape && selectedShapes.length <= 1 && (
        <div style={styles.fullWidthSection}>
          <button
            onClick={onAddComment}
            disabled={isChanging}
            style={styles.fullWidthButton}
            title="Add Comment to Shape"
          >
            <span style={{ fontSize: '20px' }}>💬</span>
            <span style={{ fontSize: '11px', marginLeft: '4px' }}>Comment</span>
          </button>
        </div>
      )}

      {/* Grouping Controls */}
      {(() => {
        const hasGroupedShapes = selectedShapes.length > 0 && shapes.filter(s => selectedShapes.includes(s.id)).some(s => s.groupId);
        const canGroup = selectedShapes.length >= 2 && !hasGroupedShapes;
        
        if (!hasGroupedShapes && !canGroup) return null;
        
        return (
          <div style={styles.shapeActionsSection}>
            {/* Group Button - shown as selected (blue) when shapes are grouped */}
            {hasGroupedShapes ? (
              <button
                disabled
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#0066cc',
                  color: '#ffffff',
                  boxShadow: 'inset 1px 1px 0 0 #004499, inset -1px -1px 0 0 #0088ff',
                  cursor: 'default',
                }}
                title="Shapes are grouped"
              >
                <span style={{ fontSize: '18px' }}>
                  🔒
                </span>
              </button>
            ) : (
              <button
                onClick={onGroup}
                disabled={isChanging}
                style={{
                  ...styles.actionButton,
                }}
                title={`Group ${selectedShapes.length} shapes (⌘G / Ctrl+G)`}
              >
                <span style={{ fontSize: '18px' }}>
                  🔒
                </span>
              </button>
            )}
            
            {/* Ungroup Button - only show when shapes are grouped */}
            {hasGroupedShapes && (
              <button
                onClick={onUngroup}
                disabled={isChanging}
                style={{
                  ...styles.actionButton,
                }}
                title="Ungroup shapes (⌘⇧G / Ctrl+Shift+G)"
              >
                <span style={{ fontSize: '18px' }}>
                  🔓
                </span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Z-Index Controls - show when shape(s) are selected */}
      {(selectedShape || selectedShapes.length > 0) && (
        <div style={styles.layerSection}>
          <div style={styles.layerLabel}>Layer Order</div>
          {/* Row 1: To Front and To Back */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              onClick={onBringToFront}
              disabled={isChanging}
              style={{
                ...styles.zIndexButton,
              }}
              title="Bring to Front (⌘⇧] / Ctrl+Shift+])"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '16px' }}>⬆️</span>
                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Front</span>
              </div>
            </button>
            <button
              onClick={onSendToBack}
              disabled={isChanging}
              style={{
                ...styles.zIndexButton,
              }}
              title="Send to Back (⌘⇧[ / Ctrl+Shift+[)"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '16px' }}>⬇️</span>
                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Back</span>
              </div>
            </button>
          </div>
          {/* Row 2: Forward and Backward */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              onClick={onBringForward}
              disabled={isChanging}
              style={{
                ...styles.zIndexButton,
              }}
              title="Bring Forward (⌘] / Ctrl+])"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '16px' }}>⬆️</span>
                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>+1</span>
              </div>
            </button>
            <button
              onClick={onSendBackward}
              disabled={isChanging}
              style={{
                ...styles.zIndexButton,
              }}
              title="Send Backward (⌘[ / Ctrl+[)"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '16px' }}>⬇️</span>
                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>-1</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Text Formatting Controls - always visible, disabled when no text is selected */}
      <div style={styles.textFormattingSection}>
        {/* Bold, Italic, Underline buttons */}
        <div style={styles.formatButtonGroup}>
          <button
            onClick={() => handleFormatClick(onToggleBold)}
            disabled={textControlsDisabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isBold && isTextSelected ? styles.activeFormatButton : {}),
              ...(textControlsDisabled ? styles.disabledButton : {}),
            }}
            title={isTextSelected ? "Bold" : "Bold (select text first)"}
          >
            <span style={{ 
              fontWeight: 'bold',
              color: isBold && isTextSelected ? '#ffffff' : (textControlsDisabled ? '#a0a0a0' : '#000000')
            }}>
              B
            </span>
          </button>

          <button
            onClick={() => handleFormatClick(onToggleItalic)}
            disabled={textControlsDisabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isItalic && isTextSelected ? styles.activeFormatButton : {}),
              ...(textControlsDisabled ? styles.disabledButton : {}),
            }}
            title={isTextSelected ? "Italic" : "Italic (select text first)"}
          >
            <span style={{ 
              fontStyle: 'italic',
              color: isItalic && isTextSelected ? '#ffffff' : (textControlsDisabled ? '#a0a0a0' : '#000000')
            }}>
              I
            </span>
          </button>

          <button
            onClick={() => handleFormatClick(onToggleUnderline)}
            disabled={textControlsDisabled || isChanging}
            style={{
              ...styles.formatButton,
              ...(isUnderline && isTextSelected ? styles.activeFormatButton : {}),
              ...(textControlsDisabled ? styles.disabledButton : {}),
            }}
            title={isTextSelected ? "Underline" : "Underline (select text first)"}
          >
            <span style={{ 
              textDecoration: 'underline',
              color: isUnderline && isTextSelected ? '#ffffff' : (textControlsDisabled ? '#a0a0a0' : '#000000')
            }}>
              U
            </span>
          </button>
        </div>

        {/* Font Size Control - Combined */}
        <div style={styles.fontSizeSection}>
          <label style={{
            ...styles.fontSizeLabel,
            ...(textControlsDisabled ? { color: '#a0a0a0' } : {}),
          }}>Size</label>
          
          {/* Combined control with input and dropdown */}
          <div style={styles.fontSizeComboWrapper}>
            {/* Large input field for current size and custom entry */}
            <input
              type="number"
              value={currentFontSize}
              onChange={handleFontSizeChange}
              disabled={textControlsDisabled || isChanging}
              min={1}
              max={500}
              style={{
                ...styles.fontSizeComboInput,
                ...(textControlsDisabled ? styles.disabledInput : {}),
              }}
              title={isTextSelected ? "Type custom size (1-500px)" : "Font size (select text first)"}
              placeholder="16"
            />
            {/* Dropdown for preset sizes */}
            <select
              value={ALLOWED_FONT_SIZES.includes(currentFontSize) ? currentFontSize : 'custom'}
              onChange={handleFontSizeSelect}
              disabled={textControlsDisabled || isChanging}
              style={{
                ...styles.fontSizeComboSelect,
                ...(textControlsDisabled ? styles.disabledInput : {}),
              }}
              title={isTextSelected ? "Select preset size" : "Select font size (select text first)"}
            >
              {ALLOWED_FONT_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
              {!ALLOWED_FONT_SIZES.includes(currentFontSize) && (
                <option value="custom">{currentFontSize}</option>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  palette: {
    position: 'fixed' as const,
    left: 0,
    top: '67px', // Below title bar + menu bar
    width: '130px', // Wider to accommodate 2 columns
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two columns
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
  circleIcon: {
    width: '30px',
    height: '30px',
    backgroundColor: 'transparent',
    border: '2px dashed #000000',
    borderRadius: '50%',
    boxSizing: 'border-box' as const,
  },
  triangleIcon: {
    width: 0,
    height: 0,
    borderLeft: '16px solid transparent',
    borderRight: '16px solid transparent',
    borderBottom: '28px dashed #000000',
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
    padding: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)',
    display: 'flex',
    justifyContent: 'center',
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
  shapeActionsSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #a0a0a0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Two columns for actions (duplicate, delete)
    gap: '6px',
  },
  actionButton: {
    width: '100%',
    height: '40px',
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
  zIndexButton: {
    width: '54px',
    height: '48px',
    backgroundColor: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    padding: '4px',
    borderRadius: '3px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    transition: 'none',
  },
  layerSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #a0a0a0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  layerLabel: {
    fontSize: '11px',
    fontWeight: 'bold' as const,
    color: '#555',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    textAlign: 'center' as const,
    marginBottom: '4px',
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr', // Three buttons in a row
    gap: '4px',
  },
  formatButton: {
    width: '100%',
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
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#555',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  fontSizeComboWrapper: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '0',
    border: '2px solid #808080',
    borderRadius: '3px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
  },
  fontSizeComboInput: {
    flex: '1',
    padding: '8px 6px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#000000',
    backgroundColor: '#ffffff',
    border: 'none',
    cursor: 'text',
    textAlign: 'left' as const,
    outline: 'none',
    minWidth: '0', // Allow flex to shrink
  },
  fontSizeComboSelect: {
    flex: '0 0 24px', // Fixed width for dropdown button
    padding: '0',
    fontSize: '0', // Hide text
    color: 'transparent', // Make text invisible
    backgroundColor: '#d8d8d8',
    border: 'none',
    borderLeft: '1px solid #808080',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    // Draw down-pointing triangle
    backgroundImage: 'linear-gradient(45deg, transparent 50%, #000 50%), linear-gradient(135deg, #000 50%, transparent 50%)',
    backgroundPosition: 'calc(50% - 2px) calc(50% - 1px), calc(50% + 2px) calc(50% - 1px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  disabledInput: {
    backgroundColor: '#e8e8e8',
    color: '#a0a0a0',
    cursor: 'not-allowed',
  },
  fullWidthSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #a0a0a0',
    display: 'flex',
    width: '100%',
  },
  fullWidthButton: {
    width: '100%',
    height: '40px',
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
};

