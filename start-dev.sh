#!/bin/bash

echo "🚀 Starting PlayBingo Development Environment"
echo "============================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL if not already running
echo "🗄️  Starting PostgreSQL database..."
cd api
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start API server in background
echo "🔧 Starting API server..."
npm run dev &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start Web server in background
echo "🌐 Starting Web server..."
cd ../web
npm run dev &
WEB_PID=$!

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Web application: http://localhost:3000 (or 3001 if 3000 is busy)"
echo "🔧 API server: http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/api/docs"
echo ""
echo "Default login credentials (password: 'password'):"
echo "- staff@playbingo.gg (staff user)"
echo "- owner@playbingo.gg (owner user)"
echo "- mod@playbingo.gg (moderator user)"
echo "- player@playbingo.gg (regular user)"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $API_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
