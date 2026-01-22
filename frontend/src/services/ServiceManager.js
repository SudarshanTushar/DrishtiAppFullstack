// ════════════════════════════════════════════════════════════════════════════
// SERVICE MANAGER - LAZY SERVICE INITIALIZATION
// ════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Central registry for all heavy services
//
// PRINCIPLES:
// - Services are NOT initialized at import time
// - Services load only when explicitly requested
// - Services can be stopped to free resources
// - Services share common lifecycle management
//
// USAGE:
//   const dtn = await serviceManager.initService('dtn');
//   dtn.startContinuousDiscovery();
//
// ════════════════════════════════════════════════════════════════════════════

class ServiceManager {
  constructor() {
    this.services = {};
    this.loading = {};
    this.listeners = [];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LAZY SERVICE INITIALIZATION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Initialize a service (lazy-loaded)
   * Returns cached instance if already loaded
   */
  async initService(name) {
    // Return cached if available
    if (this.services[name]) {
      console.log(`Service '${name}' already loaded`);
      return this.services[name];
    }

    // Prevent duplicate loading
    if (this.loading[name]) {
      console.log(`Service '${name}' already loading, waiting...`);
      return this.loading[name];
    }

    // Start loading
    console.log(`Loading service '${name}'...`);
    this.loading[name] = this._loadService(name);

    try {
      const service = await this.loading[name];
      this.services[name] = service;
      delete this.loading[name];

      this._notifyListeners("service_loaded", { name, service });
      console.log(`Service '${name}' loaded successfully`);

      return service;
    } catch (error) {
      delete this.loading[name];
      console.error(`Failed to load service '${name}':`, error);
      throw error;
    }
  }

  /**
   * Internal: Load specific service module
   */
  async _loadService(name) {
    switch (name) {
      case "dtn": {
        const { dtnService } = await import("./dtnService");
        return dtnService;
      }

      case "peerDiscovery": {
        const { peerDiscoveryService } = await import("./peerDiscoveryService");
        return peerDiscoveryService;
      }

      case "emergency": {
        const { emergencyService } = await import("./emergencyService");
        return emergencyService;
      }

      case "network": {
        const { networkManager } = await import("./NetworkManager");
        return networkManager;
      }

      case "hardware": {
        const { hardwareManager } = await import("./HardwareManager");
        return hardwareManager;
      }

      case "platform": {
        const { platformGuard } = await import("./PlatformGuard");
        return platformGuard;
      }

      default:
        throw new Error(`Unknown service: ${name}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SERVICE LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Stop a service (if it supports stopping)
   */
  stopService(name) {
    const service = this.services[name];
    if (!service) {
      console.warn(`Service '${name}' not loaded, cannot stop`);
      return false;
    }

    if (typeof service.stop === "function") {
      console.log(`Stopping service '${name}'...`);
      service.stop();
      this._notifyListeners("service_stopped", { name });
      return true;
    } else {
      console.warn(`Service '${name}' does not support stopping`);
      return false;
    }
  }

  /**
   * Unload a service (remove from cache)
   */
  unloadService(name) {
    if (this.services[name]) {
      this.stopService(name);
      delete this.services[name];
      console.log(`Service '${name}' unloaded`);
      this._notifyListeners("service_unloaded", { name });
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(name) {
    if (this.services[name]) return "loaded";
    if (this.loading[name]) return "loading";
    return "not_loaded";
  }

  /**
   * Check if service is loaded
   */
  isServiceLoaded(name) {
    return !!this.services[name];
  }

  /**
   * Get loaded service (synchronous, may return null)
   */
  getService(name) {
    return this.services[name] || null;
  }

  /**
   * Get all loaded services
   */
  getLoadedServices() {
    return Object.keys(this.services);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH OPERATIONS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Initialize multiple services
   */
  async initServices(names) {
    const promises = names.map((name) => this.initService(name));
    return Promise.all(promises);
  }

  /**
   * Stop all loaded services
   */
  stopAllServices() {
    const names = Object.keys(this.services);
    names.forEach((name) => this.stopService(name));
  }

  /**
   * Unload all services
   */
  unloadAllServices() {
    const names = Object.keys(this.services);
    names.forEach((name) => this.unloadService(name));
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

  _notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (e) {
        console.error("ServiceManager: Listener error", e);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DIAGNOSTICS
  // ──────────────────────────────────────────────────────────────────────────

  getDiagnostics() {
    return {
      loaded: Object.keys(this.services),
      loading: Object.keys(this.loading),
      listeners: this.listeners.length,
    };
  }
}

// Singleton instance
export const serviceManager = new ServiceManager();

// Debug helper (development only)
if (process.env.NODE_ENV === "development") {
  window.__serviceManager = serviceManager;
}
