"""
Test YouTube streaming feature
This script tests the YouTube streaming functionality without running the full app
"""
from flask import Flask, render_template, request, Response, jsonify, render_template_string
import os
import cv2
import time
import json
from datetime import datetime
import numpy as np
from flask_cors import CORS
import threading
import logging
from pytube import YouTube
from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS with more specific settings
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Global variables for video streaming
video_path = None
current_frame = None
stream_active = False
stats = {
    "people_count": 0,
    "avg_dwell_time": 0,
    "location": "YouTube Stream",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

def get_youtube_stream(youtube_url):
    """
    Get a video stream from a YouTube URL without downloading
    """
    global video_path, stream_active
    
    try:
        logger.info(f"Getting video stream from YouTube URL: {youtube_url}")
        
        # Extract video ID for better location naming
        video_id = youtube_url.split("watch?v=")[-1].split("&")[0]
        
        # Use pytube to get the stream URL
        yt = YouTube(youtube_url)
        streams = yt.streams.filter(progressive=True, file_extension='mp4')
        
        if not streams:
            logger.error("No suitable streams found for this YouTube video")
            return False, "No suitable streams found for this YouTube video"
        
        # Get the lowest resolution for better performance
        video_stream = streams.order_by('resolution').first()
        if not video_stream:
            logger.error("Could not get a stream for this YouTube video")
            return False, "Could not get a stream for this YouTube video"
        
        # Set the video URL (OpenCV can stream directly from URLs)
        video_path = video_stream.url
        
        # Update location name with YouTube info
        location_name = f"YouTube: {yt.title[:30]}"
        stats["location"] = location_name
        
        # Set stream as active
        stream_active = True
        
        logger.info(f"Successfully connected to YouTube stream: {location_name}")
        return True, location_name
    
    except Exception as e:
        logger.error(f"Error getting YouTube stream: {e}")
        return False, f"Error: {str(e)}"

def process_frames():
    """
    Process frames from the video stream with actual YOLO model
    """
    global video_path, current_frame, stats, stream_active
    
    if not video_path:
        logger.error("No video path set")
        return
    
    logger.info("Starting frame processing with YOLO model")
    
    try:
        # Load YOLO model
        model = YOLO("flask_backend/yolo12l.pt")
        logger.info(f"YOLO model loaded successfully")
        
        # Open the video stream
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Error opening video stream: {video_path}")
            return
        
        logger.info("Video stream opened successfully")
        
        # Get video properties
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        # Set up variables for people counting and tracking
        frame_count = 0
        region_margin = 0.2
        dwell_times = {}
        people_in_region = set()
        start_time = time.time()
        
        # Calculate counting region
        region_x1 = int(frame_width * region_margin) 
        region_x2 = int(frame_width * (1 - region_margin))
        region_y1 = int(frame_height * region_margin)
        region_y2 = int(frame_height * (1 - region_margin))
        counting_region = (region_x1, region_y1, region_x2, region_y2)
        
        # Skip frames to improve performance based on video fps
        frame_skip = max(1, fps // 15)  # Target ~15 fps for detection
        
        while stream_active:
            ret, frame = cap.read()
            
            if not ret:
                logger.info("End of stream or error reading frame")
                break
            
            # Process every nth frame to improve performance
            frame_count += 1
            if frame_count % frame_skip != 0 and frame_count > 1:
                # Still update the frame buffer for display
                _, buffer = cv2.imencode('.jpg', frame)
                current_frame = buffer.tobytes()
                time.sleep(0.01)
                continue
            
            # Resize frame for better processing
            frame = cv2.resize(frame, (640, 480))
            height, width = frame.shape[:2]
            
            # Update region coordinates after resize
            region_x1 = int(width * region_margin)
            region_x2 = int(width * (1 - region_margin))
            region_y1 = int(height * region_margin)
            region_y2 = int(height * (1 - region_margin))
            counting_region = (region_x1, region_y1, region_x2, region_y2)
            
            # Clear people set for this frame
            people_in_region.clear()
            
            # Draw counting region rectangle
            cv2.rectangle(frame, (region_x1, region_y1), (region_x2, region_y2), (0, 255, 0), 2)
            
            # Process frame with YOLO with tracking
            results = model.track(
                source=frame,
                tracker="bytetrack.yaml",
                stream=True,
                iou=0.45,  # Slightly lower IOU threshold
                conf=0.35,
                imgsz=640,  # Reduce image size for processing
                verbose=False
            )
            
            last_detection = next(results)
            
            current_people_count = 0
            
            if last_detection is not None:
                detections = last_detection.boxes
                # Get only people detections (class 0 is person)
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
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    
                    # Draw ID and confidence
                    cv2.putText(frame, f"ID:{track_id}", (x1, y1 - 10), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                    
                    # Check if person is in counting region
                    if region_x1 < center_x < region_x2 and region_y1 < center_y < region_y2:
                        # Person is in region, track for dwell time
                        current_time = time.time()
                        if track_id not in dwell_times:
                            dwell_times[track_id] = current_time
                        
                        people_in_region.add(track_id)
                        
                        # Draw a circle at the center to indicate counting
                        cv2.circle(frame, (center_x, center_y), 5, (0, 255, 0), -1)
                
                # Update people count
                current_people_count = len(people_in_region)
                
                # Calculate dwell times
                current_time = time.time()
                total_dwell_time = 0
                active_tracks = 0
                
                # Calculate average dwell time for active tracks
                for track_id in list(dwell_times.keys()):
                    if track_id in people_in_region:
                        # Active track - calculate current dwell time
                        dwell_time = current_time - dwell_times[track_id]
                        total_dwell_time += dwell_time
                        active_tracks += 1
                    else:
                        # Person left the region, clean up after some time
                        if current_time - dwell_times[track_id] > 5:  # Keep track for 5 seconds after leaving
                            del dwell_times[track_id]
                
                # Update stats
                avg_dwell_time = 0
                if active_tracks > 0:
                    avg_dwell_time = total_dwell_time / active_tracks
                
                stats["people_count"] = current_people_count
                stats["avg_dwell_time"] = avg_dwell_time
                stats["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Add timestamp and stats to the frame
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Draw a semi-transparent overlay at the bottom
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, height-130), (width, height), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
            
            # Add text with statistics
            cv2.putText(frame, f"Location: {stats['location']}", (10, height-100), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"People Count: {stats['people_count']}", (10, height-70), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"Avg Dwell Time: {stats['avg_dwell_time']:.1f}s", (10, height-40), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"Timestamp: {timestamp}", (10, height-10), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Add a title
            cv2.rectangle(overlay, (0, 0), (width, 40), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
            cv2.putText(frame, "LIVE: Foot Traffic Analysis", (width//2 - 150, 30), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # Store the current frame
            _, buffer = cv2.imencode('.jpg', frame)
            current_frame = buffer.tobytes()
            
            # Short delay to avoid consuming too much CPU
            time.sleep(0.03)  # ~30 fps
                
    except Exception as e:
        logger.error(f"Error in process_frames: {e}")
    finally:
        stream_active = False
        if 'cap' in locals() and cap is not None and cap.isOpened():
            cap.release()
        logger.info("Frame processing ended")

@app.route('/')
def index():
    """YouTube form homepage"""
    form_html = """
    <html>
    <head>
        <title>YouTube Stream - Foot Traffic Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .form-container { border: 2px dashed #ccc; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #45a049; }
            #urlInput { width: 80%; padding: 10px; margin: 10px 0; }
            .notice { margin-top: 10px; color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>YouTube Stream for Foot Traffic Analysis</h1>
        
        <div class="form-container">
            <p>Enter a YouTube URL to analyze foot traffic:</p>
            <form action="/process_youtube" method="POST">
                <input type="text" id="urlInput" name="youtube_url" value="https://www.youtube.com/watch?v=Ku62ggXQPHE" placeholder="https://www.youtube.com/watch?v=...">
                <p>
                    <button class="btn" type="submit">Start Analysis</button>
                </p>
                <p class="notice">
                    <small>Note: For best results, use videos with clear pedestrian traffic. The default URL is a pedestrian area in NYC.</small>
                </p>
            </form>
        </div>
    </body>
    </html>
    """
    return render_template_string(form_html)

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    """Process a YouTube video URL"""
    global video_path, stream_active
    
    youtube_url = request.form.get('youtube_url')
    
    if not youtube_url:
        return "No YouTube URL provided", 400
    
    # Stop any existing processing
    stream_active = False
    time.sleep(1)  # Give time for threads to clean up
    
    success, location_name = get_youtube_stream(youtube_url)
    
    if success:
        # Start a new thread to process frames
        stream_active = True
        processing_thread = threading.Thread(target=process_frames, daemon=True)
        processing_thread.start()
        
        # Redirect to streaming page
        return render_template_string("""
        <html>
        <head>
            <title>Live Stream - Foot Traffic Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                .video-container { border: 1px solid #ddd; border-radius: 5px; overflow: hidden; margin: 20px 0; }
                .stats-container { margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px; }
                .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-right: 10px; }
                .btn:hover { background: #45a049; }
                .stat-item { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>YouTube Foot Traffic Analysis</h1>
            <p>Analyzing: <strong>{{ youtube_url }}</strong></p>
            
            <div class="video-container">
                <img src="/video_feed" style="width: 100%;">
            </div>
            
            <div class="stats-container">
                <h2>Live Statistics</h2>
                <div class="stat-item"><strong>Location:</strong> <span id="location">-</span></div>
                <div class="stat-item"><strong>People Count:</strong> <span id="peopleCount">-</span></div>
                <div class="stat-item"><strong>Average Dwell Time:</strong> <span id="dwellTime">-</span></div>
                <div class="stat-item"><strong>Last Updated:</strong> <span id="timestamp">-</span></div>
            </div>
            
            <p style="margin-top: 20px;">
                <a href="/" class="btn">Try Another YouTube URL</a>
            </p>
            
            <script>
                // Function to update statistics
                function updateStats() {
                    fetch('/api/stats')
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('location').textContent = data.location;
                            document.getElementById('peopleCount').textContent = data.people_count;
                            document.getElementById('dwellTime').textContent = data.avg_dwell_time.toFixed(1) + ' seconds';
                            document.getElementById('timestamp').textContent = data.timestamp;
                        })
                        .catch(error => {
                            console.error('Error fetching stats:', error);
                        });
                }
                
                // Update stats every 2 seconds
                updateStats();
                setInterval(updateStats, 2000);
            </script>
        </body>
        </html>
        """, youtube_url=youtube_url)
    else:
        return f"Error processing YouTube URL: {location_name}", 500

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    def generate():
        global current_frame
        
        while True:
            if current_frame is not None:
                yield (b'--frame\r\n'
                      b'Content-Type: image/jpeg\r\n\r\n' + current_frame + b'\r\n')
            else:
                # If no frame is available, serve a placeholder
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(placeholder, "Waiting for stream...", (50, 240), 
                          cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                _, buffer = cv2.imencode('.jpg', placeholder)
                yield (b'--frame\r\n'
                      b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            time.sleep(0.03)  # ~30 fps
    
    return Response(generate(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats')
def get_stats():
    """API endpoint to get current statistics"""
    return jsonify(stats)
    
@app.route('/api/process_youtube', methods=['POST'])
def api_process_youtube():
    """API endpoint to process a YouTube URL and return status"""
    global video_path, stream_active
    
    # Parse JSON request
    data = request.get_json()
    if not data or 'youtube_url' not in data:
        return jsonify({"success": False, "error": "No YouTube URL provided"}), 400
        
    youtube_url = data['youtube_url']
    
    # Stop any existing processing
    stream_active = False
    time.sleep(1)  # Give time for threads to clean up
    
    success, location_name = get_youtube_stream(youtube_url)
    
    if success:
        # Start a new thread to process frames
        stream_active = True
        processing_thread = threading.Thread(target=process_frames, daemon=True)
        processing_thread.start()
        
        return jsonify({
            "success": True,
            "location": location_name,
            "video_feed_url": "http://localhost:5002/video_feed",
            "stats_url": "http://localhost:5002/api/stats"
        })
    else:
        return jsonify({
            "success": False,
            "error": location_name
        }), 500

if __name__ == '__main__':
    # Clear any existing streams
    stream_active = False
    
    # Start the Flask app on port 5002 to avoid conflicts
    app.run(host='0.0.0.0', port=5002, debug=False)