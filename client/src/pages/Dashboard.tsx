import React from 'react';
import KpiCard from '@/components/dashboard/KpiCard';
import PeakHoursCard from '@/components/dashboard/PeakHoursCard';
import WeeklySummaryChart from '@/components/dashboard/WeeklySummaryChart';
import MapView from '@/components/dashboard/MapView';
import FootTrafficChart from '@/components/dashboard/FootTrafficChart';
import DwellTimeChart from '@/components/dashboard/DwellTimeChart';
import { useQuery } from '@tanstack/react-query';
import { useFootTraffic } from '@/context/FootTrafficContext';

const Dashboard: React.FC = () => {
  const { 
    videoStats, 
    mapData, 
    timeSeriesData, 
    peakHoursData, 
    weeklySummaryData, 
    totalPeopleCount
  } = useFootTraffic();
  
  // Use React Query to fetch dashboard data (keep this for any additional dashboard-specific data)
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json()),
  });

  if (isDashboardLoading || !videoStats || !mapData || !timeSeriesData) {
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

  // Map traffic and dwell time data to the chart structure, including forecast data
  const footTrafficData = {
    locations: timeSeriesData.locations.map(loc => ({
      name: loc.name,
      color: loc.color,
      values: loc.trafficValues,
      // Add the forecast data to pass through
      ...(loc.trafficForecast && { trafficForecast: loc.trafficForecast })
    })),
    timeLabels: timeSeriesData.timeLabels,
    forecastLabels: timeSeriesData.forecastLabels || []
  };
  
  const dwellTimeData = {
    locations: timeSeriesData.locations.map(loc => ({
      name: loc.name,
      color: loc.color,
      values: loc.dwellTimeValues,
      // Add the forecast data to pass through
      ...(loc.dwellTimeForecast && { dwellTimeForecast: loc.dwellTimeForecast })
    })),
    timeLabels: timeSeriesData.timeLabels,
    forecastLabels: timeSeriesData.forecastLabels || []
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
              forecastLabels={footTrafficData.forecastLabels}
            />
            
            <DwellTimeChart 
              locations={dwellTimeData.locations}
              timeLabels={dwellTimeData.timeLabels}
              forecastLabels={dwellTimeData.forecastLabels}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
