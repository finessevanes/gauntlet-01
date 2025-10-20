#!/usr/bin/env ts-node
/**
 * Seed Test Canvases
 * 
 * This script creates test canvases in Firestore for PR #12 testing
 * Run with: npm run seed-canvases
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (uses same config as main app)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function seedCanvases(userId: string) {
  console.log('🌱 Seeding test canvases for user:', userId);

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
      console.error(`❌ Failed to create canvas ${canvas.id}:`, error);
    }
  }

  console.log('🎉 Canvas seeding complete!');
  console.log('');
  console.log('You can now:');
  console.log('1. Run: npm run dev');
  console.log('2. Log in to the app');
  console.log('3. See the gallery with 3 test canvases');
  console.log('4. Click a canvas to open it');
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('');
  console.log('Usage: npm run seed-canvases <your-user-id>');
  console.log('');
  console.log('To find your user ID:');
  console.log('1. Open Firestore Console');
  console.log('2. Go to "users" collection');
  console.log('3. Copy your document ID');
  console.log('');
  console.log('Or run the app, open console, and type: getCurrentUserId()');
  process.exit(1);
}

// Run the seeding
seedCanvases(userId)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

