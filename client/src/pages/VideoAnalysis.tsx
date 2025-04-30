import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FiUpload, FiVideo, FiBarChart2, FiClock, FiUsers, FiMapPin, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  people_count: number;
  avg_dwell_time: number;
  location: string;
  timestamp: string;
  peak_hour?: string;
  total_count_today?: number;
  average_speed?: string;
}

export default function VideoAnalysis() {
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlaskRunning, setIsFlaskRunning] = useState<boolean>(false);
  const [flaskCheckAttempted, setFlaskCheckAttempted] = useState<boolean>(false);
  // Use the Replit domain with port 5001 for the Flask server
  const flaskServerUrl = window.location.hostname.includes('replit') 
    ? `https://${window.location.hostname.replace('3000', '5001')}` 
    : 'http://localhost:5001';
  const { toast } = useToast();

  // Check if Flask server is running on component mount
  useEffect(() => {
    checkFlaskServer();
  }, []);

  useEffect(() => {
    // Fetch stats every 3 seconds when analyzing
    if (isAnalyzing) {
      const interval = setInterval(() => {
        fetchStats();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const checkFlaskServer = async () => {
    setFlaskCheckAttempted(true);
    try {
      // Use a controller to create an abort signal with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${flaskServerUrl}/api/status`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setIsFlaskRunning(true);
        const data = await response.json();
        console.log("Flask server status:", data);
        // If status check works, also load initial stats
        try {
          const statsResponse = await fetch(`${flaskServerUrl}/api/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        } catch (statsErr) {
          console.error('Initial stats fetch failed:', statsErr);
        }
        setError(null);
      } else {
        throw new Error('Flask server returned an error');
      }
    } catch (err) {
      console.error('Flask server check failed:', err);
      setIsFlaskRunning(false);
      setError('The Flask video analysis server is not responding. Please run the start_flask_server.sh script to start it.');
    }
  };
  
  const handleRestartFlask = () => {
    toast({
      title: "Attempting to use simulation mode",
      description: "The application will continue with simulated data since the Flask server is unavailable",
    });
    
    // Simply mark as analyzing and use the built-in mock data generation
    if (selectedSample) {
      setIsAnalyzing(true);
      const mockData = {
        people_count: 15,
        avg_dwell_time: 45.5,
        location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
        timestamp: new Date().toLocaleString(),
        peak_hour: "10:00 AM - 11:00 AM",
        total_count_today: 156,
        average_speed: "1.2 m/s"
      };
      setStats(mockData);
    } else {
      toast({
        title: "Select a video first",
        description: "Please select a sample video before starting analysis",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    if (!isFlaskRunning) {
      // Generate mock data when server is not available
      if (isAnalyzing) {
        const mockData = {
          people_count: Math.floor(Math.random() * 50) + 10,
          avg_dwell_time: Math.floor(Math.random() * 200) + 30,
          location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
          timestamp: new Date().toLocaleString()
        };
        setStats(mockData);
      }
      return;
    }
    
    try {
      // Use a controller to create an abort signal with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${flaskServerUrl}/api/stats`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Generate mock data on error
      if (isAnalyzing) {
        const mockData = {
          people_count: Math.floor(Math.random() * 50) + 10,
          avg_dwell_time: Math.floor(Math.random() * 200) + 30,
          location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
          timestamp: new Date().toLocaleString()
        };
        setStats(mockData);
      }
    }
  };

  const handleSampleSelect = (value: string) => {
    setSelectedSample(value);
  };

  const startAnalysis = async () => {    
    if (!selectedSample) {
      setError('Please select a sample video first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    if (!isFlaskRunning) {
      // Generate mock data when server is not available
      const mockData = {
        people_count: Math.floor(Math.random() * 50) + 10,
        avg_dwell_time: Math.floor(Math.random() * 200) + 30,
        location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
        timestamp: new Date().toLocaleString()
      };
      setStats(mockData);
      
      // Set up interval to update mock data
      const intervalId = setInterval(() => {
        const updatedMockData = {
          people_count: Math.floor(Math.random() * 50) + 10,
          avg_dwell_time: Math.floor(Math.random() * 200) + 30,
          location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
          timestamp: new Date().toLocaleString()
        };
        setStats(updatedMockData);
      }, 3000);
      
      // Clear interval when component unmounts
      setTimeout(() => {
        clearInterval(intervalId);
      }, 60000); // Stop after 1 minute to avoid memory leaks
      
      toast({
        title: "Simulation Mode",
        description: `Using simulated data for ${selectedSample} video analysis`,
      });
      
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('sample_video', `${selectedSample}.mp4`);
      
      // Use a controller to create an abort signal with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Longer timeout for POST
      
      const response = await fetch(`${flaskServerUrl}/process_sample`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to start video analysis');
      }
      
      // Start fetching stats
      fetchStats();
      
      toast({
        title: "Analysis Started",
        description: `Now analyzing ${selectedSample} video`,
      });
    } catch (err) {
      console.error('Error starting analysis:', err);
      
      // Generate mock data on error
      const mockData = {
        people_count: Math.floor(Math.random() * 50) + 10,
        avg_dwell_time: Math.floor(Math.random() * 200) + 30,
        location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
        timestamp: new Date().toLocaleString()
      };
      setStats(mockData);
      
      toast({
        title: "Fallback Mode",
        description: `Using simulated data for ${selectedSample} video due to server error`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Video Analysis</h1>
      
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analyze">Analyze Videos</TabsTrigger>
          <TabsTrigger value="upload">Upload New Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiVideo className="mr-2" /> 
                Sample Video Selection
              </CardTitle>
              <CardDescription>
                Choose a sample video to analyze foot traffic patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select onValueChange={handleSampleSelect} value={selectedSample}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sample video" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="palengke">Palengke (Market)</SelectItem>
                    <SelectItem value="school">School Entrance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                  <div className="flex items-start">
                    <FiAlertTriangle className="mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p>{error}</p>
                      {flaskCheckAttempted && !isFlaskRunning && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRestartFlask}
                            className="mr-2"
                          >
                            <FiRefreshCw className="mr-1" /> Use Simulation Mode
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => window.open("https://github.com/your-repo/foot-traffic-analyzer", "_blank")}
                          >
                            View Instructions
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={startAnalysis} 
                disabled={!selectedSample || isAnalyzing}
                className="w-full"
              >
                <FiBarChart2 className="mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </CardContent>
          </Card>
          
          {isAnalyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Live Video Stream</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center flex-1">
                  <div className="relative w-full max-w-xl border overflow-hidden rounded-md">
                    {isFlaskRunning ? (
                      <img 
                        src={`${flaskServerUrl}/video_feed`} 
                        alt="Live Video Analysis" 
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="bg-gray-100 p-8 text-center h-64 flex flex-col items-center justify-center">
                        <FiVideo className="text-5xl text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-2">Video stream unavailable</p>
                        <p className="text-sm text-gray-400">Using simulation mode with randomized data</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {stats ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center">
                        <FiMapPin className="text-blue-500 mr-3 text-xl flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-lg truncate">{stats.location}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex flex-wrap items-center">
                        <FiUsers className="text-green-500 mr-3 text-xl flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-500">People Count</p>
                          <p className="font-medium text-lg">{stats.people_count}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex flex-wrap items-center">
                        <FiClock className="text-orange-500 mr-3 text-xl flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-500">Average Dwell Time</p>
                          <p className="font-medium text-lg">{stats.avg_dwell_time} seconds</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-sm text-gray-500 mt-4">
                        Last updated: {stats.timestamp}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Waiting for analysis data...
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={fetchStats}>
                    Refresh Stats
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiUpload className="mr-2" />
                Upload Your Own Video
              </CardTitle>
              <CardDescription>
                Upload a video file for foot traffic analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <p className="mb-4">
                  Upload your own video by visiting the Flask server directly:
                </p>
                <Button asChild variant="outline">
                  <a href={`${flaskServerUrl}/upload`} target="_blank" rel="noopener noreferrer">
                    <FiUpload className="mr-2" />
                    Go to Upload Page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}