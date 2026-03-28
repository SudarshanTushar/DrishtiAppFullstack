// ════════════════════════════════════════════════════════════════════════════
// PEER DISCOVERY SERVICE - NATIVE MODE INTEGRATION
// ════════════════════════════════════════════════════════════════════════════
//
// This service now connects directly to the core meshNetworkService
// which triggers the actual Android Google Nearby hardware.
//
// ════════════════════════════════════════════════════════════════════════════

import meshNetworkService from "./meshNetworkService";

export const peerDiscoveryService = {
  // Internal state tracking
  _isInitialized: false,
  _isScanning: false,
  _isAdvertising: false,
  _discoveredPeers: new Map(),
  _listeners: [],

  // ──────────────────────────────────────────────────────────────────────────
  // 1. INITIALIZATION
  // ──────────────────────────────────────────────────────────────────────────

  async initialize() {
    if (this._isInitialized) return true;
    console.log("PeerDiscovery: Linking to Hardware Mesh Service...");
    
    // Listen to real hardware events from the core service
    meshNetworkService.on('peerDiscovered', (data) => {
        if (!data || !data.peerId) return;
        
        const peerInfo = {
            id: data.peerId,
            name: `Node-${data.peerId.substring(0,4)}`,
            lastSeen: Date.now(),
            rssi: "Connected", 
            distance: "nearby"
        };
        
        this._discoveredPeers.set(data.peerId, peerInfo);
        this._notifyListeners("peer_discovered", peerInfo);
    });

    meshNetworkService.on('peerLost', (data) => {
        if (!data || !data.peerId) return;
        this._discoveredPeers.delete(data.peerId);
        this._notifyListeners("peer_lost", { id: data.peerId });
    });

    this._isInitialized = true;
    return true;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DISCOVERY & ADVERTISING (MAPPED TO REAL HARDWARE)
  // ──────────────────────────────────────────────────────────────────────────

  async startDiscovery(onPeerDiscovered) {
    if (!this._isInitialized) await this.initialize();
    if (this._isScanning) return true;

    console.log("PeerDiscovery: Triggering Hardware Radio...");
    
    try {
        // Trigger the actual Android Plugin via the core service
        await meshNetworkService.startMesh();
        
        this._isScanning = true;
        this._isAdvertising = true; // Nearby does both automatically
        this._notifyListeners("discovery_started", {});
        
        // If a direct callback was provided, wrap it
        if (onPeerDiscovered) {
            meshNetworkService.on('peerDiscovered', (data) => {
                if(data && data.peerId) {
                   onPeerDiscovered({ id: data.peerId, name: `Node-${data.peerId.substring(0,4)}` });
                }
            });
        }
        return true;
    } catch (e) {
        console.error("PeerDiscovery Hardware Failed:", e);
        this._isScanning = false;
        return false;
    }
  },

  async stopDiscovery() {
    try {
        await meshNetworkService.stopMesh();
        this._isScanning = false;
        this._isAdvertising = false;
        this._discoveredPeers.clear();
        this._notifyListeners("discovery_stopped", {});
        console.log("PeerDiscovery: Hardware Radio Offline");
    } catch(e) {
        console.error("Failed to stop hardware:", e);
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. UTILITIES & EVENT SYSTEM
  // ──────────────────────────────────────────────────────────────────────────

  async startAdvertising() {
      // Handled automatically by startDiscovery in Nearby Connections
      return true;
  },

  async stopAdvertising() {
      // Handled automatically
      return true;
  },

  getDiscoveredPeers() {
    return Array.from(this._discoveredPeers.values());
  },

  getPeerCount() {
    return this._discoveredPeers.size;
  },

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

  async getStatus() {
    const hardwareStatus = await meshNetworkService.getStatus();
    return {
      initialized: this._isInitialized,
      scanning: hardwareStatus.isRunning || this._isScanning,
      advertising: hardwareStatus.isRunning || this._isAdvertising,
      peersDiscovered: this._discoveredPeers.size,
      platform: "android (hardware enabled)",
    };
  },
};