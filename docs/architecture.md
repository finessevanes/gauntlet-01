graph TB

%% ===== CLIENT (React App) =====
subgraph Client_Browser
  subgraph React_Application
    UI[UI Components]

    %% Components Layer
    subgraph Components_Layer
      Auth[Auth Components<br/>Login / Signup]
      Canvas[Canvas Components<br/>Canvas / ColorToolbar / CursorLayer<br/>5000x5000 pan and zoom]
      Collab[Collaboration Components<br/>Cursors / Presence List]
      Layout[Layout Components<br/>Navbar / AppShell]
    end

    %% State Management
    subgraph State_Management
      AuthCtx[Auth Context<br/>User and Session State]
      CanvasCtx[Canvas Context<br/>Draw / Preview / Selection State]
    end

    %% Custom Hooks
    subgraph Custom_Hooks
      useAuth[useAuth<br/>Auth operations]
      useCanvas[useCanvas<br/>Create / Move / Lock operations]
      useCursors[useCursors<br/>Throttled 20-30 FPS]
      usePresence[usePresence<br/>Online status]
    end

    %% Services Layer
    subgraph Services_Layer
      AuthSvc[Auth Service<br/>signup login logout]
      CanvasSvc[Canvas Service<br/>create update lock unlock subscribe]
      CursorSvc[Cursor Service<br/>cursor updates subscribe]
      PresenceSvc[Presence Service<br/>online status onDisconnect]
      FirebaseInit[Firebase Initialization<br/>config and emulator wiring]
    end

    %% Rendering Engine
    subgraph Rendering_Engine
      Konva[Konva and react-konva<br/>60 FPS rendering]
    end

    %% Utilities
    subgraph Utilities
      Helpers[Helper Functions<br/>generateUserColor throttle]
      Constants[Constants<br/>dimensions zoom bounds palette]
    end
  end
end

%% ===== BACKEND (Firebase Hybrid) =====
subgraph Firebase_Backend
  subgraph Firebase_Authentication
    FBAuth[Firebase Auth<br/>Email and Password]
  end

  subgraph Cloud_Firestore
    FSShapes[(canvases/main/shapes/:shapeId<br/>persistent shapes and locks)]
  end

  subgraph Realtime_Database
    RTDBSession[(sessions/main/users/:userId<br/>cursor:x y username color<br/>presence:online lastSeen)]
  end
end

%% ===== DEPLOYMENT =====
subgraph Deployment
  Vercel[Vercel Hosting and CDN<br/>deployed React app]
end

%% ===== TESTING & EMULATORS =====
subgraph Testing_Infrastructure
  subgraph Test_Suite
    UnitTests[Vitest and Testing Library<br/>unit tests services and utils]
    IntegrationTests[Integration tests<br/>multi user locking sync]
  end

  subgraph Firebase_Emulators
    AuthEmu[Auth Emulator 9099]
    FirestoreEmu[Firestore Emulator 8080]
    RTDBEmu[RTDB Emulator 9000]
    EmuUI[Emulator UI 4000]
  end
end

%% ===== USER =====
User([Users<br/>multiple browsers])

%% ----- Component to Context -----
Auth --> AuthCtx
Canvas --> CanvasCtx
Collab --> CanvasCtx
Layout --> AuthCtx

%% ----- Context to Hooks -----
AuthCtx --> useAuth
CanvasCtx --> useCanvas
CanvasCtx --> useCursors
CanvasCtx --> usePresence

%% ----- Hooks to Services -----
useAuth --> AuthSvc
useCanvas --> CanvasSvc
useCursors --> CursorSvc
usePresence --> PresenceSvc

%% ----- Services to Firebase Init -----
AuthSvc --> FirebaseInit
CanvasSvc --> FirebaseInit
CursorSvc --> FirebaseInit
PresenceSvc --> FirebaseInit

%% ----- Firebase Init to Backends -----
FirebaseInit --> FBAuth
FirebaseInit --> FSShapes
FirebaseInit --> RTDBSession

%% ----- Rendering -----
Canvas --> Konva

%% ----- Utilities -----
Helpers -.-> Collab
Helpers -.-> Canvas
Constants -.-> Canvas

%% ----- Real-time sync paths -----
CanvasSvc -->|create update lock unlock<br/>target under 100ms| FSShapes
FSShapes -->|onSnapshot listener| CanvasSvc

CursorSvc -->|position updates 20-30 FPS<br/>target under 50ms| RTDBSession
RTDBSession -->|value listener| CursorSvc

PresenceSvc -->|online status set and onDisconnect| RTDBSession
RTDBSession -->|value listener| PresenceSvc

%% ----- Auth flow -----
AuthSvc -->|signup login| FBAuth
FBAuth -->|id token and session| AuthSvc

%% ----- Deployment path -----
UI -.->|build and deploy| Vercel
User -->|access app url| Vercel
User -->|interact| UI

%% ----- Testing connections -----
UnitTests -.->|mock and test| AuthSvc
UnitTests -.->|mock and test| CanvasSvc
UnitTests -.->|mock and test| Helpers

IntegrationTests -.->|run against| AuthEmu
IntegrationTests -.->|run against| FirestoreEmu
IntegrationTests -.->|run against| RTDBEmu
EmuUI -.->|inspect data| FirestoreEmu
EmuUI -.->|inspect data| RTDBEmu
