import React, { useState, useEffect } from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import PeakHoursCard from '@/components/dashboard/PeakHoursCard';
import WeeklySummaryChart from '@/components/dashboard/WeeklySummaryChart';
import MapView from '@/components/dashboard/MapView';
import FootTrafficChart from '@/components/dashboard/FootTrafficChart';
import DwellTimeChart from '@/components/dashboard/DwellTimeChart';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/data/footTrafficData';
import { sharedDataService, VideoStats, MapData } from '@/data/sharedDataService';

const Dashboard: React.FC = () => {
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [dashboardStaticData] = useState(getDashboardData());
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);

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
        
        // Update total people count based on current count (simplified)
        setTotalPeopleCount(validatedStats.people_count);
        sharedDataService.updateTotalPeopleCount(validatedStats.people_count);
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

  // Effect to update map data in the shared service when videoStats changes
  useEffect(() => {
    if (videoStats) {
      // Get a formatted camera name for display
      const cameraName = sharedDataService.getCameraName(videoStats.location);
      
      // Get a color for the current camera, default to red if not found
      const currentLocationColor = dashboardStaticData.locationColors[cameraName] || '#e6194b';
      
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
          }
        ]
      };
      
      // Share map data with other components
      sharedDataService.updateMapData(mapData);
    }
  }, [videoStats, dashboardStaticData]);

  if (!videoStats) {
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
    title: 'Current People Count',
    value: videoStats.people_count.toString(),
    icon: 'groups'
  };
  
  const dwellTimeKpi = {
    title: 'Average Dwell Time',
    value: `${Math.round(videoStats.avg_dwell_time)} sec`,
    icon: 'timer'
  };

  // Use default data for components that don't relate directly to video stats
  const peakHoursData = dashboardStaticData.defaultData.peakHours;
  const weeklySummaryData = dashboardStaticData.defaultData.weeklySummary;

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
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#e6194b', 
        count: videoStats.people_count 
      }
    ]
  };

  // Generate simulated historical data based on current values
  const generateTimeSeriesData = () => {
    // Create time labels for the last 7 hours
    const now = new Date();
    const timeLabels = Array.from({ length: 7 }, (_, i) => {
      const time = new Date(now);
      time.setHours(time.getHours() - (6 - i));
      const hour = time.getHours();
      const amPm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12} ${amPm}`;
    });
    
    // Create synthetic traffic values based on current count
    const trafficValues = [
      Math.max(1, Math.round(videoStats.people_count * 0.6)),
      Math.max(1, Math.round(videoStats.people_count * 0.7)),
      Math.max(1, Math.round(videoStats.people_count * 0.5)),
      Math.max(1, Math.round(videoStats.people_count * 0.8)),
      Math.max(1, Math.round(videoStats.people_count * 0.9)),
      Math.max(1, Math.round(videoStats.people_count * 0.7)),
      videoStats.people_count
    ];
    
    // Create synthetic dwell time values
    const dwellValues = [
      Math.max(1, Math.round(videoStats.avg_dwell_time * 0.8)),
      Math.max(1, Math.round(videoStats.avg_dwell_time * 0.9)),
      Math.max(1, Math.round(videoStats.avg_dwell_time * 0.7)),
      Math.max(1, Math.round(videoStats.avg_dwell_time * 1.0)),
      Math.max(1, Math.round(videoStats.avg_dwell_time * 1.1)),
      Math.max(1, Math.round(videoStats.avg_dwell_time * 0.9)),
      videoStats.avg_dwell_time
    ];
    
    return { timeLabels, trafficValues, dwellValues };
  };
  
  const { timeLabels, trafficValues, dwellValues } = generateTimeSeriesData();
  
  // Create foot traffic chart data
  const footTrafficData = {
    locations: [
      {
        name: sharedDataService.getCameraName(videoStats.location),
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#e6194b',
        values: trafficValues
      }
    ],
    timeLabels
  };
  
  // Create dwell time chart data
  const dwellTimeData = {
    locations: [
      {
        name: sharedDataService.getCameraName(videoStats.location),
        color: dashboardStaticData.locationColors[sharedDataService.getCameraName(videoStats.location)] || '#e6194b',
        values: dwellValues
      }
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
            title={dwellTimeKpi.title} 
            value={dwellTimeKpi.value} 
            icon={dwellTimeKpi.icon} 
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
          
          {/* Information Box */}
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 text-sm text-gray-600 flex items-start">
            <span className="material-icons mr-2 text-amber-500">info</span>
            <p>This application is using real-time data from video analysis without historical persistence. The charts show simulated historical data based on current values.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
