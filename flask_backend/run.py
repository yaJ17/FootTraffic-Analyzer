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
    
    # Set the port environment variable
    os.environ["PORT"] = port
    
    # Get the path to the simple_server.py script
    server_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simple_server.py")
    
    if not os.path.exists(server_script):
        print(f"Error: {server_script} does not exist!")
        sys.exit(1)
    
    # Start the server as a subprocess
    try:
        subprocess.run([sys.executable, server_script], check=True)
    except subprocess.SubprocessError as e:
        print(f"Error running Flask server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("Flask server stopped by user")
        sys.exit(0)

if __name__ == "__main__":
    setup_environment()
    start_flask_server()