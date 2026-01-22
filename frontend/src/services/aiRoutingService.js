// SIMULATION OF ON-DEVICE AI MODEL
// In production, this would use TensorFlow.js with loaded .json models.

export const aiRoutingService = {
  // Mock Data Sources (Indigenous)
  sources: {
    terrain: "ISRO Cartosat DEM (30m)",
    weather: "IMD Real-time Gridded Data",
    disaster: "NDMA Historical Landslide Atlas"
  },

  async analyzeRoute(start, end) {
    // Simulate Processing Delay (The "Thinking" Phase)
    await new Promise(r => setTimeout(r, 2500));

    // DEMO LOGIC: Return a "Safe" vs "Risky" route scenario
    // We simulate a route from Guwahati to Shillong (Hilly Terrain)

    const isRaining = Math.random() > 0.5; // Random weather simulation
    
    return {
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      weather: {
        condition: isRaining ? "Heavy Rainfall" : "Clear Sky",
        source: "IMD Auto-Station #882"
      },
      routes: [
        {
          id: "route-A",
          name: "NH-6 (Primary)",
          type: isRaining ? "DANGER" : "CAUTION", // Rain makes this road dangerous
          riskScore: isRaining ? 85 : 45, // 0-100 (Higher is riskier)
          confidence: 92,
          eta: "2h 45m",
          reason: isRaining 
            ? "CRITICAL: Active landslide detected at Mile 12 due to soil saturation > 90%."
            : "Moderate traffic. Slope stability normal.",
          hazards: isRaining ? ["Landslide Risk", "Slippery Surface"] : ["Curved Roads"]
        },
        {
          id: "route-B",
          name: "Old Hill Road (Alternative)",
          type: "SAFE",
          riskScore: 20,
          confidence: 88,
          eta: "3h 30m", // Slower but safer
          reason: "OPTIMAL: Bedrock stability high. No flood risk detected.",
          hazards: ["Narrow Lane"]
        }
      ]
    };
  }
};