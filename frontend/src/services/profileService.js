const STORAGE_KEY = "drishti_user_profile";

export const profileService = {
  getProfile() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Default Empty Profile (Clean for form inputs)
    return {
      name: "",
      phone: "",
      bloodGroup: "",
      medicalConditions: "",
      emergencyContact: ""
    };
  },

  saveProfile(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log("✅ Profile Synced to Local Secure Storage");
      return true;
    } catch (error) {
      console.error("❌ Failed to save profile:", error);
      return false;
    }
  },

  // Returns the "Digital Dog Tag" string for SOS bundles/Mesh payloads
  getSOSPayload() {
    const p = this.getProfile();
    // Fallback to "Unknown" if fields are empty to ensure readable emergency data
    const name = p.name || "Unknown Citizen";
    const phone = p.phone || "N/A";
    const blood = p.bloodGroup || "Unknown";
    const med = p.medicalConditions || "None";
    const emg = p.emergencyContact || "N/A";

    return `ID: ${name} | TEL: ${phone} | BLOOD: ${blood} | MED: ${med} | EMG: ${emg}`;
  }
};