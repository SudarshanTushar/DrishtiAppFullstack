// 🚀 DIGITALOCEAN LIVE SERVER (HTTP Only)
export const API_BASE_URL = "https://157.245.111.124.nip.io";

// ✅ SafeFetch Export (Zaroori hai kyunki Dashboard.jsx isko dhoond raha hai)
export const safeFetch = async (endpoint, options = {}) => {
  try {
    // URL Construction
    const baseUrl = String(API_BASE_URL || "");
    const path = String(endpoint || "");
    const url = baseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    
    // Timeout set kiya 10 seconds ka
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); 
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[Network] Connection failed to ${endpoint}`, error.name);
    return null; // Graceful degradation (App crash nahi karega)
  }
};