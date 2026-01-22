// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE: Enhanced OfflineNetworkScreen with Real Mesh Integration
// ════════════════════════════════════════════════════════════════════════════
//
// This file shows how to integrate the real mesh network into your existing
// OfflineNetworkScreen.jsx. You can either:
// 1. Replace the existing file with this
// 2. Copy the relevant parts you need
//
// Key additions:
// - Import useMeshNetwork hook
// - Add mesh status UI
// - Add real peer discovery
// - Add real message sending
// - Show actual mesh statistics
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
    peers,
    messages,
    lastMessage,
    error: meshError,
    startMesh,
    stopMesh,
    sendMessage,
    sendSOS,
    peerCount,
    messageCount,
  } = useMeshNetwork();

  const [messageText, setMessageText] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // Show notification when new message received
  useEffect(() => {
    if (lastMessage) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [lastMessage]);

  // Handle mesh toggle
  const handleToggleMesh = async () => {
    try {
      if (meshActive) {
        await stopMesh();
      } else {
        await startMesh();
      }
    } catch (error) {
      console.error("Failed to toggle mesh:", error);
      alert("Failed to toggle mesh: " + error.message);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      await sendMessage(messageText);
      setMessageText("");
      alert("Message sent to mesh network!");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message: " + error.message);
    }
  };

  // Handle emergency SOS
  const handleEmergencySOS = async () => {
    try {
      // In real app, get actual location from location service
      const location = { lat: 0, lng: 0 }; // Replace with real location

      await sendSOS({
        message: "EMERGENCY! Need immediate assistance!",
        lat: location.lat,
        lng: location.lng,
        metadata: {
          urgency: "critical",
          type: "emergency",
        },
      });

      alert(`SOS sent to ${peerCount} nearby devices!`);
    } catch (error) {
      console.error("Failed to send SOS:", error);
      alert("Failed to send SOS: " + error.message);
    }
  };

  return (
    <div className="offline-network-screen">
      {/* Header */}
      <header className="offline-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h1>Mesh Network</h1>
      </header>

      {/* Status Card */}
      <div className={`status-card ${meshActive ? "active" : "inactive"}`}>
        <div className="status-indicator">
          <div className={`status-dot ${meshActive ? "green" : "red"}`} />
          <span className="status-text">
            {meshActive ? "Mesh Active" : "Mesh Inactive"}
          </span>
        </div>

        <div className="status-stats">
          <div className="stat">
            <span className="stat-label">Nearby Devices</span>
            <span className="stat-value">{peerCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Messages</span>
            <span className="stat-value">{messageCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Range</span>
            <span className="stat-value">~100m</span>
          </div>
        </div>

        {meshError && <div className="error-message">⚠️ {meshError}</div>}
      </div>

      {/* Controls */}
      <div className="controls-section">
        <button
          className={`mesh-toggle-button ${meshActive ? "active" : ""}`}
          onClick={handleToggleMesh}
        >
          {meshActive ? "Stop Mesh Network" : "Start Mesh Network"}
        </button>

        <button
          className="sos-button"
          onClick={handleEmergencySOS}
          disabled={!meshActive}
        >
          🚨 SEND SOS
        </button>
      </div>

      {/* Message Composer */}
      {meshActive && (
        <div className="message-composer">
          <h3>Send Message</h3>
          <div className="composer-input">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}

      {/* Nearby Devices */}
      <div className="section">
        <h3>Nearby Devices ({peerCount})</h3>
        <div className="peers-list">
          {peers.length === 0 ? (
            <div className="empty-state">
              {meshActive
                ? "Scanning for nearby devices..."
                : "Start mesh to discover devices"}
            </div>
          ) : (
            peers.map((peer, idx) => (
              <div key={idx} className="peer-item">
                <div className="peer-icon">📱</div>
                <div className="peer-info">
                  <div className="peer-id">{peer.id}</div>
                  <div className="peer-time">
                    Last seen: {new Date(peer.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
                <div className="peer-status">🟢</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="section">
        <h3>Recent Messages ({messageCount})</h3>
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-state">No messages yet</div>
          ) : (
            messages.slice(0, 10).map((msg, idx) => {
              let displayPayload = msg.payload;
              let messageType = "text";

              // Try to parse JSON payload
              try {
                const parsed = JSON.parse(msg.payload);
                if (parsed.type === "SOS") {
                  messageType = "sos";
                  displayPayload = parsed.message;
                } else if (parsed.type === "ANNOUNCEMENT") {
                  messageType = "announcement";
                  displayPayload = parsed.message;
                }
              } catch {
                // Not JSON, treat as plain text
              }

              return (
                <div key={idx} className={`message-item ${messageType}`}>
                  <div className="message-header">
                    <span className="message-sender">{msg.sender}</span>
                    <span className="message-hops">
                      {msg.hops}/{msg.ttl} hops
                    </span>
                  </div>
                  <div className="message-body">{displayPayload}</div>
                  <div className="message-footer">
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                    {messageType === "sos" && (
                      <span className="message-badge sos">EMERGENCY</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>How It Works</h3>
        <ul>
          <li>✅ Works without internet or SIM card</li>
          <li>✅ Bluetooth discovery + Wi-Fi Direct data</li>
          <li>✅ Messages propagate peer-to-peer</li>
          <li>✅ Range: ~100 meters between devices</li>
          <li>✅ Messages stored locally and forwarded</li>
        </ul>
      </div>

      {/* New Message Notification */}
      {showNotification && lastMessage && (
        <div className="notification-toast">
          <div className="notification-icon">📩</div>
          <div className="notification-content">
            <div className="notification-title">New Message</div>
            <div className="notification-body">
              {lastMessage.payload.substring(0, 50)}
              {lastMessage.payload.length > 50 ? "..." : ""}
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
