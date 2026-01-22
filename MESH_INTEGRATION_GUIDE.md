# Integrating Mesh Network into Existing Screens

## Quick Integration Guide

### 1. SOS Screen Integration

Update your SOS screen to use mesh networking:

```javascript
// In SOSView.jsx or OfflineNetworkScreen.jsx

import { useMeshNetwork } from "../hooks/useMeshNetwork";
import { useEffect } from "react";

function SOSScreen() {
  const { isRunning, startMesh, sendSOS, peerCount } = useMeshNetwork();

  // Auto-start mesh when SOS screen opens
  useEffect(() => {
    startMesh();
    return () => {
      // Optional: keep running in background
      // or call stopMesh() to save battery
    };
  }, []);

  const handleEmergency = async () => {
    try {
      // Get current location
      const location = await getCurrentLocation(); // Your location service

      // Send SOS via mesh
      await sendSOS(
        "EMERGENCY! Need immediate help!",
        location.lat,
        location.lng,
        {
          type: "medical", // or 'fire', 'accident', etc.
          urgency: "critical",
          timestamp: Date.now(),
        },
      );

      // Show success notification
      showNotification("SOS sent to " + peerCount + " nearby devices");
    } catch (error) {
      console.error("Failed to send SOS:", error);
      showNotification("Failed to send SOS: " + error.message);
    }
  };

  return (
    <div>
      <div className="mesh-status">
        <span>Mesh: {isRunning ? "🟢 Active" : "🔴 Inactive"}</span>
        <span>Nearby devices: {peerCount}</span>
      </div>

      <button onClick={handleEmergency} className="sos-button">
        SEND SOS
      </button>
    </div>
  );
}
```

### 2. Network Screen Integration

Show mesh network status and peers:

```javascript
// In NetworkView.jsx

import { useMeshNetwork } from "../hooks/useMeshNetwork";

function NetworkView() {
  const { isRunning, peers, messages, startMesh, stopMesh, sendMessage } =
    useMeshNetwork({ autoStart: true });

  return (
    <div>
      <h2>Mesh Network</h2>

      {/* Toggle Switch */}
      <div className="toggle-container">
        <label>
          Mesh Network
          <input
            type="checkbox"
            checked={isRunning}
            onChange={(e) => (e.target.checked ? startMesh() : stopMesh())}
          />
        </label>
      </div>

      {/* Peer List */}
      <div className="peers-section">
        <h3>Connected Devices ({peers.length})</h3>
        {peers.map((peer) => (
          <div key={peer.id} className="peer-item">
            <span className="peer-indicator">🟢</span>
            <span className="peer-id">{peer.id}</span>
            <span className="peer-time">
              {new Date(peer.lastSeen).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Messages */}
      <div className="messages-section">
        <h3>Recent Messages ({messages.length})</h3>
        {messages.slice(0, 10).map((msg) => (
          <div key={msg.id} className="message-item">
            <div className="message-header">
              <strong>{msg.sender}</strong>
              <span className="message-hops">Hops: {msg.hops}</span>
            </div>
            <div className="message-body">{msg.payload}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Map View Integration

Show mesh peers on map:

```javascript
// In MapView.jsx

import { useMeshNetwork } from "../hooks/useMeshNetwork";
import { useEffect, useState } from "react";

function MapView() {
  const { messages, startMesh } = useMeshNetwork();
  const [sosLocations, setSosLocations] = useState([]);

  useEffect(() => {
    startMesh();
  }, []);

  useEffect(() => {
    // Extract SOS locations from messages
    const locations = messages
      .filter((msg) => {
        try {
          const data = JSON.parse(msg.payload);
          return data.type === "SOS";
        } catch {
          return false;
        }
      })
      .map((msg) => ({
        lat: msg.lat,
        lng: msg.lng,
        sender: msg.sender,
        message: JSON.parse(msg.payload).message,
      }));

    setSosLocations(locations);
  }, [messages]);

  return (
    <div className="map-container">
      <MapComponent>
        {/* Show SOS markers */}
        {sosLocations.map((location, idx) => (
          <Marker
            key={idx}
            position={[location.lat, location.lng]}
            icon="emergency"
          >
            <Popup>
              <strong>SOS from {location.sender}</strong>
              <p>{location.message}</p>
            </Popup>
          </Marker>
        ))}
      </MapComponent>
    </div>
  );
}
```

### 4. Background Service Integration

Keep mesh running in background:

```javascript
// In App.jsx or main app container

import { useEffect } from 'react';
import meshNetworkService from './services/meshNetworkService';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

