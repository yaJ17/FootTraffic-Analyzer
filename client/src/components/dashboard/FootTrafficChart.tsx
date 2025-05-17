import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface LocationData {
  name: string;
  color: string;
  values: number[];
}

interface LocationWithForecast extends LocationData {
  trafficForecast: number[];
}

interface FootTrafficChartProps {
  locations: LocationData[];
  timeLabels: string[];
  forecastLabels?: string[]; // Add optional forecast labels
}

const FootTrafficChart: React.FC<FootTrafficChartProps> = ({ 
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
  };


  // Handle time range selection changes
  const handleTimeRangeChange = (type: 'start' | 'end', value: number) => {
    setTimeRange(prev => ({ ...prev, [type]: value }));
    setIsSorting(true);
    setShowForecast(false);
  };  // Update chart data only when time range changes and we're not in real-time mode
  useEffect(() => {
    // Don't update if we're not sorting (in real-time mode)
    if (!isSorting) return;
    
    // Update only if time range changes
    const filteredLabels = filterLabelsByTimeRange(timeLabels);
    const filteredData = filterDataByTimeRange(locations, timeLabels);
    setChartData(filteredData);
    setCurrentLabels(filteredLabels);
  }, [timeRange]); // Only depend on timeRange changes
  

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

  // Calculate total foot traffic per location
  const totalValues = chartData.map(loc => ({
    name: loc.name,
    total: loc.values.reduce((sum, val) => sum + val, 0).toFixed(1),
    color: loc.color,
    // Get current value (last position)
    current: loc.values.length > 0 ? loc.values[loc.values.length - 1] : 0
  }));

  // Filter locations based on selection
  const filteredLocations = chartData.filter(loc => selectedLocations.has(loc.name));

  // Create the data array for Plotly, including forecasts if available and enabled
  const plotlyData = filteredLocations.flatMap(location => {
    // Get the matching original location that might contain forecast data
    const originalLocation = locations.find(loc => loc.name === location.name) as LocationWithForecast | undefined;
    const hasForecast = originalLocation && 
                        'trafficForecast' in originalLocation && 
                        Array.isArray(originalLocation.trafficForecast) &&
                        originalLocation.trafficForecast.length > 0 &&
                        forecastLabels.length > 0;

    // Create the historical data trace
    const historicalTrace = {
      x: currentLabels,
      y: location.values,
      type: 'scatter',
      mode: 'lines+markers',
      name: location.name,
      marker: { 
        color: location.color, 
        size: 6,
        line: {
          width: 1,
          color: 'white'
        }
      },
      line: { color: location.color, width: 3, shape: 'spline' },
      hovertemplate: `<b>${location.name}</b><br>Time: %{x}<br>Foot Traffic: %{y}<extra></extra>`
    };

    // If no forecast or forecast is disabled, return only the historical trace
    if (!hasForecast || !showForecast) {
      return [historicalTrace];
    }

    // Create the forecast trace with dashed line
    const forecastTrace = {
      x: [...currentLabels.slice(-1), ...forecastLabels], // Start from last historical point
      y: [location.values[location.values.length - 1], ...originalLocation.trafficForecast], // Include last historical point
      type: 'scatter',
      mode: 'lines',
      name: `${location.name} (Forecast)`,
      line: { 
        color: location.color, 
        width: 2, 
        dash: 'dash',
        shape: 'spline' 
      },
      marker: { color: location.color, opacity: 0.7 },
      hovertemplate: `<b>${location.name} (Forecast)</b><br>Time: %{x}<br>Estimated Traffic: %{y}<extra></extra>`,
      showlegend: false
    };

    return [historicalTrace, forecastTrace];
  });

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
      title: 'People',
      titlefont: { size: 12, color: '#777' },
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    showlegend: false, // Keep custom legend
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
            <span className="material-icons mr-2 text-primary">timeline</span>
            Foot Traffic Trends
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
          {totalValues.map((loc) => (
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
              <span className="ml-1 text-gray-500">{loc.current}</span>
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

        {showForecast && forecastLabels.length > 0 && (
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span className="material-icons text-xs mr-1">info</span>
            Dashed lines represent AI-powered traffic forecasts
          </div>
        )}
      </div>
    </div>
  );
};

export default FootTrafficChart;
