import React from 'react';

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
  // Manila map SVG
  const manilaMapSvg = `
  <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <!-- Base map of Manila -->
    <rect x="0" y="0" width="800" height="600" fill="#E6EEF8" />
    
    <!-- Pasig River -->
    <path d="M50,300 C150,280 250,320 350,290 C450,260 550,300 650,280 C750,260 800,270 800,270" 
          stroke="#4A90E2" stroke-width="20" fill="none" />
    
    <!-- Manila Bay -->
    <path d="M0,400 Q400,500 800,400 L800,600 L0,600 Z" fill="#A4D4FF" />
    
    <!-- Districts - Simplified representations -->
    <circle cx="250" cy="200" r="60" fill="#D8E8C8" stroke="#71A63C" stroke-width="2" />
    <text x="250" y="200" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Intramuros</text>
    
    <circle cx="350" cy="150" r="45" fill="#F8E8C8" stroke="#DFA53A" stroke-width="2" />
    <text x="350" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Binondo</text>
    
    <circle cx="450" cy="200" r="70" fill="#FFD8D8" stroke="#E57373" stroke-width="2" />
    <text x="450" y="200" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Quiapo</text>
    
    <circle cx="550" cy="250" r="50" fill="#E1D5F5" stroke="#9575CD" stroke-width="2" />
    <text x="550" y="250" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Malate</text>
    
    <circle cx="150" cy="250" r="40" fill="#D1F5F5" stroke="#4DB6AC" stroke-width="2" />
    <text x="150" y="250" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Tondo</text>
    
    <!-- Roads -->
    <line x1="100" y1="100" x2="700" y2="100" stroke="#999" stroke-width="8" />
    <line x1="100" y1="200" x2="700" y2="200" stroke="#999" stroke-width="6" />
    <line x1="100" y1="300" x2="700" y2="300" stroke="#999" stroke-width="6" />
    <line x1="200" y1="50" x2="200" y2="350" stroke="#999" stroke-width="6" />
    <line x1="400" y1="50" x2="400" y2="350" stroke="#999" stroke-width="8" />
    <line x1="600" y1="50" x2="600" y2="350" stroke="#999" stroke-width="6" />
    
    <!-- Points of interest markers for the provided markers -->
    ${markers.map((marker, index) => {
      // Calculate position based on index
      const x = 150 + (index * 150) % 600;
      const y = 150 + Math.floor(index / 4) * 100;
      return `
        <circle cx="${x}" cy="${y}" r="15" fill="${marker.color}" opacity="0.8" />
        <text x="${x}" y="${y + 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="white">${marker.count}</text>
      `;
    }).join('')}
    
    <!-- Compass -->
    <circle cx="50" cy="50" r="30" fill="white" stroke="#333" stroke-width="1" />
    <text x="50" y="40" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">N</text>
    <line x1="50" y1="50" x2="50" y2="30" stroke="#333" stroke-width="2" />
    <line x1="50" y1="50" x2="60" y2="60" stroke="#333" stroke-width="1" />
    <line x1="50" y1="50" x2="40" y2="60" stroke="#333" stroke-width="1" />
    
    <!-- Title -->
    <text x="400" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#333">Manila City Map</text>
  </svg>
  `;

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
          <div 
            style={{ width: '100%', height: '450px' }}
            dangerouslySetInnerHTML={{ __html: manilaMapSvg }}
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
