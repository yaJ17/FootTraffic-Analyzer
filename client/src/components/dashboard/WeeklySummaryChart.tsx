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
        colors: ['#ef4444', '#f59e0b', '#3b82f6']
      },
      type: 'pie',
      hole: 0.7,
      textinfo: 'none',
      hoverinfo: 'label+percent+value',
      hovertemplate: '<b>%{label}</b><br>Traffic: %{value}<br>Percentage: %{percent}<extra></extra>'
    }
  ];

  const layout = {
    autosize: true,
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, b: 10, l: 10, r: 10 },
    height: 240,
    annotations: [
      {
        font: { 
          size: 24,
          family: 'Inter, sans-serif',
          color: '#1e293b',
          weight: 'bold'
        },
        showarrow: false,
        text: total.toString(),
        x: 0.5,
        y: 0.5
      },
      {
        font: { 
          size: 11,
          family: 'Inter, sans-serif',
          color: '#64748b'
        },
        showarrow: false,
        text: 'TOTAL',
        x: 0.5,
        y: 0.4
      }
    ]
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  // Calculate percentages
  const total100 = monday + weekend + weekday;
  const mondayPercent = Math.round((monday / total100) * 100);
  const weekendPercent = Math.round((weekend / total100) * 100);
  const weekdayPercent = Math.round((weekday / total100) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <h3 className="font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">pie_chart</span>
          Weekly Traffic Summary
        </h3>
        
        <div className="flex justify-center">
          <Plot
            data={data}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '240px' }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="font-medium">Monday</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{monday}</span>
              <span className="font-bold text-red-500">{mondayPercent}%</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              <span className="font-medium">Weekend</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{weekend}</span>
              <span className="font-bold text-amber-500">{weekendPercent}%</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="font-medium">Weekday</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{weekday}</span>
              <span className="font-bold text-blue-500">{weekdayPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryChart;
