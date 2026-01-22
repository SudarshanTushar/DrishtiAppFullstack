// ════════════════════════════════════════════════════════════════════════════
// DTN CORE ENGINE - DELAY TOLERANT NETWORKING FOR DISASTER SCENARIOS
// ════════════════════════════════════════════════════════════════════════════
//
// THIS IS NOT A CHAT APP. THIS IS A STORE-CARRY-FORWARD SYSTEM.
//
// DESIGN PRINCIPLES:
// 1. No assumption of end-to-end connectivity
// 2. Messages travel with people (physical movement)
// 3. Multi-hop propagation through opportunistic encounters
// 4. Epidemic routing for emergency messages
// 5. Honest state reporting (no fake "connected" status)
//
// SYSTEM WORKS WHEN:
// - No internet, no cellular, no SIM card, no infrastructure
// - Devices meet briefly and exchange bundles
// - Messages propagate hop-by-hop across city/town over hours
//
// ════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "dtn_bundle_store";
const PEER_HISTORY_KEY = "dtn_peer_history";
const STATS_KEY = "dtn_statistics";
const MAX_BUNDLE_SIZE = 5 * 1024; // 5KB max per bundle
const MAX_HOP_COUNT = 50; // Prevent infinite loops
const SCAN_INTERVAL = 15000; // 15 seconds between scans (battery-aware)

