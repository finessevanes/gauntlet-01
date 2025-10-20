import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../../../src/utils/formatRelativeTime';

describe('formatRelativeTime', () => {
  it('should return "Just now" for very recent times (< 10 seconds)', () => {
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);
    
    expect(formatRelativeTime(fiveSecondsAgo)).toBe('Just now');
  });

  it('should return seconds for times under 1 minute', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('30 seconds ago');
  });

  it('should return "1 minute ago" for singular minute', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should return minutes for times under 1 hour', () => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30 minutes ago');
  });

  it('should return "1 hour ago" for singular hour', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });

  it('should return hours for times under 1 day', () => {
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(fiveHoursAgo)).toBe('5 hours ago');
  });

  it('should return "Yesterday" for singular day', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneDayAgo)).toBe('Yesterday');
  });

  it('should return days for times under 1 week', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('should return "1 week ago" for singular week', () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago');
  });

  it('should return weeks for times under 1 month', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('should return "1 month ago" for singular month', () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago');
  });

  it('should return months for times under 1 year', () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(sixMonthsAgo)).toBe('6 months ago');
  });

  it('should return "1 year ago" for singular year', () => {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago');
  });

  it('should return years for very old dates', () => {
    const now = new Date();
    const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(threeYearsAgo)).toBe('3 years ago');
  });

  it('should handle edge case of exactly 60 seconds', () => {
    const now = new Date();
    const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
    
    // Should be "1 minute ago" not "60 seconds ago"
    expect(formatRelativeTime(sixtySecondsAgo)).toBe('1 minute ago');
  });

  it('should handle future dates gracefully', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour in future
    
    // Should not crash - may return "Just now" or negative values depending on implementation
    const result = formatRelativeTime(future);
    expect(typeof result).toBe('string');
  });
});

