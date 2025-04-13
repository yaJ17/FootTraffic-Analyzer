import React from 'react';
import Plot from 'react-plotly.js';

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
  // Prepare data for Plotly scatter map
  const mapData = markers.map(marker => ({
    type: 'scattermapbox',
    lat: [marker.lat],
    lon: [marker.lon],
    mode: 'markers',
    marker: {
      size: Math.max(15, Math.min(30, marker.count / 30)),
      color: marker.color
    },
    text: `<b>${marker.name}</b><br>Foot Traffic: ${marker.count}<br>Point of Interest`,
    hoverinfo: 'text',
    name: marker.name
  }));

  const layout = {
    autosize: true,
    hovermode: 'closest',
    mapbox: {
      center: {
        lat: center.lat,
        lon: center.lon
      },
      zoom: zoom,
      style: 'mapbox://styles/mapbox/streets-v12', // Higher resolution map style
      accesstoken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNrZXE1bG1vYjB4dGcydG8zNmNoYzZhZjkifQ.zGwXK5a_5exw2j8A8vJNXA' // Updated public token
    },
    margin: { r: 0, t: 0, l: 0, b: 0 },
    height: 450 // Increased height for better visibility
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    scrollZoom: true
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">location_on</span>
          Traffic Locations
        </h2>
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
          <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 text-sm font-medium z-10 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <span className="material-icons text-primary text-sm mr-1">location_on</span>
              {zoneInfo}
            </div>
          </div>
          <Plot
            data={mapData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '450px' }}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          {markers.map(marker => (
            <div key={marker.id} className="flex items-center p-2 bg-gray-50 rounded">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: marker.color }}></div>
              <span className="text-sm font-medium">{marker.name}</span>
              <span className="ml-auto text-sm font-bold">{marker.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
