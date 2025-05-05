import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface YouTubeStreamStats {
  location: string;
  people_count: number;
  avg_dwell_time: number;
  timestamp: string;
}

const YouTubeStreamPanel: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/watch?v=Ku62ggXQPHE");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState<YouTubeStreamStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to start YouTube streaming
  const startYouTubeStream = async () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5002/api/process_youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsStreaming(true);
        toast({
          title: "YouTube Stream Started",
          description: `Now analyzing: ${data.location}`,
        });
      } else {
        setError(data.error || "Failed to start YouTube stream");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to start YouTube stream",
        });
      }
    } catch (err) {
      setError("Error connecting to streaming server");
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Couldn't connect to the YouTube streaming server. Make sure it's running on port 5002.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch stats periodically when streaming
  useEffect(() => {
    if (!isStreaming) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats(); // Initial fetch
    const interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>YouTube Stream Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isProcessing || isStreaming}
            />
            <Button 
              onClick={startYouTubeStream} 
              disabled={isProcessing || isStreaming}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Processing..." : "Analyze"}
            </Button>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {isStreaming && (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <img 
                  src="http://localhost:5002/video_feed" 
                  alt="YouTube Stream Analysis" 
                  className="w-full" 
                />
              </div>
              
              {stats && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-medium">{stats.location}</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <div className="text-sm text-gray-500">People Count</div>
                    <div className="font-medium">{stats.people_count}</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Avg Dwell Time</div>
                    <div className="font-medium">{stats.avg_dwell_time.toFixed(1)}s</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="font-medium">{stats.timestamp}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        For best results, use videos with clear pedestrian traffic.
      </CardFooter>
    </Card>
  );
};

export default YouTubeStreamPanel;