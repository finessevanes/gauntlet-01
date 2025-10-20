# CollabCanvas

A real-time collaborative design canvas that enables multiple users to simultaneously create, manipulate, and view shapes with live cursor tracking and presence awareness.

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Java Runtime Environment (for Firebase Emulators)

### Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for local dev)
cp .env.example .env

# 3. Start everything (emulators + dev server)
./start-dev.sh
```

**That's it!** The app opens at http://localhost:5173

> **Note:** Check services with `./check-services.sh`

### Manual Setup (Alternative)

If you prefer separate terminals:

```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start dev server
npm run dev
```

**Emulator UI:** http://localhost:4000  
**App:** http://localhost:5173

---

## 🛠️ Tech Stack

- React 18 + TypeScript + Vite
- Konva.js (canvas rendering)
- Firebase (Auth, Firestore, Realtime Database)
- Vercel (deployment)
- Vitest (testing)

**For architecture details:** See [docs/architecture.md](./docs/architecture.md)

---

## 📁 Project Structure

```
src/
├── components/     # React UI components
├── contexts/       # React Context providers
├── hooks/          # Custom React hooks
├── services/       # Firebase service layer
├── utils/          # Helper functions
└── firebase.ts     # Firebase initialization
```

**For complete structure:** See [docs/architecture.md](./docs/architecture.md)

---

## 🎯 Key Features

- Real-time collaborative canvas (5000x5000)
- Shape tools (rectangles, circles, triangles, pencil)
- Live cursors and presence (20-30 FPS)
- Shape operations (drag, resize, rotate, delete, duplicate, group)
- Multi-select with marquee selection
- Canvas sharing and permissions
- Chat with AI assistant (Clippy)
- AI-powered creative drawing
- Shape comments and annotations
- Text layers with rich editing
- Canvas gallery with search/filter
- Performance monitoring

**For detailed feature list:** See [docs/pr-briefs.md](./docs/pr-briefs.md)

---

## 📦 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:integration # Run integration tests

# Firebase
npm run emulators        # Start Firebase emulators
```

---

## 📖 Documentation

- **Feature Overview:** [docs/pr-briefs.md](./docs/pr-briefs.md)
- **Architecture:** [docs/architecture.md](./docs/architecture.md)
- **PRDs:** [docs/prds/](./docs/prds/)
- **Todos:** [docs/todos/](./docs/todos/)
- **Performance:** [docs/performance/](./docs/performance/)

---

## 🐛 Troubleshooting

**Emulators won't start:**  
Ensure Java is installed (`java -version`) and ports 4000, 8080, 9000, 9099 are free

**Can't connect:**  
Check emulators are running at http://localhost:4000 and verify `.env` configuration

**For more help:** Check the [docs/](./docs/) directory or Firebase/Konva documentation

---

Built with ⚡ by the CollabCanvas team
