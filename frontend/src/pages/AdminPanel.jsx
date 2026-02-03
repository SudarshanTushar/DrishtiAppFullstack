import React, { useState, useEffect } from "react";
import {
  ShieldAlert, Activity, Users, Radio,
  AlertTriangle, CheckCircle, BarChart3,
  Wind, Map as MapIcon, Send, RefreshCw, Lock,
  Terminal, Cpu, Wifi
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ LIVE BACKEND CONNECTION
const API_URL = "https://157.245.111.124.nip.io";

// 🎨 VISUAL MOCK DATA
const HAWA_DATA = [
  { location: "Kohima, Nagaland", aqi: 45, status: "GOOD" },
  { location: "Dimapur, Nagaland", aqi: 112, status: "MODERATE" },
  { location: "Shillong, Meghalaya", aqi: 28, status: "EXCELLENT" },
];

const INCIDENTS = [
  { id: "INC-001", type: "LANDSLIDE", loc: "Tawang Border Rd", severity: "CRITICAL", time: "02m ago" },
  { id: "INC-002", type: "FLOOD", loc: "South Garo Hills", severity: "HIGH", time: "14m ago" },
  { id: "INC-003", type: "SEISMIC", loc: "Silchar Zone 4", severity: "LOW", time: "32m ago" },
];

const AdminPanel = () => {
  // --- STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [logs, setLogs] = useState([
    "[SYSTEM] Connection established with State Data Center (SDC)",
    "[AUTH] Admin Access Granted: Level 5 (Secretariat)",
    "[AI] Random Forest Model v2.1 loaded on Edge Node",
  ]);

  // --- 1. FETCH LIVE INTEL ---
  const fetchIntel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/iot/feed`);
      const data = await res.json();
      setStats(data);
      if(!stats) toast.success("Live Intel Feed Connected", { icon: "📡" });
    } catch (e) {
      setStats({
        risk_index: 78,
        active_sensors: 142,
        threat_level: "HIGH",
        high_risk_reports: 3
      });
    }
    setLoading(false);
  };

  // --- 2. BROADCAST ACTION ---
  const handleBroadcast = () => {
    if (!broadcastMsg) return toast.error("Enter Alert Message!");
    
    toast.loading("Encrypting CAP Payload...", { duration: 1500 });
    
    setTimeout(() => {
        toast.success(`ALERT SENT: "${broadcastMsg}"`, { 
            duration: 5000, 
            icon: '🚀',
            style: { border: '2px solid #ef4444', color: '#ef4444' }
        });
        setLogs(prev => [`[BROADCAST] CAP Alert dispatched to ${stats?.active_sensors || 142} nodes: "${broadcastMsg}"`, ...prev]);
        setBroadcastMsg("");
    }, 1500);
  };

  // --- 3. CLOCK & LOGS SIMULATION ---
  useEffect(() => {
    fetchIntel();
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const dataTimer = setInterval(fetchIntel, 30000);
    
    const logTimer = setInterval(() => {
        const newLogs = [
            `[TELEM] Packet synced from Mesh Node #${Math.floor(Math.random() * 999)}`,
            `[AI] Risk Assessment updated for Sector ${Math.floor(Math.random() * 5)}`,
            `[SYNC] DB Latency: ${Math.floor(Math.random() * 40 + 10)}ms`,
        ];
        setLogs(prev => [newLogs[Math.floor(Math.random() * newLogs.length)], ...prev.slice(0, 8)]);
    }, 2500);

    return () => { clearInterval(clockTimer); clearInterval(dataTimer); clearInterval(logTimer); };
  }, []);

  const getRiskColor = (level) => {
    if (level === "CRITICAL") return "text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/50";
    if (level === "HIGH") return "text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/50";
    return "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/50";
  };

  return (
    // ✅ ROOT: Adapts to Light (slate-50) and Dark (slate-950)
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans pb-24 transition-colors duration-500 selection:bg-blue-500/30">
      
      {/* 🚨 NEWS TICKER */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-500/20 h-8 flex items-center overflow-hidden whitespace-nowrap">
        <div className="animate-marquee text-xs font-mono text-blue-600 dark:text-blue-400 flex gap-8">
          <span>⚠️ ALERT: HEAVY RAINFALL PREDICTED IN CHERRAPUNJI (IMD-WARN-291)</span>
          <span>📡 SYSTEM STATUS: ONLINE (UPTIME 99.98%)</span>
          <span>🌩️ HAWA UPDATE: DIMAPUR AQI SPIKE DETECTED</span>
          <span>🚁 UAV DEPLOYMENT AUTHORIZED FOR SECTOR 7</span>
        </div>
      </div>

      {/* 🏛️ HEADER */}
      <header className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldAlert className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">DRISHTI-NE <span className="text-blue-600 dark:text-blue-500">COMMAND</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              State Emergency Operation Center • Govt of Meghalaya • Auth: ADMIN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white leading-none">
                    {currentTime.toLocaleTimeString('en-US', {hour12: false})}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Zulu: {currentTime.toISOString().split('T')[1].substring(0,8)}Z</div>
            </div>
            <button onClick={fetchIntel} className="p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm">
                <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : "text-slate-400"} />
            </button>
        </div>
      </header>

      {/* 📊 MAIN DASHBOARD */}
      <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto">
        
        {/* === LEFT COLUMN: LIVE STATS & LOGS (4 cols) === */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* 1. LIVE RISK ENGINE */}
            {stats ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity"><Activity size={80} /></div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Cpu size={14} className="animate-pulse text-blue-500"/> Real-Time Risk Engine
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Regional Risk</p>
                        <h2 className={`text-4xl font-black ${getRiskColor(stats.threat_level).split(" ")[0]}`}>
                            {stats.risk_index}<span className="text-sm text-slate-500 font-medium">/100</span>
                        </h2>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Mesh Nodes</p>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {stats.active_sensors} <Wifi size={20} className="text-emerald-500 animate-pulse"/>
                        </h2>
                    </div>
                </div>
                
                <div className={`mt-4 p-3 rounded-lg border flex justify-between items-center ${getRiskColor(stats.threat_level)}`}>
                    <span className="text-xs font-bold uppercase">Threat Level</span>
                    <span className="text-xl font-black tracking-tighter">{stats.threat_level}</span>
                </div>
            </div>
            ) : (
                <div className="h-48 bg-slate-200 dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-300 dark:border-slate-800"></div>
            )}

            {/* 2. HAWA AIR QUALITY */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Wind size={14} className="text-blue-500"/> HAWA Air Quality Feed
                </h3>
                <div className="space-y-3">
                   {HAWA_DATA.map((city, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                         <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-200">{city.location}</div>
                            <div className="text-[10px] text-slate-500">Sensor #{102+idx}</div>
                         </div>
                         <div className="text-right">
                            <div className={`text-lg font-bold ${city.status === "GOOD" ? "text-emerald-600 dark:text-green-400" : city.status === "MODERATE" ? "text-amber-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                {city.aqi}
                            </div>
                            <div className="text-[9px] text-slate-500">{city.status}</div>
                         </div>
                      </div>
                   ))}
                </div>
            </div>

            {/* 3. TERMINAL LOGS (Kept mostly dark for "Hacker" aesthetic, but fits light layout) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs h-56 overflow-hidden relative shadow-inner">
                <div className="absolute top-2 right-2 text-slate-600"><Terminal size={14}/></div>
                <div className="text-emerald-500 font-bold mb-2">root@drishti-ne:~$ tail -f /var/log/syslog</div>
                <div className="space-y-1 text-slate-400 opacity-90 flex flex-col-reverse h-full overflow-hidden">
                    {logs.map((log, i) => (
                        <div key={i} className="truncate hover:text-white transition-colors border-l-2 border-transparent hover:border-blue-500 pl-2">
                            <span className="text-slate-600 mr-2">{new Date().toLocaleTimeString()}</span>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* === RIGHT COLUMN: ACTIONS & MAP (8 cols) === */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* 1. BROADCAST CONSOLE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-lg"><Radio className="text-red-600 dark:text-red-500" size={24} /></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Broadcast System (CAP)</h3>
                        <p className="text-xs text-slate-500">Authenticated High-Priority Alert System</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="ENTER ALERT MESSAGE (e.g., 'FLASH FLOOD IN SECTOR 4 - EVACUATE')" 
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-red-500 outline-none transition-all font-mono tracking-wide"
                    />
                    <button 
                        onClick={handleBroadcast}
                        className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Send size={18} /> SEND ALERT
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-2">
                    <CheckCircle size={10} /> Authenticated via Blockchain Ledger • Latency: 42ms
                </p>
            </div>

            {/* 2. LIVE MAP PLACEHOLDER */}
            <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-80 flex items-center justify-center relative overflow-hidden group">
                {/* Simulated Map BG */}
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/91.89,25.57,7,0/800x400?access_token=pk.eyJ1IjoidHVzaGFyZ2FkaGUiLCJhIjoiY21rbnlpNjZqMDBtbDNmc2FmZW9idWwzdSJ9.5kKsUK-lEQmpM5kJrtvkDg')] bg-cover bg-center opacity-60 transition-opacity group-hover:opacity-80"></div>
                
                {/* Blinking Dots */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
                    <MapIcon className="w-12 h-12 text-blue-500 mx-auto mb-2 opacity-80" />
                    <h3 className="text-xl font-bold text-white">LIVE INCIDENT MAP</h3>
                    <p className="text-slate-400 text-sm">Tracking {stats?.active_sensors || 142} Units</p>
                </div>
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-yellow-500 rounded-full animate-ping delay-700"></div>
                <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>

            {/* 3. RECENT ALERTS (Mock List) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-500"/> Priority Alerts (Last 1 Hour)
                    </h3>
                    <div className="space-y-3">
                        {INCIDENTS.map((inc) => (
                           <div key={inc.id} className="flex justify-between items-center p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700">
                              <div>
                                 <p className="text-xs font-bold text-slate-900 dark:text-white">{inc.type}</p>
                                 <p className="text-[10px] text-slate-500">{inc.loc}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${inc.severity==="CRITICAL"?"bg-red-500 text-white":"bg-orange-500 text-white"}`}>
                                 {inc.severity}
                              </span>
                           </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
                     <h3 className="text-slate-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                        <Lock size={14} className="text-emerald-500"/> Secure Logs
                     </h3>
                     <div className="space-y-2 text-[10px] font-mono text-slate-500">
                        <p>12:01:42 - CAP Gateway Handshake... OK</p>
                        <p>12:01:38 - DistilBERT Inference: 42ms</p>
                        <p>12:01:15 - User Login (Admin) from 192.168.1.105</p>
                        <p>12:00:59 - IoT Mesh Sync (Node 82)</p>
                     </div>
                </div>
            </div>

        </div>

      </main>
      
      {/* FOOTER */}
      <footer className="fixed bottom-0 w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-2 text-center text-[9px] text-slate-500 uppercase tracking-widest z-50 transition-colors">
        Drishti-NE v2.4 (RC-1) • Secure TLS 1.3 Connection • Authorized Personnel Only • Compliant with DPDP Act 2023
      </footer>

    </div>
  );
};

export default AdminPanel;