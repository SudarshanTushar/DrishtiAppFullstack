// ════════════════════════════════════════════════════════════════════════════
// PEER DISCOVERY SERVICE - SIMULATION MODE (FIXED FOR BUILD)
// ════════════════════════════════════════════════════════════════════════════
//
// NOTE: Native Bluetooth plugin was removed to resolve Gradle build conflicts.
// This driver now runs in "Simulation Mode" to demonstrate functionality
// without crashing the build.
//
// ════════════════════════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";

// Battery levels affect scan behavior (Simulated)
const BATTERY_THRESHOLDS = {
  CRITICAL: 10,
  LOW: 20,
  NORMAL: 50,
};

export const peerDiscoveryService = {
  // Internal state
  _isInitialized: false,
  _isScanning: false,
  _isAdvertising: false,
  _discoveredPeers: new Map(),
  _listeners: [],
  _batteryLevel: 100,
  _mockTimer: null,

  // ──────────────────────────────────────────────────────────────────────────
  // 1. INITIALIZATION
  // ──────────────────────────────────────────────────────────────────────────

  async initialize() {
    if (this._isInitialized) return true;

    console.log("PeerDiscovery: Initializing Simulation Driver...");
    
    // Simulate initialization delay
    await new Promise(r => setTimeout(r, 500));
    
    this._isInitialized = true;
    console.log("PeerDiscovery: Initialized successfully (SIMULATED)");
    return true;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DISCOVERY (SIMULATED SCANNING)
  // ──────────────────────────────────────────────────────────────────────────

  async startDiscovery(onPeerDiscovered) {
    if (!this._isInitialized) await this.initialize();
    if (this._isScanning) return true;

    this._isScanning = true;
    this._notifyListeners("discovery_started", {});
    console.log("PeerDiscovery: Scanning started (Simulated 2.4GHz)...");

    // START SIMULATION LOOP
    this._runSimulationLoop(onPeerDiscovered);
    return true;
  },

  async stopDiscovery() {
    this._isScanning = false;
    if (this._mockTimer) clearTimeout(this._mockTimer);
    this._notifyListeners("discovery_stopped", {});
    console.log("PeerDiscovery: Scanning stopped");
  },

  // Simulates finding a device randomly every few seconds
  _runSimulationLoop(callback) {
    if (!this._isScanning) return;

    // Random delay between 3s and 8s
    const delay = Math.floor(Math.random() * 5000) + 3000;

    this._mockTimer = setTimeout(() => {
      if (!this._isScanning) return;

      // 50% chance to find a "Rescue Unit" or "Civilian"
      const isRescue = Math.random() > 0.7;
      const peerId = isRescue ? `UNIT-${Math.floor(Math.random()*100)}` : `USER-${Math.floor(Math.random()*999)}`;
      
      const mockPeer = {
        id: peerId,
        name: isRescue ? "NDRF-Rescue-Node" : "Civilian-Device",
        rssi: -1 * (Math.floor(Math.random() * 40) + 40), // -40 to -80
        lastSeen: Date.now(),
        metadata: ["BUNDLE-SOS-123"] // Mock bundle
      };

      // Calculate pseudo-distance
      mockPeer.distance = this._estimateDistance(mockPeer.rssi);

      this._discoveredPeers.set(peerId, mockPeer);
      
      // Notify App
      if (callback) callback(mockPeer);
      this._notifyListeners("peer_discovered", mockPeer);

      // Continue Loop
      this._runSimulationLoop(callback);

    }, delay);
  },

  _estimateDistance(rssi) {
    if (rssi > -60) return "immediate (< 1m)";
    if (rssi > -75) return "near (1-5m)";
    return "far (> 10m)";
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. HANDSHAKE (SIMULATED)
  // ──────────────────────────────────────────────────────────────────────────

  async connectAndHandshake(peerId) {
    console.log(`PeerDiscovery: Handshaking with ${peerId}...`);
    
    // Simulate network latency (800ms)
    await new Promise(r => setTimeout(r, 800));

    // Return success with mock bundles
    return {
      peerId,
      bundleSummary: ["BUNDLE-SOS-DEMO-1", "BUNDLE-MSG-DEMO-2"],
      success: true,
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. UTILITIES (STUBS)
  // ──────────────────────────────────────────────────────────────────────────

  async startAdvertising() {
    this._isAdvertising = true;
    console.log("PeerDiscovery: Advertising Presence (Simulated)");
    return true;
  },

  async stopAdvertising() {
    this._isAdvertising = false;
  },

  getRecommendedScanInterval() {
    return 15000; // Fixed for simulation
  },

  setBatteryLevel(level) {
    this._batteryLevel = level;
    this._notifyListeners("battery_changed", { level });
  },

  getDiscoveredPeers() {
    return Array.from(this._discoveredPeers.values());
  },

  getPeerCount() {
    return this._discoveredPeers.size;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. EVENT SYSTEM
  // ──────────────────────────────────────────────────────────────────────────

  addEventListener(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback);
    };
  },

  _notifyListeners(event, data) {
    this._listeners.forEach((listener) => {
      try { listener(event, data); } catch (e) { console.error(e); }
    });
  },

  getStatus() {
    return {
      initialized: this._isInitialized,
      scanning: this._isScanning,
      advertising: this._isAdvertising,
      peersDiscovered: this._discoveredPeers.size,
      batteryLevel: this._batteryLevel,
      platform: "android (simulated)",
    };
  },
};