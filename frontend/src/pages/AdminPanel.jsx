import React, { useState, useEffect } from "react";
import { 
  Shield, Lock, Fingerprint, Activity, 
  Map as MapIcon, Users, AlertTriangle, Radio, 
  Plane, Send, FileText, Zap // ✅ Added Zap here
} from "lucide-react";
import { useI18n } from "../i18n";

const AdminPanel = () => {
  const { t } = useI18n();
  const [isAuth, setIsAuth] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeIncidents, setActiveIncidents] = useState([
    { id: "SOS-104", type: "MEDICAL", loc: "Sector 4", time: "10:42", status: "PENDING" },
    { id: "SOS-105", type: "FLOOD", loc: "River Bank", time: "10:45", status: "DISPATCHED" },
  ]);

  // --- 1. SIMULATE BIOMETRIC LOGIN ---
  const handleLogin = () => {
    setScanning(true);
    setTimeout(() => {
        setScanning(false);
        setIsAuth(true);
    }, 2000);
  };

  // --- 2. LIVE DATA SIMULATION ---
  useEffect(() => {
    if (!isAuth) return;
    const interval = setInterval(() => {
        // Randomly update status or add new incident
        if (Math.random() > 0.7) {
            const newId = `SOS-${Math.floor(Math.random() * 900) + 100}`;
            const types = ["MEDICAL", "FIRE", "TRAPPED", "SUPPLIES"];
            const newIncident = {
                id: newId,
                type: types[Math.floor(Math.random() * types.length)],
                loc: `Sector ${Math.floor(Math.random() * 9) + 1}`,
                time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                status: "NEW"
            };
            setActiveIncidents(prev => [newIncident, ...prev].slice(0, 5));
        }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuth]);

  // --- RENDER LOGIN SCREEN ---
  if (!isAuth) {
    return (
        <div className="h-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
            
            <div className="z-10 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${scanning ? "bg-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.5)]" : "bg-slate-800 border border-slate-700"}`}>
                    <Fingerprint 
                        size={40} 
                        className={`text-blue-500 ${scanning ? "animate-pulse" : ""}`} 
                        onClick={handleLogin}
                    />
                </div>
                
                <h1 className="text-2xl font-black text-white tracking-widest mb-2">DRISHTI COMMAND</h1>
                <p className="text-xs text-slate-400 font-mono mb-8 uppercase tracking-widest">
                    Restricted Access // Level 5
                </p>

                <button 
                    onClick={handleLogin}
                    disabled={scanning}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {scanning ? (
                        <>VERIFYING BIOMETRICS...</>
                    ) : (
                        <><Lock size={16} /> AUTHENTICATE</>
                    )}
                </button>
            </div>
            
            <p className="absolute bottom-6 text-[10px] text-slate-600 font-mono">
                UNAUTHORIZED ACCESS IS A PUNISHABLE OFFENSE.
            </p>
        </div>
    );
  }

  // --- RENDER DASHBOARD (LOGGED IN) ---
  return (
    <div className="h-full min-h-screen bg-slate-950 text-slate-200 p-4 font-sans">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <Shield className="text-blue-400" size={20} />
            </div>
            <div>
                <h1 className="text-lg font-black text-white tracking-tight">COMMAND CENTER</h1>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">System Live</p>
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xs font-mono text-slate-400">{new Date().toLocaleTimeString()}</p>
            <p className="text-[10px] text-slate-600 uppercase font-bold">Admin: CDR. SINGH</p>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-start mb-2">
                <AlertTriangle size={18} className="text-red-500" />
                <span className="text-2xl font-black text-white">{activeIncidents.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Active Alerts</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-start mb-2">
                <Users size={18} className="text-blue-500" />
                <span className="text-2xl font-black text-white">14</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Units Deployed</p>
        </div>
      </div>

      {/* LIVE INCIDENT FEED */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Radio size={12} /> Incoming Distress Signals
            </h2>
        </div>
        <div className="space-y-2">
            {activeIncidents.map((inc) => (
                <div key={inc.id} className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${inc.status === 'NEW' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                            <Activity size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{inc.type} EMERGENCY</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {inc.id} • LOC: {inc.loc}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded border ${
                            inc.status === 'NEW' ? 'bg-red-900/30 border-red-800 text-red-400' : 
                            inc.status === 'PENDING' ? 'bg-amber-900/30 border-amber-800 text-amber-400' :
                            'bg-emerald-900/30 border-emerald-800 text-emerald-400'
                        }`}>
                            {inc.status}
                        </span>
                        <p className="text-[9px] text-slate-600 mt-1">{inc.time}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap size={12} /> Tactical Response
        </h2>
        <div className="grid grid-cols-2 gap-3">
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <Plane size={20} />
                <span className="text-[10px] font-bold uppercase">Deploy UAV</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all border border-slate-700">
                <Send size={20} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase">Broadcast Alert</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all border border-slate-700">
                <MapIcon size={20} className="text-amber-400" />
                <span className="text-[10px] font-bold uppercase">Sector Map</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all border border-slate-700">
                <FileText size={20} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase">Daily Report</span>
            </button>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;