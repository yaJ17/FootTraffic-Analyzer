import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def start_flask_server(port=5001):
    """
    Start the Flask server for video processing
    Args:
        port: Port to run the Flask server on (default: 5001)
    """
    try:
        # Import the Flask app module directly
        import simple_video_app
        # Modify the port in the start_flask_server function
        simple_video_app.app.config['PORT'] = port
        logger.info(f"Starting Flask server for video processing on port {port}")
        simple_video_app.app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        logger.error(f"Error starting Flask server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Create required directories
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(templates_dir, exist_ok=True)
    
    # Get port from environment variable or use default
    port = int(os.environ.get('FLASK_PORT', 5001))
    logger.info(f"Using port {port} for Flask server")
    
    # Start the Flask server on the specified port
    start_flask_server(port)