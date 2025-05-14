import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// We're now loading the heat plugin from the index.html file

// Fix for Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the global L.heatLayer function if typings don't exist
declare global {
  namespace L {
    function heatLayer(
      latlngs: Array<[number, number, number?]>, 
      options?: {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: {[key: number]: string};
      }
    ): any;
  }
}

interface MarkerInfo {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
  count: number;
}

interface MapViewProps {
  center: { lat: number; lon: number };
  zoom: number;
  markers: MarkerInfo[];
  zoneInfo: string;
}

const MapView: React.FC<MapViewProps> = ({ center, zoom, markers, zoneInfo }) => {
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  
  // Manila, Philippines coordinates (default)
  const manilaCoordinates = useMemo(() => {
    return { lat: 14.5995, lng: 120.9842 };
  }, []);
  
  // Calculate max count for styling
  const maxCount = useMemo(() => {
    return Math.max(...markers.map(m => m.count), 1);
  }, [markers]);
  
  // Get heatmap points from markers
  const heatmapPoints = useMemo(() => {
    console.log("Creating heatmap points from markers:", markers.length);
    return markers.map(marker => {
      // Each point is [lat, lng, intensity]
      const intensity = marker.count / maxCount; // Normalize intensity
      return [
        marker.lat, 
        marker.lon, 
        intensity * 0.8 // Scale down slightly to avoid overly intense colors
      ] as [number, number, number];
    });
  }, [markers, maxCount]);
  
  // Initialize map - making sure to use componentDidMount behavior
  useEffect(() => {
    // Only run this once when the component mounts
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Create map after a slight delay to ensure DOM is ready
    const initMapTimer = setTimeout(() => {
      try {
        // Fix for marker icons in React
        const DefaultIcon = L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
        
        // Set this before creating any markers
        L.Marker.prototype.options.icon = DefaultIcon;
        
        // Set default center and zoom
        const mapCenter = center ? [center.lat, center.lon] : [manilaCoordinates.lat, manilaCoordinates.lng];
        const mapZoom = zoom || 11;
        
        // Create map instance
        const map = L.map(mapContainerRef.current!, {
          center: mapCenter as L.LatLngExpression,
          zoom: mapZoom,
          zoomControl: true,
          attributionControl: true
        });
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add Manila marker
        L.marker([manilaCoordinates.lat, manilaCoordinates.lng])
          .bindPopup('<b>Manila, Philippines</b>')
          .addTo(map);
        
        // Wait for map to be ready (important!)
        map.whenReady(() => {
          // Store map instance and set mapReady
          mapRef.current = map;
          setMapReady(true);
          console.log("Map fully initialized and ready");
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 500);  // Longer delay to ensure DOM is ready
    
    // Cleanup function
    return () => {
      clearTimeout(initMapTimer);
      
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
        setIsHeatmapActive(false);
      }
    };
  }, []); // Empty dependency array means it only runs once on mount
  
  // Create/update heatmap layer when data changes or map becomes ready
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (heatmapPoints.length === 0) return;
    
    // Ensure we don't try to add heatmap before map is fully ready
    const heatmapTimer = setTimeout(() => {
      try {
        // Remove previous heatmap layer if it exists
        if (heatLayerRef.current) {
          mapRef.current!.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
          setIsHeatmapActive(false);
        }
        
        // Add fallback for if the heatmap plugin isn't loaded
        if (typeof L.heatLayer !== 'function') {
          console.warn("Leaflet heatmap plugin not available, using fallback circle markers");
          
          // Use circle markers as fallback
          heatmapPoints.forEach(point => {
            const [lat, lng, intensity] = point;
            const radius = 10 + ((intensity || 0) * 20);
            const color = getColorForIntensity(intensity || 0);
            
            L.circleMarker([lat, lng], {
              radius: radius,
              color: 'white',
              fillColor: color,
              fillOpacity: 0.7,
              weight: 1
            }).addTo(mapRef.current!);
          });
          
          return;
        }
        
        // Create new heatmap layer with custom gradient and improved settings for smoother appearance
        const heat = L.heatLayer(heatmapPoints, {
          radius: 35,              // Larger radius creates a more continuous effect
          blur: 30,                // Higher blur makes a smoother gradient
          maxZoom: 17,             // Allow heatmap to remain visible at higher zoom levels
          max: 1.0,                // Maximum intensity
          minOpacity: 0.4,         // Keep a minimum opacity for better visibility
          gradient: {              // Refined gradient to match the example image
            0.0: 'rgba(0, 0, 255, 0.5)',  // Transparent blue for low values
            0.2: 'rgba(0, 255, 255, 0.6)', // Cyan
            0.4: 'rgba(0, 255, 0, 0.7)',   // Lime green
            0.6: 'rgba(255, 255, 0, 0.8)', // Yellow
            0.8: 'rgba(255, 128, 0, 0.9)', // Orange
            1.0: 'rgba(255, 0, 0, 1.0)'    // Solid red for highest values
          }
        });
        
        // Add the heatmap layer to the map
        heat.addTo(mapRef.current);
        heatLayerRef.current = heat;
        setIsHeatmapActive(true);
        console.log("Heatmap added to map successfully");
      } catch (error) {
        console.error("Error creating heatmap:", error);
      }
    }, 800); // Give the map extra time to fully initialize
    
    return () => {
      clearTimeout(heatmapTimer);
    };
  }, [heatmapPoints, mapReady]);
  
  // Helper function to get color based on intensity
  const getColorForIntensity = (intensity: number): string => {
    if (intensity > 0.8) return '#ff0000'; // red
    if (intensity > 0.6) return '#ff9a00'; // orange
    if (intensity > 0.4) return '#ffff00'; // yellow
    if (intensity > 0.2) return '#00ff00'; // green
    return '#0000ff'; // blue
  };
  
  // Helper function to find closest marker to clicked position
  interface MarkerResult {
    marker: MarkerInfo;
    distance: number;
  }
  
  const findClosestMarker = (latlng: L.LatLng): MarkerResult | null => {
    if (!markers || markers.length === 0) return null;
    
    let closestMarker: MarkerInfo | null = null;
    let closestDistance = Infinity;
    
    markers.forEach(marker => {
      const distance = Math.sqrt(
        Math.pow(marker.lat - latlng.lat, 2) + 
        Math.pow(marker.lon - latlng.lng, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMarker = marker;
      }
    });
    
    return closestMarker ? { marker: closestMarker, distance: closestDistance } : null;
  };
  
  // Add click handler for showing popups - do this only once map is ready
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    // Add click listeners to show location info
    const clickHandler = (e: L.LeafletMouseEvent) => {
      const result = findClosestMarker(e.latlng);
      if (result && result.distance < 0.01) {
        L.popup()
          .setLatLng([result.marker.lat, result.marker.lon])
          .setContent(`
            <div class="p-1">
              <h3 class="font-bold">${result.marker.name}</h3>
              <p>Traffic count: ${result.marker.count}</p>
            </div>
          `)
          .openOn(mapRef.current!);
      }
    };
    
    mapRef.current.on('click', clickHandler);
    
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', clickHandler);
      }
    };
  }, [mapReady, markers]);
  
  // Update map view if center or zoom props change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const targetCenter = center ? [center.lat, center.lon] : [manilaCoordinates.lat, manilaCoordinates.lng];
    const targetZoom = zoom || 11;
    
    mapRef.current.setView(targetCenter as L.LatLngExpression, targetZoom);
  }, [center, zoom, manilaCoordinates, mapReady]);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">location_on</span>
          Manila Foot Traffic Heatmap
          {mapReady ? (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
          ) : (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Loading</span>
          )}
          {isHeatmapActive && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Heatmap Active</span>
          )}
        </h2>
        
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
          {/* Zone info overlay */}
          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 text-sm font-medium z-[1000] shadow-sm border border-gray-200">
            <div className="flex items-center">
              <span className="material-icons text-primary text-sm mr-1">location_on</span>
              {zoneInfo || 'Manila'} Area
            </div>
          </div>
          
          {/* Map container */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-[600px]"
            id="map-container"
          />
        </div>
        
        {/* Heat scale legend - updated to match new gradient */}
        <div className="flex justify-center items-center mt-2 mb-3">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">Low</span>
            <div className="w-40 h-4 bg-gradient-to-r from-blue-500/50 via-cyan-500/60 via-green-500/70 via-yellow-500/80 via-orange-500/90 to-red-500 rounded"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
        
        {/* Important locations */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold mb-2">Top Traffic Areas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {markers
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map(marker => (
                <div key={marker.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: marker.color, opacity: 0.9 }}
                  ></div>
                  <span className="text-sm font-medium">{marker.name}</span>
                  <span className="ml-auto text-sm font-bold">{marker.count}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
