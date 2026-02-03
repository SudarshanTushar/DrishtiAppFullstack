import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Radio,
  Signal,
  ShieldAlert,
  Menu,
  UserCircle,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Brain,
} from "lucide-react";

// --- PAGES ---
import DashboardView from "./pages/Dashboard";
import MapView from "./pages/MapView";
import SOSView from "./pages/SOSView";
import NetworkView from "./pages/NetworkView";
import AdminPanel from "./pages/AdminPanel";
import SettingsView from "./pages/SettingsView";

// --- LOGIC ---
import { useI18n, languages } from "./i18n.jsx";

const App = () => {
  console.log("🚀 App component starting...");

  // --- STATE MANAGEMENT ---
  const { t, lang, setLang, hasChosen } = useI18n();
  console.log("✅ i18n loaded:", { lang, hasChosen });

  const [bootState, setBootState] = useState("READY"); // Skip boot for testing
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("map"); // Start on map tab
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  console.log("✅ State initialized:", { bootState, activeTab, isOnline });

  // --- 1. BOOT SEQUENCE LOGIC ---
  useEffect(() => {
    // Skip boot if already done in this session
    if (sessionStorage.getItem("routeai_booted")) {
      setBootState("READY");
      return;
    }

    const sequence = [
      { text: "Initializing Matrix Kernel...", delay: 500 },
      { text: "Connecting to Neural Engine...", delay: 1200 },
      { text: "Syncing IoT Sensor Mesh...", delay: 2000 },
      { text: "Loading Terrain Maps...", delay: 2800 },
      { text: "Establishing Secure Uplink...", delay: 3500 },
    ];

    let timeouts = [];
    sequence.forEach(({ text, delay }) => {
      timeouts.push(
        setTimeout(() => {
          setLogs((prev) => [...prev, text]);
        }, delay),
      );
    });

    timeouts.push(
      setTimeout(() => {
        setBootState("WELCOME");
      }, 4000),
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const enterSystem = () => {
    sessionStorage.setItem("routeai_booted", "true");
    setBootState("READY");
  };

  // --- 2. ONLINE/OFFLINE LISTENER ---
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  // --- 3. RENDER CONTENT SWITCHER ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "map":
        return <MapView />;
      case "sos":
        return <SOSView />;
      case "mesh":
        return <NetworkView />;
      case "admin":
        return <AdminPanel />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // ==========================================
  // VIEW 1: LANGUAGE SELECTION (SKIP FOR TESTING)
  // ==========================================
  /* if (!hasChosen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 animate-in fade-in duration-500 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-900/40">
              🌐
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.2em]">
                Team Matrix
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {t("app.name")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center justify-between px-5 py-4 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                  l.code === lang
                    ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-900/20"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {l.code === lang && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  } */

  // ==========================================
  // VIEW 2: BOOT TERMINAL (SKIP FOR TESTING)
  // ==========================================
  /* if (bootState === "BOOTING") {
    return (
      <div className="h-screen bg-slate-950 text-emerald-500 font-mono p-8 flex flex-col justify-end pb-32">
        <div className="mb-6 flex items-center gap-3 text-blue-500 animate-pulse">
          <Cpu size={32} />
          <span className="font-bold tracking-[0.2em] text-lg">
            SYSTEM BOOT
          </span>
        </div>
        <div className="space-y-3 text-xs md:text-sm font-medium">
          {logs.map((log, i) => (
            <div
              key={i}
              className="border-l-2 border-emerald-800 pl-3 animate-in slide-in-from-left fade-in duration-300"
            >
              {`> ${log}`}
            </div>
          ))}
          <div className="h-5 w-2 bg-emerald-500 animate-bounce ml-3 mt-4"></div>
        </div>
      </div>
    );
  } */

  // ==========================================
  // VIEW 3: WELCOME SCREEN (SKIP FOR TESTING)
  // ==========================================
  /* if (bootState === "WELCOME") {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <>
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

          <div className="z-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-700">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-white/5">
              <ShieldCheck size={56} className="text-white drop-shadow-md" />
            </div>

            <div>
              <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
                {t("app.name")}
              </h1>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em]">
                AI Response Unit
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-xs shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-purple-400" />
                <p className="text-xs font-bold text-slate-200">System Ready</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                DistilBERT model loaded. Secure link established. Awaiting pilot
                command.
              </p>
            </div>

            <button
              onClick={enterSystem}
              className="w-full max-w-xs bg-white text-slate-950 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            >
              {t("app.initButton")} <ArrowRight size={22} />
            </button>
          </div>
        </>
      </div>
    );
  } */

  // ==========================================
  // VIEW 4: MAIN APP (MOBILE SHELL)
  // ==========================================
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 📱 TOP HEADER (Sticky) */}
      <header className="flex-none h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-50 safe-top">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white leading-none">
              TEAM MATRIX
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {isOnline ? "ONLINE" : "MESH MODE"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("settings")}
          className={`p-2.5 rounded-full transition-all active:scale-95 ${
            activeTab === "settings"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
          }`}
        >
          <UserCircle size={22} />
        </button>
      </header>

      {/* 📱 MAIN CONTENT AREA (Scrollable) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 pb-28 relative scroll-smooth no-scrollbar">
        {renderContent()}
      </main>

      {/* 📱 BOTTOM NAVIGATION BAR (Fixed) */}
      <nav className="flex-none h-[88px] bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around items-start pt-3 px-2 pb-safe z-50 absolute bottom-0 w-full shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <NavButton
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
          icon={<LayoutDashboard size={22} />}
          label={t("nav.status")}
        />
        <NavButton
          active={activeTab === "map"}
          onClick={() => setActiveTab("map")}
          icon={<MapIcon size={22} />}
          label={t("nav.route")}
        />

        {/* SOS BUTTON (Floating Center) */}
        <div className="relative -top-8">
          <button
            onClick={() => setActiveTab("sos")}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              activeTab === "sos"
                ? "bg-red-500 scale-105 shadow-red-500/50 ring-4 ring-red-500/20"
                : "bg-slate-800 border border-slate-700 text-red-500 shadow-lg"
            }`}
          >
            <Radio
              size={26}
              className={activeTab === "sos" ? "animate-pulse text-white" : ""}
              strokeWidth={2.5}
            />
          </button>
        </div>

        <NavButton
          active={activeTab === "mesh"}
          onClick={() => setActiveTab("mesh")}
          icon={<Signal size={22} />}
          label={t("nav.mesh")}
        />
        <NavButton
          active={activeTab === "admin"}
          onClick={() => setActiveTab("admin")}
          icon={<Menu size={22} />}
          label={t("nav.cmd")}
        />
      </nav>
    </div>
  );
};

// Helper Component for Nav Items
const NavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 gap-1.5 transition-all duration-300 active:scale-95 ${
      active ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
    }`}
  >
    <div
      className={`transition-transform duration-300 ${active ? "-translate-y-1" : ""}`}
    >
      {icon}
    </div>
    <span
      className={`text-[9px] font-bold tracking-wide transition-opacity duration-300 ${active ? "opacity-100" : "opacity-70"}`}
    >
      {label}
    </span>
  </button>
);

export default App;
