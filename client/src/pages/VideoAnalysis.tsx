import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FiUpload, FiVideo, FiBarChart2, FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  people_count: number;
  avg_dwell_time: number;
  location: string;
  timestamp: string;
}

export default function VideoAnalysis() {
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlaskRunning, setIsFlaskRunning] = useState<boolean>(false);
  const flaskServerUrl = 'http://localhost:5001';
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
    try {
      // Use a controller to create an abort signal with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${flaskServerUrl}/api/stats`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setIsFlaskRunning(true);
        const data = await response.json();
        console.log("Initial stats:", data);
      }
    } catch (err) {
      console.error('Flask server check failed:', err);
      setIsFlaskRunning(false);
      setError('The Flask video analysis server is not running. Please start it using the provided script.');
    }
  };

  const fetchStats = async () => {
    if (!isFlaskRunning) return;
    
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
      // Don't show error for every failed fetch
    }
  };

  const handleSampleSelect = (value: string) => {
    setSelectedSample(value);
  };

  const startAnalysis = async () => {
    if (!isFlaskRunning) {
      toast({
        title: "Server Not Running",
        description: "Please start the Flask server using ./start_simple_flask.sh",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedSample) {
      setError('Please select a sample video first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

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
      setError('Failed to start video analysis. Is the Flask server running?');
      setIsAnalyzing(false);
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
                  {error}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Video Stream</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative w-full max-w-xl border overflow-hidden rounded-md">
                    <img 
                      src={`${flaskServerUrl}/video_feed`} 
                      alt="Live Video Analysis" 
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <FiMapPin className="text-blue-500 mr-3 text-xl" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-lg">{stats.location}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center">
                        <FiUsers className="text-green-500 mr-3 text-xl" />
                        <div>
                          <p className="text-sm text-gray-500">People Count</p>
                          <p className="font-medium text-lg">{stats.people_count}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center">
                        <FiClock className="text-orange-500 mr-3 text-xl" />
                        <div>
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