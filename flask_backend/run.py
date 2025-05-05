import os
import sys
import time
import subprocess
import threading

def setup_environment():
    """Create necessary directories if they don't exist"""
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("templates", exist_ok=True)
    
    # Copy sample videos if they don't exist
    sample_videos = ["palengke.mp4", "school.mp4"]
    for video in sample_videos:
        source_path = f"../attached_assets/{video}"
        dest_path = f"uploads/{video}"
        if os.path.exists(source_path) and not os.path.exists(dest_path):
            print(f"Copying {source_path} to {dest_path}")
            try:
                with open(source_path, 'rb') as src, open(dest_path, 'wb') as dst:
                    dst.write(src.read())
            except Exception as e:
                print(f"Error copying video: {e}")

def start_flask_server():
    """Start the Flask server for video processing"""
    port = os.environ.get("PORT", "5003")
    print(f"Starting Flask server on port {port}")
    
    # Import and run the simple_server directly
    os.environ["PORT"] = port
    
    # Add directory to path to ensure imports work
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        import simple_server
        # The server will start automatically due to the if __name__ == '__main__' block
    except Exception as e:
        print(f"Error starting Flask server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_environment()
    start_flask_server()