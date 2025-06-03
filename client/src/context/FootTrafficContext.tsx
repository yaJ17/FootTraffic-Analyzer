import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDashboardData } from '@/data/footTrafficData';
import { getStatisticsData } from '@/data/locationData';
import { getReportData } from '@/data/reportData';

// Define colors for camera locations
const cameraColors = {
  'School Entrance Camera': '#6366F1', // Indigo
  'Palengke Market Camera': '#D946EF', // Fuchsia
  'YouTube Stream Camera': '#14B8A6', // Teal
};

// Utility function to get consistent camera name from location string
const getCameraName = (location: string): string => {
  if (location.includes('School')) return 'School Entrance Camera';
  if (location.includes('Palengke')) return 'Palengke Market Camera';
  if (location.includes('Youtube') || location.includes('YouTube')) return 'YouTube Stream Camera';
  return location + ' Camera';
};

// Define interfaces for the data
export interface VideoStats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
  trafficCategory?: 'Low' | 'Medium' | 'High';
}

export interface LocationMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
  count: number;
}

export interface WeeklyData {
  monday: number;
  weekday: number;
  weekend: number;
  total: number;
}

interface LocationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
  currentCount: number;
  trafficValues: number[];
  dwellTimeValues: number[];
  trafficForecast: number[];
  dwellTimeForecast: number[];
}

interface AggregateTrafficData {
  time: string;
  traffic: number;
  isForecast: boolean;
}

interface GeneratedData {
  timeLabels: string[];
  forecastLabels: string[];
  locationData: LocationData[];
  aggregateTraffic: AggregateTrafficData[];
  weeklyData: WeeklyData;
}

