import React from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import PeakHoursCard from '@/components/dashboard/PeakHoursCard';
import WeeklySummaryChart from '@/components/dashboard/WeeklySummaryChart';
import MapView from '@/components/dashboard/MapView';
import FootTrafficChart from '@/components/dashboard/FootTrafficChart';
import DwellTimeChart from '@/components/dashboard/DwellTimeChart';
import YouTubeStreamPanel from '@/components/dashboard/YouTubeStreamPanel';
import { useQuery } from '@tanstack/react-query';

const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json()),
  });

  if (isLoading) {
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

  // Sample data for KPI card
  const kpiData = dashboardData?.kpi || {
    title: 'Total Foot Traffic',
    value: '1,064',
    icon: 'groups'
  };

  // Sample data for peak hours
  const peakHoursData = dashboardData?.peakHours || {
    peakStart: { time: '9 AM', status: 'Peak already started' },
    peakMax: { time: '12 PM', status: 'Peak in 3 hours already started' },
    peakEnd: { time: '8 PM', status: '9 hours and 5 minutes' }
  };

  // Sample data for weekly summary
  const weeklySummaryData = dashboardData?.weeklySummary || {
    monday: 300,
    weekend: 229,
    weekday: 400,
    total: 929
  };

  // Sample data for map
  const mapData = dashboardData?.map || {
    center: { lat: 14.5995, lon: 120.9842 },
    zoom: 13,
    zoneInfo: '649 ZONE 68',
    markers: [
      { id: '1', name: 'Manila Cathedral', lat: 14.5915, lon: 120.9722, color: '#dc2626', count: 342 },
      { id: '2', name: 'Divisoria', lat: 14.6019, lon: 120.9719, color: '#0039a6', count: 578 },
      { id: '3', name: 'Fort Santiago', lat: 14.5958, lon: 120.9669, color: '#eab308', count: 219 }
    ]
  };

  // Sample data for foot traffic chart
  const footTrafficData = dashboardData?.footTraffic || {
    locations: [
      { 
        name: 'Divisoria', 
        color: '#0039a6',
        values: [2, 1, 2.5, 2, 3, 3.5, 3]
      },
      { 
        name: 'Manila Cathedral', 
        color: '#dc2626',
        values: [1, 3, 1.5, 2.5, 2, 2.5, 2]
      },
      { 
        name: 'Fort Santiago', 
        color: '#eab308',
        values: [0.5, 1, 0.7, 0.6, 0.8, 0.7, 0.6]
      }
    ],
    timeLabels: ['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM']
  };

  // Sample data for dwell time chart
  const dwellTimeData = dashboardData?.dwellTime || {
    locations: [
      { 
        name: 'Divisoria', 
        color: '#0039a6',
        values: [5, 3, 4, 2, 3, 5]
      },
      { 
        name: 'Manila Cathedral', 
        color: '#60a5fa',
        values: [3, 4, 3, 2, 3, 3]
      }
    ],
    timeLabels: ['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM']
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - KPI Card, Peak Hours, Weekly Summary */}
        <div className="col-span-1 flex flex-col gap-6">
          <KpiCard 
            title={kpiData.title} 
            value={kpiData.value} 
            icon={kpiData.icon} 
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
          
          {/* YouTube Streaming Analysis Section */}
          <YouTubeStreamPanel />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
