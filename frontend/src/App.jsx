import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Map as MapIcon, Radio, Signal, ShieldAlert, 
  Menu, UserCircle, Cpu, ShieldCheck, ArrowRight 
} from "lucide-react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';

// --- PAGES ---
import Login from "./pages/Login";
import DashboardView from "./pages/Dashboard";
import MapView from "./pages/MapView";
import SOSView from "./pages/SOSView";
import NetworkView from "./pages/NetworkView";
import AdminPanel from "./pages/AdminPanel";
import SettingsView from "./pages/SettingsView";
import PredictionView from "./pages/PredictionView"; // ✅ ADDED: New Prediction Page

// --- LOGIC ---
import { useI18n, languages } from "./i18n.jsx";

const App = () => {
  // --- STATE MANAGEMENT ---
  const { t, lang, setLang, hasChosen } = useI18n();
  const [bootState, setBootState] = useState("BOOTING"); 
  const [logs, setLogs] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // 🔐 SECURITY STATE
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ROUTER HOOKS
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace("/", "") || "dashboard";

  // --- 0. NATIVE INITIALIZATION (Capacitor) ---
  useEffect(() => {
    const initNative = async () => {
      try {
        // Make Status Bar Transparent & Dark Content
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Handle Android Hardware Back Button
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (e) {
        // Fallback for browser testing
        console.log("Native plugins not available in browser");
      }
    };
    initNative();

    // Theme Loader
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // --- 1. BOOT SEQUENCE LOGIC ---
  useEffect(() => {
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
      timeouts.push(setTimeout(() => { setLogs((prev) => [...prev, text]); }, delay));
    });
    timeouts.push(setTimeout(() => { setBootState("WELCOME"); }, 4000));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const enterSystem = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    sessionStorage.setItem("routeai_booted", "true");
    setBootState("READY");
  };

  const handleNav = async (path) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    navigate(path);
  };

  // --- 2. SECURITY GUARD ---
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // --- 3. RENDER CONTENT ---
  
  // View 1: Language Selection (Theme Aware)
  if (!hasChosen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">🌐</div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">Team Matrix</p>
              <h2 className="text-2xl font-black tracking-tight">{t("app.name")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {languages.map((l) => (
              <button 
                key={l.code} 
                onClick={() => setLang(l.code)} 
                className={`flex items-center justify-between px-5 py-4 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                  l.code === lang 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-white" 
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3"><span className="text-xl">{l.flag}</span><span>{l.label}</span></div>
                {l.code === lang && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View 2: Boot Terminal (Always Dark for Aesthetic)
  if (bootState === "BOOTING") {
    return (
      <div className="h-screen bg-slate-950 text-emerald-500 font-mono p-8 flex flex-col justify-end pb-32 pt-safe-top pb-safe-bottom">
        <div className="mb-6 flex items-center gap-3 text-blue-500 animate-pulse">
          <Cpu size={32} /> <span className="font-bold tracking-[0.2em] text-lg">SYSTEM BOOT</span>
        </div>
        <div className="space-y-3 text-xs md:text-sm font-medium">
          {logs.map((log, i) => <div key={i} className="border-l-2 border-emerald-800 pl-3 animate-in slide-in-from-left fade-in">{`> ${log}`}</div>)}
          <div className="h-5 w-2 bg-emerald-500 animate-bounce ml-3 mt-4"></div>
        </div>
      </div>
    );
  }

  // View 3: Welcome Screen (Theme Aware)
  if (bootState === "WELCOME") {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="z-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-700">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl ring-4 ring-white/20 dark:ring-white/5 text-white">
            <ShieldCheck size={56} />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">{t("app.name")}</h1>
            <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-[0.3em]">AI Response Unit</p>
          </div>
          <button 
            onClick={enterSystem} 
            className="w-full max-w-xs bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            {t("app.initButton")} <ArrowRight size={22} />
          </button>
        </div>
      </div>
    );
  }

  // View 4: Main Router Shell (Theme Aware + Native Safe Areas)
  return (
    // ✅ ADDED: pt-safe-top (Notch) & pb-safe-bottom (Gesture Bar)
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom">
      <Toaster position="top-center" reverseOrder={false} />

      {/* HEADER */}
      {currentPath !== "login" && (
      <header className="flex-none h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider leading-none text-slate-900 dark:text-white">TEAM MATRIX</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isOnline ? "ONLINE" : "MESH MODE"}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleNav("/settings")} 
          className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90"
        >
          <UserCircle size={22} />
        </button>
      </header>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 pb-28 relative scroll-smooth no-scrollbar transition-colors duration-500">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/sos" element={<SOSView />} />
          <Route path="/mesh" element={<NetworkView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
          <Route path="/predict" element={<PredictionView />} /> {/* ✅ ADDED: Route for Prediction */}

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* BOTTOM NAV */}
      {currentPath !== "login" && (
      <nav className="flex-none h-[88px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-start pt-3 px-2 z-50 absolute bottom-0 w-full pb-safe-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] transition-colors duration-500">
        <NavButton active={currentPath === "dashboard" || currentPath === ""} onClick={() => handleNav("/dashboard")} icon={<LayoutDashboard size={22} />} label={t("nav.status")} />
        <NavButton active={currentPath === "map"} onClick={() => handleNav("/map")} icon={<MapIcon size={22} />} label={t("nav.route")} />
        
        {/* SOS Button (Pops out) */}
        <div className="relative -top-8">
          <button 
            onClick={() => handleNav("/sos")} 
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
              currentPath === "sos" 
              ? "bg-red-600 text-white scale-105 shadow-red-500/50 ring-4 ring-red-100 dark:ring-red-900/20" 
              : "bg-slate-800 border border-slate-700 text-red-500 shadow-lg"
            }`}
          >
            <Radio size={26} className={currentPath === "sos" ? "animate-pulse" : ""} strokeWidth={2.5} />
          </button>
        </div>

        <NavButton active={currentPath === "mesh"} onClick={() => handleNav("/mesh")} icon={<Signal size={22} />} label={t("nav.mesh")} />
        <NavButton active={currentPath === "admin"} onClick={() => handleNav("/admin")} icon={<Menu size={22} />} label={t("nav.cmd")} />
      </nav>
      )}
    </div>
  );
};

// Helper Component for Nav Items (Theme Aware)
const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-16 gap-1.5 transition-all duration-300 active:scale-95 outline-none tap-highlight-transparent ${
      active 
      ? "text-blue-600 dark:text-blue-500" 
      : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300"
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? "-translate-y-1" : ""}`}>{icon}</div>
    <span className={`text-[9px] font-bold tracking-wide transition-opacity duration-300 ${active ? "opacity-100" : "opacity-70"}`}>{label}</span>
  </button>
);

export default App;