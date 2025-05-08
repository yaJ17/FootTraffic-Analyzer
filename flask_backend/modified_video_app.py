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
import yt_dlp
from urllib.parse import urlparse, parse_qs
from video_face_recognition import VideoFaceRecognition

location = None
frame_count = None
face_recognition_active = False
face_recognition_system = None

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Initialize face recognition system
try:
    face_recognition_system = VideoFaceRecognition()
    logger.info("Face recognition system initialized successfully")
except Exception as e:
    logger.error(f"Error initializing face recognition system: {e}")
    face_recognition_system = None

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
    "highest_dwell_time": 0,
    "location": "Divisoria",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}
video_initialization_error = None
model = None
current_video_title = None

def initialize_yolo():
    global model, video_initialization_error
    try:
        model = YOLO("model.pt")
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
        self.export_interval = 3 
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
            "highest_dwell_time": current_stats["highest_dwell_time"],
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
    global video_path, output_frame, processing_complete, current_stats, video_initialization_error, current_video_title
    with stream_lock:
        video_path = None
        output_frame = None
        processing_complete = False
        video_initialization_error = None
        current_video_title = None
        current_stats.update({
            "people_count": 0,
            "avg_dwell_time": 0,
            "highest_dwell_time": 0,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "location": ""
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
        # Initialize video capture to check if stream is accessible
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open video: {video_path}")
            return Response("Could not open video stream", status=500)
            
        # Release the test capture
        cap.release()
        
        return Response(
            generate_frames(),
            mimetype='multipart/x-mixed-replace; boundary=frame',
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Access-Control-Allow-Origin': '*'  # Add CORS header
            }
        )
    except Exception as e:
        logger.error(f"Error in video feed: {e}")
        return Response(f"Error in video feed: {str(e)}", status=500)

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
    global video_path, processing_complete, current_stats, video_initialization_error, current_video_title
    
    sample_video = request.form.get('sample_video')
    if sample_video:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], sample_video)
        if os.path.isfile(file_path):
            # Reset stream before starting new one
            reset_stream()
            
            # Update location based on video
            location = "School Entrance" if "school" in sample_video.lower() else "Palengke Market"
            current_video_title = location
            
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
                "highest_dwell_time": 0,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            logger.info(f"Sample video processing: {sample_video}, location set to: {location}")
            
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
    global current_stats, current_video_title
    
    # Ensure location is consistent with current video source
    if video_path and "youtube" not in str(video_path).lower() and current_video_title:
        current_stats["location"] = current_video_title
        
    return jsonify({
        "success": True,
        "stats": current_stats
    })

@app.route('/download_stats', methods=['GET'])
def download_stats():
    """Download the statistics JSON file"""
    stats_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracking_statistics.json")
    if os.path.exists(stats_file):
        return send_file(stats_file, as_attachment=True)
    else:
        return "No statistics file found"

def calculate_average_dwell_time(dwell_times, current_time):
    """Calculate average dwell time from all tracked people"""
    if not dwell_times:
        return 0, 0
        
    total_dwell_time = 0
    total_sessions = 0
    highest_dwell_time = 0
    
    # Track if we have any completed sessions
    has_completed_sessions = False
    
    for track_data in dwell_times.values():
        # Only consider sessions for people currently in the region
        if track_data["current_session"]["active"]:
            current_session_duration = current_time - track_data["current_session"]["start"]
            total_dwell_time += current_session_duration
            total_sessions += 1
            highest_dwell_time = max(highest_dwell_time, current_session_duration)
        
        # Add completed sessions
        for session in track_data["sessions"]:
            total_dwell_time += session["duration"]
            total_sessions += 1
            highest_dwell_time = max(highest_dwell_time, session["duration"])
            has_completed_sessions = True
    
    # Calculate average, ensuring we don't divide by zero
    if total_sessions > 0:
        avg_dwell_time = total_dwell_time / total_sessions
    else:
        # If we had people before but none now, keep the highest dwell time but set avg to 0
        avg_dwell_time = 0
        
    # If we have no current sessions but have historical data, preserve the highest value
    if total_sessions == 0 and not has_completed_sessions:
        # No data at all, both current and historical
        highest_dwell_time = 0
    
    return avg_dwell_time, highest_dwell_time