function MainApp() {
  useEffect(() => {
    // Only on Android
    if (Capacitor.getPlatform() === 'android') {

      // Start mesh when app becomes active
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('App active - mesh network resuming');
          // Optionally restart mesh
        } else {
          console.log('App backgrounded - mesh network paused');
          // Optionally pause mesh to save battery
        }
      });
    }
  }, []);

  return (
    // Your app components
  );
}
```

### 5. Settings Screen Integration

Add mesh network settings:

```javascript
// In SettingsView.jsx

import { useMeshNetwork } from "../hooks/useMeshNetwork";
import { useState } from "react";

function SettingsView() {
  const { isRunning, startMesh, stopMesh } = useMeshNetwork();
  const [autoStart, setAutoStart] = useState(false);
  const [defaultTTL, setDefaultTTL] = useState(10);

  const saveSettings = () => {
    localStorage.setItem("mesh_auto_start", autoStart);
    localStorage.setItem("mesh_default_ttl", defaultTTL);
  };

  return (
    <div className="settings">
      <h2>Mesh Network Settings</h2>

      <div className="setting-item">
        <label>
          Auto-start mesh network
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
          />
        </label>
      </div>

      <div className="setting-item">
        <label>
          Default TTL (hops)
          <input
            type="number"
            value={defaultTTL}
            onChange={(e) => setDefaultTTL(parseInt(e.target.value))}
            min="1"
            max="50"
          />
        </label>
        <small>Higher values = longer reach, more network traffic</small>
      </div>

      <div className="setting-item">
        <label>
          Current Status
          <span className={isRunning ? "status-active" : "status-inactive"}>
            {isRunning ? "🟢 Active" : "🔴 Inactive"}
          </span>
        </label>
      </div>

      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
}
```

### 6. Dashboard Integration

Add mesh status widget to dashboard:

```javascript
// In Dashboard.jsx

import { useMeshNetwork } from "../hooks/useMeshNetwork";

function Dashboard() {
  const { isRunning, peerCount, messageCount } = useMeshNetwork();

  return (
    <div className="dashboard">
      {/* Other dashboard widgets */}

      {/* Mesh Status Widget */}
      <div className="widget mesh-widget">
        <h3>Mesh Network</h3>
        <div className="mesh-stats">
          <div className="stat">
            <span className="stat-label">Status</span>
            <span className={`stat-value ${isRunning ? "active" : "inactive"}`}>
              {isRunning ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Peers</span>
            <span className="stat-value">{peerCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Messages</span>
            <span className="stat-value">{messageCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## CSS Styles (Optional)

```css
/* Add to your global CSS */

.mesh-status {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  margin-bottom: 10px;
}

.peer-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.peer-indicator {
  margin-right: 10px;
  font-size: 12px;
}

.message-item {
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-hops {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #dc3545;
  font-weight: bold;
}
```

## Permission Request Helper

```javascript
// Create a helper to request all permissions at once

import { Capacitor } from "@capacitor/core";

export async function requestMeshPermissions() {
  if (Capacitor.getPlatform() !== "android") {
    return { granted: false, message: "Only available on Android" };
  }

  try {
    // Request all required permissions
    const permissions = [
      "bluetooth",
      "bluetoothScan",
      "bluetoothConnect",
      "bluetoothAdvertise",
      "location",
      "accessFineLocation",
    ];

    // Using Capacitor's permission API
    // Note: You may need to request these individually
    // based on Android version

    return { granted: true };
  } catch (error) {
    return { granted: false, message: error.message };
  }
}

// Usage in your component:
async function enableMesh() {
  const result = await requestMeshPermissions();
  if (result.granted) {
    await meshNetworkService.startMesh();
  } else {
    alert("Permissions required: " + result.message);
  }
}
```

## Testing Checklist

- [ ] Mesh starts when SOS screen opens
- [ ] Mesh stops when screen closes (optional)
- [ ] SOS messages sent successfully
- [ ] Peers discovered and displayed
- [ ] Messages received and displayed
- [ ] Works in airplane mode
- [ ] Battery drain acceptable
- [ ] Permissions requested correctly
- [ ] Error handling works
- [ ] UI updates in real-time

## Common Issues

1. **Mesh doesn't start**: Check permissions in Android settings
2. **No peers found**: Wait 10-15 seconds, ensure both devices have mesh active
3. **Messages not syncing**: Check Wi-Fi Direct connection established
4. **High battery drain**: Stop mesh when not needed, use low-power modes
5. **App crashes**: Check Android logs, verify all Java files compiled correctly

---

**Ready to integrate!** Start with the SOS screen for immediate value.
