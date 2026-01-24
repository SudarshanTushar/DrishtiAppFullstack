// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN - QUICK STATUS + ACTION CENTER
// ════════════════════════════════════════════════════════════════════════════
//
// PHILOSOPHY:
// - Show system status at a glance
// - Large, easy-to-hit action buttons
// - Honest about connectivity
// - Works WITHOUT any services running (lazy loads them)
//
// STRESS-OPTIMIZED DESIGN:
// - High contrast colors
// - Large touch targets (min 60px)
// - Simple language
// - Clear visual feedback
//
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { networkManager } from "../services/NetworkManager";
import { platformGuard } from "../services/PlatformGuard";

export default function HomeScreen() {
  const navigate = useNavigate();

  // State
  const [networkStatus, setNetworkStatus] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [locationStatus, setLocationStatus] = useState("unknown");
  const [time, setTime] = useState(new Date());

  // ──────────────────────────────────────────────────────────────────────────
  // INITIALIZATION (LIGHTWEIGHT ONLY)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    console.log("[HomeScreen] Mounted");

    // Start network monitoring (lightweight)
    networkManager.startMonitoring();

    // Listen for network changes
    const unsubscribe = networkManager.addEventListener((status) => {
      setNetworkStatus(status);
    });

    // Initial status
    setNetworkStatus(networkManager.getHonestStatus());

    // Clock update
    const clockInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Battery monitoring (lightweight, native only)
    checkBatteryStatus();
    const batteryInterval = setInterval(checkBatteryStatus, 60000);

    // Location status (lightweight check)
    checkLocationPermission();

    return () => {
      console.log("[HomeScreen] Unmounting");
      unsubscribe();
      clearInterval(clockInterval);
      clearInterval(batteryInterval);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // LIGHTWEIGHT STATUS CHECKS
  // ──────────────────────────────────────────────────────────────────────────

  async function checkBatteryStatus() {
    const result = await platformGuard.guardNativeAPIAsync(async () => {
      // In production, use HardwareManager.getBatteryStatus()
      // For now, placeholder
      return { level: 0.85, isCharging: false };
    }, null);

    if (result) {
      setBatteryLevel(result.level);
    }
  }

  async function checkLocationPermission() {
    const hasPermission = await platformGuard.guardNativeAPIAsync(async () => {
      // In production, check actual permission
      return "granted"; // placeholder
    }, "unknown");

    setLocationStatus(hasPermission);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTION HANDLERS (NAVIGATE TO FEATURE SCREENS)
  // ──────────────────────────────────────────────────────────────────────────

  function handleEmergencySOS() {
    // Navigate to SOS screen (will lazy-load emergency service)
    navigate("/sos");
  }

  function handleViewMap() {
    // Navigate to map (will lazy-load map service)
    navigate("/map");
  }

  function handleOfflineNetwork() {
    // Navigate to DTN/mesh control (will lazy-load DTN service)
    navigate("/network");
  }

  function handleSettings() {
    navigate("/settings");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="home-screen">
      {/* STATUS BAR */}
      <header className="status-bar">
        <div className="status-row">
          <div className="time">
            {time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div className="status-indicators">
            {/* Battery */}
            {batteryLevel !== null && (
              <div className="status-badge">
                🔋 {Math.round(batteryLevel * 100)}%
              </div>
            )}

            {/* Location */}
            {locationStatus === "granted" && (
              <div className="status-badge">📍 GPS</div>
            )}

            {/* Network */}
            {networkStatus && (
              <div
                className="status-badge network-status"
                style={{
                  backgroundColor: networkStatus.color,
                  color: "#FFFFFF",
                }}
              >
                {networkStatus.icon} {networkStatus.status}
              </div>
            )}
          </div>
        </div>

        {/* Network description */}
        {networkStatus && (
          <div className="status-description">{networkStatus.description}</div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="home-content">
        {/* App Title */}
        <div className="app-title">
          <h1>DrishtiNE</h1>
          <p className="subtitle">Emergency Network</p>
        </div>

        {/* EMERGENCY SOS BUTTON (LARGEST) */}
        <button
          className="action-button emergency-button"
          onClick={handleEmergencySOS}
        >
          <div className="button-icon">🚨</div>
          <div className="button-label">EMERGENCY SOS</div>
          <div className="button-subtitle">Send help request</div>
        </button>

        {/* QUICK ACTIONS GRID */}
        <div className="quick-actions">
          <button className="action-button" onClick={handleViewMap}>
            <div className="button-icon">🗺️</div>
            <div className="button-label">View Map</div>
          </button>

          <button className="action-button" onClick={handleOfflineNetwork}>
            <div className="button-icon">📡</div>
            <div className="button-label">Offline Network</div>
            {networkStatus && networkStatus.type === "dtn" && (
              <div className="button-badge">
                {networkManager.getState().peersNearby} peers
              </div>
            )}
          </button>
        </div>

        {/* SECONDARY ACTIONS */}
        <div className="secondary-actions">
          <button className="secondary-button" onClick={handleSettings}>
            ⚙️ Settings
          </button>
        </div>

        {/* SYSTEM INFO */}
        <div className="system-info">
          <div className="info-row">
            <span className="info-label">System Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">Platform:</span>
            <span className="info-value">
              {platformGuard.isNative() ? "Android Native" : "Web Browser"}
            </span>
          </div>
        </div>
      </main>

      {/* BOTTOM SAFE AREA */}
      <div className="bottom-safe-area" />
    </div>
  );
}
