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

#### 3. Start Firebase Emulators

Open a **first terminal** and start the Firebase Emulators:

```bash
npx firebase emulators:start
```

This will start:
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Realtime Database Emulator**: http://localhost:9000
- **Emulator UI**: http://localhost:4000 (for inspecting data)

Wait for the message: `All emulators ready!`

#### 4. Start Development Server

Open a **second terminal** and start the Vite dev server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

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

## 🚢 Deployment

### Production Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Create Realtime Database
5. Update `.env` with your production Firebase config
6. Deploy to Vercel:

```bash
npm run build
vercel --prod
```

7. Add your Vercel domain to Firebase Auth authorized domains

## 📋 Development Workflow

### Testing Multi-User Scenarios

Open multiple browser windows to simulate multiple users:

1. **Incognito Window**: http://localhost:5173 (User A)
2. **Normal Window**: http://localhost:5173 (User B)
3. **Different Browser**: http://localhost:5173 (User C)

Test scenarios:
- Create shapes simultaneously
- Lock same shape within 50ms
- Disconnect/reconnect during edits
- Refresh browser mid-drag

### Clearing Emulator Data

To reset all emulator data between tests:

1. Stop the emulators (Ctrl+C)
2. Restart: `npx firebase emulators:start`

Or use the Emulator UI to clear specific collections.

## 🎯 MVP Features (PR #0 - #7)

- ✅ **PR #0**: Tooling & Firebase Emulators Setup
- ⏳ **PR #1**: Authentication (Email/Password, User Profiles)
- ⏳ **PR #2**: Canvas Core (Pan/Zoom, Color Toolbar)
- ⏳ **PR #3**: Cursor Sync + Presence (RTDB)
- ⏳ **PR #4**: Shape Creation & Sync (Click-and-Drag Rectangles)
- ⏳ **PR #5**: Shape Locking + Drag Movement
- ⏳ **PR #6**: Security Rules, Tests, Polish
- ⏳ **PR #7**: Deployment (Vercel + Production Testing)

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
