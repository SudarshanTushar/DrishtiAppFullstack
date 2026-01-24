import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// MAPBOX TOKEN
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg";

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapboxMap = ({
  startCoords,
  destCoords,
  currentLocation,
  routeData = null,
  riskLevel = "UNKNOWN",
  mapStyle = "streets",
  isNavigating = false,
  onMapLoad = () => {},
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const lastStyleRef = useRef(mapStyle);

  const startMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const navMarkerRef = useRef(null);
  const navAnimRef = useRef(null);

  const restyleAttribution = () => {
    const container = mapContainer.current;
    if (!container) return;

    const logo = container.querySelector(".mapboxgl-ctrl-logo");
    if (logo) {
      logo.style.pointerEvents = "none";
      logo.style.opacity = "0.6";
      logo.style.transform = "scale(0.85)";
      logo.style.filter = "grayscale(100%)";
    }

    const attrib = container.querySelector(".mapboxgl-ctrl-attrib");
    if (attrib) {
      attrib.style.pointerEvents = "none";
      attrib.style.opacity = "0.65";
      attrib.style.fontSize = "10px";
      attrib.style.background = "rgba(15, 23, 42, 0.55)";
      attrib.style.color = "#e2e8f0";
      attrib.style.padding = "2px 6px";
      attrib.style.borderRadius = "6px";
      attrib.style.backdropFilter = "blur(2px)";
    }
  };

  // Map style URLs
  const styleUrls = {
    streets: "mapbox://styles/mapbox/streets-v12",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  // Initialize map once
  useEffect(() => {
    if (offlineMode) return;
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrls[mapStyle],
        center: [startCoords[1], startCoords[0]],
        zoom: 10,
      });
    } catch (error) {
      console.error("❌ Failed to create map:", error);
      return;
    }

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }),
      "bottom-left",
    );

    map.current.on("load", () => {
      setMapReady(true);
      onMapLoad(map.current);
      map.current.resize();
      restyleAttribution();
    });

    map.current.on("error", (e) => {
      console.error("❌ Map error:", e);
      if (e?.error?.status === 0 || e?.type === "error") {
        setOfflineMode(true);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [offlineMode]);

  // Listen for online/offline changes
  useEffect(() => {
    const goOffline = () => setOfflineMode(true);
    const goOnline = () => setOfflineMode(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Apply style without recreating the map
  useEffect(() => {
    if (!map.current || offlineMode) return;
    if (lastStyleRef.current === mapStyle) return;

    const handleStyle = () => {
      if (map.current?.isStyleLoaded()) {
        setMapReady(true);
      }
    };

    lastStyleRef.current = mapStyle;
    setMapReady(false); // force downstream effects to rerun after style switch
    map.current.setStyle(styleUrls[mapStyle]);
    map.current.once("style.load", handleStyle);
    map.current.once("style.load", restyleAttribution);

    return () => {
      if (map.current) {
        map.current.off("style.load", handleStyle);
      }
    };
  }, [mapStyle, offlineMode]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current || !mapReady || !map.current.isStyleLoaded()) return;

    if (startMarkerRef.current) startMarkerRef.current.remove();
    if (destMarkerRef.current) destMarkerRef.current.remove();
    if (currentMarkerRef.current) currentMarkerRef.current.remove();

    const startEl = document.createElement("div");
    startEl.style.cssText = `
      width: 32px;
      height: 32px;
      background-color: #10b981;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    startMarkerRef.current = new mapboxgl.Marker(startEl)
      .setLngLat([startCoords[1], startCoords[0]])
      .setPopup(new mapboxgl.Popup().setHTML("<strong>📍 Start</strong>"))
      .addTo(map.current);

    const destEl = document.createElement("div");
    destEl.style.cssText = `
      width: 32px;
      height: 32px;
      background-color: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    destMarkerRef.current = new mapboxgl.Marker(destEl)
      .setLngLat([destCoords[1], destCoords[0]])
      .setPopup(new mapboxgl.Popup().setHTML("<strong>🎯 Destination</strong>"))
      .addTo(map.current);

    if (currentLocation) {
      const currentEl = document.createElement("div");
      currentEl.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      `;
      currentMarkerRef.current = new mapboxgl.Marker(currentEl)
        .setLngLat([currentLocation[1], currentLocation[0]])
        .addTo(map.current);
    }

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([startCoords[1], startCoords[0]]);
    bounds.extend([destCoords[1], destCoords[0]]);
    if (currentLocation)
      bounds.extend([currentLocation[1], currentLocation[0]]);

    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 120, left: 60, right: 60 },
      maxZoom: 14,
    });
  }, [mapReady, startCoords, destCoords, currentLocation]);

  // Add route when available
  useEffect(() => {
    if (!map.current || !mapReady || !routeData || !map.current.isStyleLoaded())
      return;

    const routeColors = {
      SAFE: "#10b981",
      MODERATE: "#f59e0b",
      CAUTION: "#f59e0b",
      CRITICAL: "#ef4444",
      DANGEROUS: "#dc2626",
      UNKNOWN: "#64748b",
    };

    const source = map.current.getSource("route");
    if (source) {
      source.setData(routeData);
    } else {
      map.current.addSource("route", {
        type: "geojson",
        data: routeData,
      });
    }

    if (!map.current.getLayer("route-line")) {
      map.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": routeColors[riskLevel] || routeColors.UNKNOWN,
          "line-width": 6,
          "line-opacity": 0.9,
        },
      });
    } else {
      map.current.setPaintProperty(
        "route-line",
        "line-color",
        routeColors[riskLevel] || routeColors.UNKNOWN,
      );
    }

    if (routeData.geometry?.coordinates) {
      const coordinates = routeData.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      map.current.fitBounds(bounds, { padding: 120, maxZoom: 14 });
    }
  }, [mapReady, routeData, riskLevel]);

  // Emphasize route line while navigating
  useEffect(() => {
    if (!map.current || !mapReady || !map.current.getLayer("route-line"))
      return;
    map.current.setPaintProperty(
      "route-line",
      "line-width",
      isNavigating ? 8 : 6,
    );
  }, [isNavigating, mapReady]);

  // Keep camera following during navigation
  useEffect(() => {
    if (!map.current || !mapReady || !routeData || !isNavigating) return;
    if (!routeData.geometry?.coordinates?.length) return;

    const coordinates = routeData.geometry.coordinates;
    const bounds = coordinates.reduce(
      (acc, coord) => acc.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
    );

    map.current.fitBounds(bounds, {
      padding: 120,
      maxZoom: 15,
      duration: 1200,
    });
  }, [isNavigating, mapReady, routeData]);

  // Simulated navigation puck moving along the route
  useEffect(() => {
    if (!map.current || !mapReady || !routeData?.geometry?.coordinates?.length)
      return;

    // Clear any previous animation
    if (navAnimRef.current) {
      clearInterval(navAnimRef.current);
      navAnimRef.current = null;
    }
    if (navMarkerRef.current) {
      navMarkerRef.current.remove();
      navMarkerRef.current = null;
    }

    if (!isNavigating) return;

    const coords = routeData.geometry.coordinates;
    const navEl = document.createElement("div");
    navEl.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
    `;
    navMarkerRef.current = new mapboxgl.Marker(navEl)
      .setLngLat(coords[0])
      .addTo(map.current);

    map.current.easeTo({
      center: coords[0],
      zoom: 15,
      pitch: 45,
      bearing: map.current.getBearing(),
      duration: 800,
    });

    let idx = 0;
    const total = coords.length;
    navAnimRef.current = setInterval(() => {
      idx = Math.min(idx + 1, total - 1);
      const point = coords[idx];
      navMarkerRef.current.setLngLat(point);
      map.current.easeTo({
        center: point,
        duration: 800,
        zoom: Math.min(map.current.getZoom(), 15),
      });
      if (idx >= total - 1) {
        clearInterval(navAnimRef.current);
        navAnimRef.current = null;
      }
    }, 1200);

    return () => {
      if (navAnimRef.current) {
        clearInterval(navAnimRef.current);
        navAnimRef.current = null;
      }
      if (navMarkerRef.current) {
        navMarkerRef.current.remove();
        navMarkerRef.current = null;
      }
    };
  }, [isNavigating, mapReady, routeData]);

  const buildFallbackPoints = () => {
    const coords = routeData?.geometry?.coordinates || [
      [startCoords[1], startCoords[0]],
      [destCoords[1], destCoords[0]],
    ];
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const spanLng = maxLng - minLng || 1;
    const spanLat = maxLat - minLat || 1;

    const toPoint = ([lng, lat]) => {
      const x = ((lng - minLng) / spanLng) * 100;
      const y = 100 - ((lat - minLat) / spanLat) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    };

    return coords.map(toPoint).join(" ");
  };

  if (offlineMode) {
    const points = buildFallbackPoints();
    return (
      <div className="relative w-full h-full bg-slate-900 text-white flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
          <defs>
            <linearGradient id="offlineGradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#offlineGradient)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <circle cx="5" cy="95" r="3" fill="#22c55e" />
          <circle cx="95" cy="5" r="3" fill="#ef4444" />
        </svg>
        <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur px-3 py-2 rounded-xl text-xs font-semibold">
          Offline map preview • Route cached
        </div>
        {riskLevel !== "UNKNOWN" && (
          <div
            className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-lg shadow-lg text-xs font-bold ${
              riskLevel === "SAFE"
                ? "bg-green-600"
                : riskLevel === "MODERATE" || riskLevel === "CAUTION"
                  ? "bg-yellow-500"
                  : "bg-red-600"
            }`}
          >
            {riskLevel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="mapboxgl-map"
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />

      {riskLevel !== "UNKNOWN" && (
        <div
          className={`absolute bottom-20 left-4 z-10 px-4 py-2 rounded-lg shadow-lg font-bold text-sm ${
            riskLevel === "SAFE"
              ? "bg-green-600 text-white"
              : riskLevel === "MODERATE" || riskLevel === "CAUTION"
                ? "bg-yellow-600 text-white"
                : "bg-red-600 text-white"
          }`}
        >
          {riskLevel === "SAFE" && "✓ SAFE ROUTE"}
          {riskLevel === "MODERATE" && "⚠️ MODERATE RISK"}
          {riskLevel === "CAUTION" && "⚠️ CAUTION"}
          {riskLevel === "CRITICAL" && "⚠️ HIGH RISK"}
          {riskLevel === "DANGEROUS" && "🚫 DANGEROUS"}
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
