import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Shield,
  Brain,
  MapPin,
  Loader,
  Satellite,
  CloudRain,
  XCircle,
  Zap,
  Target,
  Siren,
  Sun,
  Share2,
  Tent,
  Stethoscope,
  Ruler,
  ServerCrash,
  CheckCircle2,
  Terminal,
  Activity,
  ArrowRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useI18n } from "../i18n";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// ⚠️ PRODUCTION SERVER (DigitalOcean with Caddy SSL)
const API_URL = "https://157.245.111.124.nip.io";
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

const MapView = () => {
  const { t } = useI18n();
  const mapRef = useRef(null);

  // --- STATE ---
  const [analyzing, setAnalyzing] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [mapStyle, setMapStyle] = useState("night");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    checking: true,
    message: "",
  });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showStandardRoute, setShowStandardRoute] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null); // 'weather', 'terrain', 'algorithm'

  // New State for Hospital Mode
  const [findingHospital, setFindingHospital] = useState(false);

  // Features
  const [showWeather, setShowWeather] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [enable3D, setEnable3D] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Inputs
  const [startQuery, setStartQuery] = useState("Guwahati, Assam");
  const [endQuery, setEndQuery] = useState("Shillong, Meghalaya");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [startCoords, setStartCoords] = useState({
    lat: 26.1445,
    lng: 91.7362,
  });
  const [endCoords, setEndCoords] = useState({ lat: 25.5788, lng: 91.8933 });

  // --- BACKEND HEALTH CHECK ---
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setBackendStatus({
            online: true,
            checking: false,
            message: `Server Online: ${data.engine || "AI Engine"}`,
          });
        } else {
          throw new Error("Server responded with error");
        }
      } catch (err) {
        console.error("❌ Backend health check failed:", err);
        setBackendStatus({
          online: false,
          checking: false,
          message: "Server Offline",
        });

        let errorMsg = `Cannot connect to ${API_URL}. `;
        if (err.message.includes("Failed to fetch")) {
          errorMsg +=
            "Possible causes: 1) Server not running, 2) Wrong IP/port, 3) Firewall blocking port 8000, 4) CORS not configured. ";
          errorMsg += `Test server: Open terminal and run: curl ${API_URL}/`;
        } else {
          errorMsg += err.message;
        }
        setServerError(errorMsg);
      }
    };

    checkBackend();

    // Retry health check every 30 seconds if offline
    const healthCheckInterval = setInterval(() => {
      if (!backendStatus.online) {
        checkBackend();
      }
    }, 30000);

    return () => clearInterval(healthCheckInterval);
  }, [backendStatus.online]);
  // --- AUDIO ---
  const speak = (text) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- STYLES ---
  const getMapStyleURL = () => {
    switch (mapStyle) {
      case "satellite":
        return "mapbox://styles/mapbox/satellite-streets-v12";
      case "day":
        return "mapbox://styles/mapbox/outdoors-v12";
      case "night":
        return "mapbox://styles/mapbox/navigation-night-v1";
      default:
        return "mapbox://styles/mapbox/navigation-night-v1";
    }
  };

  // --- API HANDLERS ---

  // 1. ANALYZE ROUTE (POST Request with Graph Loading Support)
  const handleAnalyzeRoute = async () => {
    setAnalyzing(true);
    setServerError(null);
    setRouteData(null);
    setLoadingMessage("Connecting to AI engine...");
    speak("Analyzing tactical route.");

    try {
      // Zoom Map
      mapRef.current?.fitBounds(
        [
          [startCoords.lng, startCoords.lat],
          [endCoords.lng, endCoords.lat],
        ],
        { padding: 80, duration: 2000 },
      );

      console.log("📡 POSTING to:", `${API_URL}/analyze_route`);
      setLoadingMessage("Requesting route analysis...");

      // Set longer timeout for long-distance routes (graph download can take 2-3 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds (3 minutes)

      const response = await fetch(`${API_URL}/analyze_route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: startCoords.lat,
          start_lng: startCoords.lng,
          end_lat: endCoords.lat,
          end_lng: endCoords.lng,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend Error (${response.status}): ${errText}`);
      }

      setLoadingMessage("Processing route data...");
      const data = await response.json();
      console.log("✅ REAL DATA RECEIVED:", data);
      setRouteData(data);
      setLoadingMessage("");

      // Voice Feedback based on backend's 'type' field
      const riskType = data.type || data.route_risk;
      if (riskType === "DANGER")
        speak(
          `Warning. Danger detected. Risk score ${Math.round(data.confidence_score || data.confidence * 100)} percent.`,
        );
      else if (riskType === "CAUTION") speak(`Caution. Risk factors detected.`);
      else speak(`Route clear. Distance ${data.distance_km} kilometers.`);
    } catch (err) {
      console.error("❌ ERROR:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      setLoadingMessage("");

      if (err.name === "AbortError") {
        setServerError(
          "Request timeout. Long-distance routes may take 2-3 minutes on first request while downloading road network. Please try again.",
        );
        speak("Request timeout. Long distance route may need more time.");
      } else if (err.message.includes("Failed to fetch")) {
        setServerError(
          `Cannot connect to server at ${API_URL}. Check: 1) Server is running on DigitalOcean, 2) Port 8000 is open, 3) Firewall allows connections. Try: curl ${API_URL}/`,
        );
        speak("Cannot connect to server.");
      } else {
        setServerError(`Connection error: ${err.message}`);
        speak("Connection failed.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // 2. FIND NEAREST HOSPITAL (New Feature)
  const handleFindHospital = async () => {
    setFindingHospital(true);
    setServerError(null);
    setRouteData(null);
    setLoadingMessage("Searching for nearest hospital...");
    speak("Locating nearest medical facility.");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${API_URL}/nearest_hospital`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: startCoords.lat,
          lng: startCoords.lng,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("No hospitals reachable.");

      const data = await response.json();
      console.log("🏥 HOSPITAL DATA:", data);
      setLoadingMessage("");

      // Update UI with Hospital Route
      setRouteData({
        ...data,
        route_risk: "EMERGENCY", // Special UI flag
        confidence: 1.0,
        input_text_debug:
          data.input_text_debug ||
          "Emergency Search Strategy: Closest Node Algorithm",
      });

      // Update End Coords to show the hospital pin
      const destCoords = data.coordinates[data.coordinates.length - 1];
      setEndCoords({ lat: destCoords[1], lng: destCoords[0] });
      setEndQuery(`🏥 ${data.hospital_name || "NEAREST HOSPITAL"}`);

      speak(`Hospital located. Distance ${data.distance_km} kilometers.`);
    } catch (err) {
      console.error("❌ HOSPITAL ERROR:", err);
      console.error("Error type:", err.constructor.name, err.name);
      setLoadingMessage("");

      if (err.name === "AbortError") {
        setServerError(
          "Request timeout. Server may be initializing. Please try again.",
        );
        speak("Request timeout.");
      } else if (
        err.message.includes("Failed to fetch") ||
        err.name === "TypeError"
      ) {
        setServerError(
          `Network error. Server is online but browser cannot connect. Check browser console for CORS/SSL errors.`,
        );
        speak("Network error.");
      } else {
        setServerError(`Hospital search error: ${err.message}`);
        speak("Hospital search failed.");
      }
    } finally {
      setFindingHospital(false);
    }
  };

  // --- AUTOCOMPLETE ---
  const fetchSuggestions = async (query, setFunc) => {
    if (query.length < 3) {
      setFunc([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=in&bbox=90.0,22.0,96.0,29.0&types=place,locality`,
      );
      const data = await res.json();
      setFunc(data.features || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (feature, type) => {
    const [lng, lat] = feature.center;
    if (type === "start") {
      setStartCoords({ lat, lng });
      setStartQuery(feature.place_name);
      setStartSuggestions([]);
    } else {
      setEndCoords({ lat, lng });
      setEndQuery(feature.place_name);
      setEndSuggestions([]);
    }
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 1500 });
  };

  // --- HELPERS ---
  const getRiskType = () => {
    if (!routeData) return "SAFE";
    return routeData.type || routeData.route_risk || "SAFE";
  };

  const isDanger = ["DANGER", "BLOCKED", "CAUTION"].includes(getRiskType());
  const isEmergency = getRiskType() === "EMERGENCY";
  const riskColor = isDanger
    ? "text-red-400"
    : isEmergency
      ? "text-orange-400"
      : "text-emerald-400";
  const riskBg = isDanger
    ? "bg-red-500"
    : isEmergency
      ? "bg-orange-500"
      : "bg-emerald-500";

  return (
    <div className="h-screen w-full relative bg-black">
      {/* 🗺️ MAP ENGINE */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 91.7362, latitude: 26.1445, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={getMapStyleURL()}
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: "mapbox-dem", exaggeration: enable3D ? 3.0 : 1.5 }}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Pins */}
        <Marker
          longitude={startCoords.lng}
          latitude={startCoords.lat}
          anchor="bottom"
        >
          <div className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-pulse">
            <Navigation size={18} color="white" />
          </div>
        </Marker>
        <Marker
          longitude={endCoords.lng}
          latitude={endCoords.lat}
          anchor="bottom"
        >
          <div
            className={`p-2 rounded-full border-2 border-white shadow-xl ${routeData?.route_risk === "EMERGENCY" ? "bg-red-600 animate-pulse" : isDanger ? "bg-red-600" : "bg-emerald-500"}`}
          >
            {routeData?.route_risk === "EMERGENCY" ? (
              <Stethoscope size={18} color="white" />
            ) : (
              <MapPin size={18} color="white" />
            )}
          </div>
        </Marker>

        {/* Standard Route (Dashed) */}
        {routeData && showStandardRoute && routeData.coordinates_standard && (
          <Source
            id="route-standard"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeData.coordinates_standard,
              },
            }}
          >
            <Layer
              id="standard-line"
              type="line"
              paint={{
                "line-color": "#64748b",
                "line-width": 3,
                "line-opacity": 0.6,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}

        {/* Safe Route (Main) */}
        {routeData && (
          <Source
            id="route-path"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeData.coordinates,
              },
            }}
          >
            <Layer
              id="glow"
              type="line"
              paint={{
                "line-color": isEmergency
                  ? "#f97316"
                  : isDanger
                    ? "#ef4444"
                    : "#10b981",
                "line-width": 8,
                "line-opacity": 0.4,
                "line-blur": 6,
              }}
            />
            <Layer
              id="line"
              type="line"
              paint={{
                "line-color": isEmergency
                  ? "#fb923c"
                  : isDanger
                    ? "#ff4444"
                    : "#34d399",
                "line-width": 4,
              }}
            />
          </Source>
        )}
      </Map>

      {/* 🛠️ CONTROLS */}
      <div className="absolute inset-x-4 top-4 z-[1000] pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto space-y-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-slate-700 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-white font-black flex items-center gap-2.5 text-2xl mb-1">
                  <Brain className="text-blue-500" size={28} />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Drishti-NE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                  AI-Powered Disaster Routing System
                </p>
                {backendStatus.checking && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-yellow-400">
                    <Loader size={12} className="animate-spin" />
                    <span>Connecting to server...</span>
                  </div>
                )}
                {!backendStatus.checking && (
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${backendStatus.online ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" : "bg-red-400 shadow-lg shadow-red-400/50"}`}
                    ></span>
                    <span
                      className={`text-[10px] font-semibold ${backendStatus.online ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {backendStatus.online
                        ? "System Online"
                        : "System Offline"}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      • {backendStatus.message}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const styles = ["night", "day", "satellite"];
                    const currentIdx = styles.indexOf(mapStyle);
                    setMapStyle(styles[(currentIdx + 1) % styles.length]);
                  }}
                  className="p-3 rounded-xl border bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:bg-slate-700 transition-all duration-200"
                  title="Change map style"
                >
                  {mapStyle === "satellite" ? (
                    <Satellite size={18} className="text-slate-300" />
                  ) : mapStyle === "day" ? (
                    <Sun size={18} className="text-yellow-400" />
                  ) : (
                    <Navigation size={18} className="text-blue-400" />
                  )}
                </button>
                <button
                  onClick={() => setEnable3D(!enable3D)}
                  className={`p-3 rounded-xl border transition-all duration-200 ${enable3D ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50" : "bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:bg-slate-700"}`}
                  title="Toggle 3D terrain"
                >
                  <Activity size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* ERROR MSG */}
            {serverError && (
              <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-5 mb-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <ServerCrash size={20} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-bold text-sm mb-1">
                      Connection Error
                    </h3>
                    <p className="text-red-300 text-xs leading-relaxed">
                      {serverError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING MESSAGE */}
            {loadingMessage && (
              <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-2xl p-5 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3">
                  <Loader size={20} className="animate-spin text-blue-400" />
                  <div>
                    <p className="text-blue-400 font-semibold text-sm">
                      {loadingMessage}
                    </p>
                    <p className="text-blue-300 text-[10px] mt-0.5">
                      Please wait...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INPUTS (Show only if no route) */}
            {!routeData && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Navigation size={14} className="text-blue-400" />
                    Starting Point
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-blue-500 text-white px-4 py-4 rounded-xl text-sm transition-all duration-200 outline-none"
                      placeholder="Enter starting location..."
                      value={startQuery}
                      onChange={(e) => {
                        setStartQuery(e.target.value);
                        fetchSuggestions(e.target.value, setStartSuggestions);
                      }}
                    />
                    {startSuggestions.length > 0 && (
                      <div className="absolute w-full bg-slate-800 z-50 rounded-xl border-2 border-slate-700 mt-2 shadow-2xl overflow-hidden">
                        {startSuggestions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSelect(s, "start")}
                            className="p-3 hover:bg-slate-700 text-white text-xs cursor-pointer border-b border-slate-700/50 transition-colors duration-150"
                          >
                            <MapPin
                              size={12}
                              className="inline mr-2 text-blue-400"
                            />
                            {s.place_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Target size={14} className="text-emerald-400" />
                    Destination
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-emerald-500 text-white px-4 py-4 rounded-xl text-sm transition-all duration-200 outline-none"
                      placeholder="Enter destination..."
                      value={endQuery}
                      onChange={(e) => {
                        setEndQuery(e.target.value);
                        fetchSuggestions(e.target.value, setEndSuggestions);
                      }}
                    />
                    {endSuggestions.length > 0 && (
                      <div className="absolute w-full bg-slate-800 z-50 rounded-xl border-2 border-slate-700 mt-2 shadow-2xl overflow-hidden">
                        {endSuggestions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSelect(s, "end")}
                            className="p-3 hover:bg-slate-700 text-white text-xs cursor-pointer border-b border-slate-700/50 transition-colors duration-150"
                          >
                            <MapPin
                              size={12}
                              className="inline mr-2 text-emerald-400"
                            />
                            {s.place_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAnalyzeRoute}
                    disabled={analyzing || !backendStatus.online}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg disabled:shadow-none transition-all duration-200"
                  >
                    {analyzing ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Zap size={18} />
                    )}
                    <span>Analyze Route</span>
                  </button>
                  <button
                    onClick={handleFindHospital}
                    disabled={findingHospital || !backendStatus.online}
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg disabled:shadow-none transition-all duration-200"
                  >
                    {findingHospital ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Stethoscope size={18} />
                    )}
                    <span>Find Hospital</span>
                  </button>
                </div>
                {!backendStatus.online && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-3 text-center">
                    <p className="text-yellow-400 text-xs font-medium">
                      ⚠️ Waiting for server connection...
                    </p>
                  </div>
                )}
                {backendStatus.online && !routeData && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                    <p className="text-blue-300 text-[10px] text-center leading-relaxed">
                      💡 <span className="font-semibold">First request:</span>{" "}
                      May take 1-2 minutes for long-distance routes while
                      downloading road network data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* RESULTS (Show if route exists) */}
            {routeData && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                {/* HEADLINE STATUS */}
                <div
                  className={`p-6 rounded-2xl border-2 flex items-center gap-4 backdrop-blur-sm ${
                    isEmergency
                      ? "bg-orange-500/20 border-orange-500"
                      : isDanger
                        ? "bg-red-500/20 border-red-500"
                        : "bg-emerald-500/20 border-emerald-500"
                  }`}
                >
                  <div
                    className={`p-4 rounded-xl ${
                      isEmergency
                        ? "bg-orange-600 animate-pulse shadow-lg shadow-orange-600/50"
                        : isDanger
                          ? "bg-red-600 shadow-lg shadow-red-600/50"
                          : "bg-emerald-600 shadow-lg shadow-emerald-600/50"
                    } text-white`}
                  >
                    {isEmergency ? (
                      <Siren size={28} />
                    ) : isDanger ? (
                      <AlertTriangle size={28} />
                    ) : (
                      <Shield size={28} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-2xl font-black ${riskColor} mb-1`}>
                      {getRiskType()}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isEmergency
                              ? "bg-orange-500"
                              : isDanger
                                ? "bg-red-500"
                                : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${routeData.confidence_score || Math.round(routeData.confidence * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-300">
                        {routeData.confidence_score ||
                          Math.round(routeData.confidence * 100)}
                        % Risk
                      </span>
                    </div>
                  </div>
                </div>

                {/* REASON TEXT */}
                {routeData.reason && (
                  <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border-2 border-slate-700/50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={16}
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-xs text-slate-300 leading-relaxed flex-1">
                        {routeData.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <Ruler size={14} className="text-blue-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                        Distance
                      </p>
                    </div>
                    <p className="text-2xl font-black text-white">
                      {routeData.distance_km}
                      <span className="text-sm text-slate-400 ml-1 font-normal">
                        km
                      </span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <Activity size={14} className="text-purple-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                        Duration
                      </p>
                    </div>
                    <p className="text-2xl font-black text-white">
                      {Math.floor(routeData.duration_min / 60) > 0 && (
                        <span>{Math.floor(routeData.duration_min / 60)}h </span>
                      )}
                      {routeData.duration_min % 60}
                      <span className="text-sm text-slate-400 ml-1 font-normal">
                        min
                      </span>
                    </p>
                  </div>

                  {/* Weather Data */}
                  {routeData.weather_data && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                          <CloudRain size={14} className="text-cyan-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                          Rainfall
                        </p>
                      </div>
                      <p className="text-2xl font-black text-white">
                        {routeData.weather_data.rainfall_mm}
                        <span className="text-sm text-slate-400 ml-1 font-normal">
                          mm
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Terrain Data */}
                  {routeData.terrain_data && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-orange-500/20 rounded-lg">
                          <Activity size={14} className="text-orange-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                          Terrain Slope
                        </p>
                      </div>
                      <p className="text-2xl font-black text-white">
                        {routeData.terrain_data.slope_degrees}
                        <span className="text-sm text-slate-400 ml-1 font-normal">
                          degrees
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Expandable Data Panels */}
                {(routeData.weather_data ||
                  routeData.terrain_data ||
                  routeData.algorithm_metadata) && (
                  <div className="space-y-2">
                    {/* Weather Details */}
                    {routeData.weather_data && (
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                        <button
                          onClick={() =>
                            setExpandedPanel(
                              expandedPanel === "weather" ? null : "weather",
                            )
                          }
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CloudRain size={14} className="text-blue-400" />
                            <span className="text-xs font-bold text-white">
                              Weather Analysis
                            </span>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`text-slate-400 transition-transform ${expandedPanel === "weather" ? "rotate-90" : ""}`}
                          />
                        </button>
                        {expandedPanel === "weather" && (
                          <div className="p-3 pt-0 space-y-2 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Rainfall:</span>
                              <span className="text-white font-mono">
                                {routeData.weather_data.rainfall_mm}mm
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Region:</span>
                              <span className="text-white font-mono">
                                {routeData.weather_data.region || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Source:</span>
                              <span className="text-white font-mono text-[9px]">
                                {routeData.weather_data.source}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Terrain Details */}
                    {routeData.terrain_data && (
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                        <button
                          onClick={() =>
                            setExpandedPanel(
                              expandedPanel === "terrain" ? null : "terrain",
                            )
                          }
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-orange-400" />
                            <span className="text-xs font-bold text-white">
                              Terrain Analysis
                            </span>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`text-slate-400 transition-transform ${expandedPanel === "terrain" ? "rotate-90" : ""}`}
                          />
                        </button>
                        {expandedPanel === "terrain" && (
                          <div className="p-3 pt-0 space-y-2 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Slope:</span>
                              <span className="text-white font-mono">
                                {routeData.terrain_data.slope_degrees}°
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Type:</span>
                              <span className="text-white font-mono">
                                {routeData.terrain_data.terrain_type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Soil:</span>
                              <span className="text-white font-mono">
                                {routeData.terrain_data.soil_type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Stability:</span>
                              <span className="text-white font-mono text-[9px]">
                                {routeData.terrain_data.stability}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Algorithm Metadata */}
                    {routeData.algorithm_metadata && (
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                        <button
                          onClick={() =>
                            setExpandedPanel(
                              expandedPanel === "algorithm"
                                ? null
                                : "algorithm",
                            )
                          }
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Brain size={14} className="text-purple-400" />
                            <span className="text-xs font-bold text-white">
                              AI Algorithm
                            </span>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`text-slate-400 transition-transform ${expandedPanel === "algorithm" ? "rotate-90" : ""}`}
                          />
                        </button>
                        {expandedPanel === "algorithm" && (
                          <div className="p-3 pt-0 space-y-2 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Algorithm:</span>
                              <span className="text-white font-mono text-[9px]">
                                {routeData.algorithm_metadata.algorithm}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Device:</span>
                              <span className="text-white font-mono">
                                {routeData.algorithm_metadata.device}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Graph Nodes:
                              </span>
                              <span className="text-white font-mono">
                                {routeData.algorithm_metadata.graph_nodes}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Graph Edges:
                              </span>
                              <span className="text-white font-mono">
                                {routeData.algorithm_metadata.graph_edges}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                              <CheckCircle2
                                size={12}
                                className={
                                  routeData.algorithm_metadata.using_real_model
                                    ? "text-emerald-400"
                                    : "text-yellow-400"
                                }
                              />
                              <span className="text-slate-400">
                                Model:{" "}
                                {routeData.algorithm_metadata.using_real_model
                                  ? "DistilBERT Active"
                                  : "Fallback Mode"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Route Comparison Toggle */}
                {routeData.coordinates_standard &&
                  routeData.route_comparison && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-500/20 rounded-lg">
                            <ArrowRight size={14} className="text-purple-400" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            Route Comparison
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setShowStandardRoute(!showStandardRoute)
                          }
                          className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${showStandardRoute ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                        >
                          {showStandardRoute ? "Hide" : "Show"} Standard
                        </button>
                      </div>
                      {routeData.route_comparison.rerouted && (
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                          <AlertTriangle
                            size={12}
                            className="text-yellow-400"
                          />
                          <p className="text-[10px] text-yellow-400 font-medium">
                            AI detected risks and calculated safer alternative
                            route
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* DEBUG PROOF (Required by your prompt) */}
                <div className="bg-gradient-to-br from-blue-950/30 to-slate-900/30 p-4 rounded-xl border-2 border-blue-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Terminal size={14} className="text-blue-400" />
                    </div>
                    <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wide">
                      AI Processing Details
                    </span>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                      {routeData.input_text_debug}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRouteData(null);
                    setServerError(null);
                    setShowStandardRoute(false);
                    setExpandedPanel(null);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-700 hover:to-slate-600 border-2 border-slate-700/50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <XCircle size={16} />
                  <span>Plan New Route</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
