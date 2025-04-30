import subprocess
import sys
import time
import os

def start_mongodb():
    """
    Start MongoDB server if it's not already running
    """
    try:
        # Check if MongoDB is already running
        mongo_check = subprocess.run(
            ["pgrep", "-x", "mongod"], 
            capture_output=True, 
            text=True
        )
        
        if mongo_check.returncode != 0:
            print("Starting MongoDB server...")
            # Start MongoDB in the background
            subprocess.Popen(
                ["mongod", "--dbpath", "./data/db"], 
                stdout=subprocess.DEVNULL,
                stderr=subprocess.STDOUT
            )
            print("Waiting for MongoDB to start...")
            time.sleep(3)  # Wait for MongoDB to start
        else:
            print("MongoDB is already running")
    except Exception as e:
        print(f"Error starting MongoDB: {e}")
        print("Warning: MongoDB may not be available. Will continue anyway.")

def create_mongodb_dirs():
    """
    Create directories for MongoDB if they don't exist
    """
    os.makedirs("./data/db", exist_ok=True)

def start_flask():
    """
    Start the Flask application
    """
    print("Starting Flask backend on port 5001...")
    from app import app
    app.run(host='0.0.0.0', port=5001, debug=True)

if __name__ == "__main__":
    # Create required directories
    create_mongodb_dirs()
    
    # Start MongoDB server
    start_mongodb()
    
    # Start Flask app
    start_flask()