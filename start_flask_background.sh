#!/bin/bash

# Kill any existing Flask server processes
pkill -f "python run_simple.py" || true

# Create required directories
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Copy sample videos to uploads folder if they don't exist
if [ ! -f "flask_backend/uploads/palengke.mp4" ]; then
  cp attached_assets/palengke.mp4 flask_backend/uploads/ 2>/dev/null || echo "Warning: palengke.mp4 not found"
fi

if [ ! -f "flask_backend/uploads/school.mp4" ]; then
  cp attached_assets/school.mp4 flask_backend/uploads/ 2>/dev/null || echo "Warning: school.mp4 not found"
fi

# Set the Python path to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the Flask server in the background
cd flask_backend && nohup python run_simple.py > flask_server.log 2>&1 &

# Wait a moment for the server to start
sleep 2

# Check if the server is running
if pgrep -f "python run_simple.py" > /dev/null; then
  echo "Flask server started successfully on port 5001!"
  echo "Server logs are in flask_backend/flask_server.log"
else
  echo "Failed to start Flask server. Check flask_backend/flask_server.log for details."
fi