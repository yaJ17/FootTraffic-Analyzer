from flask import Flask, jsonify, request, Response, render_template_string
from flask_cors import CORS
import os
import json
import time
import threading
import random
import cv2
import numpy as np
from datetime import datetime
import logging
import pytube
from pytube import YouTube
from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
video_stream = None
video_url = None
is_youtube_stream = False
current_frame = None
stream_active = False

# Stats storage (in-memory for simplicity)
stats = {
    "people_count": 0,
    "avg_dwell_time": 0.0,
    "location": "YouTube Stream",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

# Mock data generator thread for stats when not processing
def update_mock_stats():
    global stats
    while True:
        stats["people_count"] = random.randint(10, 100)
        stats["avg_dwell_time"] = round(random.uniform(30, 300), 1)
        stats["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        time.sleep(2)  # Update every 2 seconds

# Start the background thread for mock data
mock_thread = threading.Thread(target=update_mock_stats, daemon=True)
mock_thread.start()

def get_video_stream(youtube_url):
    """
    Get a real-time video stream from a YouTube URL without downloading
    """
    global video_stream, video_url, is_youtube_stream, stream_active
    
    try:
        # Close any existing stream
        if video_stream is not None and video_stream.isOpened():
            video_stream.release()
        
        logger.info(f"Connecting to live stream from {youtube_url}")
        
        # Use YouTube URL directly with OpenCV
        # This uses the stream directly without downloading the entire video
        video_stream = cv2.VideoCapture(youtube_url)
        
        # If direct URL doesn't work, try getting the stream URL
        if not video_stream.isOpened():
            logger.info("Direct URL didn't work, trying to get stream URL")
            yt = YouTube(youtube_url)
            streams = yt.streams.filter(progressive=True, file_extension='mp4')
            
            # Get the lowest resolution for better performance
            video_stream_url = streams.order_by('resolution').first().url
            
            # Open the video stream
            video_stream = cv2.VideoCapture(video_stream_url)
        
        if not video_stream.isOpened():
            logger.error("Could not open video stream")
            return False
        
        video_url = youtube_url
        is_youtube_stream = True
        stream_active = True
        
        # Set buffer size to minimize latency
        video_stream.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        
        return True
    except Exception as e:
        logger.error(f"Error getting video stream: {e}")
        return False

def process_frames():
    """
    Process frames from the video stream with YOLO model for people detection
    """
    global video_stream, current_frame, stats, stream_active
    
    logger.info("Starting frame processing with YOLO model")
    
    try:
        # Load YOLO model
        model = YOLO("flask_backend/yolo12l.pt")
        logger.info(f"YOLO model loaded successfully")
        
        # Set up variables for tracking
        frame_count = 0
        dwell_times = {}
        people_in_region = set()
        start_time = time.time()
        
        # Skip frames based on performance needs
        frame_skip = 2  # Process every other frame for better performance
        
        while stream_active:
            if video_stream is None or not video_stream.isOpened():
                time.sleep(0.5)
                continue
            
            try:
                ret, frame = video_stream.read()
                
                if not ret:
                    logger.info("End of stream or error reading frame")
                    stream_active = False
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
                
                # Define counting region (center area of the frame)
                frame_height, frame_width = frame.shape[:2]
                region_margin = 0.2
                region_x1 = int(frame_width * region_margin)
                region_x2 = int(frame_width * (1 - region_margin))
                region_y1 = int(frame_height * region_margin)
                region_y2 = int(frame_height * (1 - region_margin))
                
                # Draw counting region rectangle
                cv2.rectangle(frame, (region_x1, region_y1), (region_x2, region_y2), (0, 255, 0), 2)
                
                # Clear people set for this frame
                people_in_region.clear()
                
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
                
                # Get detection results
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
                        
                        # Calculate center point of the bounding box
                        center_x = (x1 + x2) // 2
                        center_y = (y1 + y2) // 2
                        
                        # Draw bounding box for each person
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
                
                # Add annotations to the frame
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                # Draw a semi-transparent overlay at the bottom
                overlay = frame.copy()
                cv2.rectangle(overlay, (0, frame_height-130), (frame_width, frame_height), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
                
                # Add text with statistics
                cv2.putText(frame, f"Location: {stats['location']}", (10, frame_height-100), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"People Count: {stats['people_count']}", (10, frame_height-70), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"Avg Dwell Time: {stats['avg_dwell_time']:.1f}s", (10, frame_height-40), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"Timestamp: {timestamp}", (10, frame_height-10), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # Add a title at the top
                cv2.rectangle(overlay, (0, 0), (frame_width, 40), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
                cv2.putText(frame, "LIVE: Foot Traffic Analysis", (frame_width//2 - 150, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                # Store the current frame
                _, buffer = cv2.imencode('.jpg', frame)
                current_frame = buffer.tobytes()
                
                # Short delay to avoid consuming too much CPU
                time.sleep(0.03)  # ~30 fps
                
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                time.sleep(0.5)
    except Exception as e:
        logger.error(f"General error in process_frames: {e}")
    finally:
        logger.info("Frame processing ended")

@app.route('/hello')
def hello():
    return "Hello from YouTube Stream Flask Server!"

@app.route('/api/stats')
def get_stats():
    """API endpoint to get current statistics"""
    return jsonify(stats)

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    """Process a YouTube video URL"""
    global video_url, stream_active
    
    youtube_url = request.json.get('youtube_url', '')
    
    if not youtube_url:
        return jsonify({"error": "No YouTube URL provided"}), 400
    
    # Extract video ID for a better location name
    video_id = youtube_url.split("watch?v=")[-1].split("&")[0]
    
    # Update location in stats
    stats["location"] = f"YouTube Stream ({video_id})"
    
    # Get the video stream
    if get_video_stream(youtube_url):
        # Start a new thread to process frames
        stream_active = True
        processing_thread = threading.Thread(target=process_frames, daemon=True)
        processing_thread.start()
        
        return jsonify({
            "status": "success", 
            "message": f"Processing YouTube video: {youtube_url}",
            "video_id": video_id
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Could not process YouTube video"
        }), 500

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

@app.route('/youtube_form')
def youtube_form():
    """Form to submit YouTube URL"""
    form_html = """
    <html>
    <head>
        <title>YouTube Stream - Foot Traffic Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .form-container { border: 2px dashed #ccc; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .video-container { margin-top: 20px; border: 1px solid #eee; border-radius: 5px; overflow: hidden; }
            .stats-container { margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px; }
            .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #45a049; }
            #urlInput { width: 80%; padding: 10px; margin: 10px 0; }
            .stat-item { margin: 5px 0; }
        </style>
        <script>
            // Function to submit the YouTube URL
            async function submitUrl() {
                const url = document.getElementById('urlInput').value;
                if (!url) {
                    alert('Please enter a YouTube URL');
                    return;
                }
                
                try {
                    const response = await fetch('/process_youtube', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({youtube_url: url}),
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('message').textContent = data.message;
                        document.getElementById('videoFrame').src = '/video_feed';
                        updateStats();
                    } else {
                        document.getElementById('message').textContent = 'Error: ' + data.message;
                    }
                } catch (error) {
                    document.getElementById('message').textContent = 'Error: ' + error.message;
                }
            }
            
            // Function to update stats periodically
            async function updateStats() {
                try {
                    const response = await fetch('/api/stats');
                    const data = await response.json();
                    
                    document.getElementById('location').textContent = data.location;
                    document.getElementById('peopleCount').textContent = data.people_count;
                    document.getElementById('dwellTime').textContent = data.avg_dwell_time + ' seconds';
                    document.getElementById('timestamp').textContent = data.timestamp;
                    
                    // Update stats every 2 seconds
                    setTimeout(updateStats, 2000);
                } catch (error) {
                    console.error('Error updating stats:', error);
                    // Retry after a delay
                    setTimeout(updateStats, 5000);
                }
            }
        </script>
    </head>
    <body>
        <h1>YouTube Stream for Foot Traffic Analysis</h1>
        
        <div class="form-container">
            <p>Enter a YouTube URL to analyze foot traffic:</p>
            <input type="text" id="urlInput" value="https://www.youtube.com/watch?v=Ku62ggXQPHE" placeholder="https://www.youtube.com/watch?v=...">
            <p>
                <button class="btn" onclick="submitUrl()">Start Analysis</button>
            </p>
            <p>
                <small><i>Note: For best results, use videos with clear pedestrian traffic. The current URL is a pedestrian area in NYC.</i></small>
            </p>
            <p id="message"></p>
        </div>
        
        <div class="video-container">
            <img id="videoFrame" src="" alt="Video stream will appear here" style="width: 100%;">
        </div>
        
        <div class="stats-container">
            <h2>Live Statistics</h2>
            <div class="stat-item"><strong>Location:</strong> <span id="location">-</span></div>
            <div class="stat-item"><strong>People Count:</strong> <span id="peopleCount">-</span></div>
            <div class="stat-item"><strong>Average Dwell Time:</strong> <span id="dwellTime">-</span></div>
            <div class="stat-item"><strong>Last Updated:</strong> <span id="timestamp">-</span></div>
        </div>
    </body>
    </html>
    """
    return render_template_string(form_html)

def start_flask_server():
    """
    Start the Flask server for YouTube video processing
    """
    port = int(os.environ.get("PORT", 5003))
    print(f"Starting YouTube Stream Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    start_flask_server()