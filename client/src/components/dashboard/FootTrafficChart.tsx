import React from 'react';
import Plot from 'react-plotly.js';

interface LocationData {
  name: string;
  color: string;
  values: number[];
}

interface FootTrafficChartProps {
  locations: LocationData[];
  timeLabels: string[];
}

const FootTrafficChart: React.FC<FootTrafficChartProps> = ({ locations, timeLabels }) => {
  // Calculate total foot traffic per location
  const totalValues = locations.map(loc => ({
    name: loc.name,
    total: loc.values.reduce((sum, val) => sum + val, 0).toFixed(1),
    color: loc.color
  }));

  // Create the data array for Plotly
  const plotlyData = locations.map(location => ({
    x: timeLabels,
    y: location.values,
    type: 'scatter',
    mode: 'lines+markers',
    name: location.name,
    marker: { color: location.color, size: 6 },
    line: { color: location.color, width: 3, shape: 'spline' },
    hovertemplate: `<b>${location.name}</b><br>Time: %{x}<br>Foot Traffic: %{y}<extra></extra>`
  }));

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: '',
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    yaxis: {
      title: '',
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    showlegend: false, // Remove the plotly legend since we have our own custom legend
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
          <span className="material-icons mr-2 text-primary">timeline</span>
          Foot Traffic Trends
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {totalValues.map((loc) => (
            <div key={loc.name} className="inline-flex items-center bg-gray-50 rounded-full px-3 py-1 text-sm">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: loc.color }}></div>
              <span className="font-medium">{loc.name}</span>
              <span className="ml-1 text-gray-500">({loc.total})</span>
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
      </div>
    </div>
  );
};

export default FootTrafficChart;
