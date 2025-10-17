import Konva from 'konva';

/**
 * Calculate the screen position for the text editor overlay
 * 
 * This function transforms Konva canvas coordinates to screen coordinates,
 * accounting for stage zoom, position, and container offset.
 * 
 * @param textNode - The Konva text node being edited
 * @param stage - The Konva stage instance
 * @param container - The HTML container element
 * @returns Position object with x, y coordinates and zoom factor
 */
export const calculateOverlayPosition = (
  textNode: Konva.Text,
  stage: Konva.Stage,
  container: HTMLElement
): { x: number; y: number; zoom: number } => {
  // Get absolute position of text node in canvas coordinates
  const canvasPoint = textNode.getAbsolutePosition();
  
  // Get stage transform
  const { x: stageX, y: stageY } = stage.position();
  const zoom = stage.scaleX(); // scaleX === scaleY for uniform scaling
  
  // Get container offset
  const containerRect = container.getBoundingClientRect();
  
  // Transform to screen coordinates
  const screenX = (canvasPoint.x - stageX) * zoom + containerRect.left;
  const screenY = (canvasPoint.y - stageY) * zoom + containerRect.top;
  
  return { x: screenX, y: screenY, zoom };
};

/**
 * Get text styling properties from a Konva text node
 * 
 * @param textNode - The Konva text node
 * @returns Object containing text styling properties
 */
export const getTextNodeStyle = (textNode: Konva.Text) => {
  return {
    fontSize: textNode.fontSize() || 16,
    color: textNode.fill() || '#000000',
    fontWeight: textNode.fontStyle()?.includes('bold') ? 'bold' : 'normal',
    fontStyle: textNode.fontStyle()?.includes('italic') ? 'italic' : 'normal',
    textDecoration: textNode.textDecoration() === 'underline' ? 'underline' : 'none',
  };
};

/**
 * Check if a shape is locked by another user
 * 
 * @param shape - The shape data object
 * @param currentUserId - The current user's ID
 * @returns True if the shape is locked by another user
 */
export const isShapeLockedByOther = (shape: any, currentUserId: string): boolean => {
  return shape.lockedBy && shape.lockedBy !== currentUserId;
};

/**
 * Check if a shape can be edited by the current user
 * 
 * @param shape - The shape data object
 * @param currentUserId - The current user's ID
 * @returns True if the shape can be edited
 */
export const canEditShape = (shape: any, currentUserId: string): boolean => {
  // Can edit if not locked or locked by current user
  return !shape.lockedBy || shape.lockedBy === currentUserId;
};

/**
 * Calculate accurate text dimensions for any font size
 * 
 * This function provides better text dimension estimation that works
 * for all font sizes from 12px to 200px+.
 * 
 * @param text - The text content
 * @param fontSize - The font size in pixels
 * @param fontWeight - The font weight (normal, bold)
 * @returns Object with width and height in pixels
 */
export const calculateTextDimensions = (
  text: string,
  fontSize: number,
  fontWeight: string = 'normal'
): { width: number; height: number } => {
  // Use canvas-based measurement for more accurate text width
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let textWidth = 0;
  
  if (context) {
    // Set font properties to match the text
    const fontStyle = fontWeight === 'bold' ? 'bold' : 'normal';
    context.font = `${fontStyle} ${fontSize}px Arial, sans-serif`;
    textWidth = context.measureText(text).width;
  } else {
    // Fallback to character-based estimation with more accurate multiplier
    const baseCharWidth = fontSize * 0.55; // More precise character width
    const boldMultiplier = fontWeight === 'bold' ? 1.05 : 1.0;
    textWidth = text.length * baseCharWidth * boldMultiplier;
  }
  
  // Height calculation - use font size for more accurate text height
  const lineHeight = fontSize; // Use font size as text height for better centering
  
  // Use actual measured width, with minimal padding
  const minWidth = Math.max(textWidth, fontSize * 0.3);
  
  return {
    width: minWidth,
    height: lineHeight
  };
};
