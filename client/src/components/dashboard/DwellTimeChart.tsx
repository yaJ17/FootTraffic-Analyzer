import React from 'react';
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
  // Calculate average dwell time
  const averages = locations.map(loc => ({
    name: loc.name,
    avg: (loc.values.reduce((sum, val) => sum + val, 0) / loc.values.length).toFixed(1),
    color: loc.color
  }));

  // Create the data array for Plotly
  const plotlyData = locations.map(location => ({
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
    hovertemplate: `<b>${location.name}</b><br>Time: %{x}<br>Dwell Time: %{y} min<extra></extra>`
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
      title: 'Minutes',
      titlefont: { size: 12, color: '#777' },
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    legend: {
      orientation: 'h',
      y: -0.2
    },
    barmode: 'group',
    height: 300,
    margin: { l: 40, r: 20, t: 60, b: 40 }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">timer</span>
          Dwell Time Analysis
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {averages.map((loc) => (
            <div key={loc.name} className="inline-flex items-center bg-gray-50 rounded-full px-3 py-1 text-sm">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: loc.color }}></div>
              <span className="font-medium">{loc.name}</span>
              <span className="ml-1 text-gray-500">Avg: {loc.avg} min</span>
            </div>
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
