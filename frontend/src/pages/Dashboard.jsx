import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  Settings,
  Mic,
  Download,
  Shield,
  AlertTriangle,
  Globe,
  MapPin,
} from "lucide-react";
import { safeFetch } from "../config";
import { Link } from "react-router-dom";
import { voiceService } from "../services/voiceService";
import { offlineService } from "../services/offlineService";

// Simple Translation Dictionary
const DICTIONARY = {
  en: {
    status: "Status",
    monitor: "Monitoring Sector",
    rain: "Rainfall",
    seismic: "Seismic",
    pack: "Offline Pack",
    admin: "Admin Node",
    alert: "Emergency Broadcast",
  },
  hi: {
    status: "स्थिति",
    monitor: "निगरानी क्षेत्र",
    rain: "वर्षा",
    seismic: "भूकंपीय",
    pack: "ऑफलाइन पैक",
    admin: "एडमिन नोड",
    alert: "आपातकालीन प्रसारण",
  },
};

const Dashboard = () => {
  const [iotData, setIotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [recording, setRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [packStatus, setPackStatus] = useState(offlineService.getStatus());
  const [activeAlert, setActiveAlert] = useState(null);

  // NEW: Feature States
  const [lang, setLang] = useState("en"); // 'en' or 'hi'
  const [missionActive, setMissionActive] = useState(false);

  useEffect(() => {
    fetchData();
    // Check for active mission
    if (localStorage.getItem("drishti_mission_active") === "true") {
      setMissionActive(true);
    }
  }, []);

  const t = DICTIONARY[lang]; // Helper for translation

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch("/iot/feed");
      setIotData(data || { rain: "--", seismic: "--", status: "Offline" });
      if (data && data.status === "CRITICAL") {
        setActiveAlert("FLASH FLOOD WARNING: Seek high ground immediately.");
      } else {
        setActiveAlert(null);
      }
      setLastSync(new Date());
    } catch (err) {
      setError("Failed to sync sensors. Working from cached/offline data.");
    }
    setLoading(false);
  };

  const downloadPack = async () => {
    setLoading(true);
    const result = await offlineService.downloadPack();
    if (result.success) {
      setPackStatus(`Active`);
      alert("✅ Intel Pack Downloaded!");
    } else {
      alert("❌ Download Failed.");
    }
    setLoading(false);
  };

  const handleVoice = async () => {
    if (recording) return;
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const dummyBlob = new Blob(["demo"], { type: "audio/wav" });
      // Pass language code based on selection
      const result = await voiceService.processVoiceCommand(dummyBlob);
      setVoiceResult(result);
      setTimeout(() => setVoiceResult(null), 5000);
    }, 2000);
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "hi" : "en"));

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* STATUS HEADER */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="opacity-90" />
            <Link
              to="/settings"
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 active:scale-95 transition-all"
            >
              <Settings size={20} className="text-white" />
            </Link>
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1"
            >
              <Globe size={16} className="text-white" />
              <span className="text-[10px] font-bold uppercase">{lang}</span>
            </button>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={10} />
            ) : (
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            )}
            {loading ? "Syncing..." : "Live"}
          </button>
        </div>
        <h2 className="text-2xl font-bold relative z-10">
          {t.status}: {iotData?.status || "Scanning..."}
        </h2>
        <p className="opacity-80 text-sm relative z-10">
          {t.monitor}: NE-Alpha
        </p>
        {lastSync && (
          <p className="opacity-70 text-[11px] relative z-10">
            Last sync: {lastSync.toLocaleTimeString()}
          </p>
        )}
        {error && (
          <div className="mt-3 bg-red-500/20 border border-red-400/60 text-white text-xs px-3 py-2 rounded-xl relative z-10">
            {error}
          </div>
        )}
        <Zap size={120} className="absolute -right-4 -bottom-4 opacity-10" />
      </div>

      {/* MISSION TRACKING CARD (Visible only if SOS active) */}
      {missionActive && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 animate-pulse relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2">
              <MapPin className="animate-bounce" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80">
                  Rescue Inbound
                </p>
                <p className="font-bold text-lg">ETA: 12 Mins</p>
              </div>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">
              LIVE TRACKING
            </div>
          </div>
          {/* Simple Progress Bar */}
          <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-2/3"></div>
          </div>
        </div>
      )}

      {/* CRITICAL ALERT BANNER */}
      {activeAlert && (
        <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-200 animate-pulse flex items-center gap-3">
          <AlertTriangle className="text-white shrink-0" size={24} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">
              {t.alert}
            </p>
            <p className="font-bold text-sm leading-tight">{activeAlert}</p>
          </div>
        </div>
      )}

      {/* ACTION ROW */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <button
          onClick={downloadPack}
          disabled={loading}
          className={`bg-slate-800 text-white p-3 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <Download
            size={18}
            className={packStatus ? "text-green-400" : "text-white"}
          />
          <div className="text-left leading-tight">
            <span className="block text-xs font-bold">
              {packStatus ? "Offline Pack Ready" : t.pack}
            </span>
            {packStatus ? (
              <span className="block text-[8px] text-green-400 font-bold tracking-wider">
                INSTALLED
              </span>
            ) : (
              <span className="block text-[9px] text-slate-200">
                Tap to download for offline
              </span>
            )}
          </div>
        </button>
        <Link
          to="/admin"
          className="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Shield size={18} />
          <span className="text-xs font-bold">{t.admin}</span>
        </Link>
      </div>

      {/* SENSORS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <CloudRain className="text-blue-500 mb-2" />
          <p className="text-[10px] text-slate-400 uppercase font-black">
            {t.rain}
          </p>
          <p className="text-xl font-bold text-slate-800">
            {loading ? "…" : iotData?.rain || "0mm"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <Activity className="text-emerald-500 mb-2" />
          <p className="text-[10px] text-slate-400 uppercase font-black">
            {t.seismic}
          </p>
          <p className="text-xl font-bold text-slate-800">
            {loading ? "…" : iotData?.seismic || "0.0 M"}
          </p>
        </div>
      </div>

      {/* VOICE FAB */}
      <div className="fixed bottom-24 right-6 z-40">
        {voiceResult && (
          <div className="absolute bottom-16 right-0 w-64 bg-slate-800 text-white p-4 rounded-2xl shadow-xl mb-2 animate-in slide-in-from-bottom-4">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Sarvam AI ({lang.toUpperCase()})
            </p>
            <p className="text-sm font-medium mt-1">
              "{voiceResult.translated_text}"
            </p>
            <div className="mt-2 pt-2 border-t border-slate-600 text-green-400 text-xs font-bold">
              {voiceResult.voice_reply}
            </div>
          </div>
        )}
        <button
          onClick={handleVoice}
          className={`p-4 rounded-full shadow-lg shadow-blue-200 transition-all active:scale-90 ${recording ? "bg-red-500 animate-pulse" : "bg-blue-600"}`}
        >
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};
export default Dashboard;
