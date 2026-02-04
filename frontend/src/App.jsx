import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Map as MapIcon, Radio, Signal, ShieldAlert, 
  Menu, UserCircle, Cpu, ShieldCheck, ArrowRight, Lock, Activity, Globe
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
import PredictionView from "./pages/PredictionView";

// --- LOGIC ---
import { useI18n, languages } from "./i18n.jsx";

const App = () => {
  // --- STATE MANAGEMENT ---
  const { t, lang, setLang, hasChosen } = useI18n();
  const [bootState, setBootState] = useState("BOOTING"); 
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
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
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (e) {
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
      { text: "Initializing Matrix Kernel...", delay: 500, progress: 20 },
      { text: "Connecting to Neural Engine...", delay: 1200, progress: 45 },
      { text: "Syncing IoT Sensor Mesh...", delay: 2000, progress: 70 },
      { text: "Loading Terrain Maps...", delay: 2800, progress: 85 },
      { text: "Establishing Secure Uplink...", delay: 3500, progress: 100 },
    ];
    let timeouts = [];
    sequence.forEach(({ text, delay, progress }) => {
      timeouts.push(setTimeout(() => { 
          setLogs((prev) => [...prev, text]); 
          setProgress(progress);
          Haptics.impact({ style: ImpactStyle.Light });
      }, delay));
    });
    timeouts.push(setTimeout(() => { setBootState("WELCOME"); }, 4000));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const enterSystem = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
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
  
  // View 1: Language Selection (Cinematic)
  if (!hasChosen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-6 rotate-3">
                <Globe className="text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Select Language</h2>
            <p className="text-slate-500 font-medium">Choose your preferred interface language</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {languages.map((l) => (
              <button 
                key={l.code} 
                onClick={() => setLang(l.code)} 
                className={`group flex items-center justify-between px-6 py-5 rounded-2xl border text-sm font-bold transition-all duration-300 active:scale-[0.98] ${
                  l.code === lang 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-inner" 
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4">
                    <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all">{l.flag}</span>
                    <span className="text-lg">{l.label}</span>
                </div>
                {l.code === lang && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View 2: Boot Terminal (Sci-Fi HUD Style)
  if (bootState === "BOOTING") {
    return (
      <div className="h-screen bg-black text-emerald-500 font-mono p-8 flex flex-col justify-end pb-32 pt-safe-top pb-safe-bottom relative overflow-hidden">
        {/* Scanlines Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        
        <div className="z-30">
            <div className="mb-8 flex items-center gap-4 text-blue-500 animate-pulse">
                <Cpu size={40} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> 
                <div>
                    <span className="font-bold tracking-[0.3em] text-xl block text-white">SYSTEM BOOT</span>
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest">Bios v4.0.2 // Secure</span>
                </div>
            </div>

            <div className="space-y-2 text-xs md:text-sm font-medium h-48 overflow-hidden mask-image-b">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 animate-in slide-in-from-left fade-in duration-300">
                        <span className="text-slate-600">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                        <span className="text-emerald-400 font-bold">{`> ${log}`}</span>
                    </div>
                ))}
                <div className="h-5 w-2 bg-emerald-500 animate-blink ml-1 mt-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 relative h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                <span>Loading Modules</span>
                <span>{progress}%</span>
            </div>
        </div>
      </div>
    );
  }

  // View 3: Welcome Screen (Immersive)
  if (bootState === "WELCOME") {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans pt-safe-top pb-safe-bottom">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <div className="z-10 flex flex-col items-center text-center space-y-10 animate-in zoom-in duration-700 w-full max-w-sm">
          
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 rounded-full"></div>
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-4 ring-white/10 relative z-10 transform transition-transform duration-500 hover:scale-105">
              <ShieldCheck size={64} className="text-white drop-shadow-md" strokeWidth={1.5} />
            </div>
          </div>

          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                {t("app.name")}
            </h1>
            <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-[0.3em] bg-blue-900/20 py-1.5 px-4 rounded-full border border-blue-500/20">
                <Lock size={10} /> Secure Environment
            </div>
          </div>

          <button 
            onClick={enterSystem} 
            className="group w-full bg-white text-slate-950 h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative z-10">{t("app.initButton")}</span>
            <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // View 4: Main Router Shell (Pro UI)
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom">
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
            style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
            }
        }} 
      />

      {/* HEADER - Floating Glass */}
      {currentPath !== "login" && (
      <header className="flex-none h-16 px-4 z-50 flex items-center justify-between absolute top-0 left-0 w-full pt-safe-top">
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white ring-2 ring-white dark:ring-slate-800">
            <ShieldAlert size={20} fill="currentColor" className="opacity-90"/>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-wider leading-none text-slate-900 dark:text-white uppercase">TEAM MATRIX</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500"}`} />
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{isOnline ? "ONLINE" : "MESH MODE"}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => handleNav("/settings")} 
          className="relative z-10 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-90 border border-slate-200 dark:border-slate-700"
        >
          <UserCircle size={22} />
        </button>
      </header>
      )}

      {/* MAIN CONTENT - With Top Padding for Fixed Header */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 pb-28 pt-16 relative scroll-smooth no-scrollbar transition-colors duration-500">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/sos" element={<SOSView />} />
          <Route path="/mesh" element={<NetworkView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
          <Route path="/predict" element={<PredictionView />} />

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

      {/* BOTTOM NAV - Floating Glass Bar */}
      {currentPath !== "login" && (
      <nav className="absolute bottom-6 left-4 right-4 h-[72px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 flex justify-around items-center px-2 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] pb-safe-bottom">
        <NavButton active={currentPath === "dashboard" || currentPath === ""} onClick={() => handleNav("/dashboard")} icon={<LayoutDashboard size={24} />} label={t("nav.status")} />
        <NavButton active={currentPath === "map"} onClick={() => handleNav("/map")} icon={<MapIcon size={24} />} label={t("nav.route")} />
        
        {/* SOS Button (Pops out - Cinematic) */}
        <div className="relative -top-10">
          <button 
            onClick={() => handleNav("/sos")} 
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
              currentPath === "sos" 
              ? "bg-gradient-to-b from-red-500 to-red-700 text-white scale-110 shadow-red-500/50 ring-4 ring-red-100 dark:ring-red-900/30" 
              : "bg-slate-800 dark:bg-slate-700 border-4 border-white dark:border-slate-950 text-red-500 shadow-xl"
            }`}
          >
            <Radio size={32} className={currentPath === "sos" ? "animate-pulse" : ""} strokeWidth={2.5} />
          </button>
        </div>

        <NavButton active={currentPath === "mesh"} onClick={() => handleNav("/mesh")} icon={<Signal size={24} />} label={t("nav.mesh")} />
        <NavButton active={currentPath === "admin"} onClick={() => handleNav("/admin")} icon={<Menu size={24} />} label={t("nav.cmd")} />
      </nav>
      )}
    </div>
  );
};

// Helper Component for Nav Items (Animated)
const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300 active:scale-90 outline-none tap-highlight-transparent relative ${
      active 
      ? "text-blue-600 dark:text-blue-400" 
      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
    }`}
  >
    <div className={`transition-all duration-300 ${active ? "-translate-y-1 drop-shadow-md" : ""}`}>{icon}</div>
    {active && <span className="absolute -bottom-2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-in zoom-in"></span>}
  </button>
);

export default App;