import { safeFetch } from '../config';

const PACK_KEY = 'drishti_offline_intel';

export const offlineService = {
  // 1. Download & Save Data
  async downloadPack(regionId = "NE-Alpha") {
    try {
      const data = await safeFetch(`/offline-pack?region_id=${regionId}`);
      if (data) {
        data.downloadedAt = new Date().toISOString();
        localStorage.setItem(PACK_KEY, JSON.stringify(data));
        return { success: true, timestamp: data.downloadedAt };
      }
      return { success: false };
    } catch (error) {
      console.error("Pack Download Failed:", error);
      return { success: false };
    }
  },

  // 2. Retrieve Data (When Offline)
  getOfflineData() {
    try {
      const data = localStorage.getItem(PACK_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // 3. Check Status
  getStatus() {
    const data = this.getOfflineData();
    return data ? `Active` : null;
  }
};