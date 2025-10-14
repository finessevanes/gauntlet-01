import { useCanvasContext } from '../../contexts/CanvasContext';
import { COLORS } from '../../utils/constants';

export default function ColorToolbar() {
  const { selectedColor, setSelectedColor } = useCanvasContext();

  const colorOptions = [
    { name: 'Red', value: COLORS.RED },
    { name: 'Blue', value: COLORS.BLUE },
    { name: 'Green', value: COLORS.GREEN },
    { name: 'Yellow', value: COLORS.YELLOW },
  ];

  return (
    <div style={styles.toolbar}>
      <div style={styles.label}>Colors:</div>
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
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
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

