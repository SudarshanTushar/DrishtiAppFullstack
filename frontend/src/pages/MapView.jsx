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
  Loader,
  Satellite,
  Zap,
  Target,
  WifiOff,
  Layers,
  ArrowLeft,
  MapPin,
  Landmark,
  Stethoscope,
  GraduationCap,
  Shield,
  AlertTriangle,
  Sun,
  Moon
} from "lucide-react";
// ✅ Capacitor Native Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";

// 🚀 CONFIGURATION
const SERVER_URL = "https://157.245.111.124.nip.io"; 
const MAPBOX_TOKEN = "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

// 🛡️ NORTH EAST INDIA SEARCH LIMIT
const NE_BBOX = "87.5,21.5,97.5,29.5";

const MapView = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // --- STATE ---
  const [analyzing, setAnalyzing] = useState(false);
  const [routeData, setRouteData] = useState(null);       // 🟢 Safe Route
  const [riskyRoutes, setRiskyRoutes] = useState([]);     // 🔴 Risky Routes
  const [mapStyle, setMapStyle] = useState("night");      // Default, updates on mount
  const [serverError, setServerError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });
  
  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  
  // --- SEARCH & LOCATION STATE ---
  const [activeField, setActiveField] = useState("end"); 
  const [suggestions, setSuggestions] = useState([]); 
  
  // Inputs & Coords (Default: Guwahati -> Shillong)
  const [startQuery, setStartQuery] = useState("Guwahati, Assam");
  const [endQuery, setEndQuery] = useState("Shillong, Meghalaya");
  const [startCoords, setStartCoords] = useState({ lat: 26.1445, lng: 91.7362 });
  const [endCoords, setEndCoords] = useState({ lat: 25.5788, lng: 91.8933 });

  // --- INITIALIZATION ---
  useEffect(() => {
    const initNative = async () => {
        try {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {}
    };
    initNative();
    checkBackend();

    // 🎨 AUTO-DETECT THEME FOR MAP STYLE
    const updateMapTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        setMapStyle(isDark ? "night" : "day");
    };

    // Initial check
    updateMapTheme();

    // Listen for theme changes (Observer)
    const observer = new MutationObserver(updateMapTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/`);
      if (res.ok) setBackendStatus({ online: true, checking: false });
    } catch (err) {
      setBackendStatus({ online: false, checking: false });
    }
  };

  // --- 🔍 SEARCH SYSTEM ---
  const handleSearch = async (query, field) => {
    if (field === "start") setStartQuery(query);
    else setEndQuery(query);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=in&bbox=${NE_BBOX}&limit=8&types=address,poi,neighborhood,locality,place,district,region`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setActiveField(field); 
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const getPlaceIcon = (place) => {
    const text = place.text.toLowerCase();
    const cat = place.properties?.category || "";
    if (cat.includes("hospital") || text.includes("hospital")) return <Stethoscope size={16} className="text-red-500"/>;
    if (cat.includes("school") || text.includes("college")) return <GraduationCap size={16} className="text-blue-500"/>;
    if (cat.includes("police") || text.includes("police")) return <Shield size={16} className="text-slate-500"/>;
    if (place.place_type.includes("district")) return <Landmark size={16} className="text-purple-500"/>;
    return <MapPin size={16} className="text-orange-500"/>;
  };

  const selectSuggestion = (feature) => {
    const [lng, lat] = feature.center;
    const name = feature.place_name;

    if (activeField === "start") {
      setStartCoords({ lat, lng });
      setStartQuery(name);
    } else {
      setEndCoords({ lat, lng });
      setEndQuery(name);
    }
    setSuggestions([]); 
    
    const isSpecific = feature.place_type.includes("poi") || feature.place_type.includes("address");
    mapRef.current?.flyTo({ center: [lng, lat], zoom: isSpecific ? 15 : 10, duration: 2000 });
  };

  const handleMapClick = async (event) => {
    const { lng, lat } = event.lngLat;
    await Haptics.impact({ style: ImpactStyle.Light });

    let placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,locality,place,district`
      );
      const data = await res.json();
      if (data.features?.length > 0) placeName = data.features[0].text;
    } catch (e) {}

    if (activeField === "start") {
      setStartCoords({ lat, lng });
      setStartQuery(placeName);
    } else {
      setEndCoords({ lat, lng });
      setEndQuery(placeName);
    }
  };

  // --- 🛡️ LIFE SAVIOUR ROUTING ---
  const handleAnalyzeRoute = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    setAnalyzing(true);
    setServerError(null);
    setRouteData(null);
    setRiskyRoutes([]); 

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/core/analyze-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: startCoords.lat,
          start_lng: startCoords.lng,
          end_lat: endCoords.lat,
          end_lng: endCoords.lng,
        }),
      });

      if (!response.ok) throw new Error("Server Error");
      
      const data = await response.json();
      
      if(data.status === "success") {
          setRouteData(data.route_analysis);     // 🟢 Safe
          setRiskyRoutes(data.risky_routes || []); // 🔴 Risky
          
          if (data.route_analysis.coordinates.length > 0) {
              const coords = data.route_analysis.coordinates;
              const mid = coords[Math.floor(coords.length/2)];
              mapRef.current?.flyTo({ center: [mid[1], mid[0]], zoom: 9, duration: 2000 });
          }
      } else {
          throw new Error("Route calculation failed");
      }

      if (window.innerWidth < 768) setIsDrawerOpen(false);

    } catch (err) {
      console.error(err);
      setServerError("Could not connect to AI Routing Engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  // --- HELPERS ---
  const toggleMapStyle = async () => { // ✅ Added async here
    const styles = ["night", "satellite", "day"];
    const nextStyle = styles[(styles.indexOf(mapStyle) + 1) % styles.length];
    setMapStyle(nextStyle);
    await Haptics.impact({ style: ImpactStyle.Light });
  };

  const getMapStyleURL = () => {
    switch (mapStyle) {
      case "satellite": return "mapbox://styles/mapbox/satellite-streets-v12";
      case "day": return "mapbox://styles/mapbox/streets-v12"; // Light Mode Map
      case "night": return "mapbox://styles/mapbox/dark-v11";   // Dark Mode Map
      default: return "mapbox://styles/mapbox/dark-v11";
    }
  };

  const getRiskLevel = () => routeData?.risk_level || "SAFE";
  const isDanger = ["DANGER", "CRITICAL", "HIGH"].includes(getRiskLevel());
  const riskBg = isDanger ? "bg-red-600" : "bg-emerald-600";

  return (
    <div className="h-screen w-full relative bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row overflow-hidden transition-colors duration-500">
      
      {/* 🗺️ MAP AREA */}
      <div className="flex-1 relative h-full">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 91.7362, latitude: 26.1445, zoom: 8 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={getMapStyleURL()}
            mapboxAccessToken={MAPBOX_TOKEN}
            onClick={handleMapClick}
            terrain={{source: 'mapbox-dem', exaggeration: 1.5}}
          >
            <NavigationControl position="top-right" style={{ marginTop: '80px' }} />
            <GeolocateControl position="top-right" />
            
            <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />

            {/* Markers */}
            <Marker longitude={startCoords.lng} latitude={startCoords.lat} anchor="bottom">
                <div className="bg-blue-600 p-2.5 rounded-full border-[3px] border-white shadow-xl animate-bounce">
                    <Navigation size={20} color="white" />
                </div>
            </Marker>
            <Marker longitude={endCoords.lng} latitude={endCoords.lat} anchor="bottom">
                <div className="bg-red-600 p-2.5 rounded-full border-[3px] border-white shadow-xl">
                    <Target size={20} color="white" />
                </div>
            </Marker>

            {/* 🔴 RISKY ROUTES */}
            {riskyRoutes.length > 0 && (
               <Source id="risky-routes" type="geojson" data={{
                 type: "FeatureCollection",
                 features: riskyRoutes.map(route => ({
                   type: "Feature",
                   geometry: {
                     type: "LineString",
                     coordinates: route.coordinates.map(c => [c[1], c[0]])
                   }
                 }))
               }}>
                 <Layer
                   id="risky-lines"
                   type="line"
                   paint={{
                     "line-color": "#ff0000",
                     "line-width": 4,
                     "line-opacity": 0.5,
                     "line-dasharray": [2, 3]
                   }}
                 />
               </Source>
            )}

            {/* 🟢 SAFEST ROUTE */}
            {routeData && (
              <Source id="route" type="geojson" data={{
                type: "Feature",
                properties: {},
                geometry: { 
                    type: "LineString", 
                    coordinates: routeData.coordinates.map(c => [c[1], c[0]]) 
                }
              }}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": isDanger ? "#ef4444" : "#10b981",
                    "line-width": 6,
                    "line-opacity": 0.9,
                    "line-blur": 0.5
                  }}
                />
              </Source>
            )}
          </Map>

          {/* FLOATING ACTION BUTTONS */}
          <div className="absolute top-4 left-4 z-10 flex gap-3">
            <button onClick={() => navigate(-1)} className="p-3.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-white hover:scale-105 transition-all active:scale-95">
                <ArrowLeft size={20} />
            </button>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <button onClick={toggleMapStyle} className="p-3.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-white hover:scale-105 transition-all active:scale-95 flex items-center justify-center">
                {mapStyle === "satellite" ? <Satellite size={20} className="text-blue-500" /> : 
                 mapStyle === "day" ? <Sun size={20} className="text-amber-500"/> :
                 <Moon size={20} className="text-indigo-400"/>}
            </button>
          </div>
      </div>

      {/* 🎛️ DRAWER / CONTROLS - FIXED THEMES */}
      <div className={`absolute md:relative z-20 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) bottom-0 left-0 w-full rounded-t-[2rem] md:w-[400px] md:h-full md:rounded-none md:border-l md:border-t-0
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
          ${isDrawerOpen ? "h-[70vh] md:w-[400px]" : "h-[130px]"} 
      `}>
        
        {/* Mobile Pull Handle */}
        <div className="md:hidden w-full h-8 flex items-center justify-center cursor-pointer active:opacity-50 pt-2" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>

        <div className="px-6 h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
          
          {/* Header Area */}
          <div className="flex justify-between items-center mb-6 mt-1 md:mt-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">AI Navigator</h1>
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Life Saviour Protocol</p>
            </div>
            {!backendStatus.online && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-full animate-pulse">
                    <WifiOff size={12} className="text-amber-600 dark:text-amber-500"/> 
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">OFFLINE</span>
                </div>
            )}
          </div>

          {/* INPUTS SECTION */}
          {(!routeData || isDrawerOpen) && (
              <div className="space-y-5 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Connected Inputs Container */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
                    
                    {/* Connecting Line */}
                    <div className="absolute left-[27px] top-[45px] bottom-[45px] w-[2px] border-l-2 border-dashed border-slate-300 dark:border-slate-600 pointer-events-none z-0"></div>

                    {/* START INPUT */}
                    <div 
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all relative z-10 ${
                            activeField === 'start' 
                            ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                            : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => setActiveField('start')}
                    >
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-200 dark:border-blue-900 shadow-sm shrink-0"></div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">From</label>
                            <input 
                                className="bg-transparent text-slate-900 dark:text-white text-sm font-semibold w-full outline-none placeholder:text-slate-400"
                                value={startQuery}
                                onChange={(e) => handleSearch(e.target.value, "start")}
                                placeholder="Current Location"
                            />
                        </div>
                    </div>

                    {/* SEPARATOR */}
                    <div className="h-[1px] bg-slate-200 dark:bg-slate-700 mx-10"></div>

                    {/* END INPUT */}
                    <div 
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all relative z-10 ${
                            activeField === 'end' 
                            ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                            : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => setActiveField('end')}
                    >
                        <div className="w-4 h-4 rounded-full bg-red-500 border-4 border-red-200 dark:border-red-900 shadow-sm shrink-0"></div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">To</label>
                            <input 
                                className="bg-transparent text-slate-900 dark:text-white text-sm font-semibold w-full outline-none placeholder:text-slate-400"
                                value={endQuery}
                                onChange={(e) => handleSearch(e.target.value, "end")}
                                placeholder="Where to?"
                            />
                        </div>
                    </div>
                </div>

                {/* SUGGESTIONS LIST */}
                {suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-[180px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {suggestions.map((place) => (
                      <div key={place.id} onClick={() => selectSuggestion(place)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3.5 transition-colors">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                            {getPlaceIcon(place)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{place.text}</div>
                          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate max-w-[250px]">{place.place_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                    onClick={handleAnalyzeRoute} 
                    disabled={analyzing} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {analyzing ? (
                        <Loader className="animate-spin" size={20} />
                    ) : (
                        <Zap fill="currentColor" size={20} className="group-hover:scale-110 transition-transform"/>
                    )}
                    <span className="tracking-wide text-sm">{analyzing ? "CALCULATING RISK..." : "FIND SAFEST ROUTE"}</span>
                </button>
              </div>
          )}

          {/* RESULTS CARD */}
          {routeData && (
            <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <div className={`${riskBg} rounded-2xl p-6 text-white shadow-xl shadow-red-500/10 relative overflow-hidden group border border-white/10`}>
                    
                    {/* Decorative Background */}
                    <div className="absolute -right-8 -top-8 opacity-10 rotate-12 group-hover:opacity-15 transition-opacity duration-700">
                        <Zap size={140} fill="currentColor"/>
                    </div>

                    <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            {isDanger ? <AlertTriangle size={14} className="text-white"/> : <Shield size={14} className="text-white"/>}
                            <span className="text-xs font-black uppercase tracking-widest">{getRiskLevel()}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mt-2 relative z-10">
                        <span className="text-6xl font-black tracking-tighter">{routeData.distance_km}</span>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-bold opacity-90">km</span>
                            <span className="text-xs font-medium opacity-60 uppercase">Distance</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4 mb-6 relative z-10">
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                            <span className="opacity-70">ETA:</span>
                            <span>{routeData.eta}</span>
                        </div>
                    </div>
                    
                    {/* Comparison Note */}
                    {riskyRoutes.length > 0 && (
                        <div className="mb-4 flex items-start gap-2 text-[11px] font-bold bg-black/20 p-2.5 rounded-lg border border-white/5 relative z-10">
                            <AlertTriangle size={14} className="text-amber-300 shrink-0 mt-0.5"/>
                            <span className="opacity-90 leading-tight">AI Warning: {riskyRoutes.length} faster but dangerous routes were rejected for safety.</span>
                        </div>
                    )}

                    {/* AI Recommendation */}
                    <div className="bg-white/10 p-3.5 rounded-xl text-xs font-medium leading-relaxed border border-white/10 backdrop-blur-sm relative z-10">
                        "{routeData.recommendation}"
                    </div>
                </div>

                <button 
                    onClick={() => { setRouteData(null); setIsDrawerOpen(true); }} 
                    className="w-full py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-black tracking-wide border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98] shadow-sm"
                >
                    NEW SEARCH
                </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MapView;