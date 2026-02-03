import React, { useState, useEffect } from "react";
// ✅ CHANGED: Standard Web Icons (No React Native dependencies)
import { 
  CloudRain, Wind, Droplets, Thermometer, 
  Map as MapIcon, Radio, Signal, ShieldAlert, 
  AlertTriangle, Activity, RefreshCw 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// ✅ NEW: Capacitor Native Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useI18n } from "../i18n";

const API_URL = "https://157.245.111.124.nip.io";

const DashboardView = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState({ temp: 24, rain: 85, wind: 12, hum: 92 });

  // --- 1. NATIVE INITIALIZATION ---
  useEffect(() => {
    const initNative = async () => {
      try {
        // Make Status Bar Dark & Overlay for "Full Screen" feel
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) {
        // Ignore if running on browser
      }
    };
    initNative();
    fetchRisk();
  }, []);

  // --- 2. DATA FETCHING ---
  const fetchRisk = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/iot/feed`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setStats({ risk_index: 42, threat_level: "LOW" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- 3. NATIVE ACTIONS ---
  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impact({ style: ImpactStyle.Medium }); // 📳 Haptic Tick
    fetchRisk();
  };

  const handleNav = async (path) => {
    await Haptics.impact({ style: ImpactStyle.Light }); // 📳 Light Tap
    navigate(path);
  };

  // Theme Logic
  const getThemeColor = () => {
    if (!stats) return "from-emerald-600 to-emerald-900";
    if (stats.threat_level === "CRITICAL") return "from-red-600 to-red-900";
    if (stats.threat_level === "HIGH") return "from-orange-500 to-orange-800";
    return "from-emerald-500 to-emerald-800";
  };

  const themeGradient = getThemeColor();

  return (
    // ✅ SAFE AREAS: pt-safe-top prevents Notch overlap, pb-safe-bottom prevents Nav Bar overlap
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right transition-colors duration-500 selection:bg-transparent">
      
      {/* --- HERO SECTION --- */}
      <div className={`relative w-full p-6 pt-12 pb-24 rounded-b-[3rem] shadow-2xl bg-gradient-to-br ${themeGradient} text-white transition-all duration-1000`}>
        
        {/* Texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                    <ShieldAlert size={14} className="text-white animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{t("app.subtitle")}</span>
                </div>
                {/* Refresh Button */}
                <button onClick={handleRefresh} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">
                    <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Big Risk Number */}
            <div className="text-center mb-4">
                <h1 className="text-7xl font-black tracking-tighter mb-0 leading-none drop-shadow-lg">
                    {loading ? "..." : stats?.risk_index}<span className="text-4xl opacity-60">%</span>
                </h1>
                <p className="text-sm font-bold opacity-80 uppercase tracking-[0.2em] mt-2">
                    {t("dash.risk")}: {stats?.threat_level || "CALCULATING"}
                </p>
            </div>
        </div>

        {/* Floating Weather Card */}
        <div className="absolute -bottom-14 left-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xl flex justify-between items-center z-20 transition-colors duration-500">
            <WeatherMetric icon={<Thermometer size={18} className="text-orange-500"/>} label={t("dash.temp")} value={`${weather.temp}°`} />
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
            <WeatherMetric icon={<CloudRain size={18} className="text-blue-500"/>} label={t("dash.rain")} value={`${weather.rain}%`} />
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
            <WeatherMetric icon={<Wind size={18} className="text-slate-500"/>} label={t("dash.wind")} value={`${weather.wind}k`} />
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
            <WeatherMetric icon={<Droplets size={18} className="text-cyan-500"/>} label={t("dash.humidity")} value={`${weather.hum}%`} />
        </div>
      </div>

      {/* --- WARNING TICKER --- */}
      <div className="pt-20 pb-2 px-6">
        {stats?.threat_level === "HIGH" || stats?.threat_level === "CRITICAL" ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-red-700 dark:text-red-400 font-bold text-xs uppercase mb-0.5">{t("dash.alert")}</h4>
                    <p className="text-red-900 dark:text-red-200 text-xs leading-relaxed">{t("dash.warning")}</p>
                </div>
            </div>
        ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
                <ShieldAlert size={20} className="text-emerald-600 dark:text-emerald-500" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">System operational. No active threats.</p>
            </div>
        )}
      </div>

      {/* --- MAIN GRID --- */}
      <div className="px-6 pb-24">
         <div className="flex justify-between items-end mb-4 mt-6">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("dash.quickActions")}</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 ml-4 mb-1.5 opacity-50"></div>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
            <BigButton 
              onClick={() => handleNav("/map")}
              icon={<MapIcon size={28} className="text-blue-500" />}
              title={t("dash.aiMap")}
              desc={t("dash.navFlood")}
            />
            <BigButton 
              onClick={() => handleNav("/sos")}
              icon={<Radio size={28} className="text-red-500 animate-pulse" />}
              title={t("dash.sosBeacon")}
              desc={t("sos.title")}
            />
            <BigButton 
              onClick={() => handleNav("/mesh")}
              icon={<Signal size={28} className="text-emerald-500" />}
              title={t("dash.offlineComms")}
              desc={t("dash.p2p")}
            />
            <BigButton 
              onClick={() => handleNav("/login")}
              icon={<ShieldAlert size={28} className="text-amber-500" />}
              title={t("dash.adminPanel")}
              desc="Restricted"
            />
         </div>

         {/* Footer ID */}
         <div className="mt-8 text-center opacity-30 pb-8">
            <p className="text-[9px] font-mono tracking-widest text-slate-900 dark:text-white">SESSION ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
         </div>
      </div>

    </div>
  );
};

// --- SUB COMPONENTS ---

const WeatherMetric = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-1">
     <div className="opacity-90">{icon}</div>
     <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
     <div className="text-[8px] uppercase text-slate-500 dark:text-slate-400 font-bold">{label}</div>
  </div>
);

// ✅ BUTTON WITH NATIVE FEEL (Touch States)
const BigButton = ({ onClick, icon, title, desc }) => (
  <button 
    onClick={onClick}
    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-start gap-3 shadow-sm active:scale-95 active:bg-slate-50 dark:active:bg-slate-800 transition-all text-left w-full outline-none tap-highlight-transparent"
  >
     <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
        {icon}
     </div>
     <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">{desc}</p>
     </div>
  </button>
);

export default DashboardView;