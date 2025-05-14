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

export interface TimeSeriesDataPoint {
  timestamp: string;
  location: string;
  people_count: number;
  avg_dwell_time: number;
}

export interface MinuteAverageDataPoint {
  minute: string; // Format: "HH:MM"
  people_count: number;
  avg_dwell_time: number;
  data_points: number; // Number of data points in this minute
}

export interface HistoricalData {
  // Key is location name
  [location: string]: TimeSeriesDataPoint[];
}

export interface AggregatedHistoricalData {
  // Key is location name
  [location: string]: MinuteAverageDataPoint[];
}

// Storage key constants
const STORAGE_KEY_VIDEO_STATS = 'foottraffic_video_stats';
const STORAGE_KEY_MAP_DATA = 'foottraffic_map_data';
const STORAGE_KEY_TOTAL_COUNT = 'foottraffic_total_count';
const STORAGE_KEY_HISTORICAL_DATA = 'foottraffic_historical_data';

// Server API endpoints
const API_SAVE_STATS = '/api/save-stats';
const API_SAVE_HISTORICAL = '/api/save-historical';
const API_LOAD_HISTORICAL = '/api/load-historical';

// Maximum number of hours to keep in history
const MAX_HISTORY_HOURS = 24;

// Base URL for API calls
const getApiBaseUrl = () => {
  return window.location.hostname.includes('replit') 
    ? `https://${window.location.hostname.replace('5000', '5001')}` 
    : 'http://localhost:5001';
};

// Load initial data from localStorage if available
const loadInitialData = () => {
  try {
    const savedVideoStats = localStorage.getItem(STORAGE_KEY_VIDEO_STATS);
    const savedMapData = localStorage.getItem(STORAGE_KEY_MAP_DATA);
    const savedTotalCount = localStorage.getItem(STORAGE_KEY_TOTAL_COUNT);
    const savedHistoricalData = localStorage.getItem(STORAGE_KEY_HISTORICAL_DATA);
    
    return {
      videoStats: savedVideoStats ? JSON.parse(savedVideoStats) : null,
      mapData: savedMapData ? JSON.parse(savedMapData) : null,
      totalCount: savedTotalCount ? Number(savedTotalCount) : 0,
      historicalData: savedHistoricalData ? JSON.parse(savedHistoricalData) : {}
    };
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return { 
      videoStats: null, 
      mapData: null, 
      totalCount: 0,
      historicalData: {}
    };
  }
};

// Save data to server
const saveDataToServer = async (endpoint: string, data: any) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving data to server (${endpoint}):`, error);
    return false;
  }
};

// Load data from server
const loadDataFromServer = async (endpoint: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error loading data from server (${endpoint}):`, error);
    return null;
  }
};

// Attempt to load historical data from server on startup
const loadHistoricalDataFromServer = async () => {
  try {
    console.log('Attempting to load historical data from server...');
    const data = await loadDataFromServer(API_LOAD_HISTORICAL);
    if (data && data.status === 'success' && data.data) {
      // Validate the data structure before using it
      if (typeof data.data === 'object') {
        // Make sure we have valid historical data
        const validatedData: HistoricalData = {};
        
        // Process each location to ensure valid structure
        for (const [location, points] of Object.entries(data.data)) {
          if (Array.isArray(points)) {
            validatedData[location] = points;
          } else {
            console.warn(`Invalid data format for location ${location}, expected array but got:`, typeof points);
            validatedData[location] = []; // Initialize with empty array
          }
        }
        
        // Only update if we have actual data
        if (Object.keys(validatedData).length > 0) {
          console.log('Successfully loaded historical data from server:', Object.keys(validatedData));
          historicalDataSubject.next(validatedData);
          aggregatedHistoricalDataSubject.next(aggregateHistoricalDataByMinute(validatedData));
          saveToStorage(STORAGE_KEY_HISTORICAL_DATA, validatedData);
          return true;
        } else {
          console.warn('Server returned empty historical data object');
        }
      } else {
        console.error('Invalid historical data format, expected object:', data.data);
      }
    } else {
      console.warn('No valid historical data received from server:', data);
    }
  } catch (error) {
    console.error('Error loading historical data from server:', error);
  }
  
  // If we get here, we couldn't load data from server
  console.log('Using locally stored historical data, server data not available');
  return false;
};

// Get initial values
const initialData = loadInitialData();