// Utility function to generate consistent data across all visualizations
const generateConsistentLocationData = (
  currentStats: VideoStats | null,
  analysisStats: VideoStats | null,
  manilaLocations: Array<{ id: string; name: string; lat: number; lon: number; baseCount: number }>,
  dashboardStaticData: any
): GeneratedData => {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Round to current hour
  
  // Generate 24 hour labels (20 historical + 4 forecast)
  const timeLabels = Array.from({ length: 20 }, (_, i) => {
    const time = new Date(now);
    time.setHours(time.getHours() - (19 - i));
    const hours = time.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12} ${ampm}`;
  });

  // Generate forecast labels
  const forecastLabels = Array.from({ length: 4 }, (_, i) => {
    const time = new Date(now);
    time.setHours(time.getHours() + (i + 1));
    const hours = time.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12} ${ampm}`;
  });

  // Include video analysis location if it exists
  const allLocations = [...manilaLocations];
  if (analysisStats) {
    const cameraName = getCameraName(analysisStats.location);
    const analysisLocation = {
      id: 'analysis-camera',
      name: cameraName,
      lat: 14.5995,
      lon: 120.9842,
      baseCount: Math.max(50, analysisStats.people_count || 50)  // Ensure we have a reasonable base count
    };

    // Remove any existing entry with the same name to avoid duplicates
    const existingIndex = allLocations.findIndex(loc => loc.name === cameraName);
    if (existingIndex !== -1) {
      allLocations.splice(existingIndex, 1);
    }
    
    // Add the new location
    allLocations.push(analysisLocation);
    console.log('Added analysis location:', cameraName, 'with base count:', analysisLocation.baseCount);
  }

  // Generate traffic patterns for all locations
  const locationData = allLocations.map(location => {
    const isCurrentLocation = currentStats && getCameraName(currentStats.location) === location.name;
    const isAnalysisLocation = analysisStats && getCameraName(analysisStats.location) === location.name;
    
    // Generate traffic values
    const trafficValues = timeLabels.map((_, index) => {
      // For the current hour (last index), use actual stats if available
      if (index === timeLabels.length - 1) {
        if (isCurrentLocation && currentStats) {
          console.log('Using current stats for', location.name, ':', currentStats.people_count);
          return currentStats.people_count;
        }
        if (isAnalysisLocation && analysisStats) {
          console.log('Using analysis stats for', location.name, ':', analysisStats.people_count);
          return analysisStats.people_count;
        }
      }
      
      const hour = (now.getHours() - (19 - index) + 24) % 24;
      let multiplier = 1.0;
      
      // Time-based multipliers for realistic patterns
      if (hour >= 5 && hour <= 7) multiplier = 1.2;  // Early morning
      else if (hour >= 8 && hour <= 10) multiplier = 1.8;  // Morning rush
      else if (hour >= 11 && hour <= 12) multiplier = 1.4;  // Late morning
      else if (hour >= 13 && hour <= 14) multiplier = 1.9;  // Lunch time
      else if (hour >= 15 && hour <= 16) multiplier = 1.3;  // Afternoon
      else if (hour >= 17 && hour <= 19) multiplier = 2.0;  // Evening rush
      else if (hour >= 20 && hour <= 21) multiplier = 1.5;  // Evening
      else if (hour >= 22 && hour <= 23) multiplier = 0.8;  // Late night
      else if (hour >= 0 && hour <= 4) multiplier = 0.3;    // Very late night
      
      // Add controlled randomness
      multiplier *= (0.85 + Math.random() * 0.3);
      return Math.floor(location.baseCount * multiplier);
    });
    
    // Generate dwell times with actual data for current hour
    const dwellTimeValues = trafficValues.map((traffic, index) => {
      // For the current hour (last index), use actual stats if available
      if (index === timeLabels.length - 1) {
        if (isCurrentLocation && currentStats) {
          console.log('Using current dwell time for', location.name, ':', currentStats.avg_dwell_time);
          return currentStats.avg_dwell_time;
        }
        if (isAnalysisLocation && analysisStats) {
          console.log('Using analysis dwell time for', location.name, ':', analysisStats.avg_dwell_time);
          return analysisStats.avg_dwell_time;
        }
      }

      const busynessFactor = traffic / location.baseCount;
      let dwellMultiplier = 1.0;
      
      if (busynessFactor > 1.5) dwellMultiplier = 0.8;  // Busy times = shorter dwell
      else if (busynessFactor < 0.6) dwellMultiplier = 1.3;  // Quiet times = longer dwell
      
      return Math.floor((120 + Math.random() * 120) * dwellMultiplier);
    });
    
    // Generate forecasts based on recent patterns
    const recentTraffic = trafficValues.slice(-4);
    const avgTraffic = recentTraffic.reduce((sum, val) => sum + val, 0) / recentTraffic.length;
    const trendTraffic = (recentTraffic[recentTraffic.length - 1] - recentTraffic[0]) / recentTraffic.length;

    const trafficForecast = forecastLabels.map((_, i) => {
      const trendEffect = trendTraffic * (1 - (i * 0.2));
      const randomFactor = 0.05 + (i * 0.02);
      const randomVariation = avgTraffic * randomFactor * (Math.random() - 0.5);
      return Math.max(0, Math.round(avgTraffic + (trendEffect * (i + 1)) + randomVariation));
    });

    const recentDwell = dwellTimeValues.slice(-4);
    const avgDwell = recentDwell.reduce((sum, val) => sum + val, 0) / recentDwell.length;
    const trendDwell = (recentDwell[recentDwell.length - 1] - recentDwell[0]) / recentDwell.length;

    const dwellTimeForecast = forecastLabels.map((_, i) => {
      const trendEffect = trendDwell * (1 - (i * 0.2));
      const randomFactor = 0.05 + (i * 0.02);
      const randomVariation = avgDwell * randomFactor * (Math.random() - 0.5);
      return Math.max(0, Math.round(avgDwell + (trendEffect * (i + 1)) + randomVariation));
    });

    return {
      id: location.id,
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      color: cameraColors[location.name as keyof typeof cameraColors] || dashboardStaticData.locationColors[location.name] || '#dc2626',
      currentCount: trafficValues[trafficValues.length - 1],
      trafficValues,
      dwellTimeValues,
      trafficForecast,
      dwellTimeForecast
    };
  });

  // Calculate peak hours using aggregated traffic data
  const allTimeLabels = [...timeLabels, ...forecastLabels];
  const aggregateTraffic = allTimeLabels.map((label, index) => {
    const isHistorical = index < timeLabels.length;
    const total = locationData.reduce((sum, loc) => {
      if (isHistorical) {
        return sum + loc.trafficValues[index];
      } else {
        return sum + loc.trafficForecast[index - timeLabels.length];
      }
    }, 0);
    return { time: label, traffic: total, isForecast: !isHistorical };
  });

  // Calculate weekly patterns based on current day and traffic
  const currentDay = now.getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;
  const totalCurrentTraffic = locationData.reduce((sum, loc) => sum + loc.currentCount, 0);
  
  const weeklyData: WeeklyData = {
    monday: Math.floor(totalCurrentTraffic * (currentDay === 1 ? 1 : 0.9)),
    weekday: Math.floor(totalCurrentTraffic * (isWeekend ? 1.2 : 0.9)),
    weekend: Math.floor(totalCurrentTraffic * (isWeekend ? 0.8 : 1.3)),
    total: 0
  };
  weeklyData.total = weeklyData.monday + (weeklyData.weekday * 4) + (weeklyData.weekend * 2);

  return {
    timeLabels,
    forecastLabels,
    locationData,
    aggregateTraffic,
    weeklyData
  };
};

