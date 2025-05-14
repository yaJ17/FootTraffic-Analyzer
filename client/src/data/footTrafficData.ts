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
  locationColors: {[key: string]: string};
  defaultData: {
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
  };
}

// Define a set of colors to use for the different locations
const LOCATION_COLORS: { [key: string]: string } = {
  'School Entrance Camera': '#e6194b', // red
  'Palengke Market Camera': '#3cb44b', // green
  'YouTube Stream Camera': '#4363d8', // blue
};

// Define default data to use when API data is not available
const DEFAULT_DATA = {
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
  }
};

// Generate time labels
const generateTimeLabels = () => {
  const now = new Date();
  const labels = [];
  
  for (let i = 6; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    const hour = time.getHours();
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    labels.push(`${hour12} ${amPm}`);
  }
  
  return labels;
};

// Fixed time labels for consistency
const TIME_LABELS = generateTimeLabels();

export const getDashboardData = (): FootTrafficData => {
  return {
    kpi: {
      title: 'Current Foot Traffic',
      value: '0',
      icon: 'groups'
    },
    peakHours: DEFAULT_DATA.peakHours,
    weeklySummary: DEFAULT_DATA.weeklySummary,
    map: {
      center: { lat: 14.5995, lon: 120.9842 },
      zoom: 13,
      zoneInfo: 'Current Location',
      markers: [
        { id: '1', name: 'Current Location', lat: 14.5915, lon: 120.9722, color: '#e6194b', count: 0 }
      ]
    },
    footTraffic: {
      locations: [
        { 
          name: 'Current Location', 
          color: '#e6194b',
          values: [0, 0, 0, 0, 0, 0, 0]
        }
      ],
      timeLabels: TIME_LABELS
    },    
    dwellTime: {
      locations: [
        { 
          name: 'Current Location', 
          color: '#e6194b',
          values: [0, 0, 0, 0, 0, 0, 0]
        }
      ],
      timeLabels: TIME_LABELS
    },
    locationColors: LOCATION_COLORS,
    defaultData: DEFAULT_DATA
  };
};
