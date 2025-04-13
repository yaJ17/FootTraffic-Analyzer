import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface BarangayReport {
  id: number;
  name: string;
  population: number;
  avgFootTraffic: number;
  totalFootTraffic: number;
  avgDwellTime: string;
  totalDwellTime: string;
}

const Reports: React.FC = () => {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: () => fetch('/api/reports').then(res => res.json()),
  });
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-bold mb-4">Reports</h2>
          <div className="h-80 bg-gray-100 animate-pulse rounded"></div>
          <div className="mt-8">
            <h3 className="font-bold mb-4">Forecast Interpretation</h3>
            <div className="bg-lightBlue p-4 rounded-lg h-40 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const barangayReports: BarangayReport[] = reportsData?.barangays || [
    { id: 1, name: 'Barangay 654', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
    { id: 2, name: 'Barangay 655', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
    { id: 3, name: 'Barangay 656', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' },
    { id: 4, name: 'Barangay 657', population: 619, avgFootTraffic: 27, totalFootTraffic: 415, avgDwellTime: '11 secs', totalDwellTime: '31 secs' },
    { id: 5, name: 'Barangay 658', population: 1496, avgFootTraffic: 152, totalFootTraffic: 1335, avgDwellTime: '16 secs', totalDwellTime: '54 secs' },
    { id: 6, name: 'Barangay 659', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
    { id: 7, name: 'Barangay 660', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
    { id: 8, name: 'Barangay 661', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' }
  ];

  const forecastInterpretation = reportsData?.forecastInterpretation || {
    manilaCathedral: "The forecast model predicts a 15% increase in foot traffic around Manila Cathedral during weekends over the next month. This is consistent with historical patterns and seasonal tourism fluctuations.",
    divisoriaMarket: "Divisoria Market shows clear weekly patterns with peak hours between 10 AM to 2 PM during weekdays. Our prediction model suggests this pattern will remain consistent, with potential congestion points around noon.",
    fortSantiago: "Fort Santiago foot traffic is highly dependent on weather conditions and shows strong correlation with tourism events. The model forecasts a 20% increase during the upcoming festival period (March 15-20)."
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-bold mb-4">Reports</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-primary text-white text-left">
                <th className="py-3 px-4 rounded-tl-lg">Location</th>
                <th className="py-3 px-4">Population</th>
                <th className="py-3 px-4">Avg. Foot Traffic</th>
                <th className="py-3 px-4">Total Foot Traffic</th>
                <th className="py-3 px-4">Avg. Dwell Time</th>
                <th className="py-3 px-4 rounded-tr-lg">Total Dwell Time</th>
              </tr>
            </thead>
            <tbody>
              {barangayReports.map((barangay, index) => (
                <tr key={barangay.id} className={index < barangayReports.length - 1 ? "border-b" : ""}>
                  <td className="py-3 px-4 font-medium">{index + 1}. {barangay.name}</td>
                  <td className="py-3 px-4">{barangay.population.toLocaleString()}</td>
                  <td className="py-3 px-4">{barangay.avgFootTraffic}</td>
                  <td className="py-3 px-4">{barangay.totalFootTraffic.toLocaleString()}</td>
                  <td className="py-3 px-4">{barangay.avgDwellTime}</td>
                  <td className="py-3 px-4">{barangay.totalDwellTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8">
          <h3 className="font-bold mb-4">Forecast Interpretation</h3>
          <div className="bg-lightBlue p-4 rounded-lg">
            <p className="mb-3">{forecastInterpretation.manilaCathedral}</p>
            <p className="mb-3">{forecastInterpretation.divisoriaMarket}</p>
            <p>{forecastInterpretation.fortSantiago}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
