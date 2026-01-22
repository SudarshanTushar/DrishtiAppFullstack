const KEY = 'routeai_user_profile';

export const profileService = {
  getProfile() {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : {
      name: "Unknown Citizen",
      phone: "",
      bloodGroup: "Unknown",
      medicalConditions: "None"
    };
  },

  saveProfile(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  },

  // Returns the "Digital Dog Tag" for SOS bundles
  getSOSPayload() {
    const p = this.getProfile();
    return `ID: ${p.name} | TEL: ${p.phone} | BLOOD: ${p.bloodGroup} | MED: ${p.medicalConditions}`;
  }
};