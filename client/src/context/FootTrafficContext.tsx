import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDashboardData } from '@/data/footTrafficData';
import { getStatisticsData } from '@/data/locationData';
import { getReportData } from '@/data/reportData';

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

export interface FootTrafficContextType {
  videoStats: VideoStats | null;
  mapData: {
    center: { lat: number; lon: number };
    zoom: number;
    zoneInfo: string;
    markers: LocationMarker[];
  } | null;
  timeSeriesData: {
    timeLabels: string[];
    locations: {
      name: string;
      color: string;
      trafficValues: number[];
      dwellTimeValues: number[];
    }[];
  } | null;
  peakHoursData: {
    peakStart: { time: string; status: string };
    peakMax: { time: string; status: string };
    peakEnd: { time: string; status: string };
  };
  weeklySummaryData: {
    monday: number;
    weekday: number;
    weekend: number;
    total: number;
  };
  flaskServerUrl: string;
  totalPeopleCount: number;
  fetchVideoStats: () => Promise<void>;
}

const FootTrafficContext = createContext<FootTrafficContextType | null>(null);

export const useFootTraffic = () => {
  const context = useContext(FootTrafficContext);
  if (!context) {
    throw new Error('useFootTraffic must be used within a FootTrafficProvider');
  }
  return context;
};

