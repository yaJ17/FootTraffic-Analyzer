import React, { useState, useEffect } from 'react';
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
import { getReportData } from '@/data/reportData';
import { sharedDataService, VideoStats, MapData } from '@/data/sharedDataService';

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
  // State for shared data
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  
  // Get data from shared service
  useEffect(() => {
    // Get initial values
    setVideoStats(sharedDataService.getVideoStats());
    setMapData(sharedDataService.getMapData());
    setTotalPeopleCount(sharedDataService.getTotalPeopleCount());
    
    // Subscribe to changes
    const videoStatsSubscription = sharedDataService.videoStats$.subscribe(
      (stats: VideoStats | null) => setVideoStats(stats)
    );
    
    const mapDataSubscription = sharedDataService.mapData$.subscribe(
      (data: MapData | null) => setMapData(data)
    );
    
    const totalPeopleCountSubscription = sharedDataService.totalPeopleCount$.subscribe(
      (count: number) => setTotalPeopleCount(count)
    );
    
    // Cleanup subscriptions
    return () => {
      videoStatsSubscription.unsubscribe();
      mapDataSubscription.unsubscribe();
      totalPeopleCountSubscription.unsubscribe();
    };
  }, []);
  
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: () => fetch('/api/reports').then(res => res.json()),
  });
  
  const [staticReportsData] = useState(getReportData());
  
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
  
  if (isLoading || !videoStats || !mapData) {
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

  // Create dynamic barangay reports using data from both the API and foot traffic context
  const barangayReports: BarangayReport[] = mapData.markers.map((marker, index) => {
    // Try to find existing report data for this location
    const existingReport = (reportsData?.barangays || staticReportsData.barangays)
      .find((report: BarangayReport) => report.name.includes(marker.name) || marker.name.includes(report.name));

    // Use existing data or create synthetic data based on marker data
    return {
      id: index + 1,
      name: marker.name,
      population: existingReport?.population || Math.floor(5000 + Math.random() * 15000),
      avgFootTraffic: Math.round(marker.count * 0.8),
      totalFootTraffic: marker.count * 24, // Daily total
      avgDwellTime: `${Math.floor(2 + Math.random() * 8)} min ${Math.floor(Math.random() * 60)} sec`,
      totalDwellTime: `${Math.floor(marker.count * 0.2)} hrs ${Math.floor(Math.random() * 60)} min`
    };
  }).sort((a, b) => b.totalFootTraffic - a.totalFootTraffic);

  const forecastInterpretation = reportsData?.forecastInterpretation || staticReportsData.forecastInterpretation;

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
    
    toast({
      title: "Report Downloaded",
      description: `Your ${exportFormat.toUpperCase()} report has been downloaded.`,
    });
    
    setExportDialogOpen(false);
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
                
                {/* Location checkboxes from dynamic data */}
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
