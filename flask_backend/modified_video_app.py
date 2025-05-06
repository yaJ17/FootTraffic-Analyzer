from flask import Flask, render_template, request, send_file, Response, jsonify
import os
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import cv2
import time
import json
from datetime import datetime
import numpy as np
from flask_cors import CORS
import threading
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for API endpoints

# Define upload folder and allowed extensions
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variables for video streaming
video_path = None
output_frame = None
processing_complete = False
stream_lock = threading.Lock()  # Add lock for thread safety
current_stats = {
    "people_count": 0,
    "avg_dwell_time": 0,
    "location": "Divisoria",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}
video_initialization_error = None
model = None

def initialize_yolo():
    global model, video_initialization_error
    try:
        model = YOLO("yolo12l.pt")
        logger.info("YOLO model loaded successfully")
        return True
    except Exception as e:
        error_msg = f"Error loading YOLO model: {str(e)}"
        logger.error(error_msg)
        video_initialization_error = error_msg
        return False

def initialize_video(video_file):
    global video_path, video_initialization_error
    try:
        cap = cv2.VideoCapture(video_file)
        if not cap.isOpened():
            raise Exception(f"Could not open video file: {video_file}")
        
        # Get video properties
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        cap.release()
        video_path = video_file
        video_initialization_error = None
        logger.info(f"Video initialized: {video_file}, {frame_width}x{frame_height} @ {fps}fps")
        return True
    except Exception as e:
        error_msg = f"Error initializing video: {str(e)}"
        logger.error(error_msg)
        video_initialization_error = error_msg
        return False

