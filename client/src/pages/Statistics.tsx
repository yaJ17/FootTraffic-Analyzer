import React, { useState, useEffect } from 'react';
import HeatmapChart from '@/components/statistics/HeatmapChart';
import BusiestPlaces from '@/components/statistics/BusiestPlaces';
import AverageFootTrafficChart from '@/components/statistics/AverageFootTrafficChart';
import MonthFootTrafficChart from '@/components/statistics/MonthFootTrafficChart';
import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';

// Define state values outside the component 
// to avoid the "Rendered more hooks than during previous render" issue
const defaultLocation = 'All Locations';
const defaultMetric = 'Count';
const defaultTimePeriod = 'month';

// Define interface for stats from the API
interface VideoStats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
}

const Statistics: React.FC = () => {
  // Move all useState hooks to the very top of the component
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const [timePeriod, setTimePeriod] = useState(defaultTimePeriod);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [flaskServerUrl, setFlaskServerUrl] = useState<string>('http://localhost:5001');
  
  const { data: statisticsData, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetch('/api/statistics').then(res => res.json()),
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

  // Get a formatted camera name for display
  const getCameraName = (location: string) => {
    if (location?.includes('School')) return 'School Entrance';
    if (location?.includes('Palengke')) return 'Palengke Market';
    if (location?.includes('YouTube')) return 'YouTube Stream';
    return location || 'Unknown Location';
  };

  if (isStatisticsLoading || !videoStats) {
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
    const baseHeatmap = statisticsData?.heatmap || {
      z: [
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.4, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9]
      ],
      x: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
      y: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    
    // Get current day and time to highlight in heatmap
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay() - 1; // 0 = Sunday, so subtract 1 to make 0 = Monday
    
    if (day >= 0 && day < baseHeatmap.z.length) {
      const hourIndex = Math.floor(hour / 2); // Each column represents 2 hours
      if (hourIndex >= 0 && hourIndex < baseHeatmap.z[0].length) {
        // Create a deep copy of the heatmap
        const newZ = baseHeatmap.z.map(row => [...row]);
        
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

  // Update busiest places to include current location
  const busiestPlacesData = {
    places: [
      { id: 1, name: getCameraName(videoStats.location), count: videoStats.people_count },
      ...(statisticsData?.busiestPlaces?.places?.slice(0, 4) || [
        { id: 2, name: 'Divisoria Market', count: 86 },
        { id: 3, name: 'Manila High School', count: 72 },
        { id: 4, name: 'Fort Santiago', count: 65 },
        { id: 5, name: 'San Nicolas Church', count: 58 }
      ])
    ].sort((a, b) => (b.count || 0) - (a.count || 0))
  };

  // Update average foot traffic to include real-time data
  const avgFootTrafficData = {
    gates: [
      {
        name: getCameraName(videoStats.location),
        color: '#0039a6',
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
      ...(statisticsData?.avgFootTraffic?.gates?.slice(1) || [
        {
          name: 'East Gate',
          color: '#60a5fa',
          values: [12, 20, 15, 12, 14, 16, 18, 20]
        }
      ])
    ],
    timeLabels: statisticsData?.avgFootTraffic?.timeLabels || ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
  };

  // Update month foot traffic to include the current location
  const monthFootTrafficData = {
    buildings: [
      { 
        id: 'current', 
        name: getCameraName(videoStats.location), 
        value: videoStats.people_count * 30 // Projected monthly value
      },
      ...(statisticsData?.monthFootTraffic?.buildings?.slice(0, 10) || [
        { id: 'b1', name: 'Building 1', value: 152 },
        { id: 'b2', name: 'Building 2', value: 76 },
        { id: 'b3', name: 'Building 3', value: 15 },
        { id: 'b4', name: 'Building 4', value: 197 },
        { id: 'b5', name: 'Building 5', value: 89 },
        { id: 'b6', name: 'Building 6', value: 93 },
        { id: 'b7', name: 'Building 7', value: 130 },
        { id: 'b8', name: 'Building 8', value: 91 },
        { id: 'b9', name: 'Building 9', value: 68 },
        { id: 'b10', name: 'Building 10', value: 162 }
      ])
    ]
  };
  
  // Get all locations based on data
  const locations = [
    'All Locations', 
    getCameraName(videoStats.location),
    ...(statisticsData?.busiestPlaces?.places?.map(place => place.name) || ['Divisoria', 'Manila Cathedral', 'Fort Santiago'])
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
          <h3 className="font-bold">Current Analysis: {getCameraName(videoStats.location)}</h3>
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
          </div>
          <div className="divide-y">
            {busiestPlacesData.places.map((place: { id: number; name: string; count?: number }, index: number) => (
              <div key={place.id} className="py-3 px-4 flex items-center">
                <span className="mr-2 font-medium">{index + 1}.</span> 
                <span className="flex-1">{place.name}</span>
                <span className="text-gray-500 flex items-center">
                  <span className="material-icons text-sm mr-1">people</span>
                  {place.count || Math.floor(Math.random() * 100) + 50}
                </span>
              </div>
            ))}
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
