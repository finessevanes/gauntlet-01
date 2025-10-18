import { useCanvasContext } from '../../contexts/CanvasContext';
import { PAINT_COLORS } from '../../utils/constants';

export default function ColorPalette() {
  const { selectedColor, setSelectedColor } = useCanvasContext();

  return (
    <div style={styles.paletteContainer}>
      <div style={styles.palette}>
        {/* Current Color Indicator */}
        <div style={styles.currentColorSection}>
          <div style={styles.currentColorLabel}>Current:</div>
          <div style={styles.currentColorDisplay}>
            <div 
              style={{
                ...styles.currentColorSwatch,
                backgroundColor: selectedColor,
              }}
              title={`Selected color: ${selectedColor}`}
            />
            <div style={styles.currentColorText}>{selectedColor}</div>
          </div>
        </div>

        {/* Color grid - 2 rows of 14 colors */}
        <div style={styles.colorGrid}>
          {PAINT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                ...styles.colorSwatch,
                backgroundColor: color,
                ...(selectedColor === color ? styles.activeColor : {}),
              }}
              title={color}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        
        {/* Edit colors button */}
        <button style={styles.editButton} title="Edit colors (not functional)">
          Edit colors
        </button>
      </div>
    </div>
  );
}

const styles = {
  paletteContainer: {
    position: 'fixed' as const,
    bottom: '20px', // Above status bar
    left: '70px', // Right of tool palette
    right: 0,
    backgroundColor: '#f0f0f0',
    borderTop: '1px solid #c0c0c0',
    padding: '4px',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 800,
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  palette: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(14, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '1px',
    backgroundColor: '#808080',
    border: '1px solid #808080',
    padding: '2px',
  },
  colorSwatch: {
    width: '20px',
    height: '20px',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  activeColor: {
    boxShadow: 'inset 2px 2px 0 0 #000000, inset -2px -2px 0 0 #000000',
    outline: '2px solid #000000',
    outlineOffset: '-3px',
  },
  editButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f0f0f0',
    border: '1px solid #808080',
    cursor: 'pointer',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    height: '24px',
  },
  currentColorSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginRight: '12px',
    padding: '4px 8px',
    backgroundColor: '#ffffff',
    border: '1px solid #808080',
    borderRadius: '2px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  currentColorLabel: {
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#000000',
    fontWeight: 'bold',
  },
  currentColorDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  currentColorSwatch: {
    width: '24px',
    height: '24px',
    border: '2px solid #000000',
    borderRadius: '2px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  currentColorText: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#000000',
    fontWeight: 'bold',
    minWidth: '60px',
  },
};

