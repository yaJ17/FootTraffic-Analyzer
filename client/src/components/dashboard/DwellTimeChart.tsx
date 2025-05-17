import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface LocationData {
  name: string;
  color: string;
  values: number[];
}

interface LocationWithForecast extends LocationData {
  dwellTimeForecast: number[];
}

interface DwellTimeChartProps {
  locations: LocationData[];
  timeLabels: string[];
  forecastLabels?: string[]; // Add optional forecast labels
}

const DwellTimeChart: React.FC<DwellTimeChartProps> = ({ 
  locations, 
  timeLabels,
  forecastLabels = [] 
}) => {
  // Add state to track selected locations
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set(locations.map(loc => loc.name)));
  const [chartData, setChartData] = useState<LocationData[]>(locations);
  const [currentLabels, setCurrentLabels] = useState<string[]>(timeLabels);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: 23 });
  const [isSorting, setIsSorting] = useState<boolean>(false);
  // Generate time range options based on available data
  const timeRangeOptions = React.useMemo(() => {
    const availableHours = new Set(
      timeLabels.map(label => {
        const [timeStr, period] = label.split(' ');
        let hour = parseInt(timeStr);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour;
      })
    );
    return Array.from({ length: 24 }, (_, i) => {
      const hour12 = i % 12 || 12;
      const ampm = i >= 12 ? 'PM' : 'AM';
      return {
        value: i,
        label: `${hour12} ${ampm}`,
        available: availableHours.has(i)
      };
    }).filter(option => option.available);
  }, [timeLabels]);

  // Reset time range to show all available data
  const resetTimeRange = () => {
    if (timeRangeOptions.length > 0) {
      const newTimeRange = {
        start: timeRangeOptions[0].value,
        end: timeRangeOptions[timeRangeOptions.length - 1].value
      };
      setTimeRange(newTimeRange);
      
      // Reset the chart data to show all available data
      setChartData(locations);
      setCurrentLabels(timeLabels);
      // Re-enable forecast when resetting time range
      setShowForecast(true);
      // Reset sorting flag
      setIsSorting(false);
    }
  };
  // Filter data based on selected time range
  const filterDataByTimeRange = (data: LocationData[], labels: string[]) => {
    return data.map(loc => ({
      ...loc,
      values: loc.values.filter((_, index) => {
        const [timeStr, period] = labels[index].split(' ');
        let hour = parseInt(timeStr);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour >= timeRange.start && hour <= timeRange.end;
      })
    }));
  };

  // Filter labels based on selected time range
  const filterLabelsByTimeRange = (labels: string[]) => {
    return labels.filter(label => {
      const [timeStr, period] = label.split(' ');
      let hour = parseInt(timeStr);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour >= timeRange.start && hour <= timeRange.end;
    });
  };// Update chart data only when time range changes and we're not in real-time mode
  useEffect(() => {
    // Don't update if we're not sorting (in real-time mode)
    if (!isSorting) return;
    
    // Update only if time range changes
    const filteredLabels = filterLabelsByTimeRange(timeLabels);
    const filteredData = filterDataByTimeRange(locations, timeLabels);
    setChartData(filteredData);
    setCurrentLabels(filteredLabels);
  }, [timeRange, locations, timeLabels, isSorting]); // Include all dependencies used in the effect

  // Handle time range selection changes
  const handleTimeRangeChange = (type: 'start' | 'end', value: number) => {
    setTimeRange(prev => ({ ...prev, [type]: value }));
    setIsSorting(true);
    setShowForecast(false);
  };

  // Update only the latest data point when props change to simulate real-time updates
  useEffect(() => {
    // Skip updates if sorting/filtering is active
    if (isSorting) return;

    // Handle initial load
    if (!chartData.length || !currentLabels.length) {
      const filteredLabels = filterLabelsByTimeRange(timeLabels);
      const filteredData = filterDataByTimeRange(locations, timeLabels);
      setChartData(filteredData);
      setCurrentLabels(filteredLabels);
      return;
    }

    if (locations.length > 0 && timeLabels.length > 0) {
      const latestTimeLabel = timeLabels[timeLabels.length - 1];
      const currentLatestLabel = currentLabels[currentLabels.length - 1];

      // Check if we have a new time point
      if (latestTimeLabel !== currentLatestLabel) {
        // Add the new time label
        setCurrentLabels(prev => [...prev.slice(1), latestTimeLabel]);
        
        // Update data points with the latest values
        setChartData(prev => 
          prev.map(loc => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            return {
              ...loc,
              values: [
                ...loc.values.slice(1), 
                matchingLocation.values[matchingLocation.values.length - 1]
              ]
            };
          })
        );
      } else {
        // Just update the last value of each location if it has changed
        setChartData(prev => 
          prev.map(loc => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            const latestValue = matchingLocation.values[matchingLocation.values.length - 1];
            if (loc.values[loc.values.length - 1] === latestValue) return loc;
            
            return {
              ...loc,
              values: [
                ...loc.values.slice(0, -1),
                latestValue
              ]
            };
          })
        );
      }
    }
  }, [locations, timeLabels, isSorting, chartData.length, currentLabels.length]);

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

  // Create data for historical bars and forecast bars
  let plotlyData = [];
  
  // Historical data bars
  const historicalBars = filteredLocations.map(location => ({
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
    hovertemplate: `<b>${location.name}</b><br>Time: %{x}<br>Dwell Time: %{y} sec<extra></extra>`,
  }));
  
  plotlyData = [...historicalBars];
  
  // Add forecast bars if available and enabled
  if (showForecast && forecastLabels.length > 0) {
    filteredLocations.forEach(location => {
      // Find the original location with forecast data
      const originalLocation = locations.find(loc => loc.name === location.name) as LocationWithForecast | undefined;
      
      if (originalLocation && 
          'dwellTimeForecast' in originalLocation && 
          Array.isArray(originalLocation.dwellTimeForecast) && 
          originalLocation.dwellTimeForecast.length > 0) {
        
        // Create forecast bars with a striped pattern
        const forecastBar = {
          x: [...currentLabels.slice(-1), ...forecastLabels], // Start from last historical point
          y: [location.values[location.values.length - 1], ...originalLocation.dwellTimeForecast], // Include last historical point
          type: 'bar',
          name: `${location.name} (Forecast)`,
          marker: { 
            color: location.color,
            opacity: 0.6,
            pattern: {
              shape: '/', 
              bgcolor: 'white'
            },
            line: {
              width: 1,
              color: 'white'
            }
          },
          hovertemplate: `<b>${location.name} (Forecast)</b><br>Time: %{x}<br>Est. Dwell Time: %{y} sec<extra></extra>`,
          showlegend: false
        };
        
        plotlyData.push(forecastBar);
      }
    });
  }

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
    margin: { l: 40, r: 20, t: 60, b: 40 },
    shapes: showForecast && forecastLabels.length > 0 ? [
      // Add a vertical line to separate historical from forecast data
      {
        type: 'line',
        x0: currentLabels[currentLabels.length - 1],
        x1: currentLabels[currentLabels.length - 1],
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: 'rgba(180, 180, 180, 0.4)',
          width: 1,
          dash: 'dot'
        }
      }
    ] : []
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

  // Toggle forecast visibility
  const toggleForecast = () => {
    setShowForecast(prev => !prev);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">timer</span>
            Dwell Time Analysis
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={timeRange.start}
                onChange={(e) => handleTimeRangeChange('start', parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded border border-gray-200"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">to</span>
              <select
                value={timeRange.end}
                onChange={(e) => handleTimeRangeChange('end', parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded border border-gray-200"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={resetTimeRange}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                title="Reset time range"
              >
                <span className="material-icons text-xs">refresh</span>
              </button>
            </div>
            
            {forecastLabels.length > 0 && (
              <button 
                onClick={toggleForecast}
                className={`text-xs px-2 py-1 rounded-full transition-all ${
                  showForecast 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="material-icons text-xs mr-1 align-text-bottom">
                  {showForecast ? 'visibility' : 'visibility_off'}
                </span>
                Forecast
              </button>
            )}
          </div>
        </div>

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
          {showForecast && forecastLabels.length > 0 
            ? "Average dwell time with AI-powered forecasts (striped bars)" 
            : "Average time visitors spend at each location"}
        </div>
      </div>
    </div>
  );
};

export default DwellTimeChart;