// Generate persistent node ID (survives app restarts)
const getOrCreateNodeId = () => {
  let nodeId = localStorage.getItem("dtn_node_id");
  if (!nodeId) {
    nodeId = `NODE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem("dtn_node_id", nodeId);
  }
  return nodeId;
};

const MY_NODE_ID = getOrCreateNodeId();

// ════════════════════════════════════════════════════════════════════════════
// DTN SERVICE - CORE IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════════════

export const dtnService = {
  // Internal state
  _scanning: false,
  _scanTimer: null,
  _listeners: [],
  _stats: {
    bundlesCreated: 0,
    bundlesReceived: 0,
    bundlesForwarded: 0,
    peersEncountered: 0,
    lastEncounter: null,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 1. BUNDLE PROTOCOL - MESSAGE STRUCTURE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates a DTN Bundle (the atomic unit of DTN communication)
   *
   * Bundle Structure:
   * - Unique ID for deduplication
   * - Source/Destination metadata
   * - Payload (emergency message)
   * - Routing metadata (TTL, hop count)
   * - Custody chain (who carried this message)
   * - State tracking (STORED → CARRYING → FORWARDED → DELIVERED)
   */
  createBundle(content, type = "NORMAL", ttlHours = 24, priority = "MEDIUM") {
    const bundle = {
      // IDENTITY
      id: crypto.randomUUID(),
      sourceId: MY_NODE_ID,
      destId: "BROADCAST", // Flood to all reachable nodes

      // CONTENT
      type: type, // "SOS" | "NORMAL" | "INFRASTRUCTURE"
      priority: priority, // "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
      payload: content,

      // TEMPORAL METADATA
      timestamp: Date.now(),
      ttl: Date.now() + ttlHours * 3600 * 1000,
      expiresIn: ttlHours * 3600 * 1000, // For UI display

      // ROUTING METADATA
      hopCount: 0,
      maxHops: MAX_HOP_COUNT,
      routingScheme: type === "SOS" ? "EPIDEMIC" : "SPRAY_AND_WAIT",
      sprayLimit: type === "SOS" ? 999 : 6, // Epidemic = unlimited, Spray = 6 copies
      copiesRemaining: type === "SOS" ? 999 : 6,

      // STATE TRACKING
      status: "STORED", // STORED → CARRYING → FORWARDED → DELIVERED
      custodyChain: [
        { nodeId: MY_NODE_ID, timestamp: Date.now(), action: "CREATED" },
      ],

      // METADATA
      size: new Blob([JSON.stringify(content)]).size,
      version: 1,
    };

    // Validate size
    if (bundle.size > MAX_BUNDLE_SIZE) {
      throw new Error(`Bundle exceeds max size (${MAX_BUNDLE_SIZE} bytes)`);
    }

    this._stats.bundlesCreated++;
    this._saveStats();

    return bundle;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. STORAGE LAYER - PERSISTENT BUNDLE STORAGE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all bundles from local storage
   * Performs automatic garbage collection on expired bundles
   */
  getStore() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const bundles = data ? JSON.parse(data) : [];

      // GARBAGE COLLECTION: Remove expired bundles
      const now = Date.now();
      const validBundles = bundles.filter((b) => b.ttl > now);

      // If we removed bundles, save cleaned store
      if (validBundles.length !== bundles.length) {
        this.saveStore(validBundles);
      }

      return validBundles;
    } catch (e) {
      console.error("DTN: Storage read error", e);
      return [];
    }
  },

  /**
   * Persist bundles to storage
   */
  saveStore(bundles) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles));
    } catch (e) {
      console.error("DTN: Storage write error", e);
    }
  },

  /**
   * Add a bundle to local storage
   * This is the "STORE" phase of Store-Carry-Forward
   */
  storeBundle(bundle) {
    const store = this.getStore();

    // Deduplication check
    const exists = store.some((b) => b.id === bundle.id);
    if (exists) {
      console.log(`DTN: Bundle ${bundle.id} already exists, skipping`);
      return false;
    }

    // Add to store
    store.push(bundle);
    this.saveStore(store);

    // Notify listeners
    this._notifyListeners("bundle_stored", bundle);

    return true;
  },

  /**
   * Create and store a new emergency message
   * Returns the bundle for immediate UI feedback
   */
  createEmergencyMessage(payload) {
    const bundle = this.createBundle(
      payload,
      "SOS",
      24, // 24 hour TTL
      "CRITICAL",
    );

    this.storeBundle(bundle);

    // Mark as CARRYING (user is now physically carrying this message)
    this.updateBundleStatus(bundle.id, "CARRYING");

    return bundle;
  },

  /**
   * Update bundle status with custody chain logging
   */
  updateBundleStatus(bundleId, newStatus, metadata = {}) {
    const store = this.getStore();
    const updated = store.map((bundle) => {
      if (bundle.id === bundleId) {
        const updatedBundle = {
          ...bundle,
          status: newStatus,
          custodyChain: [
            ...bundle.custodyChain,
            {
              nodeId: MY_NODE_ID,
              timestamp: Date.now(),
              action: newStatus,
              ...metadata,
            },
          ],
        };

        // Notify listeners
        this._notifyListeners("bundle_status_changed", updatedBundle);

        return updatedBundle;
      }
      return bundle;
    });

    this.saveStore(updated);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ROUTING ENGINE - EPIDEMIC & SPRAY-AND-WAIT
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * EPIDEMIC ROUTING (for emergency messages)
   * - Give copy to EVERY peer encountered
   * - Maximizes delivery probability
   * - Higher overhead but acceptable for critical messages
   *
   * SPRAY AND WAIT (for normal messages)
   * - Give copy to first N peers
   * - Then stop spraying and only carry
   * - Reduces network load
   */
  selectBundlesForForwarding(allBundles, peerMetadata) {
    return allBundles
      .filter((bundle) => {
        // Don't forward expired bundles
        if (bundle.ttl <= Date.now()) return false;

        // Don't forward if hop limit reached
        if (bundle.hopCount >= bundle.maxHops) return false;

        // EPIDEMIC: Always forward SOS/emergency
        if (bundle.routingScheme === "EPIDEMIC") return true;

        // SPRAY AND WAIT: Only forward if copies remaining
        if (bundle.routingScheme === "SPRAY_AND_WAIT") {
          return bundle.copiesRemaining > 0;
        }

        return false;
      })
      .map((bundle) => ({
        ...bundle,
        hopCount: bundle.hopCount + 1,
        copiesRemaining: Math.max(0, bundle.copiesRemaining - 1),
      }));
  },

  /**
   * Exchange bundles with a peer
   * This is the "FORWARD" phase of Store-Carry-Forward
   */
  async exchangeBundlesWithPeer(peerId, peerSummaryVector) {
    const localStore = this.getStore();

    // Step 1: Determine what to send to peer
    const localBundleIds = localStore.map((b) => b.id);
    const peerBundleIds = peerSummaryVector || [];

    // Bundles peer doesn't have
    const bundlesToSend = this.selectBundlesForForwarding(
      localStore.filter((b) => !peerBundleIds.includes(b.id)),
      { peerId },
    );

    // Step 2: Receive bundles from peer (simulated in real impl)
    // In real implementation, peer would send us their bundles

    // Step 3: Update local bundles as FORWARDED
    if (bundlesToSend.length > 0) {
      bundlesToSend.forEach((bundle) => {
        this.updateBundleStatus(bundle.id, "FORWARDED", {
          forwardedTo: peerId,
          hopCount: bundle.hopCount,
        });
      });

      this._stats.bundlesForwarded += bundlesToSend.length;
      this._saveStats();
    }

    // Log peer encounter
    this._logPeerEncounter(peerId);

    return {
      sent: bundlesToSend.length,
      received: 0, // Would be populated in real impl
      peerId: peerId,
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PEER DISCOVERY & EXCHANGE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Start continuous peer discovery
   * BATTERY-AWARE: Uses intervals, not continuous scanning
   */
  startContinuousDiscovery() {
    if (this._scanning) {
      console.log("DTN: Discovery already running");
      return;
    }

    this._scanning = true;

    const scanCycle = async () => {
      if (!this._scanning) return;

      try {
        await this.performDiscoveryScan();
      } catch (e) {
        console.error("DTN: Scan error", e);
      }

      // Schedule next scan (battery-aware interval)
      if (this._scanning) {
        this._scanTimer = setTimeout(scanCycle, SCAN_INTERVAL);
      }
    };

    // Start first scan
    scanCycle();

    this._notifyListeners("discovery_started", {});
  },

  /**
   * Stop peer discovery
   */
  stopContinuousDiscovery() {
    this._scanning = false;
    if (this._scanTimer) {
      clearTimeout(this._scanTimer);
      this._scanTimer = null;
    }
    this._notifyListeners("discovery_stopped", {});
  },

  /**
   * Perform one discovery scan cycle
   * In real implementation, this uses Bluetooth LE or Wi-Fi Direct
   */
  async performDiscoveryScan() {
    // SIMULATION: Real implementation would call native Bluetooth/WiFi APIs
    // For now, simulate finding peers probabilistically

    const peerFound = Math.random() > 0.6; // 40% chance per scan

    if (peerFound) {
      const peerId = `PEER-${Math.floor(Math.random() * 999)}`;
      const peerSummary = []; // Peer's bundle IDs

      // Exchange bundles
      const result = await this.exchangeBundlesWithPeer(peerId, peerSummary);

      this._notifyListeners("peer_encountered", {
        peerId,
        bundlesSent: result.sent,
        bundlesReceived: result.received,
        timestamp: Date.now(),
      });

      this._stats.peersEncountered++;
      this._stats.lastEncounter = Date.now();
      this._saveStats();

      return result;
    }

    return null;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. STATISTICS & MONITORING
  // ──────────────────────────────────────────────────────────────────────────

  getStatistics() {
    return {
      ...this._stats,
      bundleStore: this.getStore(),
      bundleCount: this.getStore().length,
      isScanning: this._scanning,
      nodeId: MY_NODE_ID,
    };
  },

  getBundleDetails(bundleId) {
    const store = this.getStore();
    return store.find((b) => b.id === bundleId);
  },

  getEmergencyBundles() {
    return this.getStore().filter((b) => b.type === "SOS");
  },

  _saveStats() {
    localStorage.setItem(STATS_KEY, JSON.stringify(this._stats));
  },

  _loadStats() {
    try {
      const stats = localStorage.getItem(STATS_KEY);
      if (stats) {
        this._stats = JSON.parse(stats);
      }
    } catch (e) {
      console.error("DTN: Stats load error", e);
    }
  },

  _logPeerEncounter(peerId) {
    try {
      const history = JSON.parse(
        localStorage.getItem(PEER_HISTORY_KEY) || "[]",
      );
      history.push({
        peerId,
        timestamp: Date.now(),
        location: null, // Could add GPS coordinates
      });
      // Keep last 100 encounters
      const recent = history.slice(-100);
      localStorage.setItem(PEER_HISTORY_KEY, JSON.stringify(recent));
    } catch (e) {
      console.error("DTN: Peer history error", e);
    }
  },

  getPeerHistory() {
    try {
      return JSON.parse(localStorage.getItem(PEER_HISTORY_KEY) || "[]");
    } catch (e) {
      return [];
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. EVENT SYSTEM
  // ──────────────────────────────────────────────────────────────────────────

  addEventListener(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback);
    };
  },

  _notifyListeners(event, data) {
    this._listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (e) {
        console.error("DTN: Listener error", e);
      }
    });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SYSTEM MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  initialize() {
    this._loadStats();
    console.log("DTN: Initialized", { nodeId: MY_NODE_ID });
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PEER_HISTORY_KEY);
    localStorage.removeItem(STATS_KEY);
    this._stats = {
      bundlesCreated: 0,
      bundlesReceived: 0,
      bundlesForwarded: 0,
      peersEncountered: 0,
      lastEncounter: null,
    };
  },
};

// Initialize on load
dtnService.initialize();
