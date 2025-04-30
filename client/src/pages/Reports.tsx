import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from 'date-fns';
import { CalendarIcon, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 2, 1), // March 1, 2025
    to: new Date()
  });
  const [timeRange, setTimeRange] = useState<{ start: string; end: string }>({
    start: "08:00",
    end: "18:00"
  });
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  
  const { toast } = useToast();
  
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: () => fetch('/api/reports').then(res => res.json()),
  });
  
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
  
  // List of available locations
  const locations = [
    "Manila Cathedral", 
    "Divisoria Market", 
    "Fort Santiago", 
    "Barangay 654", 
    "Barangay 655", 
    "Barangay 656", 
    "Barangay 657", 
    "Barangay 658"
  ];
  
  // Toggle location selection
  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(loc => loc !== location) 
        : [...prev, location]
    );
  };
  
  // Handle time range change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    setTimeRange(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  // Generate export filename
  const getExportFilename = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    return `foot-traffic-report-${dateStr}.${exportFormat}`;
  };
  
  // Function to generate actual report data for export
  const generateReportData = () => {
    // Start with header row
    let csvContent = "Location,Population,Avg. Foot Traffic,Total Foot Traffic,Avg. Dwell Time,Total Dwell Time\n";
    
    // Filter locations if needed
    const filteredReports = selectedLocations.length > 0
      ? barangayReports.filter(report => selectedLocations.includes(report.name))
      : barangayReports;
    
    // Add data rows
    filteredReports.forEach(report => {
      csvContent += `${report.name},${report.population},${report.avgFootTraffic},${report.totalFootTraffic},"${report.avgDwellTime}","${report.totalDwellTime}"\n`;
    });
    
    return csvContent;
  };
  
  // Generate JSON data
  const generateJsonData = () => {
    const filteredReports = selectedLocations.length > 0
      ? barangayReports.filter(report => selectedLocations.includes(report.name))
      : barangayReports;
    
    const jsonData = {
      metadata: {
        exported_at: new Date().toISOString(),
        date_range: dateRange.from && dateRange.to 
          ? {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString()
            }
          : 'all dates',
        time_range: timeRange,
        locations: selectedLocations.length > 0 ? selectedLocations : 'all'
      },
      data: filteredReports
    };
    
    return JSON.stringify(jsonData, null, 2);
  };
  
  // Handle export action
  const handleExport = () => {
    const dateRangeStr = dateRange.from && dateRange.to 
      ? `from ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`
      : 'all dates';
      
    const timeRangeStr = `between ${timeRange.start} and ${timeRange.end}`;
    
    const locationStr = selectedLocations.length > 0
      ? selectedLocations.join(', ')
      : 'all locations';
    
    // Create file content based on export format
    let fileContent = '';
    let mimeType = '';
    let fileExtension = '';
    
    switch(exportFormat) {
      case 'csv':
        fileContent = generateReportData();
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        fileContent = generateJsonData();
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'xlsx':
        // For demo, we're exporting CSV for Excel too
        fileContent = generateReportData();
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'csv'; // Using CSV for simplicity
        break;
      case 'pdf':
        // For demo, we're creating a simple HTML-like content
        fileContent = `
          <h1>Foot Traffic Report</h1>
          <p>Date Range: ${dateRangeStr}</p>
          <p>Time Range: ${timeRangeStr}</p>
          <p>Locations: ${locationStr}</p>
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
        `;
        mimeType = 'text/plain'; // Using text for simplicity
        fileExtension = 'txt'; // Using text for simplicity in demo
        break;
      default:
        fileContent = generateReportData();
        mimeType = 'text/csv';
        fileExtension = 'csv';
    }
    
    // Create file for download
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const downloadLink = document.createElement('a');
    const filename = `foot-traffic-report-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
    
    downloadLink.href = url;
    downloadLink.download = filename;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Release the object URL
    URL.revokeObjectURL(url);
    
    // Show success notification
    toast({
      title: "Report Downloaded",
      description: `Downloaded ${exportFormat.toUpperCase()} report for ${locationStr} ${dateRangeStr} ${timeRangeStr}`,
    });
  };

  return (
    <div className="p-6">
      {/* Export Controls */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">download</span>
            Export Reports
          </h2>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Export Report</SheetTitle>
                <SheetDescription>
                  Customize your report export options. Select date and time range, locations, and export format.
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            if (range) {
                              setDateRange({
                                from: range.from,
                                to: range.to || range.from
                              });
                            } else {
                              setDateRange({ from: undefined, to: undefined });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Time Range */}
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <div className="flex gap-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs" htmlFor="startTime">From</Label>
                        <Input 
                          id="startTime" 
                          type="time" 
                          value={timeRange.start} 
                          onChange={(e) => handleTimeChange('start', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="endTime">To</Label>
                        <Input 
                          id="endTime" 
                          type="time" 
                          value={timeRange.end} 
                          onChange={(e) => handleTimeChange('end', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Locations */}
                <div className="space-y-2">
                  <Label>Locations</Label>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {locations.map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`location-${location}`} 
                            checked={selectedLocations.includes(location)}
                            onCheckedChange={() => toggleLocation(location)}
                          />
                          <Label 
                            htmlFor={`location-${location}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLocations.length === 0 
                      ? "All locations will be included" 
                      : `${selectedLocations.length} location(s) selected`}
                  </p>
                </div>
                
                {/* Export Format */}
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV Format</SelectItem>
                      <SelectItem value="xlsx">Excel Format</SelectItem>
                      <SelectItem value="pdf">PDF Format</SelectItem>
                      <SelectItem value="json">JSON Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Export Button */}
                <Button 
                  className="w-full mt-6" 
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Export functionality is directly accessible via the button above */}
      </div>
      
      {/* Main Reports Container */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">assessment</span>
            Barangay Foot Traffic Reports
          </h2>
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
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">insights</span>
            Forecast Interpretation
          </h2>
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
