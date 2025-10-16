# CollabCanvas MVP

A real-time collaborative design canvas that enables multiple users to simultaneously create, manipulate, and view simple shapes with live cursor tracking and presence awareness.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Java Runtime Environment (for Firebase Emulators)

### Local Development Setup

This project uses Firebase Emulators for local development, allowing you to develop without incurring Firebase costs or needing internet connectivity for the database.

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

For local development, the default dummy values in `.env` are sufficient since we're using emulators.

#### 3. Start Everything (One Command)

**⚡ Easiest way - Run both emulators and dev server:**

```bash
./start-dev.sh
```

This automatically starts:
- Firebase Emulators (Auth, Firestore, Realtime Database)
- Vite dev server
- Opens http://localhost:4000 (Emulator UI) and http://localhost:5173 (App)

**Check if services are running:**
```bash
./check-services.sh
```

#### OR: Manual Setup (Two Terminals)

**Terminal 1 - Start Firebase Emulators:**

```bash
npm run emulators
```

This will start:
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Realtime Database Emulator**: http://localhost:9000
- **Emulator UI**: http://localhost:4000 (for inspecting data)

Wait for the message: `All emulators ready!`

**Terminal 2 - Start Development Server:**

```bash
npm run dev
```

The app will be available at http://localhost:5173

> **⚠️ IMPORTANT**: Both emulators AND dev server MUST be running for the app to work!

### 🧪 Emulator UI

Access the Firebase Emulator UI at http://localhost:4000 to:
- View authentication users
- Inspect Firestore collections
- Monitor Realtime Database data
- Clear data between tests

## 🏗️ Project Structure

```
src/
├── components/          # React UI components
│   ├── Auth/           # Login, Signup, AuthProvider
│   ├── Canvas/         # Canvas, ColorToolbar, CursorLayer
│   ├── Collaboration/  # Cursor, PresenceList
│   └── Layout/         # Navbar, AppShell
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── CanvasContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useCanvas.ts
│   ├── useCursors.ts
│   └── usePresence.ts
├── services/           # Service layer (Firebase abstraction)
│   ├── authService.ts
│   ├── canvasService.ts
│   ├── cursorService.ts
│   └── presenceService.ts
├── utils/              # Helper functions and constants
├── firebase.ts         # Firebase initialization
├── App.tsx
└── main.tsx
```

## 🔥 Firebase Architecture

### Hybrid Database Approach

This project uses a **hybrid Firebase database architecture** for optimal performance:

#### Realtime Database (RTDB)
- **Purpose**: High-frequency, ephemeral data
- **Data**: Cursor positions, presence/online status
- **Update Frequency**: 20-30 FPS (33-50ms)
- **Target Latency**: <50ms
- **Path**: `/sessions/main/users/{userId}/cursor` and `/presence`

#### Firestore
- **Purpose**: Persistent, structured data
- **Data**: Shapes, locks, user profiles
- **Update Frequency**: On-demand
- **Target Latency**: <100ms
- **Collection**: `canvases/main/shapes/{shapeId}`

### Why This Architecture?

- **Performance**: RTDB handles real-time cursor updates with <50ms latency (Firestore averages ~200ms)
- **Scalability**: Firestore handles complex queries and scales to 500+ shapes
- **Cost**: RTDB reduces Firestore costs for high-frequency updates
- **AI-Ready**: Service layer architecture makes AI agent integration seamless (Phase 2)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Canvas**: Konva.js + react-konva
- **State Management**: React Context + Custom Hooks
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Deployment**: Vercel
- **Testing**: Vitest + React Testing Library + Firebase Emulators

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build locally

# Firebase Emulators
npx firebase emulators:start           # Start all emulators
npx firebase emulators:start --only firestore,database,auth  # Start specific emulators

