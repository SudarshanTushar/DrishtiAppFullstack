// ════════════════════════════════════════════════════════════════════════════
// EMERGENCY MESSAGE SERVICE - SOS MESSAGE CREATION & MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════
//
// EMERGENCY MESSAGE LIFECYCLE:
// 1. User triggers SOS
// 2. Message stored locally IMMEDIATELY (STORED state)
// 3. System marks as CARRYING (user is physically carrying message)
// 4. Background service discovers peers and forwards (FORWARDED state)
// 5. Message spreads hop-by-hop across city/town
// 6. When authority receives, marks as DELIVERED
//
// NEVER requires internet, cellular, or infrastructure
//
// ════════════════════════════════════════════════════════════════════════════

import { dtnService } from "./dtnService";
import { peerDiscoveryService } from "./peerDiscoveryService";

// Emergency types
export const EMERGENCY_TYPES = {
  MEDICAL: { label: "Medical Emergency", priority: "CRITICAL", color: "red" },
  FIRE: { label: "Fire", priority: "CRITICAL", color: "orange" },
  ACCIDENT: { label: "Accident", priority: "HIGH", color: "yellow" },
  FLOOD: { label: "Flood/Water", priority: "HIGH", color: "blue" },
  LANDSLIDE: { label: "Landslide", priority: "HIGH", color: "brown" },
  EARTHQUAKE: { label: "Earthquake", priority: "CRITICAL", color: "purple" },
  TRAPPED: { label: "Trapped/Buried", priority: "CRITICAL", color: "red" },
  MISSING: { label: "Missing Person", priority: "HIGH", color: "gray" },
  OTHER: { label: "Other Emergency", priority: "MEDIUM", color: "black" },
};

