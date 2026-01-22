// ════════════════════════════════════════════════════════════════════════════
// SOS VIEW - EMERGENCY MESSAGE UI WITH HONEST STATE DISPLAY
// ════════════════════════════════════════════════════════════════════════════
//
// THIS UI SHOWS TRUTH, NOT FANTASY:
// - "Your message will spread as people move"
// - Shows STORED → CARRYING → FORWARDED → DELIVERED
// - Shows peer encounters, not fake "connected" status
// - Shows TTL remaining
// - Shows propagation progress
//
// NO LIES. NO FALSE HOPE. ONLY TRANSPARENCY.
//
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";
import {
  emergencyService,
  EMERGENCY_TYPES,
} from "../services/emergencyService";
import { dtnService } from "../services/dtnService";
import { peerDiscoveryService } from "../services/peerDiscoveryService";
import { profileService } from "../services/profileService";

const SOSView = () => {
  // Emergency state
  const [emergencyType, setEmergencyType] = useState("MEDICAL");
  const [message, setMessage] = useState("");
  const [currentBundle, setCurrentBundle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Propagation state
  const [stats, setStats] = useState({
    peersEncountered: 0,
    bundlesForwarded: 0,
    isScanning: false,
    lastEncounter: null,
  });

  const [discoveredPeers, setDiscoveredPeers] = useState([]);
  const [allBundles, setAllBundles] = useState([]);

  // Update stats every 2 seconds
  useEffect(() => {
    const updateStats = () => {
      const dtnStats = dtnService.getStatistics();
      const emergencyStats = emergencyService.getEmergencyStats();
      const peers = peerDiscoveryService.getDiscoveredPeers();
      const bundles = emergencyService.getEmergencyBundles();

      setStats({
        ...dtnStats,
        ...emergencyStats,
      });

      setDiscoveredPeers(peers);
      setAllBundles(bundles);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  // Listen for DTN events
  useEffect(() => {
    const unsubscribe = dtnService.addEventListener((event, data) => {
      console.log("SOS: DTN Event", event, data);

      if (event === "bundle_status_changed") {
        // Update current bundle if it's ours
        if (currentBundle && data.id === currentBundle.id) {
          setCurrentBundle(data);
        }
      }
    });

    return unsubscribe;
  }, [currentBundle]);

  // ──────────────────────────────────────────────────────────────────────────
  // EMERGENCY CREATION
  // ──────────────────────────────────────────────────────────────────────────

  const handleCreateEmergency = async () => {
    setIsCreating(true);

    try {
      // Get user profile data
      const userProfile = profileService.getProfile() || {};

      // Create emergency
      const result = await emergencyService.createEmergency({
        type: emergencyType,
        message:
          message || `${EMERGENCY_TYPES[emergencyType].label} - Need help`,
        userInfo: {
          name: userProfile.name || "Anonymous",
          age: userProfile.age,
          bloodType: userProfile.bloodType,
          medicalConditions: userProfile.medicalConditions || [],
          emergencyContacts: userProfile.emergencyContacts || [],
        },
      });

      if (result.success) {
        setCurrentBundle(result.bundle);

        // Clear form
        setMessage("");
      }
    } catch (error) {
      console.error("SOS: Emergency creation failed", error);
      alert("Failed to create emergency message");
    } finally {
      setIsCreating(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // PROPAGATION CONTROL
  // ──────────────────────────────────────────────────────────────────────────

  const handleStartPropagation = async () => {
    await emergencyService.startPropagation();
  };

  const handleStopPropagation = async () => {
    await emergencyService.stopPropagation();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // TIME FORMATTING
  // ──────────────────────────────────────────────────────────────────────────

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Never";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatTTL = (ttlTimestamp) => {
    const remaining = ttlTimestamp - Date.now();
    if (remaining <= 0) return "EXPIRED";
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-red-500 mb-2">
            🚨 EMERGENCY SOS
          </h1>
          <p className="text-gray-400 text-sm">
            Works WITHOUT internet, cellular, or infrastructure
          </p>
          {stats.isScanning ? (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/15 border border-green-400/40 text-green-200 text-xs font-bold">
              <PlayCircle size={14} /> Propagation running
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold">
              <PauseCircle size={14} /> Propagation paused
            </div>
          )}
        </div>

        {/* Current Bundle Display */}
        {currentBundle && (
          <div className="bg-gray-800 rounded-lg p-4 border-2 border-red-500">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Your Emergency Message</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  currentBundle.status === "STORED"
                    ? "bg-blue-600"
                    : currentBundle.status === "CARRYING"
                      ? "bg-yellow-600"
                      : currentBundle.status === "FORWARDED"
                        ? "bg-green-600"
                        : "bg-gray-600"
                }`}
              >
                {currentBundle.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-semibold">
                  {currentBundle.payload.emergencyInfo.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span>{formatTimeAgo(currentBundle.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TTL Remaining:</span>
                <span className="text-yellow-400">
                  {formatTTL(currentBundle.ttl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hop Count:</span>
                <span>{currentBundle.hopCount} hops</span>
              </div>
            </div>

            {/* Honest Message */}
            <div className="mt-4 p-3 bg-gray-700 rounded border-l-4 border-yellow-500">
              <p className="text-sm">
                {currentBundle.status === "STORED" &&
                  "📦 Message stored locally. Waiting for nearby devices..."}
                {currentBundle.status === "CARRYING" &&
                  "🚶 You are carrying this message. It will spread when others are near."}
                {currentBundle.status === "FORWARDED" &&
                  "🔄 Message shared with other devices. It is spreading across the area."}
                {currentBundle.status === "DELIVERED" &&
                  "✅ Message delivered to authorities or safe location."}
              </p>
            </div>

            {/* Custody Chain */}
            {currentBundle.custodyChain &&
              currentBundle.custodyChain.length > 1 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Message Journey:</p>
                  <div className="space-y-1">
                    {currentBundle.custodyChain.slice(-5).map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center gap-2"
                      >
                        <span className="text-gray-500">
                          {formatTimeAgo(entry.timestamp)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-400">{entry.action}</span>
                        {entry.forwardedTo && (
                          <span className="text-gray-500">
                            to {entry.forwardedTo.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Create Emergency */}
        {!currentBundle && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Create Emergency Message</h2>

            {/* Emergency Type Selector */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Emergency Type
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                {Object.entries(EMERGENCY_TYPES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your situation..."
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateEmergency}
              disabled={isCreating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {isCreating ? "Creating..." : "🚨 SEND EMERGENCY SOS"}
            </button>

            {/* Honest Explanation */}
            <div className="mt-4 p-3 bg-gray-700 rounded text-sm text-gray-300">
              <p className="font-semibold mb-2">How this works:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Message stored locally IMMEDIATELY</li>
                <li>✓ No internet or cell network required</li>
                <li>✓ Message spreads as people move</li>
                <li>✓ Each device becomes a relay</li>
                <li>✓ Over time, covers entire city/town</li>
              </ul>
            </div>
          </div>
        )}

        {/* Propagation Status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Propagation Status</h2>
            <div
              className={`w-3 h-3 rounded-full ${stats.isScanning ? "bg-green-500 animate-pulse" : "bg-gray-600"}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl font-bold text-blue-400">
                {discoveredPeers.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">Peers Nearby</div>
            </div>

            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl font-bold text-green-400">
                {stats.peersEncountered}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Encounters</div>
            </div>

            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.bundlesForwarded}
              </div>
              <div className="text-xs text-gray-400 mt-1">Messages Shared</div>
            </div>

            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl font-bold text-purple-400">
                {allBundles.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Messages Carrying
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400 mb-3">
            Last encounter: {formatTimeAgo(stats.lastEncounter)}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!stats.isScanning ? (
              <button
                onClick={handleStartPropagation}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors"
              >
                ▶ Start Propagation
              </button>
            ) : (
              <button
                onClick={handleStopPropagation}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded transition-colors"
              >
                ⏸ Pause (Save Battery)
              </button>
            )}
          </div>

          {/* Honest Status Message */}
          <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
            {stats.isScanning ? (
              <p className="text-green-400">
                🔍 Actively scanning for nearby devices every 15 seconds
              </p>
            ) : (
              <p className="text-gray-400">
                ⏸ Propagation paused. Your messages are still stored and will
                spread when you resume.
              </p>
            )}
          </div>
        </div>

        {/* Nearby Peers */}
        {discoveredPeers.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-3">Nearby Devices</h2>
            <div className="space-y-2">
              {discoveredPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {peer.name || peer.id.slice(0, 12)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {peer.distance} • {formatTimeAgo(peer.lastSeen)}
                    </div>
                  </div>
                  <div className="text-xs text-green-400">{peer.rssi} dBm</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {discoveredPeers.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <div>
              <p className="font-semibold">No peers detected yet</p>
              <p className="text-xs text-gray-400">
                Keep propagation running and move around to encounter other
                devices.
              </p>
            </div>
          </div>
        )}

        {/* All Emergency Bundles */}
        {allBundles.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-3">
              Emergency Messages ({allBundles.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allBundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="p-3 bg-gray-700 rounded text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {bundle.payload.emergencyInfo.label}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        bundle.status === "FORWARDED"
                          ? "bg-green-600"
                          : "bg-yellow-600"
                      }`}
                    >
                      {bundle.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {bundle.sourceId === stats.nodeId
                      ? "Your message"
                      : "Received message"}{" "}
                    • {formatTimeAgo(bundle.timestamp)} • {bundle.hopCount} hops
                    • TTL: {formatTTL(bundle.ttl)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allBundles.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <div>
              <p className="font-semibold">No emergency messages stored</p>
              <p className="text-xs text-gray-400">
                Create an SOS or keep propagation running to collect relayed
                messages.
              </p>
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400">
          <div className="font-semibold mb-2">System Information</div>
          <div className="space-y-1">
            <div>Node ID: {stats.nodeId?.slice(0, 20)}...</div>
            <div>Bundles Created: {stats.bundlesCreated}</div>
            <div>Bundles Received: {stats.bundlesReceived}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSView;
