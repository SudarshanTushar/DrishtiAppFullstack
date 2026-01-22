// ════════════════════════════════════════════════════════════════════════════
// PLATFORM GUARD - SAFE NATIVE API ACCESS
// ════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Prevent crashes from web APIs on native platforms
//
// USAGE:
//   if (platformGuard.isNative()) {
//     // Safe to use Capacitor plugins
//   }
//
//   const result = platformGuard.guardNativeAPI(
//     () => BleClient.scan(),
//     null // fallback
//   );
//
// ════════════════════════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";

class PlatformGuard {
  constructor() {
    this.platform = Capacitor.getPlatform();
    this.isWeb = this.platform === "web";
    this.isAndroidPlatform = this.platform === "android";
    this.isIOSPlatform = this.platform === "ios";

    console.log("Platform detected:", this.platform);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PLATFORM DETECTION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check if running on native device (not web)
   */
  isNative() {
    return !this.isWeb;
  }

  /**
   * Check if running on Android
   */
  isAndroid() {
    return this.isAndroidPlatform;
  }

  /**
   * Check if running on iOS
   */
  isIOS() {
    return this.isIOSPlatform;
  }

  /**
   * Get platform name
   */
  getPlatform() {
    return this.platform;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NATIVE API GUARDS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Execute function only if on native platform
   * Returns fallback value if on web
   */
  guardNativeAPI(fn, fallback = null) {
    if (this.isNative()) {
      try {
        return fn();
      } catch (error) {
        console.error("Native API error:", error);
        return fallback;
      }
    } else {
      console.warn("Native API called on web, using fallback");
      return fallback;
    }
  }

  /**
   * Async version of guardNativeAPI
   */
  async guardNativeAPIAsync(fn, fallback = null) {
    if (this.isNative()) {
      try {
        return await fn();
      } catch (error) {
        console.error("Native API error:", error);
        return fallback;
      }
    } else {
      console.warn("Native API called on web, using fallback");
      return fallback;
    }
  }

  /**
   * Guard Android-specific API
   */
  guardAndroidAPI(fn, fallback = null) {
    if (this.isAndroid()) {
      try {
        return fn();
      } catch (error) {
        console.error("Android API error:", error);
        return fallback;
      }
    } else {
      console.warn("Android API called on non-Android platform");
      return fallback;
    }
  }

  /**
   * Guard iOS-specific API
   */
  guardIOSAPI(fn, fallback = null) {
    if (this.isIOS()) {
      try {
        return fn();
      } catch (error) {
        console.error("iOS API error:", error);
        return fallback;
      }
    } else {
      console.warn("iOS API called on non-iOS platform");
      return fallback;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE DETECTION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check if Bluetooth is available
   */
  hasBluetoothSupport() {
    if (!this.isNative()) return false;
    // Additional checks can be added here
    return true;
  }

  /**
   * Check if GPS/Location is available
   */
  hasLocationSupport() {
    if (this.isWeb) {
      return "geolocation" in navigator;
    }
    return true; // Native platforms have location
  }

  /**
   * Check if camera is available
   */
  hasCameraSupport() {
    if (!this.isNative()) return false;
    return true;
  }

  /**
   * Check if notifications are supported
   */
  hasNotificationSupport() {
    return this.isNative() || "Notification" in window;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SAFE API WRAPPERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Safe localStorage access
   */
  safeLocalStorage() {
    try {
      return {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
        clear: () => localStorage.clear(),
      };
    } catch (e) {
      console.warn("localStorage not available");
      // In-memory fallback
      const storage = {};
      return {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => {
          storage[key] = value;
        },
        removeItem: (key) => {
          delete storage[key];
        },
        clear: () => {
          Object.keys(storage).forEach((k) => delete storage[k]);
        },
      };
    }
  }

  /**
   * Safe console methods (some platforms restrict console)
   */
  safeConsole() {
    return {
      log: (...args) => {
        if (typeof console !== "undefined" && console.log) {
          console.log(...args);
        }
      },
      warn: (...args) => {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(...args);
        }
      },
      error: (...args) => {
        if (typeof console !== "undefined" && console.error) {
          console.error(...args);
        }
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DIAGNOSTICS
  // ──────────────────────────────────────────────────────────────────────────

  getDiagnostics() {
    return {
      platform: this.platform,
      isWeb: this.isWeb,
      isAndroid: this.isAndroidPlatform,
      isIOS: this.isIOSPlatform,
      features: {
        bluetooth: this.hasBluetoothSupport(),
        location: this.hasLocationSupport(),
        camera: this.hasCameraSupport(),
        notifications: this.hasNotificationSupport(),
      },
    };
  }
}

// Singleton instance
export const platformGuard = new PlatformGuard();

// Debug helper (development only)
if (process.env.NODE_ENV === "development") {
  window.__platformGuard = platformGuard;
  console.log("Platform Diagnostics:", platformGuard.getDiagnostics());
}
