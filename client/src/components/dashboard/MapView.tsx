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
      size: 15,
      color: marker.color
    },
    text: `${marker.name}<br>Foot Traffic: ${marker.count}`,
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
      style: 'open-street-map'
    },
    margin: { r: 0, t: 0, l: 0, b: 0 },
    height: 300
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <div className="relative w-full rounded-lg overflow-hidden">
          <div className="absolute top-2 left-2 bg-white rounded px-2 py-1 text-xs font-medium z-10">
            {zoneInfo}
          </div>
          <Plot
            data={mapData}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapView;
