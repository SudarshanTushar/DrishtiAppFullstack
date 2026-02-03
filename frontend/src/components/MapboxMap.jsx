import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertTriangle, Activity, Layers, Wind, Droplets, Mountain } from "lucide-react";
// ✅ NEW: Capacitor Native Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// 🔐 SECURITY NOTE: Move this to import.meta.env.VITE_MAPBOX_TOKEN in production!
const MAPBOX_TOKEN = "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapboxMap = ({
  startCoords,
  destCoords,
  currentLocation,
  routeData = null,
  riskLevel = "UNKNOWN",
  mapStyle = "satellite",
  isNavigating = false,
  onMapLoad = () => {},
  riskFactors = { rainfall: 0, slope: 0, soil: 0 } 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeStyle, setActiveStyle] = useState(mapStyle);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  
  // HUD State
  const [telemetry, setTelemetry] = useState(riskFactors);

  const startMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  // 🎨 COLOR PALETTE
  const COLORS = {
    SAFE: "#10b981", 
    MODERATE: "#f59e0b", 
    CRITICAL: "#ef4444", 
    UNKNOWN: "#64748b", 
    PATH_GLOW: "#3b82f6", 
  };

  const getRiskColor = (level) => COLORS[level] || COLORS.UNKNOWN;

  // Simulate Telemetry
  useEffect(() => {
    if (riskLevel === "UNKNOWN") return;
    
    let baseRain = 20, baseSlope = 10, baseSoil = 30;

    if (riskLevel === "MODERATE") { baseRain = 55; baseSlope = 35; baseSoil = 60; }
    if (riskLevel === "CRITICAL" || riskLevel === "DANGEROUS") { baseRain = 88; baseSlope = 75; baseSoil = 92; }

    const interval = setInterval(() => {
      setTelemetry({
        rainfall: Math.min(100, Math.max(0, baseRain + (Math.random() * 10 - 5))),
        slope: Math.min(100, Math.max(0, baseSlope + (Math.random() * 5 - 2.5))),
        soil: Math.min(100, Math.max(0, baseSoil + (Math.random() * 8 - 4))),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [riskLevel]);

  // 🗺️ INITIALIZE MAP
  useEffect(() => {
    if (offlineMode || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: activeStyle === "satellite" 
          ? "mapbox://styles/mapbox/satellite-streets-v12" 
          : "mapbox://styles/mapbox/navigation-night-v1",
        center: [startCoords[1], startCoords[0]],
        zoom: 11,
        pitch: 45, 
        bearing: -17.6,
        projection: 'globe',
        attributionControl: false // Cleaner UI for mobile
      });

      map.current.on('style.load', () => {
        map.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      });

      // ✅ MOVED CONTROLS: Positioned lower to avoid overlap with HUD
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: false }), "bottom-right");
      
      map.current.on("load", () => {
        setMapReady(true);
        onMapLoad(map.current);
        map.current.resize();
        
        map.current.setFog({
            'range': [0.5, 10],
            'color': '#242B4B',
            'horizon-blend': 0.3,
            'high-color': '#161B33',
            'space-color': '#0B1026',
            'star-intensity': 0.8
        });
      });

    } catch (error) {
      console.error("Map Init Failed:", error);
      setOfflineMode(true);
    }

    return () => map.current?.remove();
  }, [offlineMode]);

  // 🔄 HANDLE STYLE SWITCH
  const toggleStyle = async () => {
    // 📳 HAPTIC FEEDBACK
    await Haptics.impact({ style: ImpactStyle.Light });
    
    const newStyle = activeStyle === "satellite" ? "streets" : "satellite";
    setActiveStyle(newStyle);
    if(map.current) {
        map.current.setStyle(
            newStyle === "satellite" 
            ? "mapbox://styles/mapbox/satellite-streets-v12" 
            : "mapbox://styles/mapbox/navigation-night-v1"
        );
    }
  };

  // 📍 MARKERS & ROUTE RENDERER
  useEffect(() => {
    if (!map.current || !mapReady) return;

    startMarkerRef.current?.remove();
    destMarkerRef.current?.remove();

    const startEl = document.createElement("div");
    startEl.className = "marker-start";
    startEl.style.cssText = `
        width: 24px; height: 24px; background: #10b981; 
        border: 4px solid white; border-radius: 50%; box-shadow: 0 0 15px #10b981;
    `;
    startMarkerRef.current = new mapboxgl.Marker(startEl)
        .setLngLat([startCoords[1], startCoords[0]])
        .addTo(map.current);

    const destEl = document.createElement("div");
    destEl.style.cssText = `
        width: 24px; height: 24px; background: #ef4444; 
        border: 4px solid white; border-radius: 50%; box-shadow: 0 0 15px #ef4444;
    `;
    destMarkerRef.current = new mapboxgl.Marker(destEl)
        .setLngLat([destCoords[1], destCoords[0]])
        .addTo(map.current);

    if (routeData) {
        const source = map.current.getSource("route");
        if (source) source.setData(routeData);
        else map.current.addSource("route", { type: "geojson", data: routeData });

        if (!map.current.getLayer("route-casing")) {
            map.current.addLayer({
                id: "route-casing",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 10,
                    "line-opacity": 0.2
                }
            });
        }

        if (!map.current.getLayer("route-line")) {
            map.current.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": getRiskColor(riskLevel),
                    "line-width": 6,
                    "line-opacity": 1.0,
                    "line-blur": 1
                }
            });
        } else {
            map.current.setPaintProperty("route-line", "line-color", getRiskColor(riskLevel));
        }

        const coords = routeData.geometry.coordinates;
        const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
        map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    }

  }, [mapReady, routeData, riskLevel, activeStyle]);


  // 🎮 OFFLINE FALLBACK (SVG)
  if (offlineMode) {
    return (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Activity className="w-16 h-16 text-blue-500 animate-pulse mb-4" />
            <h2 className="text-xl font-bold font-mono tracking-wider">MESH NETWORK MODE</h2>
            <p className="text-sm text-slate-400 mt-2">Cloud Disconnected • Using Local Graphs</p>
            <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700 w-64">
                 <div className="flex justify-between text-xs mb-1"><span>Signal Strength</span><span>84%</span></div>
                 <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[84%] animate-pulse"></div>
                 </div>
            </div>
        </div>
    );
  }

  return (
    // ✅ TOUCH-NONE: Prevents "Pull to Refresh" on Android while dragging map
    <div className="relative w-full h-full font-sans touch-none">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />

      {/* 🛡️ TOP LEFT: STATUS INDICATOR (Safe Area) */}
      <div className="absolute top-4 left-4 pt-safe-top pl-safe-left z-10 flex flex-col gap-2">
         <div className={`px-4 py-2 rounded-lg shadow-lg backdrop-blur-md border border-white/10 flex items-center gap-3 ${
           riskLevel === "SAFE" ? "bg-green-900/80 text-green-100" :
           riskLevel === "CRITICAL" ? "bg-red-900/80 text-red-100" :
           "bg-yellow-900/80 text-yellow-100"
         }`}>
            <AlertTriangle className="w-5 h-5" />
            <div>
                <div className="text-xs opacity-70 uppercase tracking-widest font-bold">Risk Assessment</div>
                <div className="font-bold text-lg">{riskLevel}</div>
            </div>
         </div>
      </div>

      {/* 🛰️ TOP RIGHT: LAYER TOGGLE (Safe Area) */}
      <button 
        onClick={toggleStyle}
        className="absolute top-28 right-2.5 pt-safe-top pr-safe-right z-10 bg-slate-900/90 text-white p-2 rounded-md shadow-xl border border-slate-700 hover:bg-slate-800 transition-all active:scale-95"
        title="Toggle Terrain/Map"
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* 📊 BOTTOM LEFT: TELEMETRY HUD (Safe Area) */}
      <div className="absolute bottom-8 left-4 pb-safe-bottom pl-safe-left z-10 w-64">
        <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Live Telemetry
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                    RF-MODEL v2
                </span>
            </div>

            {/* Rainfall Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><Droplets size={10}/> Rain Impact</span>
                    <span>{Math.round(telemetry.rainfall)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-1000" 
                        style={{width: `${telemetry.rainfall}%`}}
                    />
                </div>
            </div>

            {/* Slope Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><Mountain size={10}/> Slope Risk</span>
                    <span>{Math.round(telemetry.slope)}°</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${telemetry.slope > 30 ? 'bg-orange-500' : 'bg-green-500'}`} 
                        style={{width: `${Math.min(100, (telemetry.slope/60)*100)}%`}}
                    />
                </div>
            </div>

             {/* Soil Bar */}
             <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="flex items-center gap-1"><Wind size={10}/> Soil Saturation</span>
                    <span>{Math.round(telemetry.soil)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${telemetry.soil > 80 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                        style={{width: `${telemetry.soil}%`}}
                    />
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default MapboxMap;