// Validate historical data to ensure it has the correct structure
const validateHistoricalData = (data: any): HistoricalData => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid historical data, initializing empty object');
    return {};
  }
  
  const validatedData: HistoricalData = {};
  for (const [location, points] of Object.entries(data)) {
    if (Array.isArray(points)) {
      validatedData[location] = points;
    } else {
      console.warn(`Invalid data format for location ${location}, expected array but got:`, typeof points);
      validatedData[location] = []; // Initialize with empty array
    }
  }
  
  return validatedData;
};

// Ensure we have valid historical data
const validatedHistoricalData = validateHistoricalData(initialData.historicalData);

// Create BehaviorSubjects to hold and share state
const videoStatsSubject = new BehaviorSubject<VideoStats | null>(initialData.videoStats);
const mapDataSubject = new BehaviorSubject<MapData | null>(initialData.mapData);
const totalPeopleCountSubject = new BehaviorSubject<number>(initialData.totalCount);
const historicalDataSubject = new BehaviorSubject<HistoricalData>(validatedHistoricalData);
const aggregatedHistoricalDataSubject = new BehaviorSubject<AggregatedHistoricalData>(
  aggregateHistoricalDataByMinute(validatedHistoricalData)
);

// Save data to localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    if (data !== null) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error saving data to localStorage (${key}):`, error);
  }
};

// Add data point to historical data
const addHistoricalDataPoint = (stats: VideoStats) => {
  const currentData = historicalDataSubject.getValue();
  const location = getCameraName(stats.location);
  
  // Create new data point
  const dataPoint: TimeSeriesDataPoint = {
    timestamp: stats.timestamp,
    location,
    people_count: stats.people_count,
    avg_dwell_time: stats.avg_dwell_time
  };
  
  // Initialize array for this location if it doesn't exist
  if (!currentData[location]) {
    currentData[location] = [];
  }
  
  // Add new data point
  currentData[location].push(dataPoint);
  
  // Keep only the last MAX_HISTORY_HOURS hours of data
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - MAX_HISTORY_HOURS);
  
  // Filter out old data points
  currentData[location] = currentData[location].filter(point => 
    new Date(point.timestamp) >= cutoffTime
  );
  
  // Update the subject and save to storage
  const updatedData = { ...currentData };
  historicalDataSubject.next(updatedData);
  
  // Update aggregated data
  const aggregatedData = aggregateHistoricalDataByMinute(updatedData);
  aggregatedHistoricalDataSubject.next(aggregatedData);
  
  saveToStorage(STORAGE_KEY_HISTORICAL_DATA, updatedData);
  
  // Save to server in background
  saveDataToServer(API_SAVE_HISTORICAL, updatedData)
    .then(success => {
      if (!success) {
        console.warn('Failed to save historical data to server, data is only saved locally');
      }
    });
};

// Helper function to aggregate historical data by minute
function aggregateHistoricalDataByMinute(historicalData: HistoricalData): AggregatedHistoricalData {
  const result: AggregatedHistoricalData = {};

  // Process each location
  for (const [location, dataPoints] of Object.entries(historicalData)) {
    result[location] = [];
    
    // Group data points by minute
    const minuteGroups: { [minute: string]: TimeSeriesDataPoint[] } = {};
    
    // Ensure dataPoints is an array before using forEach
    if (Array.isArray(dataPoints)) {
      dataPoints.forEach(point => {
        const date = new Date(point.timestamp);
        // Create a key in format "HH:MM"
        const minuteKey = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        if (!minuteGroups[minuteKey]) {
          minuteGroups[minuteKey] = [];
        }
        
        minuteGroups[minuteKey].push(point);
      });
      
      // Calculate averages for each minute
      for (const [minute, points] of Object.entries(minuteGroups)) {
        // Calculate average people count
        const totalPeopleCount = points.reduce((sum, point) => sum + point.people_count, 0);
        const avgPeopleCount = totalPeopleCount / points.length;
        
        // Calculate average dwell time
        const totalDwellTime = points.reduce((sum, point) => sum + point.avg_dwell_time, 0);
        const avgDwellTime = totalDwellTime / points.length;
        
        // Create minute average data point
        const minuteAvg: MinuteAverageDataPoint = {
          minute,
          people_count: Math.round(avgPeopleCount * 10) / 10, // Round to 1 decimal place
          avg_dwell_time: Math.round(avgDwellTime * 10) / 10, // Round to 1 decimal place
          data_points: points.length
        };
        
        result[location].push(minuteAvg);
      }
      
      // Sort by minute (chronologically)
      result[location].sort((a, b) => {
        // Split HH:MM into hours and minutes
        const [aHours, aMinutes] = a.minute.split(':').map(Number);
        const [bHours, bMinutes] = b.minute.split(':').map(Number);
        
        // Compare hours, then minutes
        if (aHours !== bHours) {
          return aHours - bHours;
        }
        return aMinutes - bMinutes;
      });
    } else {
      console.warn(`Data points for location ${location} is not an array:`, dataPoints);
    }
  }
  
  return result;
}

