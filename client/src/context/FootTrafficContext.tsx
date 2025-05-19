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

export const FootTrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [analysisVideoStats, setAnalysisVideoStats] = useState<VideoStats | null>(null);
  const [mapData, setMapData] = useState<FootTrafficContextType['mapData']>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<FootTrafficContextType['timeSeriesData']>(null);
  const [dashboardStaticData] = useState(getDashboardData());
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  
  // Initialize with default data
  const [peakHoursData, setPeakHoursData] = useState(dashboardStaticData.defaultData.peakHours);
  const [weeklySummaryData, setWeeklySummaryData] = useState(dashboardStaticData.defaultData.weeklySummary);

  // Function to generate forecast data based on historical patterns
  const generateForecast = (historicalData: number[], numPoints: number = 4): number[] => {
    if (historicalData.length < 4) return Array(numPoints).fill(0);
    
    // Get the last few data points to identify trends
    const recentData = historicalData.slice(-4);
    const avg = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
    
    // Calculate the recent trend (positive or negative)
    const trend = (recentData[recentData.length - 1] - recentData[0]) / recentData.length;
    
    // Create a forecast with some randomness and trend continuation
    return Array.from({ length: numPoints }, (_, i) => {
      // Apply trend with decay (trend strength decreases over time)
      const trendEffect = trend * (1 - (i * 0.2));
      
      // Add randomness that increases with forecast distance
      const randomFactor = 0.05 + (i * 0.02);
      const randomVariation = avg * randomFactor * (Math.random() - 0.5);
      
      // Calculate the forecasted value
      let forecastValue = avg + (trendEffect * (i + 1)) + randomVariation;
      
      // Ensure forecast values are non-negative and reasonable
      forecastValue = Math.max(0, Math.round(forecastValue));
      
      return forecastValue;
    });
  };
  // Generate forecast time labels (future hours)
  const generateForecastLabels = (lastTimeLabel: string, numPoints: number = 4): string[] => {
    const [timeStr, period] = lastTimeLabel.split(' ');
    let hour = parseInt(timeStr);
    let currentPeriod = period;
    
    return Array.from({ length: numPoints }, (_, i) => {
      hour = hour % 12 + 1;
      if (hour === 12) {
        currentPeriod = currentPeriod === 'AM' ? 'PM' : 'AM';
      }
      return `${hour} ${currentPeriod}`;
    });
  };

  // Function to update analysis stats from VideoAnalysis component
  const updateAnalysisStats = (stats: VideoStats) => {
    setAnalysisVideoStats(stats);
    
    // Add this location's stats to the map data and time series data
    if (stats && mapData && timeSeriesData) {
      // Create a new marker for this location if it doesn't exist
      const locationExists = mapData.markers.some(marker => 
        marker.name === getCameraName(stats.location));
      
      if (!locationExists) {
        // Add a new location to the map with appropriate coordinates
        const newMarker: LocationMarker = {
          id: `analysis-${Date.now()}`,
          name: getCameraName(stats.location),
          // Assign a position near Manila
          lat: 14.5995 + (Math.random() * 0.1 - 0.05),
          lon: 120.9842 + (Math.random() * 0.1 - 0.05),
          color: '#3b82f6', // Blue color for analysis location
          count: stats.people_count
        };
        
        setMapData({
          ...mapData,
          markers: [...mapData.markers, newMarker]
        });
        
        // Also add to time series data
        const now = new Date();
        const currentHour = `${now.getHours()}:00`;
        
        // Check if we need to add this timeLabel
        if (timeSeriesData.timeLabels[timeSeriesData.timeLabels.length - 1] !== currentHour) {
          // Add the new time point
          const newTimeLabels = [...timeSeriesData.timeLabels.slice(1), currentHour];
          const newForecastLabels = generateForecastLabels(currentHour);
          
          // Add the new location to time series
          const newLocation = {
            name: getCameraName(stats.location),
            color: '#3b82f6',
            trafficValues: Array(20).fill(0).slice(1).concat([stats.people_count]),
            dwellTimeValues: Array(20).fill(0).slice(1).concat([stats.avg_dwell_time]),
            trafficForecast: generateForecast([stats.people_count]),
            dwellTimeForecast: generateForecast([stats.avg_dwell_time])
          };
          
          setTimeSeriesData({
            timeLabels: newTimeLabels,
            forecastLabels: newForecastLabels,
            locations: [...timeSeriesData.locations, newLocation]
          });
        } else {
          // Just update the existing time series data with the new location
          const newLocation = {
            name: getCameraName(stats.location),
            color: '#3b82f6',            trafficValues: Array(20).fill(0).slice(1).concat([stats.people_count]),
            dwellTimeValues: Array(20).fill(0).slice(1).concat([stats.avg_dwell_time]),
            trafficForecast: generateForecast([stats.people_count]),
            dwellTimeForecast: generateForecast([stats.avg_dwell_time])
          };
          
          setTimeSeriesData({
            ...timeSeriesData,
            locations: [...timeSeriesData.locations, newLocation]
          });
        }
      } else {
        // Update existing location's stats
        setMapData({
          ...mapData,
          markers: mapData.markers.map(marker => {
            if (marker.name === getCameraName(stats.location)) {
              return { ...marker, count: stats.people_count };
            }
            return marker;
          })
        });
        
        // Update time series data for this location
        setTimeSeriesData({
          ...timeSeriesData,
          locations: timeSeriesData.locations.map(loc => {
            if (loc.name === getCameraName(stats.location)) {
              // Update the latest values
              const updatedTrafficValues = [...loc.trafficValues];
              const updatedDwellTimeValues = [...loc.dwellTimeValues];
              updatedTrafficValues[updatedTrafficValues.length - 1] = stats.people_count;
              updatedDwellTimeValues[updatedDwellTimeValues.length - 1] = stats.avg_dwell_time;
              
              // Generate updated forecasts
              const updatedTrafficForecast = generateForecast(updatedTrafficValues);
              const updatedDwellTimeForecast = generateForecast(updatedDwellTimeValues);
              
              return {
                ...loc,
                trafficValues: updatedTrafficValues,
                dwellTimeValues: updatedDwellTimeValues,
                trafficForecast: updatedTrafficForecast,
                dwellTimeForecast: updatedDwellTimeForecast
              };
            }
            return loc;
          })
        });
      }
    }
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

  // Time-based multiplier to create realistic data patterns
  const getCurrentMultiplier = () => {
    const hour = new Date().getHours();
    
    // Early morning
    if (hour >= 5 && hour <= 7) return 1.2;
    // Morning rush
    if (hour >= 8 && hour <= 10) return 1.8;
    // Late morning
    if (hour >= 11 && hour <= 12) return 1.4;
    // Lunch time
    if (hour >= 13 && hour <= 14) return 1.9;
    // Afternoon
    if (hour >= 15 && hour <= 16) return 1.3;
    // Evening rush
    if (hour >= 17 && hour <= 19) return 2.0;
    // Evening
    if (hour >= 20 && hour <= 21) return 1.5;
    // Late night
    if (hour >= 22 && hour <= 23) return 0.8;
    // Very late night / early morning
    if (hour >= 0 && hour <= 4) return 0.3;
    // Default for any other time
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

    // Add analysis video stats marker if it exists
    if (analysisVideoStats) {
      const analysisLocationName = getCameraName(analysisVideoStats.location);
      // Check if the location already exists in our markers
      const existingMarkerIndex = markers.findIndex(m => m.name === analysisLocationName);
      
      if (existingMarkerIndex === -1) {
        // Add a new marker for the analysis location
        markers.push({
          id: `analysis-${Date.now()}`,
          name: analysisLocationName,
          lat: 14.5995 + (Math.random() * 0.1 - 0.05),
          lon: 120.9842 + (Math.random() * 0.1 - 0.05),
          color: '#3b82f6', // Blue color for analysis location
          count: analysisVideoStats.people_count
        });
      } else {
        // Update the existing marker with analysis data
        markers[existingMarkerIndex].count = analysisVideoStats.people_count;
      }
    }
    
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
    now.setMinutes(0, 0, 0); // Just set to current hour without rounding
      // Generate time labels for the last 20 hours
    const timeLabels = Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now);
      time.setHours(time.getHours() - (19 - i));  // Changed from 9-i to 19-i for 20-hour window
      const hours = time.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12} ${ampm}`;
    });

    // Generate forecast labels (future hours)
    const forecastLabels = generateForecastLabels(timeLabels[timeLabels.length - 1]);
    
    // Generate data for each location with realistic patterns
    const locations = manilaLocations.map(location => {
      const isCurrentLocation = location.name === getCameraName(stats.location) ||
                              (location.id === '6' && stats.location.includes('YouTube'));
      
      // Create realistic traffic patterns based on time of day
      const trafficValues = timeLabels.map((label, index) => {
        const hour = parseInt(label.split(':')[0]);
        let multiplier = 1.0;
        
        // Early morning (5-7)
        if (hour >= 5 && hour <= 7) multiplier = 1.2;
        // Morning rush (8-10)
        if (hour >= 8 && hour <= 10) multiplier = 1.8;
        // Late morning (11-12)
        if (hour >= 11 && hour <= 12) multiplier = 1.4;
        // Lunch time (13-14)
        if (hour >= 13 && hour <= 14) multiplier = 1.9;
        // Afternoon (15-16)
        if (hour >= 15 && hour <= 16) multiplier = 1.3;
        // Evening rush (17-19)
        if (hour >= 17 && hour <= 19) multiplier = 2.0;
        // Evening (20-21)
        if (hour >= 20 && hour <= 21) multiplier = 1.5;
        // Late night (22-23)
        if (hour >= 22 && hour <= 23) multiplier = 0.8;
        // Very late night / early morning (0-4)
        if (hour >= 0 && hour <= 4) multiplier = 0.3;
        
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

      // Generate forecast data for next 4 hours
      const trafficForecast = generateForecast(trafficValues);
      const dwellTimeForecast = generateForecast(dwellTimeValues);
      
      return {
        name: location.name,
        color: dashboardStaticData.locationColors[location.name] || '#dc2626',
        trafficValues,
        dwellTimeValues,
        trafficForecast,
        dwellTimeForecast
      };
    });

    // Add analysis video stats to time series if it exists
    if (analysisVideoStats) {
      const analysisLocationName = getCameraName(analysisVideoStats.location);
      // Check if the location already exists in our locations
      const existingLocationIndex = locations.findIndex(l => l.name === analysisLocationName);
      
      if (existingLocationIndex === -1) {
        // Create traffic and dwell time values for this location
        const trafficValues = Array(timeLabels.length).fill(0);
        const dwellTimeValues = Array(timeLabels.length).fill(0);
        
        // Set the current hour's values
        trafficValues[trafficValues.length - 1] = analysisVideoStats.people_count;
        dwellTimeValues[dwellTimeValues.length - 1] = analysisVideoStats.avg_dwell_time;
        
        // Generate forecast data
        const trafficForecast = generateForecast(trafficValues);
        const dwellTimeForecast = generateForecast(dwellTimeValues);
        
        // Add the new location to the array
        locations.push({
          name: analysisLocationName,
          color: '#3b82f6', // Blue color for analysis location
          trafficValues,
          dwellTimeValues,
          trafficForecast,
          dwellTimeForecast
        });
      } else {
        // Update the existing location with analysis data
        locations[existingLocationIndex].trafficValues[timeLabels.length - 1] = analysisVideoStats.people_count;
        locations[existingLocationIndex].dwellTimeValues[timeLabels.length - 1] = analysisVideoStats.avg_dwell_time;
        
        // Update forecast data
        locations[existingLocationIndex].trafficForecast = generateForecast(locations[existingLocationIndex].trafficValues);
        locations[existingLocationIndex].dwellTimeForecast = generateForecast(locations[existingLocationIndex].dwellTimeValues);
      }
    }
    
    // Only include the top 5 locations by traffic for clarity
    const topLocations = [...locations].sort((a, b) => {
      const aSum = a.trafficValues.reduce((sum, val) => sum + val, 0);
      const bSum = b.trafficValues.reduce((sum, val) => sum + val, 0);
      return bSum - aSum;
    }).slice(0, 5);
    
    setTimeSeriesData({
      timeLabels,
      forecastLabels,
      locations: topLocations
    });
    
    // Calculate peak hours data using actual timeSeriesData instead of generating random values
    if (timeSeriesData) {
      // Explicitly type the timeLabels and locations variables
      const peakTimeLabels: string[] = timeLabels;
      const peakLocations: {
        name: string;
        color: string;
        trafficValues: number[];
        dwellTimeValues: number[];
        trafficForecast: number[];
        dwellTimeForecast: number[];
      }[] = topLocations;
      
      // Combine historical and forecast data for improved peak detection
      const combinedTimeLabels = [...timeLabels, ...forecastLabels];
      
      // Aggregate traffic across all locations for each time period (including forecast)
      const aggregateTraffic = combinedTimeLabels.map((label: string, index: number) => {
        // Check if we're in the historical or forecast period
        const isHistorical = index < timeLabels.length;
        
        let total = 0;
        if (isHistorical) {
          // Sum historical values
          total = peakLocations.reduce((sum, location) => sum + location.trafficValues[index], 0);
        } else {
          // Sum forecasted values
          const forecastIndex = index - timeLabels.length;
          total = peakLocations.reduce((sum, location) => sum + location.trafficForecast[forecastIndex], 0);
        }
        
        return { time: label, traffic: total, isForecast: !isHistorical };
      });
      
      // Sort by traffic to find peak times
      const sortedTraffic = [...aggregateTraffic].sort((a, b) => b.traffic - a.traffic);
      
      // Get top 3 peak hours
      const peakHours = sortedTraffic.slice(0, 3);
      
      // Current time
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate time until peak
      const calculateTimeUntil = (peakHour: number, isForecast: boolean) => {
        const hourDiff = (peakHour - currentHour + 24) % 24;
        
        if (hourDiff === 0 && !isForecast) return 'happening now';
        if (hourDiff === 1) return 'in 1 hour';
        return `in ${hourDiff} hours` + (isForecast ? ' (forecast)' : '');
      };
      
      setPeakHoursData({
        peakStart: { 
          time: peakHours[2].time, 
          status: calculateTimeUntil(parseInt(peakHours[2].time.split(':')[0]), peakHours[2].isForecast)
        },
        peakMax: { 
          time: peakHours[0].time, 
          status: calculateTimeUntil(parseInt(peakHours[0].time.split(':')[0]), peakHours[0].isForecast)
        },
        peakEnd: { 
          time: peakHours[1].time, 
          status: calculateTimeUntil(parseInt(peakHours[1].time.split(':')[0]), peakHours[1].isForecast)
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