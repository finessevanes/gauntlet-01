/**
 * Format a date as relative time (e.g., "2 hours ago", "Just now")
 * @param date - Date to format
 * @returns Formatted string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to seconds
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 10) {
    return 'Just now';
  }
  
  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  }
  
  // Convert to minutes
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffMinutes === 1) {
    return '1 minute ago';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }
  
  // Convert to hours
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffHours === 1) {
    return '1 hour ago';
  }
  
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  
  // Convert to days
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  
  // Convert to weeks
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffWeeks === 1) {
    return '1 week ago';
  }
  
  if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  }
  
  // Convert to months (approximate)
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths === 1) {
    return '1 month ago';
  }
  
  if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  }
  
  // Convert to years
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffYears === 1) {
    return '1 year ago';
  }
  
  return `${diffYears} years ago`;
}

