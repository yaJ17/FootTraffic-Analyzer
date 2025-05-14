import React, { useState } from 'react';
import Plot from 'react-plotly.js';

interface LocationData {
  name: string;
  color: string;
  values: number[];
}

interface DwellTimeChartProps {
  locations: LocationData[];
  timeLabels: string[];
}

const DwellTimeChart: React.FC<DwellTimeChartProps> = ({ locations, timeLabels }) => {
  // Add state to track selected locations
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set(locations.map(loc => loc.name)));

  // Calculate average dwell time and get current value
  const locationStats = locations.map(loc => ({
    name: loc.name,
    avg: (loc.values.reduce((sum, val) => sum + val, 0) / loc.values.filter(v => v > 0).length || 1).toFixed(1),
    color: loc.color,
    // Get current value (second-to-last position)
    current: loc.values.length >= 3 ? loc.values[loc.values.length - 2] : 0
  }));

  // Filter locations based on selection
  const filteredLocations = locations.filter(loc => selectedLocations.has(loc.name));

  // Create the data array for Plotly
  const plotlyData = filteredLocations.map(location => ({
    x: timeLabels,
    y: location.values,
    type: 'bar',
    name: location.name,
    marker: { 
      color: location.color,
      opacity: 0.8,
      line: {
        width: 1,
        color: 'white'
      }
    },
    hovertemplate: `<b>${location.name}</b><br>Time: %{x}<br>Dwell Time: %{y} sec<extra></extra>`
  }));

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: '',
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: 'Seconds',
      titlefont: { size: 12, color: '#777' },
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    showlegend: false, // Keep custom legend
    barmode: 'group',
    height: 300,
    margin: { l: 40, r: 20, t: 60, b: 40 }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  // Handle legend click
  const handleLegendClick = (locationName: string) => {
    setSelectedLocations(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(locationName)) {
        // If it's the only selected item, don't remove it
        if (newSelection.size > 1) {
          newSelection.delete(locationName);
        }
      } else {
        newSelection.add(locationName);
      }
      return newSelection;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">timer</span>
          Dwell Time Analysis
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {locationStats.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleLegendClick(loc.name)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm transition-all duration-200 ${
                selectedLocations.has(loc.name)
                  ? 'bg-gray-50 opacity-100'
                  : 'bg-gray-100 opacity-50'
              }`}
            >
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: loc.color }}></div>
              <span className="font-medium">{loc.name}</span>
              <span className="ml-1 text-gray-500">Current: {loc.current} sec</span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <Plot
            data={plotlyData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '300px' }}
          />
        </div>

        <div className="flex items-center text-xs text-gray-500 mt-2">
          <span className="material-icons text-xs mr-1">info</span>
          Average time visitors spend at each location
        </div>
      </div>
    </div>
  );
};

export default DwellTimeChart;
