#!/bin/bash

echo "🚀 Starting CollabCanvas Development Environment"
echo ""
echo "Starting Firebase Emulators..."
npx firebase-tools emulators:start &
EMULATOR_PID=$!

# Wait for emulators to start
sleep 8

echo ""
echo "Starting Vite Dev Server..."
npm run dev &
DEV_PID=$!

echo ""
echo "✅ Development environment started!"
echo "   - Emulator UI: http://localhost:4000"
echo "   - Dev Server: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait
