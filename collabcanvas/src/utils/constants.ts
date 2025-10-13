// Canvas dimensions
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

// Color palette for shapes
export const COLORS = {
  RED: '#ef4444',
  BLUE: '#3b82f6',
  GREEN: '#10b981',
  YELLOW: '#f59e0b',
} as const;

// Default selected color
export const DEFAULT_COLOR = COLORS.BLUE;

// Cursor update frequency (ms)
export const CURSOR_UPDATE_INTERVAL = 33; // ~30 FPS

// Lock timeout (ms)
export const LOCK_TIMEOUT = 5000; // 5 seconds

// Minimum shape size (px)
export const MIN_SHAPE_SIZE = 10;

// Available cursor colors for users
export const CURSOR_COLORS = [
  '#ef4444', // red
  '#f59e0b', // yellow
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

