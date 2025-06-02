import cv2
import os
from video_face_recognition import VideoFaceRecognition

def test_face_recognition():
    # Initialize the face recognition system
    face_system = VideoFaceRecognition(family_dir="family_photos")
    
    # Print initial state
    print("\nInitial face embeddings cache:")
    for path, data in face_system.face_embeddings_cache.items():
        print(f"Loaded face: {data['name']} from family {data['family']}")
    
    # Test with a sample image from family_photos
    family_photos_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family_photos')
    
    # List all photos in the directory
    print("\nPhotos in family_photos directory:")
    for filename in os.listdir(family_photos_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            print(f"Found photo: {filename}")
            
            # Test recognition with this photo
            image_path = os.path.join(family_photos_dir, filename)
            frame = cv2.imread(image_path)
            if frame is not None:
                print(f"\nTesting recognition with {filename}:")
                # Detect faces in the image
                faces = face_system.face_app.get(frame)
                
                if not faces:
                    print("No faces detected in the image")
                    continue
                    
                for i, face in enumerate(faces):
                    print(f"\nFace {i+1}:")
                    embedding = face.embedding
                    name, family, similarity = face_system.recognize_face(embedding)
                    
                    print(f"Recognized as: {name if name else 'Unknown'}")
                    print(f"Family: {family if family else 'Unknown'}")
                    print(f"Similarity score: {similarity:.3f}")
                    
                    # Draw face detection and save output
                    bbox = face.bbox.astype(int)
                    cv2.rectangle(frame, 
                                (bbox[0], bbox[1]),
                                (bbox[2], bbox[3]),
                                (0, 255, 0), 2)
                    
                    label = f"{name if name else 'Unknown'} ({similarity:.2f})"
                    cv2.putText(frame, label,
                              (bbox[0], bbox[1] - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                              (0, 255, 0), 2)
                    
                    output_path = os.path.join(family_photos_dir, f"test_output_{filename}")
                    cv2.imwrite(output_path, frame)
                    print(f"Saved annotated image to: {output_path}")
            else:
                print(f"Could not read image: {filename}")

if __name__ == "__main__":
    test_face_recognition()
