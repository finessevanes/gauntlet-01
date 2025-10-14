import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'Authentication failed';
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();

