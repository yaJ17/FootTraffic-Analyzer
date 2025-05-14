export interface FootTrafficData {
  kpi: {
    title: string;
    value: string;
    icon: string;
  };
  peakHours: {
    peakStart: { time: string; status: string };
    peakMax: { time: string; status: string };
    peakEnd: { time: string; status: string };
  };
  weeklySummary: {
    monday: number;
    weekend: number;
    weekday: number;
    total: number;
  };
  map: {
    center: { lat: number; lon: number };
    zoom: number;
    zoneInfo: string;
    markers: Array<{
      id: string;
      name: string;
      lat: number;
      lon: number;
      color: string;
      count: number;
    }>;
  };
  footTraffic: {
    locations: Array<{
      name: string;
      color: string;
      values: number[];
    }>;
    timeLabels: string[];
  };
  dwellTime: {
    locations: Array<{
      name: string;
      color: string;
      values: number[];
    }>;
    timeLabels: string[];
  };
}

export const getDashboardData = (): FootTrafficData => {
  return {
    kpi: {
      title: 'Total Foot Traffic',
      value: '1,064',
      icon: 'groups'
    },
    peakHours: {
      peakStart: { time: '9 AM', status: 'Peak already started' },
      peakMax: { time: '12 PM', status: 'Peak in 3 hours already started' },
      peakEnd: { time: '8 PM', status: '9 hours and 5 minutes' }
    },
    weeklySummary: {
      monday: 300,
      weekend: 229,
      weekday: 400,
      total: 929
    },
    map: {
      center: { lat: 14.5995, lon: 120.9842 },
      zoom: 13,
      zoneInfo: '649 ZONE 68',
      markers: [
        { id: '1', name: 'Manila Cathedral', lat: 14.5915, lon: 120.9722, color: '#dc2626', count: 342 },
        { id: '2', name: 'Divisoria', lat: 14.6019, lon: 120.9719, color: '#0039a6', count: 578 },
        { id: '3', name: 'Fort Santiago', lat: 14.5958, lon: 120.9669, color: '#eab308', count: 219 }
      ]
    },
    footTraffic: {
      locations: [
        { 
          name: 'Divisoria', 
          color: '#0039a6',
          values: [2, 1, 2.5, 2, 3, 3.5, 3]
        },
        { 
          name: 'Manila Cathedral', 
          color: '#dc2626',
          values: [1, 3, 1.5, 2.5, 2, 2.5, 2]
        },
        { 
          name: 'Fort Santiago', 
          color: '#eab308',
          values: [0.5, 1, 0.7, 0.6, 0.8, 0.7, 0.6]
        }
      ],
      timeLabels: generateTimeLabels(12, 2)
    },    
    dwellTime: {
      locations: [
        { 
          name: 'Divisoria', 
          color: '#0039a6',
          values: [5, 3, 4, 2, 3, 5]
        },
        { 
          name: 'Manila Cathedral', 
          color: '#f97316',
          values: [3, 4, 3, 2, 3, 3]
        }
      ],
      timeLabels: generateTimeLabels(10, 2)
    }
  };
};

/**
 * Generates time labels for the past N hours with the specified interval
 * @param hours Number of hours to go back
 * @param interval Interval between hours
 * @returns Array of time labels in format "h AM/PM"
 */
function generateTimeLabels(hours: number, interval: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i -= interval) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    labels.push(`${hour12} ${amPm}`);
  }
  
  return labels;
}
