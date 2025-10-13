import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

// Connect to emulators in development mode
const isDevelopment = import.meta.env.MODE === 'development';

if (isDevelopment) {
  console.log('🔧 Running in development mode - connecting to Firebase Emulators');
  
  // Connect Auth Emulator
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('✅ Connected to Auth Emulator (port 9099)');
  } catch (error) {
    console.warn('Auth Emulator already connected or unavailable:', error);
  }
  
  // Connect Firestore Emulator
  try {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    console.log('✅ Connected to Firestore Emulator (port 8080)');
  } catch (error) {
    console.warn('Firestore Emulator already connected or unavailable:', error);
  }
  
  // Connect Realtime Database Emulator
  try {
    connectDatabaseEmulator(database, '127.0.0.1', 9000);
    console.log('✅ Connected to Realtime Database Emulator (port 9000)');
  } catch (error) {
    console.warn('RTDB Emulator already connected or unavailable:', error);
  }
} else {
  console.log('🚀 Running in production mode - using Firebase Cloud services');
}

export { app, auth, firestore, database };

