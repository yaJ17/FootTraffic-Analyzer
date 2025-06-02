import cv2
import numpy as np
import os
from insightface.app import FaceAnalysis
import shutil

def generate_embeddings(family_photos_dir):
    """Generate embeddings for all photos in the family photos directory"""
    
    # Initialize face analysis
    face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0, det_size=(640, 480))
    
    print(f"\nProcessing photos in: {family_photos_dir}")
    
    # Create a temporary directory for organized photos
    temp_dir = os.path.join(family_photos_dir, "temp_organized")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Process each photo
    for filename in os.listdir(family_photos_dir):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
            
        if 'test_output_' in filename:
            continue
            
        file_path = os.path.join(family_photos_dir, filename)
        print(f"\nProcessing: {filename}")
        
        # Read image
        frame = cv2.imread(file_path)
        if frame is None:
            print(f"Could not read image: {filename}")
            continue
        
        # Detect faces
        faces = face_app.get(frame)
        if not faces:
            print(f"No faces detected in: {filename}")
            continue
        
        # Get name from filename (without extension)
        name = os.path.splitext(filename)[0]
        
        # Create a directory for this person if it doesn't exist
        person_dir = os.path.join(temp_dir, name)
        os.makedirs(person_dir, exist_ok=True)
        
        # Save face embedding
        for i, face in enumerate(faces):
            embedding = face.embedding
            embedding_filename = f"{name}_embedding.npy"
            embedding_path = os.path.join(person_dir, embedding_filename)
            np.save(embedding_path, embedding)
            print(f"Saved embedding: {embedding_filename}")
            
            # Save face image
            bbox = face.bbox.astype(int)
            face_img = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
            face_filename = f"{name}_face_{i+1}.jpg"
            face_path = os.path.join(person_dir, face_filename)
            cv2.imwrite(face_path, face_img)
            print(f"Saved face image: {face_filename}")
            
            # Copy original photo
            shutil.copy2(file_path, os.path.join(person_dir, filename))
    
    print("\nEmbedding generation complete!")
    print(f"Organized photos and embeddings are in: {temp_dir}")
    print("\nPlease review the results and move the folders to the main family_photos directory if they are correct.")

if __name__ == "__main__":
    # Get the family_photos directory path
    family_photos_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family_photos')
    generate_embeddings(family_photos_dir)
