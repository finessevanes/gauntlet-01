import { useCanvasContext } from '../../contexts/CanvasContext';

interface AlignmentToolbarProps {
  selectedShapes: string[];
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute?: (direction: 'horizontal' | 'vertical') => void;
}

export default function AlignmentToolbar({ 
  selectedShapes,
  onAlign,
  onDistribute
}: AlignmentToolbarProps) {
  const { alignShapes, distributeShapes } = useCanvasContext();

  console.log('🎨 AlignmentToolbar render:', { selectedShapesCount: selectedShapes.length, selectedShapes });

  // Show toolbar only when 2+ shapes are selected
  if (selectedShapes.length < 2) {
    console.log('🎨 AlignmentToolbar: Not showing (need 2+ shapes)');
    return null;
  }

  console.log('🎨 AlignmentToolbar: SHOWING toolbar for', selectedShapes.length, 'shapes');

  const handleAlign = async (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    try {
      if (onAlign) {
        onAlign(alignment);
      } else {
        await alignShapes(selectedShapes, alignment);
      }
    } catch (error) {
      console.error('Failed to align shapes:', error);
    }
  };

  const handleDistribute = async (direction: 'horizontal' | 'vertical') => {
    try {
      if (selectedShapes.length < 3) {
        console.warn('At least 3 shapes required for distribution');
        return;
      }
      
      if (onDistribute) {
        onDistribute(direction);
      } else {
        await distributeShapes(selectedShapes, direction);
      }
    } catch (error) {
      console.error('Failed to distribute shapes:', error);
    }
  };

  const isDistributeEnabled = selectedShapes.length >= 3;

  return (
    <div style={styles.toolbar}>
      <div style={styles.container}>
        {/* Row 1: Horizontal and Vertical Alignments */}
        <div style={styles.mainRow}>
          {/* Horizontal alignments */}
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleAlign('left')}
              style={styles.button}
              title="Align Left (align left edges)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="6" height="3" fill="currentColor" />
                  <rect x="2" y="6" width="8" height="3" fill="currentColor" />
                  <rect x="2" y="10" width="4" height="2" fill="currentColor" />
                  <line x1="0.5" y1="0" x2="0.5" y2="14" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Left</span>
              </span>
            </button>
            <button
              onClick={() => handleAlign('center')}
              style={styles.button}
              title="Align Center (align horizontal centers)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="2" width="6" height="3" fill="currentColor" />
                  <rect x="3" y="6" width="8" height="3" fill="currentColor" />
                  <rect x="5" y="10" width="4" height="2" fill="currentColor" />
                  <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Center</span>
              </span>
            </button>
            <button
              onClick={() => handleAlign('right')}
              style={styles.button}
              title="Align Right (align right edges)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="2" width="6" height="3" fill="currentColor" />
                  <rect x="4" y="6" width="8" height="3" fill="currentColor" />
                  <rect x="8" y="10" width="4" height="2" fill="currentColor" />
                  <line x1="13.5" y1="0" x2="13.5" y2="14" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Right</span>
              </span>
            </button>
          </div>

          <div style={styles.divider} />

          {/* Vertical alignments */}
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleAlign('top')}
              style={styles.button}
              title="Align Top (align top edges)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="3" height="6" fill="currentColor" />
                  <rect x="6" y="2" width="3" height="8" fill="currentColor" />
                  <rect x="10" y="2" width="2" height="4" fill="currentColor" />
                  <line x1="0" y1="0.5" x2="14" y2="0.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Top</span>
              </span>
            </button>
            <button
              onClick={() => handleAlign('middle')}
              style={styles.button}
              title="Align Middle (align vertical centers)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="3" height="6" fill="currentColor" />
                  <rect x="6" y="3" width="3" height="8" fill="currentColor" />
                  <rect x="10" y="5" width="2" height="4" fill="currentColor" />
                  <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Middle</span>
              </span>
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              style={styles.button}
              title="Align Bottom (align bottom edges)"
            >
              <span style={styles.buttonContent}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="3" height="6" fill="currentColor" />
                  <rect x="6" y="4" width="3" height="8" fill="currentColor" />
                  <rect x="10" y="8" width="2" height="4" fill="currentColor" />
                  <line x1="0" y1="13.5" x2="14" y2="13.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span style={styles.buttonLabel}>Bottom</span>
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Distribution options */}
        <div style={styles.distributeRow}>
          <button
            onClick={() => handleDistribute('horizontal')}
            disabled={!isDistributeEnabled}
            style={{
              ...styles.button,
              ...styles.distributeButton,
              ...(isDistributeEnabled ? {} : styles.disabledButton),
            }}
            title={isDistributeEnabled ? "Distribute Horizontally (space evenly left to right)" : "Select 3+ shapes to distribute"}
          >
            <span style={styles.buttonContent}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="4" width="2" height="6" fill="currentColor" />
                <rect x="6" y="4" width="2" height="6" fill="currentColor" />
                <rect x="11" y="4" width="2" height="6" fill="currentColor" />
                <line x1="3" y1="7" x2="6" y2="7" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
                <line x1="8" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
              </svg>
              <span style={styles.buttonLabel}>Distribute H</span>
            </span>
          </button>
          <button
            onClick={() => handleDistribute('vertical')}
            disabled={!isDistributeEnabled}
            style={{
              ...styles.button,
              ...styles.distributeButton,
              ...(isDistributeEnabled ? {} : styles.disabledButton),
            }}
            title={isDistributeEnabled ? "Distribute Vertically (space evenly top to bottom)" : "Select 3+ shapes to distribute"}
          >
            <span style={styles.buttonContent}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="1" width="6" height="2" fill="currentColor" />
                <rect x="4" y="6" width="6" height="2" fill="currentColor" />
                <rect x="4" y="11" width="6" height="2" fill="currentColor" />
                <line x1="7" y1="3" x2="7" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
                <line x1="7" y1="8" x2="7" y2="11" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
              </svg>
              <span style={styles.buttonLabel}>Distribute V</span>
            </span>
          </button>
        </div>
      </div>

      {/* Info text */}
      <div style={styles.infoSection}>
        <p style={styles.infoText}>
          {selectedShapes.length} shape{selectedShapes.length !== 1 ? 's' : ''} selected
          {selectedShapes.length < 3 && ' (3+ needed for distribution)'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  toolbar: {
    position: 'fixed' as const,
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#f0f0f0',
    border: '1px solid #c0c0c0',
    padding: '8px',
    minWidth: '580px',
    zIndex: 9999,
    pointerEvents: 'auto' as const,
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    borderRadius: '3px',
  },
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '4px',
  },
  button: {
    height: '36px',
    padding: '0 10px',
    backgroundColor: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    borderRadius: '3px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    transition: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  buttonLabel: {
    fontSize: '11px',
    fontWeight: '500' as const,
    color: '#000000',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#808080',
  },
  distributeRow: {
    display: 'flex',
    gap: '4px',
    paddingTop: '8px',
    borderTop: '1px solid #a0a0a0',
  },
  distributeButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#e8e8e8',
    color: '#a0a0a0',
    cursor: 'not-allowed',
    boxShadow: 'inset 1px 1px 0 0 #c0c0c0',
  },
  infoSection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #a0a0a0',
  },
  infoText: {
    fontSize: '11px',
    color: '#555555',
    margin: 0,
    textAlign: 'center' as const,
  },
};

