#!/bin/bash
# Unified startup script for foot traffic analysis system with YouTube streaming

# Function to check if a port is in use
check_port() {
  local port=$1
  # Try two methods to check port usage
  if command -v lsof &> /dev/null; then
    lsof -i ":$port" >/dev/null 2>&1
    return $?
  else
    # Fallback method if lsof is not available
    netstat -tuln | grep -q ":$port "
    return $?
  fi
}

# Kill any existing processes that might be using our ports
kill_port_processes() {
  for port in "$@"; do
    echo "Checking port $port..."
    if check_port "$port"; then
      echo "Port $port is in use. Attempting to free it..."
      # Try multiple methods to find and kill the process
      if command -v lsof &> /dev/null; then
        lsof -ti:"$port" | xargs -r kill -9 2>/dev/null || true
      else
        # Fallback methods
        fuser -k "$port"/tcp 2>/dev/null || true
        pkill -f ".*:$port" 2>/dev/null || true
      fi
      sleep 1
    fi
  done
}

# Clean up function for proper shutdown
cleanup() {
  echo "Stopping all services..."
  # Kill processes by PID if available
  for pid in "$YOUTUBE_PID" "$FLASK_PID" "$MAIN_PID"; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping process $pid..."
      kill -15 "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
    fi
  done
  exit
}

# Set up signal trapping
trap cleanup INT TERM EXIT

# Try to free the ports we need
kill_port_processes 5000 5001 5002

# Create log directory if it doesn't exist
mkdir -p logs

# Start the YouTube streaming server
echo "Starting YouTube streaming server on port 5002..."
cd flask_backend
python test_youtube.py > ../youtube_server.log 2>&1 &
YOUTUBE_PID=$!
cd ..

# Give the streaming server time to start
sleep 2
if ! check_port 5002; then
  echo "✓ YouTube streaming server running on port 5002"
else
  echo "Warning: YouTube streaming server may have failed to start on port 5002!"
fi

# Start the Flask backend for video analysis
echo "Starting Flask backend server for video processing on port 5001..."
cd flask_backend
python run_simple.py > ../flask_server.log 2>&1 &
FLASK_PID=$!
cd ..

# Give the Flask server time to start
sleep 2
if ! check_port 5001; then
  echo "✓ Flask server running on port 5001"
else
  echo "Warning: Flask server may have failed to start on port 5001!"
fi

# Start the main application (React + Node.js)
echo "Starting main application on port 5000..."
npm run dev > node_server.log 2>&1 &
MAIN_PID=$!

# Give the main application time to start
sleep 3
if ! check_port 5000; then
  echo "Warning: Main application may have failed to start on port 5000!"
else
  echo "✓ Main application running on port 5000"
fi

# Wait for any of the processes to exit or signal trap to be triggered
echo ""
echo "✅ All services started:"
echo "- Main application: http://localhost:5000"
echo "- Flask backend: http://localhost:5001"
echo "- YouTube streaming: http://localhost:5002"
echo ""
echo "YouTube streaming is now accessible from the dashboard!"
echo "Press Ctrl+C to stop all services."

# Keep script running until Ctrl+C
wait