# Stats exporter class remains unchanged
class StatsExporter:
    def __init__(self, location="Divisoria", filename="tracking_statistics.json"):
        self.location = location
        self.last_export_time = time.time()
        self.export_interval = 10  # Export every 10 seconds
        self.filename = filename
        
        # Initialize or load existing stats file
        if not os.path.exists(self.filename):
            self.all_stats = {"records": []}
            self._save_stats()
        else:
            with open(self.filename, 'r') as f:
                self.all_stats = json.load(f)
                if "records" not in self.all_stats:
                    self.all_stats["records"] = []
    
    def should_export(self, current_time):
        return (current_time - self.last_export_time) >= self.export_interval
    
    def export_stats(self, people_count, avg_dwell_time):
        current_datetime = datetime.now()
        
        new_stats = {
            "location": self.location,
            "date": current_datetime.strftime("%m/%d/%Y"),
            "day": current_datetime.strftime("%A"),
            "time": current_datetime.strftime("%H:%M:%S"),
            "timestamp": current_datetime.strftime("%Y%m%d_%H%M%S"),
            "people_count": people_count,
            "average_dwell_time": round(avg_dwell_time, 2) if avg_dwell_time else 0
        }
        
        self.all_stats["records"].append(new_stats)
        self._save_stats()
        self.last_export_time = time.time()
        
        # Update global current stats
        global current_stats
        current_stats = {
            "people_count": people_count,
            "avg_dwell_time": round(avg_dwell_time, 2) if avg_dwell_time else 0,
            "location": self.location,
            "timestamp": current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return self.filename
    
    def _save_stats(self):
        os.makedirs(os.path.dirname(self.filename) if os.path.dirname(self.filename) else '.', exist_ok=True)
        with open(self.filename, 'w') as f:
            json.dump(self.all_stats, f, indent=4)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def hello():
    return render_template('index.html')

def is_point_in_region(point, region):
    """Check if a point (x,y) is inside the counting region"""
    x, y = point
    rx1, ry1, rx2, ry2 = region
    return rx1 < x < rx2 and ry1 < y < ry2

def reset_stream():
    """Reset all stream-related variables"""
    global video_path, output_frame, processing_complete, current_stats, video_initialization_error
    with stream_lock:
        video_path = None
        output_frame = None
        processing_complete = False
        video_initialization_error = None
        current_stats.update({
            "people_count": 0,
            "avg_dwell_time": 0,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

@app.route('/stop_stream', methods=['POST'])
def stop_stream():
    """Stop the current video stream"""
    reset_stream()
    return jsonify({"success": True, "message": "Stream stopped successfully"})

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    # Get timestamp from query params to prevent caching
    _ = request.args.get('t', '')
    
    if not video_path:
        return Response("No video selected", status=404)
    try:
        return Response(generate_frames(),
                      mimetype='multipart/x-mixed-replace; boundary=frame',
                      headers={
                          'Cache-Control': 'no-cache, no-store, must-revalidate',
                          'Pragma': 'no-cache',
                          'Expires': '0'
                      })
    except Exception as e:
        logger.error(f"Error in video feed: {e}")
        return Response("Error in video feed", status=500)

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    global video_path, processing_complete
    
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part'
        file = request.files['file']
        if file.filename == '':
            return 'No selected file'
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Set the video path for streaming
            video_path = file_path
            processing_complete = False
            
            # Redirect to the streaming page
            return render_template('stream.html')
    
    return render_template('upload.html')

@app.route('/api/stream-status', methods=['GET'])
def get_stream_status():
    """API endpoint to get video stream initialization status"""
    global video_initialization_error
    return jsonify({
        "isReady": video_path is not None and video_initialization_error is None,
        "error": video_initialization_error,
        "videoPath": video_path
    })

@app.route('/process_sample', methods=['POST'])
def process_sample():
    global video_path, processing_complete, current_stats, video_initialization_error
    
    sample_video = request.form.get('sample_video')
    if sample_video:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], sample_video)
        if os.path.isfile(file_path):
            # Reset stream before starting new one
            reset_stream()
            
            # Update location based on video
            location = "School Entrance" if "school" in sample_video.lower() else "Palengke Market"
            
            # Initialize model if not already done
            if model is None and not initialize_yolo():
                return jsonify({
                    "success": False,
                    "error": video_initialization_error
                }), 500
            
            # Initialize video
            if not initialize_video(file_path):
                return jsonify({
                    "success": False,
                    "error": video_initialization_error
                }), 500
            
            # Set the new video path
            video_path = file_path
            
            # Update current stats
            current_stats.update({
                "location": location,
                "people_count": 0,
                "avg_dwell_time": 0,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            return jsonify({
                "success": True,
                "message": f"Video processing started: {sample_video}",
                "location": location
            })
        else:
            return jsonify({"success": False, "error": f"Sample video not found: {sample_video}"}), 404
    
    return jsonify({"success": False, "error": "No sample video specified"}), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """API endpoint to get current statistics"""
    global current_stats
    return jsonify(current_stats)

@app.route('/download_stats', methods=['GET'])
def download_stats():
    """Download the statistics JSON file"""
    stats_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracking_statistics.json")
    if os.path.exists(stats_file):
        return send_file(stats_file, as_attachment=True)
    else:
        return "No statistics file found"

def generate_frames():
    """Generate video frames with processing"""
    global video_path, output_frame, current_stats
    
    if not video_path:
        return
        
    try:
        # Initialize video capture for current video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Error opening video file: {video_path}")
            return

        # Initialize stats exporter
        location = "School Entrance" if "school" in video_path.lower() else "Palengke Market"
        stats_exporter = StatsExporter(location=location)
        
        # Variables for tracking
        frame_count = 0
        total_people = 0
        dwell_times = []
        last_export_time = time.time()
        
        while True:
            # Check if video path has changed
            current_video = video_path
            if not current_video:
                logger.info("Video stream stopped")
                break
                
            success, frame = cap.read()
            if not success:
                # Loop back to beginning when video ends
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            frame_count += 1
            
            try:
                # Process frame with YOLO
                results = model(frame, conf=0.3)
                
                # Draw boxes and get people count
                people_in_frame = 0
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        # Only count person class (usually class 0)
                        if box.cls == 0:  # person class
                            people_in_frame += 1
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                
                # Update statistics
                total_people += people_in_frame
                avg_people = total_people / frame_count if frame_count > 0 else 0
                
                # Calculate mock dwell time (simplified)
                if people_in_frame > 0:
                    dwell_times.append(random.uniform(30, 120))
                avg_dwell_time = sum(dwell_times) / len(dwell_times) if dwell_times else 0
                
                # Export stats periodically
                current_time = time.time()
                if current_time - last_export_time >= 3:  # Export every 3 seconds
                    stats_exporter.export_stats(people_in_frame, avg_dwell_time)
                    last_export_time = current_time
                
                # Add timestamp and stats to frame
                cv2.putText(frame, f"People Count: {people_in_frame}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Avg Dwell Time: {int(avg_dwell_time)}s", 
                           (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Location: {location}", 
                           (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # Convert to jpeg
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                
                # Check if video path has changed before yielding frame
                if current_video != video_path:
                    logger.info("Video changed, stopping current stream")
                    break
                    
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                continue
                
            # Add a small delay to control frame rate
            time.sleep(0.03)  # ~30fps
            
    except Exception as e:
        logger.error(f"Error in generate_frames: {e}")
    finally:
        if 'cap' in locals():
            cap.release()

def start_flask_server():
    """Start the Flask server"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(host='0.0.0.0', port=5001, debug=False)

if __name__ == '__main__':
    start_flask_server()