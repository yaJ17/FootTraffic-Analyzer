#!/bin/bash

echo "====== Foot Traffic Analysis Application Launcher ======"
echo "This script will start both the main application and Flask backend."

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

# Start Flask server in background
echo "Starting Flask server on port 5003..."

# Launch Flask in the background with output to log file
cd flask_backend
PORT=5003 python simple_server.py > ../flask_server.log 2>&1 &
FLASK_PID=$!
cd ..

# Verify if Flask started correctly
echo "Verifying Flask server startup..."
for i in {1..10}; do
  echo "Attempt $i: Checking if Flask server is running..."
  if curl -s http://localhost:5003/hello > /dev/null; then
    echo "Flask server is running successfully!"
    break
  elif [ "$i" -eq 10 ]; then
    echo "WARNING: Flask server could not be verified. Continuing anyway."
    echo "The application will use simulated data if the Flask server is unavailable."
    echo "Check flask_server.log for details."
  else
    echo "Waiting for Flask server to start..."
    sleep 2
  fi
done

# Start the main application
echo "Starting main application on port 5000..."
npm run dev