def draw_stats_overlay(frame, people_count, avg_dwell_time, highest_dwell_time, current_fps):
    """Draw statistics overlay on the frame"""
    current_datetime = datetime.now()
    
    # Draw the counting region with semi-transparent fill
    height, width = frame.shape[:2]
    region_margin = 0.2
    region_x1 = int(width * region_margin)
    region_x2 = int(width * (1 - region_margin))
    region_y1 = int(height * region_margin)
    region_y2 = int(height * (1 - region_margin))
    
    # Create overlay for the counting region
    overlay = frame.copy()
    cv2.rectangle(overlay, (region_x1, region_y1), (region_x2, region_y2), (0, 255, 0), 2)  # Green border
    cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
    
    # Draw stats with semi-transparent background
    stats_overlay = frame.copy()
    stats_height = 230  # Increased height to accommodate new stat
    cv2.rectangle(stats_overlay, (5, 5), (300, stats_height), (0, 0, 0), -1)
    cv2.addWeighted(stats_overlay, 0.3, frame, 0.7, 0, frame)
    
    # Draw text
    text_color = (255, 255, 255)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(frame, f"FPS: {current_fps:.1f}", (10, 180), font, 0.7, text_color, 2)
def generate_frames():
    """Generate video frames with person detection"""
    global video_path, output_frame, processing_complete, current_stats, frame_count, face_recognition_active
    
    if not video_path:
        return
    
    try:
        # Initialize frame counter
        frame_count = 0
        
        # Load YOLO model
        model = YOLO("model.pt")
        logger.info(f"YOLO model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading YOLO model: {e}")
        return
    
    last_frame = None
    reconnect_attempts = 0
    consecutive_failures = 0
    max_reconnect_attempts = 5
    max_consecutive_failures = 3
    
    while True:
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                logger.error(f"Error opening video file: {video_path}")
                return
            
            reconnect_attempts = 0
            consecutive_failures = 0
            
            # Optimize frame processing
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            logger.info(f"Video opened: {video_path}, {frame_width}x{frame_height} @ {fps}fps")
            
            # Calculate optimal frame skip based on input fps
            target_fps = 20  # Target processing FPS
            frame_skip = max(1, int(fps / target_fps))
            
            # Calculate optimal resize resolution while maintaining aspect ratio
            max_dimension = 640  # Maximum dimension for processing
            scale = min(max_dimension / frame_width, max_dimension / frame_height)
            process_width = int(frame_width * scale)
            process_height = int(frame_height * scale)
            
            stats_exporter = StatsExporter(location)
            region_margin = 0.2
            region_x1 = int(frame_width * region_margin)
            region_x2 = int(frame_width * (1 - region_margin))
            region_y1 = int(frame_height * region_margin)
            region_y2 = int(frame_height * (1 - region_margin))
            counting_region = (region_x1, region_y1, region_x2, region_y2)
            
            dwell_times = {}
            people_in_region = set()
            start_time = time.time()
            
            while True:
                success, frame = cap.read()
                if not success:
                    consecutive_failures += 1
                    logger.warning(f"Frame read failed. Consecutive failures: {consecutive_failures}")
                    
                    if consecutive_failures >= max_consecutive_failures:
                        if "youtube" in str(video_path).lower():
                            logger.info("YouTube stream failed, attempting to reconnect...")
                            cap.release()
                            time.sleep(2)
                            break
                        else:
                            break
                    continue
                
                consecutive_failures = 0
                frame_count += 1
                
                try:
                    if frame_count % frame_skip == 0:
                        last_frame = frame.copy()
                        
                        # Process frame with YOLO
                        results = model.track(
                            source=frame,
                            tracker="bytetrack.yaml",
                            stream=True,
                            iou=0.45,
                            conf=0.35,
                            imgsz=640,
                            verbose=False
                        )
                        
                        last_detection = next(results)
                        display_frame = frame.copy()
                        
                        if last_detection is not None:
                            detections = last_detection.boxes
                            people_detections = [box for box in detections if int(box.cls[0]) == 0 and box.conf[0] > 0.35]
                            
                            people_in_region.clear()
                            current_time = time.time()
                            
                            # Process face recognition if active
                            if face_recognition_active and face_recognition_system:
                                try:
                                    faces = face_recognition_system.face_app.get(display_frame)
                                    for face in faces:
                                        bbox = face.bbox.astype(int)
                                        embedding = face.embedding
                                        
                                        # Try to recognize the face
                                        name, family, similarity = face_recognition_system.recognize_face(embedding)
                                        
                                        # Draw face bounding box
                                        cv2.rectangle(display_frame, 
                                                    (bbox[0], bbox[1]), 
                                                    (bbox[2], bbox[3]), 
                                                    (255, 0, 0), 2)  # Blue for faces
                                        
                                        # Add text for name and confidence
                                        label = f"{name if name else 'Unknown'}"
                                        if similarity > 0:
                                            label += f" ({similarity:.2f})"
                                        cv2.putText(display_frame, label, 
                                                  (bbox[0], bbox[1] - 10),
                                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                                                  (255, 0, 0), 2)
                                except Exception as e:
                                    logger.error(f"Error in face recognition: {e}")
                            
                            for box in people_detections:
                                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                                track_id = int(box.id[0]) if box.id is not None else None
                                
                                if track_id is None:
                                    continue
                                
                                center_x = (x1 + x2) // 2
                                center_y = (y1 + y2) // 2
                                
                                if is_point_in_region((center_x, center_y), counting_region):
                                    people_in_region.add(track_id)
                                    
                                    if track_id not in dwell_times:
                                        dwell_times[track_id] = {
                                            "total_time": 0,
                                            "sessions": [],
                                            "current_session": {"start": current_time, "active": True}
                                        }
                                    elif not dwell_times[track_id]["current_session"]["active"]:
                                        dwell_times[track_id]["current_session"] = {"start": current_time, "active": True}
                                    
                                    # Draw green box for people in region
                                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                else:
                                    if track_id in dwell_times and dwell_times[track_id]["current_session"]["active"]:
                                        session = dwell_times[track_id]["current_session"]
                                        duration = current_time - session["start"]
                                        dwell_times[track_id]["sessions"].append({
                                            "start": session["start"],
                                            "end": current_time,
                                            "duration": duration
                                        })
                                        dwell_times[track_id]["current_session"]["active"] = False
                                    
                                    # Draw red box for people outside region
                                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            
                            # Calculate and update stats
                            avg_dwell_time, highest_dwell_time = calculate_average_dwell_time(dwell_times, current_time)
                            
                            # Update current_stats with real detection data
                            current_stats.update({
                                "people_count": len(people_in_region),
                                "avg_dwell_time": round(avg_dwell_time, 2),
                                "highest_dwell_time": round(highest_dwell_time, 2),
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            })
                            
                            # Draw stats overlay
                            draw_stats_overlay(display_frame, len(people_in_region), avg_dwell_time, highest_dwell_time, fps/frame_skip)
                            
                            # Export stats if needed
                            if stats_exporter.should_export(current_time):
                                stats_exporter.export_stats(len(people_in_region), avg_dwell_time)
                        
                        last_frame = display_frame
                    else:
                        display_frame = last_frame if last_frame is not None else frame
                    
                    ret, buffer = cv2.imencode('.jpg', display_frame)
                    if not ret:
                        continue
                    
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    
                except Exception as e:
                    logger.error(f"Error processing frame: {e}")
                    if last_frame is not None:
                        ret, buffer = cv2.imencode('.jpg', last_frame)
                        if ret:
                            frame_bytes = buffer.tobytes()
                            yield (b'--frame\r\n'
                                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            cap.release()
            
        except Exception as e:
            logger.error(f"Error in video processing: {e}")
            time.sleep(1)

def start_flask_server():
    """Start the Flask server"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(host='0.0.0.0', port=5001, debug=False)

def get_youtube_video_url(youtube_url):
    """Extract the video URL and title from a YouTube URL"""
    try:
        # Configure yt-dlp options with more formats and better error handling
        ydl_opts = {
            'format': 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'no_playlist': True,
            'socket_timeout': 30,
        }
        
        logger.info(f"Attempting to extract YouTube video info from: {youtube_url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(youtube_url, download=False)
                video_title = info.get('title', 'Unknown Title')
                logger.info(f"Successfully extracted video info: {video_title}")
                
                # Get the best format URL with more detailed logging
                if 'url' in info:
                    video_url = info['url']
                    format_id = info.get('format_id', 'unknown')
                    logger.info(f"Using direct URL from format {format_id}")
                else:
                    formats = info.get('formats', [])
                    # Filter for MP4 formats and sort by quality
                    mp4_formats = [f for f in formats if f.get('ext') == 'mp4' and f.get('acodec') != 'none']
                    if mp4_formats:
                        selected_format = mp4_formats[-1]
                        video_url = selected_format['url']
                        logger.info(f"Selected MP4 format: {selected_format.get('format_id')} - {selected_format.get('format_note', 'unknown quality')}")
                    else:
                        # If no MP4, try to get any format that has both video and audio
                        valid_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('vcodec') != 'none']
                        if valid_formats:
                            selected_format = valid_formats[-1]
                            video_url = selected_format['url']
                            logger.info(f"Fallback format: {selected_format.get('format_id')} - {selected_format.get('ext')} - {selected_format.get('format_note', 'unknown quality')}")
                        else:
                            raise Exception("No suitable video format found")

                # Verify the URL is accessible
                logger.info("Verifying video URL accessibility...")
                cap = cv2.VideoCapture(video_url)
                if not cap.isOpened():
                    raise Exception("Could not open video stream")
                ret, frame = cap.read()
                if not ret:
                    raise Exception("Could not read from video stream")
                cap.release()
                logger.info("Video URL verified successfully")
                
                return video_url, video_title
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error processing YouTube URL: {error_msg}")
                if "Private video" in error_msg:
                    raise Exception("This video is private and cannot be accessed")
                elif "Sign in" in error_msg:
                    raise Exception("This video requires authentication")
                elif "not available" in error_msg.lower():
                    raise Exception("This video is not available. It might be private, removed, or region-restricted")
                elif "live stream" in error_msg.lower():
                    raise Exception("Could not access live stream. Please ensure the stream is active and public.")
                else:
                    raise Exception(f"Failed to process video: {error_msg}")
    except Exception as e:
        logger.error(f"Error extracting YouTube URL: {str(e)}")
        raise

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    parsed_url = urlparse(url)
    if parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:]
    if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
        if 'watch' in parsed_url.path:
            return parse_qs(parsed_url.query)['v'][0]
        elif 'embed' in parsed_url.path:
            return parsed_url.path.split('/')[-1]
    return None

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    """Handle YouTube video processing requests"""
    global video_path, processing_complete, current_stats, current_video_title
    
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"success": False, "error": "No URL provided"}), 400
        
        youtube_url = data['url']
        video_id = extract_video_id(youtube_url)
        
        if not video_id:
            return jsonify({
                "success": False,
                "error": "Invalid YouTube URL format"
            }), 400
        
        try:
            # Get the video stream URL and title
            video_url, video_title = get_youtube_video_url(youtube_url)
            
            # If just fetching title (no stream initialization needed)
            if 'fetchTitleOnly' in data and data['fetchTitleOnly']:
                return jsonify({
                    "success": True,
                    "title": video_title
                })
            
            # Reset stream before starting new one
            reset_stream()
            
            # Set the YouTube title
            current_video_title = video_title
            
            # Verify stream is accessible
            cap = cv2.VideoCapture(video_url)
            if not cap.isOpened():
                raise Exception("Could not access video stream")
            ret, frame = cap.read()
            if not ret:
                raise Exception("Could not read from video stream")
            cap.release()
            
            # Initialize model if not already done
            if model is None and not initialize_yolo():
                return jsonify({
                    "success": False,
                    "error": "Failed to initialize YOLO model"
                }), 500
            
            # Set the video path to the stream URL
            video_path = video_url
            
            # Update current stats
            current_stats.update({
                "location": f"YouTube Stream: {video_title}",
                "people_count": 0,
                "avg_dwell_time": 0,
                "highest_dwell_time": 0,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            logger.info(f"YouTube stream processing: URL={youtube_url}, title={video_title}")
            
            return jsonify({
                "success": True,
                "message": "YouTube stream processing started",
                "title": video_title
            })
            
        except Exception as e:
            error_msg = str(e)
            if "unavailable" in error_msg.lower():
                error_msg = "This video is unavailable. It might be private or removed."
            elif "age restricted" in error_msg.lower():
                error_msg = "This video is age-restricted and cannot be accessed."
            elif "private" in error_msg.lower():
                error_msg = "This video is private and cannot be accessed."
            
            return jsonify({
                "success": False,
                "error": error_msg
            }), 400
            
    except Exception as e:
        error_msg = f"Error processing YouTube stream: {str(e)}"
        logger.error(error_msg)
        return jsonify({"success": False, "error": error_msg}), 500

@app.route('/toggle_face_recognition', methods=['POST'])
def toggle_face_recognition():
    """Toggle face recognition on/off"""
    global face_recognition_active
    try:
        data = request.get_json()
        if data and 'active' in data:
            face_recognition_active = data['active']
            return jsonify({
                "success": True,
                "message": "Face recognition " + ("activated" if face_recognition_active else "deactivated"),
                "active": face_recognition_active
            })
    except Exception as e:
        logger.error(f"Error toggling face recognition: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    start_flask_server()