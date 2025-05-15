import React, { useState, useEffect } from 'react';
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
  const [chartData, setChartData] = useState<LocationData[]>(locations);
  const [currentLabels, setCurrentLabels] = useState<string[]>(timeLabels);

  // Update only the latest data point when props change to simulate real-time updates
  useEffect(() => {
    if (locations.length > 0 && timeLabels.length > 0) {
      // Check if we need to add a new time label
      if (timeLabels[timeLabels.length - 1] !== currentLabels[currentLabels.length - 1]) {
        // Add the new time label
        setCurrentLabels(prev => [...prev.slice(1), timeLabels[timeLabels.length - 1]]);
        
        // Shift all data points and add the new one
        setChartData(prev => 
          prev.map((loc, idx) => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            return {
              ...loc,
              values: [...loc.values.slice(1), matchingLocation.values[matchingLocation.values.length - 1]]
            };
          })
        );
      } else {
        // Just update the last value of each location
        setChartData(prev => 
          prev.map((loc, idx) => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            return {
              ...loc,
              values: [
                ...loc.values.slice(0, -1), 
                matchingLocation.values[matchingLocation.values.length - 1]
              ]
            };
          })
        );
      }
    } else {
      // Initial load
      setChartData(locations);
      setCurrentLabels(timeLabels);
    }
  }, [locations, timeLabels]);

  // Calculate average dwell time and get current value
  const locationStats = chartData.map(loc => ({
    name: loc.name,
    avg: (loc.values.reduce((sum, val) => sum + val, 0) / loc.values.filter(v => v > 0).length || 1).toFixed(1),
    color: loc.color,
    // Get current value (last position)
    current: loc.values.length > 0 ? loc.values[loc.values.length - 1] : 0
  }));

  // Filter locations based on selection
  const filteredLocations = chartData.filter(loc => selectedLocations.has(loc.name));

  // Create the data array for Plotly
  const plotlyData = filteredLocations.map(location => ({
    x: currentLabels,
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
                  ? 'bg-gray-50 border border-gray-200 shadow-sm'
                  : 'bg-gray-100 opacity-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ 
                  backgroundColor: loc.color,
                  boxShadow: selectedLocations.has(loc.name) ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                }}
              ></div>
              <span className="font-medium">{loc.name}</span>
              <span className="ml-1 text-gray-500">{loc.current} sec</span>
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
