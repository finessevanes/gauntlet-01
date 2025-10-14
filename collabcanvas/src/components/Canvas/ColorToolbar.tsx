import { useCanvasContext } from '../../contexts/CanvasContext';
import { COLORS } from '../../utils/constants';

export default function ColorToolbar() {
  const { selectedColor, setSelectedColor, isDrawMode, setIsDrawMode } = useCanvasContext();

  const colorOptions = [
    { name: 'Red', value: COLORS.RED },
    { name: 'Blue', value: COLORS.BLUE },
    { name: 'Green', value: COLORS.GREEN },
    { name: 'Yellow', value: COLORS.YELLOW },
  ];

  return (
    <div style={styles.toolbar}>
      {/* Mode Toggle */}
      <div style={styles.section}>
        <div style={styles.label}>Mode:</div>
        <div style={styles.modeButtons}>
          <button
            onClick={() => setIsDrawMode(false)}
            style={{
              ...styles.modeButton,
              ...(!isDrawMode ? styles.activeModeButton : {}),
            }}
            title="Pan Mode (click and drag to move canvas)"
            aria-label="Pan Mode"
          >
            <span style={styles.icon}>✋</span>
            <span style={styles.buttonText}>Pan</span>
          </button>
          <button
            onClick={() => setIsDrawMode(true)}
            style={{
              ...styles.modeButton,
              ...(isDrawMode ? styles.activeModeButton : {}),
            }}
            title="Draw Mode (click and drag to create rectangles)"
            aria-label="Draw Mode"
          >
            <span style={styles.icon}>✏️</span>
            <span style={styles.buttonText}>Draw</span>
          </button>
        </div>
      </div>

      {/* Color Selection (only visible in Draw mode) */}
      {isDrawMode && (
        <div style={styles.section}>
          <div style={styles.label}>Color:</div>
          <div style={styles.colorButtons}>
            {colorOptions.map(({ name, value }) => (
              <button
                key={name}
                onClick={() => setSelectedColor(value)}
                style={{
                  ...styles.colorButton,
                  backgroundColor: value,
                  ...(selectedColor === value ? styles.activeButton : {}),
                }}
                title={name}
                aria-label={`Select ${name}`}
              >
                {selectedColor === value && <span style={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  modeButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  modeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280',
  },
  activeModeButton: {
    border: '2px solid #3b82f6',
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
  },
  icon: {
    fontSize: '1.25rem',
  },
  buttonText: {
    fontSize: '0.875rem',
  },
  colorButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  colorButton: {
    width: '36px',
    height: '36px',
    border: '2px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  activeButton: {
    border: '2px solid #111827',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  checkmark: {
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
};

