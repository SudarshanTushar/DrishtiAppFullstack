// ════════════════════════════════════════════════════════════════════════════
// HARDWARE MANAGER - SAFE HARDWARE ACCESS WITH PERMISSIONS
// ════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Manage hardware access with proper permission handling
//
// FEATURES:
// - Permission requests (contextual)
// - Battery status monitoring
// - GPS access
// - Bluetooth access
// - All with Android/iOS guards
//
// ════════════════════════════════════════════════════════════════════════════

import { platformGuard } from "./PlatformGuard";

class HardwareManager {
  constructor() {
    this.permissions = {
      bluetooth: null,
      location: null,
      camera: null,
      notifications: null,
    };

    this.batteryLevel = 100;
    this.isCharging = false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BLUETOOTH PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Request Bluetooth permission (Android 12+)
   */
  async requestBluetoothPermission() {
    return platformGuard.guardNativeAPIAsync(async () => {
      if (!platformGuard.isAndroid()) {
        // iOS handles Bluetooth permissions differently
        return true;
      }

      try {
        // For Android 12+, need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        // This would use Capacitor Permissions plugin
        console.log("Requesting Bluetooth permission...");

        // Placeholder: Replace with actual Capacitor plugin call
        // const result = await Permissions.request({ permissions: ['bluetooth'] });
        // return result.bluetooth === 'granted';

        // For now, assume granted (will need actual implementation)
        this.permissions.bluetooth = "granted";
        return true;
      } catch (error) {
        console.error("Bluetooth permission error:", error);
        this.permissions.bluetooth = "denied";
        return false;
      }
    }, false);
  }

  /**
   * Check if Bluetooth permission is granted
   */
  async hasBluetoothPermission() {
    if (!platformGuard.isNative()) return false;

    if (this.permissions.bluetooth === "granted") return true;
    if (this.permissions.bluetooth === "denied") return false;

    // Check permission status
    return this.requestBluetoothPermission();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LOCATION PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Request location permission
   */
  async requestLocationPermission() {
    return platformGuard.guardNativeAPIAsync(async () => {
      try {
        console.log("Requesting location permission...");

        // Placeholder: Replace with Capacitor Geolocation plugin
        // const result = await Geolocation.requestPermissions();
        // return result.location === 'granted';

        // For web, use HTML5 geolocation
        if (platformGuard.isWeb) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                this.permissions.location = "granted";
                resolve(true);
              },
              () => {
                this.permissions.location = "denied";
                resolve(false);
              },
            );
          });
        }

        this.permissions.location = "granted";
        return true;
      } catch (error) {
        console.error("Location permission error:", error);
        this.permissions.location = "denied";
        return false;
      }
    }, false);
  }

  /**
   * Get current location
   */
  async getCurrentLocation() {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) return null;

    return platformGuard.guardNativeAPIAsync(async () => {
      if (platformGuard.isWeb) {
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
              console.error("Geolocation error:", error);
              resolve(null);
            },
            { timeout: 5000, enableHighAccuracy: true },
          );
        });
      }

      // Use Capacitor Geolocation plugin for native
      // const position = await Geolocation.getCurrentPosition();
      // return { lat: position.coords.latitude, lng: position.coords.longitude };

      return null; // Placeholder
    }, null);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BATTERY STATUS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get battery status
   */
  async getBatteryStatus() {
    return platformGuard.guardNativeAPIAsync(
      async () => {
        try {
          // Try web Battery API first
          if ("getBattery" in navigator) {
            const battery = await navigator.getBattery();
            this.batteryLevel = Math.round(battery.level * 100);
            this.isCharging = battery.charging;

            return {
              level: this.batteryLevel,
              charging: this.isCharging,
            };
          }

          // For native, use Capacitor plugin
          // const battery = await Device.getBatteryInfo();
          // return { level: battery.batteryLevel * 100, charging: battery.isCharging };

          return { level: 100, charging: false };
        } catch (error) {
          console.error("Battery status error:", error);
          return { level: 100, charging: false };
        }
      },
      { level: 100, charging: false },
    );
  }

  /**
   * Monitor battery level
   */
  startBatteryMonitoring(callback) {
    if (!platformGuard.isNative() && "getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        battery.addEventListener("levelchange", () => {
          this.batteryLevel = Math.round(battery.level * 100);
          callback(this.batteryLevel);
        });

        battery.addEventListener("chargingchange", () => {
          this.isCharging = battery.charging;
          callback(this.batteryLevel);
        });
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HAPTIC FEEDBACK
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Trigger haptic feedback (for important actions)
   */
  async hapticFeedback(type = "medium") {
    return platformGuard.guardNativeAPIAsync(async () => {
      try {
        // Use Capacitor Haptics plugin
        // await Haptics.impact({ style: type }); // 'light', 'medium', 'heavy'
        console.log(`Haptic feedback: ${type}`);
        return true;
      } catch (error) {
        console.error("Haptic feedback error:", error);
        return false;
      }
    }, false);
  }

  /**
   * Vibrate (for emergency alerts)
   */
  async vibrate(duration = 200) {
    return platformGuard.guardNativeAPIAsync(async () => {
      try {
        if ("vibrate" in navigator) {
          navigator.vibrate(duration);
          return true;
        }
        // Use Capacitor Haptics for native
        // await Haptics.vibrate({ duration });
        return true;
      } catch (error) {
        console.error("Vibrate error:", error);
        return false;
      }
    }, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    return platformGuard.guardNativeAPIAsync(async () => {
      try {
        if (platformGuard.isWeb && "Notification" in window) {
          const permission = await Notification.requestPermission();
          this.permissions.notifications = permission;
          return permission === "granted";
        }

        // Use Capacitor Local Notifications plugin for native
        // const result = await LocalNotifications.requestPermissions();
        // return result.display === 'granted';

        this.permissions.notifications = "granted";
        return true;
      } catch (error) {
        console.error("Notification permission error:", error);
        this.permissions.notifications = "denied";
        return false;
      }
    }, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PERMISSION OVERVIEW
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check all permissions at once
   */
  async checkAllPermissions() {
    return {
      bluetooth: await this.hasBluetoothPermission(),
      location: this.permissions.location === "granted",
      notifications: this.permissions.notifications === "granted",
    };
  }

  /**
   * Get permission status
   */
  getPermissionStatus() {
    return { ...this.permissions };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DIAGNOSTICS
  // ──────────────────────────────────────────────────────────────────────────

  getDiagnostics() {
    return {
      platform: platformGuard.getPlatform(),
      permissions: { ...this.permissions },
      battery: {
        level: this.batteryLevel,
        charging: this.isCharging,
      },
      features: {
        bluetooth: platformGuard.hasBluetoothSupport(),
        location: platformGuard.hasLocationSupport(),
        haptics: platformGuard.isNative(),
      },
    };
  }
}

// Singleton instance
export const hardwareManager = new HardwareManager();

// Debug helper (development only)
if (process.env.NODE_ENV === "development") {
  window.__hardwareManager = hardwareManager;
}
