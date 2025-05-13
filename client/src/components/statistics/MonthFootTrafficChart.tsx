import React from 'react';
import Plot from 'react-plotly.js';

interface BuildingData {
  id: string;
  name: string;
  value: number;
  color?: string;
}

interface MonthFootTrafficChartProps {
  buildings: BuildingData[];
}

const MonthFootTrafficChart: React.FC<MonthFootTrafficChartProps> = ({ buildings }) => {
  // Create the data array for Plotly
  const plotlyData = [
    {
      x: buildings.map(b => b.name),
      y: buildings.map(b => b.value),
      type: 'bar',
      marker: {
        color: buildings.map(b => b.color || '#0039a6') // Use specified color or default blue
      }
    }
  ];

  const layout = {
    autosize: true,
    title: {
      text: '',  // Remove title as it's already in the parent component
      font: { size: 16, family: 'Inter, sans-serif', weight: 'bold' }
    },
    xaxis: {
      title: '',
      showgrid: false,
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: '',
      showgrid: true,
      zeroline: false
    },
    height: 300,
    margin: { l: 40, r: 20, t: 40, b: 70 }
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

export default MonthFootTrafficChart;
