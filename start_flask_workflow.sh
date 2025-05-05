#!/bin/bash

echo "====== Foot Traffic Analysis - Flask Server Startup ======"
echo "Starting Flask video processing backend on port 5003"

# Create required directories
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

# Start Flask server
cd flask_backend
PORT=5003 python simple_server.py