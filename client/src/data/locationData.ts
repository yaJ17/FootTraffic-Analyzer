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
    }>;
  };
}

export const getStatisticsData = (): StatisticsData => {
  return {
    heatmap: {
      z: [
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.4, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9],
        [0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9]
      ],
      x: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
      y: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    busiestPlaces: {
      places: [
        { id: 1, name: 'The Manila Cathedral' },
        { id: 2, name: 'Divisoria Market' },
        { id: 3, name: 'Manila High School' },
        { id: 4, name: 'Fort Santiago' },
        { id: 5, name: 'San Nicolas Church' }
      ]
    },
    avgFootTraffic: {
      gates: [
        {
          name: 'Main Gate',
          color: '#0039a6',
          values: [40, 30, 35, 40, 35, 40, 35, 30]
        },
        {
          name: 'East Gate',
          color: '#60a5fa',
          values: [12, 20, 15, 12, 14, 16, 18, 20]
        }
      ],
      timeLabels: ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
    },
    monthFootTraffic: {
      buildings: [
        { id: 'b1', name: 'Building 1', value: 152 },
        { id: 'b2', name: 'Building 2', value: 76 },
        { id: 'b3', name: 'Building 3', value: 15 },
        { id: 'b4', name: 'Building 4', value: 197 },
        { id: 'b5', name: 'Building 5', value: 89 },
        { id: 'b6', name: 'Building 6', value: 93 },
        { id: 'b7', name: 'Building 7', value: 130 },
        { id: 'b8', name: 'Building 8', value: 91 },
        { id: 'b9', name: 'Building 9', value: 68 },
        { id: 'b10', name: 'Building 10', value: 162 },
        { id: 'shop', name: 'Shopping', value: 176 }
      ]
    }
  };
};
