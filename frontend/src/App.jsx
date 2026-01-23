import React, { Suspense, lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import {
  LayoutDashboard,
  Map as MapIcon,
  Radio,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Activity,
  Cpu,
} from "lucide-react";
import { useI18n, languages } from "./i18n.jsx";

// LAZY LOAD MODULES (Performance Firewall)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MapView = lazy(() => import("./pages/MapView"));
const NetworkView = lazy(() => import("./pages/NetworkView"));
const SOSView = lazy(() => import("./pages/SOSView"));
const AdminView = lazy(() => import("./pages/AdminView"));
const SettingsView = lazy(() => import("./pages/SettingsView"));

const App = () => {
  const { t, lang, setLang, hasChosen } = useI18n();
  const [bootState, setBootState] = useState("BOOTING"); // BOOTING, WELCOME, READY
  const [logs, setLogs] = useState([]);

  // --- SYSTEM BOOT SEQUENCE ---
  useEffect(() => {
    // Check if user has already seen the boot sequence
    const isReturningUser = sessionStorage.getItem("routeai_booted");

    if (isReturningUser) {
      setBootState("READY");
      return;
    }

    const sequence = [
      { text: t("app.boot.kernel"), delay: 500 },
      { text: t("app.boot.bhuvan"), delay: 1200 },
      { text: t("app.boot.imd"), delay: 2000 },
      { text: t("app.boot.terrain"), delay: 2800 },
      { text: t("app.boot.secure"), delay: 3500 },
    ];

    let timeouts = [];

    sequence.forEach(({ text, delay }) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, text]);
      }, delay);
      timeouts.push(t);
    });

    const finalT = setTimeout(() => {
      setBootState("WELCOME");
    }, 4000);
    timeouts.push(finalT);

    return () => timeouts.forEach(clearTimeout);
  }, [t]);

  const enterSystem = () => {
    sessionStorage.setItem("routeai_booted", "true");
    setBootState("READY");
  };

  // LANGUAGE GATE BEFORE ANY UI
  if (!hasChosen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">
              🌐
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-400 font-bold">
                RouteAI NE
              </p>
              <h2 className="text-xl font-black">{t("app.name")}</h2>
            </div>
          </div>
          <p className="text-sm text-slate-300">Choose your app language</p>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center justify-between px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  l.code === lang
                    ? "border-blue-500 bg-blue-600/10 text-white"
                    : "border-slate-600 bg-slate-800 text-slate-200 hover:border-blue-400"
                }`}
              >
                <span>{l.label}</span>
                {l.code === lang && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            You can change this anytime in Settings.
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER: BOOT SCREEN ---
  if (bootState === "BOOTING") {
    return (
      <div className="h-screen bg-slate-950 text-green-500 font-mono p-8 flex flex-col justify-end pb-24">
        <div className="mb-4 flex items-center gap-2 text-blue-500 animate-pulse">
          <Cpu size={24} />
          <span className="font-bold tracking-widest">
            {t("app.boot.bios")}
          </span>
        </div>
        <div className="space-y-2 text-xs md:text-sm">
          {logs.map((log, i) => (
            <div
              key={i}
              className="border-l-2 border-green-800 pl-2 animate-in slide-in-from-left fade-in duration-300"
            >
              {`> ${log}`}
            </div>
          ))}
          <div className="h-4 w-2 bg-green-500 animate-bounce ml-2 mt-2"></div>
        </div>
      </div>
    );
  }

  // --- RENDER: WELCOME SCREEN ---
  if (bootState === "WELCOME") {
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-900/20 rounded-full blur-[100px] animate-pulse"></div>

        <div className="z-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-700">
          <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <ShieldCheck size={48} className="text-white" />
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              {t("app.name")}
              <span className="text-blue-500">NE</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              {t("app.welcomeTag")}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700 max-w-xs">
            <p className="text-xs text-slate-300 leading-relaxed">
              {t("app.welcomeQuote")}
            </p>
          </div>

          <button
            onClick={enterSystem}
            className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl mt-4"
          >
            {t("app.initButton")} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-500">
        {/* TOP BAR */}
        <header className="bg-white sticky top-0 z-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none">
                {t("app.name")}
                <span className="text-blue-600">NE</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-700">
              {t("app.online")}
            </span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pb-24 relative">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-60 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Loading Module...
                </p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/network" element={<NetworkView />} />
              <Route path="/sos" element={<SOSView />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="/command" element={<AdminView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </Suspense>
        </main>

        {/* BOTTOM NAVIGATION */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-600 scale-105" : "text-slate-400"}`
            }
          >
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-bold">{t("nav.status")}</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-600 scale-105" : "text-slate-400"}`
            }
          >
            <MapIcon size={22} />
            <span className="text-[10px] font-bold">{t("nav.route")}</span>
          </NavLink>

          <NavLink
            to="/sos"
            className={({ isActive }) =>
              `relative -top-6 bg-red-600 text-white p-4 rounded-full shadow-xl shadow-red-200 transition-transform ${isActive ? "scale-110" : "hover:scale-105"}`
            }
          >
            <AlertTriangle size={28} />
          </NavLink>

          <NavLink
            to="/network"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-600 scale-105" : "text-slate-400"}`
            }
          >
            <Radio size={22} />
            <span className="text-[10px] font-bold">{t("nav.mesh")}</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-600 scale-105" : "text-slate-400"}`
            }
          >
            <ShieldCheck size={22} />
            <span className="text-[10px] font-bold">{t("nav.cmd")}</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
};

export default App;
