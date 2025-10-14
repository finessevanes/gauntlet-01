import { useCanvasContext } from '../../contexts/CanvasContext';
import { PAINT_COLORS } from '../../utils/constants';

export default function ColorPalette() {
  const { selectedColor, setSelectedColor } = useCanvasContext();

  return (
    <div style={styles.paletteContainer}>
      <div style={styles.palette}>
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
};

