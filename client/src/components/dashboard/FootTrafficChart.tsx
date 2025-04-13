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
  // Create the data array for Plotly
  const plotlyData = locations.map(location => ({
    x: timeLabels,
    y: location.values,
    type: 'scatter',
    mode: 'lines',
    name: location.name,
    line: { color: location.color, width: 2 }
  }));

  const layout = {
    autosize: true,
    title: {
      text: 'Average Foot Traffic per Hour',
      font: { size: 16, family: 'Inter, sans-serif', weight: 'bold' }
    },
    xaxis: {
      title: '',
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: '',
      showgrid: true,
      zeroline: false
    },
    legend: {
      orientation: 'h',
      y: -0.2
    },
    height: 220,
    margin: { l: 40, r: 20, t: 40, b: 40 }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4">
        <Plot
          data={plotlyData}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '220px' }}
        />
      </div>
    </div>
  );
};

export default FootTrafficChart;
