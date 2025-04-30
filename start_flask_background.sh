#!/bin/bash

# Kill any existing Flask server processes
pkill -f "python run_simple.py" || true
pkill -f "simple_video_app" || true

echo "Starting Flask server setup..."

# Create required directories
mkdir -p flask_backend/uploads
mkdir -p flask_backend/templates

echo "Checking for sample videos..."

# Copy sample videos to uploads folder if they don't exist
if [ ! -f "flask_backend/uploads/palengke.mp4" ]; then
  cp attached_assets/palengke.mp4 flask_backend/uploads/ 2>/dev/null || echo "Warning: palengke.mp4 not found"
else
  echo "Found palengke.mp4"
fi

if [ ! -f "flask_backend/uploads/school.mp4" ]; then
  cp attached_assets/school.mp4 flask_backend/uploads/ 2>/dev/null || echo "Warning: school.mp4 not found"
else
  echo "Found school.mp4"
fi

# Set the Python path to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)
echo "PYTHONPATH set to: $PYTHONPATH"

# Create a simple test Flask app to verify the installation
cat > flask_backend/test_flask.py << EOF
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/hello')
def hello():
    return "Hello from Flask!"

if __name__ == '__main__':
    print("Starting test Flask server on port 5003...")
    app.run(host='0.0.0.0', port=5003, debug=False)
EOF

echo "Starting minimal test Flask server to verify installation..."
cd flask_backend && python test_flask.py > test_flask.log 2>&1 &
TEST_PID=$!
sleep 3

if kill -0 $TEST_PID 2>/dev/null; then
  echo "Test Flask server started successfully!"
  echo "Terminating test server..."
  kill $TEST_PID
else
  echo "Failed to start test Flask server. Check flask_backend/test_flask.log for details."
  cat flask_backend/test_flask.log
  exit 1
fi

echo "Now starting the actual Flask server for video analysis..."

# Start the Flask server in the background with more verbose logging
cd flask_backend && python -c "
import sys
import os
import logging

logging.basicConfig(level=logging.DEBUG,
                  format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('flask_app')

try:
    from simple_video_app import app
    logger.info('Imported simple_video_app successfully')
    logger.info('Starting Flask server on port 5003')
    app.run(host='0.0.0.0', port=5003, debug=False)
except Exception as e:
    logger.error(f'Error starting Flask app: {e}', exc_info=True)
    sys.exit(1)
" > flask_server.log 2>&1 &

# Wait a moment for the server to start
sleep 3

# Check if the server is running
if pgrep -f "simple_video_app" > /dev/null; then
  echo "Flask server started successfully on port 5003!"
  echo "Server logs are in flask_backend/flask_server.log"
else
  echo "Failed to start Flask server. Check flask_backend/flask_server.log for details."
  cat flask_backend/flask_server.log
fi