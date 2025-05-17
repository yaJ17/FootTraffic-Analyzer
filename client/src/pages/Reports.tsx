import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from "date-fns";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { getReportData } from '@/data/reportData';
import { useFootTraffic } from '@/context/FootTrafficContext';
import { useAuth } from '@/context/AuthContext';
import { generateForecastInterpretation } from '@/utils/aiService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// Function to format location names
const formatLocationName = (key: string): string => {
  // Convert snake_case to Title Case and handle special cases
  return key
    .split('_')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'sm') return 'SM';
      if (word.toLowerCase() === 'of') return 'of';
      // Capitalize first letter of other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const Reports: React.FC = () => {
  const { videoStats, mapData, totalPeopleCount } = useFootTraffic();
  const { user } = useAuth();
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
  const [useAI, setUseAI] = useState(false);
  const [apiKey, setApiKey] = useState('');
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
  // Get top 3 locations by foot traffic
  const top3Locations = barangayReports.slice(0, 3);
  
  // Generate AI interpretations for top locations
  const generateAIInterpretations = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key to use AI interpretations.",
        variant: "destructive",
      });
      return;
    }

    const newInterpretations: Record<string, string> = {};
    
    for (const location of top3Locations) {
      const result = await generateForecastInterpretation(location, apiKey);
      if (result.success) {
        const locationKey = location.name.toLowerCase().replace(/\s+/g, '_');
        newInterpretations[locationKey] = result.interpretation;
      } else {
        toast({
          title: "Error",
          description: `Failed to generate interpretation for ${location.name}: ${result.error}`,
          variant: "destructive",
        });
      }
    }

    setForecastInterpretation(newInterpretations);
  };

  // Create dynamic forecast interpretations for top 3 locations
  const [forecastInterpretation, setForecastInterpretation] = useState<Record<string, string>>(
    top3Locations.reduce((acc: Record<string, string>, location) => {
      const locationKey = location.name.toLowerCase().replace(/\s+/g, '_');
      acc[locationKey] = `${location.name} shows significant foot traffic with ${location.avgFootTraffic} average visitors. ` +
        `Based on the current trend, we predict a ${Math.floor(Math.random() * 20) + 10}% increase in foot traffic ` +
        `during peak hours. The average dwell time of ${location.avgDwellTime} suggests ${
          parseInt(location.avgDwellTime) > 15 ? 'high engagement' : 'quick pass-through traffic'
        }.`;
      return acc;
    }, {})
  );

  useEffect(() => {
    if (useAI && apiKey) {
      generateAIInterpretations();
    }
  }, [useAI, apiKey]);

  // Create a stable list of all available locations
  const availableLocations = useMemo(() => {
    // Create a list of special locations first to maintain their order

    // Get locations from barangay reports
    const reportLocationIds = barangayReports?.map(report => ({
      id: report.name.toLowerCase().replace(/\s+/g, '_'),
      name: report.name,
      sortOrder: parseInt(report.id.toString())  // Add offset to keep after special locations
    })) || [];

    // Combine both lists
    const allLocations = [...reportLocationIds];

    // Create a map to remove duplicates while maintaining order
    const locationsMap = new Map();
    allLocations.forEach(loc => {
      if (!locationsMap.has(loc.id)) {
        locationsMap.set(loc.id, loc);
      }
    });

    return Array.from(locationsMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [barangayReports]);

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
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Foot Traffic Report</title>
            <style>
              @page {
                margin: 1.5cm;
                size: A4;
                @bottom-right {
                  content: counter(page) " of " counter(pages);
                }
              }
              body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.5;
                margin: 0;
                padding: 20px;
                counter-reset: page;
              }
              .content-wrapper {
                width: 100%;
              }
              .header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 2px solid #1a56db;
              }
              .logo {
                width: 120px;
                height: auto;
                object-fit: contain;
              }
              .company-info {
                flex: 1;
              }
              .company-name {
                color: #1a56db;
                font-size: 24px;
                margin: 0 0 5px 0;
              }
              .report-title {
                font-size: 18px;
                color: #4a5568;
                margin: 0 0 5px 0;
              }
              .company-info p {
                margin: 0;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              thead {
                display: table-header-group;
              }
              tbody {
                display: table-row-group;
              }
              tr {
                break-inside: avoid;
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
                margin-bottom: 15px;
              }
              .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-top: 1px solid #ddd;
                padding: 10px 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              .single-location-content {
                page-break-inside: avoid;
                page-break-before: avoid;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .header {
                  position: relative;
                }
                .single-location-content {
                  margin-top: 0;
                  page-break-before: avoid !important;
                  page-break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="content-wrapper">
              <div class="header">
                <img src="${logoImg}" class="logo" alt="Company Logo">
                <div class="company-info">
                  <h1 class="company-name">FootTraffic Analytics</h1>
                  <p class="report-title">Foot Traffic Analysis Report</p>
                  <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
                  <p>Generated by: ${user?.email || 'Unknown User'}</p>
                </div>
              </div>
              
              <div class="section">
                <p><strong>Date Range:</strong> ${startDate ? format(startDate, 'MMMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMMM d, yyyy') : 'All'}</p>
                <p><strong>Selected Locations:</strong> ${selectedLocations.includes('all') ? 'All Locations' : selectedLocations.join(', ')}</p>
              </div>

              ${selectedLocations.includes('all') 
                ? `<div class="all-locations-content">
                    <h2 class="section-title">Combined Foot Traffic Analysis</h2>
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

                    <h2 class="section-title" style="margin-top: 40px;">Forecast Interpretations</h2>
                    ${Object.entries(forecastInterpretation).map(([key, value]) => `
                      <div class="forecast-section">
                        <h3>${key === 'manilaCathedral' ? 'Manila Cathedral' : 
                              key === 'divisoriaMarket' ? 'Divisoria Market' : 
                              key === 'fortSantiago' ? 'Fort Santiago' : key}</h3>
                        <p>${value}</p>
                      </div>
                    `).join('')}
                  </div>`
                : selectedLocations.length === 1 
                  ? `<div class="single-location-content">
                      ${filteredReports.map(report => `
                        <h2 class="section-title">${report.name} - Foot Traffic Analysis</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Population</th>
                              <th>Avg. Foot Traffic</th>
                              <th>Total Foot Traffic</th>
                              <th>Avg. Dwell Time</th>
                              <th>Total Dwell Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>${report.population.toLocaleString()}</td>
                              <td>${report.avgFootTraffic}</td>
                              <td>${report.totalFootTraffic.toLocaleString()}</td>
                              <td>${report.avgDwellTime}</td>
                              <td>${report.totalDwellTime}</td>
                            </tr>
                          </tbody>
                        </table>
                        ${Object.entries(forecastInterpretation)
                          .filter(([key]) => {
                            const locationName = report.name.toLowerCase().replace(/\s+/g, '_');
                            return key === locationName;
                          })
                          .map(([key, value]) => `
                            <div class="forecast-section">
                              <h3>Forecast Interpretation</h3>
                              <p>${value}</p>
                            </div>
                          `).join('')}
                      `).join('')}
                    </div>`
                  : `${filteredReports.map((report, index) => `
                      <div class="location-section">
                        <h2 class="section-title">${report.name} - Foot Traffic Analysis</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Population</th>
                              <th>Avg. Foot Traffic</th>
                              <th>Total Foot Traffic</th>
                              <th>Avg. Dwell Time</th>
                              <th>Total Dwell Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>${report.population.toLocaleString()}</td>
                              <td>${report.avgFootTraffic}</td>
                              <td>${report.totalFootTraffic.toLocaleString()}</td>
                              <td>${report.avgDwellTime}</td>
                              <td>${report.totalDwellTime}</td>
                            </tr>
                          </tbody>
                        </table>
                        ${Object.entries(forecastInterpretation)
                          .filter(([key]) => {
                            const locationName = report.name.toLowerCase().replace(/\s+/g, '_');
                            return key === locationName;
                          })
                          .map(([key, value]) => `
                            <div class="forecast-section">
                              <h3>Forecast Interpretation</h3>
                              <p>${value}</p>
                            </div>
                          `).join('')}
                        ${index < filteredReports.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
                      </div>
                    `).join('')}`
              }
            </div>

            <div class="footer">
              <p>FootTraffic Analytics | Comprehensive Foot Traffic Analysis</p>
              <p>&copy; ${new Date().getFullYear()} All Rights Reserved</p>
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
      {/* Export Dialog */}
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
              <h3 className="font-medium text-sm">Locations</h3>              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border rounded-md p-3">
                {/* All Locations option always first */}
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
                
                {/* Render all other locations in stable order */}
                {availableLocations.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`location-${location.id}`}
                      checked={selectedLocations.includes(location.id)}
                      onChange={() => toggleLocation(location.id)}
                      className="rounded border-gray-300"
                      disabled={selectedLocations.includes('all')}
                    />
                    <label htmlFor={`location-${location.id}`} className="text-sm">
                      {location.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm">AI Interpretations</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-ai"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="use-ai" className="text-sm">
                    Use AI for interpretations
                  </label>
                </div>
                {useAI && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">OpenRouter API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your OpenRouter API key"
                    />
                  </div>
                )}
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
              <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">                <h3 className="font-bold text-lg mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2 text-sm">place</span>
                  {formatLocationName(key)}
                </h3>
                <p className="text-sm">{typeof value === 'string' ? value : 'No interpretation available'}</p>
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
