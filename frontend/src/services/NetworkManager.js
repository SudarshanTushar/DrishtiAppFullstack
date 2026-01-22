// ════════════════════════════════════════════════════════════════════════════
// NETWORK MANAGER - UNIFIED NETWORK STATE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Provide HONEST network status across all connection types
//
// NEVER shows fake "connected" status
// ALWAYS reports ground truth about connectivity
//
// ════════════════════════════════════════════════════════════════════════════

import { platformGuard } from "./PlatformGuard";

class NetworkManager {
  constructor() {
    this.state = {
      hasInternet: false,
      hasCellular: false,
      dtnActive: false,
      meshActive: false,
      peersNearby: 0,
      lastCheck: null,
    };

    this.listeners = [];
    this.checkInterval = null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONNECTIVITY CHECKS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check internet connectivity (with timeout)
   */
  async checkInternetConnectivity() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeout);

      this.state.hasInternet = response.ok;
      this.state.lastCheck = Date.now();
    } catch (error) {
      this.state.hasInternet = false;
      this.state.lastCheck = Date.now();
    }

    this.notifyListeners();
    return this.state.hasInternet;
  }

  /**
   * Check cellular connectivity (native only)
   */
  async checkCellularConnectivity() {
    return platformGuard.guardNativeAPIAsync(async () => {
      try {
        // Use Capacitor Network plugin
        // const status = await Network.getStatus();
        // this.state.hasCellular = status.connectionType === 'cellular';

        // Placeholder
        this.state.hasCellular = false;
      } catch (error) {
        console.error("Cellular check error:", error);
        this.state.hasCellular = false;
      }

      this.notifyListeners();
      return this.state.hasCellular;
    }, false);
  }

  /**
   * Start periodic connectivity monitoring
   */
  startMonitoring(interval = 30000) {
    if (this.checkInterval) {
      console.warn("Network monitoring already started");
      return;
    }

    console.log("Starting network monitoring...");

    // Initial check
    this.checkInternetConnectivity();

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkInternetConnectivity();
    }, interval);

    // Listen for online/offline events (browser)
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
    }
  }

  /**
   * Stop connectivity monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Network monitoring stopped");
    }
  }

  handleOnline() {
    console.log("Browser reports online");
    this.checkInternetConnectivity();
  }

  handleOffline() {
    console.log("Browser reports offline");
    this.state.hasInternet = false;
    this.notifyListeners();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DTN STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Update DTN status
   */
  setDTNStatus(active, peersNearby = 0) {
    this.state.dtnActive = active;
    this.state.peersNearby = peersNearby;
    this.notifyListeners();
  }

  /**
   * Update mesh status
   */
  setMeshStatus(active) {
    this.state.meshActive = active;
    this.notifyListeners();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HONEST STATUS REPORTING
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get HONEST network status (never lies about connectivity)
   */
  getHonestStatus() {
    // Priority order: strongest to weakest connection
    if (this.state.hasInternet) {
      return {
        status: "ONLINE",
        type: "internet",
        color: "#10B981", // green
        icon: "🌐",
        description: "Internet available",
      };
    }

    if (this.state.hasCellular) {
      return {
        status: "CELLULAR",
        type: "cellular",
        color: "#3B82F6", // blue
        icon: "📶",
        description: "Cellular network available",
      };
    }

    if (this.state.dtnActive && this.state.peersNearby > 0) {
      return {
        status: "DTN_PEERS_NEARBY",
        type: "dtn",
        color: "#F59E0B", // amber
        icon: "📡",
        description: `${this.state.peersNearby} device(s) nearby`,
      };
    }

    if (this.state.dtnActive) {
      return {
        status: "DTN_SCANNING",
        type: "dtn",
        color: "#F59E0B", // amber
        icon: "🔍",
        description: "Scanning for devices",
      };
    }

    if (this.state.meshActive) {
      return {
        status: "MESH_STANDBY",
        type: "mesh",
        color: "#F59E0B", // amber
        icon: "🕸️",
        description: "Mesh standby",
      };
    }

    return {
      status: "OFFLINE",
      type: "offline",
      color: "#6B7280", // gray
      icon: "⚪",
      description: "No connectivity",
    };
  }

  /**
   * Get simple status string
   */
  getStatusString() {
    return this.getHonestStatus().status;
  }

  /**
   * Check if any form of connectivity exists
   */
  hasAnyConnectivity() {
    return (
      this.state.hasInternet ||
      this.state.hasCellular ||
      this.state.dtnActive ||
      this.state.meshActive
    );
  }

  /**
   * Check if offline emergency features should be shown
   */
  shouldShowOfflineFeatures() {
    return !this.state.hasInternet && !this.state.hasCellular;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STATE ACCESS
  // ──────────────────────────────────────────────────────────────────────────

  getState() {
    return { ...this.state };
  }

  isOnline() {
    return this.state.hasInternet;
  }

  isOffline() {
    return !this.hasAnyConnectivity();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EVENT SYSTEM
  // ──────────────────────────────────────────────────────────────────────────

  addEventListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners() {
    const status = this.getHonestStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status, this.state);
      } catch (e) {
        console.error("NetworkManager: Listener error", e);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DIAGNOSTICS
  // ──────────────────────────────────────────────────────────────────────────

  getDiagnostics() {
    return {
      state: { ...this.state },
      status: this.getHonestStatus(),
      hasAnyConnectivity: this.hasAnyConnectivity(),
      isMonitoring: !!this.checkInterval,
      listeners: this.listeners.length,
    };
  }
}

// Singleton instance
export const networkManager = new NetworkManager();

// Debug helper (development only)
if (process.env.NODE_ENV === "development") {
  window.__networkManager = networkManager;
}
