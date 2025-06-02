import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FiUpload, FiVideo, FiBarChart2, FiClock, FiUsers, FiMapPin, FiImage, FiTrash2 } from 'react-icons/fi';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFootTraffic } from "@/context/FootTrafficContext";
import { StatsFs } from 'fs';

interface Stats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
}

interface YouTubeVideo {
  url: string;
  title: string;
}

interface Photo {
  name: string;
  url: string;
}

export default function VideoAnalysis() {
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlaskRunning, setIsFlaskRunning] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<{isReady: boolean, error: string | null}>({ isReady: false, error: null });
  const [streamKey, setStreamKey] = useState<number>(0);
  const [videoTimestamp, setVideoTimestamp] = useState<number>(Date.now());
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isYoutubeAnalyzing, setIsYoutubeAnalyzing] = useState<boolean>(false);
  const [isFaceRecognitionActive, setIsFaceRecognitionActive] = useState<boolean>(false);
  const [savedYoutubeVideos, setSavedYoutubeVideos] = useState<YouTubeVideo[]>(
    [
      { url: 'https://www.youtube.com/watch?v=p0Qhe4vhYLQ', title: 'Loading...' },
      { url: 'https://www.youtube.com/watch?v=TRG2EQtlmzI', title: 'Loading...' },
      { url: 'https://www.youtube.com/watch?v=y-Os52eW2rg', title: 'Loading...' },
      { url: 'https://www.youtube.com/watch?v=Sz2K42XFf1Q', title: 'Loading...' }
    ]
  );
  const [newYoutubeLink, setNewYoutubeLink] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Add a function to stop the stream
  const stopStream = async () => {
    try {
      await fetch(`${flaskServerUrl}/stop_stream`, {
        method: 'POST'
      });
      
      setIsAnalyzing(false);
      setIsYoutubeAnalyzing(false);
      setStreamStatus({ isReady: false, error: null });
      setStats(ensureStatsConsistency({
        people_count: 0,
        avg_dwell_time: 0,
        highest_dwell_time: 0,
        location: selectedSample ? (selectedSample === 'school' ? 'School Entrance' : 'Palengke Market') : 
                youtubeUrl ? (savedYoutubeVideos.find(v => v.url === youtubeUrl)?.title || 'YouTube Stream') : '',
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "Stream Stopped",
        description: "Video stream has been stopped successfully."
      });
    } catch (err) {
      console.error('Error stopping stream:', err);
      toast({
        title: "Error",
        description: "Failed to stop video stream",
        variant: "destructive"
      });
    }
  };
  
  // Use the FootTrafficContext
  const { flaskServerUrl: contextFlaskUrl, updateAnalysisStats } = useFootTraffic();
  
  // Use the Replit domain with port 5003 for the Flask server
  const flaskServerUrl = contextFlaskUrl || (window.location.hostname.includes('replit') 
    ? `https://${window.location.hostname.replace('5000', '5001')}` 
    : 'http://localhost:5001');
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
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    // Check stream status every 2 seconds while analyzing
    if (isYoutubeAnalyzing) {
      const interval = setInterval(() => {
        fetchStats();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isYoutubeAnalyzing]);

  // Update the FootTrafficContext with stats whenever they change
  useEffect(() => {
    if (stats) {
      updateAnalysisStats(stats);
    }
  }, [stats, updateAnalysisStats]);

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
    if (!isFlaskRunning) {
      return; // Don't fetch stats if server is not running
    }
    
    try {
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
      if (data.success && data.stats) {
        // Ensure avg_dwell_time is 0 when people_count is 0
        if (data.stats.people_count === 0) {
          data.stats.avg_dwell_time = 0;
        }
        setStats(data.stats);
      } else {
        console.warn('Received invalid stats data format:', data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't set mock data anymore, just leave stats as is
    }
  };

  const checkStreamStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${flaskServerUrl}/api/stream-status`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to check stream status');
      }
      
      const data = await response.json();
      setStreamStatus({
        isReady: data.isReady,
        error: data.error
      });
      
      return data.isReady;
    } catch (err) {
      console.error('Error checking stream status:', err);
      setStreamStatus({
        isReady: false,
        error: 'Failed to check stream status'
      });
      return false;
    }
  };

  const handleSampleSelect = async (value: string) => {
    // Stop current analysis if running
    if (isAnalyzing) {
      setIsAnalyzing(false);
      setStreamStatus({ isReady: false, error: null });
      
      try {
        // Call the backend to stop current stream
        await fetch(`${flaskServerUrl}/stop_stream`, {
          method: 'POST'
        });
      } catch (err) {
        console.error('Error stopping stream:', err);
      }
    }
    
    setSelectedSample(value);
    // Reset youtubeUrl to ensure we know we're in sample video mode
    setYoutubeUrl('');
    // Reset stats completely when changing video source
    setStats(ensureStatsConsistency({
      people_count: 0,
      avg_dwell_time: 0,
      highest_dwell_time: 0,
      location: value === 'school' ? 'School Entrance' : 'Palengke Market',
      timestamp: new Date().toISOString()
    }));
    setVideoTimestamp(Date.now()); // Update timestamp to force stream refresh
    setStreamKey(prev => prev + 1);
  };

  // Add a utility function to ensure stats consistency
  const ensureStatsConsistency = (stats: Stats): Stats => {
    // Make a copy of the stats object
    const updatedStats = { ...stats };
    
    // If people_count is 0, ensure avg_dwell_time is also 0
    if (updatedStats.people_count === 0) {
      updatedStats.avg_dwell_time = 0;
      updatedStats.highest_dwell_time = 0;
    }
    
    return updatedStats;
  };

  const startAnalysis = async () => {    
    if (!selectedSample) {
      setError('Please select a sample video first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStreamStatus({ isReady: false, error: null });
    
    // Reset stats completely when starting new analysis
    setStats(ensureStatsConsistency({
      people_count: 0,
      avg_dwell_time: 0,
      highest_dwell_time: 0,
      location: selectedSample === 'school' ? 'School Entrance' : 'Palengke Market',
      timestamp: new Date().toISOString()
    }));
    
    setVideoTimestamp(Date.now()); // Update timestamp to force stream refresh
    setStreamKey(prev => prev + 1);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video analysis');
      }
      
      const data = await response.json();
      
      // Update location from response
      setStats(prevStats => {
        const baseStats ={
          people_count: 0,
          avg_dwell_time: 0,
          highest_dwell_time: 0,
          timestamp: ""
        };
        
        return ensureStatsConsistency({
          ...baseStats,
          location: data.location
        });
      });
      
      // Wait for stream to be ready
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries) {
        const isReady = await checkStreamStatus();
        if (isReady) {
          // Start fetching stats
          fetchStats();
          toast({
            title: "Analysis Started",
            description: `Now analyzing ${selectedSample} video`,
          });
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      throw new Error('Video stream failed to initialize');
      
    } catch (err) {
      console.error('Error starting analysis:', err);

      // Type guard for Error objects
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to start video analysis';

      setError(errorMessage);
      setIsAnalyzing(false);
    }
  };

  const startYoutubeAnalysis = async () => {
    if (!youtubeUrl) {
      setError('Please enter a YouTube live stream URL');
      return;
    }

    setIsYoutubeAnalyzing(true);
    setError(null);
    setStreamStatus({ isReady: false, error: null });
    
    // Reset stats completely when starting new analysis
    setStats(ensureStatsConsistency({
      people_count: 0,
      avg_dwell_time: 0,
      highest_dwell_time: 0,
      location: savedYoutubeVideos.find(v => v.url === youtubeUrl)?.title || 'YouTube Stream',
      timestamp: new Date().toISOString()
    }));
    
    setVideoTimestamp(Date.now());
    setStreamKey(prev => prev + 1);

    try {
      const response = await fetch(`${flaskServerUrl}/process_youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start YouTube stream analysis');
      }

      toast({
        title: "Initializing Stream",
        description: "Please wait while we connect to the YouTube stream...",
      });

      // Initial stream check
      const initialStatus = await checkStreamStatus();
      if (initialStatus.isReady) {
        fetchStats();
        toast({
          title: "Analysis Started",
          description: "Now analyzing YouTube stream",
        });
        return;
      }

      // Start continuous status checking
      let retries = 0;
      const maxRetries = 30; // Increased retry limit
      const retryDelay = 2000;
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await checkStreamStatus();
          retries++;

          if (status.isReady) {
            clearInterval(statusCheckInterval);
            fetchStats();
            toast({
              title: "Analysis Started",
              description: "Now analyzing YouTube stream",
            });
            return;
          }

          if (status.error) {
            clearInterval(statusCheckInterval);
            throw new Error(status.error);
          }

        } catch (err) {
          clearInterval(statusCheckInterval);
          throw err;
        }
      }, retryDelay);

    } catch (err) {
      console.error('Error starting YouTube analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start YouTube stream analysis';
      setError(errorMessage);
      setIsYoutubeAnalyzing(false);
      setStreamStatus(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      toast({
        title: "Stream Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Add automatic stream recovery on error
  const handleVideoError = () => {
    console.log('Video stream error detected, attempting recovery...');
    
    // Update stream status
    setStreamStatus(prev => ({
      ...prev,
      error: 'Stream connection interrupted'
    }));

    // Attempt to recover the stream
    const recoverStream = async () => {
      try {
        const status = await checkStreamStatus();
        if (status.isReady) {
          // Reset error state and refresh stream
          setStreamStatus({ isReady: true, error: null });
          setVideoTimestamp(Date.now());
          setStreamKey(prev => prev + 1);
        } else {
          // If recovery failed, show error
          toast({
            title: "Stream Error",
            description: "Failed to recover stream connection. Retrying...",
            variant: "destructive",
          });
          
          // Try again after a delay
          setTimeout(recoverStream, 5000);
        }
      } catch (err) {
        console.error('Error recovering stream:', err);
      }
    };

    // Start recovery process
    recoverStream();
  };

  const fetchVideoTitle = async (url: string) => {
    try {
      const response = await fetch(`${flaskServerUrl}/process_youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          fetchTitleOnly: true 
        }),
      });

      const data = await response.json();
      if (response.ok && data.title) {
        return data.title;
      }
      return 'Unable to load title';
    } catch (err) {
      console.error('Error fetching video title:', err);
      return 'Unable to load title';
    }
  };

  // Load video titles on component mount
  useEffect(() => {
    const loadTitles = async () => {
      const updatedVideos = await Promise.all(
        savedYoutubeVideos.map(async (video) => ({
          ...video,
          title: await fetchVideoTitle(video.url)
        }))
      );
      setSavedYoutubeVideos(updatedVideos);
    };
    loadTitles();
  }, []);

  const handleAddYoutubeLink = async () => {
    if (newYoutubeLink && !savedYoutubeVideos.some(v => v.url === newYoutubeLink)) {
      const title = await fetchVideoTitle(newYoutubeLink);
      setSavedYoutubeVideos([...savedYoutubeVideos, { url: newYoutubeLink, title }]);
      setNewYoutubeLink('');
    }
  };

  const handleYoutubeLinkSelect = async (value: string) => {
    // Stop current analysis if running
    if (isYoutubeAnalyzing) {
      setIsYoutubeAnalyzing(false);
      setStreamStatus({ isReady: false, error: null });
      
      try {
        // Call the backend to stop current stream
        await fetch(`${flaskServerUrl}/stop_stream`, {
          method: 'POST'
        });
      } catch (err) {
        console.error('Error stopping stream:', err);
      }
    }
    
    setYoutubeUrl(value);
    // Reset selectedSample to ensure we know we're in YouTube mode
    setSelectedSample('');
    // Reset stats completely when changing video source
    setStats(ensureStatsConsistency({
      people_count: 0,
      avg_dwell_time: 0,
      highest_dwell_time: 0,
      location: savedYoutubeVideos.find(v => v.url === value)?.title || 'YouTube Stream',
      timestamp: new Date().toISOString()
    }));
    setVideoTimestamp(Date.now());
    setStreamKey(prev => prev + 1);
  };

  const toggleFaceRecognition = async () => {
    try {
      const response = await fetch(`${flaskServerUrl}/toggle_face_recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !isFaceRecognitionActive }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsFaceRecognitionActive(data.active);
        toast({
          title: data.message,
          description: data.active ? "Face recognition is now active" : "Face recognition is now inactive",
        });
      } else {
        throw new Error(data.error || 'Failed to toggle face recognition');
      }
    } catch (err) {
      console.error('Error toggling face recognition:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle face recognition",
        variant: "destructive",
      });
    }
  };

  // Add cleanup for face recognition when component unmounts or tab changes
  useEffect(() => {
    return () => {
      if (isFaceRecognitionActive) {
        toggleFaceRecognition();
      }
    };
  }, []);

  // Add cleanup when switching tabs
  useEffect(() => {
    if (isFaceRecognitionActive) {
      toggleFaceRecognition();
    }
  }, [selectedSample, youtubeUrl]);

  // Load existing photos on component mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await fetch(`${flaskServerUrl}/api/photos`);
      if (!response.ok) throw new Error('Failed to load photos');
      const data = await response.json();
      setPhotos(data.photos.map((photo: Photo) => ({
        ...photo,
        url: `${flaskServerUrl}/api/photos/${photo.name}?t=${Date.now()}`
      })));
    } catch (err) {
      console.error('Error loading photos:', err);
      setUploadStatus({
        type: 'error',
        message: 'Failed to load photos'
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    try {
      setUploadStatus({
        type: 'success',
        message: 'Uploading photos...'
      });

      const response = await fetch(`${flaskServerUrl}/api/upload_photos`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload photos');

      const result = await response.json();
      setUploadStatus({
        type: 'success',
        message: 'Photos uploaded successfully!'
      });

      // Refresh the photos list
      loadPhotos();

      toast({
        title: "Success",
        description: "Photos uploaded successfully",
      });
    } catch (err) {
      console.error('Error uploading photos:', err);
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload photos'
      });
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photoName: string) => {
    try {
      const response = await fetch(`${flaskServerUrl}/api/delete_photo/${photoName}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete photo');

      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.name !== photoName));
      setUploadStatus({
        type: 'success',
        message: 'Photo deleted successfully!'
      });
      
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting photo:', err);
      setUploadStatus({
        type: 'error',
        message: 'Failed to delete photo'
      });
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Video Analysis</h1>
      
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analyze">Sample Videos</TabsTrigger>
          <TabsTrigger value="youtube">YouTube Live</TabsTrigger>
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="photos">Family Photos</TabsTrigger>
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
                    <SelectItem value='friends'> Friends Group</SelectItem>
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
                className="w-full mb-2"
              >
                <FiBarChart2 className="mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>

              {isAnalyzing && (
                <Button 
                  onClick={toggleFaceRecognition}
                  variant={isFaceRecognitionActive ? "destructive" : "outline"}
                  className="w-full"
                >
                  {isFaceRecognitionActive ? 'Stop Face Detection' : 'Start Face Detection'}
                </Button>
              )}
            </CardContent>
          </Card>
          
          {isAnalyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Live Video Stream</CardTitle>
                </CardHeader>                <CardContent className="flex justify-center flex-1">
                  <div className="relative w-full max-w-xl border overflow-hidden rounded-md">
                    {isFlaskRunning && streamStatus.isReady ? (
                      <div className="relative">
                        <img 
                          key={streamKey}
                          src={`${flaskServerUrl}/video_feed?t=${videoTimestamp}`}
                          alt="Live Video Analysis"
                          className="w-full h-auto"
                          onError={() => {
                            setStreamStatus(prev => ({
                              ...prev,
                              error: 'Failed to load video stream'
                            }));
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={async () => {
                              stopStream();
                            }}
                          >
                            Stop Stream
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 text-center h-64 flex flex-col items-center justify-center">
                        <FiVideo className="text-5xl text-gray-400 mb-4" />
                        {streamStatus.error ? (
                          <>
                            <p className="text-red-500 mb-2">Error: {streamStatus.error}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-500 mb-2">Initializing video stream...</p>
                            <p className="text-sm text-gray-400">Please wait</p>
                          </>
                        )}
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
                          <p className="text-sm text-gray-500">Video Title</p>
                          <p className="font-medium text-lg truncate">
                            {youtubeUrl 
                              ? savedYoutubeVideos.find(v => v.url === youtubeUrl)?.title || 'YouTube Stream'
                              : selectedSample === 'school' ? 'School Entrance' : 'Palengke Market'}
                          </p>
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
                      
                      <div className="flex flex-wrap items-center">
                        <FiClock className="text-purple-500 mr-3 text-xl flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-500">Highest Dwell Time</p>
                          <p className="font-medium text-lg">{stats.highest_dwell_time} seconds</p>
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
        
        <TabsContent value="youtube" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiVideo className="mr-2" />
                YouTube Live Stream Analysis
              </CardTitle>
              <CardDescription>
                Analyze foot traffic from a YouTube live stream
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Live Stream URL
                </label>
                <input
                  type="url"
                  id="youtube-url"
                  className="w-full p-2 border rounded-md"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="saved-links" className="block text-sm font-medium text-gray-700 mb-1">
                  Saved YouTube Links
                </label>
                <Select onValueChange={handleYoutubeLinkSelect} value={youtubeUrl}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved YouTube video" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedYoutubeVideos.map((video) => (
                      <SelectItem key={video.url} value={video.url}>
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  type="url"
                  className="flex-1 p-2 border rounded-md"
                  placeholder="Add new YouTube link"
                  value={newYoutubeLink}
                  onChange={(e) => setNewYoutubeLink(e.target.value)}
                />
                <Button onClick={handleAddYoutubeLink} variant="outline">
                  Add
                </Button>
              </div>

              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                  {error}
                </div>
              )}

              <Button 
                onClick={startYoutubeAnalysis} 
                disabled={!youtubeUrl || isYoutubeAnalyzing}
                className="w-full mb-2"
              >
                <FiBarChart2 className="mr-2" />
                {isYoutubeAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>

              {isYoutubeAnalyzing && (
                <Button 
                  onClick={toggleFaceRecognition}
                  variant={isFaceRecognitionActive ? "destructive" : "outline"}
                  className="w-full"
                >
                  {isFaceRecognitionActive ? 'Stop Face Detection' : 'Start Face Detection'}
                </Button>
              )}
            </CardContent>
          </Card>

          {isYoutubeAnalyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Live Video Stream</CardTitle>
                </CardHeader>                <CardContent className="flex justify-center flex-1">
                  <div className="relative w-full max-w-xl border overflow-hidden rounded-md">
                    {isFlaskRunning && streamStatus.isReady ? (
                      <div className="relative">
                        <img 
                          key={streamKey}
                          src={`${flaskServerUrl}/video_feed?t=${videoTimestamp}`}
                          alt="Live Video Analysis"
                          className="w-full h-auto"
                          onError={handleVideoError}
                        />
                        <div className="absolute top-2 right-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={async () => {
                              stopStream();
                            }}
                          >
                            Stop Stream
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 text-center h-64 flex flex-col items-center justify-center">
                        <FiVideo className="text-5xl text-gray-400 mb-4" />
                        {streamStatus.error ? (
                          <>
                            <p className="text-red-500 mb-2">Error: {streamStatus.error}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setVideoTimestamp(Date.now());
                                setStreamKey(prev => prev + 1);
                                checkStreamStatus();
                              }}
                            >
                              Retry Connection
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-500 mb-2">Initializing video stream...</p>
                            <p className="text-sm text-gray-400">Please wait</p>
                          </>
                        )}
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
                          <p className="font-medium text-lg truncate">YouTube Live Stream</p>
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
                      
                      <div className="flex flex-wrap items-center">
                        <FiClock className="text-purple-500 mr-3 text-xl flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-gray-500">Highest Dwell Time</p>
                          <p className="font-medium text-lg">{stats.highest_dwell_time} seconds</p>
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

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiImage className="mr-2" />
                Family Photos
              </CardTitle>
              <CardDescription>
                Upload and manage your family photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-md p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500');
                    if (e.dataTransfer.files.length > 0) {
                      const input = document.getElementById('photo-upload') as HTMLInputElement;
                      if (input) {
                        input.files = e.dataTransfer.files;
                        handlePhotoUpload({ target: input } as any);
                      }
                    }
                  }}
                >
                  <input
                    type="file"
                    id="photo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    multiple
                  />
                  <FiUpload className="mx-auto text-3xl mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to upload photos or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports: JPG, PNG, WEBP
                  </p>
                </div>

                {uploadStatus && (
                  <Alert variant={uploadStatus.type === 'success' ? 'default' : 'destructive'}>
                    <AlertDescription>{uploadStatus.message}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No photos uploaded yet
                    </div>
                  ) : (
                    photos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dy=".3em" fill="%23999">Error loading image</text></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePhoto(photo.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiTrash2 className="mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}