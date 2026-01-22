import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom markers
const startIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const currentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper to auto-zoom to fit the route
const AutoFitBounds = ({ startCoords, destCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (startCoords && destCoords) {
      const bounds = L.latLngBounds([startCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [startCoords, destCoords, map]);
  return null;
};

const RiskMap = ({
  activeRoute,
  startCoords = [26.1445, 91.7362],
  destCoords = [25.5788, 91.8933],
  currentLocation = null,
  onMapClick = null,
}) => {
  const [mapKey, setMapKey] = useState(0);

  // Force map re-render when coordinates change
  useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, [startCoords, destCoords]);

  // Calculate center point between start and destination
  const center = [
    (startCoords[0] + destCoords[0]) / 2,
    (startCoords[1] + destCoords[1]) / 2,
  ];

  // Generate route paths (interpolate between start and dest)
  const generateRoutePath = (start, end, offset = 0) => {
    const points = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat =
        start[0] +
        (end[0] - start[0]) * ratio +
        offset * 0.1 * Math.sin(ratio * Math.PI);
      const lng =
        start[1] +
        (end[1] - start[1]) * ratio +
        offset * 0.1 * Math.cos(ratio * Math.PI);
      points.push([lat, lng]);
    }
    return points;
  };

  const safeRouteCoords = generateRoutePath(startCoords, destCoords, 0.5);
  const riskyRouteCoords = generateRoutePath(startCoords, destCoords, -0.5);

  return (
    <div
      className="h-full w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative"
      style={{ minHeight: "400px" }}
    >
      {/* Loading overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg z-[1000] text-xs font-bold">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Map Active</span>
        </div>
      </div>

      <MapContainer
        key={mapKey}
        center={center}
        zoom={9}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{
          height: "100%",
          minHeight: "400px",
          background: "#e5e7eb",
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Safe Route (Green) */}
        <Polyline
          positions={safeRouteCoords}
          pathOptions={{
            color: activeRoute?.id === "route-B" ? "#10b981" : "#94a3b8",
            weight: 5,
            opacity: 0.8,
          }}
        />

        {/* Risky Route (Red Dashed) */}
        <Polyline
          positions={riskyRouteCoords}
          pathOptions={{
            color: activeRoute?.id === "route-A" ? "#ef4444" : "#94a3b8",
            weight: 5,
            opacity: 0.6,
            dashArray: "10, 10",
          }}
        />

        {/* Start Marker */}
        <Marker position={startCoords} icon={startIcon}>
          <Popup>
            <div className="text-xs font-bold">
              <div className="text-green-600">📍 Start Location</div>
              <div className="text-slate-600 mt-1">
                {startCoords[0].toFixed(4)}, {startCoords[1].toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destCoords} icon={destIcon}>
          <Popup>
            <div className="text-xs font-bold">
              <div className="text-red-600">🎯 Destination</div>
              <div className="text-slate-600 mt-1">
                {destCoords[0].toFixed(4)}, {destCoords[1].toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Current Location Marker (if available) */}
        {currentLocation && (
          <Marker position={currentLocation} icon={currentIcon}>
            <Popup>
              <div className="text-xs font-bold">
                <div className="text-blue-600">📍 Current Location</div>
                <div className="text-slate-600 mt-1">
                  {currentLocation[0].toFixed(4)},{" "}
                  {currentLocation[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <AutoFitBounds startCoords={startCoords} destCoords={destCoords} />
      </MapContainer>

      {/* MAP LEGEND OVERLAY */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[1000] text-[10px] font-bold space-y-2">
        <div className="text-slate-600 uppercase tracking-wider mb-2">
          Route Legend
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-green-500 rounded"></div>
          <span>SAFE (Low Slope)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-1 bg-red-500 rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)",
            }}
          ></div>
          <span>HIGH RISK (Landslide)</span>
        </div>
      </div>
    </div>
  );
};

export default RiskMap;
