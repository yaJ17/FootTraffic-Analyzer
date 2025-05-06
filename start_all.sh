#!/bin/bash

# Start Flask server in the background
echo "Starting Flask server..."
cd flask_backend && python simple_server.py > flask_server.log 2>&1 &
FLASK_PID=$!
echo "Flask server started with PID: $FLASK_PID"

# Wait a moment to let Flask server initialize
sleep 2

# Start the main application
echo "Starting main application..."
npm run dev

# When the main app exits, kill the Flask server
kill $FLASK_PID