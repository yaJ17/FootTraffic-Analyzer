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
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-bold mb-4">Heatmap</h3>
      <div className="overflow-x-auto mb-4">
        <Plot
          data={plotlyData}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '250px' }}
        />
      </div>
      
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center w-full md:w-auto">
          <label className="mr-2 text-sm font-medium">Location:</label>
          <div className="relative w-full md:w-48">
            <select 
              className="appearance-none bg-primary text-white w-full p-2 rounded"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <span className="material-icons text-sm">expand_more</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center w-full md:w-auto">
          <label className="mr-2 text-sm font-medium">Metric:</label>
          <div className="relative w-full md:w-48">
            <div 
              className="bg-primary text-white p-2 rounded flex justify-between items-center cursor-pointer"
              onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
            >
              <span>{selectedMetric}</span>
              <span className="material-icons text-sm">expand_more</span>
            </div>
            {isMetricDropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded mt-1 border border-gray-200 z-20">
                {metrics.map(metric => (
                  <div 
                    key={metric}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedMetric(metric);
                      setIsMetricDropdownOpen(false);
                    }}
                  >
                    {metric}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
          <label className="text-sm font-medium">Time Period:</label>
          <div className="flex items-center">
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
  );
};

export default HeatmapChart;
