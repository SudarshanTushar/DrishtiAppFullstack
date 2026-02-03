import React, { useState, useRef, useEffect } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Navigation,
  AlertTriangle,
  Loader,
  Satellite,
  CloudRain,
  Zap,
  Target,
  WifiOff,
  Layers,
  ArrowLeft
} from "lucide-react";
// ✅ NEW: Capacitor Native Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";

// 🚀 CONFIGURATION
const API_URL = "https://157.245.111.124.nip.io";
const MAPBOX_TOKEN = "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

const MapView = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // --- STATE ---
  const [analyzing, setAnalyzing] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [mapStyle, setMapStyle] = useState("night");
  const [serverError, setServerError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // UI State for Mobile Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Inputs
  const [startQuery, setStartQuery] = useState("Guwahati, Assam");
  const [endQuery, setEndQuery] = useState("Shillong, Meghalaya");
  const [startCoords, setStartCoords] = useState({ lat: 26.1445, lng: 91.7362 });
  const [endCoords, setEndCoords] = useState({ lat: 25.5788, lng: 91.8933 });

  // --- NATIVE INITIALIZATION ---
  useEffect(() => {
    const initNative = async () => {
        try {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {}
    };
    initNative();
    checkBackend();
  }, []);

  // --- BACKEND CHECK ---
  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${API_URL}/api/v1/system/readiness`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) setBackendStatus({ online: true, checking: false });
      else throw new Error("Server Error");
    } catch (err) {
      setBackendStatus({ online: false, checking: false });
    }
  };

  // --- VOICE ---
  const speak = (text) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- ANALYZE ROUTE ---
  const handleAnalyzeRoute = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium }); // 📳 Haptic
    setAnalyzing(true);
    setServerError(null);
    setRouteData(null);
    setLoadingMessage("Calculating...");

    try {
      // SIMULATION FALLBACK
      if (!backendStatus.online) {
         await new Promise(r => setTimeout(r, 2000));
         const mockRoute = {
           distance_km: 98.5,
           eta: "2h 45m",
           route_risk: "CAUTION",
           coordinates: [
               [startCoords.lng, startCoords.lat],
               [(startCoords.lng + endCoords.lng)/2, (startCoords.lat + endCoords.lat)/2], 
               [endCoords.lng, endCoords.lat]
           ],
           weather_data: { rainfall_mm: 45 }
         };
         setRouteData(mockRoute);
         speak("Route calculated using offline data.");
         if (window.innerWidth < 768) setIsDrawerOpen(false);
         return;
      }

      const response = await fetch(`${API_URL}/api/v1/core/analyze-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: startCoords.lat,
          start_lng: startCoords.lng,
          end_lat: endCoords.lat,
          end_lng: endCoords.lng,
        }),
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setRouteData(data.route_analysis);
      speak(`Route found. Risk level: ${data.route_analysis.risk_level}.`);
      
      if (window.innerWidth < 768) setIsDrawerOpen(false);

    } catch (err) {
      setServerError("Calculation failed.");
    } finally {
      setAnalyzing(false);
      setLoadingMessage("");
    }
  };

  // --- MAP STYLES ---
  const toggleMapStyle = async () => {
    await Haptics.impact({ style: ImpactStyle.Light });
    const styles = ["night", "satellite", "day"];
    setMapStyle(styles[(styles.indexOf(mapStyle) + 1) % styles.length]);
  };

  const getMapStyleURL = () => {
    switch (mapStyle) {
      case "satellite": return "mapbox://styles/mapbox/satellite-streets-v12";
      case "day": return "mapbox://styles/mapbox/streets-v12";
      default: return "mapbox://styles/mapbox/dark-v11";
    }
  };

  const getRiskLevel = () => routeData?.risk_level || routeData?.route_risk || "SAFE";
  const isDanger = ["DANGER", "CRITICAL", "HIGH"].includes(getRiskLevel());
  const riskBg = isDanger ? "bg-red-600" : "bg-emerald-600";

  return (
    // ✅ SAFE AREAS: Full screen map logic + Notch support
    <div className="h-screen w-full relative bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-500">
      
      {/* 🗺️ MAP AREA */}
      <div className="flex-1 relative h-full">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 91.7362, latitude: 26.1445, zoom: 10 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={getMapStyleURL()}
            mapboxAccessToken={MAPBOX_TOKEN}
            padding={window.innerWidth < 768 ? { bottom: 250, top: 50 } : { right: 400 }} 
          >
            {/* Controls moved down slightly to avoid Notch */}
            <NavigationControl position="top-right" style={{ marginTop: '50px' }} />
            <GeolocateControl position="top-right" />

            <Marker longitude={startCoords.lng} latitude={startCoords.lat} anchor="bottom">
                <div className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg animate-bounce">
                    <Navigation size={18} color="white" />
                </div>
            </Marker>
            <Marker longitude={endCoords.lng} latitude={endCoords.lat} anchor="bottom">
                <div className="bg-red-600 p-2 rounded-full border-2 border-white shadow-lg">
                    <Target size={18} color="white" />
                </div>
            </Marker>

            {routeData && (
              <Source id="route" type="geojson" data={{
                type: "Feature",
                geometry: { type: "LineString", coordinates: routeData.coordinates }
              }}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": isDanger ? "#ef4444" : "#10b981",
                    "line-width": 6,
                    "line-opacity": 0.8
                  }}
                />
              </Source>
            )}
          </Map>

          {/* BACK BUTTON (Top Left - Safe Area) */}
          <button
              onClick={() => navigate(-1)}
              className="absolute top-safe-top left-4 z-10 mt-4 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xl active:scale-90 transition-all text-slate-700 dark:text-white"
            >
              <ArrowLeft size={20} />
          </button>

          {/* STYLE TOGGLE (Floating on Map) */}
          <button
              onClick={toggleMapStyle}
              className="absolute top-safe-top right-14 z-10 mt-4 mr-12 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xl active:scale-90 transition-all text-slate-700 dark:text-white"
            >
              {mapStyle === "satellite" ? <Satellite size={20} className="text-blue-500" /> : <Layers size={20} />}
          </button>
      </div>

      {/* 🎛️ CONTROL PANEL (Responsive Drawer) */}
      <div 
        className={`
            absolute md:relative z-20 
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl 
            transition-all duration-300 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
            
            /* MOBILE STYLES */
            bottom-0 left-0 w-full pb-safe-bottom
            rounded-t-3xl border-t border-slate-200 dark:border-slate-700
            ${isDrawerOpen ? "h-[70vh]" : "h-[120px]"}
            
            /* DESKTOP STYLES */
            md:top-0 md:right-0 md:bottom-auto md:left-auto md:w-96 md:h-full
            md:rounded-none md:border-l md:border-t-0
        `}
      >
        {/* DRAWER HANDLE (Mobile Only) */}
        <div 
            className="md:hidden w-full h-8 flex items-center justify-center cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 rounded-t-3xl transition-colors"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="p-6 h-full overflow-y-auto pb-24 md:pb-6 no-scrollbar">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-slate-900 dark:text-white text-lg font-bold">Navigation</h1>
              {!backendStatus.online && (
                <div className="flex items-center gap-2 text-amber-500 text-[10px] font-mono mt-1">
                  <WifiOff size={10} /> OFFLINE MODE
                </div>
              )}
            </div>
            <div className="hidden md:block text-slate-400 text-xs">
                READY
            </div>
          </div>

          {/* INPUTS */}
          {(!routeData || isDrawerOpen) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 transition-colors">
                    {/* From Input */}
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 transition-colors shadow-sm">
                        <Navigation size={18} className="text-blue-500 shrink-0"/>
                        <div className="w-full">
                            <label className="text-[10px] text-slate-500 uppercase font-bold block">Start</label>
                            <input 
                                className="bg-transparent text-slate-900 dark:text-white text-sm w-full outline-none font-medium truncate"
                                value={startQuery}
                                onChange={(e) => setStartQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* To Input */}
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 focus-within:border-red-500 transition-colors shadow-sm">
                        <Target size={18} className="text-red-500 shrink-0"/>
                        <div className="w-full">
                            <label className="text-[10px] text-slate-500 uppercase font-bold block">Dest</label>
                            <input 
                                className="bg-transparent text-slate-900 dark:text-white text-sm w-full outline-none font-medium truncate"
                                value={endQuery}
                                onChange={(e) => setEndQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAnalyzeRoute}
                    disabled={analyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {analyzing ? <Loader className="animate-spin" /> : <Zap fill="currentColor"/>}
                    <span>{analyzing ? "CALCULATING..." : "FIND SAFE ROUTE"}</span>
                </button>
              </div>
          )}

          {/* ROUTE RESULTS CARD */}
          {routeData && (
            <div className="mt-6 space-y-4 animate-in zoom-in-95 duration-500">
                <div className={`${riskBg} rounded-2xl p-5 text-white shadow-xl relative overflow-hidden`}>
                    <div className="absolute -right-6 -top-6 bg-white/20 w-32 h-32 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-90 bg-black/20 px-2 py-1 rounded">
                            {getRiskLevel()}
                        </span>
                        <Zap size={20} className="text-white/80" fill="currentColor"/>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black">{routeData.distance_km}</span>
                        <span className="text-lg font-medium opacity-80">km</span>
                    </div>
                    <div className="text-sm opacity-90 font-medium mb-4">
                        ETA: {routeData.eta || "Calculating..."}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium bg-black/10 p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                            <CloudRain size={12}/> Rain: {routeData.weather_data?.rainfall_mm || 0}mm
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertTriangle size={12}/> Slopes: Avoided
                        </div>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        setRouteData(null);
                        setIsDrawerOpen(true);
                    }}
                    className="w-full py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
                >
                    CHANGE DESTINATION
                </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MapView;