import { CURSOR_COLORS } from './constants';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

/**
 * Generates a cursor color for a new user, attempting to avoid duplicates
 * Falls back to random if all colors are taken
 */
export const generateUserColor = async (): Promise<string> => {
  try {
    // Get all existing users' colors
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const usedColors = new Set<string>();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.cursorColor) {
        usedColors.add(data.cursorColor);
      }
    });

    // Find unused colors
    const availableColors = CURSOR_COLORS.filter(color => !usedColors.has(color));
    
    // If there are unused colors, pick one randomly
    if (availableColors.length > 0) {
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    }
    
    // If all colors are taken, pick any random color (collision allowed)
    return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  } catch (error) {
    console.error('Error generating user color:', error);
    // Fallback to random color on error
    return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  }
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

