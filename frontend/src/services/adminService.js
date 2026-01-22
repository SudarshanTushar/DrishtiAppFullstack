import { safeFetch, API_BASE_URL } from "../config";

// Simple in-memory token storage (resets on app restart for security)
let ADMIN_TOKEN = null;

export const adminService = {
  // Check if logged in
  isAuthenticated: () => !!ADMIN_TOKEN,

  // Get token (for manual API calls)
  getToken: () => ADMIN_TOKEN,

  logout: () => {
    ADMIN_TOKEN = null;
  },

  // Secure Login
  async login(password) {
    const formData = new FormData();
    formData.append("password", password);

    try {
      // Direct fetch to handle auth specific response
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.status === "success") {
        ADMIN_TOKEN = data.token;
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Auth Failed", e);
      return false;
    }
  },

  // Get Live Stats
  async getStats() {
    if (!ADMIN_TOKEN) return null;
    return await safeFetch(`/admin/stats?api_key=${ADMIN_TOKEN}`);
  },

  // Get Pending Approvals
  async getPendingDecisions() {
    if (!ADMIN_TOKEN) return [];
    return await safeFetch(`/admin/governance/pending?api_key=${ADMIN_TOKEN}`);
  },

  // Submit Approval/Rejection
  async submitDecision(decisionId, action, notes) {
    if (!ADMIN_TOKEN) return null;
    return await safeFetch(
      `/admin/governance/decide?decision_id=${decisionId}&action=${action}&admin_notes=${notes}&api_key=${ADMIN_TOKEN}`,
      {
        method: "POST",
      },
    );
  },

  // Start/Stop Drills
  async toggleSimulation(active, scenario = "FLASH_FLOOD") {
    if (!ADMIN_TOKEN) return null;
    const endpoint = active
      ? `/admin/simulate/start?scenario=${scenario}&api_key=${ADMIN_TOKEN}`
      : `/admin/simulate/stop?api_key=${ADMIN_TOKEN}`;
    return await safeFetch(endpoint, { method: "POST" });
  },
};
