import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ADDED: routePath prop
const InteractiveMap = ({ center, markers = [], routePath = null, onMapClick }) => {
  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      whenReady={(map) => {
        map.target.on("click", (e) => {
          if(onMapClick) onMapClick(e.latlng);
        });
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <RecenterMap center={center} />

      <Marker position={center}>
        <Popup>You are here</Popup>
      </Marker>

      {markers.map((m, idx) => (
        <Marker key={idx} position={m.pos}>
          <Popup>{m.label}</Popup>
        </Marker>
      ))}

      {/* NEW: Draw the safe route line */}
      {routePath && (
        <Polyline 
          positions={routePath} 
          pathOptions={{ color: 'blue', weight: 5, opacity: 0.7 }} 
        />
      )}
    </MapContainer>
  );
};

export default InteractiveMap;