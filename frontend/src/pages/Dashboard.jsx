import { useState, useEffect } from 'react';
import { 
  CloudRain, Wind, Droplets, AlertTriangle, 
  Mic, Activity, FileText, RefreshCw, ShieldAlert,
  Thermometer, Navigation
} from 'lucide-react';
import { useI18n } from '../i18n';
import { voiceService } from '../services/voiceService';
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import jsPDF from "jspdf";

// 🚀 DIRECT FETCH ENGINE
const DIRECT_API_URL = "https://157.245.111.124.nip.io";

const safeFetch = async (endpoint) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(DIRECT_API_URL + endpoint, { signal: controller.signal });
    clearTimeout(id);
    return await response.json();
  } catch (error) { return null; }
};

const DashboardView = () => {
  const { t } = useI18n();
  
  // --- STATE ---
  const [weather, setWeather] = useState({ temp: 24, condition: "Cloudy", humidity: 82 });
  const [threatLevel, setThreatLevel] = useState("MODERATE"); 
  const [systemStatus, setSystemStatus] = useState({ status: "CONNECTING...", risk: 45 });
  const [voiceActive, setVoiceActive] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 1. LIVE SYSTEM CHECK (Auto-Refresh) ---
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(() => {
      fetchLiveStatus();
      // Simulate dynamic weather changes
      setWeather(prev => ({
        temp: 24 + Math.floor(Math.random() * 3) - 1,
        condition: Math.random() > 0.7 ? "Rain" : "Cloudy",
        humidity: Math.min(100, Math.max(60, prev.humidity + Math.floor(Math.random() * 5) - 2))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStatus = async () => {
    setLoading(true);
    const readiness = await safeFetch("/system/readiness");
    const iot = await safeFetch("/iot/feed"); 
    
    if (readiness) {
      const risk = iot?.risk_index || 45;
      setSystemStatus({
        status: "ONLINE",
        risk: risk
      });

      // Update Threat Level Colors/Text
      if (risk > 75) setThreatLevel("CRITICAL");
      else if (risk > 50) setThreatLevel("HIGH");
      else setThreatLevel("MODERATE");
    } else {
       setSystemStatus({ status: "OFFLINE", risk: 0 });
    }
    setLoading(false);
  };

  // --- 2. VOICE AI LOGIC ---
  const handleVoiceCommand = async () => {
    setVoiceActive(true);
    try {
        const dummyBlob = new Blob(["demo"], { type: "audio/wav" }); 
        const response = await voiceService.processVoiceCommand(dummyBlob);
        setAiResponse(response.voice_reply);
        setTimeout(() => setAiResponse(null), 8000);
    } catch (e) {
        console.error(e);
    } finally {
        setVoiceActive(false);
    }
  };

  // --- 3. SITREP GENERATOR (PDF) ---
  const generateSitrep = async () => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      
      // Header
      doc.setFillColor(15, 23, 42); // Slate 950
      doc.rect(0, 0, 210, 20, "F");
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("TEAM MATRIX - OFFICIAL SITREP", 105, 13, null, "center");
      
      // Body
      doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`GENERATED: ${timestamp}`, 14, 30);
      doc.text(`SECTOR: ALPHA-1`, 14, 36);
      
      doc.setLineWidth(0.5); doc.line(14, 40, 196, 40);

      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("1. EXECUTIVE SUMMARY", 14, 50);
      
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Current Threat Level: ${threatLevel}`, 14, 60);
      doc.text(`Calculated Risk Index: ${systemStatus.risk}/100`, 14, 66);
      doc.text(`Weather Condition: ${weather.temp}°C, ${weather.condition}`, 14, 72);
      doc.text(`System Status: ${systemStatus.status}`, 14, 78);

      doc.setTextColor(200, 0, 0);
      doc.text("ALERT: Landslide warning active in Northern Quadrant.", 14, 90);
      
      const fileName = `SITREP_${Date.now()}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        await Filesystem.writeFile({ path: fileName, data: pdfBase64, directory: Directory.Documents });
        alert(`✅ SITREP Saved to Documents: ${fileName}`);
      } else {
        doc.save(fileName);
        alert("✅ SITREP Downloaded");
      }
    } catch (error) { 
        alert("⚠️ PDF Error: " + error.message); 
    }
  };

  // --- UI HELPERS ---
  const getGradient = () => {
      if (threatLevel === 'CRITICAL') return "from-red-600 to-red-800";
      if (threatLevel === 'HIGH') return "from-orange-500 to-red-500";
      return "from-emerald-600 to-teal-600";
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      
      {/* 1. NEWS TICKER (Marquee) */}
      <div className="bg-red-900/20 border-l-4 border-red-500 p-2 rounded-r-lg overflow-hidden flex items-center mb-2">
         <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase mr-2 animate-pulse">LIVE</span>
         <div className="overflow-hidden whitespace-nowrap w-full">
            <p className="text-[10px] font-bold text-red-200 animate-marquee inline-block">
                ⚠️ LANDSLIDE WARNING IN SECTOR 7 • NDRF TEAMS DEPLOYED • EVACUATE LOW LYING AREAS • KEEP RADIO ON CHANNEL 4 •
            </p>
         </div>
      </div>

      {/* 2. DYNAMIC STATUS WIDGET */}
      <div className={`bg-gradient-to-r ${getGradient()} rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Activity size={12} className="animate-pulse"/> Status Report
                </h2>
                <h1 className="text-3xl font-black text-white mb-1">{threatLevel} RISK</h1>
                <p className="text-white/80 text-sm font-medium">Risk Index: {systemStatus.risk}%</p>
            </div>
            <button onClick={fetchLiveStatus} className="bg-white/20 p-2 rounded-full hover:bg-white/30 active:scale-90 transition-all">
                <RefreshCw size={18} className={`text-white ${loading ? "animate-spin" : ""}`} />
            </button>
        </div>
      </div>

      {/* 3. VOICE AI "PILL" */}
      <button 
        onClick={handleVoiceCommand}
        className={`w-full py-4 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-95 ${
          voiceActive 
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
            : "bg-slate-900 border border-slate-800 text-slate-200 shadow-md"
        }`}
      >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${voiceActive ? "bg-white/20" : "bg-slate-800"}`}>
                <Mic size={20} className={voiceActive ? "animate-pulse" : ""} />
            </div>
            <div className="text-left">
                <p className="text-xs font-bold uppercase opacity-60">AI Assistant</p>
                <p className="text-sm font-semibold">{voiceActive ? "Listening..." : "Tap to Speak"}</p>
            </div>
        </div>
        {voiceActive && <div className="flex gap-1">
            <span className="w-1 h-4 bg-white animate-[bounce_1s_infinite]"></span>
            <span className="w-1 h-6 bg-white animate-[bounce_1.2s_infinite]"></span>
            <span className="w-1 h-4 bg-white animate-[bounce_1s_infinite]"></span>
        </div>}
      </button>

      {/* AI RESPONSE POPUP */}
      {aiResponse && (
        <div className="bg-slate-800/90 backdrop-blur border border-blue-500/30 p-4 rounded-2xl animate-in zoom-in-95 shadow-2xl">
            <p className="text-blue-400 text-xs font-bold mb-1 uppercase">DistilBERT Response</p>
            <p className="text-white text-sm leading-relaxed italic">"{aiResponse}"</p>
        </div>
      )}

      {/* 4. DYNAMIC WEATHER ROW */}
      <div className="grid grid-cols-3 gap-3">
          <WeatherCard 
            icon={<Thermometer size={20} className="text-orange-400"/>} 
            label="Temp" 
            value={`${weather.temp}°C`} 
          />
          <WeatherCard 
            icon={<Wind size={20} className="text-slate-400"/>} 
            label="Wind" 
            value="12km/h" 
          />
          <WeatherCard 
            icon={<Droplets size={20} className="text-cyan-400"/>} 
            label="Humidity" 
            value={`${weather.humidity}%`} 
          />
      </div>

      {/* 5. SITREP & ALERTS */}
      <div className="grid grid-cols-1 gap-4">
        {/* SITREP GENERATOR */}
        <button 
            onClick={generateSitrep}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-all group hover:border-purple-500/50"
        >
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-900/30 text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText size={20} />
                </div>
                <div className="text-left">
                    <h4 className="text-slate-200 font-bold text-sm">Generate SITREP</h4>
                    <p className="text-slate-500 text-xs">Download Official PDF</p>
                </div>
            </div>
            <div className="bg-slate-800 p-2 rounded-full">
                <Navigation size={16} className="text-slate-400 rotate-90" />
            </div>
        </button>

        {/* ALERTS CAROUSEL */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
            <div className="bg-amber-500/20 p-2 rounded-xl text-amber-500 shrink-0">
                <ShieldAlert size={24} />
            </div>
            <div>
                <h4 className="text-amber-500 font-bold text-sm">Zone Alert</h4>
                <p className="text-amber-200/60 text-xs mt-1 leading-relaxed">
                    High seismic activity in Zone B. Avoid northern routes until 14:00.
                </p>
            </div>
        </div>
      </div>

    </div>
  );
};

// Small Helper Component
const WeatherCard = ({ icon, label, value }) => (
    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm">
        {icon}
        <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
    </div>
);

export default DashboardView;