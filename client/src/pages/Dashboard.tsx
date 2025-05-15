import React, { useState, useEffect } from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import PeakHoursCard from '@/components/dashboard/PeakHoursCard';
import WeeklySummaryChart from '@/components/dashboard/WeeklySummaryChart';
import MapView from '@/components/dashboard/MapView';
import FootTrafficChart from '@/components/dashboard/FootTrafficChart';
import DwellTimeChart from '@/components/dashboard/DwellTimeChart';
import { useQuery } from '@tanstack/react-query';

// Define interface for stats from the API
interface VideoStats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);

  // Use React Query to fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json()),
  });

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
        const validatedStats: VideoStats = {
          people_count: data.stats.people_count || 0,
          avg_dwell_time: data.stats.avg_dwell_time || 0,
          highest_dwell_time: data.stats.highest_dwell_time || 0,
          location: data.stats.location || 'Unknown Location',
          timestamp: data.stats.timestamp || new Date().toISOString()
        };
        
        setVideoStats(validatedStats);
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

  // Get a formatted camera name for display
  const getCameraName = (location: string) => {
    if (location.includes('School')) return 'School Entrance Camera';
    if (location.includes('Palengke')) return 'Palengke Market Camera';
    if (location.includes('YouTube')) return 'YouTube Stream Camera';
    return location;
  };

  // Create KPI data from video stats
  const footTrafficKpi = {
    title: 'Total Foot Traffic',
    value: videoStats.people_count.toString(),
    icon: 'groups'
  };

  // Create peak hours data (using sample or calculate from historical data if available)
  const peakHoursData = dashboardData?.peakHours || {
    peakStart: { time: '9 AM', status: 'Peak already started' },
    peakMax: { time: '12 PM', status: 'Peak in 3 hours already started' },
    peakEnd: { time: '8 PM', status: '9 hours and 5 minutes' }
  };

  // Create weekly summary data (using sample or calculate from historical data if available)
  const weeklySummaryData = dashboardData?.weeklySummary || {
    monday: 300,
    weekend: 229,
    weekday: 400,
    total: 929
  };

  // Create map data with current location information
  const mapData = {
    center: { lat: 14.5995, lon: 120.9842 },
    zoom: 13,
    zoneInfo: getCameraName(videoStats.location),
    markers: [
      { 
        id: '1', 
        name: getCameraName(videoStats.location), 
        lat: 14.5915, 
        lon: 120.9722, 
        color: '#dc2626', 
        count: videoStats.people_count 
      },
      ...(dashboardData?.map?.markers?.slice(1) || [])
    ]
  };
  function generateDynamicTimeLabels(hours: number, interval: number): string[] {
    const labels: string[] = [];
    const now = new Date();

    // Round current hour down to the nearest interval
    const currentHour = now.getHours();
    const roundedCurrentHour = Math.floor(currentHour / interval) * interval;

    // Start from (hours) hours ago, and move forward in (interval) hour steps
    for (let i = hours; i >= -interval; i -= interval) {  // Changed to go to -interval to include one future time point
      // Calculate the hour (hours-i) hours ago from the rounded current hour
      let hour = (roundedCurrentHour - i + 24) % 24; // Add 24 and mod 24 to handle negative hours

      // Convert to 12-hour format with AM/PM
      const amPm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM

      labels.push(`${hour12} ${amPm}`);
    }

    return labels;
  }

  // Create time labels for 12 hours of history with 2-hour intervals
  const FOOT_TRAFFIC_TIME_LABELS = generateDynamicTimeLabels(12, 2);

  // Create time labels for 10 hours of history with 2-hour intervals
  const DWELL_TIME_LABELS = generateDynamicTimeLabels(10, 2);
  // Create foot traffic data that includes current location's data
  const footTrafficData = {
    locations: [
      { 
        name: getCameraName(videoStats.location), 
        color: '#dc2626',
        values: [0, 0, 0, 0, 0, videoStats.people_count, 0]
      },
      ...(dashboardData?.footTraffic?.locations?.slice(1) || [])
    ],
    timeLabels: FOOT_TRAFFIC_TIME_LABELS,
  };

  // Create dwell time data that includes current dwell time
  const dwellTimeData = {
    locations: [
      { 
        name: getCameraName(videoStats.location), 
        color: '#dc2626',
        values: [0, 0, 0, 0, 0, videoStats.avg_dwell_time]
      },
      ...(dashboardData?.dwellTime?.locations?.slice(1) || [])
    ],
    timeLabels: DWELL_TIME_LABELS
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
