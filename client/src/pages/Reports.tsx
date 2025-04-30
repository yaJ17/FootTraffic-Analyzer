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
      // For PDF, we'll create an HTML representation that will be properly converted to PDF
      // using the browser's built-in print-to-PDF functionality
      
      mimeType = 'text/html';
      fileExtension = 'pdf'; // This will be used for the download filename
      
      // Create an HTML document specifically styled for printing to PDF
      content = `
<!DOCTYPE html>
<html>
  <head>
    <title>Foot Traffic Report - ${selectedLocations.includes('all') ? 'All Locations' : selectedLocations.join(', ')}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        background: white;
      }
      .report-container {
        max-width: 1000px;
        margin: 0 auto;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1a56db;
      }
      h1 {
        color: #1a56db;
        margin-bottom: 5px;
      }
      h2 {
        color: #1a56db;
        margin-top: 30px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .meta-info {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        color: #555;
      }
      table {
        width: 100%;
        border-collapse: collapse;
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
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 12px;
        color: #777;
        border-top: 1px solid #ddd;
        padding-top: 20px;
      }
      .location-section {
        margin: 30px 0;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 5px;
      }
      .location-title {
        font-size: 18px;
        color: #1a56db;
        margin-bottom: 10px;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none;
        }
        .page-break {
          page-break-after: always;
        }
      }
      .print-button {
        display: block;
        margin: 20px auto;
        padding: 10px 20px;
        background: #1a56db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      }
    </style>
    <script>
      // Auto-trigger print dialog when the page loads
      window.onload = function() {
        // Small delay to ensure the page is fully rendered
        setTimeout(function() {
          document.getElementById('print-instructions').style.display = 'block';
        }, 1000);
      }
      
      function printDocument() {
        // Hide the button during printing
        document.getElementById('print-button').style.display = 'none';
        document.getElementById('print-instructions').style.display = 'none';
        
        window.print();
        
        // Show the button again after printing dialog is closed
        setTimeout(function() {
          document.getElementById('print-button').style.display = 'block';
          document.getElementById('print-instructions').style.display = 'block';
        }, 1000);
      }
    </script>
  </head>
  <body>
    <div id="print-instructions" class="no-print" style="display:none; position:fixed; top:0; left:0; right:0; background:#fffde7; text-align:center; padding:15px; border-bottom:2px solid #fbc02d; z-index:999;">
      <p><strong>To save this report as a PDF:</strong> Click the "Save as PDF" button below or use your browser's print function and select "Save as PDF" from the destination options.</p>
      <button id="print-button" class="print-button" onclick="printDocument()">Save as PDF</button>
    </div>
    
    <div class="report-container">
      <div class="header">
        <h1>Foot Traffic Analysis Report</h1>
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
      </div>
      
      <div class="meta-info">
        <div>
          <strong>Date Range:</strong> ${startDate ? format(startDate, 'MMMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMMM d, yyyy') : 'All'}
        </div>
        <div>
          <strong>Selected Locations:</strong> ${selectedLocations.includes('all') ? 'All Locations' : selectedLocations.join(', ')}
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
      
      <div class="page-break"></div>
      
      <h2>Forecast Interpretation</h2>
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
    </div>
  </body>
</html>
      `;
    }
    
    // Create and download the file with proper MIME types
    if (exportFormat === 'pdf') {
      // Create a well-formatted PDF as HTML that will be converted to a PDF
      const logoBase64 = "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";
      
      // Use real data from Reports page
      const companyName = "FootTraffic Analytics";
      
      // Create HTML for the PDF that includes the actual barangay reports and forecast data
      const pdfContent = `
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
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1a56db;
      padding-bottom: 15px;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }
    .company-info {
      flex: 1;
    }
    .company-info h1 {
      color: #1a56db;
      margin: 0;
      font-size: 24px;
    }
    .company-info p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    h2 {
      color: #1a56db;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 18px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .report-info {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .report-info div {
      margin-right: 20px;
    }
    .report-info strong {
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      background-color: #1a56db;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .location-section {
      margin: 15px 0;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .location-title {
      color: #1a56db;
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="data:image/png;base64,${logoBase64}" alt="Company Logo">
    <div class="company-info">
      <h1>${companyName}</h1>
      <p>Foot Traffic Analysis Report</p>
      <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
    </div>
  </div>

  <div class="report-info">
    <div>
      <strong>Date Range:</strong> ${startDate ? format(startDate, 'MMMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMMM d, yyyy') : 'All'}
    </div>
    <div>
      <strong>Locations:</strong> ${selectedLocations.includes('all') ? 'All Locations' : selectedLocations.join(', ')}
    </div>
  </div>

  <h2>Barangay Foot Traffic Reports</h2>
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

  <h2>Forecast Interpretation</h2>
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
    <p>${companyName} - Comprehensive Foot Traffic Analysis | www.foottraffic-analytics.com</p>
    <p>&copy; ${new Date().getFullYear()} ${companyName} - All Rights Reserved</p>
  </div>
</body>
</html>
      `;
      
      // Create a blob with application/pdf MIME type 
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and click it to download directly
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } 
    else if (exportFormat === 'csv') {
      // For CSV, use the text/csv MIME type
      const blob = new Blob([content], { type: 'text/csv' });
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
      // For JSON, use application/json MIME type
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
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
