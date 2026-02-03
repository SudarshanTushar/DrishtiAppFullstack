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
  MapPin,
  Loader,
  Satellite,
  CloudRain,
  XCircle,
  Zap,
  Target,
  Stethoscope,
  Sun,
  WifiOff,
  CheckCircle,
} from "lucide-react";
import { useI18n } from "../i18n";

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
  const [serverError, setServerError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    checking: true,
  });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [findingHospital, setFindingHospital] = useState(false);
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
          setBackendStatus({ online: true, checking: false });
        } else {
          throw new Error("Server responded with error");
        }
      } catch (err) {
        console.error("❌ Backend health check failed:", err);
        setBackendStatus({ online: false, checking: false });
        setServerError("Unable to connect to navigation service");
      }
    };

    checkBackend();
    const healthCheckInterval = setInterval(() => {
      if (!backendStatus.online) {
        checkBackend();
      }
    }, 30000);

    return () => clearInterval(healthCheckInterval);
  }, [backendStatus.online]);

  // --- VOICE FEEDBACK (CALM LANGUAGE ONLY) ---
  const speak = (text) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- MAP STYLE ---
  const getMapStyleURL = () => {
    switch (mapStyle) {
      case "satellite":
        return "mapbox://styles/mapbox/satellite-streets-v12";
      case "day":
        return "mapbox://styles/mapbox/streets-v12";
      default:
        return "mapbox://styles/mapbox/dark-v11";
    }
  };

  // --- ROUTE ANALYSIS ---
  const handleAnalyzeRoute = async () => {
    setAnalyzing(true);
    setServerError(null);
    setRouteData(null);
    setLoadingMessage("Calculating safest route...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(`${API_URL}/analyze`, {
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
        throw new Error("Unable to calculate route");
      }

      setLoadingMessage("");
      const data = await response.json();
      setRouteData(data);

      // UX-COMPLIANT VOICE FEEDBACK (NO TECHNICAL TERMS)
      const riskType = data.type || data.route_risk;
      if (riskType === "DANGER") {
        speak("Route found. Avoiding hazardous areas.");
      } else if (riskType === "CAUTION") {
        speak("Route calculated. Some areas require caution.");
      } else {
        speak(`Route ready. ${data.distance_km} kilometers.`);
      }
    } catch (err) {
      console.error("❌ ERROR:", err);
      setLoadingMessage("");

      if (err.name === "AbortError") {
        setServerError(
          "Request taking longer than expected. Please try again.",
        );
        speak("Request timeout. Please try again.");
      } else {
        setServerError("Unable to calculate route at this time");
        speak("Unable to calculate route.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // --- HOSPITAL SEARCH ---
  const handleFindHospital = async () => {
    setFindingHospital(true);
    setServerError(null);
    setRouteData(null);
    setLoadingMessage("Locating nearest medical facility...");
    speak("Searching for nearest hospital.");

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
      setLoadingMessage("");
      setRouteData({
        ...data,
        route_risk: "EMERGENCY",
        confidence: 1.0,
      });

      const destCoords = data.coordinates[data.coordinates.length - 1];
      setEndCoords({ lat: destCoords[1], lng: destCoords[0] });
      setEndQuery(`🏥 ${data.hospital_name || "NEAREST HOSPITAL"}`);

      speak(`Hospital located. ${data.distance_km} kilometers away.`);
    } catch (err) {
      console.error("❌ HOSPITAL ERROR:", err);
      setLoadingMessage("");
      setServerError("Unable to locate nearby hospitals");
      speak("Hospital search failed.");
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

  // --- RISK LEVEL (UX COMPLIANT) ---
  const getRiskLevel = () => {
    if (!routeData) return "SAFE";
    const type = routeData.type || routeData.route_risk || "SAFE";
    return type;
  };

  const isDanger = ["DANGER", "BLOCKED", "CAUTION"].includes(getRiskLevel());
  const isEmergency = getRiskLevel() === "EMERGENCY";

  // UX COLORS (SIMPLE TRAFFIC LIGHT SYSTEM)
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

  // --- HUMAN-READABLE EXPLANATIONS (NO TECHNICAL JARGON) ---
  const getRouteExplanation = () => {
    if (!routeData) return null;

    const riskType = getRiskLevel();

    if (riskType === "DANGER") {
      return "This route avoids areas with steep slopes and unstable terrain.";
    } else if (riskType === "CAUTION") {
      return "Route adjusted to avoid potential hazards.";
    } else if (riskType === "EMERGENCY") {
      return "Fastest route to medical facility.";
    } else {
      return "Route is clear and safe to travel.";
    }
  };

  // --- ROUTE LAYER (SINGLE ROUTE ONLY) ---
  const routeGeoJSON = routeData
    ? {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeData.coordinates,
        },
      }
    : null;

  return (
    <div className="h-screen w-full relative bg-black">
      {/* 🗺️ MAP */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 91.7362, latitude: 26.1445, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={getMapStyleURL()}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Start Marker */}
        <Marker
          longitude={startCoords.lng}
          latitude={startCoords.lat}
          anchor="bottom"
        >
          <div className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
            <Navigation size={18} color="white" />
          </div>
        </Marker>

        {/* End Marker */}
        <Marker
          longitude={endCoords.lng}
          latitude={endCoords.lat}
          anchor="bottom"
        >
          <div
            className={`${isEmergency ? "bg-red-600" : "bg-emerald-600"} p-2 rounded-full border-2 border-white shadow-lg`}
          >
            {isEmergency ? (
              <Stethoscope size={18} color="white" />
            ) : (
              <Target size={18} color="white" />
            )}
          </div>
        </Marker>

        {/* SINGLE RECOMMENDED ROUTE (NO ALTERNATIVES) */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": isDanger
                  ? "#ef4444"
                  : isEmergency
                    ? "#f97316"
                    : "#10b981",
                "line-width": 6,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}
      </Map>

      {/* 🎛️ CONTROL PANEL */}
      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl border-l border-slate-800 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">Safe Route</h1>
              {/* OFFLINE INDICATOR */}
              {!backendStatus.online && !backendStatus.checking && (
                <div className="flex items-center gap-2 mt-2 text-yellow-400 text-xs">
                  <WifiOff size={14} />
                  <span>Using offline safety data</span>
                </div>
              )}
              {backendStatus.online && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs">
                  <CheckCircle size={14} />
                  <span>Connected</span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                const styles = ["night", "day", "satellite"];
                const currentIdx = styles.indexOf(mapStyle);
                setMapStyle(styles[(currentIdx + 1) % styles.length]);
              }}
              className="p-3 rounded-xl border bg-slate-800/80 border-slate-700 hover:border-blue-500 transition-all"
              title="Change map view"
            >
              {mapStyle === "satellite" ? (
                <Satellite size={18} className="text-slate-300" />
              ) : mapStyle === "day" ? (
                <Sun size={18} className="text-yellow-400" />
              ) : (
                <Navigation size={18} className="text-blue-400" />
              )}
            </button>
          </div>

          {/* ERROR MESSAGE (CALM LANGUAGE) */}
          {serverError && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-400" />
                <div className="flex-1">
                  <p className="text-yellow-300 text-sm">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          {/* LOADING MESSAGE */}
          {loadingMessage && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Loader size={20} className="animate-spin text-blue-400" />
                <p className="text-blue-400 text-sm">{loadingMessage}</p>
              </div>
            </div>
          )}

          {/* ROUTE INPUTS (SHOW ONLY IF NO ROUTE) */}
          {!routeData && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-2">
                  <Navigation size={14} className="text-blue-400" />
                  From
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-blue-500 text-white px-4 py-4 rounded-xl text-sm transition-all outline-none"
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
                          className="p-3 hover:bg-slate-700 text-white text-xs cursor-pointer border-b border-slate-700/50"
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
                <label className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-2">
                  <Target size={14} className="text-emerald-400" />
                  To
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-800/80 border-2 border-slate-700 focus:border-emerald-500 text-white px-4 py-4 rounded-xl text-sm transition-all outline-none"
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
                          className="p-3 hover:bg-slate-700 text-white text-xs cursor-pointer border-b border-slate-700/50"
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
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg transition-all"
                >
                  {analyzing ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Zap size={18} />
                  )}
                  <span>Find Route</span>
                </button>
                <button
                  onClick={handleFindHospital}
                  disabled={findingHospital || !backendStatus.online}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg transition-all"
                >
                  {findingHospital ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Stethoscope size={18} />
                  )}
                  <span>Hospital</span>
                </button>
              </div>
            </div>
          )}

          {/* ROUTE RESULT (UX-COMPLIANT DISPLAY) */}
          {routeData && (
            <div className="space-y-4">
              {/* RISK INDICATOR (COLOR-CODED, NO NUMBERS) */}
              <div className={`${riskBg} rounded-xl p-6 text-white shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold uppercase tracking-wide">
                    {isDanger
                      ? "Caution Required"
                      : isEmergency
                        ? "Emergency Route"
                        : "Route Clear"}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${riskBg} shadow-lg animate-pulse`}
                  ></div>
                </div>
                <p className="text-2xl font-bold mb-1">
                  {routeData.distance_km} km
                </p>
                <p className="text-xs opacity-90">
                  Estimated time: {routeData.eta || "Calculating..."}
                </p>
              </div>

              {/* SIMPLE EXPLANATION (NO TECHNICAL TERMS) */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white text-xs font-bold mb-2 uppercase">
                  Why this route?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {getRouteExplanation()}
                </p>
              </div>

              {/* WEATHER INFO (SIMPLE, ICON-BASED) */}
              {routeData.weather_data && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <CloudRain size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white text-xs font-bold">
                        Current Weather
                      </p>
                      <p className="text-slate-400 text-xs">
                        Rainfall: {routeData.weather_data.rainfall_mm}mm
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ALERT BANNER (CALM LANGUAGE) */}
              {isDanger && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-3">
                  <p className="text-yellow-400 text-xs">
                    Route adjusted to avoid difficult terrain
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setRouteData(null);
                  setServerError(null);
                }}
                className="w-full py-4 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 border-2 border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                <span>New Route</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
