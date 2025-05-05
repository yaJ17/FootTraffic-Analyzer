#!/bin/bash

# Set up a trap to kill background processes when this script exits
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Create directories for Flask backend if they don't exist
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Copy sample videos if they don't exist
echo "Setting up sample videos..."
for video in "palengke.mp4" "school.mp4"; do
  if [ -f "attached_assets/$video" ] && [ ! -f "flask_backend/uploads/$video" ]; then
    echo "Copying attached_assets/$video to flask_backend/uploads/$video"
    cp "attached_assets/$video" "flask_backend/uploads/$video"
  fi
done

# Start Flask server in the background
echo "Starting Flask video processing backend on port 5003..."
cd flask_backend && PORT=5003 python simple_server.py &
FLASK_PID=$!
cd ..

# Wait a bit for Flask to start
sleep 2
echo "Flask server started with PID: $FLASK_PID"

# Start the main application
echo "Starting main application on port 5000..."
cd /home/runner/workspace && NODE_ENV=development tsx server/index.ts

# This point is reached when the main app terminates
echo "Main application terminated, cleaning up..."