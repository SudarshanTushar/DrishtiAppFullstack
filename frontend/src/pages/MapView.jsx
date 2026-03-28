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
  ArrowLeft,
  MapPin,
  Landmark,
  Stethoscope,
  GraduationCap,
  Shield,
  Sun,
  Moon,
  AlertOctagon,
  LocateFixed
} from "lucide-react";

// ✅ Native Plugins
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Geolocation } from '@capacitor/geolocation'; 
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";

// ✅ CORE INTEGRATIONS
import { ErrorBoundary } from "../components/ErrorBoundary";
import RouteNavigationUI from "../components/RouteNavigationUI";
import meshNetworkService from "../services/meshNetworkService"; 

// 🚀 CONFIGURATION
const SERVER_URL = "https://134.209.145.64.nip.io"; 
const MAPBOX_TOKEN = "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";
const NE_BBOX = "87.5,21.5,97.5,29.5";

const MapView = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // --- STATE ---
  const [analyzing, setAnalyzing] = useState(false);
  const [routeData, setRouteData] = useState(null);       
  const [riskyRoutes, setRiskyRoutes] = useState([]);     
  const [mapStyle, setMapStyle] = useState("night");
  const [serverError, setServerError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });
  
  // 🧭 Navigation & GPS State
  const [isNavigating, setIsNavigating] = useState(false);
  const [realTimeCoords, setRealTimeCoords] = useState(null); 
  const watchIdRef = useRef(null); 
  const [isLocating, setIsLocating] = useState(false); 

  // 🚨 SOS State (CRASH PROOF - No Alerts)
  const [sosActive, setSosActive] = useState(false);
  const [sosStatusMsg, setSosStatusMsg] = useState(null); // 🚀 NEW: Safe Notification State

  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  
  // Search State
  const [activeField, setActiveField] = useState("end"); 
  const [suggestions, setSuggestions] = useState([]); 
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

    const updateMapTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        setMapStyle(isDark ? "night" : "day");
    };
    updateMapTheme();
    const observer = new MutationObserver(updateMapTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (watchIdRef.current) Geolocation.clearWatch({ id: watchIdRef.current });
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/`);
      if (res.ok) setBackendStatus({ online: true, checking: false });
    } catch (err) {
      setBackendStatus({ online: false, checking: false });
    }
  };

  // --- 📍 AUTO-LOCATE (LIVE GPS) ---
  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      setStartQuery("Locating...");
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') await Geolocation.requestPermissions();

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;

      setStartCoords({ lat: latitude, lng: longitude });

      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=poi,locality,place,district`);
        const data = await res.json();
        if (data.features?.length > 0) {
          setStartQuery(data.features[0].text);
        } else {
          setStartQuery("Current Location");
        }
      } catch (e) {
        setStartQuery("Current Location");
      }

      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1500 });
      setActiveField("end"); 
    } catch (error) {
      console.error("GPS Error:", error);
      setStartQuery("");
      setSosStatusMsg({ type: "error", text: "Please enable GPS permissions." });
      setTimeout(() => setSosStatusMsg(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  // --- 🔍 ADVANCED SEARCH SYSTEM ---
  const handleSearch = (query, field) => {
    if (field === "start") setStartQuery(query);
    else setEndQuery(query);

    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
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
    }, 500); 
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
    if (isNavigating || routeData) return; 
    const { lng, lat } = event.lngLat;
    await Haptics.impact({ style: ImpactStyle.Light }).catch(()=>{});

    let placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,locality,place,district`);
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

  // --- 🛡️ ROUTING ENGINE ---
  const handleAnalyzeRoute = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(()=>{});
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
          setRouteData(data.route_analysis);
          setRiskyRoutes(data.risky_routes || []);
          
          if (data.route_analysis.coordinates.length > 0) {
              const coords = data.route_analysis.coordinates;
              const mid = coords[Math.floor(coords.length/2)];
              mapRef.current?.flyTo({ center: [mid[1], mid[0]], zoom: 9, pitch: 0, bearing: 0, duration: 2000 });
          }
          setIsDrawerOpen(false);
      } else {
          throw new Error("Route calculation failed");
      }
    } catch (err) {
      setServerError("Could not connect to AI Routing Engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  // --- 🧭 NAVIGATION ---
  const startNavigationMode = async () => {
    setIsNavigating(true);
    setRealTimeCoords(startCoords); 

    mapRef.current?.flyTo({
      center: [startCoords.lng, startCoords.lat],
      zoom: 16,
      pitch: 50, 
      bearing: 25, 
      duration: 2500
    });

    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') await Geolocation.requestPermissions();

      watchIdRef.current = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        (position) => {
          if (position) {
            const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setRealTimeCoords(newCoords);
            mapRef.current?.easeTo({
              center: [newCoords.lng, newCoords.lat],
              zoom: 16,
              pitch: 50,
              duration: 1000
            });
          }
        }
      );
    } catch (e) {
      console.error("GPS Tracking failed:", e);
    }
  };

  const stopNavigationMode = () => {
    setIsNavigating(false);
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    mapRef.current?.flyTo({
      center: [startCoords.lng, startCoords.lat],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      duration: 1500
    });
  };

  const closeRouteEntirely = () => {
    stopNavigationMode();
    setRouteData(null);
    setRiskyRoutes([]);
    setRealTimeCoords(null);
    setIsDrawerOpen(true);
  };

  // --- 🚨 OFFLINE MESH SOS LOGIC (CRASH PROOF) ---
  const triggerEmergencySOS = async () => {
    if (sosActive) return; 
    
    try {
      await Haptics.notification({ type: NotificationType.Error });
      setTimeout(() => Haptics.vibrate(), 200);
      setTimeout(() => Haptics.vibrate(), 400);
    } catch(e) {}

    setSosActive(true);
    const currentLoc = realTimeCoords || startCoords;

    try {
      await meshNetworkService.sendSOS({
        message: "URGENT: USER TRAPPED/IN DANGER. NEED IMMEDIATE EVAC.",
        lat: currentLoc.lat,
        lng: currentLoc.lng,
        metadata: { destination: endQuery || "Unknown" }
      });
      // 🚀 NO MORE alert(). Using safe React UI State.
      setSosStatusMsg({ type: "success", text: "🚨 MESH SOS BROADCASTED!" });
    } catch (e) {
      setSosStatusMsg({ type: "error", text: "⚠️ Mesh Radio Offline." });
    }

    // Reset after 4 seconds
    setTimeout(() => {
      setSosActive(false);
      setSosStatusMsg(null);
    }, 4000); 
  };

  const toggleMapStyle = async () => {
    const styles = ["night", "satellite", "day"];
    const nextStyle = styles[(styles.indexOf(mapStyle) + 1) % styles.length];
    setMapStyle(nextStyle);
    await Haptics.impact({ style: ImpactStyle.Light }).catch(()=>{});
  };

  const getMapStyleURL = () => {
    switch (mapStyle) {
      case "satellite": return "mapbox://styles/mapbox/satellite-streets-v12";
      case "day": return "mapbox://styles/mapbox/streets-v12";
      case "night": return "mapbox://styles/mapbox/dark-v11";
      default: return "mapbox://styles/mapbox/dark-v11";
    }
  };

  const getRiskLevel = () => routeData?.risk_level || "SAFE";
  const isDanger = ["DANGER", "CRITICAL", "HIGH"].includes(getRiskLevel());

  const disableContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <ErrorBoundary>
      <div 
        className="h-screen w-full relative bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row overflow-hidden transition-colors duration-500 select-none" 
        style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={disableContextMenu}
      >
        
        {/* 🗺️ MAP AREA */}
        <div className="flex-1 relative h-full pointer-events-auto">
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

              <Marker 
                  longitude={isNavigating && realTimeCoords ? realTimeCoords.lng : startCoords.lng} 
                  latitude={isNavigating && realTimeCoords ? realTimeCoords.lat : startCoords.lat} 
                  anchor="bottom"
              >
                  <div className={`p-2.5 rounded-full border-[3px] border-white shadow-xl transition-all duration-1000 ${isNavigating ? 'bg-emerald-500 animate-pulse scale-125' : 'bg-blue-600'}`}>
                      <Navigation size={20} color="white" className={`transition-transform duration-500 ${isNavigating ? 'rotate-45' : ''}`} />
                  </div>
              </Marker>
              <Marker longitude={endCoords.lng} latitude={endCoords.lat} anchor="bottom">
                  <div className="bg-red-600 p-2.5 rounded-full border-[3px] border-white shadow-xl">
                      <Target size={20} color="white" />
                  </div>
              </Marker>

              {!isNavigating && riskyRoutes.length > 0 && (
                 <Source id="risky-routes" type="geojson" data={{
                   type: "FeatureCollection",
                   features: riskyRoutes.map(route => ({
                     type: "Feature",
                     geometry: { type: "LineString", coordinates: route.coordinates.map(c => [c[1], c[0]]) }
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

              {routeData && (
                <Source id="route" type="geojson" data={{
                  type: "Feature",
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
                      "line-width": isNavigating ? 8 : 6,
                      "line-opacity": 0.9,
                      "line-blur": 0.5
                    }}
                  />
                </Source>
              )}
            </Map>

            <div className="absolute top-4 left-4 z-10 flex gap-3 pointer-events-auto">
              <button onClick={() => navigate(-1)} className="p-3.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-white hover:scale-105 transition-all active:scale-95">
                  <ArrowLeft size={20} />
              </button>
            </div>

            <div className="absolute top-4 right-4 z-10 pointer-events-auto">
              <button onClick={toggleMapStyle} className="p-3.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-white hover:scale-105 transition-all active:scale-95 flex items-center justify-center">
                  {mapStyle === "satellite" ? <Satellite size={20} className="text-blue-500" /> : 
                   mapStyle === "day" ? <Sun size={20} className="text-amber-500"/> :
                   <Moon size={20} className="text-indigo-400"/>}
              </button>
            </div>

            {/* 🚨 OFFLINE PANIC BUTTON & TOAST NOTIFICATION */}
            {isNavigating && (
              <div className="absolute bottom-10 right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto">
                
                {/* 🚀 TOAST NOTIFICATION */}
                {sosStatusMsg && (
                  <div className={`px-4 py-2 rounded-xl text-xs font-black shadow-xl animate-in slide-in-from-right duration-300 ${
                    sosStatusMsg.type === "success" ? "bg-emerald-500 text-white" : "bg-red-600 text-white"
                  }`}>
                    {sosStatusMsg.text}
                  </div>
                )}

                <button 
                  onClick={triggerEmergencySOS}
                  className={`flex flex-col items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-300 ${
                    sosActive ? 'bg-white scale-90 shadow-red-500/50' : 'bg-red-600 hover:bg-red-700 shadow-red-600/40 animate-pulse hover:scale-105'
                  }`}
                >
                  <AlertOctagon size={28} className={sosActive ? 'text-red-600 animate-ping' : 'text-white'} />
                </button>
              </div>
            )}
        </div>

        {routeData && (
          <div className="pointer-events-auto">
            <RouteNavigationUI 
                routeData={{
                    destinationName: (endQuery || "Destination").split(',')[0],
                    safetyScore: routeData.risk_level === "SAFE" ? "95%" : routeData.risk_level === "MEDIUM" ? "65%" : "20%",
                    eta: routeData.eta || "Est. 45 Mins",
                    distance: `${routeData.distance_km} km`,
                    hasRisk: riskyRoutes.length > 0,
                    riskZones: riskyRoutes.length.toString()
                }}
                isNavigating={isNavigating}
                onStartNavigation={startNavigationMode}
                onStopNavigation={stopNavigationMode}
                onCloseRoute={closeRouteEntirely}
            />
          </div>
        )}

        {/* 🎛️ SEARCH DRAWER */}
        <div className={`absolute md:relative z-20 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) bottom-0 left-0 w-full rounded-t-[2rem] md:w-[400px] md:h-full md:rounded-none md:border-l md:border-t-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pointer-events-auto
            ${!routeData ? (isDrawerOpen ? "h-[70vh] md:w-[400px]" : "h-[130px]") : "translate-y-[120%] md:translate-x-[120%] opacity-0 pointer-events-none"} 
        `}>
          <div className="md:hidden w-full h-8 flex items-center justify-center cursor-pointer active:opacity-50 pt-2" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>

          <div className="px-6 h-full overflow-y-auto no-scrollbar pb-24 md:pb-6">
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

            <div className="space-y-5 relative">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
                  <div className="absolute left-[27px] top-[45px] bottom-[45px] w-[2px] border-l-2 border-dashed border-slate-300 dark:border-slate-600 pointer-events-none z-0"></div>

                  <div className={`flex items-center gap-3 p-3.5 rounded-xl transition-all relative z-10 ${activeField === 'start' ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setActiveField('start')}>
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-200 dark:border-blue-900 shadow-sm shrink-0"></div>
                      
                      <div className="flex-1 flex justify-between items-center">
                          <div className="w-full pr-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">From</label>
                              <input 
                                className="bg-transparent text-slate-900 dark:text-white text-sm font-semibold w-full outline-none placeholder:text-slate-400 select-text" 
                                style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                                value={startQuery} 
                                onChange={(e) => handleSearch(e.target.value, "start")} 
                                placeholder="Current Location" 
                                onContextMenu={disableContextMenu}
                              />
                          </div>
                          <button
                              onClick={(e) => { e.stopPropagation(); handleUseCurrentLocation(); }}
                              disabled={isLocating}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-full transition-all active:scale-95 flex-shrink-0"
                              title="Use Current Location"
                          >
                              {isLocating ? <Loader size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                          </button>
                      </div>
                  </div>

                  <div className="h-[1px] bg-slate-200 dark:bg-slate-700 mx-10"></div>

                  <div className={`flex items-center gap-3 p-3.5 rounded-xl transition-all relative z-10 ${activeField === 'end' ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setActiveField('end')}>
                      <div className="w-4 h-4 rounded-full bg-red-500 border-4 border-red-200 dark:border-red-900 shadow-sm shrink-0"></div>
                      <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">To</label>
                          <input 
                            className="bg-transparent text-slate-900 dark:text-white text-sm font-semibold w-full outline-none placeholder:text-slate-400 select-text" 
                            style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                            value={endQuery} 
                            onChange={(e) => handleSearch(e.target.value, "end")} 
                            placeholder="Where to?" 
                            onContextMenu={disableContextMenu}
                          />
                      </div>
                  </div>
              </div>

              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-[180px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pointer-events-auto">
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

              <button onClick={handleAnalyzeRoute} disabled={analyzing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed group">
                  {analyzing ? <Loader className="animate-spin" size={20} /> : <Zap fill="currentColor" size={20} className="group-hover:scale-110 transition-transform"/>}
                  <span className="tracking-wide text-sm">{analyzing ? "CALCULATING RISK..." : "FIND SAFEST ROUTE"}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
};

export default MapView;