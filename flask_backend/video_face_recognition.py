import cv2
import numpy as np
import os
from insightface.app import FaceAnalysis
from datetime import datetime

class VideoFaceRecognition:
    def __init__(self, family_dir="family_photos", safe_log_file="safe_members.txt"):
        # Initialize InsightFace
        self.face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
        self.face_app.prepare(ctx_id=0, det_size=(640, 480))
        
        # Paths and settings
        self.family_dir = family_dir
        self.safe_log_file = safe_log_file
        self.face_embeddings_cache = {}
        self.similarity_threshold = 0.35
        
        # Create necessary directories
        os.makedirs(self.family_dir, exist_ok=True)
        if not os.path.exists(self.safe_log_file):
            open(self.safe_log_file, 'a').close()
            
        # Load face embeddings
        self.load_face_embeddings()
        
        # Track recognized faces
        self.recognized_faces = set()

    def load_face_embeddings(self):
        """Load all saved face embeddings"""
        self.face_embeddings_cache.clear()
        
        if not os.path.exists(self.family_dir):
            return
            
        for family_folder in os.listdir(self.family_dir):
            family_path = os.path.join(self.family_dir, family_folder)
            if not os.path.isdir(family_path):
                continue
                
            embedding_files = [f for f in os.listdir(family_path) if f.endswith('_embedding.npy')]
            for embedding_file in embedding_files:
                try:
                    embedding_path = os.path.join(family_path, embedding_file)
                    embedding = np.load(embedding_path)
                    name = os.path.splitext(embedding_file)[0][:-10]
                    self.face_embeddings_cache[embedding_path] = {
                        'embedding': embedding,
                        'name': name,
                        'family': family_folder
                    }
                except Exception as e:
                    print(f"Error loading embedding {embedding_file}: {str(e)}")

    def cosine_similarity(self, emb1, emb2):
        """Calculate cosine similarity between two embeddings"""
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def recognize_face(self, embedding):
        """Find best match for a face embedding"""
        best_match = None
        highest_similarity = 0
        matched_family = None
        
        for embedding_path, cache_data in self.face_embeddings_cache.items():
            try:
                similarity = self.cosine_similarity(embedding, cache_data['embedding'])
                if similarity > self.similarity_threshold and similarity > highest_similarity:
                    highest_similarity = similarity
                    best_match = cache_data['name']
                    matched_family = cache_data['family']
            except Exception as e:
                print(f"Error comparing with {embedding_path}: {str(e)}")
                
        return best_match, matched_family, highest_similarity

    def get_recognized_faces(self):
        """Return a list of recognized faces"""
        return list(self.recognized_faces)

    def process_video(self, video_path, show_display=False):
        """Process video for face detection and recognition"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error: Could not open video file")
            return

        # Get video properties
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))

        # Create video writer
        output_path = 'face_recognition_output.mp4'
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

        frame_count = 0
        self.recognized_faces = set()  # Reset recognized faces

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

                # Detect faces in frame
                faces = self.face_app.get(frame)
                
                for face in faces:
                    bbox = face.bbox.astype(int)
                    embedding = face.embedding
                    
                    # Try to recognize the face
                    name, family, similarity = self.recognize_face(embedding)
                    
                    # Draw bounding box
                    cv2.rectangle(frame, 
                                (bbox[0], bbox[1]), 
                                (bbox[2], bbox[3]), 
                                (0, 255, 0), 2)

                    # Add text for name and confidence
                    label = f"{name if name else 'Unknown'}"
                    if similarity > 0:
                        label += f" ({similarity:.2f})"
                    cv2.putText(frame, label, 
                              (bbox[0], bbox[1] - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                              (0, 255, 0), 2)

                    # Draw landmarks
                    landmarks = face.landmark_2d_106
                    if landmarks is not None:
                        for point in landmarks.astype(int):
                            cv2.circle(frame, tuple(point), 1, (0, 0, 255), -1)

                    # Track recognized faces
                    if name and name not in self.recognized_faces:
                        self.recognized_faces.add(name)
                        print(f"Found {name} from family {family}")

                # Show progress
                if frame_count % 30 == 0:
                    print(f"Processed {frame_count} frames")

                # Write the frame
                out.write(frame)

                # Display the frame if requested
                if show_display:
                    try:
                        cv2.imshow('Video Face Recognition', frame)
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
            print(f"Unique faces recognized: {len(self.recognized_faces)}")
            if self.recognized_faces:
                print("Recognized individuals:")
                for name in self.recognized_faces:
                    print(f"- {name}")
            print(f"\nOutput saved to: {output_path}")
            return self.recognized_faces

def main():
    # Initialize face recognition system
    face_system = VideoFaceRecognition()
    
    # Use the same video path as in tracking_with_stats.py
    video_path = r"D:\Programming\foot_tech\Foot_Tech_Analyzer-main\FootTech\FootTrafficAnalyzer\api\models\palengke.mp4"
    
    # Process the video (without display to avoid potential GUI issues)
    face_system.process_video(video_path, show_display=False)

if __name__ == "__main__":
    main()