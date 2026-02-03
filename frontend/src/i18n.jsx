import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_KEY = "drishti_lang";

export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "as", label: "অসমীয়া (Assamese)", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇮🇳" }
];

const translations = {
  en: {
    app: {
      name: "Team Matrix",
      subtitle: "AI-Response Unit",
      online: "ONLINE",
      initButton: "INITIALIZE SYSTEM",
    },
    nav: {
      status: "STATUS",
      route: "ROUTE",
      mesh: "MESH",
      cmd: "CMD",
      sos: "SOS",
      settings: "SETTINGS"
    },
    dash: {
      risk: "RISK LEVEL",
      safe: "SAFE",
      alert: "ALERT",
      rain: "RAIN",
      humidity: "HUMIDITY",
      wind: "WIND",
      temp: "TEMP",
      quickActions: "TACTICAL ACTIONS",
      aiMap: "AI MAP",
      navFlood: "Navigate Flood Zones",
      sosBeacon: "EMERGENCY BEACON",
      offlineComms: "OFFLINE COMMS",
      adminPanel: "ADMIN PANEL",
      warning: "LANDSLIDE WARNING IN SECTOR 7 • EVACUATE LOW LYING AREAS",
      p2p: "P2P Chat",
      distress: "Broadcast Distress"
    },
    map: {
      startInput: "Origin Sector...",
      endInput: "Destination Sector...",
      analyzeBtn: "INITIATE TACTICAL SCAN",
      sosBtn: "SOS: EMERGENCY ROUTING",
    },
    sos: {
      title: "EMERGENCY SOS",
      press: "PRESS FOR HELP",
      stop: "STOP",
      broadcasting: "BROADCASTING",
      standby: "SYSTEM STANDBY",
    },
    network: {
      peers: "Active Nodes",
      scanning: "SCANNING...",
      scan: "START SCAN",
      inputPlaceholder: "Broadcast encrypted message...",
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
      medicalLabel: "Medical Notes",
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
      about: "Built for DrishtiNE Hackathon", // ✅ UPDATED
      team: "Team Matrix • 2026"
    }
  },
  hi: {
    app: {
      name: "टीम मैट्रिक्स",
      subtitle: "AI-प्रतिक्रिया इकाई",
      online: "ऑनलाइन",
      initButton: "सिस्टम शुरू करें",
    },
    nav: {
      status: "स्थिति",
      route: "रास्ता",
      mesh: "नेटवर्क",
      cmd: "कमांड",
      sos: "SOS",
      settings: "सेटिंग्स"
    },
    dash: {
      risk: "जोखिम स्तर",
      safe: "सुरक्षित",
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
      adminPanel: "एडमिन पैनल",
      warning: "सेक्टर 7 में भूस्खलन की चेतावनी • निचले इलाकों को खाली करें",
      p2p: "P2P चैट",
      distress: "मदद मांगें"
    },
    map: {
      startInput: "प्रारंभिक स्थान...",
      endInput: "गंतव्य स्थान...",
      analyzeBtn: "स्कैन शुरू करें",
      sosBtn: "SOS: आपातकालीन रूटिंग",
    },
    sos: {
      title: "आपातकालीन SOS",
      press: "मदद के लिए दबाएं",
      stop: "रोकें",
      broadcasting: "प्रसारण जारी...",
      standby: "सिस्टम स्टैंडबाय",
    },
    network: {
      peers: "सक्रिय नोड्स",
      scanning: "स्कैनिंग...",
      scan: "स्कैन शुरू",
      inputPlaceholder: "संदेश भेजें...",
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
      medicalLabel: "चिकित्सा नोट्स",
      save: "प्रोफाइल सहेजें",
      saved: "सहेजा गया!",
      device: "डिवाइस स्वास्थ्य",
      power: "बैटरी",
      storage: "स्टोरेज",
      maintenance: "रखरखाव",
      clearCache: "डाटा साफ़ करें",
      resetBoot: "बूट रिप्ले",
      darkMode: "डार्क मोड",
      auto: "ऑटो",
      about: "DrishtiNE हैकथॉन के लिए निर्मित", // ✅ UPDATED
      team: "टीम मैट्रिक्स • 2026"
    }
  },
  as: {
    app: {
      name: "টিম মেট্ৰিক্স",
      subtitle: "AI-প্রতিক্ৰিয়া গোট",
      online: "অনলাইন",
      initButton: "প্ৰণালী আৰম্ভ কৰক",
    },
    nav: {
      status: "অৱস্থা",
      route: "পথ",
      mesh: "মেশ্ব",
      cmd: "কমাণ্ড",
      sos: "SOS",
      settings: "ছেটিংছ"
    },
    dash: {
      risk: "বিপদৰ স্তৰ",
      safe: "সুৰক্ষিত",
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
      warning: "খণ্ড ৭ত ভূমিস্খলনৰ সতৰ্কবাণী • নিচু অঞ্চল খালী কৰক",
      p2p: "P2P চ্যাট",
      distress: "সাহায্য"
    },
    map: {
      startInput: "আৰম্ভণি...",
      endInput: "গন্তব্য...",
      analyzeBtn: "স্কেন আৰম্ভ কৰক",
      sosBtn: "SOS: জৰুৰীকালীন",
    },
    sos: {
      title: "জৰুৰীকালীন SOS",
      press: "সহায়ৰ বাবে টিপক",
      stop: "বন্ধ কৰক",
      broadcasting: "প্ৰচাৰিত...",
      standby: "ষ্টেণ্ডবাই",
    },
    network: {
      peers: "সক্ৰিয় নড",
      scanning: "স্কেনিং...",
      scan: "স্কেন",
      inputPlaceholder: "বাৰ্তা লিখক...",
    },
    settings: {
      header: "ছেটিংছ",
      subHeader: "প্ৰণালী কনফিগাৰেশ্যন",
      lang: "ভাষা",
      profileTitle: "ব্যৱহাৰকাৰী",
      nameLabel: "সম্পূৰ্ণ নাম",
      namePlaceholder: "নাম লিখক",
      bloodLabel: "তেজৰ গোট",
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
      about: "DrishtiNE হেকাথনৰ বাবে নিৰ্মিত", // ✅ UPDATED
      team: "টিম মেট্ৰিক্স • ২০২৬"
    }
  },
  bn: {
    app: {
      name: "টিম ম্যাট্রিক্স",
      subtitle: "AI-প্রতিক্রিয়া ইউনিট",
      online: "অনলাইন",
      initButton: "সিস্টেম চালু করুন",
    },
    nav: {
      status: "অবস্থা",
      route: "রুট",
      mesh: "মেশ",
      cmd: "কমান্ড",
      sos: "SOS",
      settings: "সেটিংস"
    },
    dash: {
      risk: "ঝুঁকির স্তর",
      safe: "নিরাপদ",
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
      warning: "সেক্টর ৭-এ ভূমিধসের সতর্কতা • নিচু এলাকা খালি করুন",
      p2p: "P2P চ্যাট",
      distress: "সাহায্য"
    },
    map: {
      startInput: "শুরুর স্থান...",
      endInput: "গন্তব্য...",
      analyzeBtn: "স্ক্যান শুরু",
      sosBtn: "SOS: জরুরি রুট",
    },
    sos: {
      title: "জরুরি SOS",
      press: "সাহায্যের জন্য চাপুন",
      stop: "বন্ধ করুন",
      broadcasting: "প্রচার হচ্ছে...",
      standby: "স্ট্যান্ডবাই",
    },
    network: {
      peers: "সক্রিয় নোড",
      scanning: "স্কেনিং...",
      scan: "স্ক্যান",
      inputPlaceholder: "বার্তা লিখুন...",
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
      about: "DrishtiNE হ্যাকাথনের জন্য তৈরি", // ✅ UPDATED
      team: "টিম ম্যাট্রিক্স • ২০২৬"
    }
  }
};

const resolvePath = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc && acc[part] !== undefined) {
      return acc[part];
    }
    return undefined;
  }, obj);
};

const I18nContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  hasChosen: false,
});

const getInitialLang = () => {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored) return stored;
  const browserLang = navigator.language?.slice(0, 2);
  const supported = languages.some((l) => l.code === browserLang) ? browserLang : "en";
  return supported;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(getInitialLang());
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      setLangState(stored);
      setHasChosen(true);
    }
  }, []);

  const setLang = (value) => {
    setLangState(value);
    setHasChosen(true);
    localStorage.setItem(LANGUAGE_KEY, value);
  };

  const t = useMemo(() => {
    return (key) => {
      const val = resolvePath(translations[lang], key);
      if (val !== undefined) return val;
      const fallbackVal = resolvePath(translations["en"], key);
      if (fallbackVal !== undefined) return fallbackVal;
      return key;
    };
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, hasChosen }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);