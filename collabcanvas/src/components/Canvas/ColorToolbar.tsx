import { useCanvasContext } from '../../contexts/CanvasContext';
import { COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';
import { useMemo } from 'react';

export default function ColorToolbar() {
  const { 
    selectedColor, 
    setSelectedColor, 
    isDrawMode, 
    setIsDrawMode,
    selectedShapeId,
    selectedShapes,
    shapes,
    updateShape,
    batchUpdateShapes,
    editingTextId
  } = useCanvasContext();

  // Get the current color to display - either selected shape color or default selected color
  // Use useMemo to recalculate when shapes, selections, or editing state changes
  const currentDisplayColor = useMemo(() => {
    if (editingTextId) {
      const editingShape = shapes.find(s => s.id === editingTextId);
      if (editingShape?.type === 'text') {
        return editingShape.color;
      }
    }
    
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape) {
        return selectedShape.color; // Any shape type has a color
      }
    }
    
    if (selectedShapes.length > 0) {
      const selectedShapesData = shapes.filter(s => selectedShapes.includes(s.id));
      if (selectedShapesData.length > 0) {
        // If multiple shapes, use the first one's color
        return selectedShapesData[0].color;
      }
    }
    
    return selectedColor;
  }, [shapes, selectedShapeId, selectedShapes, editingTextId, selectedColor]);

  // Check if any shapes are selected (either single selection or multi-selection)
  const hasSelectedShapes = () => {
    // Check if any text is being edited
    if (editingTextId) {
      const editingShape = shapes.find(s => s.id === editingTextId);
      return editingShape?.type === 'text';
    }
    
    // Check single selection
    if (selectedShapeId) {
      return true; // Any shape type can be selected
    }
    
    // Check multi-selection
    if (selectedShapes.length > 0) {
      return true; // Any shapes can be selected
    }
    
    return false;
  };

  // Handle color selection
  const handleColorSelect = async (color: string) => {
    const hasShapesSelected = hasSelectedShapes();
    
    if (hasShapesSelected) {
      // Apply color to selected shapes
      try {
        if (editingTextId) {
          // Text is being edited - update the editing text
          const editingShape = shapes.find(s => s.id === editingTextId);
          if (editingShape?.type === 'text') {
            await updateShape(editingTextId, { color });
            toast.success('Text color changed', {
              duration: 1000,
              position: 'top-center',
            });
          }
        } else if (selectedShapeId) {
          // Single shape selected
          const selectedShape = shapes.find(s => s.id === selectedShapeId);
          if (selectedShape) {
            await updateShape(selectedShapeId, { color });
            const shapeType = selectedShape.type === 'text' ? 'text' : 'shape';
            toast.success(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} color changed`, {
              duration: 1000,
              position: 'top-center',
            });
          }
        } else if (selectedShapes.length > 0) {
          // Multiple shapes selected - update all selected shapes
          const selectedShapesData = shapes.filter(s => selectedShapes.includes(s.id));
          
          if (selectedShapesData.length > 0) {
            const updates = selectedShapesData.map(shape => ({
              shapeId: shape.id,
              updates: { color }
            }));
            
            await batchUpdateShapes(updates);
            toast.success(`Changed color of ${selectedShapesData.length} shape${selectedShapesData.length > 1 ? 's' : ''}`, {
              duration: 1000,
              position: 'top-center',
            });
          }
        }
      } catch (error) {
        console.error('❌ Error changing shape color:', error);
        toast.error('Failed to change shape color', {
          duration: 2000,
          position: 'top-center',
        });
      }
    } else {
      // No shapes selected - just update the selected color for new shapes
      setSelectedColor(color);
    }
  };

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
                onClick={() => handleColorSelect(value)}
                style={{
                  ...styles.colorButton,
                  backgroundColor: value,
                  ...(currentDisplayColor === value ? styles.activeButton : {}),
                }}
                title={name}
                aria-label={`Select ${name}`}
              >
                {currentDisplayColor === value && <span style={styles.checkmark}>✓</span>}
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

