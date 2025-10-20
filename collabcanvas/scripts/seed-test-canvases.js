#!/usr/bin/env node
/**
 * Seed Test Canvases - Simple Version
 * 
 * This script creates test canvases in Firestore for PR #12 testing
 * 
 * Usage:
 *   node scripts/seed-test-canvases.js <your-user-id>
 * 
 * To find your user ID:
 *   1. Run the app: npm run dev
 *   2. Log in
 *   3. Open browser console
 *   4. Type: getCurrentUserId()
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('');
  console.log('Usage: node scripts/seed-test-canvases.js <your-user-id>');
  console.log('');
  console.log('To find your user ID:');
  console.log('1. Run: npm run dev');
  console.log('2. Log in to the app');
  console.log('3. Open browser console (F12)');
  console.log('4. Type: getCurrentUserId()');
  console.log('5. Copy the ID and run:');
  console.log('   node scripts/seed-test-canvases.js <paste-user-id-here>');
  console.log('');
  process.exit(1);
}

// IMPORTANT: Update these with your Firebase config
// Or set them as environment variables before running
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'https://YOUR_PROJECT.firebaseio.com',
};

// Check if config is valid
if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  console.error('❌ Error: Firebase config not set!');
  console.log('');
  console.log('Please update the firebaseConfig in this script with your Firebase project details,');
  console.log('or set the VITE_FIREBASE_* environment variables.');
  console.log('');
  console.log('You can find your config in the Firebase Console:');
  console.log('Project Settings > General > Your apps > SDK setup and configuration');
  console.log('');
  process.exit(1);
}

// Initialize Firebase
console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
console.log('✅ Firebase initialized');
console.log('');

async function seedCanvases() {
  console.log('🌱 Seeding test canvases for user:', userId);
  console.log('');

  const canvases = [
    {
      id: 'test-canvas-1',
      name: 'My First Canvas',
      ownerId: userId,
      collaboratorIds: [userId],
      shapeCount: 0,
    },
    {
      id: 'test-canvas-2',
      name: 'Design Mockups',
      ownerId: userId,
      collaboratorIds: [userId],
      shapeCount: 3,
    },
    {
      id: 'test-canvas-3',
      name: 'Team Brainstorm',
      ownerId: userId,
      collaboratorIds: [userId],
      shapeCount: 15,
    },
  ];

  for (const canvas of canvases) {
    try {
      const canvasRef = doc(firestore, 'canvases', canvas.id);
      
      await setDoc(canvasRef, {
        name: canvas.name,
        ownerId: canvas.ownerId,
        collaboratorIds: canvas.collaboratorIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        shapeCount: canvas.shapeCount,
      });

      console.log(`✅ Created canvas: ${canvas.name} (${canvas.id})`);
    } catch (error) {
      console.error(`❌ Failed to create canvas ${canvas.id}:`, error.message);
    }
  }

  console.log('');
  console.log('🎉 Canvas seeding complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Log in to the app');
  console.log('3. You should see the gallery with 3 test canvases');
  console.log('4. Click a canvas card to open it');
  console.log('5. Create shapes - they will be scoped to that canvas');
  console.log('6. Return to gallery to see updated "last accessed" times');
  console.log('');
}

// Run the seeding
seedCanvases()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
