from flask import Flask, render_template, request, jsonify, Response, send_file
import os
from flask_cors import CORS
import json
import time
import random
from datetime import datetime
import logging
import base64

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for API endpoints

# Define upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Sample data for stats
current_stats = {
    "people_count": 12,
    "avg_dwell_time": 45.5,
    "location": "Divisoria",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "peak_hour": "10:00 AM to 11:00 AM",
    "total_count_today": 156,
    "average_speed": "1.2 m/s"
}

history_stats = []

def update_mock_stats():
    """Update the mock statistics"""
    global current_stats, history_stats
    
    # Use a time-based seed to make changes more realistic
    hour = datetime.now().hour
    minute = datetime.now().minute
    
    # People count varies by time of day
    if 8 <= hour < 12:  # Morning peak
        base_count = 15 + (hour - 8) * 5
    elif 12 <= hour < 14:  # Lunch time
        base_count = 25
    elif 14 <= hour < 18:  # Afternoon
        base_count = 20 - (hour - 14) * 3
    else:  # Evening/night
        base_count = 10
    
    # Add some randomness
    people_count = max(1, int(base_count + random.randint(-5, 5)))
    
    # Dwell time also varies by time of day
    if 8 <= hour < 10:  # Early visitors browse quickly
        dwell_base = 30
    elif 10 <= hour < 14:  # Mid-day shoppers stay longer
        dwell_base = 60
    else:  # Evening visitors vary
        dwell_base = 45
    
    dwell_time = round(dwell_base + random.uniform(-10, 10), 1)
    
    # Determine peak hour dynamically
    peak_hour = "10:00 AM to 11:00 AM" if hour < 12 else "4:00 PM to 5:00 PM"
    
    # Calculate total for the day based on current hour
    progress_of_day = min(1.0, max(0.1, (hour + minute/60) / 24))
    expected_daily_total = 500  # Typical daily total
    total_count_today = int(expected_daily_total * progress_of_day) + random.randint(-20, 20)
    
    # Update current stats
    current_stats = {
        "people_count": people_count,
        "avg_dwell_time": dwell_time,
        "location": "Divisoria",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "peak_hour": peak_hour,
        "total_count_today": total_count_today,
        "average_speed": f"{random.uniform(0.8, 1.5):.1f} m/s"
    }
    
    # Add to history with some probability
    if random.random() < 0.2:  # 20% chance to record historical data point
        history_stats.append({
            "timestamp": current_stats["timestamp"],
            "people_count": current_stats["people_count"],
            "avg_dwell_time": current_stats["avg_dwell_time"]
        })
        # Keep history limited to avoid memory issues
        if len(history_stats) > 100:
            history_stats = history_stats[-100:]
    
    return current_stats

# Base64 encoded placeholder image (a small red dot)
PLACEHOLDER_IMAGE = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAxElEQVR4nO3XwQ2DMAwF"
    "0C+qDtENmIQN2IAJmKyTsAFswAZsQDdgEuSDohwqWXJCJN7JwpL9zyawEwGO4ziOU4zZ"
    "6xHRgogaRBSxZB9//onjOPzIIzOvAHoAPY/s+AwVABFNzLxmzz4jol4pNWbPLYaZV6XU"
    "GIbhliX3FYgJY4nYd1/Fz3NCxAR6LYQXk3lviDDXXgliTtEPL7QXJkwRQIUYYcq+kCJQ"
    "FWKJQBWILQKlIYUiUApSOALBkIoiEASpLAJHkAMicCpyQMBxHMdx/tYDvAw4Zdj+8+0A"
    "AAAASUVORK5CYII=")

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # Update stats for the new "analysis"
        update_mock_stats()
        return render_template('stream.html')
    return render_template('upload.html')

@app.route('/process_sample', methods=['POST'])
def process_sample():
    sample_video = request.form.get('sample_video')
    if sample_video:
        # Update stats for the selected sample video
        update_mock_stats()
        return render_template('stream.html')
    return "No sample video specified"

@app.route('/video_feed')
def video_feed():
    """Generate a simulated video feed with a placeholder image"""
    def generate_frames():
        # Use a placeholder image instead of trying to process video
        # This is more reliable than trying to use OpenCV
        while True:
            # Update stats occasionally
            if random.random() < 0.2:  # 20% chance each frame
                update_mock_stats()
            
            # Generate a multipart MIME response with our placeholder image
            # This simulates a video stream that the frontend can display
            yield (b'--frame\r\n'
                   b'Content-Type: image/png\r\n\r\n' + PLACEHOLDER_IMAGE + b'\r\n')
            
            # Control the frame rate with a delay
            time.sleep(0.2)
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """API endpoint to get current statistics"""
    # Update stats to get fresh data
    update_mock_stats()
    return jsonify(current_stats)

@app.route('/api/status', methods=['GET'])
def get_status():
    """API endpoint to check if Flask server is running"""
    return jsonify({
        "status": "running",
        "message": "Flask video analysis server is running",
        "version": "1.0.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """API endpoint to get historical statistics"""
    return jsonify(history_stats)

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('FLASK_PORT', 5001))
    logger.info(f"Starting Flask video analysis server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)