// Helper function to format camera name
const getCameraName = (location: string) => {
  if (location?.includes('School')) return 'School Entrance Camera';
  if (location?.includes('Palengke')) return 'Palengke Market Camera';
  if (location?.includes('YouTube')) return 'YouTube Stream Camera';
  return location || 'Unknown Location';
};

// When app starts, try to load historical data from server
// Add retry mechanism for better reliability
const retryLoadHistoricalData = (retries = 3, delay = 1000) => {
  loadHistoricalDataFromServer()
    .then(success => {
      if (!success && retries > 0) {
        console.log(`Retrying historical data load (${retries} attempts left)...`);
        setTimeout(() => retryLoadHistoricalData(retries - 1, delay * 1.5), delay);
      }
    })
    .catch(err => {
      console.error('Error during historical data loading:', err);
      if (retries > 0) {
        console.log(`Retrying historical data load (${retries} attempts left) after error...`);
        setTimeout(() => retryLoadHistoricalData(retries - 1, delay * 1.5), delay);
      }
    });
};

// Start the data loading process
retryLoadHistoricalData();

// Service methods
export const sharedDataService = {
  // Current value getters
  getVideoStats: () => videoStatsSubject.getValue(),
  getMapData: () => mapDataSubject.getValue(),
  getTotalPeopleCount: () => totalPeopleCountSubject.getValue(),
  getHistoricalData: () => historicalDataSubject.getValue(),
  getAggregatedHistoricalData: () => aggregatedHistoricalDataSubject.getValue(),
  
  // Observables
  videoStats$: videoStatsSubject.asObservable(),
  mapData$: mapDataSubject.asObservable(),
  totalPeopleCount$: totalPeopleCountSubject.asObservable(),
  historicalData$: historicalDataSubject.asObservable(),
  aggregatedHistoricalData$: aggregatedHistoricalDataSubject.asObservable(),
  
  // Update methods
  updateVideoStats: (stats: VideoStats) => {
    videoStatsSubject.next(stats);
    saveToStorage(STORAGE_KEY_VIDEO_STATS, stats);
    
    // Save to server
    saveDataToServer(API_SAVE_STATS, stats);
    
    // Add to historical data
    addHistoricalDataPoint(stats);
  },
  
  updateMapData: (data: MapData) => {
    mapDataSubject.next(data);
    saveToStorage(STORAGE_KEY_MAP_DATA, data);
    
    // Calculate total people count
    const totalCount = data.markers.reduce((sum, marker) => sum + marker.count, 0);
    totalPeopleCountSubject.next(totalCount);
    saveToStorage(STORAGE_KEY_TOTAL_COUNT, totalCount);
  },
  
  // Get historical data for a specific time range
  getHistoricalDataForTimeRange: (location: string, hours: number) => {
    const data = historicalDataSubject.getValue();
    const locationData = data[location] || [];
    
    if (hours === 0) return locationData; // Return all data
    
    // Filter by time range
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return locationData.filter(point => 
      new Date(point.timestamp) >= cutoffTime
    );
  },
  
  // Get aggregated historical data for a specific time range
  getAggregatedDataForTimeRange: (location: string, hours: number) => {
    // First get the raw data filtered by time range
    const rawData = sharedDataService.getHistoricalDataForTimeRange(location, hours);
    
    // Create a temporary HistoricalData object with just this location and the filtered data
    const tempHistoricalData: HistoricalData = { [location]: rawData };
    
    // Aggregate it
    const aggregatedData = aggregateHistoricalDataByMinute(tempHistoricalData);
    
    // Return the aggregated data for this location
    return aggregatedData[location] || [];
  },
  
  // Manually trigger save to server
  saveHistoricalDataToServer: async () => {
    const data = historicalDataSubject.getValue();
    return await saveDataToServer(API_SAVE_HISTORICAL, data);
  },
  
  // Reload historical data from server
  loadHistoricalDataFromServer: async () => {
    return await loadHistoricalDataFromServer();
  },
  
  // Helper function for camera name formatting
  getCameraName
}; 