import cv2
import numpy as np
import os
from datetime import datetime

class VideoFaceRecognition:
    def __init__(self, family_dir="family_photos", safe_log_file="safe_members.txt"):
        # Initialize OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Paths and settings
        self.family_dir = family_dir
        self.safe_log_file = safe_log_file
        
        # Create necessary directories
        os.makedirs(self.family_dir, exist_ok=True)
        if not os.path.exists(self.safe_log_file):
            open(self.safe_log_file, 'a').close()
            
        # Track detected faces
        self.detected_faces = 0

    def get_recognized_faces(self):
        """Return number of detected faces"""
        return self.detected_faces

    def process_video(self, video_path, show_display=False):
        """Process video for face detection"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error: Could not open video file")
            return

        # Get video properties
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))

        # Create video writer
        output_path = 'face_detection_output.mp4'
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

        frame_count = 0
        self.detected_faces = 0

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1
                
                # Process every 5th frame to improve performance
                if frame_count % 5 != 0:
                    out.write(frame)
                    continue

                # Convert frame to grayscale for face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Detect faces
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30)
                )
                
                # Update detected faces count
                self.detected_faces = max(self.detected_faces, len(faces))
                
                # Draw rectangles around faces
                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(frame, 'Face Detected', (x, y-10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                # Show progress
                if frame_count % 30 == 0:
                    print(f"Processed {frame_count} frames, detected {len(faces)} faces")

                # Write the frame
                out.write(frame)

                # Display the frame if requested
                if show_display:
                    try:
                        cv2.imshow('Video Face Detection', frame)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break
                    except Exception as e:
                        print(f"Warning: Could not display frame: {e}")
                        show_display = False  # Disable display on error

        except Exception as e:
            print(f"Error processing video: {e}")
        finally:
            # Cleanup
            cap.release()
            out.release()
            if show_display:
                cv2.destroyAllWindows()

            # Print summary
            print("\nProcessing complete!")
            print(f"Total frames processed: {frame_count}")
            print(f"Maximum faces detected in a frame: {self.detected_faces}")
            print(f"\nOutput saved to: {output_path}")
            return self.detected_faces

def main():
    # Initialize face detection system
    face_system = VideoFaceRecognition()
    
    # Test with a video file
    video_path = "test_video.mp4"
    if os.path.exists(video_path):
        face_system.process_video(video_path, show_display=False)
    else:
        print(f"Test video not found: {video_path}")

if __name__ == "__main__":
    main()