# Testing (Coming in PR #6)
npm run test            # Run unit tests
npm run test:integration  # Run integration tests
```

## 🔐 Security Rules

### Firestore Rules (`firestore.rules`)

- Users can only read/write their own user document
- All authenticated users can read shapes
- Users can only create shapes with their own `createdBy` field
- All authenticated users can update/delete shapes (for collaborative editing)

### Realtime Database Rules (`database.rules.json`)

- All authenticated users can read all cursor/presence data
- Users can only write to their own cursor/presence node (`/sessions/main/users/{userId}`)

## 🌐 Live Demo

**Production URL:** _Coming soon - Deploy following the guide below_

Try it out with multiple browser windows to see real-time collaboration in action!

---

## 🚢 Deployment

### Quick Deploy to Vercel

**Prerequisites:**
- Firebase project configured (Auth, Firestore, RTDB enabled)
- Vercel account created
- Firebase security rules deployed

**Deployment Steps:**

#### 1. Build Locally (Test First)

```bash
npm run build
npm run preview  # Test at http://localhost:4173
```

#### 2. Deploy to Vercel

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from collabcanvas directory
cd collabcanvas
vercel --prod
```

**Option B: GitHub Integration**

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Import Project**
4. Connect your GitHub repository
5. Set root directory to `collabcanvas`
6. Deploy

#### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

#### 4. Configure Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Add your Vercel domain (e.g., `your-app.vercel.app`)

#### 5. Deploy Firebase Rules

```bash
# Deploy security rules to Firebase
firebase deploy --only firestore:rules,database
```

### Full Deployment Guide

For complete step-by-step instructions, see [PR-7-DEPLOYMENT-GUIDE.md](./PR-7-DEPLOYMENT-GUIDE.md)

---

## 🧪 Production Testing

After deployment, verify the following:

**Authentication:**
- [ ] Sign up works
- [ ] Login works
- [ ] Auth persists on refresh

**Real-Time Features:**
- [ ] Open 2+ browsers
- [ ] See each other's cursors (<50ms latency)
- [ ] Presence list updates on join/leave
- [ ] Cursors smooth at 20-30 FPS

**Canvas Features:**
- [ ] Pan and zoom work smoothly
- [ ] Create rectangles, circles, triangles with click-and-drag
- [ ] Resize and rotate shapes
- [ ] Shapes sync across users (<100ms)
- [ ] Shapes persist after refresh

**Performance:**
- [ ] 60 FPS during interactions
- [ ] Test with 5+ concurrent users
- [ ] Test with 50+ shapes
- [ ] No console errors

---

## 📋 Development Workflow

### Testing Multi-User Scenarios

Open multiple browser windows to simulate multiple users:

1. **Incognito Window**: http://localhost:5173 (User A)
2. **Normal Window**: http://localhost:5173 (User B)
3. **Different Browser**: http://localhost:5173 (User C)

Test scenarios:
- Switch between Pan and Draw modes
- Create shapes simultaneously
- Watch real-time cursor sync
- Lock same shape within 50ms (coming in PR #5)
- Disconnect/reconnect during edits
- Refresh browser mid-drag

### Clearing Emulator Data

To reset all emulator data between tests:

1. Stop the emulators (Ctrl+C)
2. Restart: `npx firebase emulators:start`

Or use the Emulator UI to clear specific collections.

## 🎯 Features

### Core Canvas
- ✅ **Pan/Zoom**: 5000x5000 canvas with smooth pan and zoom
- ✅ **Shape Tools**: Rectangle, Circle, Triangle drawing modes
- ✅ **Shape Operations**: Drag, resize, rotate, delete, duplicate
- ✅ **Color Palette**: Multiple colors for shape creation
- ✅ **Real-time Sync**: All shapes sync across users (<100ms)

### Collaboration
- ✅ **Live Cursors**: See collaborators' cursors in real-time (20-30 FPS)
- ✅ **Presence**: See who's online with user badges
- ✅ **Shape Locking**: First-user-locks mechanism prevents conflicts

### Authentication
- ✅ **Email/Password**: Secure signup and login
- ✅ **Session Persistence**: Stay logged in across refreshes

## 🐛 Troubleshooting

### Emulators won't start
- Ensure Java is installed: `java -version`
- Check if ports are already in use (4000, 8080, 9000, 9099)
- Try clearing emulator cache: `npx firebase emulators:start --import=./emulator-data --export-on-exit`

### Can't connect to emulators
- Verify emulators are running: check http://localhost:4000
- Check console logs for connection errors
- Ensure `.env` has correct configuration

### Firebase initialization errors
- Verify all environment variables are set in `.env`
- Check that `src/firebase.ts` is importing from the correct path
- Clear browser cache and restart dev server

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 📄 License

MIT

---

Built with ⚡ by the CollabCanvas team
