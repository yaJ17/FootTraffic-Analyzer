#!/bin/bash

# Kill any existing Python processes
pkill -f "python simple_video_app.py" || true

echo "Starting Flask server for video analysis..."

# Create required directories
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Copy sample videos if needed
if [ ! -f "flask_backend/uploads/palengke.mp4" ] && [ -f "attached_assets/palengke.mp4" ]; then
  echo "Copying sample video: palengke.mp4"
  cp attached_assets/palengke.mp4 flask_backend/uploads/
fi

if [ ! -f "flask_backend/uploads/school.mp4" ] && [ -f "attached_assets/school.mp4" ]; then
  echo "Copying sample video: school.mp4"
  cp attached_assets/school.mp4 flask_backend/uploads/
fi

# Start the Flask server with nohup to keep it running
cd flask_backend
nohup python simple_video_app.py > flask.log 2>&1 &
PID=$!

echo "Flask server started with PID: $PID"
echo "Waiting for server to initialize..."
sleep 3

# Check if server started successfully
if ps -p $PID > /dev/null; then
  echo "Flask server is running on port 5001"
  curl -s http://localhost:5001/api/status
  echo 
  echo "You can now use the Video Analysis feature in the main application."
else
  echo "Failed to start Flask server"
  cat flask.log
fi