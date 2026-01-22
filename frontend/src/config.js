export const API_BASE_URL = "https://drishtiappbackend-9d88613ee49f.herokuapp.com";

export const safeFetch = async (endpoint, options = {}) => {
  try {
    // SECURITY: Force Convert to String to prevent .trim() crashes
    const baseUrl = String(API_BASE_URL || "");
    const path = String(endpoint || "");
    
    // Clean concatenation
    const url = baseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    
    // Add timeout to prevent infinite hanging
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[Network] Connection failed to ${endpoint}`, error.name);
    return null; // Graceful degradation for UI
  }
};