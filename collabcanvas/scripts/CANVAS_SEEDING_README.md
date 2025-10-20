# Canvas Seeding Script

This script creates test canvases in Firestore for testing PR #12 (Canvas Gallery & List View).

## Quick Start

### Step 1: Find Your User ID

1. Run the app:
   ```bash
   npm run dev
   ```

2. Log in to the app

3. Open browser console (F12)

4. Type:
   ```javascript
   getCurrentUserId()
   ```

5. Copy the user ID (it will look like: `Abc123XyZ...`)

### Step 2: Run the Seeding Script

```bash
npm run seed-canvases <your-user-id>
```

Or directly:

```bash
node scripts/seed-test-canvases.js <your-user-id>
```

### Step 3: Verify in App

1. Refresh the app (or restart if needed)
2. You should see the gallery with 3 test canvases:
   - "My First Canvas" (0 shapes)
   - "Design Mockups" (3 shapes)
   - "Team Brainstorm" (15 shapes)
3. Click any canvas to open it
4. Create shapes - they'll be scoped to that canvas

## What This Script Does

The script creates 3 canvas documents in Firestore at:
```
canvases/
  ├── test-canvas-1/
  ├── test-canvas-2/
  └── test-canvas-3/
```

Each canvas document has:
- `name`: Display name
- `ownerId`: Your user ID
- `collaboratorIds`: Array with your user ID
- `createdAt`, `updatedAt`, `lastAccessedAt`: Server timestamps
- `shapeCount`: Number of shapes (0, 3, or 15)

## Troubleshooting

### Error: "Firebase config not set"
The script couldn't find your Firebase credentials. Make sure your `.env` file has:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
etc.
```

Or update the `firebaseConfig` object in the script directly.

### Error: "Permission denied"
Make sure your Firestore rules allow canvas creation:
```javascript
allow create: if request.auth != null && 
  request.resource.data.ownerId == request.auth.uid;
```

Note: This script runs unauthenticated, so it may fail with security rules.
For production testing, create canvases through the Firestore Console instead.

### Alternative: Manual Creation in Firestore Console

1. Go to Firebase Console > Firestore Database
2. Create collection: `canvases`
3. Add document with ID: `test-canvas-1`
4. Set fields:
   ```
   name: "My First Canvas"
   ownerId: "<your-user-id>"
   collaboratorIds: ["<your-user-id>"]
   createdAt: <click "serverTimestamp">
   updatedAt: <click "serverTimestamp">
   lastAccessedAt: <click "serverTimestamp">
   shapeCount: 0
   ```
5. Repeat for more test canvases

## Next Steps

After seeding canvases:
- Test gallery load performance
- Test canvas selection and loading
- Test cross-canvas isolation (create shapes on one, verify they don't appear on another)
- Test multi-user collaboration (share a canvas with another user)