export interface FootTrafficContextType {
  videoStats: VideoStats | null;
  analysisVideoStats: VideoStats | null;
  mapData: {
    center: { lat: number; lon: number };
    zoom: number;
    zoneInfo: string;
    markers: LocationMarker[];
  } | null;
  timeSeriesData: {
    timeLabels: string[];
    forecastLabels: string[];
    locations: {
      name: string;
      color: string;
      trafficValues: number[];
      dwellTimeValues: number[];
      trafficForecast: number[];
      dwellTimeForecast: number[];
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
  updateAnalysisStats: (stats: VideoStats) => void;
}

const FootTrafficContext = createContext<FootTrafficContextType | null>(null);

export const useFootTraffic = () => {
  const context = useContext(FootTrafficContext);
  if (!context) {
    throw new Error('useFootTraffic must be used within a FootTrafficProvider');
  }
  return context;
};

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

export const FootTrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [analysisVideoStats, setAnalysisVideoStats] = useState<VideoStats | null>(null);
  const [mapData, setMapData] = useState<FootTrafficContextType['mapData']>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<FootTrafficContextType['timeSeriesData']>(null);
  const [dashboardStaticData] = useState(getDashboardData());
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  const [peakHoursData, setPeakHoursData] = useState(dashboardStaticData.defaultData.peakHours);
  const [weeklySummaryData, setWeeklySummaryData] = useState(dashboardStaticData.defaultData.weeklySummary);

  // Update all visualizations with the new data
  const updateVisualizations = (stats: VideoStats) => {
    const generatedData = generateConsistentLocationData(
      stats,
      analysisVideoStats,
      manilaLocations,
      dashboardStaticData
    );

    // Update map data
    const newMapData = {
      center: { lat: 14.5995, lon: 120.9842 }, // Manila center
      zoom: 12,
      zoneInfo: getCameraName(stats.location),
      markers: generatedData.locationData.map(loc => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        color: loc.color,
        count: loc.currentCount
      }))
    };
    setMapData(newMapData);

    // Sort locations by total traffic for consistent ordering
    const allLocations = [...generatedData.locationData]
      .sort((a, b) => {
        const aSum = a.trafficValues.reduce((sum: number, val: number) => sum + val, 0);
        const bSum = b.trafficValues.reduce((sum: number, val: number) => sum + val, 0);
        return bSum - aSum;
      });

    // Update time series data with all locations
    setTimeSeriesData({
      timeLabels: generatedData.timeLabels,
      forecastLabels: generatedData.forecastLabels,
      locations: allLocations.map(loc => ({
        name: loc.name,
        color: loc.color,
        trafficValues: loc.trafficValues,
        dwellTimeValues: loc.dwellTimeValues,
        trafficForecast: loc.trafficForecast,
        dwellTimeForecast: loc.dwellTimeForecast
      }))
    });

