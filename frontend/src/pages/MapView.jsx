import React, { useState, useEffect } from "react";
import {
  Navigation,
  Shield,
  Target,
  X,
  Search,
  Loader,
  Compass,
  Layers,
  Satellite,
} from "lucide-react";
import MapboxMap from "../components/MapboxMap";
import { API_BASE_URL } from "../config";

// MAPBOX GEOCODING TOKEN
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

const MapView = () => {
  // Core state
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [startCoords, setStartCoords] = useState([26.1445, 91.7362]); // Guwahati
  const [destCoords, setDestCoords] = useState([25.5788, 91.8933]); // Shillong
  const [currentLocation, setCurrentLocation] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Search state
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Safety scan state
  const [scanningRoute, setScanningRoute] = useState(false);
  const [safetyReport, setSafetyReport] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapStyle, setMapStyle] = useState("streets");

  // Get current location on mount
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          setStartCoords(coords);
          setStartLocation("Current Location");
        },
        (error) => {
          console.warn("Geolocation error:", error);
        },
      );
    }
  }, [useCurrentLocation]);

  // ====================
  // MAPBOX GEOCODING SEARCH
  // ====================
  const searchMapboxLocation = async (query, isStart) => {
    if (!query || query.length < 3) {
      if (isStart) {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setDestSuggestions([]);
        setShowDestSuggestions(false);
      }
      return;
    }

    if (isStart) setSearchingStart(true);
    else setSearchingDest(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${MAPBOX_TOKEN}&` +
          `country=IN&` +
          `limit=6&` +
          `types=place,locality,neighborhood,address,poi`,
      );

      const data = await response.json();

      const suggestions = data.features.map((feature) => ({
        name: feature.place_name,
        center: feature.center, // [lng, lat]
        placeName: feature.text,
        context: feature.context?.map((c) => c.text).join(", ") || "",
      }));

      if (isStart) {
        setStartSuggestions(suggestions);
        setShowStartSuggestions(suggestions.length > 0);
      } else {
        setDestSuggestions(suggestions);
        setShowDestSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
      setSearchError("Search failed. Check network or token.");
    } finally {
      if (isStart) setSearchingStart(false);
      else setSearchingDest(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (startLocation && !useCurrentLocation) {
        searchMapboxLocation(startLocation, true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [startLocation, useCurrentLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination) {
        searchMapboxLocation(destination, false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [destination]);

  // Select location from suggestions
  const selectLocation = (suggestion, isStart) => {
    if (isStart) {
      setStartLocation(suggestion.name);
      setStartCoords([suggestion.center[1], suggestion.center[0]]); // Convert to [lat, lng]
      setShowStartSuggestions(false);
      setUseCurrentLocation(false);
    } else {
      setDestination(suggestion.name);
      setDestCoords([suggestion.center[1], suggestion.center[0]]);
      setShowDestSuggestions(false);
    }
  };

  // Clear functions
  const clearStartLocation = () => {
    setStartLocation("");
    setStartCoords([26.1445, 91.7362]);
    setUseCurrentLocation(false);
    setStartSuggestions([]);
  };

  const clearDestination = () => {
    setDestination("");
    setDestCoords([25.5788, 91.8933]);
    setDestSuggestions([]);
  };

  // ====================
  // SAFETY SCAN (CORE FEATURE)
  // ====================
  const runSafetyScan = async () => {
    setScanningRoute(true);
    setSafetyReport(null);
    setScanError(null);

    // Pre-compute straight-line distance as a fallback (in km)
    const fallbackDistanceKm = getDistanceKm(startCoords, destCoords);

    try {
      // Call backend /analyze endpoint
      const response = await fetch(
        `${API_BASE_URL}/analyze?` +
          `start_lat=${startCoords[0]}&` +
          `start_lng=${startCoords[1]}&` +
          `end_lat=${destCoords[0]}&` +
          `end_lng=${destCoords[1]}`,
      );

      const data = await response.json();

      // Normalize distance display
      const normalizedDistance = (() => {
        const raw = data.distance;
        const numeric = parseFloat(raw);
        if (!Number.isNaN(numeric) && numeric > 0) {
          return `${numeric.toFixed(1)} km`;
        }
        return `${fallbackDistanceKm.toFixed(1)} km`;
      })();

      // Build comprehensive safety report with all risk factors
      const report = {
        riskLevel: data.route_risk || "UNKNOWN",
        riskScore: data.confidence_score || 0,
        reason: data.reason || "No risk data available",
        source: data.source || "System",
        distance: normalizedDistance,
        terrainType: data.terrain_data?.type || "Unknown",
        slope: data.terrain_data?.slope || "Unknown",
        soilType: data.terrain_data?.soil || "Unknown",
        // Enhanced risk breakdown
        riskBreakdown: data.risk_breakdown || {},
        recommendations: data.recommendations || [],
        alerts: data.alerts || [],
        weatherData: data.weather_data || {},
        timestamp: data.timestamp || new Date().toISOString(),
      };

      // Generate mock route GeoJSON (in production, use Mapbox Directions API)
      const routeGeoJSON = generateRouteGeoJSON(startCoords, destCoords);

      setSafetyReport(report);
      setRouteGeoJSON(routeGeoJSON);
    } catch (error) {
      console.error("Safety scan error:", error);
      setSafetyReport({
        riskLevel: "UNKNOWN",
        riskScore: 0,
        reason: "Failed to analyze route. Please try again.",
        source: "Error",
        distance: "Unknown",
      });
      setScanError("Route analysis failed. Check connectivity or retry.");
    } finally {
      setScanningRoute(false);
    }
  };

  // Generate route GeoJSON (simplified - in production use Mapbox Directions API)
  const generateRouteGeoJSON = (start, end) => {
    // Simple interpolation for demo
    const steps = 20;
    const coordinates = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      // Add slight curve for visual interest
      const offset = Math.sin(t * Math.PI) * 0.05;
      coordinates.push([lng + offset, lat]);
    }

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates,
      },
      properties: {},
    };
  };

  // Haversine distance in km
  const getDistanceKm = (start, end) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(end[0] - start[0]);
    const dLng = toRad(end[1] - start[1]);
    const lat1 = toRad(start[0]);
    const lat2 = toRad(end[0]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start navigation
  const startNavigation = () => {
    setIsNavigating(true);
  };

  // Reset view
  const resetView = () => {
    setSafetyReport(null);
    setRouteGeoJSON(null);
    setIsNavigating(false);
  };

  const getRiskStyles = (riskLevel = "UNKNOWN") => {
    const level = riskLevel.toUpperCase();
    if (
      level.includes("HIGH") ||
      level.includes("DANGER") ||
      level.includes("CRIT")
    )
      return { pill: "bg-red-100 text-red-700", dot: "bg-red-500" };
    if (
      level.includes("MED") ||
      level.includes("CAUTION") ||
      level.includes("MOD")
    )
      return { pill: "bg-amber-100 text-amber-800", dot: "bg-amber-500" };
    if (level.includes("LOW") || level.includes("SAFE"))
      return { pill: "bg-green-100 text-green-800", dot: "bg-green-500" };
    return { pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <MapboxMap
          startCoords={startCoords}
          destCoords={destCoords}
          currentLocation={currentLocation}
          routeData={routeGeoJSON}
          riskLevel={safetyReport?.riskLevel || "UNKNOWN"}
          mapStyle={mapStyle}
          isNavigating={isNavigating}
        />
      </div>

      {/* TOP SEARCH + STYLE TOGGLE */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-white/80 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-300" />
              <span className="font-semibold">Live Safety Routing</span>
              {currentLocation && (
                <span className="flex items-center gap-1 text-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  GPS
                </span>
              )}
            </div>
            <div className="bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center overflow-hidden border border-slate-200">
              <button
                className={`px-4 py-2 text-[11px] font-bold flex items-center gap-2 transition-all ${
                  mapStyle === "streets"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700"
                }`}
                onClick={() => setMapStyle("streets")}
              >
                <Layers size={14} />
                Streets
              </button>
              <button
                className={`px-4 py-2 text-[11px] font-bold flex items-center gap-2 transition-all ${
                  mapStyle === "satellite"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700"
                }`}
                onClick={() => setMapStyle("satellite")}
              >
                <Satellite size={14} />
                Satellite
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-200 p-4 pointer-events-auto space-y-4">
            {/* Start location */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">
                  Start
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => {
                      setStartLocation(e.target.value);
                      setUseCurrentLocation(false);
                    }}
                    onFocus={() => {
                      if (startSuggestions.length > 0)
                        setShowStartSuggestions(true);
                    }}
                    placeholder="Use GPS or type start"
                    className="flex-1 bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    disabled={isNavigating}
                  />
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3 h-3"
                      checked={useCurrentLocation}
                      onChange={(e) => {
                        setUseCurrentLocation(e.target.checked);
                        if (e.target.checked && currentLocation) {
                          setStartCoords(currentLocation);
                          setStartLocation("Current Location");
                          setShowStartSuggestions(false);
                        }
                      }}
                      disabled={isNavigating}
                    />
                    GPS
                  </label>
                  {startLocation && !searchingStart && !useCurrentLocation && (
                    <button
                      onClick={clearStartLocation}
                      className="p-2 hover:bg-slate-100 rounded-xl"
                      aria-label="Clear start"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  )}
                  {searchingStart && (
                    <Loader size={16} className="animate-spin text-blue-600" />
                  )}
                </div>
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div className="mt-3 -mx-4 rounded-2xl border border-green-200 bg-white shadow-xl max-h-64 overflow-y-auto">
                    {startSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocation(suggestion, true)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <Shield size={16} className="text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {suggestion.placeName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {suggestion.context}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col gap-1 text-[11px] text-slate-500 pr-1">
                <span className="font-semibold">From</span>
                <span className="font-bold text-slate-800">
                  {useCurrentLocation
                    ? "Current location"
                    : startLocation || "Set start"}
                </span>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">
                  Destination
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => {
                      if (destSuggestions.length > 0)
                        setShowDestSuggestions(true);
                    }}
                    placeholder="Enter destination"
                    className="flex-1 bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    disabled={isNavigating}
                  />
                  {destination && !searchingDest && (
                    <button
                      onClick={clearDestination}
                      className="p-2 hover:bg-slate-100 rounded-xl"
                      aria-label="Clear destination"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  )}
                  {searchingDest && (
                    <Loader size={16} className="animate-spin text-blue-600" />
                  )}
                </div>
                {scanError && (
                  <p className="text-[11px] text-red-600 mt-1">{scanError}</p>
                )}
              </div>
              <div className="hidden sm:flex flex-col gap-1 text-[11px] text-slate-500 pr-1">
                <span className="font-semibold">To</span>
                <span className="font-bold text-slate-800">
                  {destination || "Select destination"}
                </span>
              </div>
            </div>

            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="mt-3 -mx-4 rounded-2xl border border-blue-200 bg-white shadow-xl max-h-64 overflow-y-auto">
                {destSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(suggestion, false)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <Target size={16} className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {suggestion.placeName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {suggestion.context}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={runSafetyScan}
                disabled={
                  (!useCurrentLocation && !startLocation) ||
                  !destination ||
                  scanningRoute
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Route Safety
              </button>
              <button
                onClick={resetView}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 active:scale-95 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCANNING OVERLAY */}
      {scanningRoute && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl max-w-md mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Loader size={48} className="animate-spin text-blue-500" />
                <Shield
                  size={24}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300"
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg mb-2">
                  Safety Scan in Progress
                </p>
                <p className="text-sm text-slate-400">
                  Analyzing terrain, hazards, and risk factors...
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET SUMMARY */}
      {safetyReport && (
        <div className="absolute inset-x-0 bottom-0 z-[1000] px-4 pb-6 pointer-events-none">
          <div className="max-w-4xl mx-auto bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 p-5 pointer-events-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Compass size={16} className="text-blue-600" />
                  {isNavigating ? "Navigation locked" : "Route ready"}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {startLocation || "Current location"} →{" "}
                  {destination || "Destination"}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span
                    className={`px-2 py-1 rounded-full font-bold ${getRiskStyles(safetyReport.riskLevel).pill}`}
                  >
                    Risk: {safetyReport.riskLevel}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800 font-mono">
                    Confidence: {safetyReport.riskScore || 0}%
                  </span>
                  {safetyReport.distance && (
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800 font-mono">
                      {safetyReport.distance}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 justify-end">
                  <span
                    className={`w-2 h-2 rounded-full ${getRiskStyles(safetyReport.riskLevel).dot}`}
                  />
                  <span className="font-semibold">
                    {safetyReport.source || "System"}
                  </span>
                </div>
                <div className="font-mono text-slate-600">
                  {new Date(
                    safetyReport.timestamp || Date.now(),
                  ).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="font-semibold text-slate-500 mb-1">Distance</p>
                <p className="text-base font-black text-slate-900">
                  {safetyReport.distance}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="font-semibold text-slate-500 mb-1">Terrain</p>
                <p className="text-sm font-bold text-slate-900">
                  {safetyReport.terrainType}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="font-semibold text-slate-500 mb-1">Slope</p>
                <p className="text-sm font-bold text-slate-900">
                  {safetyReport.slope}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={isNavigating ? resetView : startNavigation}
                className={`flex-1 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  isNavigating
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Navigation size={18} />
                {isNavigating ? "End Navigation" : "Start Navigation"}
              </button>
              {!isNavigating && (
                <button
                  onClick={resetView}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION STRIP */}
      {isNavigating && (
        <div className="absolute top-4 left-0 right-0 z-[1000] px-4 pointer-events-none">
          <div
            className={`max-w-4xl mx-auto p-4 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto ${
              safetyReport?.riskLevel === "SAFE" ||
              safetyReport?.riskLevel === "LOW"
                ? "bg-green-600"
                : safetyReport?.riskLevel === "MODERATE" ||
                    safetyReport?.riskLevel === "CAUTION"
                  ? "bg-yellow-600"
                  : "bg-red-600"
            } text-white`}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-bold">Navigation Active</p>
                <p className="text-xs opacity-90">
                  {safetyReport?.riskLevel} • {safetyReport?.distance}
                </p>
              </div>
            </div>
            <button
              onClick={resetView}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* SOS BUTTON */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
        <button className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl shadow-2xl active:scale-95 transition-all">
          SOS
        </button>
      </div>
    </div>
  );
};

export default MapView;
