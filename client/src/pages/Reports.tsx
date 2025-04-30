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
  const [exportLocation, setExportLocation] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();
  
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
    // Format dates for filename
    const startDateFormatted = startDate ? format(startDate, 'yyyyMMdd') : 'all';
    const endDateFormatted = endDate ? format(endDate, 'yyyyMMdd') : 'all';
    
    // Create filename based on selected options
    const filename = `FootTrafficReport_${exportLocation}_${startDateFormatted}_${endDateFormatted}.${exportFormat}`;
    
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
      barangayReports.forEach(report => {
        content += `${report.name},${report.population},${report.avgFootTraffic},${report.totalFootTraffic},"${report.avgDwellTime}","${report.totalDwellTime}"\n`;
      });
    } else if (exportFormat === 'json') {
      mimeType = 'application/json';
      // Create JSON content
      const jsonData = {
        reportInfo: {
          location: exportLocation,
          dateRange: {
            start: startDate ? format(startDate, 'yyyy-MM-dd') : 'all',
            end: endDate ? format(endDate, 'yyyy-MM-dd') : 'all'
          },
          generatedAt: new Date().toISOString()
        },
        data: barangayReports,
        forecastInterpretation
      };
      
      content = JSON.stringify(jsonData, null, 2);
    } else {
      // For PDF, we'll create a data URI with a simple HTML representation
      // In a real implementation, this would be handled on the server side
      mimeType = 'application/pdf';
      
      // Create a simple HTML table representation that could be converted to PDF
      // For demonstration, we'll just download this as text
      content = `
        <html>
          <head>
            <title>Foot Traffic Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Foot Traffic Report</h1>
            <p>Location: ${exportLocation}</p>
            <p>Date Range: ${startDate ? format(startDate, 'yyyy-MM-dd') : 'All'} to ${endDate ? format(endDate, 'yyyy-MM-dd') : 'All'}</p>
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
                ${barangayReports.map(report => `
                  <tr>
                    <td>${report.name}</td>
                    <td>${report.population}</td>
                    <td>${report.avgFootTraffic}</td>
                    <td>${report.totalFootTraffic}</td>
                    <td>${report.avgDwellTime}</td>
                    <td>${report.totalDwellTime}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      // In a real app, this would be converted to PDF
      mimeType = 'text/html';
      fileExtension = 'html'; // Download as HTML for demonstration
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FootTrafficReport_${exportLocation}_${startDateFormatted}_${endDateFormatted}.${fileExtension}`;
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
      {/* Export Report Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-icons text-primary">download</span>
              Export Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            <Tabs defaultValue="format" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="date">Date Range</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="format" className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Select export format:</p>
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
              </TabsContent>
              
              <TabsContent value="date" className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Start date:</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span className="material-icons mr-2">calendar_today</span>
                          {startDate ? format(startDate, "PPP") : "Select date"}
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
                    <p className="text-sm text-gray-500 mb-2">End date:</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span className="material-icons mr-2">calendar_today</span>
                          {endDate ? format(endDate, "PPP") : "Select date"}
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
              </TabsContent>
              
              <TabsContent value="location" className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Select location:</p>
                  <Select 
                    value={exportLocation} 
                    onValueChange={setExportLocation}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="manilaCathedral">Manila Cathedral</SelectItem>
                      <SelectItem value="divisoriaMarket">Divisoria Market</SelectItem>
                      <SelectItem value="fortSantiago">Fort Santiago</SelectItem>
                      {barangayReports.map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.name.toLowerCase().replace(/\s+/g, '_')}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
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
              setExportLocation("all");
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