    // Update peak hours data
    const sortedTraffic = [...generatedData.aggregateTraffic].sort((a, b) => b.traffic - a.traffic);
    const peakHours = sortedTraffic.slice(0, 3);
    const now = new Date();
    const currentHour = now.getHours();

    const calculateTimeUntil = (peakTime: string, isForecast: boolean) => {
      const peakHour = parseInt(peakTime.split(' ')[0]);
      const isPM = peakTime.includes('PM');
      const hour24 = isPM && peakHour !== 12 ? peakHour + 12 : peakHour;
      const hourDiff = (hour24 - currentHour + 24) % 24;

      if (hourDiff === 0 && !isForecast) return 'happening now';
      if (hourDiff === 1) return 'in 1 hour';
      return `in ${hourDiff} hours` + (isForecast ? ' (forecast)' : '');
    };

    setPeakHoursData({
      peakStart: {
        time: peakHours[2].time,
        status: calculateTimeUntil(peakHours[2].time, peakHours[2].isForecast)
      },
      peakMax: {
        time: peakHours[0].time,
        status: calculateTimeUntil(peakHours[0].time, peakHours[0].isForecast)
      },
      peakEnd: {
        time: peakHours[1].time,
        status: calculateTimeUntil(peakHours[1].time, peakHours[1].isForecast)
      }
    });

    // Update weekly summary data
    setWeeklySummaryData(generatedData.weeklyData);

    // Update total people count
    setTotalPeopleCount(
      generatedData.locationData.reduce((sum: number, loc: LocationData) => sum + loc.currentCount, 0)
    );
  };

  // Function to update analysis stats from VideoAnalysis component
  const updateAnalysisStats = (stats: VideoStats) => {
    const cameraName = getCameraName(stats.location);
    console.log('Updating analysis stats for:', cameraName, 'with count:', stats.people_count);

    // Update analysis stats
    setAnalysisVideoStats({
      ...stats,
      trafficCategory: stats.people_count > 50 ? 'High' : stats.people_count > 20 ? 'Medium' : 'Low'
    });

    // Generate new consistent data with both video and analysis stats
    const generatedData = generateConsistentLocationData(
      videoStats,
      stats, // Use the new stats directly instead of waiting for state update
      manilaLocations,
      dashboardStaticData
    );

    // Update all visualizations with the new data
    setMapData({
      center: { lat: 14.5995, lon: 120.9842 },
      zoom: 12,
      zoneInfo: cameraName,
      markers: generatedData.locationData.map(loc => ({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        color: loc.color,
        count: loc.currentCount
      }))
    });

    // Sort locations by total traffic for consistent ordering
    const allLocations = [...generatedData.locationData]
      .sort((a, b) => {
        const aSum = a.trafficValues.reduce((sum: number, val: number) => sum + val, 0);
        const bSum = b.trafficValues.reduce((sum: number, val: number) => sum + val, 0);
        return bSum - aSum;
      });

    // Update time series data with all locations
    setTimeSeriesData({
      timeLabels: generatedData.timeLabels,
      forecastLabels: generatedData.forecastLabels,
      locations: allLocations.map(loc => ({
        name: loc.name,
        color: loc.color,
        trafficValues: loc.trafficValues,
        dwellTimeValues: loc.dwellTimeValues,
        trafficForecast: loc.trafficForecast,
        dwellTimeForecast: loc.dwellTimeForecast
      }))
    });

    // Update weekly summary data
    setWeeklySummaryData(generatedData.weeklyData);

    // Update total people count
    setTotalPeopleCount(
      generatedData.locationData.reduce((sum: number, loc: LocationData) => sum + loc.currentCount, 0)
    );
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
        updateVisualizations(validatedStats);
      }
    } catch (err) {
      console.error('Error fetching video analysis stats:', err);
    }
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
    analysisVideoStats,
    mapData,
    timeSeriesData,
    peakHoursData,
    weeklySummaryData,
    flaskServerUrl,
    totalPeopleCount,
    fetchVideoStats,
    updateAnalysisStats
  };

  return (
    <FootTrafficContext.Provider value={contextValue}>
      {children}
    </FootTrafficContext.Provider>
  );
};