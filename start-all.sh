#!/bin/bash
# Simple startup script for all components

# Clean up old processes
echo "Cleaning up old processes..."
pkill -f "python test_youtube.py" || true
pkill -f "python run_simple.py" || true
sleep 1

# Start the YouTube streaming server
echo "Starting YouTube streaming server..."
cd flask_backend && python test_youtube.py > ../youtube.log 2>&1 &
youtube_pid=$!
cd ..
echo "YouTube server started with PID: $youtube_pid"

# Wait for the server to initialize
sleep 2
echo "YouTube streaming server should be available at: http://localhost:5002"

# Give simple instructions to the user
echo ""
echo "========================================================"
echo "✅ YouTube streaming server is now running!"
echo ""
echo "👉 To access the YouTube stream analyzer:"
echo "   1. Open http://localhost:5002 in your browser"
echo "   2. Enter a YouTube URL (default is a pedestrian area in NYC)"
echo "   3. Click 'Start Analysis'"
echo ""
echo "👉 You can also access it through the Dashboard in the main app"
echo "   after you click the Run button in Replit"
echo "========================================================"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for Ctrl+C
wait "$youtube_pid"