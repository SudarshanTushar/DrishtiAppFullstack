import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 🚨 CRITICAL: This ensures assets load correctly on Android (Relative paths)
  // If you remove this, the app will be a WHITE SCREEN on the phone.
  base: './',

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 🗺️ MAP ENGINE FIXES (Crucial for Mapbox/Leaflet/React-Map-GL)
  // Prevents "ReferenceError: global is not defined" or blank maps.
  optimizeDeps: {
    include: ['mapbox-gl', 'react-map-gl'],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true, // Keeps error logs readable when debugging on phone
    minify: false,   // ⚠️ SAFETY: Disables aggressive minification to prevent random crashes during demo
    commonjsOptions: {
      transformMixedEsModules: true, // ⚠️ CRITICAL: Needed for Map libraries to load properly
    },
  },

  server: {
    port: 5173,
    host: true, // ✅ Allows you to open the app on your phone via WiFi (e.g., http://192.168.1.5:5173)
  }
});