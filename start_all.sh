#!/bin/bash

# Kill any existing processes to avoid port conflicts
echo "Cleaning up any existing processes..."
pkill -f node || true
pkill -f python || true
sleep 1

# Create required directories
echo "Creating required directories..."
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Copy sample videos if they don't exist
echo "Checking for sample videos..."
for video in "palengke.mp4" "school.mp4"; do
  if [ -f "attached_assets/$video" ] && [ ! -f "flask_backend/uploads/$video" ]; then
    echo "Copying attached_assets/$video to flask_backend/uploads/$video"
    cp "attached_assets/$video" "flask_backend/uploads/$video"
  fi
done

# Start Flask server in the background
echo "Starting Flask server on port 5003..."
cd flask_backend && PORT=5003 python simple_server.py > ../flask.log 2>&1 &
FLASK_PID=$!
cd ..

echo "Waiting for Flask server to start..."
sleep 3

# Start the main application
echo "Starting main application on port 5000..."
npm run dev