import { Geolocation } from '@capacitor/geolocation';

export const locationService = {
  async getCurrentPosition() {
    try {
      // Check permissions first
      const status = await Geolocation.checkPermissions();
      
      if (status.location === 'denied') {
        const request = await Geolocation.requestPermissions();
        if (request.location === 'denied') throw new Error("Permission Denied");
      }

      // Get Position (High Accuracy)
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000, // Timeout after 10s to prevent hanging
        maximumAge: 3000
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.warn("Location Error:", error);
      // Fallback to Guwahati coordinates (Development default)
      return { lat: 26.1445, lng: 91.7362, error: true };
    }
  }
};