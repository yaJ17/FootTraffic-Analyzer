export interface BarangayReport {
  id: number;
  name: string;
  population: number;
  avgFootTraffic: number;
  totalFootTraffic: number;
  avgDwellTime: string;
  totalDwellTime: string;
}

export interface ReportData {
  barangays: BarangayReport[];
  forecastInterpretation: {
    currentLocation: string;
  };
}

export const getReportData = (): ReportData => {
  return {
    barangays: [
      { 
        id: 1, 
        name: 'Current Location', 
        population: 1000, 
        avgFootTraffic: 0, 
        totalFootTraffic: 0, 
        avgDwellTime: '0 secs', 
        totalDwellTime: '0 secs' 
      }
    ],
    forecastInterpretation: {
      currentLocation: "No historical data is available to generate a forecast for this location. Real-time monitoring is active."
    }
  };
};
