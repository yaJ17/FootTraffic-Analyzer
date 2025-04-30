#!/bin/bash

echo "Starting Flask backend server for video analysis..."

# Create required directories
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Check if sample videos exist in uploads folder
if [ ! -f "flask_backend/uploads/palengke.mp4" ] && [ -f "attached_assets/palengke.mp4" ]; then
  echo "Copying sample video: palengke.mp4"
  cp attached_assets/palengke.mp4 flask_backend/uploads/
fi

if [ ! -f "flask_backend/uploads/school.mp4" ] && [ -f "attached_assets/school.mp4" ]; then
  echo "Copying sample video: school.mp4"
  cp attached_assets/school.mp4 flask_backend/uploads/
fi

# Set port for Flask server
export FLASK_PORT=5001

# Set Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the Flask server
cd flask_backend && python run_simple.py