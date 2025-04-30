#!/bin/bash

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

# Start the Flask server
cd flask_backend && python run_simple.py