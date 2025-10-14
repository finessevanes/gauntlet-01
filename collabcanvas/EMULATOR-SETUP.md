# Firebase Emulator Setup & Test Users

## 🚨 IMPORTANT: Emulators MUST Be Running!

Your app REQUIRES the Firebase Emulators to be running in development mode. If you get `auth/invalid-credential` or any connection errors, make sure:

1. **Emulators are running**: http://localhost:4000 should be accessible
2. **Dev server is running**: http://localhost:5173 should be accessible

### Quick Start (Runs Everything)
```bash
./start-dev.sh
```

### Check What's Running
```bash
./check-services.sh
```

---

## Quick Reset

If you're having authentication issues, the easiest solution is to clear the emulator data and start fresh:

```bash
# Stop the emulators
# Then restart with --clear flag
firebase emulators:start --clear
```

## Creating Test Users

### Method 1: Use the App Signup (RECOMMENDED)

The easiest way to create properly configured users:

1. Start the dev server: `npm run dev`
2. Open http://localhost:5173
3. Click "Sign up"
4. Fill in the form:
   - Email: your-email@test.com
   - Password: password123
   - Username: YourName
5. Sign up!

This ensures both Firebase Auth and Firestore user profiles are created correctly.

### Method 2: Manual Creation (For Advanced Users)

If you need to manually create users in the Firebase Emulator UI:

#### Step 1: Create Auth User
1. Open Firebase Emulator UI: http://localhost:4000/auth
2. Click "Add User"
3. Enter:
   - Email: vanessa@gmail.com
   - Password: password123
   - Display name: Vanessa (optional)
4. Click "Save"
5. **Copy the UID** that was generated

#### Step 2: Create Firestore Profile
1. Go to Firestore tab: http://localhost:4000/firestore
2. Click "Start collection" if empty, or navigate to `users` collection
3. Create a document with:
   - Document ID: **[paste the UID from step 1]**
   - Fields:
     ```
     uid: [same UID]
     email: vanessa@gmail.com
     username: Vanessa
     cursorColor: #FF6B6B
     createdAt: [current timestamp]
     ```

## Common Authentication Errors

### `auth/invalid-credential`
- **Cause**: Password doesn't match what's stored
- **Fix**: Make sure you're using the exact password you set when creating the user

### `auth/user-not-found`
- **Cause**: Email doesn't exist in Auth
- **Fix**: Create the user first or check for typos

### `User profile not found`
- **Cause**: Auth user exists but Firestore document is missing
- **Fix**: Create the Firestore document manually (see Method 2, Step 2)

## Test Credentials

After following Method 1 (recommended), you can use:
- Email: vanessa@gmail.com
- Password: password123
- Username: Vanessa

## Clearing All Data

To completely reset the emulator:

```bash
# Stop emulators if running
# Then restart with --clear flag
firebase emulators:start --clear
```

This deletes all Auth users, Firestore data, and Realtime Database data.

