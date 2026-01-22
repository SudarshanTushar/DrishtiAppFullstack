import { registerPlugin, Capacitor } from "@capacitor/core";

/**
 * MeshNetwork Plugin Interface
 * Provides native Android mesh networking capabilities via BLE + Wi-Fi Direct
 */
const MeshNetwork = registerPlugin("MeshNetwork");

/**
 * Check if we're running in native environment
 */
const isNative = () => Capacitor.isNativePlatform();

/**
 * MeshNetworkService
 * JavaScript wrapper for the native mesh networking functionality
 *
 * Features:
 * - BLE peer discovery
 * - Wi-Fi Direct P2P data exchange
 * - DTN store-carry-forward with SQLite
 * - Works completely offline (no SIM, no internet, no server)
 * - Browser simulation mode for testing UI (non-functional)
 */
class MeshNetworkService {
  constructor() {
    this.isRunning = false;
    this.simulationMode = false; // For browser testing
    this.simMessages = [];
    this.listeners = {
      messageReceived: [],
      peerDiscovered: [],
      peerLost: [],
    };
    this.nativeListenersRegistered = false;

    // Register event listeners only on native
    if (isNative()) {
      this.setupEventListeners();
    } else {
      console.warn("[Mesh] Running in browser - simulation mode enabled");
    }
  }

  setupEventListeners() {
    if (this.nativeListenersRegistered) return;

    // Listen for incoming messages
    MeshNetwork.addListener("messageReceived", (data) => {
      console.log("[Mesh] Message received:", data);
      this.listeners.messageReceived.forEach((callback) => callback(data));
    });

    // Listen for peer discovery
    MeshNetwork.addListener("peerDiscovered", (data) => {
      console.log("[Mesh] Peer discovered:", data.peerId);
      this.listeners.peerDiscovered.forEach((callback) => callback(data));
    });

    // Listen for peer loss
    MeshNetwork.addListener("peerLost", (data) => {
      console.log("[Mesh] Peer lost:", data.peerId);
      this.listeners.peerLost.forEach((callback) => callback(data));
    });

    this.nativeListenersRegistered = true;
  }

  ensureNativeAvailable() {
    if (!isNative()) {
      throw new Error(
        "Mesh requires native Android. Deploy to device/emulator.",
      );
    }
    if (!MeshNetwork) {
      throw new Error(
        "MeshNetwork plugin not available. Check native registration.",
      );
    }
  }

