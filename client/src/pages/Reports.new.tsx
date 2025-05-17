import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from "date-fns";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { getReportData } from '@/data/reportData';
import { useFootTraffic } from '@/context/FootTrafficContext';

// Import the company logo
import logoImg from '../assets/logo.png';

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
  const { videoStats, mapData, totalPeopleCount } = useFootTraffic();
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: () => fetch('/api/reports').then(res => res.json()),
  });
  
  const [staticReportsData] = useState(getReportData());
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["all"]);
  const { toast } = useToast();
  
  // Create dynamic barangay reports
  const barangayReports: BarangayReport[] = mapData?.markers.map((marker, index) => {
    const existingReport = (reportsData?.barangays || staticReportsData.barangays)
      .find((report: BarangayReport) => report.name.includes(marker.name) || marker.name.includes(report.name));

    return {
      id: index + 1,
      name: marker.name,
      population: existingReport?.population || Math.floor(5000 + Math.random() * 15000),
      avgFootTraffic: Math.round(marker.count * 0.8),
      totalFootTraffic: marker.count * 24,
      avgDwellTime: `${Math.floor(2 + Math.random() * 8)} min ${Math.floor(Math.random() * 60)} sec`,
      totalDwellTime: `${Math.floor(marker.count * 0.2)} hrs ${Math.floor(Math.random() * 60)} min`
    };
  }).sort((a, b) => b.totalFootTraffic - a.totalFootTraffic) || [];

  const forecastInterpretation = reportsData?.forecastInterpretation || staticReportsData.forecastInterpretation;

  // Handle location checkbox selection
  const toggleLocation = (location: string) => {
    if (location === "all") {
      setSelectedLocations(selectedLocations.includes("all") ? [] : ["all"]);
    } else {
      let newLocations = [...selectedLocations];
      if (newLocations.includes("all")) {
        newLocations = newLocations.filter(loc => loc !== "all");
      }
      
      if (newLocations.includes(location)) {
        newLocations = newLocations.filter(loc => loc !== location);
      } else {
        newLocations.push(location);
      }
      
      setSelectedLocations(newLocations);
    }
  };
  
  // Handle exporting reports
  const handleExport = async () => {
    if (selectedLocations.length === 0) {
      toast({
        title: "Export Error",
        description: "Please select at least one location.",
        variant: "destructive",
      });
      return;
    }
    
    // Format dates for filename
    const startDateFormatted = startDate ? format(startDate, 'yyyyMMdd') : 'all';
    const endDateFormatted = endDate ? format(endDate, 'yyyyMMdd') : 'all';
    const locationsStr = selectedLocations.length > 1 ? 'multiple' : selectedLocations[0];
    const filename = `FootTrafficReport_${locationsStr}_${startDateFormatted}_${endDateFormatted}`;
    
    // Filter reports based on selected locations
    const filteredReports = selectedLocations.includes('all') 
      ? barangayReports 
      : barangayReports.filter(report => {
          const reportLocationId = report.name.toLowerCase().replace(/\s+/g, '_');
          return selectedLocations.includes(reportLocationId);
        });
    
    if (exportFormat === 'pdf') {
      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Foot Traffic Report</title>
            <style>
              @page {
                margin: 1.5cm;
                size: A4;
              }
              body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.5;
                margin: 0;
                padding: 20px;
              }
              .header {
                display: flex;
                align-items: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #1a56db;
                padding-bottom: 15px;
              }
              .logo {
                width: 80px;
                height: auto;
                margin-right: 20px;
              }
              .company-info {
                flex: 1;
              }
              .company-name {
                color: #1a56db;
                margin: 0;
                font-size: 24px;
              }
              .report-title {
                margin: 5px 0;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #1a56db;
                color: white;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .section {
                margin: 20px 0;
              }
              .section-title {
                color: #1a56db;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              .location-item {
                margin: 15px 0;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 5px;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoImg}" class="logo" alt="Company Logo">
              <div class="company-info">
                <h1 class="company-name">FootTraffic Analytics</h1>
                <p class="report-title">Foot Traffic Analysis Report</p>
                <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            
            <div class="section">
              <p><strong>Date Range:</strong> ${startDate ? format(startDate, 'MMMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMMM d, yyyy') : 'All'}</p>
              <p><strong>Selected Locations:</strong> ${selectedLocations.includes('all') ? 'All Locations' : selectedLocations.join(', ')}</p>
            </div>
            
            <div class="section">
              <h2 class="section-title">Foot Traffic Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Population</th>
                    <th>Avg. Foot Traffic</th>
                    <th>Total Foot Traffic</th>
                    <th>Avg. Dwell Time</th>
                    <th>Total Dwell Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredReports.map(report => `
                    <tr>
                      <td>${report.name}</td>
                      <td>${report.population.toLocaleString()}</td>
                      <td>${report.avgFootTraffic}</td>
                      <td>${report.totalFootTraffic.toLocaleString()}</td>
                      <td>${report.avgDwellTime}</td>
                      <td>${report.totalDwellTime}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <h2 class="section-title">Location Analysis</h2>
              ${Object.entries(forecastInterpretation)
                .filter(([key]) => selectedLocations.includes('all') || selectedLocations.includes(key))
                .map(([key, value]) => `
                  <div class="location-item">
                    <h3>${key === 'manilaCathedral' ? 'Manila Cathedral' : 
                          key === 'divisoriaMarket' ? 'Divisoria Market' : 
                          key === 'fortSantiago' ? 'Fort Santiago' : key}</h3>
                    <p>${value}</p>
                  </div>
                `).join('')}
            </div>
          </body>
        </html>
      `;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content and images to load
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        };
      } else {
        toast({
          title: "Export Error",
          description: "Please allow pop-ups to export PDF reports.",
          variant: "destructive",
        });
      }
    } 
    else if (exportFormat === 'csv') {
      const csvContent = [
        'Location,Population,Avg Foot Traffic,Total Foot Traffic,Avg Dwell Time,Total Dwell Time',
        ...filteredReports.map(report => 
          `${report.name},${report.population},${report.avgFootTraffic},${report.totalFootTraffic},"${report.avgDwellTime}","${report.totalDwellTime}"`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    else if (exportFormat === 'json') {
      const jsonData = {
        reportInfo: {
          locations: selectedLocations,
          dateRange: {
            start: startDate ? format(startDate, 'yyyy-MM-dd') : 'all',
            end: endDate ? format(endDate, 'yyyy-MM-dd') : 'all'
          },
          generatedAt: new Date().toISOString()
        },
        data: filteredReports,
        forecastInterpretation: selectedLocations.includes('all') 
          ? forecastInterpretation 
          : Object.fromEntries(
              Object.entries(forecastInterpretation)
                .filter(([key]) => selectedLocations.includes(key))
            )
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setExportDialogOpen(false);
    toast({
      title: "Report Downloaded",
      description: `Your ${exportFormat.toUpperCase()} report has been exported.`,
    });
  };

  if (isLoading || !videoStats || !mapData) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <span className="material-icons mr-2 text-primary">assessment</span>
              Loading Reports...
            </h2>
          </div>
          <div className="p-4">
            <div className="h-80 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-icons">download</span>
              Export Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Export Format</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant={exportFormat === "pdf" ? "default" : "outline"} 
                  onClick={() => setExportFormat("pdf")}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="material-icons">picture_as_pdf</span>
                  PDF
                </Button>
                <Button 
                  variant={exportFormat === "csv" ? "default" : "outline"} 
                  onClick={() => setExportFormat("csv")}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="material-icons">table_view</span>
                  CSV
                </Button>
                <Button 
                  variant={exportFormat === "json" ? "default" : "outline"} 
                  onClick={() => setExportFormat("json")}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="material-icons">data_object</span>
                  JSON
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start date:</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm"
                      >
                        <span className="material-icons mr-2 text-sm">calendar_today</span>
                        {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">End date:</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm"
                      >
                        <span className="material-icons mr-2 text-sm">calendar_today</span>
                        {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Locations</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="location-all"
                    checked={selectedLocations.includes('all')}
                    onChange={() => toggleLocation('all')}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="location-all" className="text-sm">
                    All Locations
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="location-manilaCathedral"
                    checked={selectedLocations.includes('manilaCathedral')}
                    onChange={() => toggleLocation('manilaCathedral')}
                    className="rounded border-gray-300"
                    disabled={selectedLocations.includes('all')}
                  />
                  <label htmlFor="location-manilaCathedral" className="text-sm">
                    Manila Cathedral
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="location-divisoriaMarket"
                    checked={selectedLocations.includes('divisoriaMarket')}
                    onChange={() => toggleLocation('divisoriaMarket')}
                    className="rounded border-gray-300"
                    disabled={selectedLocations.includes('all')}
                  />
                  <label htmlFor="location-divisoriaMarket" className="text-sm">
                    Divisoria Market
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="location-fortSantiago"
                    checked={selectedLocations.includes('fortSantiago')}
                    onChange={() => toggleLocation('fortSantiago')}
                    className="rounded border-gray-300"
                    disabled={selectedLocations.includes('all')}
                  />
                  <label htmlFor="location-fortSantiago" className="text-sm">
                    Fort Santiago
                  </label>
                </div>
                
                {barangayReports.map((barangay) => {
                  const locationId = barangay.name.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={barangay.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`location-${locationId}`}
                        checked={selectedLocations.includes(locationId)}
                        onChange={() => toggleLocation(locationId)}
                        className="rounded border-gray-300"
                        disabled={selectedLocations.includes('all')}
                      />
                      <label htmlFor={`location-${locationId}`} className="text-sm">
                        {barangay.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <span className="material-icons">download</span>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">assessment</span>
            Barangay Foot Traffic Reports
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total Foot Traffic:</span> {totalPeopleCount}
            </div>
            <Button 
              onClick={() => setExportDialogOpen(true)}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <span className="material-icons">download</span>
              Export Report
            </Button>
          </div>
        </div>
        
        <div className="p-4">
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
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">insights</span>
            Forecast Interpretation
          </h2>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(forecastInterpretation).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-lg mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2 text-sm">place</span>
                  {key === 'manilaCathedral' ? 'Manila Cathedral' :
                   key === 'divisoriaMarket' ? 'Divisoria Market' :
                   key === 'fortSantiago' ? 'Fort Santiago' : key}
                </h3>
                <p className="text-sm">{value}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-xs text-primary flex items-center">
                    <span className="material-icons text-xs mr-1">trending_up</span>
                    View Trend
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600 flex items-start">
            <span className="material-icons mr-2 text-amber-500">info</span>
            <p>These forecasts are generated based on historical foot traffic data and predictive analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
