from flask import Flask, jsonify, request, Response, render_template_string
from flask_cors import CORS
import os
import json
import time
import threading
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Stats storage (in-memory for simplicity)
stats = {
    "people_count": 0,
    "avg_dwell_time": 0.0,
    "location": "Palengke Market",
    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

# Mock data generator thread
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

@app.route('/hello')
def hello():
    return "Hello from Flask!"

@app.route('/api/stats')
def get_stats():
    """API endpoint to get current statistics"""
    return jsonify(stats)

@app.route('/process_sample', methods=['POST'])
def process_sample():
    """Process a sample video"""
    sample_video = request.form.get('sample_video', '')
    
    # Update location based on the sample video
    if sample_video:
        location = "School Entrance" if "school" in sample_video else "Palengke Market"
        stats["location"] = location
        
    return jsonify({"status": "success", "message": f"Processing {sample_video}"})

@app.route('/video_feed')
def video_feed():
    """Streaming route - returns a placeholder image"""
    placeholder_html = """
    <html>
    <body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#f0f0f0;">
        <div style="text-align:center; padding:20px; background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#333;">Video Stream Placeholder</h2>
            <p>Real video processing requires OpenCV integration</p>
            <div style="background:#eee; padding:40px; border-radius:5px; margin-top:20px;">
                <div style="font-size:48px; color:#999;">📹</div>
                <p style="margin-top:10px; color:#666;">Location: {}</p>
                <p style="color:#666;">People Count: {}</p>
            </div>
        </div>
    </body>
    </html>
    """.format(stats["location"], stats["people_count"])
    
    return Response(render_template_string(placeholder_html), mimetype='text/html')

@app.route('/upload')
def upload_file():
    """Upload page"""
    upload_html = """
    <html>
    <head>
        <title>Upload Video for Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .upload-form { border: 2px dashed #ccc; padding: 20px; border-radius: 5px; text-align: center; }
            .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #45a049; }
        </style>
    </head>
    <body>
        <h1>Upload Video for Foot Traffic Analysis</h1>
        <div class="upload-form">
            <p>Select a video file to upload for foot traffic analysis:</p>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file" accept="video/*">
                <p>
                    <input class="btn" type="submit" value="Upload & Analyze">
                </p>
            </form>
        </div>
        <p><a href="/">Back to home</a></p>
    </body>
    </html>
    """
    return render_template_string(upload_html)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5003))
    print(f"Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)