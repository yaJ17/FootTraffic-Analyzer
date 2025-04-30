import cv2
import numpy as np
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        # Load pre-trained models for human detection using HOG
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
        logger.info("Video processor initialized with HOG people detector")
    
    def detect_people_hog(self, frame):
        """
        Detect people in a frame using HOG descriptor
        """
        # Resize for faster processing
        frame = cv2.resize(frame, (640, 480))
        
        # Detect people
        boxes, weights = self.hog.detectMultiScale(frame, winStride=(8, 8))
        
        # Count number of people
        count = len(boxes)
        
        return count, boxes
    
    def detect_people_ssd(self, frame):
        """
        Detect people in a frame using MobileNet SSD
        """
        # Resize frame for faster processing
        frame_resized = cv2.resize(frame, (300, 300))
        
        # Create blob from image
        blob = cv2.dnn.blobFromImage(frame_resized, 0.007843, (300, 300), 127.5)
        
        # Set the input to the network
        self.net.setInput(blob)
        
        # Forward pass to get detections
        detections = self.net.forward()
        
        count = 0
        boxes = []
        
        # Process detections
        for i in range(detections.shape[2]):
            # Get the confidence of the detection
            confidence = detections[0, 0, i, 2]
            
            # Filter weak detections
            if confidence > 0.5:
                # Get the class index
                idx = int(detections[0, 0, i, 1])
                
                # Check if the detection is a person
                if self.classes[idx] == "person":
                    count += 1
                    
                    # Get the bounding box coordinates
                    box = detections[0, 0, i, 3:7] * np.array([frame.shape[1], frame.shape[0], frame.shape[1], frame.shape[0]])
                    (startX, startY, endX, endY) = box.astype("int")
                    boxes.append((startX, startY, endX, endY))
        
        return count, boxes
    
    def process_video(self, video_path=None, video_capture=None, location_id=None):
        """
        Process a video file or camera feed to count people and track dwell time
        
        Args:
            video_path: Path to video file (if processing a file)
            video_capture: OpenCV video capture object (if processing a feed)
            location_id: ID of the location being monitored
            
        Returns:
            Dictionary with results:
            - count: Average number of people detected
            - dwell_time: Average dwell time in seconds
            - timestamps: List of timestamps for each detection
            - location_id: ID of the monitored location
        """
        if video_path:
            cap = cv2.VideoCapture(video_path)
        elif video_capture:
            cap = video_capture
        else:
            raise ValueError("Either video_path or video_capture must be provided")
        
        if not cap.isOpened():
            raise ValueError("Error opening video source")
        
        total_frames = 0
        total_people = 0
        person_tracks = {}  # Track individuals for dwell time
        next_person_id = 0
        
        start_time = time.time()
        timestamps = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            total_frames += 1
            
            # Detect people in the frame using HOG
            count, boxes = self.detect_people_hog(frame)
            
            # Update total count
            total_people += count
            
            # Record timestamp and count
            timestamp = datetime.now().isoformat()
            timestamps.append({"timestamp": timestamp, "count": count})
            
            # Simple tracking for dwell time (replace with a more sophisticated tracker in production)
            current_tracks = {}
            for box in boxes:
                matched = False
                box_center = ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2)
                
                # Try to match with existing tracks
                for person_id, track in person_tracks.items():
                    last_box = track["boxes"][-1]
                    last_center = ((last_box[0] + last_box[2]) // 2, (last_box[1] + last_box[3]) // 2)
                    
                    # Simple distance-based matching
                    distance = np.sqrt((box_center[0] - last_center[0])**2 + (box_center[1] - last_center[1])**2)
                    if distance < 50:  # Threshold for same person
                        current_tracks[person_id] = {
                            "boxes": track["boxes"] + [box],
                            "frames": track["frames"] + [total_frames]
                        }
                        matched = True
                        break
                
                if not matched:
                    # New person
                    current_tracks[next_person_id] = {
                        "boxes": [box],
                        "frames": [total_frames]
                    }
                    next_person_id += 1
            
            person_tracks = current_tracks
            
            # Display progress every 30 frames
            if total_frames % 30 == 0:
                logger.info(f"Processed {total_frames} frames, current count: {count}")
        
        # Clean up
        if video_path:
            cap.release()
        
        # Calculate average count
        avg_count = total_people / total_frames if total_frames > 0 else 0
        
        # Calculate dwell time (frames a person was visible divided by FPS)
        fps = cap.get(cv2.CAP_PROP_FPS) if video_path else 30  # Assume 30 FPS for live feed
        dwell_times = []
        
        for person_id, track in person_tracks.items():
            frames_visible = len(track["frames"])
            dwell_time = frames_visible / fps
            dwell_times.append(dwell_time)
        
        avg_dwell_time = sum(dwell_times) / len(dwell_times) if dwell_times else 0
        
        processing_time = time.time() - start_time
        
        # Return results
        return {
            "location_id": location_id,
            "average_count": avg_count,
            "dwell_time_seconds": avg_dwell_time,
            "total_frames": total_frames,
            "processing_time": processing_time,
            "timestamps": timestamps
        }