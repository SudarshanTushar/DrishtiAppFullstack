import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_KEY = "drishti_lang";

// --- 1. LANGUAGE DEFINITIONS ---
export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "as", label: "অসমীয়া (Assamese)", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇮🇳" }
];

// --- 2. TRANSLATIONS (Complete Coverage) ---
const translations = {
  en: {
    app: {
      name: "Team Matrix",
      subtitle: "AI-Response Unit",
      online: "ONLINE",
      initButton: "INITIALIZE SYSTEM",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "INITIALIZING MATRIX KERNEL...",
        bhuvan: "CONNECTING TO ISRO BHUVAN...",
        imd: "FETCHING IMD WEATHER GRID...",
        terrain: "CALIBRATING TERRAIN SENSORS...",
        secure: "SYSTEM SECURE.",
      },
    },
    nav: {
      status: "STATUS",
      route: "ROUTE",
      mesh: "MESH",
      cmd: "CMD",
      sos: "SOS",
      settings: "SETTINGS"
    },
    dashboard: {
      welcome: "Welcome Back",
      threatTitle: "Threat Level",
      alert: "ALERT",
      rain: "PRECIPITATION",
      humidity: "Humidity",
      wind: "Wind",
      temp: "Temp",
      quickActions: "Tactical Actions",
      aiMap: "AI MAP",
      navFlood: "Navigate Flood Zones",
      sosBeacon: "Emergency Beacon",
      offlineComms: "Offline Comms",
      adminPanel: "ADMIN",
      cmdNode: "Command Node",
      sitrep: "SITREP",
      download: "Download Report",
      news: "Breaking",
      warning: "LANDSLIDE WARNING IN SECTOR 7 • EVACUATE LOW LYING AREAS • KEEP RADIO ON CHANNEL 4"
    },
    map: {
      startInput: "Origin Sector...",
      endInput: "Destination Sector...",
      analyzeBtn: "INITIATE TACTICAL SCAN",
      sosBtn: "SOS: EMERGENCY ROUTING",
      risk: "RISK",
      safe: "SAFE",
      highRisk: "HIGH RISK",
      secure: "SECURE",
      encryption: "Encryption Status",
      inference: "Inference Node",
      reset: "Reset Session",
      reason: "Reasoning",
      traffic: "Traffic",
      satellite: "Satellite",
      terrain: "Terrain 3D"
    },
    sos: {
      title: "EMERGENCY SOS",
      subtitle: "Broadcast Distress Signal via Mesh",
      press: "PRESS FOR HELP",
      stop: "STOP",
      active: "BEACON ACTIVE",
      standby: "SYSTEM STANDBY",
      broadcasting: "BROADCASTING",
      sent: "SENT",
      log: "Signal Log",
      loc: "LOC",
      hopping: "Hopping to Node...",
      ack: "ACK RECEIVED",
      relayed: "Relayed via Peer-to-Peer",
      meshStatus: "Mesh Network",
      nodesLinked: "NODES LINKED",
      secureChannel: "Secure Channel Ready"
    },
    network: {
      title: "MATRIX MESH",
      subtitle: "Decentralized Offline Communication",
      active: "Mesh Active",
      silent: "Radio Silent",
      scan: "START MESH SCAN",
      scanning: "SCANNING FREQUENCIES...",
      peers: "Active Nodes",
      packets: "Total Packets",
      buffer: "Data Buffer",
      inputPlaceholder: "Broadcast encrypted message...",
      send: "SEND"
    },
    admin: {
      title: "TEAM MATRIX CMD",
      access: "Restricted Access // Level 5",
      auth: "AUTHENTICATE",
      verifying: "VERIFYING BIOMETRICS...",
      unauthorized: "UNAUTHORIZED ACCESS IS A PUNISHABLE OFFENSE.",
      systemLive: "System Live",
      activeAlerts: "Active Alerts",
      units: "Units Deployed",
      incoming: "Incoming Distress Signals",
      tactical: "Tactical Response",
      deployUAV: "Deploy UAV",
      broadcast: "Broadcast Alert",
      sectorMap: "Sector Map",
      dailyReport: "Daily Report"
    },
    settings: {
      header: "Settings",
      subHeader: "System Configuration",
      lang: "Localization",
      profileTitle: "User Profile",
      nameLabel: "Full Name",
      namePlaceholder: "Enter Full Name",
      bloodLabel: "Blood Group",
      phoneLabel: "Emergency Contact",
      medicalLabel: "Medical Notes (Allergies etc.)",
      save: "Save Profile",
      saved: "Saved!",
      device: "Device Health",
      power: "Power",
      storage: "Storage",
      maintenance: "Maintenance",
      clearCache: "Clear Local Data",
      resetBoot: "Replay Boot Sequence",
      darkMode: "Dark Mode",
      auto: "AUTO",
      about: "Built for Smart India Hackathon",
      team: "Team Matrix • 2024"
    }
  },
  hi: {
    app: {
      name: "टीम मैट्रिक्स",
      subtitle: "AI-प्रतिक्रिया इकाई",
      online: "ऑनलाइन",
      initButton: "सिस्टम शुरू करें",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "मैट्रिक्स कर्नेल शुरू हो रहा है...",
        bhuvan: "इसरो भुवन से जुड़ रहा है...",
        imd: "मौसम ग्रिड लोड हो रहा है...",
        terrain: "टेरेन सेंसर कैलिब्रेट...",
        secure: "सिस्टम सुरक्षित।",
      },
    },
    nav: {
      status: "स्थिति",
      route: "रास्ता",
      mesh: "नेटवर्क",
      cmd: "कमांड",
      sos: "SOS",
      settings: "सेटिंग्स"
    },
    dashboard: {
      welcome: "वापसी पर स्वागत है",
      threatTitle: "खतरे का स्तर",
      alert: "चेतावनी",
      rain: "वर्षा",
      humidity: "नमी",
      wind: "हवा",
      temp: "तापमान",
      quickActions: "त्वरित कार्रवाई",
      aiMap: "AI नक्शा",
      navFlood: "बाढ़ क्षेत्र नेविगेशन",
      sosBeacon: "आपातकालीन बीकन",
      offlineComms: "ऑफलाइन संचार",
      adminPanel: "एडमिन",
      cmdNode: "कमांड नोड",
      sitrep: "रिपोर्ट",
      download: "PDF डाउनलोड",
      news: "ताज़ा खबर",
      warning: "सेक्टर 7 में भूस्खलन की चेतावनी • निचले इलाकों को खाली करें • रेडियो चैनल 4 पर रखें"
    },
    map: {
      startInput: "प्रारंभिक स्थान...",
      endInput: "गंतव्य स्थान...",
      analyzeBtn: "स्कैन शुरू करें",
      sosBtn: "SOS: आपातकालीन रूटिंग",
      risk: "जोखिम",
      safe: "सुरक्षित",
      highRisk: "उच्च जोखिम",
      secure: "सुरक्षित",
      encryption: "एन्क्रिप्शन स्थिति",
      inference: "AI नोड",
      reset: "रीसेट करें",
      reason: "कारण",
      traffic: "ट्रैफिक",
      satellite: "सैटेलाइट",
      terrain: "टेरेन 3D"
    },
    sos: {
      title: "आपातकालीन SOS",
      subtitle: "मेश नेटवर्क के माध्यम से प्रसारण",
      press: "मदद के लिए दबाएं",
      stop: "रोकें",
      active: "बीकन सक्रिय",
      standby: "सिस्टम स्टैंडबाय",
      broadcasting: "प्रसारण जारी...",
      sent: "भेजा गया",
      log: "सिग्नल लॉग",
      loc: "स्थान",
      hopping: "नोड हॉपिंग...",
      ack: "पुष्टि प्राप्त हुई",
      relayed: "P2P रिले किया गया",
      meshStatus: "मेश नेटवर्क",
      nodesLinked: "नोड्स जुड़े",
      secureChannel: "सुरक्षित चैनल तैयार"
    },
    network: {
      title: "मैट्रिक्स मेश",
      subtitle: "विकेंद्रीकृत ऑफलाइन संचार",
      active: "मेश सक्रिय",
      silent: "रेडियो बंद",
      scan: "स्कैन शुरू करें",
      scanning: "फ्रीक्वेंसी स्कैनिंग...",
      peers: "सक्रिय नोड्स",
      packets: "कुल पैकेट",
      buffer: "डाटा बफर",
      inputPlaceholder: "एन्क्रिप्टेड संदेश प्रसारित करें...",
      send: "भेजें"
    },
    admin: {
      title: "टीम मैट्रिक्स CMD",
      access: "प्रतिबंधित पहुंच // स्तर 5",
      auth: "प्रमाणित करें",
      verifying: "बायोमेट्रिक्स की जाँच...",
      unauthorized: "अनधिकृत प्रवेश एक दंडनीय अपराध है।",
      systemLive: "सिस्टम लाइव",
      activeAlerts: "सक्रिय अलर्ट",
      units: "तैनात इकाइयाँ",
      incoming: "आने वाले संकेत",
      tactical: "रणनीतिक प्रतिक्रिया",
      deployUAV: "UAV तैनात करें",
      broadcast: "अलर्ट प्रसारित करें",
      sectorMap: "सेक्टर मानचित्र",
      dailyReport: "दैनिक रिपोर्ट"
    },
    settings: {
      header: "सेटिंग्स",
      subHeader: "सिस्टम कॉन्फ़िगरेशन",
      lang: "भाषा",
      profileTitle: "उपयोगकर्ता प्रोफाइल",
      nameLabel: "पूरा नाम",
      namePlaceholder: "नाम दर्ज करें",
      bloodLabel: "रक्त समूह",
      phoneLabel: "आपातकालीन संपर्क",
      medicalLabel: "चिकित्सा नोट्स (एलर्जी आदि)",
      save: "प्रोफाइल सहेजें",
      saved: "सहेजा गया!",
      device: "डिवाइस स्वास्थ्य",
      power: "बैटरी",
      storage: "स्टोरेज",
      maintenance: "रखरखाव",
      clearCache: "लोकल डाटा साफ़ करें",
      resetBoot: "बूट अनुक्रम पुनः चलाएं",
      darkMode: "डार्क मोड",
      auto: "ऑटो",
      about: "स्मार्ट इंडिया हैकथॉन के लिए निर्मित",
      team: "टीम मैट्रिक्स • 2024"
    }
  },
  as: {
    app: {
      name: "টিম মেট্ৰিক্স",
      subtitle: "AI-প্রতিক্ৰিয়া গোট",
      online: "অনলাইন",
      initButton: "প্ৰণালী আৰম্ভ কৰক",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "মেট্ৰিক্স আৰম্ভ হৈছে...",
        bhuvan: "সংযোগ স্থাপন...",
        imd: "বতৰৰ তথ্য...",
        terrain: "টেৰেইন পৰীক্ষা...",
        secure: "সুৰক্ষিত।"
      },
    },
    nav: {
      status: "অৱস্থা",
      route: "পথ",
      mesh: "মেশ্ব",
      cmd: "কমাণ্ড",
      sos: "SOS",
      settings: "ছেটিংছ"
    },
    dashboard: {
      welcome: "স্বাগতম",
      threatTitle: "বিপদৰ স্তৰ",
      alert: "সতৰ্কতা",
      rain: "বৰষুণ",
      humidity: "আৰ্দ্ৰতা",
      wind: "বতাহ",
      temp: "তাপমান",
      quickActions: "তাত্ক্ষণিক ক্ৰিয়া",
      aiMap: "AI মেপ",
      navFlood: "বানপানী নেভিগেশ্যন",
      sosBeacon: "জৰুৰীকালীন বীকন",
      offlineComms: "অফলাইন যোগাযোগ",
      adminPanel: "প্ৰশাসক",
      cmdNode: "কমাণ্ড নড",
      sitrep: "প্ৰতিবেদন",
      download: "PDF ডাউনলোড",
      news: "ব্রেকিং নিউজ",
      warning: "খণ্ড ৭ত ভূমিস্খলনৰ সতৰ্কবাণী • নিচু অঞ্চল খালী কৰক"
    },
    map: {
      startInput: "আৰম্ভণি...",
      endInput: "গন্তব্য...",
      analyzeBtn: "স্কেন আৰম্ভ কৰক",
      sosBtn: "SOS: জৰুৰীকালীন",
      risk: "বিপদ",
      safe: "নিৰাপদ",
      highRisk: "উচ্চ বিপদ",
      secure: "সুৰক্ষিত",
      encryption: "এনক্ৰিপ্ট অৱস্থা",
      inference: "AI নড",
      reset: "ৰিছেট",
      reason: "কাৰণ",
      traffic: "ট্ৰফিক",
      satellite: "উপগ্ৰহ",
      terrain: "টেৰেইন 3D"
    },
    sos: {
      title: "জৰুৰীকালীন SOS",
      subtitle: "মেশ্ব নেটৱৰ্কৰ জৰিয়তে বাৰ্তা",
      press: "সহায়ৰ বাবে টিপক",
      stop: "বন্ধ কৰক",
      active: "বীকন সক্ৰিয়",
      standby: "ষ্টেণ্ডবাই",
      broadcasting: "প্ৰচাৰিত...",
      sent: "পঠোৱা হ'ল",
      log: "লগ",
      loc: "স্থান",
      hopping: "নড সংযোগ...",
      ack: "প্ৰাপ্তি স্বীকাৰ",
      relayed: "P2P ৰিলে",
      meshStatus: "মেশ্ব নেটৱৰ্ক",
      nodesLinked: "সংযুক্ত নড",
      secureChannel: "সুৰক্ষিত চেনেল"
    },
    network: {
      title: "মেট্ৰিক্স মেশ্ব",
      subtitle: "অফলাইন যোগাযোগ",
      active: "মেশ্ব সক্ৰিয়",
      silent: "ৰেডিঅ' বন্ধ",
      scan: "স্কেন আৰম্ভ কৰক",
      scanning: "স্কেনিং...",
      peers: "সক্ৰিয় নড",
      packets: "মুঠ পেকেট",
      buffer: "বাফাৰ",
      inputPlaceholder: "বাৰ্তা লিখক...",
      send: "পঠাওক"
    },
    admin: {
      title: "টিম মেট্ৰিক্স CMD",
      access: "প্ৰতিবন্ধিত প্ৰৱেশ",
      auth: "প্ৰমাণিত কৰক",
      verifying: "যাচাই কৰা হৈছে...",
      unauthorized: "অননুমোদিত প্ৰৱেশ নিষিদ্ধ।",
      systemLive: "প্ৰণালী সক্ৰিয়",
      activeAlerts: "সক্ৰিয় সতৰ্কতা",
      units: "ইউনিট",
      incoming: "আহিবলগীয়া সংকেত",
      tactical: "কৌশলগত সঁহাৰি",
      deployUAV: "UAV পঠাওক",
      broadcast: "সতৰ্কবাণী প্ৰচাৰ",
      sectorMap: "খণ্ড মেপ",
      dailyReport: "দৈনিক প্ৰতিবেদন"
    },
    settings: {
      header: "ছেটিংছ",
      subHeader: "প্ৰণালী কনফিগাৰেশ্যন",
      lang: "ভাষা",
      profileTitle: "ব্যৱহাৰকাৰী",
      nameLabel: "সম্পূৰ্ণ নাম",
      namePlaceholder: "নাম লিখক",
      bloodLabel: " তেজৰ গোট",
      phoneLabel: "জৰুৰীকালীন নম্বৰ",
      medicalLabel: "চিকিৎসা টোকা",
      save: "ছেভ কৰক",
      saved: "ছেভ হ'ল!",
      device: "ডিভাইচ",
      power: "বেটাৰী",
      storage: "ভঁৰাল",
      maintenance: "রক্ষণাবেক্ষণ",
      clearCache: "কেশ্ব চাফা কৰক",
      resetBoot: "পুনৰাম্ভ",
      darkMode: "ডাৰ্ক মোড",
      auto: "স্বয়ংক্ৰিয়",
      about: "স্মাৰ্ট ইণ্ডিয়া হেকাথন",
      team: "টিম মেট্ৰিক্স • ২০২৪"
    }
  },
  bn: {
    app: {
      name: "টিম ম্যাট্রিক্স",
      subtitle: "AI-প্রতিক্রিয়া ইউনিট",
      online: "অনলাইন",
      initButton: "সিস্টেম চালু করুন",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "ম্যাট্রিক্স কার্নেল শুরু...",
        bhuvan: "সংযোগ করা হচ্ছে...",
        imd: "আবহাওয়া তথ্য...",
        terrain: "ক্যালিব্রেশন...",
        secure: "সুরক্ষিত।"
      },
    },
    nav: {
      status: "অবস্থা",
      route: "রুট",
      mesh: "মেশ",
      cmd: "কমান্ড",
      sos: "SOS",
      settings: "সেটিংস"
    },
    dashboard: {
      welcome: "স্বাগতম",
      threatTitle: "ঝুঁকির স্তর",
      alert: "সতর্কতা",
      rain: "বৃষ্টিপাত",
      humidity: "আর্দ্রতা",
      wind: "বাতাস",
      temp: "তাপমাত্রা",
      quickActions: "তাত্ক্ষণিক পদক্ষেপ",
      aiMap: "AI ম্যাপ",
      navFlood: "বন্যা নেভিগেশন",
      sosBeacon: "জরুরি বীকন",
      offlineComms: "অফলাইন যোগাযোগ",
      adminPanel: "অ্যাডমিন",
      cmdNode: "কমান্ড নোড",
      sitrep: "রিপোর্ট",
      download: "PDF ডাউনলোড",
      news: "ব্রেকিং নিউজ",
      warning: "সেক্টর ৭-এ ভূমিধসের সতর্কতা • নিচু এলাকা খালি করুন"
    },
    map: {
      startInput: "শুরুর স্থান...",
      endInput: "গন্তব্য...",
      analyzeBtn: "স্ক্যান শুরু",
      sosBtn: "SOS: জরুরি রুট",
      risk: "ঝুঁকি",
      safe: "নিরাপদ",
      highRisk: "উচ্চ ঝুঁকি",
      secure: "সুরক্ষিত",
      encryption: "এনক্রিপশন",
      inference: "AI নোড",
      reset: "রিসেট",
      reason: "কারণ",
      traffic: "ট্রাফিক",
      satellite: "স্যাটেলাইট",
      terrain: "টেরেইন 3D"
    },
    sos: {
      title: "জরুরি SOS",
      subtitle: "মেশ নেটওয়ার্ক বার্তা",
      press: "সাহায্যের জন্য চাপুন",
      stop: "বন্ধ করুন",
      active: "বীকন সক্রিয়",
      standby: "স্ট্যান্ডবাই",
      broadcasting: "প্রচার হচ্ছে...",
      sent: "পাঠানো হয়েছে",
      log: "লগ",
      loc: "স্থান",
      hopping: "নোড সংযোগ...",
      ack: "প্রাপ্তি স্বীকার",
      relayed: "P2P রিলে",
      meshStatus: "মেশ নেটওয়ার্ক",
      nodesLinked: "সংযুক্ত নোড",
      secureChannel: "সুরক্ষিত চ্যানেল"
    },
    network: {
      title: "ম্যাট্রিক্স মেশ",
      subtitle: "অফলাইন যোগাযোগ",
      active: "মেশ সক্রিয়",
      silent: "রেডিও বন্ধ",
      scan: "স্ক্যান শুরু",
      scanning: "স্ক্যানিং...",
      peers: "সক্রিয় নোড",
      packets: "মোট প্যাকেট",
      buffer: "বাফার",
      inputPlaceholder: "বার্তা লিখুন...",
      send: "পাঠান"
    },
    admin: {
      title: "টিম ম্যাট্রিক্স CMD",
      access: "সীমাবদ্ধ প্রবেশ",
      auth: "যাচাই করুন",
      verifying: "যাচাই করা হচ্ছে...",
      unauthorized: "অননুমোদিত প্রবেশ নিষিদ্ধ।",
      systemLive: "সিস্টেম লাইভ",
      activeAlerts: "সক্রিয় সতর্কতা",
      units: "ইউনিট",
      incoming: "আগত সংকেত",
      tactical: "কৌশলগত প্রতিক্রিয়া",
      deployUAV: "UAV পাঠান",
      broadcast: "সতর্কতা প্রচার",
      sectorMap: "সেক্টর ম্যাপ",
      dailyReport: "দৈনিক রিপোর্ট"
    },
    settings: {
      header: "সেটিংস",
      subHeader: "সিস্টেম কনফিগারেশন",
      lang: "ভাষা",
      profileTitle: "ব্যবহারকারী প্রোফাইল",
      nameLabel: "পুরো নাম",
      namePlaceholder: "নাম লিখুন",
      bloodLabel: "রক্তের গ্রুপ",
      phoneLabel: "জরুরি নম্বর",
      medicalLabel: "চিকিৎসা নোট",
      save: "সেভ করুন",
      saved: "সেভ হয়েছে!",
      device: "ডিভাইস",
      power: "ব্যাটারি",
      storage: "স্টোরেজ",
      maintenance: "রক্ষণাবেক্ষণ",
      clearCache: "ক্যাশ মুছুন",
      resetBoot: "রিবুট",
      darkMode: "ডার্ক মোড",
      auto: "স্বয়ংক্রিয়",
      about: "স্মার্ট ইন্ডিয়া হ্যাকাথন",
      team: "টিম ম্যাট্রিক্স • ২০২৪"
    }
  }
};

