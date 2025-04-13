import React from 'react';
import Plot from 'react-plotly.js';

interface WeeklySummaryProps {
  monday: number;
  weekend: number;
  weekday: number;
  total: number;
}

const WeeklySummaryChart: React.FC<WeeklySummaryProps> = ({ 
  monday, 
  weekend, 
  weekday, 
  total 
}) => {
  const data = [
    {
      values: [monday, weekend, weekday],
      labels: ['Monday', 'Weekend', 'Weekday'],
      marker: {
        colors: ['#f87171', '#fbbf24', '#60a5fa']
      },
      type: 'pie',
      hole: 0.6,
      textinfo: 'none',
      hoverinfo: 'label+percent'
    }
  ];

  const layout = {
    autosize: true,
    showlegend: false,
    margin: { t: 0, b: 0, l: 0, r: 0 },
    height: 200,
    annotations: [
      {
        font: { size: 20 },
        showarrow: false,
        text: total.toString(),
        x: 0.5,
        y: 0.5
      }
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4">
        <h3 className="font-bold mb-3">Weekly Summary</h3>
        
        <div className="flex justify-center">
          <Plot
            data={data}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '200px' }}
          />
        </div>
        
        <div className="flex flex-wrap mt-2 text-sm">
          <div className="flex items-center mr-4 mb-2">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-1"></span>
            <span>Monday</span>
          </div>
          <div className="flex items-center mr-4 mb-2">
            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>
            <span>Weekend</span>
          </div>
          <div className="flex items-center mr-4 mb-2">
            <span className="w-3 h-3 bg-blue-400 rounded-full mr-1"></span>
            <span>Weekday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryChart;
