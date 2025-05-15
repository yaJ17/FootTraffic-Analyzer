from flask import jsonify
from datetime import datetime
from typing import Dict, List, Optional, Any
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin with your service account
if not firebase_admin._apps:
    cred = credentials.Certificate(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serviceAccountKey.json'))
    firebase_admin.initialize_app(cred)

class DataStorage:
    def __init__(self):
        self.db = firestore.client()
        self.foot_traffic_ref = self.db.collection('footTraffic')
        self.calendar_ref = self.db.collection('calendar')
        self.users_ref = self.db.collection('users')
        
        # Ensure collections exist
        self._ensure_collections()
    
    def _ensure_collections(self):
        """Ensure all required collections exist"""
        collections = ['footTraffic', 'calendar', 'users']
        for collection in collections:
            if not self._collection_exists(collection):
                # Create a dummy document and immediately delete it to ensure collection exists
                doc_ref = self.db.collection(collection).document()
                doc_ref.set({'temp': True})
                doc_ref.delete()
    
    def _collection_exists(self, collection_name: str) -> bool:
        """Check if a collection exists"""
        collection_ref = self.db.collection(collection_name)
        try:
            # Try to get one document
            next(collection_ref.limit(1).stream(), None)
            return True
        except Exception:
            return False
    
    def add_foot_traffic_data(self, data: Dict) -> Dict:
        """Add foot traffic data to Firestore"""
        try:
            now = datetime.now()
            foot_traffic_data = {
                'people_count': data.get('people_count', 0),
                'avg_dwell_time': data.get('avg_dwell_time', 0),
                'highest_dwell_time': data.get('highest_dwell_time', 0),
                'location': data.get('location', 'Unknown'),
                'timestamp': now,
                'date': now.strftime('%m/%d/%Y'),
                'day': now.strftime('%A'),
                'time': now.strftime('%H:%M:%S')
            }
            
            doc_ref = self.foot_traffic_ref.document()
            doc_ref.set(foot_traffic_data)
            return {**foot_traffic_data, 'id': doc_ref.id}
        except Exception as e:
            print(f"Error adding foot traffic data: {e}")
            raise
    
    def get_foot_traffic_by_location(self, location: str) -> List[Dict]:
        """Get foot traffic data for a specific location"""
        try:
            docs = self.foot_traffic_ref.where('location', '==', location).order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error getting location foot traffic: {e}")
            raise
    
    def get_all_foot_traffic(self) -> List[Dict]:
        """Get all foot traffic data"""
        try:
            docs = self.foot_traffic_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error getting all foot traffic: {e}")
            raise
    
    def get_foot_traffic_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get foot traffic data for a specific date range"""
        try:
            docs = (self.foot_traffic_ref
                   .where('timestamp', '>=', start_date)
                   .where('timestamp', '<=', end_date)
                   .order_by('timestamp', direction=firestore.Query.DESCENDING)
                   .stream())
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error getting foot traffic by date range: {e}")
            raise
    
    def get_foot_traffic_summary(self) -> Dict:
        """Get summary of foot traffic data"""
        try:
            # Get the most recent data
            docs = self.foot_traffic_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(100).stream()
            data = [doc.to_dict() for doc in docs]
            
            if not data:
                return {
                    "totalVisitors": 0,
                    "averageDuration": 0,
                    "peakHours": [],
                    "popularLocations": []
                }
            
            # Calculate summary statistics
            total_visitors = sum(d.get('people_count', 0) for d in data)
            avg_duration = sum(d.get('avg_dwell_time', 0) for d in data) / len(data)
            
            # Get peak hours
            hour_counts = {}
            for d in data:
                hour = datetime.strptime(d.get('time', '00:00:00'), '%H:%M:%S').hour
                hour_counts[hour] = hour_counts.get(hour, 0) + d.get('people_count', 0)
            
            peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:2]
            peak_hours = [f"{hour:02d}:00" for hour, _ in peak_hours]
            
            # Get popular locations
            location_counts = {}
            for d in data:
                loc = d.get('location', 'Unknown')
                location_counts[loc] = location_counts.get(loc, 0) + d.get('people_count', 0)
            
            popular_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            popular_locations = [loc for loc, _ in popular_locations]
            
            return {
                "totalVisitors": total_visitors,
                "averageDuration": round(avg_duration, 1),
                "peakHours": peak_hours,
                "popularLocations": popular_locations
            }
        except Exception as e:
            print(f"Error getting foot traffic summary: {e}")
            raise

    def add_calendar_event(self, event_data: Dict) -> Dict:
        """Add a calendar event to Firestore"""
        try:
            # Validate required fields
            if not event_data.get('title') or not event_data.get('start'):
                raise ValueError("Missing required fields: title and start")

            # Create a new document reference
            doc_ref = self.calendar_ref.document()
            event_id = doc_ref.id
            
            # Ensure start and end are in ISO format strings
            start = event_data['start']
            end = event_data.get('end')
            
            # Format the event data
            formatted_event = {
                'id': event_id,
                'title': event_data['title'],
                'start': start,
                'end': end,
                'color': event_data.get('color', '#3B82F6'),  # Default blue color
                'type': event_data.get('type', 'task'),  # Default type
                'description': event_data.get('description', ''),
                'createdAt': firestore.SERVER_TIMESTAMP,
                'status': event_data.get('status', 'pending')  # Add status field
            }
            
            # Save to Firestore
            doc_ref.set(formatted_event)
            
            # Get the saved event to verify
            saved_event = doc_ref.get()
            if not saved_event.exists:
                raise ValueError("Failed to save event")
                
            # Convert to dict and handle timestamp
            event_dict = saved_event.to_dict()
            event_dict['id'] = event_id
            
            # Convert server timestamp to ISO string if present
            if event_dict.get('createdAt'):
                event_dict['createdAt'] = event_dict['createdAt'].isoformat()
                
            print(f"Successfully saved event: {event_dict}")  # Debug log
            return event_dict
            
        except Exception as e:
            print(f"Error adding calendar event: {e}")
            raise

    def get_calendar_events(self) -> List[Dict]:
        """Get all calendar events"""
        try:
            print("Fetching calendar events...")  # Debug log
            # Get all documents from the calendar collection, ordered by start time
            docs = self.calendar_ref.order_by('start', direction=firestore.Query.ASCENDING).stream()
            
            # Convert documents to list of dictionaries
            events = []
            for doc in docs:
                event_data = doc.to_dict()
                print(f"Retrieved event: {event_data}")  # Debug log
                
                # Ensure all required fields are present with proper defaults
                event = {
                    'id': doc.id,
                    'title': event_data.get('title', ''),
                    'start': event_data.get('start', ''),
                    'end': event_data.get('end'),
                    'color': event_data.get('color', '#3B82F6'),  # Default blue color
                    'type': event_data.get('type', 'task'),
                    'description': event_data.get('description', ''),
                    'status': event_data.get('status', 'pending')
                }
                
                # Convert any Firestore timestamps to ISO strings
                if 'createdAt' in event_data and event_data['createdAt']:
                    event['createdAt'] = event_data['createdAt'].isoformat()
                    
                events.append(event)
                
            print(f"Total events found: {len(events)}")  # Debug log
            return events
        except Exception as e:
            print(f"Error getting calendar events: {e}")
            raise

    def delete_calendar_event(self, event_id: str) -> None:
        """Delete a calendar event"""
        try:
            # Check if event exists
            event_ref = self.calendar_ref.document(event_id)
            event = event_ref.get()
            if not event.exists:
                raise ValueError(f"Event with ID {event_id} not found")
                
            # Delete the event
            event_ref.delete()
        except Exception as e:
            print(f"Error deleting calendar event: {e}")
            raise

    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate a user"""
        try:
            users = self.users_ref.where('email', '==', email).limit(1).stream()
            user = next(users, None)
            if user and user.to_dict().get('password') == password:  # In production, use proper password hashing
                user_data = user.to_dict()
                user_data['id'] = user.id
                return user_data
            return None
        except Exception as e:
            print(f"Error authenticating user: {e}")
            raise

    def create_user(self, user_data: Dict) -> Dict:
        """Create a new user"""
        try:
            # Check if user already exists
            existing_users = self.users_ref.where('email', '==', user_data['email']).limit(1).stream()
            if next(existing_users, None):
                raise Exception("User with this email already exists")

            doc_ref = self.users_ref.document()
            user_id = doc_ref.id
            user_data['id'] = user_id
            user_data['createdAt'] = firestore.SERVER_TIMESTAMP
            doc_ref.set(user_data)
            return user_data
        except Exception as e:
            print(f"Error creating user: {e}")
            raise

# Create a global instance
storage = DataStorage() 