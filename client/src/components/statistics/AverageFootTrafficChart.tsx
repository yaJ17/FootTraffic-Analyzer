import React from 'react';
import Plot from 'react-plotly.js';

interface GateData {
  name: string;
  color: string;
  values: number[];
}

interface AverageFootTrafficChartProps {
  gates: GateData[];
  timeLabels: string[];
}

const AverageFootTrafficChart: React.FC<AverageFootTrafficChartProps> = ({ gates, timeLabels }) => {
  // Create the data array for Plotly
  const plotlyData = gates.map(gate => ({
    x: timeLabels,
    y: gate.values,
    type: 'scatter',
    mode: 'lines',
    name: gate.name,
    line: { color: gate.color, width: 2 }
  }));

  const layout = {
    autosize: true,
    title: {
      // Remove title as it's already in the parent component
      text: '',
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
      // Position legend at the top to save space
      orientation: 'h',
      y: 1.1
    },
    height: 300,
    margin: { l: 40, r: 20, t: 10, b: 40 }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <Plot
        data={plotlyData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
};

export default AverageFootTrafficChart;
