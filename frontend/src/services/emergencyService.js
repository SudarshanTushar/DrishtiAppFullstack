import { dtnService } from "./dtnService";
import { peerDiscoveryService } from "./peerDiscoveryService";

// 🚀 DIRECT CONNECTION
const DIRECT_API_URL = "https://157.245.111.124.nip.io";

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
  // 1. CREATE EMERGENCY MESSAGE
  async createEmergency(params) {
    const payload = {
        emergencyType: params.type || "MEDICAL",
        message: params.message || "SOS",
        timestamp: Date.now(),
        user: params.userInfo || { name: "Unknown" },
        location: params.location || { lat: 0, lng: 0 }
    };
    // Create local DTN bundle
    const bundle = dtnService.createEmergencyMessage(payload);
    return { success: true, bundleId: bundle.id, bundle: bundle };
  },

  // 2. DISPATCH (CLOUD + MESH)
  async dispatchEmergency(emergencyData) {
    // PHASE 1: Try Cloud Dispatch
    try {
      console.log("🚨 Dispatching SOS to Cloud...");
      
      const meshPayload = {
        sender: emergencyData.user?.name || "Anonymous_User",
        text: `SOS: ${emergencyData.emergencyType} - ${emergencyData.message}`,
        timestamp: Date.now() / 1000
      };

      const response = await fetch(`${DIRECT_API_URL}/mesh/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meshPayload),
      });

      if (response.ok) {
        console.log("✅ SOS Received by Server");
        return { method: "NETWORK", success: true, data: await response.json() };
      }
    } catch (error) {
      console.warn("⚠️ Cloud Failed, Switching to Mesh DTN", error);
    }

    // PHASE 2: Fallback to Offline Mesh
    const dtnResult = await this.createEmergency(emergencyData);
    return {
      method: "DTN",
      success: true,
      data: dtnResult,
      message: "Using device-to-device propagation",
    };
  },

  // 3. HELPER FUNCTIONS (REQUIRED FOR UI TO WORK)
  getEmergencyBundles() { 
    return dtnService.getEmergencyBundles(); 
  },

  getEmergencyById(id) { 
    return dtnService.getBundleDetails(id); 
  },

  getEmergencyStats() { 
    return { 
        totalEmergencies: dtnService.getEmergencyBundles().length,
        myEmergencies: 0,
        forwardedEmergencies: 0,
        peersEncountered: 5,
        propagationActive: true
    }; 
  },

  async startPropagation() { 
    await peerDiscoveryService.initialize();
    return { success: true, message: "Propagation Active" };
  },

  async stopPropagation() { 
    await peerDiscoveryService.stopDiscovery(); 
    return { success: true, message: "Propagation Stopped" };
  },

  _ensureDiscoveryRunning() {
      // Auto-start logic placeholder
  },

  async _getCurrentLocation() {
    return { lat: 26.14, lng: 91.73 }; // Default to Guwahati for demo
  },

  _getDeviceId() {
    return "DEVICE-" + Math.floor(Math.random() * 10000);
  },

  addEventListener(callback) {
      // Mock listener
      return () => {};
  }
};

// Legacy support for direct calls
export const triggerSOS = async (lat, lng, type = "MEDICAL") => {
  return emergencyService.dispatchEmergency({
    type,
    location: { lat, lng },
    message: `Emergency at ${lat}, ${lng}`,
    user: { name: "Demo User" }
  });
};