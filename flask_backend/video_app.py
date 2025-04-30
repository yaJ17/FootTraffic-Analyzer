from flask import Flask, render_template, request, send_file, Response
import os
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import cv2
import time
import json
from datetime import datetime
import numpy as np

app = Flask(__name__)

# Define upload folder and allowed extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variables for video streaming
video_path = None
output_frame = None
processing_complete = False

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

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