export const FootTrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [mapData, setMapData] = useState<FootTrafficContextType['mapData']>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<FootTrafficContextType['timeSeriesData']>(null);
  const [dashboardStaticData] = useState(getDashboardData());
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  
  // Initialize with default data
  const [peakHoursData, setPeakHoursData] = useState(dashboardStaticData.defaultData.peakHours);
  const [weeklySummaryData, setWeeklySummaryData] = useState(dashboardStaticData.defaultData.weeklySummary);

  // Manila locations for map visualization
  const manilaLocations = [
    { id: '1', name: 'Makati CBD', lat: 14.5547, lon: 121.0244, baseCount: 280 },
    { id: '2', name: 'Bonifacio Global City', lat: 14.5508, lon: 121.0551, baseCount: 340 },
    { id: '3', name: 'SM Mall of Asia', lat: 14.5355, lon: 120.9841, baseCount: 420 },
    { id: '4', name: 'Quezon City Circle', lat: 14.6515, lon: 121.0507, baseCount: 180 },
    { id: '5', name: 'Divisoria Market', lat: 14.6019, lon: 120.9724, baseCount: 390 },
    { id: '6', name: 'Intramuros', lat: 14.5915, lon: 120.9722, baseCount: 160 },
    { id: '7', name: 'Rizal Park', lat: 14.5832, lon: 120.9822, baseCount: 200 },
    { id: '8', name: 'University Belt', lat: 14.6042, lon: 120.9822, baseCount: 290 },
    { id: '9', name: 'Binondo', lat: 14.6010, lon: 120.9767, baseCount: 230 }
  ];

  // Time-based multiplier to create realistic data patterns
  const getCurrentMultiplier = () => {
    const hour = new Date().getHours();
    
    // Morning rush hour
    if (hour >= 7 && hour <= 9) return 1.6;
    // Lunch time
    if (hour >= 11 && hour <= 13) return 1.8;
    // Evening rush hour
    if (hour >= 17 && hour <= 19) return 2.0;
    // Late night
    if (hour >= 22 || hour <= 4) return 0.4;
    // Default for other times
    return 1.0;
  };

  // Get a formatted camera name for display
  const getCameraName = (location: string): string => {
    if (location?.includes('School')) return 'School Entrance Camera';
    if (location?.includes('Palengke')) return 'Palengke Market Camera';
    if (location?.includes('YouTube')) return 'YouTube Stream Camera';
    return location || 'Unknown Location';
  };

  // Determine Flask server URL based on hostname
  useEffect(() => {
    const baseUrl = window.location.hostname.includes('replit') 
      ? `https://${window.location.hostname.replace('5000', '5001')}` 
      : 'http://localhost:5001';
    setFlaskServerUrl(baseUrl);
  }, []);

  // Fetch video stats from Flask backend
  const fetchVideoStats = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${flaskServerUrl}/api/stats`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video analysis stats');
      }
      
      const data = await response.json();
      
      // Ensure we have a valid stats object with required fields
      if (data && typeof data === 'object' && data.stats) {
        // Create a validated stats object with defaults for missing values
        const validatedStats: VideoStats = {
          people_count: data.stats.people_count || 0,
          avg_dwell_time: data.stats.people_count === 0 ? 0 : (data.stats.avg_dwell_time || 0),
          highest_dwell_time: data.stats.highest_dwell_time || 0,
          location: data.stats.location || 'Unknown Location',
          timestamp: data.stats.timestamp || new Date().toISOString()
        };
        
        setVideoStats(validatedStats);
        updateDerivedData(validatedStats);
      }
    } catch (err) {
      console.error('Error fetching video analysis stats:', err);
      
      // Generate some realistic sample data if we can't fetch real data
      if (!videoStats) {
        const timeMultiplier = getCurrentMultiplier();
        const sampleStats: VideoStats = {
          people_count: Math.floor(45 * timeMultiplier + Math.random() * 20),
          avg_dwell_time: Math.floor(120 * timeMultiplier + Math.random() * 60),
          highest_dwell_time: Math.floor(300 * timeMultiplier + Math.random() * 120),
          location: 'Sample Location',
          timestamp: new Date().toISOString()
        };
        setVideoStats(sampleStats);
        updateDerivedData(sampleStats);
      }
    }
  };

  // Update all derived data whenever videoStats changes
  const updateDerivedData = (stats: VideoStats) => {
    // Update map data
    const timeMultiplier = getCurrentMultiplier();
    const getVariation = () => 0.8 + (Math.random() * 0.4);
    
    // Generate correlated markers based on base counts and time of day
    const markers = manilaLocations.map(location => {
      // Use actual video stats count for the current camera's location
      const isCurrentLocation = location.name === getCameraName(stats.location) ||
                              (location.id === '6' && stats.location.includes('YouTube'));
      
      const count = isCurrentLocation 
        ? stats.people_count 
        : Math.floor(location.baseCount * timeMultiplier * getVariation());
        
      return {
        id: location.id,
        name: location.name,
        lat: location.lat,
        lon: location.lon,
        color: dashboardStaticData.locationColors[location.name] || '#dc2626',
        count
      };
    });
    
    const newMapData = {
      center: { lat: 14.5995, lon: 120.9842 }, // Manila center
      zoom: 12,
      zoneInfo: getCameraName(stats.location),
      markers
    };
    setMapData(newMapData);
    
    // Calculate total people count
    const totalCount = markers.reduce((total, marker) => total + marker.count, 0);
    setTotalPeopleCount(totalCount);
    
    // Generate time series data
    // Generate realistic time labels based on current time
    const now = new Date();
    const timeLabels = Array.from({ length: 12 }, (_, i) => {
      const time = new Date(now);
      time.setHours(time.getHours() - (11 - i));
      return time.getHours() + ':00';
    });
    
    // Generate data for each location with realistic patterns
    const locations = manilaLocations.map(location => {
      const isCurrentLocation = location.name === getCameraName(stats.location) ||
                              (location.id === '6' && stats.location.includes('YouTube'));
      
      // Create realistic traffic patterns based on time of day
      const trafficValues = timeLabels.map((label, index) => {
        const hour = parseInt(label.split(':')[0]);
        let multiplier = 1.0;
        
        // Morning rush
        if (hour >= 7 && hour <= 9) multiplier = 1.6;
        // Lunch time
        if (hour >= 11 && hour <= 13) multiplier = 1.8;
        // Evening rush 
        if (hour >= 17 && hour <= 19) multiplier = 2.0;
        // Late night
        if (hour >= 22 || hour <= 4) multiplier = 0.4;
        
        // Add some randomness
        multiplier *= (0.85 + Math.random() * 0.3);
        
        // If it's the current location and current hour, use actual value
        if (isCurrentLocation && index === timeLabels.length - 1) {
          return stats.people_count;
        }
        
        return Math.floor(location.baseCount * multiplier);
      });
      
      // Create correlated dwell time values
      const dwellTimeValues = trafficValues.map((traffic, index) => {
        // Dwell time is somewhat inversely related to traffic
        // When very busy, people tend to move quicker
        const busynessFactor = traffic / location.baseCount;
        let dwellMultiplier = 1.0;
        
        if (busynessFactor > 1.5) dwellMultiplier = 0.8;
        else if (busynessFactor < 0.6) dwellMultiplier = 1.3;
        
        // If it's the current location and current hour, use actual value
        if (isCurrentLocation && index === timeLabels.length - 1) {
          return stats.avg_dwell_time;
        }
        
        // Base dwell time between 2-4 minutes
        return Math.floor((120 + Math.random() * 120) * dwellMultiplier);
      });
      
      return {
        name: location.name,
        color: dashboardStaticData.locationColors[location.name] || '#dc2626',
        trafficValues,
        dwellTimeValues
      };
    });
    
    // Only include the top 5 locations by traffic for clarity
    const topLocations = [...locations].sort((a, b) => {
      const aSum = a.trafficValues.reduce((sum, val) => sum + val, 0);
      const bSum = b.trafficValues.reduce((sum, val) => sum + val, 0);
      return bSum - aSum;
    }).slice(0, 5);
    
    setTimeSeriesData({
      timeLabels,
      locations: topLocations
    });
    
    // Calculate peak hours data
    if (timeSeriesData) {
      // Explicitly type the timeLabels and locations variables
      const peakTimeLabels: string[] = timeLabels;
      const peakLocations: {
        name: string;
        color: string;
        trafficValues: number[];
        dwellTimeValues: number[];
      }[] = topLocations;
      
      // Aggregate traffic across all locations for each time period
      const aggregateTraffic = peakTimeLabels.map((label: string, index: number) => {
        const total = peakLocations.reduce((sum, location) => sum + location.trafficValues[index], 0);
        return { time: label, traffic: total };
      });
      
      // Sort by traffic to find peak times
      const sortedTraffic = [...aggregateTraffic].sort((a, b) => b.traffic - a.traffic);
      
      // Get top 3 peak hours
      const peakHours = sortedTraffic.slice(0, 3);
      
      // Current time
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate time until peak
      const calculateTimeUntil = (peakHour: number) => {
        const hourDiff = (peakHour - currentHour + 24) % 24;
        if (hourDiff === 0) return 'happening now';
        if (hourDiff === 1) return 'in 1 hour';
        return `in ${hourDiff} hours`;
      };
      
      setPeakHoursData({
        peakStart: { 
          time: peakHours[2].time, 
          status: calculateTimeUntil(parseInt(peakHours[2].time.split(':')[0]))
        },
        peakMax: { 
          time: peakHours[0].time, 
          status: calculateTimeUntil(parseInt(peakHours[0].time.split(':')[0]))
        },
        peakEnd: { 
          time: peakHours[1].time, 
          status: calculateTimeUntil(parseInt(peakHours[1].time.split(':')[0]))
        }
      });
    }
    
    // Calculate weekly summary data
    const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    // Calculate total based on current traffic multiplied by daily factors
    const currentTraffic = stats.people_count;
    
    // Set baseline for the week
    const mondayTraffic = Math.floor(currentTraffic * (currentDay === 1 ? 1 : 0.9));
    const weekdayAvg = Math.floor(currentTraffic * (isWeekend ? 1.2 : 0.9));
    const weekendAvg = Math.floor(currentTraffic * (isWeekend ? 0.8 : 1.3));
    
    // Calculate total weekly traffic
    const weeklyTotal = mondayTraffic + (weekdayAvg * 4) + (weekendAvg * 2);
    
    setWeeklySummaryData({
      monday: mondayTraffic,
      weekday: weekdayAvg,
      weekend: weekendAvg,
      total: weeklyTotal
    });
  };

  // Fetch video stats on component mount and every 5 seconds
  useEffect(() => {
    fetchVideoStats();
    
    const interval = setInterval(() => {
      fetchVideoStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [flaskServerUrl]);

  const contextValue: FootTrafficContextType = {
    videoStats,
    mapData,
    timeSeriesData,
    peakHoursData,
    weeklySummaryData,
    flaskServerUrl,
    totalPeopleCount,
    fetchVideoStats
  };

  return (
    <FootTrafficContext.Provider value={contextValue}>
      {children}
    </FootTrafficContext.Provider>
  );
}; 