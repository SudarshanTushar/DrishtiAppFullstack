// ════════════════════════════════════════════════════════════════════════════
// OFFLINE NETWORK SCREEN - DTN + MESH CONTROL CENTER
// ════════════════════════════════════════════════════════════════════════════
//
// REAL MESH IMPLEMENTATION:
// - Native Android BLE + Wi-Fi Direct
// - True offline communication (no internet/SIM)
// - Store-carry-forward DTN protocol
//
// HONEST UI:
// - Shows real peer count from native layer
// - Shows actual message propagation
// - Never claims connectivity that doesn't exist
//
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMeshNetwork } from "../hooks/useMeshNetwork";
import "./OfflineNetworkScreen.css";

export default function OfflineNetworkScreen() {
  const navigate = useNavigate();

  // Use the real mesh network hook
  const {
    isRunning: meshActive,
    peers: peersNearby,
    messages,
    lastMessage,
    error: meshError,
    startMesh,
    stopMesh,
    sendMessage,
    peerCount,
    messageCount,
  } = useMeshNetwork();

  // Local state
  const [isInitializing, setIsInitializing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Show notification when new message received
  useEffect(() => {
    if (lastMessage) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [lastMessage]);

  // ──────────────────────────────────────────────────────────────────────────
  // MESH CONTROL
  // ──────────────────────────────────────────────────────────────────────────

  async function handleToggleMesh() {
    if (meshActive) {
      await stopMesh();
    } else {
      await startMeshNetwork();
    }
  }

  async function startMeshNetwork() {
    console.log("[OfflineNetwork] startMeshNetwork called");
    setIsInitializing(true);
    try {
      console.log("[OfflineNetwork] Starting real mesh network...");
      const result = await startMesh();
      console.log(
        "[OfflineNetwork] Mesh started successfully, result:",
        result,
      );
      console.log("[OfflineNetwork] meshActive should now be:", meshActive);
    } catch (err) {
      console.error("[OfflineNetwork] Failed to start mesh:", err);
      console.error("[OfflineNetwork] Error message:", err.message);
      alert(
        `Failed to start mesh: ${err.message}\n\nMake sure you're running on Android device with permissions granted.`,
      );
    } finally {
      setIsInitializing(false);
      console.log("[OfflineNetwork] Initialization complete");
    }
  }

  // Calculate stats from messages
  const stats = {
    bundlesStored: messageCount,
    bundlesForwarded: messages.filter((m) => m.hops > 0).length,
    peersEncountered: peerCount,
    storageUsed: messages.length * 512, // Rough estimate
  };

  // ──────────────────────────────────────────────────────────────────────────
  // CLEANUP ON UNMOUNT
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      console.log("[OfflineNetwork] Unmounting, stopping mesh...");
      if (meshActive) {
        stopMesh();
      }
    };
  }, [meshActive, stopMesh]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="offline-network-screen">
      {/* HEADER */}
      <header className="screen-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h1 className="screen-title">Mesh Network</h1>
        <div className="header-spacer" />
      </header>

      {/* MAIN CONTENT */}
      <main className="screen-content">
        {/* ERROR DISPLAY */}
        {meshError && (
          <div className="error-banner">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{meshError}</div>
            <button className="error-dismiss" onClick={() => {}}>
              ✕
            </button>
          </div>
        )}

        {/* MESH CONTROL CARD */}
        <div className="control-card">
          <div className="card-header">
            <div className="card-icon">📡</div>
            <div className="card-title">
              <h2>Mesh Network</h2>
              <p className="card-subtitle">
                Real BLE + Wi-Fi Direct mesh (no internet needed)
              </p>
            </div>
          </div>

          <div className="card-body">
            {/* Status indicator */}
            <div className="status-indicator">
              <div
                className={`status-dot ${meshActive ? "active" : "inactive"}`}
              />
              <div className="status-text">
                STATUS: {isInitializing && "INITIALIZING"}
                {!isInitializing && meshActive && "RISK ASSESSMENT ACTIVE"}
                {!isInitializing && !meshActive && "STANDBY"}
              </div>
            </div>

            {/* Node info - always show */}
            <div className="node-info">
              <div className="info-row">
                <span className="info-label">Protocol:</span>
                <span className="info-value">DTN/Bundle</span>
              </div>
              <div className="info-row">
                <span className="info-label">Node:</span>
                <span className="info-value">
                  NODE-{Date.now()}-{Math.floor(Math.random() * 9999)}
                </span>
              </div>
              <div className="scan-indicator">
                <span className="scan-text">
                  {">"}{" "}
                  {meshActive
                    ? "Risk assessment in progress across 2.4GHz spectrum..."
                    : "Radio idle. Awaiting scheduler."}
                </span>
                {meshActive && <span className="cursor-blink">_</span>}
              </div>
            </div>

            {/* Toggle button */}
            <button
              className={`toggle-button ${meshActive ? "active" : ""}`}
              onClick={handleToggleMesh}
              disabled={isInitializing}
            >
              {isInitializing && "INITIALIZING..."}
              {!isInitializing && meshActive && "STOP MESH"}
              {!isInitializing && !meshActive && "FORCE SYNC"}
            </button>
          </div>
        </div>

        {/* RISK ASSESSMENT STATUS */}
        {meshActive && (
          <div className="scanning-status">
            <div className="scan-header">RISK ASSESSMENT IN PROGRESS...</div>
            <div className="scan-progress">
              <div className="scan-bar"></div>
            </div>
          </div>
        )}

        {/* PEERS NEARBY */}
        {meshActive && (
          <div className="info-card">
            <h3 className="card-section-title">
              📱 Devices Nearby ({peerCount})
            </h3>

            {peerCount === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>Risk assessment in progress; monitoring nearby relays...</p>
                <p className="empty-hint">
                  BLE discovery active - waiting for peers
                </p>
              </div>
            )}

            {peerCount > 0 && (
              <div className="peer-list">
                {peersNearby.map((peer, index) => (
                  <div key={peer.id || index} className="peer-item">
                    <div className="peer-icon">📱</div>
                    <div className="peer-info">
                      <div className="peer-name">
                        {peer.id
                          ? peer.id.substring(0, 17)
                          : `Device ${index + 1}`}
                      </div>
                      <div className="peer-distance">
                        Last seen:{" "}
                        {new Date(peer.lastSeen).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="peer-signal">
                      <span className="signal-strong">📶</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOCAL BUNDLE STORE */}
        <div className="info-card">
          <div className="bundle-header">
            <h3 className="card-section-title">Local Bundle Store</h3>
            <button
              className="test-msg-button"
              onClick={async () => {
                if (meshActive) {
                  await sendMessage("Test message from " + Date.now());
                } else {
                  alert("Start mesh network first by clicking FORCE SYNC");
                }
              }}
            >
              + Test Msg
            </button>
          </div>

          {messageCount === 0 && (
            <div className="buffer-empty">
              <p>BUFFER EMPTY</p>
            </div>
          )}

          {messageCount > 0 && (
            <div className="message-list">
              {messages.slice(0, 5).map((msg, idx) => (
                <div key={idx} className="message-item">
                  <div className="message-header">
                    <span className="message-id">
                      {msg.id.substring(0, 8)}...
                    </span>
                    <span className="message-hops">
                      Hops: {msg.hops}/{msg.ttl}
                    </span>
                  </div>
                  <div className="message-payload">
                    {msg.payload.substring(0, 50)}
                    {msg.payload.length > 50 ? "..." : ""}
                  </div>
                  <div className="message-meta">
                    From: {msg.sender} |{" "}
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ECO AND CLEAR BUTTONS - Always show */}
        <div className="control-row">
          <button className="secondary-button">ECO</button>
          <button
            className="secondary-button"
            onClick={() => {
              if (confirm("Clear all stored messages?")) {
                // In future: call clearMessages() from hook
                alert("Clear functionality - to be implemented");
              }
            }}
          >
            Clear
          </button>
        </div>

        {/* STATISTICS */}
        {meshActive && (
          <div className="info-card">
            <h3 className="card-section-title">📊 Network Statistics</h3>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.bundlesStored}</div>
                <div className="stat-label">Bundles Stored</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">{stats.bundlesForwarded}</div>
                <div className="stat-label">Bundles Forwarded</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">{stats.peersEncountered}</div>
                <div className="stat-label">Peers Active</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">
                  {(stats.storageUsed / 1024).toFixed(1)} KB
                </div>
                <div className="stat-label">Storage Used</div>
              </div>
            </div>
          </div>
        )}

        {/* HOW IT WORKS */}
        {!meshActive && (
          <div className="info-card help-card">
            <h3 className="card-section-title">💡 How It Works</h3>
            <div className="help-content">
              <p>
                <strong>Real mesh networking</strong> using native Android BLE +
                Wi-Fi Direct:
              </p>
              <ul>
                <li>🔵 BLE discovers nearby devices (5-15 seconds)</li>
                <li>📡 Wi-Fi Direct establishes P2P connection</li>
                <li>💾 Messages stored locally and forwarded</li>
                <li>🔄 Works WITHOUT internet or cell towers</li>
                <li>⚡ Range: ~100 meters between devices</li>
              </ul>
              <p className="help-note">
                <strong>Note:</strong> Requires Bluetooth, Wi-Fi, and location
                permissions. Keep airplane mode ON but Bluetooth/Wi-Fi enabled.
              </p>
            </div>
          </div>
        )}

        {/* ECO CONTROLS */}
        {meshActive && (
          <div className="control-row">
            <button className="secondary-button">ECO</button>
            <button className="secondary-button">Clear</button>
          </div>
        )}

        {/* DEBUG PANEL - Shows real-time state */}
        <div
          className="info-card"
          style={{
            marginTop: "20px",
            background: "rgba(59, 130, 246, 0.1)",
            borderColor: "#3b82f6",
          }}
        >
          <h3 className="card-section-title" style={{ color: "#3b82f6" }}>
            🔧 Debug Info
          </h3>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#94a3b8",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong>meshActive:</strong> {meshActive ? "✅ TRUE" : "❌ FALSE"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>isInitializing:</strong>{" "}
              {isInitializing ? "⏳ TRUE" : "✅ FALSE"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>peerCount:</strong> {peerCount}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>messageCount:</strong> {messageCount}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>meshError:</strong> {meshError || "None"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Platform:</strong>{" "}
              {typeof window !== "undefined" && window.Capacitor
                ? "📱 Capacitor"
                : "🌐 Web Browser"}
            </div>
            {typeof window !== "undefined" &&
              !window.Capacitor &&
              meshActive && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    background: "rgba(255, 193, 7, 0.2)",
                    borderRadius: "4px",
                    color: "#ffc107",
                    border: "1px solid #ffc107",
                  }}
                >
                  ⚠️ SIMULATION MODE - UI only. Install APK on Android for real
                  mesh networking.
                </div>
              )}
            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "4px",
              }}
            >
              Open browser console (F12) to see detailed logs when clicking
              FORCE SYNC
            </div>
          </div>
        </div>
      </main>

      {/* NEW MESSAGE NOTIFICATION */}
      {showNotification && lastMessage && (
        <div className="notification-toast">
          <div className="notification-icon">📩</div>
          <div className="notification-content">
            <div className="notification-title">New Bundle Received</div>
            <div className="notification-body">
              {lastMessage.payload.substring(0, 40)}...
            </div>
            <div className="notification-sender">
              From: {lastMessage.sender}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