// --- 3. HELPER TO RESOLVE NESTED KEYS (e.g. 'settings.nameLabel') ---
const resolvePath = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, obj);
};

// --- 4. CONTEXT LOGIC ---
const I18nContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  hasChosen: false,
});

const getInitialLang = () => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(LANGUAGE_KEY) : null;
  if (stored) return stored;
  
  const browserLang = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
  const supported = languages.some((l) => l.code === browserLang) ? browserLang : "en";
  return supported;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(getInitialLang());
  const [hasChosen, setHasChosen] = useState(
    typeof localStorage !== "undefined" && !!localStorage.getItem(LANGUAGE_KEY)
  );

  useEffect(() => {
    const handler = (event) => {
      if (event.key === LANGUAGE_KEY && event.newValue) {
        setLangState(event.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setLang = (value) => {
    setLangState(value);
    setHasChosen(true);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LANGUAGE_KEY, value);
    }
  };

  // Translation hook
  const t = useMemo(() => {
    const current = translations[lang] || translations.en;
    const fallback = translations.en;
    
    return (key) => {
      // Try current language
      const value = resolvePath(current, key);
      if (value !== undefined) return value;
      
      // Try fallback (English)
      const fb = resolvePath(fallback, key);
      return fb !== undefined ? fb : key; // Return key if translation missing
    };
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, hasChosen }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);