  /**
   * Start the mesh network
   * Begins BLE advertising/scanning and Wi-Fi Direct discovery
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async startMesh(options = {}) {
    try {
      console.log("[Mesh] Starting mesh network...");
      console.log(
        "[Mesh] Platform:",
        isNative() ? "Native (Android)" : "Web Browser",
      );

      const background = !!options.background;

      // BROWSER SIMULATION MODE - for UI testing only
      if (!isNative()) {
        console.warn(
          "[Mesh] ⚠️ Browser simulation mode - mesh is NOT actually running",
        );
        console.warn(
          "[Mesh] ⚠️ Install APK on Android device for real functionality",
        );
        this.isRunning = true;
        this.simulationMode = true;
        this.simMessages = [];
        return { success: true, message: "Simulation mode (browser)" };
      }

      // NATIVE MODE - real mesh networking
      this.ensureNativeAvailable();

      // Request runtime permissions (Android 12+/13+ BLE/Wi-Fi)
      try {
        if (MeshNetwork.requestPermissions) {
          console.log("[Mesh] Requesting runtime permissions via plugin...");
          const permResult = await MeshNetwork.requestPermissions();
          console.log("[Mesh] Permission request completed", permResult);

          if (!permResult?.granted) {
            throw new Error("Mesh permissions not granted by user");
          }
        } else {
          console.warn(
            "[Mesh] MeshNetwork.requestPermissions not available; ensure permissions are granted in native layer",
          );
        }
      } catch (permErr) {
        console.warn("[Mesh] Permission request warning:", permErr?.message);
      }

      console.log("[Mesh] Calling native startMesh()...");
      const result = await MeshNetwork.startMesh({ background });

      // Native returns { success: boolean, message?: string }
      if (!result || result.success === false) {
        const msg =
          result?.message ||
          "Mesh start failed. Turn on Bluetooth and grant Location / Nearby Wi‑Fi permissions.";
        throw new Error(msg);
      }

      // Verify status after start to catch radio-precheck failures
      try {
        const status = await this.getStatus();
        if (!status?.isRunning) {
          throw new Error(
            "Mesh service not running. Enable Bluetooth and retry start.",
          );
        }
      } catch (statusErr) {
        console.warn("[Mesh] Status check after start failed", statusErr);
        throw statusErr;
      }

      this.isRunning = true;
      this.simulationMode = false;
      console.log("[Mesh] ✅ Mesh network started successfully:", result);

      return result || { success: true, message: "Mesh started" };
    } catch (error) {
      console.error("[Mesh] ❌ Failed to start mesh:", error);
      console.error("[Mesh] Error details:", {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      });
      throw error;
    }
  }

  async checkPermissions() {
    try {
      if (this.simulationMode || !isNative()) {
        return { granted: true };
      }
      if (MeshNetwork.checkPermissions) {
        return await MeshNetwork.checkPermissions();
      }
      return { granted: true };
    } catch (error) {
      console.error("[Mesh] Failed to check permissions:", error);
      return { granted: false, error: error.message };
    }
  }

  async requestPermissions() {
    try {
      if (this.simulationMode || !isNative()) {
        return { granted: true };
      }
      if (MeshNetwork.requestPermissions) {
        return await MeshNetwork.requestPermissions();
      }
      return { granted: true };
    } catch (error) {
      console.error("[Mesh] Failed to request permissions:", error);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Stop the mesh network
   * Stops all BLE and Wi-Fi Direct operations
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async stopMesh() {
    try {
      console.log("[Mesh] Stopping mesh network...");

      // Browser simulation mode
      if (this.simulationMode || !isNative()) {
        this.isRunning = false;
        this.simulationMode = false;
        this.simMessages = [];
        console.log("[Mesh] Simulation stopped");
        return { success: true, message: "Simulation stopped" };
      }

      // Native mode
      const result = await MeshNetwork.stopMesh();
      this.isRunning = false;
      console.log("[Mesh] Mesh network stopped");
      return result;
    } catch (error) {
      console.error("[Mesh] Failed to stop mesh:", error);
      throw error;
    }
  }

  /**
   * Send a message through the mesh network
   * Message will be stored locally and forwarded when peers are available
   *
   * @param {Object} options - Message options
   * @param {string} options.payload - The message content (JSON string or text)
   * @param {number} [options.lat] - Latitude (optional)
   * @param {number} [options.lng] - Longitude (optional)
   * @param {number} [options.ttl=10] - Time-to-live (hop count limit)
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendMessage({ payload, lat, lng, ttl = 10 }) {
    try {
      if (!this.isRunning) {
        throw new Error("Mesh network is not running. Call startMesh() first.");
      }

      // Simulation path for browser/dev
      if (this.simulationMode || !isNative()) {
        const messageId = `sim-${Date.now()}`;
        const simulated = {
          id: messageId,
          payload,
          lat: lat || 0,
          lng: lng || 0,
          ttl,
          hops: 0,
          timestamp: Date.now(),
        };
        this.simMessages.unshift(simulated);
        this.listeners.messageReceived.forEach((cb) => cb(simulated));
        return { success: true, messageId };
      }

      console.log("[Mesh] Sending message:", payload);

      const result = await MeshNetwork.sendMessage({
        payload,
        lat: lat || 0,
        lng: lng || 0,
        ttl,
      });

      console.log("[Mesh] Message queued with ID:", result.messageId);
      return result;
    } catch (error) {
      console.error("[Mesh] Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Get list of currently connected peers
   *
   * @returns {Promise<Array<{id: string, lastSeen: number}>>}
   */
  async getPeers() {
    try {
      if (this.simulationMode || !isNative()) {
        return [];
      }
      const result = await MeshNetwork.getPeers();
      return result.peers || [];
    } catch (error) {
      console.error("[Mesh] Failed to get peers:", error);
      return [];
    }
  }

  /**
   * Get all stored messages from local DTN database
   *
   * @returns {Promise<Array<Object>>}
   */
  async getMessages() {
    try {
      if (this.simulationMode || !isNative()) {
        return this.simMessages;
      }
      const result = await MeshNetwork.getMessages();
      return result.messages || [];
    } catch (error) {
      console.error("[Mesh] Failed to get messages:", error);
      return [];
    }
  }

  async getStatus() {
    try {
      if (this.simulationMode || !isNative()) {
        return {
          isRunning: this.isRunning,
          peerCount: 0,
          pendingMessages: this.simMessages.length,
          currentDiscoverIntervalMs: 0,
        };
      }
      const result = await MeshNetwork.getStatus();
      return result.status || {};
    } catch (error) {
      console.error("[Mesh] Failed to get status:", error);
      return {};
    }
  }

  /**
   * Register a callback for mesh events
   *
   * @param {string} event - Event name ('messageReceived', 'peerDiscovered', 'peerLost')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Unregister a callback for mesh events
   *
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    }
  }

  /**
   * Send an SOS message with current location
   *
   * @param {Object} options - SOS options
   * @param {string} options.message - SOS message
   * @param {number} options.lat - Latitude
   * @param {number} options.lng - Longitude
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendSOS({ message, lat, lng, metadata = {} }) {
    const sosPayload = JSON.stringify({
      type: "SOS",
      message,
      metadata,
      timestamp: Date.now(),
    });

    return this.sendMessage({
      payload: sosPayload,
      lat,
      lng,
      ttl: 20, // Higher TTL for SOS messages
    });
  }

  /**
   * Broadcast a general announcement
   *
   * @param {string} message - Announcement message
   * @param {Object} [options] - Additional options
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async broadcastAnnouncement(message, options = {}) {
    const payload = JSON.stringify({
      type: "ANNOUNCEMENT",
      message,
      ...options,
      timestamp: Date.now(),
    });

    return this.sendMessage({
      payload,
      lat: options.lat || 0,
      lng: options.lng || 0,
      ttl: options.ttl || 10,
    });
  }

  /**
   * Get mesh network status
   *
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasListeners: Object.values(this.listeners).some((arr) => arr.length > 0),
    };
  }
}

// Create and export singleton instance
const meshNetworkService = new MeshNetworkService();

export default meshNetworkService;
