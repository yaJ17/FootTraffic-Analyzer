import os
import json
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define data storage paths
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
STATS_FILE = os.path.join(DATA_DIR, 'video_stats.json')
HISTORICAL_FILE = os.path.join(DATA_DIR, 'historical_data.json')
BACKUP_DIR = os.path.join(DATA_DIR, 'backups')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

def create_backup(file_path):
    """Create a timestamped backup of a file"""
    if not os.path.exists(file_path):
        return False
    
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = os.path.basename(file_path)
        backup_path = os.path.join(BACKUP_DIR, f"{os.path.splitext(filename)[0]}_{timestamp}.json")
        
        with open(file_path, 'r') as src_file:
            with open(backup_path, 'w') as dst_file:
                dst_file.write(src_file.read())
        
        logger.info(f"Created backup: {backup_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return False

def save_stats(stats_data):
    """Save the current video stats to file"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(STATS_FILE), exist_ok=True)
        
        # Create backup of existing file if it exists
        if os.path.exists(STATS_FILE):
            create_backup(STATS_FILE)
        
        # Save new data
        with open(STATS_FILE, 'w') as f:
            json.dump(stats_data, f, indent=2)
        
        logger.info(f"Stats saved to {STATS_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving stats: {e}")
        return False

def load_stats():
    """Load the most recent video stats"""
    try:
        if not os.path.exists(STATS_FILE):
            logger.warning(f"Stats file not found: {STATS_FILE}")
            return None
        
        with open(STATS_FILE, 'r') as f:
            stats = json.load(f)
        
        logger.info(f"Stats loaded from {STATS_FILE}")
        return stats
    except Exception as e:
        logger.error(f"Error loading stats: {e}")
        return None

def save_historical_data(historical_data):
    """Save historical data to file"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(HISTORICAL_FILE), exist_ok=True)
        
        # Create backup of existing file if it exists
        if os.path.exists(HISTORICAL_FILE):
            create_backup(HISTORICAL_FILE)
        
        # Save new data
        with open(HISTORICAL_FILE, 'w') as f:
            json.dump(historical_data, f, indent=2)
        
        logger.info(f"Historical data saved to {HISTORICAL_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving historical data: {e}")
        return False

def load_historical_data():
    """Load historical foot traffic data"""
    try:
        if not os.path.exists(HISTORICAL_FILE):
            logger.warning(f"Historical data file not found: {HISTORICAL_FILE}")
            return None
        
        with open(HISTORICAL_FILE, 'r') as f:
            data = json.load(f)
        
        logger.info(f"Historical data loaded from {HISTORICAL_FILE}")
        return data
    except Exception as e:
        logger.error(f"Error loading historical data: {e}")
        return None

def get_backup_list():
    """Get list of available backups"""
    try:
        backups = []
        if os.path.exists(BACKUP_DIR):
            for file in os.listdir(BACKUP_DIR):
                if file.endswith('.json'):
                    file_path = os.path.join(BACKUP_DIR, file)
                    backups.append({
                        'filename': file,
                        'size': os.path.getsize(file_path),
                        'modified': datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                    })
        return sorted(backups, key=lambda x: x['modified'], reverse=True)
    except Exception as e:
        logger.error(f"Error getting backup list: {e}")
        return []

def restore_from_backup(backup_filename):
    """Restore data from a specific backup file"""
    try:
        backup_path = os.path.join(BACKUP_DIR, backup_filename)
        if not os.path.exists(backup_path):
            logger.error(f"Backup file not found: {backup_path}")
            return False
        
        # Determine target file based on backup filename
        if backup_filename.startswith('video_stats'):
            target_file = STATS_FILE
        elif backup_filename.startswith('historical_data'):
            target_file = HISTORICAL_FILE
        else:
            logger.error(f"Unknown backup type: {backup_filename}")
            return False
        
        # Create backup of current file
        if os.path.exists(target_file):
            create_backup(target_file)
        
        # Copy backup to target
        with open(backup_path, 'r') as src_file:
            with open(target_file, 'w') as dst_file:
                dst_file.write(src_file.read())
        
        logger.info(f"Restored from backup: {backup_filename}")
        return True
    except Exception as e:
        logger.error(f"Error restoring from backup: {e}")
        return False 