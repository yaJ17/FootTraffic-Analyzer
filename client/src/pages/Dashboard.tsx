import React, { useState, useEffect } from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import PeakHoursCard from '@/components/dashboard/PeakHoursCard';
import WeeklySummaryChart from '@/components/dashboard/WeeklySummaryChart';
import MapView from '@/components/dashboard/MapView';
import FootTrafficChart from '@/components/dashboard/FootTrafficChart';
import DwellTimeChart from '@/components/dashboard/DwellTimeChart';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/data/footTrafficData';
import { sharedDataService, VideoStats, MapData, TimeSeriesDataPoint, MinuteAverageDataPoint } from '@/data/sharedDataService';

const Dashboard: React.FC = () => {
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [dashboardStaticData] = useState(getDashboardData());
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<{[location: string]: TimeSeriesDataPoint[]}>({});
  const [aggregatedData, setAggregatedData] = useState<{[location: string]: MinuteAverageDataPoint[]}>({});

  // Use React Query to fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json()),
  });

  // Effect to subscribe to shared data changes
  useEffect(() => {
    // Initialize from saved data if available
    const savedVideoStats = sharedDataService.getVideoStats();
    if (savedVideoStats) {
      setVideoStats(savedVideoStats);
    }
    
    const savedHistoricalData = sharedDataService.getHistoricalData();
    if (savedHistoricalData) {
      setHistoricalData(savedHistoricalData);
    }
    
    const savedAggregatedData = sharedDataService.getAggregatedHistoricalData();
    if (savedAggregatedData) {
      setAggregatedData(savedAggregatedData);
    }
    
    // Explicitly try to load from server if data is missing or empty
    if (!savedHistoricalData || Object.keys(savedHistoricalData).length === 0) {
      console.log("Dashboard: No historical data found, explicitly requesting from server");
      sharedDataService.loadHistoricalDataFromServer().then(success => {
        if (success) {
          // Update state with newly loaded data
          setHistoricalData(sharedDataService.getHistoricalData());
          setAggregatedData(sharedDataService.getAggregatedHistoricalData());
          console.log("Dashboard: Successfully loaded data from server");
        } else {
          console.warn("Dashboard: Failed to load data from server");
        }
      });
    }
    
    const totalSubscription = sharedDataService.totalPeopleCount$.subscribe(
      (count: number) => setTotalPeopleCount(count)
    );
    
    const historicalSubscription = sharedDataService.historicalData$.subscribe(
      (data) => setHistoricalData(data)
    );
    
    const aggregatedSubscription = sharedDataService.aggregatedHistoricalData$.subscribe(
      (data) => setAggregatedData(data)
    );
    
    return () => {
      totalSubscription.unsubscribe();
      historicalSubscription.unsubscribe();
      aggregatedSubscription.unsubscribe();
    };
  }, []);

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
        // Share the data with other components
        sharedDataService.updateVideoStats(validatedStats);
      }
    } catch (err) {
      console.error('Error fetching video analysis stats:', err);
      // Don't set mock stats, just keep the current ones
    }
  };

  // Fetch video stats on component mount and every 5 seconds
  useEffect(() => {
    // If we already have video stats from storage, don't fetch immediately
    const hasExistingData = sharedDataService.getVideoStats() !== null;
    
    if (!hasExistingData) {
      fetchVideoStats();
    }
    
    const interval = setInterval(() => {
      fetchVideoStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [flaskServerUrl]);

  // Effect to update map data in the shared service when videoStats changes
  useEffect(() => {
    // If we have map data from storage and no video stats yet, skip this update
    if (!videoStats && sharedDataService.getMapData() !== null) {
      return;
    }
    
    if (videoStats) {
      // Get a formatted camera name for display
      const cameraName = sharedDataService.getCameraName(videoStats.location);
      
      // Get a color for the current camera, default to red if not found
      const currentLocationColor = dashboardStaticData.locationColors[cameraName] || '#dc2626';
      
      // Create map data with current location information
      const mapData: MapData = {
        center: { lat: 14.5995, lon: 120.9842 },
        zoom: 13,
        zoneInfo: cameraName,
        markers: [
          { 
            id: '1', 
            name: cameraName, 
            lat: 14.5915, 
            lon: 120.9722, 
            color: currentLocationColor, 
            count: videoStats.people_count 
          },
          ...(dashboardData?.map?.markers?.slice(1) || dashboardStaticData.map.markers.slice(1))
        ]
      };
      
      // Share map data with other components
      sharedDataService.updateMapData(mapData);
    }
  }, [videoStats, dashboardData, dashboardStaticData]);

  if (isDashboardLoading || !videoStats) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm mb-6 h-20 animate-pulse"></div>
            <div className="bg-white rounded-lg shadow-sm mb-6 h-40 animate-pulse"></div>
            <div className="bg-white rounded-lg shadow-sm h-60 animate-pulse"></div>
          </div>
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm mb-6 h-80 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm h-60 animate-pulse"></div>
              <div className="bg-white rounded-lg shadow-sm h-60 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create KPI data from video stats
  const footTrafficKpi = {
    title: 'Traffic Detected on Current Camera',
    value: videoStats.people_count.toString(),
    icon: 'camera'
  };
  
  const totalPeopleCountKpi = {
    title: 'Total People (All Areas)',
    value: totalPeopleCount.toString(),
    icon: 'people'
  };

  // Create peak hours data (using sample or calculate from historical data if available)
  const peakHoursData = dashboardData?.peakHours || dashboardStaticData.defaultData.peakHours;

  // Create weekly summary data (using sample or calculate from historical data if available)
  const weeklySummaryData = dashboardData?.weeklySummary || dashboardStaticData.defaultData.weeklySummary;

  // Create map data with current location information
  const mapData = {
    center: { lat: 14.5995, lon: 120.9842 },
    zoom: 13,
    zoneInfo: sharedDataService.getCameraName(videoStats.location),
    markers: [
      { 
        id: '1', 
        name: sharedDataService.getCameraName(videoStats.location), 
        lat: 14.5915, 
        lon: 120.9722, 
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#dc2626', 
        count: videoStats.people_count 
      },
      ...(dashboardData?.map?.markers?.slice(1) || dashboardStaticData.map.markers.slice(1))
    ]
  };

  // Generate time labels for charts based on aggregated data
  const generateTimeLabels = () => {
    const currentCamera = sharedDataService.getCameraName(videoStats.location);
    const locationData = aggregatedData[currentCamera] || [];
    
    if (locationData.length > 0) {
      // Use last 7 minutes or whatever is available
      const minutesToShow = Math.min(7, locationData.length);
      return locationData.slice(-minutesToShow).map(point => point.minute);
    }
    
    // Fallback to default time labels
    return dashboardStaticData.footTraffic.timeLabels;
  };
  
  // Generate foot traffic values from aggregated data
  const generateFootTrafficValues = (location: string) => {
    const locationData = aggregatedData[location] || [];
    
    if (locationData.length > 0) {
      // Use last 7 minutes or whatever is available
      const minutesToShow = Math.min(7, locationData.length);
      return locationData.slice(-minutesToShow).map(point => point.people_count);
    }
    
    // Fallback: generate values based on current count
    if (location === sharedDataService.getCameraName(videoStats.location)) {
      const timeLabels = dashboardStaticData.footTraffic.timeLabels;
      const values = new Array(timeLabels.length).fill(0);
      
      // Put the current value in the second-to-last position
      if (values.length >= 3) {
        values[values.length - 2] = videoStats.people_count;
      }
      return values;
    }
    
    // For other locations, use static data
    const staticLocation = dashboardStaticData.footTraffic.locations.find(
      loc => loc.name === location
    );
    
    return staticLocation?.values || Array(7).fill(0);
  };
  
  // Generate dwell time values from aggregated data
  const generateDwellTimeValues = (location: string) => {
    const locationData = aggregatedData[location] || [];
    
    if (locationData.length > 0) {
      // Use last 7 minutes or whatever is available
      const minutesToShow = Math.min(7, locationData.length);
      return locationData.slice(-minutesToShow).map(point => point.avg_dwell_time);
    }
    
    // Fallback: generate values based on current dwell time
    if (location === sharedDataService.getCameraName(videoStats.location)) {
      const timeLabels = dashboardStaticData.dwellTime.timeLabels;
      const values = new Array(timeLabels.length).fill(0);
      
      // Put the current value in the second-to-last position
      if (values.length >= 3) {
        values[values.length - 2] = videoStats.avg_dwell_time;
      }
      return values;
    }
    
    // For other locations, use static data
    const staticLocation = dashboardStaticData.dwellTime.locations.find(
      loc => loc.name === location
    );
    
    return staticLocation?.values || Array(7).fill(0);
  };

  // Get time labels for charts
  const timeLabels = generateTimeLabels();

  // Get data from static sources and enhance with historical data
  const footTrafficData = {
    locations: [
      // Add current location data
      {
        name: sharedDataService.getCameraName(videoStats.location),
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#dc2626',
        values: generateFootTrafficValues(sharedDataService.getCameraName(videoStats.location))
      },
      ...dashboardStaticData.footTraffic.locations.map(location => ({
        name: location.name,
        color: location.color,
        values: generateFootTrafficValues(location.name)
      }))
    ],
    timeLabels
  };
  
  const dwellTimeData = {
    locations: [
      // Add current location data
      {
        name: sharedDataService.getCameraName(videoStats.location),
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#dc2626',
        values: generateDwellTimeValues(sharedDataService.getCameraName(videoStats.location))
      },
      ...dashboardStaticData.dwellTime.locations.map(location => ({
        name: location.name,
        color: location.color,
        values: generateDwellTimeValues(location.name)
      }))
    ],
    timeLabels
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - KPI Card, Peak Hours, Weekly Summary */}
        <div className="col-span-1 flex flex-col gap-6">
          <KpiCard 
            title={footTrafficKpi.title} 
            value={footTrafficKpi.value} 
            icon={footTrafficKpi.icon} 
          />
          
          <KpiCard 
            title={totalPeopleCountKpi.title} 
            value={totalPeopleCountKpi.value} 
            icon={totalPeopleCountKpi.icon} 
          />
          
          <PeakHoursCard 
            peakStart={peakHoursData.peakStart}
            peakMax={peakHoursData.peakMax}
            peakEnd={peakHoursData.peakEnd}
          />
          
          <WeeklySummaryChart 
            monday={weeklySummaryData.monday}
            weekend={weeklySummaryData.weekend}
            weekday={weeklySummaryData.weekday}
            total={weeklySummaryData.total}
          />
        </div>
        
        {/* Right Column - Map and Charts */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <MapView 
            center={mapData.center}
            zoom={mapData.zoom}
            markers={mapData.markers}
            zoneInfo={mapData.zoneInfo}
          />
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FootTrafficChart 
              locations={footTrafficData.locations}
              timeLabels={footTrafficData.timeLabels}
            />
            
            <DwellTimeChart 
              locations={dwellTimeData.locations}
              timeLabels={dwellTimeData.timeLabels}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
