/**
 * User Action Tracker
 * Emits user-friendly action events for the Performance Monitor
 */

export function trackUserAction(
  action: string,
  duration: number,
  icon: string = '✏️'
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('user-action', {
        detail: { action, duration, icon },
      })
    );
  }
}

// Helper functions for common actions
export const userActions = {
  createShape: (shapeType: string, color: string, duration: number) => {
    trackUserAction(`Created ${color} ${shapeType}`, duration, '✏️');
  },
  
  moveShape: (shapeType: string, color: string, duration: number) => {
    trackUserAction(`Moved ${color} ${shapeType}`, duration, '🎨');
  },
  
  deleteShape: (_shapeType: string, count: number, duration: number) => {
    const plural = count > 1 ? 's' : '';
    trackUserAction(`Deleted ${count} shape${plural}`, duration, '🗑️');
  },
  
  duplicateShape: (count: number, duration: number) => {
    const plural = count > 1 ? 's' : '';
    trackUserAction(`Duplicated ${count} shape${plural}`, duration, '📋');
  },
  
  resizeShape: (shapeType: string, duration: number) => {
    trackUserAction(`Resized ${shapeType}`, duration, '📏');
  },
  
  rotateShape: (shapeType: string, duration: number) => {
    trackUserAction(`Rotated ${shapeType}`, duration, '🔄');
  },
  
  changeLayer: (action: 'front' | 'back' | 'forward' | 'backward', count: number, duration: number) => {
    const actionText = {
      front: 'Brought to front',
      back: 'Sent to back',
      forward: 'Brought forward',
      backward: 'Sent backward',
    }[action];
    
    const plural = count > 1 ? 's' : '';
    trackUserAction(`${actionText} (${count} shape${plural})`, duration, '↕️');
  },
  
  groupShapes: (count: number, duration: number) => {
    trackUserAction(`Grouped ${count} shapes`, duration, '🔗');
  },
  
  ungroupShapes: (count: number, duration: number) => {
    trackUserAction(`Ungrouped ${count} shapes`, duration, '💥');
  },
  
  addComment: (duration: number) => {
    trackUserAction('Added comment', duration, '💬');
  },
  
  editText: (duration: number) => {
    trackUserAction('Edited text', duration, '✍️');
  },
};

