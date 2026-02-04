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
  ArrowLeft,
  MapPin,
  Building2,
  Landmark,
  Stethoscope,
  GraduationCap,
  Shield
} from "lucide-react";
// ✅ Capacitor Native Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
// ✅ Configuration Import
import { API_BASE_URL } from "../config"; // Ensure you have this or replace with direct URL

// 🚀 CONFIGURATION
// Replace with your actual Live Server URL if config import doesn't work
const SERVER_URL = "https://157.245.111.124.nip.io"; 
const MAPBOX_TOKEN = "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

// 🛡️ NORTH EAST INDIA SEARCH LIMIT (Sikkim to Arunachal)
const NE_BBOX = "87.5,21.5,97.5,29.5";

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
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/`);
      if (res.ok) setBackendStatus({ online: true, checking: false });
    } catch (err) {
      setBackendStatus({ online: false, checking: false });
    }
  };

  // --- 🔍 NORTH EAST SEARCH SYSTEM ---
  const handleSearch = async (query, field) => {
    if (field === "start") setStartQuery(query);
    else setEndQuery(query);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // ✅ BBOX FILTER: Only searches inside North East India
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

  // Helper: Choose icon based on place type
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
    
    // Zoom Logic
    const isSpecific = feature.place_type.includes("poi") || feature.place_type.includes("address");
    mapRef.current?.flyTo({ center: [lng, lat], zoom: isSpecific ? 15 : 10, duration: 2000 });
  };

  // --- 📍 TAP TO SELECT ---
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

  // --- 🛡️ LIFE SAVIOUR ROUTING (CONNECT TO BACKEND) ---
  const handleAnalyzeRoute = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    setAnalyzing(true);
    setServerError(null);
    setRouteData(null);

    try {
      // 1. Call your DigitalOcean Backend
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
      
      // 2. Set Data for Display
      if(data.status === "success") {
          setRouteData(data.route_analysis);
          
          // 3. Auto Zoom to Route
          if (data.route_analysis.coordinates.length > 0) {
              const coords = data.route_analysis.coordinates;
              // Simple center calculation
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
  const toggleMapStyle = () => {
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

  // Risk Styling
  const getRiskLevel = () => routeData?.risk_level || "SAFE";
  const isDanger = ["DANGER", "CRITICAL", "HIGH"].includes(getRiskLevel());
  const riskBg = isDanger ? "bg-red-600" : "bg-emerald-600";

  return (
    <div className="h-screen w-full relative bg-slate-900 flex flex-col md:flex-row overflow-hidden">
      
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
            <NavigationControl position="top-right" style={{ marginTop: '50px' }} />
            <GeolocateControl position="top-right" />
            
            <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />

            {/* Markers */}
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

            {/* 🛣️ SAFEST ROUTE LINE */}
            {routeData && (
              <Source id="route" type="geojson" data={{
                type: "Feature",
                properties: {},
                // Backend sends [lat, lng], Mapbox needs [lng, lat]
                geometry: { 
                    type: "LineString", 
                    coordinates: routeData.coordinates.map(c => [c[1], c[0]]) 
                }
              }}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": isDanger ? "#ef4444" : "#10b981", // Red if Risky, Green if Safe
                    "line-width": 6,
                    "line-opacity": 0.8,
                    "line-blur": 1
                  }}
                />
              </Source>
            )}
          </Map>

          {/* BACK BUTTON */}
          <button onClick={() => navigate(-1)} className="absolute top-12 left-4 z-10 p-3 rounded-full bg-slate-900/90 border border-slate-700 shadow-xl text-white">
              <ArrowLeft size={20} />
          </button>

          {/* LAYER TOGGLE */}
          <button onClick={toggleMapStyle} className="absolute top-12 right-14 z-10 p-3 rounded-full bg-slate-900/90 border border-slate-700 shadow-xl text-white">
              {mapStyle === "satellite" ? <Satellite size={20} className="text-blue-500" /> : <Layers size={20} />}
          </button>
      </div>

      {/* 🎛️ DRAWER / CONTROLS */}
      <div className={`absolute md:relative z-20 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 transition-all duration-300 bottom-0 left-0 w-full rounded-t-3xl ${isDrawerOpen ? "h-[60vh]" : "h-[120px]"} md:w-96 md:h-full md:rounded-none md:border-l md:border-t-0`}>
        
        {/* Handle for Mobile */}
        <div className="md:hidden w-full h-8 flex items-center justify-center" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        <div className="p-6 h-full overflow-y-auto pb-24 md:pb-6 no-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-white text-lg font-bold">AI Route Planner</h1>
            {!backendStatus.online && <div className="text-amber-500 text-[10px] font-mono"><WifiOff size={10}/> OFFLINE</div>}
          </div>

          {/* INPUTS */}
          {(!routeData || isDrawerOpen) && (
              <div className="space-y-4 relative">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 space-y-3">
                    {/* START */}
                    <div className={`flex items-center gap-3 bg-slate-950 p-3 rounded-lg border ${activeField === 'start' ? 'border-blue-500' : 'border-slate-800'}`} onClick={() => setActiveField('start')}>
                        <Navigation size={18} className="text-blue-500"/>
                        <input 
                            className="bg-transparent text-white text-sm w-full outline-none"
                            value={startQuery}
                            onChange={(e) => handleSearch(e.target.value, "start")}
                            placeholder="Start Point..."
                        />
                    </div>
                    {/* END */}
                    <div className={`flex items-center gap-3 bg-slate-950 p-3 rounded-lg border ${activeField === 'end' ? 'border-red-500' : 'border-slate-800'}`} onClick={() => setActiveField('end')}>
                        <Target size={18} className="text-red-500"/>
                        <input 
                            className="bg-transparent text-white text-sm w-full outline-none"
                            value={endQuery}
                            onChange={(e) => handleSearch(e.target.value, "end")}
                            placeholder="Destination..."
                        />
                    </div>
                </div>

                {/* SUGGESTIONS LIST */}
                {suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-[140px] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 max-h-64 overflow-y-auto">
                    {suggestions.map((place) => (
                      <div key={place.id} onClick={() => selectSuggestion(place)} className="p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer flex items-center gap-3">
                        {getPlaceIcon(place)}
                        <div>
                          <div className="text-sm font-bold text-white">{place.text}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{place.place_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleAnalyzeRoute} disabled={analyzing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {analyzing ? <Loader className="animate-spin" /> : <Zap fill="currentColor"/>}
                    <span>{analyzing ? "SCANNING ROUTE..." : "FIND SAFEST PATH"}</span>
                </button>
              </div>
          )}

          {/* RESULTS CARD */}
          {routeData && (
            <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-4">
                <div className={`${riskBg} rounded-2xl p-5 text-white shadow-xl relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest bg-black/20 px-2 py-1 rounded">{getRiskLevel()}</span>
                        <Zap size={20} className="text-white/80" fill="currentColor"/>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black">{routeData.distance_km}</span>
                        <span className="text-lg opacity-80">km</span>
                    </div>
                    <div className="text-sm opacity-90 mb-4">ETA: {routeData.eta}</div>
                    
                    {/* AI Recommendation */}
                    <div className="bg-black/20 p-3 rounded-lg text-xs font-medium leading-relaxed">
                        {routeData.recommendation}
                    </div>
                </div>

                <button onClick={() => { setRouteData(null); setIsDrawerOpen(true); }} className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700">
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