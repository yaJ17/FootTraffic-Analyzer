import React, { useState } from 'react';
import Plot from 'react-plotly.js';

interface HeatmapData {
  z: number[][];
  x: string[];
  y: string[];
}

interface HeatmapChartProps {
  data: HeatmapData;
  locations: string[];
  metrics: string[];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, locations, metrics }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]);
  const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0]);
  const [timePeriod, setTimePeriod] = useState<string>("month");

  // Create the Plotly heatmap data
  const plotlyData = [
    {
      z: data.z,
      x: data.x,
      y: data.y,
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
  ];

  const layout = {
    title: '',
    autosize: true,
    height: 250,
    margin: { l: 50, r: 10, t: 10, b: 30 },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h3 className="font-bold">Heatmap Visualization</h3>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto mb-4">
          <Plot
            data={plotlyData}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '250px' }}
          />
        </div>
      </div>
      
      {/* Separated Controls */}
      <div className="border-t p-4 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <div className="relative">
              <select 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="all">All Locations</option>
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
            <label className="block text-sm font-medium mb-1">Metric</label>
            <div className="relative">
              <select 
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
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
            <label className="block text-sm font-medium mb-1">Time Period</label>
            <div className="flex items-center bg-white border border-gray-300 rounded px-3 py-2">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="time-period" 
                  className="form-radio text-primary"
                  checked={timePeriod === "week"}
                  onChange={() => setTimePeriod("week")}
                />
                <span className="ml-2 text-sm">Last Week</span>
              </label>
              <label className="inline-flex items-center ml-4">
                <input 
                  type="radio" 
                  name="time-period" 
                  className="form-radio text-primary"
                  checked={timePeriod === "month"}
                  onChange={() => setTimePeriod("month")}
                />
                <span className="ml-2 text-sm">Last Month</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
