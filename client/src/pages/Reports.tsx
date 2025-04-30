import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  
  // Export report state
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["all"]);
  const { toast } = useToast();
  
  // Handle location checkbox selection
  const toggleLocation = (location: string) => {
    if (location === "all") {
      // If "All Locations" is checked, clear other selections
      if (selectedLocations.includes("all")) {
        setSelectedLocations([]);
      } else {
        setSelectedLocations(["all"]);
      }
    } else {
      // Remove "all" if it's selected and we're checking individual locations
      let newLocations = [...selectedLocations];
      if (newLocations.includes("all")) {
        newLocations = newLocations.filter(loc => loc !== "all");
      }
      
      // Toggle the selected location
      if (newLocations.includes(location)) {
        newLocations = newLocations.filter(loc => loc !== location);
      } else {
        newLocations.push(location);
      }
      
      setSelectedLocations(newLocations);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        {/* Loading state for main reports container */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <span className="material-icons mr-2 text-primary">assessment</span>
              Barangay Foot Traffic Reports
            </h2>
          </div>
          <div className="p-4">
            <div className="h-80 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* Loading state for forecast interpretation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <span className="material-icons mr-2 text-primary">insights</span>
              Forecast Interpretation
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-40 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-40 bg-gray-100 animate-pulse rounded"></div>
            </div>
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

  // Handle exporting reports
  const handleExport = () => {
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
    
    // Create filename based on selected options
    const filename = `FootTrafficReport_${locationsStr}_${startDateFormatted}_${endDateFormatted}`;
    
    // Filter reports based on selected locations
    const filteredReports = selectedLocations.includes('all') 
      ? barangayReports 
      : barangayReports.filter(report => {
          const reportLocationId = report.name.toLowerCase().replace(/\s+/g, '_');
          return selectedLocations.includes(reportLocationId);
        });
    
    // In a real implementation, we would make an API call to generate the report
    // For demonstration, we'll create a simple CSV/JSON/PDF based on current data
    let content: string = '';
    let mimeType: string = '';
    let fileExtension: string = exportFormat;
    
    // Generate file content based on selected format
    if (exportFormat === 'csv') {
      mimeType = 'text/csv';
      // Create CSV content
      content = 'Location,Population,Avg Foot Traffic,Total Foot Traffic,Avg Dwell Time,Total Dwell Time\n';
      filteredReports.forEach(report => {
        content += `${report.name},${report.population},${report.avgFootTraffic},${report.totalFootTraffic},"${report.avgDwellTime}","${report.totalDwellTime}"\n`;
      });
    } else if (exportFormat === 'json') {
      mimeType = 'application/json';
      // Create JSON content
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
        forecastInterpretation: selectedLocations.includes('all') ? 
          forecastInterpretation : 
          Object.fromEntries(
            Object.entries(forecastInterpretation)
              .filter(([key]) => selectedLocations.includes(key))
          )
      };
      
      content = JSON.stringify(jsonData, null, 2);
    } else if (exportFormat === 'pdf') {
      // For PDF, we would normally use a library like jsPDF or make a server request
      // For this demo, we'll create a styled HTML document that mimics a PDF report
      
      // Create a simple HTML table representation that could be converted to PDF
      content = `
<!DOCTYPE html>
<html>
  <head>
    <title>Foot Traffic Report</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 0;
        padding: 20px;
        color: #333;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #444;
        padding-bottom: 10px;
      }
      h1 { 
        color: #1a56db;
        margin-bottom: 5px; 
      }
      .meta-info {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        font-size: 14px;
        color: #555;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 20px 0;
      }
      th, td { 
        border: 1px solid #ddd; 
        padding: 12px; 
        text-align: left; 
      }
      th { 
        background-color: #1a56db; 
        color: white;
        font-weight: bold;
      }
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      .footer {
        margin-top: 30px;
        border-top: 1px solid #ddd;
        padding-top: 10px;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .location-section {
        margin: 30px 0;
      }
      .location-title {
        font-size: 18px;
        color: #1a56db;
        margin-bottom: 10px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Foot Traffic Analysis Report</h1>
      <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
    </div>
    
    <div class="meta-info">
      <div>
        <strong>Date Range:</strong> ${startDate ? format(startDate, 'MMMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMMM d, yyyy') : 'All'}
      </div>
      <div>
        <strong>Selected Locations:</strong> ${selectedLocations.join(', ')}
      </div>
    </div>
    
    <h2>Barangay Reports</h2>
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
    
    ${Object.entries(forecastInterpretation)
      .filter(([key]) => selectedLocations.includes('all') || selectedLocations.includes(key))
      .map(([key, value]) => `
        <div class="location-section">
          <div class="location-title">${key === 'manilaCathedral' ? 'Manila Cathedral' : 
                                        key === 'divisoriaMarket' ? 'Divisoria Market' : 
                                        key === 'fortSantiago' ? 'Fort Santiago' : key}</div>
          <p>${value}</p>
        </div>
      `).join('')}
    
    <div class="footer">
      <p>This report is generated by the Foot Traffic Analysis System. © 2025</p>
    </div>
  </body>
</html>
      `;
      
      mimeType = 'text/html';
      fileExtension = 'html'; // For demo purposes
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close dialog and show success message
    setExportDialogOpen(false);
    
    toast({
      title: "Report Downloaded",
      description: `Your ${exportFormat.toUpperCase()} report has been downloaded.`,
    });
  };

  return (
    <div className="p-6">
      {/* Export Report Dialog - Simplified Version */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-icons text-primary">download</span>
              Export Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            {/* Format Section */}
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
            
            {/* Date Range Section */}
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
            
            {/* Locations Section with Checkboxes */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Locations</h3>
              
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border rounded-md p-3">
                {/* All Locations checkbox */}
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
                
                {/* Main locations */}
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
                
                {/* Barangay locations */}
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
      
      {/* Main Reports Container */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">assessment</span>
            Barangay Foot Traffic Reports
          </h2>
          
          <Button 
            onClick={() => setExportDialogOpen(true)}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <span className="material-icons">download</span>
            Export Report
          </Button>
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
      
      {/* Separate Forecast Interpretation Container */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">insights</span>
            Forecast Interpretation
          </h2>
          
          <Button 
            onClick={() => {
              setExportFormat("pdf");
              setSelectedLocations(["all"]);
              setExportDialogOpen(true);
            }}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <span className="material-icons">download</span>
            Export Forecasts
          </Button>
        </div>
        
        <div className="p-4">
          {/* Cards for each location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Manila Cathedral */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <span className="material-icons text-primary mr-2 text-sm">place</span>
                Manila Cathedral
              </h3>
              <p className="text-sm">{forecastInterpretation.manilaCathedral}</p>
              <div className="mt-3 flex justify-end">
                <button className="text-xs text-primary flex items-center">
                  <span className="material-icons text-xs mr-1">trending_up</span>
                  View Trend
                </button>
              </div>
            </div>
            
            {/* Divisoria Market */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <span className="material-icons text-primary mr-2 text-sm">place</span>
                Divisoria Market
              </h3>
              <p className="text-sm">{forecastInterpretation.divisoriaMarket}</p>
              <div className="mt-3 flex justify-end">
                <button className="text-xs text-primary flex items-center">
                  <span className="material-icons text-xs mr-1">trending_up</span>
                  View Trend
                </button>
              </div>
            </div>
            
            {/* Fort Santiago */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <span className="material-icons text-primary mr-2 text-sm">place</span>
                Fort Santiago
              </h3>
              <p className="text-sm">{forecastInterpretation.fortSantiago}</p>
              <div className="mt-3 flex justify-end">
                <button className="text-xs text-primary flex items-center">
                  <span className="material-icons text-xs mr-1">trending_up</span>
                  View Trend
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600 flex items-start">
            <span className="material-icons mr-2 text-amber-500">info</span>
            <p>These forecasts are generated based on historical foot traffic data and predictive analytics. For more detailed analysis, please check the full report or contact the analytics team.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
