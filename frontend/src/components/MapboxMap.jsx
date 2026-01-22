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

  const startMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const currentMarkerRef = useRef(null);

  // Map style URLs
  const styleUrls = {
    streets: "mapbox://styles/mapbox/streets-v12",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  // Initialize map once
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrls[mapStyle],
        center: [startCoords[1], startCoords[0]],
        zoom: 10,
        attributionControl: false,
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
    });

    map.current.on("error", (e) => {
      console.error("❌ Map error:", e);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, onMapLoad, startCoords]);

  // Apply style without recreating the map
  useEffect(() => {
    if (!map.current) return;
    const handleStyle = () => {
      if (map.current?.isStyleLoaded()) {
        setMapReady(true);
      }
    };

    setMapReady(false);
    map.current.setStyle(styleUrls[mapStyle]);
    map.current.once("style.load", handleStyle);

    return () => {
      if (map.current) {
        map.current.off("style.load", handleStyle);
      }
    };
  }, [mapStyle]);

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

    if (map.current.getLayer("route-line")) {
      map.current.removeLayer("route-line");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    const routeColors = {
      SAFE: "#10b981",
      MODERATE: "#f59e0b",
      CAUTION: "#f59e0b",
      CRITICAL: "#ef4444",
      DANGEROUS: "#dc2626",
      UNKNOWN: "#64748b",
    };

    map.current.addSource("route", {
      type: "geojson",
      data: routeData,
    });

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

    if (routeData.geometry?.coordinates) {
      const coordinates = routeData.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      map.current.fitBounds(bounds, { padding: 120, maxZoom: 14 });
    }
  }, [mapReady, routeData, riskLevel]);

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
