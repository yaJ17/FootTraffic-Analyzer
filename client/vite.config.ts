import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'leaflet': 'leaflet/dist/leaflet-src.esm.js',
      'leaflet.heat': 'leaflet.heat/dist/leaflet-heat.js'
    }
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet.heat']
  }
}); 