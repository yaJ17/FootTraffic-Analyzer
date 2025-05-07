from flask import Flask, render_template, request, send_file, Response, jsonify
import os
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import cv2
import time
import json
from datetime import datetime
import numpy as np
import threading
from pytube import YouTube
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Define upload folder and allowed extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variables for video streaming
video_path = None
output_frame = None
processing_complete = False
video_initialization_error = None
current_stats = {
    "people_count": 0,
    "avg_dwell_time": 0,
    "location": "Not Set",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

def initialize_yolo():
    """Initialize YOLO model"""
    try:
        model = YOLO("yolo12l.pt")
        logger.info("YOLO model loaded successfully")
        return True
    except Exception as e:
        error_msg = f"Error loading YOLO model: {str(e)}"
        logger.error(error_msg)
        return False

def reset_stream():
    """Reset all stream-related variables"""
    global video_path, output_frame, processing_complete, current_stats, video_initialization_error
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
    return jsonify({"success": True})

@app.route('/api/stats')
def get_stats():
    """Return current video analysis stats"""
    return jsonify(current_stats)

@app.route('/api/stream-status')
def get_stream_status():
    """Return video stream initialization status"""
    return jsonify({
        "isReady": video_path is not None and video_initialization_error is None,
        "error": video_initialization_error,
        "videoPath": video_path
    })

@app.route('/')
def hello():
    return render_template('index.html')

def is_point_in_region(point, region):
    """Check if a point (x,y) is inside the counting region"""
    x, y = point
    rx1, ry1, rx2, ry2 = region
    return rx1 < x < rx2 and ry1 < y < ry2

def generate_frames():
    global video_path, output_frame, processing_complete
    
    if not video_path:
        return
    
    # Load YOLO model
    model = YOLO("yolo12l.pt")
    
    while True:  # Outer loop for video repetition
        # Initialize video capture
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return
            
        # Get video properties
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        # Calculate frame skip based on performance needs
        frame_skip = max(1, fps // 15)  # Target ~15 fps for detection
        frame_count = 0
        
        # Initialize stats exporter and other variables
        stats_exporter = StatsExporter()
        region_margin = 0.2
        region_x1 = int(frame_width * region_margin)
        region_x2 = int(frame_width * (1 - region_margin))
        region_y1 = int(frame_height * region_margin)
        region_y2 = int(frame_height * (1 - region_margin))
        counting_region = (region_x1, region_y1, region_x2, region_y2)
        
        dwell_times = {}
        people_per_second = {}
        people_in_region = set()
        start_time = time.time()
        last_detection = None
        
        while True:
            success, frame = cap.read()
            if not success:
                break
                
            frame_count += 1
            
            # Skip frames for performance, but still display them
            if frame_count % frame_skip != 0:
                # Convert frame to JPEG and yield without detection
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                continue
                
            current_time = time.time()
            elapsed_seconds = int(current_time - start_time)
            
            # Draw counting region
            cv2.rectangle(frame, (region_x1, region_y1), (region_x2, region_y2), (0, 255, 0), 2)
            cv2.putText(frame, "Counting Zone", (region_x1, region_y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Clear current frame's people in region
            people_in_region.clear()
            
            # Process frame with YOLO with optimized parameters
            results = model.track(
                source=frame,
                tracker="bytetrack.yaml",
                stream=True,
                iou=0.45,  # Slightly lower IOU threshold
                conf=0.35,
                imgsz=640,  # Reduce image size for processing
                verbose=False
            )
            
            # Store last detection results
            last_detection = next(results)
            
            if last_detection is not None:
                detections = last_detection.boxes
                people_detections = [box for box in detections if int(box.cls[0]) == 0 and box.conf[0] > 0.35]
                
                # Process detections and update stats
                for box in people_detections:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                    confidence = box.conf[0]
                    track_id = int(box.id[0]) if box.id is not None else None
                    
                    if track_id is None:
                        continue
                    
                    # Calculate center point
                    center_x = (x1 + x2) // 2
                    center_y = (y1 + y2) // 2
                    
                    # Check if person is in counting region
                    if is_point_in_region((center_x, center_y), counting_region):
                        people_in_region.add(track_id)
                        box_color = (0, 255, 0)  # Green for people in region
                        
                        # Initialize or update dwell times
                        if track_id not in dwell_times:
                            dwell_times[track_id] = {
                                "total_time": 0,
                                "sessions": [],
                                "current_session": {"start": current_time, "active": True}
                            }
                        else:
                            track_data = dwell_times[track_id]
                            if not track_data["current_session"]["active"]:
                                if track_data["current_session"]["start"] is not None:
                                    session_time = current_time - track_data["current_session"]["start"]
                                    track_data["sessions"].append(session_time)
                                    track_data["total_time"] += session_time
                                track_data["current_session"] = {"start": current_time, "active": True}
                            else:
                                track_data["current_session"]["active"] = True
                    else:
                        box_color = (255, 0, 0)  # Red for people outside region
                    
                    # Calculate current dwell time
                    if track_id in dwell_times:
                        track_data = dwell_times[track_id]
                        total_time = track_data["total_time"]
                        if track_data["current_session"]["active"]:
                            current_session_time = current_time - track_data["current_session"]["start"]
                            display_time = total_time + current_session_time
                        else:
                            display_time = total_time
                    else:
                        display_time = 0
                    
                    # Draw bounding box and label
                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                    label = f"ID: {track_id} | {confidence:.2f}"
                    if display_time > 0:
                        label += f" | Dwell: {display_time:.1f}s"
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)
                
                # Update stats display
                current_datetime = datetime.now()
                cv2.putText(frame, f"Location: {stats_exporter.location}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Date: {current_datetime.strftime('%m/%d/%Y')}", (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Day: {current_datetime.strftime('%A')}", (10, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"Time: {current_datetime.strftime('%H:%M:%S')}", (10, 120),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"People Count: {len(people_in_region)}", (10, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                cv2.putText(frame, f"FPS: {fps/frame_skip:.1f}", (10, 180),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                # Calculate average dwell time
                avg_dwell_time = 0
                if dwell_times:
                    total_dwell_time = 0
                    total_people = 0
                    for track_data in dwell_times.values():
                        time_sum = track_data["total_time"]
                        if track_data["current_session"]["active"]:
                            time_sum += current_time - track_data["current_session"]["start"]
                        total_dwell_time += time_sum
                        total_people += 1
                    avg_dwell_time = total_dwell_time / total_people if total_people > 0 else 0

                # Export stats if needed
                if stats_exporter.should_export(current_time):
                    stats_exporter.export_stats(len(people_in_region), avg_dwell_time)
            
            # Convert frame to JPEG format
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            # Yield the frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        cap.release()
        processing_complete = True

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

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

def process_youtube_stream(url):
    """Process a YouTube live stream URL to get the video stream"""
    try:
        yt = YouTube(url)
        if not yt.streams.filter(adaptive=True, file_extension='mp4').first():
            if not yt.streams.filter(progressive=True, file_extension='mp4').first():
                raise Exception("No valid video stream found")
            # Try progressive stream if adaptive is not available
            stream = yt.streams.filter(progressive=True, file_extension='mp4').first()
        else:
            # Get the highest quality adaptive stream
            stream = yt.streams.filter(adaptive=True, file_extension='mp4').first()
        
        if not stream:
            raise Exception("Could not find a suitable video stream")
            
        logger.info(f"Successfully found YouTube stream: {stream.title}")
        return stream.url
        
    except Exception as e:
        error_msg = str(e)
        if "Video unavailable" in error_msg:
            raise Exception("This video is unavailable. It might be private or removed.")
        elif "Age restricted" in error_msg:
            raise Exception("This video is age-restricted and cannot be accessed.")
        elif "private video" in error_msg.lower():
            raise Exception("This video is private and cannot be accessed.")
        elif "live stream" in error_msg.lower():
            raise Exception("Could not access live stream. Make sure the stream is active and public.")
        else:
            raise Exception(f"Failed to fetch YouTube video: {error_msg}")

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    """Handle YouTube live stream processing requests"""
    global video_path, processing_complete, current_stats
    
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"success": False, "error": "No URL provided"}), 400
        
        youtube_url = data['url']
        
        # Validate YouTube URL format
        if not ("youtube.com" in youtube_url or "youtu.be" in youtube_url):
            return jsonify({
                "success": False,
                "error": "Invalid YouTube URL. Please provide a valid YouTube video URL."
            }), 400
        
        # Reset stream before starting new one
        reset_stream()
        
        try:
            # Get the stream URL with timeout
            stream_url = process_youtube_stream(youtube_url)
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 400
        
        # Initialize model if not already done
        if not initialize_yolo():
            return jsonify({
                "success": False,
                "error": "Failed to initialize YOLO model"
            }), 500
        
        # Verify stream is accessible
        try:
            cap = cv2.VideoCapture(stream_url)
            if not cap.isOpened():
                raise Exception("Could not access video stream")
            ret, _ = cap.read()
            if not ret:
                raise Exception("Could not read from video stream")
            cap.release()
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to access video stream: {str(e)}"
            }), 400
        
        # Set the video path to the stream URL
        video_path = stream_url
        
        # Update current stats
        current_stats.update({
            "location": "YouTube Live Stream",
            "people_count": 0,
            "avg_dwell_time": 0,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        return jsonify({
            "success": True,
            "message": "YouTube stream processing started"
        })
        
    except Exception as e:
        error_msg = f"Error processing YouTube stream: {str(e)}"
        logger.error(error_msg)
        return jsonify({"success": False, "error": error_msg}), 500

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
