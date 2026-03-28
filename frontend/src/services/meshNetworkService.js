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
 */
class MeshNetworkService {
  constructor() {
    this.isRunning = false;
    this.simulationMode = false;
    this.simMessages = [];
    this.listeners = {
      messageReceived: [],
      peerDiscovered: [],
      peerLost: [],
    };
    this.nativeListenersRegistered = false;

    if (isNative()) {
      this.setupEventListeners();
    } else {
      console.warn("[Mesh] Running in browser - simulation mode enabled");
    }
  }

  setupEventListeners() {
    if (this.nativeListenersRegistered) return;

    MeshNetwork.addListener("messageReceived", (data) => {
      console.log("[Mesh] Message received:", data);
      this.listeners.messageReceived.forEach((cb) => cb(data));
    });

    MeshNetwork.addListener("peerDiscovered", (data) => {
      console.log("[Mesh] Peer discovered:", data.peerId);
      this.listeners.peerDiscovered.forEach((cb) => cb(data));
    });

    MeshNetwork.addListener("peerLost", (data) => {
      console.log("[Mesh] Peer lost:", data.peerId);
      this.listeners.peerLost.forEach((cb) => cb(data));
    });

    this.nativeListenersRegistered = true;
  }

  ensureNativeAvailable() {
    if (!isNative() || !MeshNetwork) {
      throw new Error("Mesh requires native Android. Deploy to device/emulator.");
    }
  }

  /**
   * Start the mesh network
   */
  async startMesh() {
    try {
      console.log("[Mesh] Starting mesh network...");

      // BROWSER SIMULATION
      if (!isNative()) {
        console.warn("[Mesh] ⚠️ Browser simulation mode active");
        this.isRunning = true;
        this.simulationMode = true;
        this.simMessages = [];
        return { success: true, message: "Simulation mode (browser)" };
      }

      // NATIVE MODE
      this.ensureNativeAvailable();

      // Request Capacitor Permissions directly mapped to Java Plugin
      if (MeshNetwork.requestPermissions) {
        try {
          const permResult = await MeshNetwork.requestPermissions();
          if (!permResult?.granted) {
             console.warn("[Mesh] Native permissions might require manual approval");
          }
        } catch (e) {
          console.warn("[Mesh] requestPermissions bypass:", e);
        }
      }

      // Execute Native Start
      const result = await MeshNetwork.startMesh();
      
      this.isRunning = true;
      this.simulationMode = false;
      console.log("[Mesh] ✅ Mesh started successfully:", result);

      return result;
    } catch (error) {
      console.error("[Mesh] ❌ Failed to start mesh:", error);
      throw error;
    }
  }

  /**
   * Stop the mesh network
   */
  async stopMesh() {
    try {
      if (!isNative()) {
        this.isRunning = false;
        this.simulationMode = false;
        return { success: true, message: "Simulation stopped" };
      }

      const result = await MeshNetwork.stopMesh();
      this.isRunning = false;
      return result;
    } catch (error) {
      console.error("[Mesh] Failed to stop mesh:", error);
      throw error;
    }
  }

  /**
   * Send a message through the mesh network
   */
  async sendMessage({ payload, lat = 0, lng = 0, ttl = 10 }) {
    try {
      if (!this.isRunning) {
        throw new Error("Mesh network is not running. Call startMesh() first.");
      }

      if (!isNative()) {
        const messageId = `sim-${Date.now()}`;
        const simulated = { sender: "SimNode", payload, timestamp: Date.now() };
        this.simMessages.unshift(simulated);
        this.listeners.messageReceived.forEach((cb) => cb(simulated));
        return { success: true, messageId };
      }

      // Native Bridge Mapping (Matched with Java String payload)
      const result = await MeshNetwork.sendMessage({ payload });
      return result;
    } catch (error) {
      console.error("[Mesh] Failed to send message:", error);
      throw error;
    }
  }

  async getPeers() {
    try {
      if (!isNative()) return [];
      const result = await MeshNetwork.getPeers();
      return result.peers || [];
    } catch (error) {
      console.error("[Mesh] Failed to get peers:", error);
      return [];
    }
  }

  async getMessages() {
    try {
      if (!isNative()) return this.simMessages;
      const result = await MeshNetwork.getMessages();
      return result.messages || [];
    } catch (error) {
      console.error("[Mesh] Failed to get messages:", error);
      return [];
    }
  }

  async getStatus() {
    try {
      if (!isNative()) {
        return { isRunning: this.isRunning, peerCount: 0 };
      }
      const result = await MeshNetwork.getStatus();
      return result.status || {};
    } catch (error) {
      console.error("[Mesh] Failed to get status:", error);
      return {};
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  async sendSOS({ message, lat, lng, metadata = {} }) {
    const sosPayload = JSON.stringify({
      type: "SOS",
      message,
      metadata,
      timestamp: Date.now(),
    });

    return this.sendMessage({ payload: sosPayload, lat, lng, ttl: 20 });
  }

  async broadcastAnnouncement(message, options = {}) {
    const payload = JSON.stringify({
      type: "ANNOUNCEMENT",
      message,
      ...options,
      timestamp: Date.now(),
    });

    return this.sendMessage({ payload, lat: options.lat || 0, lng: options.lng || 0, ttl: options.ttl || 10 });
  }
}

// Create and export singleton instance
const meshNetworkService = new MeshNetworkService();

export default meshNetworkService;