/**
 * Clipboard Service
 * Handles copying text to clipboard with browser compatibility fallback
 */
class ClipboardService {
  /**
   * Copy text to user's clipboard
   * Uses modern Clipboard API with fallback for older browsers
   * @param text - Text to copy to clipboard
   * @returns Promise resolving to true on success, false on failure
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      // Modern Clipboard API (preferred)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        console.log('✅ Text copied to clipboard via Clipboard API');
        return true;
      }
      
      // Fallback for older browsers using execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling
      textArea.style.opacity = '0';
      textArea.style.top = '0';
      textArea.style.left = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        console.log('✅ Text copied to clipboard via execCommand fallback');
      } else {
        console.warn('⚠️ execCommand copy failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      return false;
    }
  }
}

export const clipboardService = new ClipboardService();

