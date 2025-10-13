import { CURSOR_COLORS } from './constants';

/**
 * Generates a random cursor color for a new user
 */
export const generateUserColor = (): string => {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength (minimum 6 characters)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Formats timestamp to readable string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

