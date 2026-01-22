import React, { useState } from "react";
import { useMeshNetwork } from "../hooks/useMeshNetwork";

/**
 * MeshNetworkTest Component
 * Demonstrates the mesh networking functionality
 * Use this component to test mesh features in your app
 */
export default function MeshNetworkTest() {
  const {
    isRunning,
    peers,
    messages,
    lastMessage,
    error,
    startMesh,
    stopMesh,
    sendMessage,
    sendSOS,
    peerCount,
    messageCount,
  } = useMeshNetwork();

  const [messageText, setMessageText] = useState("");
  const [sosMessage, setSosMessage] = useState("Emergency! Need help!");

  // Stop mesh when this test component unmounts to avoid lingering radios/listeners
  React.useEffect(() => {
    return () => {
      if (isRunning) {
        stopMesh().catch((err) =>
          console.warn("[MeshNetworkTest] stopMesh on unmount warning", err),
        );
      }
    };
  }, [isRunning, stopMesh]);

  const handleStart = async () => {
    try {
      await startMesh();
      alert("Mesh network started!");
    } catch (err) {
      alert("Failed to start mesh: " + err.message);
    }
  };

  const handleStop = async () => {
    try {
      await stopMesh();
      alert("Mesh network stopped");
    } catch (err) {
      alert("Failed to stop mesh: " + err.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      await sendMessage(messageText);
      setMessageText("");
      alert("Message sent!");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const handleSendSOS = async () => {
    try {
      // Get current location (simplified - use actual location service)
      await sendSOS(sosMessage, 0, 0, {
        deviceId: "test-device",
        urgency: "high",
      });
      alert("SOS sent!");
    } catch (err) {
      alert("Failed to send SOS: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Mesh Network Test</h2>

      {/* Status */}
      <div
        style={{
          padding: "15px",
          marginBottom: "20px",
          backgroundColor: isRunning ? "#d4edda" : "#f8d7da",
          border: "1px solid " + (isRunning ? "#c3e6cb" : "#f5c6cb"),
          borderRadius: "5px",
        }}
      >
        <h3>Status</h3>
        <p>
          <strong>Mesh Running:</strong> {isRunning ? "YES" : "NO"}
        </p>
        <p>
          <strong>Connected Peers:</strong> {peerCount}
        </p>
        <p>
          <strong>Stored Messages:</strong> {messageCount}
        </p>
        {error && (
          <p style={{ color: "red" }}>
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Controls</h3>
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: isRunning ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          Start Mesh
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          style={{
            padding: "10px 20px",
            backgroundColor: !isRunning ? "#ccc" : "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isRunning ? "not-allowed" : "pointer",
          }}
        >
          Stop Mesh
        </button>
      </div>

      {/* Send Message */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Send Message</h3>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Enter message"
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isRunning}
          style={{
            padding: "10px 20px",
            backgroundColor: !isRunning ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isRunning ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>

      {/* Send SOS */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Send SOS</h3>
        <input
          type="text"
          value={sosMessage}
          onChange={(e) => setSosMessage(e.target.value)}
          placeholder="Enter SOS message"
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={handleSendSOS}
          disabled={!isRunning}
          style={{
            padding: "10px 20px",
            backgroundColor: !isRunning ? "#ccc" : "#ff4444",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isRunning ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Send SOS
        </button>
      </div>

      {/* Peers List */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Connected Peers ({peerCount})</h3>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {peers.length === 0 ? (
            <p style={{ color: "#999" }}>No peers connected</p>
          ) : (
            peers.map((peer, idx) => (
              <div
                key={idx}
                style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}
              >
                <strong>ID:</strong> {peer.id}
                <br />
                <small>
                  Last seen: {new Date(peer.lastSeen).toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages List */}
      <div>
        <h3>Messages ({messageCount})</h3>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: "#999" }}>No messages</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  borderLeft: "3px solid #007bff",
                }}
              >
                <div>
                  <strong>From:</strong> {msg.sender}
                </div>
                <div>
                  <strong>Payload:</strong> {msg.payload}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  Hops: {msg.hops}/{msg.ttl} | Time:{" "}
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Last Message Alert */}
      {lastMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "15px",
            backgroundColor: "#28a745",
            color: "white",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            maxWidth: "300px",
          }}
        >
          <strong>New Message!</strong>
          <p style={{ margin: "5px 0" }}>{lastMessage.payload}</p>
          <small>From: {lastMessage.sender}</small>
        </div>
      )}
    </div>
  );
}
