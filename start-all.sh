#!/bin/bash
# Simple startup script for all components

# Clean up old processes
echo "Cleaning up old processes..."
pkill -f "python test_youtube.py" || true
pkill -f "python run_simple.py" || true
sleep 1

# Create symlink for the YOLO model if it doesn't exist
if [ ! -f "flask_backend/yolo12l.pt" ] && [ -f "attached_assets/model.pt" ]; then
    echo "Creating symlink for YOLO model..."
    ln -sf "$(pwd)/attached_assets/model.pt" "$(pwd)/flask_backend/yolo12l.pt"
fi

# Start the YouTube streaming server with proper error logging
echo "Starting YouTube streaming server..."
cd flask_backend
echo "Starting YouTube server at $(date)" > ../youtube_server.log
python -u test_youtube.py >> ../youtube_server.log 2>&1 &
youtube_pid=$!
cd ..
echo "YouTube server started with PID: $youtube_pid"

# Wait for the server to initialize and verify it's running
sleep 5
if ! ps -p $youtube_pid > /dev/null; then
    echo "ERROR: YouTube server failed to start. Check youtube_server.log for details."
    tail -n 20 youtube_server.log
else
    echo "YouTube streaming server should be available at: http://localhost:5002"
    # Test if the server is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5002 | grep -q "200"; then
        echo "Server is running and responding correctly."
    else
        echo "Warning: Server may be running but not responding correctly."
        echo "Check youtube_server.log for details:"
        tail -n 10 youtube_server.log
    fi
fi

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