#!/bin/bash

# Quick setup script to test Session Builder v2 with live RAG service
# RAG Service Location: http://100.103.129.72

echo "🧪 Session Builder v2.0 - RAG Integration Test Setup"
echo "=================================================="
echo ""

# Check if .env exists in backend
if [ ! -f "packages/backend/.env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created packages/backend/.env"
    echo ""
    echo "⚠️  IMPORTANT: You must add your OPENAI_API_KEY to packages/backend/.env"
    echo "   Edit the file and replace: OPENAI_API_KEY=sk-your-actual-api-key-here"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key..."
fi

# Verify RAG service is accessible
echo "🔍 Checking RAG service connectivity..."
RAG_URL="http://100.103.129.72"

if command -v curl &> /dev/null; then
    # Try different health check endpoints
    if curl -s --connect-timeout 5 "$RAG_URL/health" > /dev/null 2>&1; then
        echo "✅ RAG service is accessible at $RAG_URL/health"
    elif curl -s --connect-timeout 5 "$RAG_URL/api/health" > /dev/null 2>&1; then
        echo "✅ RAG service is accessible at $RAG_URL/api/health"
    elif curl -s --connect-timeout 5 "$RAG_URL" > /dev/null 2>&1; then
        echo "✅ RAG service is accessible at $RAG_URL"
    else
        echo "⚠️  Could not verify RAG service. Please check connectivity manually:"
        echo "   curl $RAG_URL/health"
        echo ""
        echo "   The tests will continue, but RAG integration may not work."
        echo ""
    fi
else
    echo "⚠️  curl not found. Skipping RAG connectivity check."
    echo "   Please verify manually: curl $RAG_URL/health"
    echo ""
fi

echo ""
echo "📋 Configuration Summary:"
echo "   RAG Service: $RAG_URL"
echo "   Feature Flag: ENABLE_VARIANT_GENERATION_V2=true"
echo "   Rollout: 100%"
echo ""

# Check if OpenAI key is set
if grep -q "OPENAI_API_KEY=sk-your-actual-api-key-here" packages/backend/.env 2>/dev/null; then
    echo "⚠️  WARNING: Default OpenAI API key detected!"
    echo "   Please update packages/backend/.env with your actual key."
    echo ""
    exit 1
fi

echo "🚀 Starting services..."
echo ""
echo "This will start:"
echo "   - Backend on http://localhost:3001"
echo "   - Frontend on http://localhost:5173"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
cd packages/backend
npm run start:dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo "Starting frontend..."
cd packages/frontend
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Testing URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Session Builder: http://localhost:5173/sessions/builder/new"
echo ""
echo "📝 Testing Guide: See RAG_INTEGRATION_TESTING.md"
echo ""
echo "📋 Manual Test Checklist:"
echo "   1. Open http://localhost:5173/sessions/builder/new"
echo "   2. Fill in required fields (Title, Category, Desired Outcome)"
echo "   3. Click 'Generate Variants'"
echo "   4. Verify 4 variants appear"
echo "   5. Check for 'Knowledge Base-Driven' labels on RAG variants"
echo "   6. Select a variant and verify it loads"
echo ""
echo "📊 Check Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
