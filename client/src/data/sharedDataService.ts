import { BehaviorSubject } from 'rxjs';

// Define interfaces for the data
export interface VideoStats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
}

export interface LocationMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
  count: number;
}

export interface MapData {
  center: { lat: number; lon: number };
  zoom: number;
  zoneInfo: string;
  markers: LocationMarker[];
}

// Create BehaviorSubjects to hold and share state
const videoStatsSubject = new BehaviorSubject<VideoStats | null>(null);
const mapDataSubject = new BehaviorSubject<MapData | null>(null);
const totalPeopleCountSubject = new BehaviorSubject<number>(0);

// Service methods
export const sharedDataService = {
  // Current values accessors
  getVideoStats: () => videoStatsSubject.getValue(),
  getMapData: () => mapDataSubject.getValue(),
  getTotalPeopleCount: () => totalPeopleCountSubject.getValue(),
  
  // Observable streams
  videoStats$: videoStatsSubject.asObservable(),
  mapData$: mapDataSubject.asObservable(),
  totalPeopleCount$: totalPeopleCountSubject.asObservable(),
  
  // Update methods
  updateVideoStats: (stats: VideoStats) => videoStatsSubject.next(stats),
  updateMapData: (data: MapData) => mapDataSubject.next(data),
  updateTotalPeopleCount: (count: number) => totalPeopleCountSubject.next(count),
  
  // Helper methods
  getCameraName: (location: string): string => {
    if (!location) return 'Unknown Camera';
    
    // Convert location identifier to a friendly name
    // Example: "camera1" -> "Camera 1"
    // Example: "school_entrance" -> "School Entrance"
    if (location.toLowerCase().includes('camera')) {
      return location; // Already has camera in the name
    }
    
    if (location.includes('_')) {
      // Convert snake_case to Title Case
      return location
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') + ' Camera';
    }
    
    if (/^[a-z0-9]+$/i.test(location)) {
      // If it's just a simple alphanumeric string like "camera1"
      // Try to split it into words using regex to detect numbers
      const matches = location.match(/[a-z]+|[0-9]+/gi);
      if (matches) {
        return matches
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ') + ' Camera';
      }
    }
    
    // Return as is with first letter capitalized
    return location.charAt(0).toUpperCase() + location.slice(1) + ' Camera';
  }
}; 