#!/bin/bash

echo "Starting simplified Flask server..."

# Set the Python path to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)
export PORT=5003

echo "PYTHONPATH set to: $PYTHONPATH"
echo "Running Flask server on port: $PORT"

# Start the Flask server directly (not in background)
cd flask_backend && python simple_server.py