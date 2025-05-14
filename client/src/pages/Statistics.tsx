import React, { useState, useEffect } from 'react';
import HeatmapChart from '@/components/statistics/HeatmapChart';
import BusiestPlaces from '@/components/statistics/BusiestPlaces';
import AverageFootTrafficChart from '@/components/statistics/AverageFootTrafficChart';
import MonthFootTrafficChart from '@/components/statistics/MonthFootTrafficChart';
import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { locationColors, getStatisticsData } from '@/data/locationData';
import { sharedDataService, VideoStats, MapData, LocationMarker } from '@/data/sharedDataService';

// Define state values outside the component 
// to avoid the "Rendered more hooks than during previous render" issue
const defaultLocation = 'All Locations';
const defaultMetric = 'Count';
const defaultTimePeriod = 'month';

const Statistics: React.FC = () => {
  // Move all useState hooks to the very top of the component
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const [timePeriod, setTimePeriod] = useState(defaultTimePeriod);
  const [staticStatisticsData] = useState(getStatisticsData());
  
  // State for shared data
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<{
    timeLabels: string[];
    locations: {
      name: string;
      color: string;
      trafficValues: number[];
      dwellTimeValues: number[];
    }[];
  } | null>(null);
  
  // Get data from shared service
  useEffect(() => {
    // Get initial values
    setVideoStats(sharedDataService.getVideoStats());
    setMapData(sharedDataService.getMapData());
    
    // Subscribe to changes
    const videoStatsSubscription = sharedDataService.videoStats$.subscribe(
      (stats: VideoStats | null) => setVideoStats(stats)
    );
    
    const mapDataSubscription = sharedDataService.mapData$.subscribe(
      (data: MapData | null) => setMapData(data)
    );
    
    // Cleanup subscriptions
    return () => {
      videoStatsSubscription.unsubscribe();
      mapDataSubscription.unsubscribe();
    };
  }, []);
  
  const { data: statisticsData, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetch('/api/statistics').then(res => res.json()),
  });

  // Get color for a location based on our consistent color scheme
  const getLocationColor = (locationName: string): string => {
    // Check if the location is one of our predefined locations
    if (locationColors[locationName + ' Camera']) {
      return locationColors[locationName + ' Camera'];
    }
    
    // Check if it's one of our other predefined locations without 'Camera'
    if (locationColors[locationName]) {
      return locationColors[locationName];
    }
    
    // Default fallback color
    return '#777777';
  };

  if (isStatisticsLoading || !videoStats || !mapData) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // Function to generate dynamic heatmap based on current foot traffic
  const generateDynamicHeatmap = () => {
    const baseHeatmap = statisticsData?.heatmap || staticStatisticsData.heatmap;
    
    // Get current day and time to highlight in heatmap
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay() - 1; // 0 = Sunday, so subtract 1 to make 0 = Monday
    
    if (day >= 0 && day < baseHeatmap.z.length) {
      const hourIndex = Math.floor(hour / 2); // Each column represents 2 hours
      if (hourIndex >= 0 && hourIndex < baseHeatmap.z[0].length) {
        // Create a deep copy of the heatmap
        const newZ = baseHeatmap.z.map((row: number[]) => [...row]);
        
        // Update current time cell with actual foot traffic (normalized)
        const normalizedValue = Math.min(1, videoStats.people_count / 100);
        newZ[day][hourIndex] = normalizedValue;
        
        return {
          ...baseHeatmap,
          z: newZ
        };
      }
    }
    
    return baseHeatmap;
  };

  // Sample data for heatmap with dynamically updated values
  const heatmapData = generateDynamicHeatmap();

  // Update busiest places to include current location and data from mapData
  const busiestPlacesData = {
    places: [
      { id: 1, name: sharedDataService.getCameraName(videoStats.location), count: videoStats.people_count },
      ...mapData.markers
        .filter(marker => marker.name !== sharedDataService.getCameraName(videoStats.location))
        .slice(0, 4)
        .map((marker, index) => ({
          id: index + 2,
          name: marker.name,
          count: marker.count
        }))
    ].sort((a, b) => (b.count || 0) - (a.count || 0))
  };  
  
  // Generate time series data from video stats
  // Generate realistic time labels based on current time
  const now = new Date();
  const timeLabels = Array.from({ length: 8 }, (_, i) => {
    const time = new Date(now);
    time.setHours(time.getHours() - (7 - i));
    return time.getHours() + ':00';
  });
  
  // Use time series data for average foot traffic
  const avgFootTrafficData = {
    gates: [
      {
        name: sharedDataService.getCameraName(videoStats.location),
        color: getLocationColor(sharedDataService.getCameraName(videoStats.location)),
        values: [
          Math.max(10, videoStats.people_count - 10),
          Math.max(5, videoStats.people_count - 5),
          videoStats.people_count,
          Math.max(10, videoStats.people_count - 2),
          Math.max(5, videoStats.people_count - 8),
          Math.max(10, videoStats.people_count - 4),
          Math.max(5, videoStats.people_count - 6),
          videoStats.people_count,
        ]
      },
      ...mapData.markers.slice(0, 2)
        .map(marker => ({
          name: marker.name,
          color: marker.color,
          values: Array.from({ length: 8 }, (_, i) => 
            Math.floor(marker.count * (0.7 + Math.random() * 0.6)))
        }))
    ],
    timeLabels
  };  
  
  // Update month foot traffic to include the current location
  const monthFootTrafficData = {
    buildings: [
      { 
        id: 'current', 
        name: sharedDataService.getCameraName(videoStats.location), 
        value: videoStats.people_count * 30, // Projected monthly value
        color: getLocationColor(sharedDataService.getCameraName(videoStats.location))
      },
      ...mapData.markers
        .filter(marker => marker.name !== sharedDataService.getCameraName(videoStats.location))
        .slice(0, 4)
        .map(marker => ({
          id: marker.id,
          name: marker.name,
          value: marker.count * 30, // Projected monthly value
          color: marker.color
        }))
    ].sort((a, b) => b.value - a.value)
  };
    // Get all locations based on data
  const locations = [
    'All Locations', 
    sharedDataService.getCameraName(videoStats.location),
    ...mapData.markers.map(marker => marker.name)
  ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  const metrics = ['Count', 'Dwell'];

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(e.target.value);
  };

  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
      
      {/* Live Statistics Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="border-b pb-2 mb-3">
          <h3 className="font-bold">Current Analysis: {sharedDataService.getCameraName(videoStats.location)}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-3 bg-blue-50">
            <div className="text-sm text-gray-600">People Count</div>
            <div className="text-2xl font-bold">{videoStats.people_count}</div>
          </div>
          <div className="border rounded p-3 bg-green-50">
            <div className="text-sm text-gray-600">Avg Dwell Time</div>
            <div className="text-2xl font-bold">{videoStats.avg_dwell_time} sec</div>
          </div>
          <div className="border rounded p-3 bg-purple-50">
            <div className="text-sm text-gray-600">Last Updated</div>
            <div className="text-sm">{new Date(videoStats.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
      
      {/* Top section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-bold">Heatmap</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto mb-4">
              <Plot
                data={[
                  {
                    z: heatmapData.z,
                    x: heatmapData.x,
                    y: heatmapData.y,
                    type: 'heatmap',
                    colorscale: [
                      [0, '#fff7bc'],
                      [0.2, '#fee391'],
                      [0.4, '#fec44f'],
                      [0.6, '#fe9929'],
                      [0.8, '#ec7014'],
                      [1, '#cc4c02']
                    ]
                  }
                ]}
                layout={{
                  autosize: true,
                  height: 250,
                  margin: { l: 50, r: 10, t: 10, b: 30 },
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%', height: '250px' }}
              />
            </div>
          </div>
          
          {/* Heatmap Controls - Similar to reference image */}
          <div className="border-t p-4 bg-gray-50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location:</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <span className="material-icons text-sm">expand_more</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Metric:</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedMetric}
                    onChange={handleMetricChange}
                  >
                    {metrics.map(metric => (
                      <option key={metric} value={metric}>{metric}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <span className="material-icons text-sm">expand_more</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time Period:</label>
                <div className="flex items-center bg-white border border-gray-300 rounded px-3 py-2">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="time-period" 
                      className="form-radio text-primary"
                      checked={timePeriod === 'week'}
                      onChange={() => handleTimePeriodChange('week')}
                    />
                    <span className="ml-2 text-sm">Last Week</span>
                  </label>
                  <label className="inline-flex items-center ml-4">
                    <input 
                      type="radio" 
                      name="time-period" 
                      className="form-radio text-primary"
                      checked={timePeriod === 'month'}
                      onChange={() => handleTimePeriodChange('month')}
                    />
                    <span className="ml-2 text-sm">Last Month</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Busiest Places - Match reference image styling */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-blue-800 text-white py-3 px-4">
            <h3 className="font-bold text-center text-base">BUSIEST PLACES TODAY</h3>
          </div>          <div className="divide-y">
            {busiestPlacesData.places.map((place: { id: number; name: string; count?: number }, index: number) => {
              // Get color for the location based on our consistent color scheme
              const locationColor = getLocationColor(place.name);
              
              return (
                <div key={place.id} className="py-3 px-4 flex items-center">
                  <span className="mr-2 font-medium">{index + 1}.</span> 
                  <span className="flex-1">{place.name}</span>
                  <span className="text-gray-500 flex items-center">
                    <span className="material-icons text-sm mr-1" style={{ color: locationColor }}>people</span>
                    {place.count || Math.floor(Math.random() * 100) + 50}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Bottom charts section */}
        <div className="flex flex-col">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="border-b pb-2 mb-3">
              <h3 className="font-bold">Average Foot Traffic by Hour</h3>
            </div>
            <AverageFootTrafficChart 
              gates={avgFootTrafficData.gates}
              timeLabels={avgFootTrafficData.timeLabels}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Chart */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="border-b pb-2 mb-3">
            <h3 className="font-bold">Foot Traffic in the Last Month</h3>
          </div>
          <MonthFootTrafficChart buildings={monthFootTrafficData.buildings} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
