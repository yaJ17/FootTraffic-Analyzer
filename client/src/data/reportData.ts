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
    manilaCathedral: string;
    divisoriaMarket: string;
    fortSantiago: string;
  };
}

export const getReportData = (): ReportData => {
  return {
    barangays: [
      { id: 1, name: 'Barangay 654', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
      { id: 2, name: 'Barangay 655', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
      { id: 3, name: 'Barangay 656', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' },
      { id: 4, name: 'Barangay 657', population: 619, avgFootTraffic: 27, totalFootTraffic: 415, avgDwellTime: '11 secs', totalDwellTime: '31 secs' },
      { id: 5, name: 'Barangay 658', population: 1496, avgFootTraffic: 152, totalFootTraffic: 1335, avgDwellTime: '16 secs', totalDwellTime: '54 secs' },
      { id: 6, name: 'Barangay 659', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
      { id: 7, name: 'Barangay 660', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
      { id: 8, name: 'Barangay 661', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' }
    ],
    forecastInterpretation: {
      manilaCathedral: "The forecast model predicts a 15% increase in foot traffic around Manila Cathedral during weekends over the next month. This is consistent with historical patterns and seasonal tourism fluctuations.",
      divisoriaMarket: "Divisoria Market shows clear weekly patterns with peak hours between 10 AM to 2 PM during weekdays. Our prediction model suggests this pattern will remain consistent, with potential congestion points around noon.",
      fortSantiago: "Fort Santiago foot traffic is highly dependent on weather conditions and shows strong correlation with tourism events. The model forecasts a 20% increase during the upcoming festival period (March 15-20)."
    }
  };
};
