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

// Function to generate time labels dynamically based on current time
function generateDynamicTimeLabels(hours: number, interval: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  // Round current hour down to the nearest interval
  const currentHour = now.getHours();
  const roundedCurrentHour = Math.floor(currentHour / interval) * interval;
  
  // Start from (hours) hours ago, and move forward in (interval) hour steps
  for (let i = hours; i >= -interval; i -= interval) {  // Changed to go to -interval to include one future time point
    // Calculate the hour (hours-i) hours ago from the rounded current hour
    let hour = (roundedCurrentHour - i + 24) % 24; // Add 24 and mod 24 to handle negative hours
    
    // Convert to 12-hour format with AM/PM
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    labels.push(`${hour12} ${amPm}`);
  }
  
  return labels;
}

// Create time labels for 12 hours of history with 2-hour intervals
const FOOT_TRAFFIC_TIME_LABELS = generateDynamicTimeLabels(12, 2);

// Create time labels for 10 hours of history with 2-hour intervals
const DWELL_TIME_LABELS = generateDynamicTimeLabels(10, 2);

// Define a set of colors to use for the different locations - updated with a comprehensive color palette
const LOCATION_COLORS: { [key: string]: string } = {
  // Camera locations
  'School Entrance Camera': '#6366F1', // Indigo
  'Palengke Market Camera': '#D946EF', // Fuchsia
  'YouTube Stream Camera': '#14B8A6', // Teal
  
  // Manila districts and landmarks
  'Makati CBD': '#3B82F6',           // Blue
  'Bonifacio Global City': '#10B981', // Emerald
  'SM Mall of Asia': '#F59E0B',       // Amber
  'Quezon City Circle': '#8B5CF6',    // Violet
  'Divisoria Market': '#EF4444',      // Red
  'Divisoria': '#EF4444',             // Red (same as Divisoria Market)
  'Intramuros': '#EC4899',            // Pink
  'Rizal Park': '#06B6D4',            // Cyan
  'University Belt': '#F97316',       // Orange
  'Binondo': '#84CC16',               // Lime
  'Manila Cathedral': '#9333EA',      // Purple
  'Fort Santiago': '#FACC15',         // Yellow
  'Ayala Center': '#A855F7',          // Purple
  'Greenhills Shopping Center': '#2563EB', // Royal Blue
  'Manila Bay': '#DC2626',            // Bright Red
  'Sample Location': '#0284C7'        // Sky Blue
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

export const getDashboardData = (): FootTrafficData => {
  // Helper function to create random values matching the number of labels
  const generateValues = (min: number, max: number, count: number): number[] => {
    return Array.from({ length: count }, () => 
      Math.round((Math.random() * (max - min) + min) * 10) / 10
    );
  };
  
  return {
    kpi: {
      title: 'Total Foot Traffic',
      value: '1,064',
      icon: 'groups'
    },
    peakHours: DEFAULT_DATA.peakHours,
    weeklySummary: DEFAULT_DATA.weeklySummary,
    map: {
      center: { lat: 14.5995, lon: 120.9842 },
      zoom: 13,
      zoneInfo: '649 ZONE 68',
      markers: [
        { id: '1', name: 'Manila Cathedral', lat: 14.5915, lon: 120.9722, color: '#911eb4', count: 342 },
        { id: '2', name: 'Divisoria', lat: 14.6019, lon: 120.9719, color: '#f58231', count: 578 },
        { id: '3', name: 'Fort Santiago', lat: 14.5958, lon: 120.9669, color: '#ffe119', count: 219 }
      ]
    },
    footTraffic: {
      locations: [
        { 
          name: 'Divisoria', 
          color: '#f58231',
          values: [1.2, 1.8, 2.5, 3.2, 3.6, 3.8, 4.0]
        },
        { 
          name: 'Manila Cathedral', 
          color: '#911eb4',
          values: [0.8, 1.2, 1.7, 2.1, 2.5, 2.8, 2.6]
        },
        { 
          name: 'Fort Santiago', 
          color: '#ffe119',
          values: [0.4, 0.5, 0.6, 0.7, 0.9, 1.0, 0.9]
        }
      ],
      timeLabels: FOOT_TRAFFIC_TIME_LABELS
    },    
    dwellTime: {
      locations: [
        { 
          name: 'Divisoria', 
          color: '#0039a6',
          values: [2.5, 3.0, 3.5, 4.2, 4.8, 5.0]
        },
        { 
          name: 'Manila Cathedral', 
          color: '#f97316',
          values: [2.0, 2.5, 3.0, 3.5, 3.8, 3.5]
        }
      ],
      timeLabels: DWELL_TIME_LABELS
    },
    locationColors: LOCATION_COLORS,
    defaultData: DEFAULT_DATA
  };
};

/**
 * Generates time labels for the past N hours with the specified interval
 * This function is kept for reference but we're using fixed labels instead
 * to ensure consistency across re-renders
 * 
 * @param hours Number of hours to go back
 * @param interval Interval between hours
 * @returns Array of time labels in format "h AM/PM"
 */
function generateTimeLabels(hours: number, interval: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  console.log("Generating time labels, starting from:", now);
  console.log("Going back hours:", hours, "with interval:", interval);
  
  // Starting with the earliest time (hours ago) and moving toward now
  for (let i = hours; i >= 0; i -= interval) {
    const hoursAgo = i;
    const time = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    // Format the hour for display
    const hour = time.getHours();
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    const label = `${hour12} ${amPm}`;
    labels.push(label);
    
    console.log(`Added label: ${label} for time ${time.toLocaleTimeString()} (${hoursAgo} hours ago)`);
  }
  
  console.log("Final labels:", labels);
  return labels;
}
