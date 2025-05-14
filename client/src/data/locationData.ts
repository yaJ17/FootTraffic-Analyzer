export interface StatisticsData {
  heatmap: {
    z: number[][];
    x: string[];
    y: string[];
  };
  busiestPlaces: {
    places: Array<{
      id: number;
      name: string;
      count?: number;
    }>;
  };
  avgFootTraffic: {
    gates: Array<{
      name: string;
      color: string;
      values: number[];
    }>;
    timeLabels: string[];
  };
  monthFootTraffic: {
    buildings: Array<{
      id: string;
      name: string;
      value: number;
      color?: string;
    }>;
  };
}

// Define a set of colors to use for the different locations
export const locationColors: {[key: string]: string} = {
  'School Entrance Camera': '#4338ca', // indigo
  'Palengke Market Camera': '#0891b2', // cyan
  'YouTube Stream Camera': '#7c3aed', // violet
};

// Generate hourly labels for the x-axis
const generateHourlyLabels = () => {
  return ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
};

// Generate day labels for the y-axis
const generateDayLabels = () => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
};

export const getStatisticsData = (): StatisticsData => {
  // Create an empty heatmap matrix (all zeros)
  const createEmptyHeatmap = () => {
    return Array(6).fill(0).map(() => Array(12).fill(0.1));
  };

  return {
    heatmap: {
      z: createEmptyHeatmap(),
      x: generateHourlyLabels(),
      y: generateDayLabels()
    },
    busiestPlaces: {
      places: [
        { id: 1, name: 'Current Location', count: 0 }
      ]
    },
    avgFootTraffic: {
      gates: [
        {
          name: 'Current Location',
          color: '#4338ca',
          values: [0, 0, 0, 0, 0, 0, 0, 0]
        }
      ],
      timeLabels: ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
    },
    monthFootTraffic: {
      buildings: [
        { id: 'current', name: 'Current Location', value: 0, color: '#4338ca' }
      ]
    }
  };
};
