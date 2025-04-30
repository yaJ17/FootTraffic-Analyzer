import sys
import os
import subprocess
import time
import signal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def start_flask_server():
    """
    Start the Flask server for video processing
    """
    try:
        from modified_video_app import start_flask_server
        logger.info("Starting Flask server for video processing")
        start_flask_server()
    except Exception as e:
        logger.error(f"Error starting Flask server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Create required directories
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Start the Flask server
    start_flask_server()