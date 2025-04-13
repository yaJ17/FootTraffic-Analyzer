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
  // Create the data array for Plotly
  const plotlyData = locations.map(location => ({
    x: timeLabels,
    y: location.values,
    type: 'bar',
    name: location.name,
    marker: { color: location.color }
  }));

  const layout = {
    autosize: true,
    title: {
      text: 'Average Dwell Time per Minute',
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
    barmode: 'group',
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

export default DwellTimeChart;
