from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import os
import json
from bson import json_util
import cv2
import numpy as np
import logging
from data_storage import save_stats, load_stats, save_historical_data, load_historical_data, get_backup_list, restore_from_backup

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load historical data on server startup
try:
    historical_data = load_historical_data() 
    if historical_data:
        logger.info("Historical data loaded successfully on server startup")
    else:
        logger.warning("No historical data found on server startup")
except Exception as e:
    logger.error(f"Error loading historical data on server startup: {e}")
    historical_data = {}

# MongoDB connection
try:
    mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = mongo_client["foot_traffic_db"]
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    db = None

# Collections
users_collection = db["users"] if db else None
locations_collection = db["locations"] if db else None
foot_traffic_collection = db["foot_traffic"] if db else None
peak_hours_collection = db["peak_hours"] if db else None
calendar_events_collection = db["calendar_events"] if db else None
report_interpretations_collection = db["report_interpretations"] if db else None
profiles_collection = db["profiles"] if db else None

# Helper function to parse MongoDB response
def parse_json(data):
    return json.loads(json_util.dumps(data))

# API Routes
@app.route('/api/flask/status', methods=['GET'])
def status():
    return jsonify({"status": "Flask backend is running", "mongodb_connected": db is not None})

# Data Storage Routes
@app.route('/api/save-stats', methods=['POST'])
def api_save_stats():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        success = save_stats(data)
        if success:
            return jsonify({"status": "success", "message": "Stats saved successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to save stats"}), 500
    except Exception as e:
        logger.error(f"Error in save stats endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/save-historical', methods=['POST'])
def api_save_historical():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        success = save_historical_data(data)
        if success:
            return jsonify({"status": "success", "message": "Historical data saved successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to save historical data"}), 500
    except Exception as e:
        logger.error(f"Error in save historical endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/load-stats', methods=['GET'])
def api_load_stats():
    try:
        data = load_stats()
        if data is None:
            return jsonify({"status": "error", "message": "No stats data found"}), 404
        
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        logger.error(f"Error in load stats endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/load-historical', methods=['GET'])
def api_load_historical():
    try:
        data = load_historical_data()
        if data is None:
            return jsonify({"status": "error", "message": "No historical data found"}), 404
        
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        logger.error(f"Error in load historical endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/backups', methods=['GET'])
def api_get_backups():
    try:
        backups = get_backup_list()
        return jsonify({"status": "success", "backups": backups})
    except Exception as e:
        logger.error(f"Error in get backups endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/restore/<backup_filename>', methods=['POST'])
def api_restore_backup(backup_filename):
    try:
        success = restore_from_backup(backup_filename)
        if success:
            return jsonify({"status": "success", "message": f"Restored from backup: {backup_filename}"})
        else:
            return jsonify({"status": "error", "message": f"Failed to restore from backup: {backup_filename}"}), 500
    except Exception as e:
        logger.error(f"Error in restore backup endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# User Routes
@app.route('/api/flask/users', methods=['GET'])
def get_users():
    if not users_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    users = list(users_collection.find({}, {"password": 0}))  # Exclude password
    return jsonify(parse_json(users))

@app.route('/api/flask/users/<user_id>', methods=['GET'])
def get_user(user_id):
    if not users_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    user = users_collection.find_one({"_id": user_id}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(parse_json(user))

# Location Routes
@app.route('/api/flask/locations', methods=['GET'])
def get_locations():
    if not locations_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    locations = list(locations_collection.find())
    return jsonify(parse_json(locations))

@app.route('/api/flask/locations', methods=['POST'])
def create_location():
    if not locations_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.json
    # Validate required fields
    required_fields = ['name', 'zone', 'lat', 'lon']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Insert new location with timestamps
    result = locations_collection.insert_one(data)
    return jsonify({"id": str(result.inserted_id), "message": "Location created successfully"})

# Foot Traffic Routes
@app.route('/api/flask/foot-traffic', methods=['GET'])
def get_foot_traffic():
    if not foot_traffic_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    # Support filtering by location_id and time range
    location_id = request.args.get('location_id')
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    
    query = {}
    if location_id:
        query['locationId'] = location_id
    if start_time and end_time:
        query['timestamp'] = {'$gte': start_time, '$lte': end_time}
    
    foot_traffic_data = list(foot_traffic_collection.find(query))
    return jsonify(parse_json(foot_traffic_data))

@app.route('/api/flask/foot-traffic', methods=['POST'])
def create_foot_traffic():
    if not foot_traffic_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.json
    # Validate required fields
    required_fields = ['locationId', 'count', 'dwellTimeInSeconds', 'dayOfWeek', 'hour']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Insert new foot traffic record
    result = foot_traffic_collection.insert_one(data)
    return jsonify({"id": str(result.inserted_id), "message": "Foot traffic record created successfully"})

# Video Processing Routes
@app.route('/api/flask/video/process', methods=['POST'])
def process_video():
    # This is a placeholder for video processing logic
    # In a real implementation, you would:
    # 1. Receive a video file or stream
    # 2. Process it with OpenCV
    # 3. Return the results or save them to the database
    
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    # Placeholder response for now
    return jsonify({
        "message": "Video processing endpoint",
        "status": "Not implemented yet",
        "note": "This endpoint will analyze foot traffic from video"
    })

# Peak Hours Routes
@app.route('/api/flask/peak-hours', methods=['GET'])
def get_peak_hours():
    if not peak_hours_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    # Get the most recent peak hours record
    peak_hours = peak_hours_collection.find_one({}, sort=[("date", pymongo.DESCENDING)])
    if not peak_hours:
        return jsonify({"error": "No peak hours data found"}), 404
    
    return jsonify(parse_json(peak_hours))

# Calendar Event Routes
@app.route('/api/flask/calendar-events', methods=['GET'])
def get_calendar_events():
    if not calendar_events_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    events = list(calendar_events_collection.find())
    return jsonify(parse_json(events))

@app.route('/api/flask/calendar-events', methods=['POST'])
def create_calendar_event():
    if not calendar_events_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.json
    # Validate required fields
    required_fields = ['title', 'start', 'color', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Insert new calendar event
    result = calendar_events_collection.insert_one(data)
    return jsonify({"id": str(result.inserted_id), "message": "Calendar event created successfully"})

# Report Routes
@app.route('/api/flask/reports/interpretations', methods=['GET'])
def get_report_interpretations():
    if not report_interpretations_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    interpretations = list(report_interpretations_collection.find())
    return jsonify(parse_json(interpretations))

@app.route('/api/flask/reports/barangay', methods=['GET'])
def get_barangay_reports():
    if not locations_collection or not foot_traffic_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    # This would be a more complex query in a real implementation
    # For now, return a simplified response
    locations = list(locations_collection.find())
    reports = []
    
    for location in locations:
        # Get aggregated foot traffic data for this location
        foot_traffic = list(foot_traffic_collection.find({"locationId": str(location.get("_id"))}))
        
        avg_foot_traffic = 0
        total_foot_traffic = 0
        avg_dwell_time = "0m 0s"
        total_dwell_time = "0m 0s"
        
        if foot_traffic:
            counts = [ft.get("count", 0) for ft in foot_traffic]
            dwell_times = [ft.get("dwellTimeInSeconds", 0) for ft in foot_traffic]
            
            avg_foot_traffic = sum(counts) / len(counts) if counts else 0
            total_foot_traffic = sum(counts)
            
            avg_seconds = sum(dwell_times) / len(dwell_times) if dwell_times else 0
            total_seconds = sum(dwell_times)
            
            avg_dwell_time = f"{int(avg_seconds // 60)}m {int(avg_seconds % 60)}s"
            total_dwell_time = f"{int(total_seconds // 60)}m {int(total_seconds % 60)}s"
        
        report = {
            "id": str(location.get("_id")),
            "name": location.get("name"),
            "population": location.get("population", 0),
            "avgFootTraffic": avg_foot_traffic,
            "totalFootTraffic": total_foot_traffic,
            "avgDwellTime": avg_dwell_time,
            "totalDwellTime": total_dwell_time
        }
        reports.append(report)
    
    return jsonify(parse_json(reports))

# Profile Routes
@app.route('/api/flask/profiles/<user_id>', methods=['GET'])
def get_profile(user_id):
    if not profiles_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    profile = profiles_collection.find_one({"userId": user_id})
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    
    return jsonify(parse_json(profile))

@app.route('/api/flask/profiles/<user_id>', methods=['PUT'])
def update_profile(user_id):
    if not profiles_collection:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.json
    # Update the profile
    result = profiles_collection.update_one(
        {"userId": user_id},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        # Profile doesn't exist yet, create it
        data['userId'] = user_id
        profiles_collection.insert_one(data)
        return jsonify({"message": "Profile created successfully"})
    
    return jsonify({"message": "Profile updated successfully"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)