export const emergencyService = {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. EMERGENCY MESSAGE CREATION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Create emergency SOS message
   * This is the PRIMARY entry point for emergency situations
   *
   * Returns bundle object with:
   * - Unique ID
   * - User info
   * - Location
   * - Emergency type
   * - Timestamp
   * - Status (STORED → CARRYING)
   */
  async createEmergency({
    type = "MEDICAL",
    location = null,
    userInfo = {},
    message = "",
    severity = "HIGH",
  }) {
    // Get current location if not provided
    const finalLocation = location || (await this._getCurrentLocation());

    // Build emergency payload
    const payload = {
      // Emergency details
      emergencyType: type,
      emergencyInfo: EMERGENCY_TYPES[type] || EMERGENCY_TYPES.OTHER,
      severity: severity,
      message: message,

      // Location
      location: {
        lat: finalLocation?.lat || null,
        lng: finalLocation?.lng || null,
        accuracy: finalLocation?.accuracy || null,
        address: finalLocation?.address || "Unknown",
        landmark: finalLocation?.landmark || null,
      },

      // User information (for identification and contact)
      user: {
        name: userInfo.name || "Anonymous",
        age: userInfo.age || null,
        bloodType: userInfo.bloodType || null,
        medicalConditions: userInfo.medicalConditions || [],
        emergencyContacts: userInfo.emergencyContacts || [],
        languages: userInfo.languages || ["English"],
      },

      // Metadata
      timestamp: Date.now(),
      deviceId: this._getDeviceId(),

      // Instructions for responders
      responseNeeded: true,
      responseType: type === "MEDICAL" ? "ambulance" : "rescue",
    };

    // Create DTN bundle
    const bundle = dtnService.createEmergencyMessage(payload);

    console.log("Emergency: SOS created", {
      bundleId: bundle.id,
      type: type,
      status: bundle.status,
    });

    // Start discovery if not already running
    this._ensureDiscoveryRunning();

    return {
      success: true,
      bundleId: bundle.id,
      status: bundle.status,
      message: "Emergency message created and will spread as people move",
      bundle: bundle,
    };
  },

  /**
   * Try network dispatch first, fallback to DTN
   * This attempts traditional internet dispatch, but doesn't fail if offline
   */
  async dispatchEmergency(emergencyData) {
    // PHASE 1: Try traditional network dispatch
    try {
      const response = await Promise.race([
        fetch(
          "https://drishtiappbackend-9d88613ee49f.herokuapp.com/sos/dispatch",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emergencyData),
          },
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Network timeout")), 5000),
        ),
      ]);

      if (response.ok) {
        const result = await response.json();
        return {
          method: "NETWORK",
          success: true,
          data: result,
        };
      }
    } catch (error) {
      console.warn("Emergency: Network dispatch failed, using DTN", error);
    }

    // PHASE 2: Network failed, use DTN (ALWAYS works)
    const dtnResult = await this.createEmergency(emergencyData);

    return {
      method: "DTN",
      success: true,
      data: dtnResult,
      message: "Using device-to-device propagation",
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. EMERGENCY BUNDLE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all emergency bundles (user's and received)
   */
  getEmergencyBundles() {
    return dtnService.getEmergencyBundles();
  },

  /**
   * Get emergency bundle by ID
   */
  getEmergencyById(bundleId) {
    return dtnService.getBundleDetails(bundleId);
  },

  /**
   * Get emergency statistics
   */
  getEmergencyStats() {
    const bundles = this.getEmergencyBundles();
    const stats = dtnService.getStatistics();

    return {
      totalEmergencies: bundles.length,
      myEmergencies: bundles.filter((b) => b.sourceId === stats.nodeId).length,
      forwardedEmergencies: bundles.filter((b) => b.status === "FORWARDED")
        .length,
      carryingEmergencies: bundles.filter((b) => b.status === "CARRYING")
        .length,
      peersEncountered: stats.peersEncountered,
      lastEncounter: stats.lastEncounter,
      propagationActive: stats.isScanning,
    };
  },

  /**
   * Mark emergency as resolved/delivered
   */
  markEmergencyDelivered(bundleId) {
    dtnService.updateBundleStatus(bundleId, "DELIVERED", {
      deliveredAt: Date.now(),
    });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PROPAGATION CONTROL
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Start emergency propagation system
   * This begins peer discovery and bundle forwarding
   */
  async startPropagation() {
    // Initialize peer discovery
    const initialized = await peerDiscoveryService.initialize();
    if (!initialized) {
      return {
        success: false,
        message: "Peer discovery initialization failed",
      };
    }

    // Start continuous discovery
    dtnService.startContinuousDiscovery();

    // Start BLE scanning
    await peerDiscoveryService.startDiscovery((peer) => {
      console.log("Emergency: Peer discovered", peer);
    });

    return {
      success: true,
      message: "Emergency propagation active",
    };
  },

  /**
   * Stop propagation (to save battery)
   */
  async stopPropagation() {
    dtnService.stopContinuousDiscovery();
    await peerDiscoveryService.stopDiscovery();

    return {
      success: true,
      message: "Propagation paused",
    };
  },

  /**
   * Ensure discovery is running (auto-start)
   */
  _ensureDiscoveryRunning() {
    const stats = dtnService.getStatistics();
    if (!stats.isScanning) {
      this.startPropagation().catch((err) => {
        console.error("Emergency: Auto-start propagation failed", err);
      });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. LOCATION SERVICES
  // ──────────────────────────────────────────────────────────────────────────

  async _getCurrentLocation() {
    try {
      // Try HTML5 geolocation
      if ("geolocation" in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (error) => {
              console.warn("Emergency: Location error", error);
              resolve(null);
            },
            { timeout: 5000, enableHighAccuracy: true },
          );
        });
      }
    } catch (e) {
      console.error("Emergency: Location service error", e);
    }
    return null;
  },

  _getDeviceId() {
    // Get or create device ID
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `DEVICE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. EVENT LISTENERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Listen for emergency-related events
   */
  addEventListener(callback) {
    return dtnService.addEventListener((event, data) => {
      // Filter for emergency-relevant events
      if (event.includes("bundle") || event.includes("peer")) {
        callback(event, data);
      }
    });
  },
};

// Legacy compatibility
export const triggerSOS = async (lat, lng, type = "MEDICAL") => {
  return emergencyService.dispatchEmergency({
    type,
    location: { lat, lng },
    message: `Emergency at ${lat}, ${lng}`,
  });
};
