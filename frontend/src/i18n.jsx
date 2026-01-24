import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LANGUAGE_KEY = "routeai_lang";

export const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "اردو" },
  { code: "or", label: "ଓଡିଆ" },
  { code: "as", label: "অসমীয়া" },
];

const translations = {
  en: {
    app: {
      name: "RouteAI",
      subtitle: "Decision Support System",
      online: "ONLINE",
      welcomeTag: "Govt of India • North East Initiative",
      welcomeQuote:
        "Providing terrain-aware, risk-weighted navigation for emergency response in fragile zones.",
      initButton: "Initialize Dashboard",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "INITIALIZING ROUTE-AI KERNEL...",
        bhuvan: "CONNECTING TO ISRO BHUVAN...",
        imd: "FETCHING IMD WEATHER GRID...",
        terrain: "CALIBRATING TERRAIN SENSORS...",
        secure: "SYSTEM SECURE.",
      },
    },
    nav: {
      status: "Status",
      route: "Route",
      mesh: "Mesh",
      cmd: "Cmd",
    },
    map: {
      liveRouting: "Live Safety Routing",
      state: "State",
      analyzing: "Analyzing",
      realRouteReady: "Real route ready",
      fallbackRoute: "Using fallback line",
      offline: "Offline",
      streets: "Streets",
      satellite: "Satellite",
      from: "From",
      to: "To",
      currentLocation: "Current location",
      setStart: "Set start",
      analyzeBtn: "Analyze Route Safety",
      reset: "Reset",
      selectPrompt: "Select start & destination to analyze",
      start: "Start",
      destination: "Destination",
      gps: "GPS",
      enterDestination: "Enter destination",
      useGpsOrType: "Use GPS or type start",
      safetyScan: "Risk Assessment in Progress",
      analyzingTerrain: "Analyzing terrain, hazards, and risk factors...",
      navigationActive: "Navigation Active",
      exit: "Exit",
      distance: "Distance",
      safetyScore: "Safety Score",
      riskLevel: "Risk Level",
      aiExplanation: "AI Explanation",
      routeAnalyzed: "Route analyzed",
      navigationActiveShort: "Navigation active",
      startJourney: "Approve Route for Emergency Deployment",
      endJourney: "End Journey",
      close: "Close",
      sos: "SOS",
    },
    dashboard: {
      status: "Status",
      monitor: "Monitoring Sector",
      rain: "Rainfall",
      seismic: "Seismic",
      pack: "Offline Pack",
      admin: "District / NDRF Authority Node",
      alert: "Emergency Broadcast",
    },
    settings: {
      title: "Citizen Profile",
      subtitle: "Attached to Emergency Beacons",
      nameLabel: "Full Name",
      phoneLabel: "Emergency Contact",
      bloodLabel: "Blood Group",
      medicalLabel: "Medical Notes",
      namePlaceholder: "Enter Name",
      phonePlaceholder: "+91 XXXXX XXXXX",
      bloodPlaceholder: "O+",
      medicalPlaceholder: "Allergies, Diabetes, etc.",
      save: "Save Profile",
      saved: "Identity Saved",
      auditTitle: "System Audit",
      securityLevel: "Security Level",
      buildVersion: "Build Version",
      dataSources: "Data Sources",
    },
    sos: {
      title: "Emergency SOS",
      subtitle: "Works without internet, cellular, or infrastructure",
      running: "Propagation running",
      paused: "Propagation paused",
      yourMessage: "Your Emergency Message",
      created: "Created",
      ttl: "TTL Remaining",
      hops: "Hop Count",
      stored: "Message stored locally. Waiting for nearby devices...",
      carrying:
        "You are carrying this message. It will spread when others are near.",
      forwarded:
        "Message shared with other devices. It is spreading across the area.",
      delivered: "Message delivered to authorities or safe location.",
      journey: "Message Journey",
      createTitle: "Create Emergency Message",
      typeLabel: "Emergency Type",
      detailsLabel: "Additional Details (Optional)",
      detailsPlaceholder: "Describe your situation...",
      send: "Send Emergency SOS",
      creating: "Creating...",
      howWorks: "How this works:",
      worksBullets: [
        "Message stored locally immediately",
        "No internet or cell network required",
        "Message spreads as people move",
        "Each device becomes a relay",
        "Over time, covers entire city/town",
      ],
      statusTitle: "Propagation Status",
      peersNearby: "Peers Nearby",
      totalEncounters: "Total Encounters",
      messagesShared: "Messages Shared",
      messagesCarrying: "Messages Carrying",
      lastEncounter: "Last encounter",
      start: "Start Propagation",
      pause: "Pause (Save Battery)",
      scanning:
        "Risk assessment in progress; monitoring nearby relays every 15 seconds",
      pausedMessage:
        "Propagation paused. Your messages are still stored and will continue spreading once you resume.",
    },
    network: {
      title: "Mesh Link",
      protocol: "Protocol: DTN",
      peers: "Peers",
      messages: "Msgs",
      initializing: "Initializing radios",
      active: "Active scan running",
      standby: "Standby",
      permissionsNeeded: "Permissions required",
      permissionsHint:
        "Fail-safe mesh layer: engages only if approved routes fail or cellular/internet collapses. Enable Bluetooth Scan/Connect/Advertise, Nearby Wi‑Fi, and Location to start mesh.",
      grant: "Grant",
      meshStatus: "Mesh",
      running: "Running",
      starting: "Starting...",
      stopped: "Stopped",
      batterySaver: "Battery Saver",
      ecoOn: "Eco on",
      ecoOff: "Eco off",
      queue: "Queue",
      discover: "Discover",
      startMesh: "Start Mesh",
      stopMesh: "Stop Mesh",
      initializingShort: "Initializing...",
      actionNeeded: "Action needed",
      permissionsCallout:
        "If this is a permission issue, accept all Bluetooth / Location / Nearby Wi‑Fi prompts then retry.",
    },
  },
  hi: {
    app: {
      name: "रूटएआई",
      subtitle: "निर्णय समर्थन प्रणाली",
      online: "ऑनलाइन",
      welcomeTag: "भारत सरकार • पूर्वोत्तर पहल",
      welcomeQuote:
        "दुर्गम क्षेत्रों में आपातकालीन प्रतिक्रिया के लिए भू-आधारित जोखिम स्कोर वाली नेविगेशन।",
      initButton: "डैशबोर्ड शुरू करें",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "रूट-एआई कर्नेल प्रारंभ...",
        bhuvan: "इसरो भुवन से जुड़ रहा है...",
        imd: "आईएमडी मौसम ग्रिड ला रहा है...",
        terrain: "टेरेन सेंसर कैलिब्रेट...",
        secure: "सिस्टम सुरक्षित।",
      },
    },
    nav: {
      status: "स्थिति",
      route: "मार्ग",
      mesh: "मेश",
      cmd: "कमांड",
    },
    map: {
      liveRouting: "लाइव सुरक्षा मार्ग",
      state: "स्थिति",
      analyzing: "विश्लेषण जारी",
      realRouteReady: "वास्तविक मार्ग तैयार",
      fallbackRoute: "फॉलबैक लाइन",
      offline: "ऑफलाइन",
      streets: "सड़क",
      satellite: "सैटेलाइट",
      from: "से",
      to: "तक",
      currentLocation: "वर्तमान स्थान",
      setStart: "शुरुआत चुनें",
      analyzeBtn: "मार्ग सुरक्षा जाँचें",
      reset: "रीसेट",
      selectPrompt: "शुरुआत और गंतव्य चुनें",
      start: "शुरुआत",
      destination: "गंतव्य",
      gps: "जीपीएस",
      enterDestination: "गंतव्य दर्ज करें",
      useGpsOrType: "जीपीएस या टाइप करें",
      safetyScan: "जोखिम मूल्यांकन जारी",
      analyzingTerrain: "भूभाग और जोखिम का विश्लेषण...",
      navigationActive: "नेविगेशन चालू",
      exit: "बाहर निकलें",
      distance: "दूरी",
      safetyScore: "सुरक्षा स्कोर",
      riskLevel: "जोखिम स्तर",
      aiExplanation: "एआई विवरण",
      routeAnalyzed: "मार्ग विश्लेषित",
      navigationActiveShort: "नेविगेशन सक्रिय",
      startJourney: "आपातकालीन तैनाती मार्ग अनुमोदित करें",
      endJourney: "यात्रा समाप्त",
      close: "बंद करें",
      sos: "SOS",
    },
    dashboard: {
      status: "स्थिति",
      monitor: "निगरानी क्षेत्र",
      rain: "वर्षा",
      seismic: "भूकंपीय",
      pack: "ऑफलाइन पैक",
      admin: "जिला / एनडीआरएफ प्राधिकरण नोड",
      alert: "आपातकालीन प्रसारण",
    },
    settings: {
      title: "नागरिक प्रोफ़ाइल",
      subtitle: "आपातकालीन बीकन्स से जुड़ा",
      nameLabel: "पूरा नाम",
      phoneLabel: "आपातकालीन संपर्क",
      bloodLabel: "रक्त समूह",
      medicalLabel: "चिकित्सीय नोट्स",
      namePlaceholder: "नाम दर्ज करें",
      phonePlaceholder: "+91 XXXXX XXXXX",
      bloodPlaceholder: "O+",
      medicalPlaceholder: "एलर्जी, डायबिटीज, आदि",
      save: "प्रोफ़ाइल सहेजें",
      saved: "पहचान सहेजी गई",
      auditTitle: "सिस्टम ऑडिट",
      securityLevel: "सुरक्षा स्तर",
      buildVersion: "बिल्ड संस्करण",
      dataSources: "डेटा स्रोत",
    },
    sos: {
      title: "आपातकालीन SOS",
      subtitle: "बिना इंटरनेट या नेटवर्क भी काम करता है",
      running: "प्रसारण चालू",
      paused: "प्रसारण रोका गया",
      yourMessage: "आपका आपातकालीन संदेश",
      created: "बनाया गया",
      ttl: "TTL शेष",
      hops: "हॉप गिनती",
      stored: "संदेश स्थानीय रूप से संग्रहीत। नज़दीकी डिवाइस का इंतजार...",
      carrying: "आप यह संदेश ले जा रहे हैं। आसपास लोग मिलेंगे तो फैलेगा।",
      forwarded: "संदेश अन्य डिवाइस पर साझा हुआ। क्षेत्र में फैल रहा है।",
      delivered: "संदेश प्राधिकरण/सुरक्षित स्थान पर पहुँचा।",
      journey: "संदेश यात्रा",
      createTitle: "आपातकालीन संदेश बनाएं",
      typeLabel: "आपातकालीन प्रकार",
      detailsLabel: "अतिरिक्त विवरण (वैकल्पिक)",
      detailsPlaceholder: "स्थिति का विवरण दें...",
      send: "आपातकालीन SOS भेजें",
      creating: "बना रहे हैं...",
      howWorks: "यह कैसे काम करता है:",
      worksBullets: [
        "संदेश तुरंत स्थानीय रूप से सहेजा जाता है",
        "इंटरनेट या सेल नेटवर्क की जरूरत नहीं",
        "लोगों के चलने पर संदेश फैलता है",
        "हर डिवाइस रिले बनता है",
        "समय के साथ पूरा शहर/कस्बा कवर",
      ],
      statusTitle: "प्रसारण स्थिति",
      peersNearby: "आसपास साथी",
      totalEncounters: "कुल मुलाकातें",
      messagesShared: "साझा संदेश",
      messagesCarrying: "ले जाए जा रहे संदेश",
      lastEncounter: "अंतिम मुलाकात",
      start: "प्रसारण शुरू करें",
      pause: "रोकें (बैटरी बचाएं)",
      scanning: "हर 15 सेकंड में जोखिम मूल्यांकन प्रगति पर है",
      pausedMessage:
        "प्रसारण रुका है। आपके संदेश सहेजे हैं और पुनः शुरू करने पर फैलते रहेंगे।",
    },
    network: {
      title: "मेश लिंक",
      protocol: "प्रोटोकॉल: DTN",
      peers: "साथी",
      messages: "संदेश",
      initializing: "रेडियो प्रारंभ हो रहे हैं",
      active: "सक्रिय स्कैन चल रहा",
      standby: "स्टैंडबाय",
      permissionsNeeded: "अनुमतियाँ आवश्यक",
      permissionsHint:
        "मेश शुरू करने के लिए ब्लूटूथ स्कैन/कनेक्ट/एडवरटाइज, Nearby Wi‑Fi और लोकेशन सक्षम करें।",
      grant: "अनुमति दें",
      meshStatus: "मेश",
      running: "चालू",
      starting: "शुरू हो रहा...",
      stopped: "रुका",
      batterySaver: "बैटरी सेवर",
      ecoOn: "इको ऑन",
      ecoOff: "इको ऑफ",
      queue: "कतार",
      discover: "खोज",
      startMesh: "मेश चालू",
      stopMesh: "मेश बंद",
      initializingShort: "प्रारंभ हो रहा...",
      actionNeeded: "कार्रवाई आवश्यक",
      permissionsCallout:
        "यदि यह अनुमति समस्या है, तो सभी ब्लूटूथ/लोकेशन/Nearby Wi‑Fi प्रॉम्प्ट स्वीकार करें और पुनः प्रयास करें।",
    },
  },
  bn: {
    app: {
      name: "রুটAI",
      subtitle: "সিদ্ধান্ত সহায়তা সিস্টেম",
      online: "অনলাইন",
      welcomeTag: "भारत सरकार • पूर्वोत्तर पहल",
      welcomeQuote:
        "দুর্গম এলাকায় জরুরি প্রতিক্রিয়ার জন্য ঝুঁকি-ভিত্তিক নেভিগেশন।",
      initButton: "ড্যাশবোর্ড চালু করুন",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "রুট-AI কার্নেল শুরু...",
        bhuvan: "ইসরো ভূবন সংযোগ...",
        imd: "IMD আবহাওয়া গ্রিড আনছি...",
        terrain: "টেরেইন সেন্সর ক্যালিব্রেট...",
        secure: "সিস্টেম সুরক্ষিত।",
      },
    },
    nav: { status: "স্থিতি", route: "পথ", mesh: "মেশ", cmd: "কমান্ড" },
    map: {
      liveRouting: "লাইভ নিরাপদ রুট",
      state: "অবস্থা",
      analyzing: "বিশ্লেষণ চলছে",
      realRouteReady: "বাস্তব রুট প্রস্তুত",
      fallbackRoute: "ফলব্যাক লাইন",
      offline: "অফলাইন",
      streets: "স্ট্রিট",
      satellite: "স্যাটেলাইট",
      from: "থেকে",
      to: "পর্যন্ত",
      currentLocation: "বর্তমান অবস্থান",
      setStart: "শুরু নির্বাচন",
      analyzeBtn: "রুট নিরাপত্তা বিশ্লেষণ",
      reset: "রিসেট",
      selectPrompt: "শুরু ও গন্তব্য নির্বাচন করুন",
      start: "শুরু",
      destination: "গন্তব্য",
      gps: "জিপিএস",
      enterDestination: "গন্তব্য লিখুন",
      useGpsOrType: "জিপিএস বা লিখুন",
      safetyScan: "Risk Assessment in Progress",
      analyzingTerrain: "ভূখণ্ড ও ঝুঁকি বিশ্লেষণ...",
      navigationActive: "নেভিগেশন চালু",
      exit: "বের হন",
      distance: "দূরত্ব",
      safetyScore: "নিরাপত্তা স্কোর",
      riskLevel: "ঝুঁকি স্তর",
      aiExplanation: "এআই ব্যাখ্যা",
      routeAnalyzed: "রুট বিশ্লেষিত",
      navigationActiveShort: "নেভিগেশন সক্রিয়",
      startJourney: "Approve Route for Emergency Deployment",
      endJourney: "যাত্রা শেষ",
      close: "বন্ধ করুন",
      sos: "এসওএস",
    },
    dashboard: {
      status: "স্থিতি",
      monitor: "মনিটরিং সেক্টর",
      rain: "বৃষ্টিপাত",
      seismic: "ভূকম্পীয়",
      pack: "অফলাইন প্যাক",
      admin: "District / NDRF Authority Node",
      alert: "জরুরি সম্প্রচার",
    },
    settings: {},
    sos: {},
    network: {},
  },
  ta: {
    app: {
      name: "ரூட்AI",
      subtitle: "முடிவு ஆதரவு அமைப்பு",
      online: "ஆன்லைன்",
      welcomeTag: "இந்தியா அரசு • வடகிழக்கு முனைவு",
      welcomeQuote: "அவசரகால பதிலுக்கு நில அபாய மதிப்பீட்டு வழிசெலுத்தல்.",
      initButton: "டாஷ்போர்டு தொடங்கு",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "ரூட்-AI கர்னல் தொடங்குகிறது...",
        bhuvan: "இஸ்ரோ புவன் இணைப்பு...",
        imd: "IMD வானிலை கிரிட்...",
        terrain: "புவியியல் சென்சார் ஒத்திசை...",
        secure: "கணினி பாதுகாப்பானது.",
      },
    },
    nav: { status: "நிலை", route: "பாதை", mesh: "மெஷ்", cmd: "கமாண்ட்" },
    map: {
      liveRouting: "நேரடி பாதுகாப்பு பாதை",
      state: "நிலை",
      analyzing: "பகுப்பாய்வு",
      realRouteReady: "உண்மை பாதை தயார்",
      fallbackRoute: "மாற்றுப் பாதை",
      offline: "ஆஃப்லைன்",
      streets: "தெரு",
      satellite: "சாட்டிலைட்",
      from: "இருந்து",
      to: "வரை",
      currentLocation: "நடப்பு இடம்",
      setStart: "தொடக்கம் தேர்வு",
      analyzeBtn: "பாதை பாதுகாப்பு",
      reset: "ரீசெட்",
      selectPrompt: "தொடக்கம் மற்றும் இலக்கு தேர்வு",
      start: "தொடக்கம்",
      destination: "இலக்கு",
      gps: "GPS",
      enterDestination: "இலக்கு எழுதவும்",
      useGpsOrType: "GPS அல்லது எழுதவும்",
      safetyScan: "Risk Assessment in Progress",
      analyzingTerrain: "புவியியல் அபாயம் பரிசீலனை...",
      navigationActive: "நெவிகேஷன்",
      exit: "வெளியேறு",
      distance: "தூரம்",
      safetyScore: "பாதுகாப்பு மதிப்பு",
      riskLevel: "அபாய நிலை",
      aiExplanation: "AI விளக்கம்",
      routeAnalyzed: "பாதை பகுப்பாய்வு",
      navigationActiveShort: "நெவிகேஷன் செயலில்",
      startJourney: "Approve Route for Emergency Deployment",
      endJourney: "பயணம் முடி",
      close: "மூடு",
      sos: "SOS",
    },
    dashboard: {},
    settings: {},
    sos: {},
    network: {},
  },
  te: {
    app: {
      name: "రూట్AI",
      subtitle: "నిర్ణయ సహాయక వ్యవస్థ",
      online: "ఆన్‌లైన్",
      welcomeTag: "భారత ప్రభుత్వం • ఈశాన్య ముందడుగు",
      welcomeQuote:
        "ప్రతికూల ప్రదేశాల్లో అత్యవసర ప్రతిస్పందన కోసం భూ-ప్రమాద ఆధారిత నావిగేషన్.",
      initButton: "డ్యాష్‌బోర్డ్ ప్రారంభించు",
      boot: {
        bios: "BIOS v2.4.0",
        kernel: "రూట్-AI కర్నల్ ప్రారంభం...",
        bhuvan: "ఇస్రో భువన్ కనెక్ట్...",
        imd: "IMD వాతావరణ గ్రిడ్ తెస్తున్నాం...",
        terrain: "భూభాగ సెన్సార్ కాలిబ్రేట్...",
        secure: "సిస్టమ్ సురక్షితం.",
      },
    },
    nav: { status: "స్థితి", route: "మార్గం", mesh: "మెష్", cmd: "కమాండ్" },
    map: {
      liveRouting: "ప్రత్యక్ష భద్ర మార్గం",
      state: "స్థితి",
      analyzing: "విశ్లేషణ",
      realRouteReady: "నిజ మార్గం సిద్ధం",
      fallbackRoute: "ఫాల్బ్యాక్ లైన్",
      offline: "ఆఫ్‌లైన్",
      streets: "స్ట్రీట్స్",
      satellite: "శాటిలైట్",
      from: "నుండి",
      to: "వరకు",
      currentLocation: "ప్రస్తుత స్థానం",
      setStart: "ప్రారంభం ఎంచుకోండి",
      analyzeBtn: "మార్గ భద్రత విశ్లేషణ",
      reset: "రిసెట్",
      selectPrompt: "ప్రారంభం, గమ్యం ఎంచుకోండి",
      start: "ప్రారంభం",
      destination: "గమ్యం",
      gps: "GPS",
      enterDestination: "గమ్యం నమోదు",
      useGpsOrType: "GPS లేదా టైప్ చేయండి",
      safetyScan: "Risk Assessment in Progress",
      analyzingTerrain: "భూభాగం, ప్రమాదాల విశ్లేషణ...",
      navigationActive: "నేవిగేషన్ ఆన్",
      exit: "నిష్క్రమించు",
      distance: "దూరం",
      safetyScore: "భద్రత స్కోర్",
      riskLevel: "ప్రమాద స్థాయి",
      aiExplanation: "AI వివరణ",
      routeAnalyzed: "మార్గం విశ్లేషితం",
      navigationActiveShort: "నేవిగేషన్ యాక్టివ్",
      startJourney: "Approve Route for Emergency Deployment",
      endJourney: "ప్రయాణం ముగించు",
      close: "మూసివేయి",
      sos: "SOS",
    },
    dashboard: {},
    settings: {},
    sos: {},
    network: {},
  },
};

const I18nContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  hasChosen: false,
});

const getInitialLang = () => {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LANGUAGE_KEY)
      : null;
  if (stored) return stored;
  const browserLang =
    typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
  const supported = languages.some((l) => l.code === browserLang)
    ? browserLang
    : "en";
  return supported;
};

const resolvePath = (obj, path) => {
  return path.split(".").reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, obj);
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(getInitialLang());
  const [hasChosen, setHasChosen] = useState(
    typeof localStorage !== "undefined" && !!localStorage.getItem(LANGUAGE_KEY),
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

  const t = useMemo(() => {
    const current = translations[lang] || translations.en;
    const fallback = translations.en;
    return (key) => {
      const value = resolvePath(current, key);
      if (value !== undefined) return value;
      const fb = resolvePath(fallback, key);
      return fb !== undefined ? fb : key;
    };
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, hasChosen }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
