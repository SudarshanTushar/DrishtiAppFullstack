import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

export const bluetoothService = {
  isInitialized: false,

  async initialize() {
    try {
      // Platform Check: Don't run native code on web browser
      if (Capacitor.getPlatform() === 'web') {
        console.warn("Bluetooth not available on Web");
        return false;
      }

      if (this.isInitialized) return true;
      
      await BleClient.initialize();
      
      if (Capacitor.getPlatform() === 'android') {
        const isEnabled = await BleClient.isEnabled();
        // Don't auto-request, just check. Let UI handle requests.
        if (!isEnabled) return false; 
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('BLE Init Failed:', error);
      return false;
    }
  },

  async startScan(onDeviceFound) {
    if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success) return "ERROR";
    }
    
    try {
      await BleClient.requestLEScan(
        { allowDuplicates: false },
        (result) => { 
          if (result.device && result.device.name) {
            onDeviceFound(result.device);
          }
        }
      );
      return "SCANNING";
    } catch (error) {
      console.error('Scan Error:', error);
      return "ERROR";
    }
  },

  async stopScan() {
    try { 
        if (this.isInitialized) await BleClient.stopLEScan(); 
    } catch (e) { console.warn(e); }
  }
};