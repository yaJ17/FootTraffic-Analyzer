from flask import Flask, render_template, request, jsonify, Response, send_file
import os
from flask_cors import CORS
import json
import time
import random
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for API endpoints

# Define upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize current stats with real values, not mock data
current_stats = {
    "people_count": 0,
    "avg_dwell_time": 0,
    "location": "Divisoria",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        return render_template('stream.html')
    return render_template('upload.html')

@app.route('/process_sample', methods=['POST'])
def process_sample():
    sample_video = request.form.get('sample_video')
    if sample_video:
        # In a real implementation, this would process the actual video
        update_mock_stats()
        return render_template('stream.html')
    return "No sample video specified"

@app.route('/video_feed')
def video_feed():
    """Video streaming route for demonstration"""
    def generate_frames():
        """Generate sample frames for demonstration (in lieu of actual video processing)"""
        video_files = {
            'palengke.mp4': os.path.join(UPLOAD_FOLDER, 'palengke.mp4'),
            'school.mp4': os.path.join(UPLOAD_FOLDER, 'school.mp4')
        }
        
        # Use a placeholder image or a default video
        placeholder_path = os.path.join(UPLOAD_FOLDER, 'palengke.mp4')
        for video_path in video_files.values():
            if os.path.exists(video_path):
                placeholder_path = video_path
                break
                
        try:
            import cv2
            cap = cv2.VideoCapture(placeholder_path)
            if not cap.isOpened():
                raise Exception(f"Could not open video: {placeholder_path}")
                
            while True:
                success, frame = cap.read()
                if not success:
                    # Loop back to beginning when video ends
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                    
                # Update stats occasionally
                if random.random() < 0.1:  # 10% chance each frame
                    update_mock_stats()
                    
                # Add some stats to the frame
                cv2.putText(frame, f"People Count: {current_stats['people_count']}", 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Avg Dwell Time: {current_stats['avg_dwell_time']} sec", 
                            (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Location: {current_stats['location']}", 
                            (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # Convert to jpeg
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                # Add a short delay to control the frame rate
                time.sleep(0.1)
        except Exception as e:
            logger.error(f"Error in video feed: {e}")
            # If there's an error, provide a fallback message
            fallback_message = f"Video processing error: {str(e)}"
            logger.error(fallback_message)
            
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats')
def get_stats():
    """API endpoint to get current statistics"""
    return jsonify(current_stats)

def start_flask_server():
    app.run(host='0.0.0.0', port=5001, debug=False)

if __name__ == '__main__':
    start_flask_server()