import React from 'react';
import HeatmapChart from '@/components/statistics/HeatmapChart';
import BusiestPlaces from '@/components/statistics/BusiestPlaces';
import AverageFootTrafficChart from '@/components/statistics/AverageFootTrafficChart';
import MonthFootTrafficChart from '@/components/statistics/MonthFootTrafficChart';
import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';

const Statistics: React.FC = () => {
  const { data: statisticsData, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetch('/api/statistics').then(res => res.json()),
  });

  if (isLoading) {
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

  // Sample data for heatmap
  const heatmapData = statisticsData?.heatmap || {
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

  // Sample data for busiest places
  const busiestPlacesData = statisticsData?.busiestPlaces || {
    places: [
      { id: 1, name: 'The Manila Cathedral' },
      { id: 2, name: 'Divisoria Market' },
      { id: 3, name: 'Manila High School' },
      { id: 4, name: 'Fort Santiago' },
      { id: 5, name: 'San Nicolas Church' }
    ]
  };

  // Sample data for average foot traffic chart
  const avgFootTrafficData = statisticsData?.avgFootTraffic || {
    gates: [
      {
        name: 'Main Gate',
        color: '#0039a6',
        values: [40, 30, 35, 40, 35, 40, 35, 30]
      },
      {
        name: 'East Gate',
        color: '#60a5fa',
        values: [12, 20, 15, 12, 14, 16, 18, 20]
      }
    ],
    timeLabels: ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
  };

  // Sample data for month foot traffic chart
  const monthFootTrafficData = statisticsData?.monthFootTraffic || {
    buildings: [
      { id: 'b1', name: 'Building 1', value: 152 },
      { id: 'b2', name: 'Building 2', value: 76 },
      { id: 'b3', name: 'Building 3', value: 15 },
      { id: 'b4', name: 'Building 4', value: 197 },
      { id: 'b5', name: 'Building 5', value: 89 },
      { id: 'b6', name: 'Building 6', value: 93 },
      { id: 'b7', name: 'Building 7', value: 130 },
      { id: 'b8', name: 'Building 8', value: 91 },
      { id: 'b9', name: 'Building 9', value: 68 },
      { id: 'b10', name: 'Building 10', value: 162 },
      { id: 'shop', name: 'Shopping', value: 176 }
    ]
  };

  const locations = ['All Locations', 'Divisoria', 'Manila Cathedral', 'Fort Santiago'];
  const metrics = ['Count', 'Dwell'];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
      
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
                    />
                    <span className="ml-2 text-sm">Last Week</span>
                  </label>
                  <label className="inline-flex items-center ml-4">
                    <input 
                      type="radio" 
                      name="time-period" 
                      className="form-radio text-primary"
                      defaultChecked
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
            {busiestPlacesData.places.map((place: { id: number; name: string }, index: number) => (
              <div key={place.id} className="py-3 px-4">
                {index + 1}. {place.name}
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
