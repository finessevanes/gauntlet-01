#!/bin/bash

echo "🔍 Checking CollabCanvas Services..."
echo ""

# Check if emulators are running
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo "✅ Firebase Emulator UI is running (http://localhost:4000)"
else
    echo "❌ Firebase Emulator UI is NOT running"
fi

if curl -s http://localhost:9099 > /dev/null 2>&1; then
    echo "✅ Auth Emulator is running (port 9099)"
else
    echo "❌ Auth Emulator is NOT running"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Firestore Emulator is running (port 8080)"
else
    echo "❌ Firestore Emulator is NOT running"
fi

if curl -s http://localhost:9000 > /dev/null 2>&1; then
    echo "✅ Realtime Database Emulator is running (port 9000)"
else
    echo "❌ Realtime Database Emulator is NOT running"
fi

# Check if dev server is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Vite Dev Server is running (http://localhost:5173)"
else
    echo "❌ Vite Dev Server is NOT running"
fi

echo ""
echo "💡 To start all services: ./start-dev.sh"

