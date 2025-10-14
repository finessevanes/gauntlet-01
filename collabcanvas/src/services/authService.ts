import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { generateUserColor } from '../utils/helpers';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  cursorColor: string;
  createdAt: any;
}

class AuthService {
  /**
   * Sign up a new user with email, password, and username
   */
  async signup(
    email: string,
    password: string,
    username: string
  ): Promise<UserProfile> {
    try {
      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Generate cursor color (attempts to avoid duplicates)
      const cursorColor = await generateUserColor();

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        username,
        email,
        cursorColor,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      return userProfile;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Log in an existing user with email and password
   */
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userProfile = await this.getUserProfile(user.uid);

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return userProfile;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential: UserCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile already exists
      let userProfile = await this.getUserProfile(user.uid);

      if (!userProfile) {
        // New user - create profile
        const username = this.extractUsernameFromGoogle(user);
        const cursorColor = await generateUserColor();

        userProfile = {
          uid: user.uid,
          username,
          email: user.email || '',
          cursorColor,
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(firestore, 'users', user.uid), userProfile);
      }

      return userProfile;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // User cancelled the popup
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in cancelled');
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Extract username from Google user data
   * Priority: displayName -> email prefix -> fallback
   */
  private extractUsernameFromGoogle(user: User): string {
    // Try display name first
    if (user.displayName && user.displayName.trim().length > 0) {
      return user.displayName.trim();
    }

    // Try email prefix
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      if (emailPrefix.length >= 2) {
        return emailPrefix;
      }
    }

    // Fallback to generic username
    return `User_${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out');
    }
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Fetch user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.code;

    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in cancelled';
      case 'auth/popup-blocked':
        return 'Popup blocked. Please allow popups for this site';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for OAuth operations';
      default:
        return error.message || 'Authentication failed';
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();

