#!/bin/bash

# Create required directories
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

# Set the Python path to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)
export PORT=5003

echo "PYTHONPATH set to: $PYTHONPATH"
echo "Running Flask server on port: $PORT"

# Start the Flask server in the foreground
cd flask_backend && exec python simple_server.py