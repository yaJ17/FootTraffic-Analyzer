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
  // Current value getters
  getVideoStats: () => videoStatsSubject.getValue(),
  getMapData: () => mapDataSubject.getValue(),
  getTotalPeopleCount: () => totalPeopleCountSubject.getValue(),
  
  // Observables
  videoStats$: videoStatsSubject.asObservable(),
  mapData$: mapDataSubject.asObservable(),
  totalPeopleCount$: totalPeopleCountSubject.asObservable(),
  
  // Update methods
  updateVideoStats: (stats: VideoStats) => {
    videoStatsSubject.next(stats);
  },
  
  updateMapData: (data: MapData) => {
    mapDataSubject.next(data);
    
    // Calculate total people count
    const totalCount = data.markers.reduce((sum, marker) => sum + marker.count, 0);
    totalPeopleCountSubject.next(totalCount);
  },
  
  // Helper function to format camera name
  getCameraName: (location: string) => {
    if (location?.includes('School')) return 'School Entrance Camera';
    if (location?.includes('Palengke')) return 'Palengke Market Camera';
    if (location?.includes('YouTube')) return 'YouTube Stream Camera';
    return location || 'Unknown Location';
  }
}; 